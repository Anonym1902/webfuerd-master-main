export default function NotFoundPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      textAlign: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#fffffe',
    }}>
      <h1 style={{ fontSize: '72px', margin: '0', color: '#333', fontWeight: '300' }}>404</h1>
      <h2 style={{ fontSize: '24px', margin: '20px 0', color: '#666', fontWeight: '400' }}>
        Seite nicht gefunden
      </h2>
      <p style={{ fontSize: '16px', color: '#999', maxWidth: '500px', lineHeight: '1.6' }}>
        Die angeforderte Seite konnte nicht gefunden werden.
      </p>
    </div>
  );
}

