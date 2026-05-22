import { Settings as SettingsIcon, User, Shield, BellRing, MonitorSmartphone } from 'lucide-react';

export default function Settings() {
  return (
    <div className="fade-in">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SettingsIcon color="var(--text-secondary)" size={24} />
            Sozlamalar
          </h1>
          <p className="page-sub" style={{ marginTop: 6 }}>Profil, xavfsizlik va tizim parametrlarini boshqarish</p>
        </div>
      </div>

      <div className="grid grid-12">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <button style={{ 
            display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'var(--surface-2)', 
            border: '1px solid var(--blue-500)', color: 'var(--blue-400)', borderRadius: 'var(--radius-xl)', 
            fontWeight: 600, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s'
          }}>
            <User size={18} /> Profil ma'lumotlari
          </button>
          {[
            { icon: Shield, label: 'Xavfsizlik va Parol' },
            { icon: BellRing, label: 'Xabarnomalar' },
            { icon: MonitorSmartphone, label: 'Qurilmalar va Sessiyalar' }
          ].map((item, idx) => (
            <button key={idx} style={{ 
              display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'var(--bg-2)', 
              border: '1px solid var(--border-1)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-xl)', 
              fontWeight: 500, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s'
            }}>
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </div>

        <div className="card">
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>Profil ma'lumotlari</h3>
          
          <div style={{ display: 'flex', gap: 24, marginBottom: 32, alignItems: 'center', paddingBottom: 32, borderBottom: '1px solid var(--border-1)' }}>
            <div style={{ 
              width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(to top right, var(--blue-500), var(--violet-500))', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff', 
              boxShadow: '0 8px 32px rgba(59,130,246,0.3)'
            }}>
              AU
            </div>
            <div>
              <button className="btn btn-secondary" style={{ marginBottom: 8 }}>Suratni yangilash</button>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Tavsiya etilgan o'lcham: 256x256, Format: JPG, PNG</p>
            </div>
          </div>

          <form style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="grid grid-2">
              <div className="input-group">
                <label className="input-label">Ism</label>
                <input type="text" className="input" defaultValue="Admin" />
              </div>
              <div className="input-group">
                <label className="input-label">Familiya</label>
                <input type="text" className="input" defaultValue="User" />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Korporativ Email</label>
              <input type="email" className="input" style={{ background: 'var(--surface-1)', color: 'var(--text-muted)', cursor: 'not-allowed' }} defaultValue="admin@agmk.uz" disabled />
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Email manzilni faqat kadrlar bo'limi orqali o'zgartirish mumkin.</p>
            </div>

            <div className="input-group">
              <label className="input-label">Lavozim</label>
              <input type="text" className="input" defaultValue="Tizim administratori" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
              <button type="button" className="btn btn-ghost">Bekor qilish</button>
              <button type="submit" className="btn btn-primary">Saqlash</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
