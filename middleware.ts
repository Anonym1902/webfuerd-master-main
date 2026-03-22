import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate Limiting - einfache Implementierung
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 Minute
  maxRequests: 30, // Max 30 Requests pro Minute
};

function getRateLimitKey(request: NextRequest): string {
  // Verwende IP-Adresse oder User-Agent als Key
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `${ip}-${userAgent}`;
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs,
    });
    return true;
  }

  if (record.count >= RATE_LIMIT.maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

// Cleanup alte Einträge alle 5 Minuten
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Bot-Erkennung
function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  
  // Bekannte Bot-Patterns
  const botPatterns = [
    'bot', 'crawler', 'spider', 'scraper', 'scrape',
    'headless', 'selenium', 'puppeteer', 'phantom', 'playwright',
    'webdriver', 'chromium', 'chrome-lighthouse',
    'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
    'yandexbot', 'sogou', 'exabot', 'facebot', 'ia_archiver',
    'curl', 'wget', 'python', 'java', 'go-http', 'php',
    'http', 'request', 'libwww', 'perl', 'ruby', 'scrapy',
    'crawler', 'crawling', 'spider', 'spidering',
    'monitor', 'check', 'validator', 'test', 'analyzer',
    'indexer', 'fetcher', 'downloader', 'extractor',
    'archive', 'archiver', 'backup', 'mirror',
  ];

  return botPatterns.some((pattern) => ua.includes(pattern));
}

// Mobile-Erkennung
function isMobile(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  
  const mobilePatterns = [
    'mobile', 'android', 'iphone', 'ipad', 'ipod',
    'blackberry', 'windows phone', 'opera mini',
    'iemobile', 'kindle', 'silk', 'tablet',
  ];

  return mobilePatterns.some((pattern) => ua.includes(pattern));
}

// Desktop-Erkennung
function isDesktop(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  
  // Wenn es kein Mobile ist und bekannte Desktop-Browser enthält
  if (isMobile(ua)) {
    return false;
  }

  const desktopPatterns = [
    'windows', 'macintosh', 'linux', 'x11',
    'chrome', 'firefox', 'safari', 'edge', 'opera',
    'msie', 'trident',
  ];

  return desktopPatterns.some((pattern) => ua.includes(pattern));
}

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';
  const pathname = request.nextUrl.pathname;

  // Beim lokalen Entwickeln (`npm run dev`) keine Mobile-/Desktop-Sperre,
  // sonst sieht man am PC nur die 404-Seite.
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  // Statische Assets und Next.js interne Routes erlauben
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2|ttf|eot)$/)
  ) {
    // Für API-Routes: Rate Limiting
    if (pathname.startsWith('/api/')) {
      const key = getRateLimitKey(request);
      
      if (!checkRateLimit(key)) {
        return NextResponse.json(
          { error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' },
          { status: 429 }
        );
      }

      // Bot-Erkennung für API
      if (isBot(userAgent)) {
        return NextResponse.json(
          { error: 'Zugriff verweigert' },
          { status: 403 }
        );
      }
    }

    return NextResponse.next();
  }

  // Bot-Erkennung für alle anderen Routes
  if (isBot(userAgent)) {
    // Weiterleitung zur 404-Seite
    const url = request.nextUrl.clone();
    url.pathname = '/404';
    return NextResponse.rewrite(url);
  }

  // Desktop-User blockieren (nur Mobile erlauben)
  if (isDesktop(userAgent)) {
    // Weiterleitung zur 404-Seite
    const url = request.nextUrl.clone();
    url.pathname = '/404';
    return NextResponse.rewrite(url);
  }

  // Nur Mobile-User erlauben
  if (!isMobile(userAgent)) {
    // Wenn weder Mobile noch Desktop erkannt wird, auch blockieren
    const url = request.nextUrl.clone();
    url.pathname = '/404';
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

