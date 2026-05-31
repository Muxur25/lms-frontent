import { Bell, CheckCircle2, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '@/store/notification.store';

export default function Notifications() {
  const { t } = useTranslation();
  const notifications = useNotificationStore((state) => state.notifications);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const markAsRead = useNotificationStore((state) => state.markAsRead);

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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell color="var(--amber-400)" size={24} />
            Bildirishnomalar
          </h1>
          <p className="page-sub" style={{ marginTop: 6 }}>{t('notifications.subtitle')}</p>
        </div>
        {notifications.some(n => !n.read) && (
          <button className="btn btn-secondary" onClick={markAllAsRead}>
            {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {notifications.map((n, idx) => (
          <div key={n.id} 
            onClick={() => markAsRead(n.id)}
            style={{ 
              padding: 20, borderBottom: idx !== notifications.length - 1 ? '1px solid var(--border-1)' : 'none', 
              display: 'flex', gap: 16, transition: 'all 0.2s', cursor: 'pointer',
              background: n.read ? 'transparent' : 'rgba(59,130,246,0.03)',
              opacity: n.read ? 0.7 : 1
            }}
          >
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
        {notifications.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>
            {t('notifications.empty')}
          </div>
        )}
      </div>
    </div>
  );
}
