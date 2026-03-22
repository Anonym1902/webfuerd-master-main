'use client';

export default function Header() {
  return (
    <header>
      <div className="header-container">
        <div 
          className="logo-container" 
          onClick={() => window.open('https://www.hamburg.de/politik-und-verwaltung/behoerden/finanzbehoerde/einrichtungen/finanzaemter/finanzamt-hamburg-altona-807700', '_blank')}
        >
          <img src="/hans.png" alt="Hamburg Logo" height={60} style={{ cursor: 'pointer' }} />
        </div>
        <a 
          href="https://www.hamburg.de" 
          target="_blank" 
          rel="noopener noreferrer"
          className="contact-link"
        >
          Kontakt & Hilfe
        </a>
      </div>
    </header>
  );
}

