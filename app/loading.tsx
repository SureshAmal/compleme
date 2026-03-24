export default function Loading() {
  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="spinner"></div>
      <p style={{ marginTop: '1rem', color: 'var(--fg-muted)', fontWeight: 500 }}>Loading workspace...</p>
    </div>
  );
}
