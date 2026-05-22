export const Placeholder = ({ title, emoji = '🚧' }: { title: string; emoji?: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, flexDirection: 'column', gap: 12 }}>
    <div style={{ width: 72, height: 72, borderRadius: 20, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>{emoji}</div>
    <div style={{ fontSize: 20, fontWeight: 800 }}>{title}</div>
    <div style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>Tez orada qo'shiladi</div>
    <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>Xabar berish</button>
  </div>
);
