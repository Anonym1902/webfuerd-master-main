export default function NotFound() {
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
    }}>
      <h1 style={{ fontSize: '72px', margin: '0', color: '#333' }}>404</h1>
      <h2 style={{ fontSize: '24px', margin: '20px 0', color: '#666' }}>
        Seite nicht gefunden
      </h2>
      <p style={{ fontSize: '16px', color: '#999', maxWidth: '500px' }}>
        Die angeforderte Seite konnte nicht gefunden werden.
      </p>
    </div>
  );
}

