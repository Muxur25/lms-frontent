import { Bell, CheckCircle2, AlertTriangle, Info, ShieldAlert } from 'lucide-react';

export default function Notifications() {
  const notifs = [
    { id: 1, type: 'urgent', title: 'Diqqat: Parolni yangilash talab etiladi', text: 'Xavfsizlik siyosatiga ko\'ra parolingizni 3 kun ichida yangilashingiz shart.', time: '10 daqiqa oldin', read: false },
    { id: 2, type: 'success', title: 'Imtihon muvaffaqiyatli topshirildi', text: 'Siz "Mehnat muhofazasi" imtihonidan 95 ball to\'pladingiz.', time: '2 soat oldin', read: false },
    { id: 3, type: 'info', title: 'Yangi vebinar: Yangi uskunalar bilan ishlash', text: 'Rahimov A. tomonidan ertaga soat 14:00 da ochiq vebinar o\'tkaziladi.', time: 'Kecha', read: true },
    { id: 4, type: 'warning', title: 'O\'quv kursi muddati tugamoqda', text: '"Yong\'in xavfsizligi" kursini yakunlash uchun 2 kuningiz qoldi.', time: '20 May', read: true },
  ];

  const getIcon = (type: string) => {
    switch(type) {
      case 'urgent': return <ShieldAlert color="#ef4444" size={20} />;
      case 'success': return <CheckCircle2 color="#22c55e" size={20} />;
      case 'warning': return <AlertTriangle color="#f59e0b" size={20} />;
      default: return <Info color="#3b82f6" size={20} />;
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell color="var(--amber-400)" size={24} />
            Bildirishnomalar
          </h1>
          <p className="page-sub" style={{ marginTop: 6 }}>Tizimdagi barcha yangiliklar va xabarnomalar</p>
        </div>
        <button className="btn btn-secondary">Barchasini o'qildi deb belgilash</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {notifs.map((n, idx) => (
          <div key={n.id} style={{ 
            padding: 20, borderBottom: idx !== notifs.length - 1 ? '1px solid var(--border-1)' : 'none', 
            display: 'flex', gap: 16, transition: 'all 0.2s', cursor: 'pointer',
            background: n.read ? 'transparent' : 'rgba(59,130,246,0.03)',
            opacity: n.read ? 0.7 : 1
          }}>
            <div style={{ paddingTop: 2 }}>{getIcon(n.type)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <h4 style={{ fontWeight: 600, fontSize: 15, color: n.read ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                  {n.title}
                </h4>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{n.time}</span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{n.text}</p>
            </div>
            {!n.read && (
              <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--blue-500)', boxShadow: '0 0 10px rgba(59,130,246,0.5)' }}></span>
              </div>
            )}
          </div>
        ))}
        {notifs.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>Hech qanday bildirishnoma yo'q</div>
        )}
      </div>
    </div>
  );
}
