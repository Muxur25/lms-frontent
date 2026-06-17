import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  KeyRound,
  MapPin,
  Monitor,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
  Tablet,
  Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/api/axios';
import toast from 'react-hot-toast';
import { customConfirm } from '@/shared/lib/toast-utils';
import { useSocket } from '@/hooks/useSocket';

const unwrapArray = (response: any) => {
  const payload = response?.data?.data ?? response?.data ?? response;
  return Array.isArray(payload) ? payload : [];
};

const formatDate = (value?: string, lang: string = 'uz') => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const y = date.getFullYear();

  if (lang === 'ru') {
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return `${date.getDate()} ${months[date.getMonth()]} ${y} г., ${h}:${min}`;
  } else {
    const months = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
    return `${date.getDate()}-${months[date.getMonth()]} ${y}-yil, soat ${h}:${min}`;
  }
};

export default function SecurityDashboardPage() {
  const { t, i18n } = useTranslation();
  const tr = (key: string, fallback: string, options?: Record<string, unknown>) => t(key, { defaultValue: fallback, ...options });
  const [sessions, setSessions] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const socket = useSocket();

  useEffect(() => {
    fetchSecurityData();

    if (socket) {
      const handleSecurityUpdate = () => {
        fetchSecurityData();
      };
      socket.on('security_update', handleSecurityUpdate);
      return () => {
        socket.off('security_update', handleSecurityUpdate);
      };
    }
  }, [socket]);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      setError('');
      const [sessRes, histRes] = await Promise.all([
        apiClient.get('/security/sessions'),
        apiClient.get('/security/history'),
      ]);
      setSessions(unwrapArray(sessRes));
      setHistory(unwrapArray(histRes));
    } catch {
      const message = tr('securityCenter.loadError', "Xavfsizlik ma'lumotlarini yuklab bo'lmadi.");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSession = async (id: string) => {
    customConfirm(tr('securityCenter.confirmRemove', 'Ushbu qurilma sessiyasini tugatmoqchimisiz?'), async () => {
      try {
        await apiClient.delete(`/security/sessions/${id}`);
        setSessions((items) => items.filter((session) => session.id !== id));
        toast.success(tr('securityCenter.removed', 'Sessiya tugatildi'));
      } catch {
        toast.error(tr('securityCenter.removeError', "Sessiyani tugatib bo'lmadi"));
      }
    });
  };

  const handleLogoutAll = async () => {
    customConfirm(tr('securityCenter.confirmLogoutAll', 'Barcha qurilmalardagi sessiyalarni tugatmoqchimisiz?'), async () => {
      try {
        await apiClient.delete('/security/sessions');
        toast.success(tr('securityCenter.logoutAllSuccess', 'Barcha sessiyalar tugatildi'));
        window.location.reload();
      } catch {
        toast.error(tr('securityCenter.logoutAllError', "Sessiyalarni tugatib bo'lmadi"));
      }
    });
  };

  const deviceCounts = useMemo(() => {
    const mobile = sessions.filter((s) => s.device?.deviceType?.toLowerCase() === 'mobile').length;
    const tablet = sessions.filter((s) => s.device?.deviceType?.toLowerCase() === 'tablet').length;
    const desktop = sessions.filter((s) => !s.device?.deviceType || !['mobile', 'tablet'].includes(s.device.deviceType.toLowerCase())).length;
    return { mobile, tablet, desktop, unknown: 0 };
  }, [sessions]);

  const getDeviceIcon = (type: string) => {
    if (type?.toLowerCase() === 'mobile') return <Smartphone size={21} />;
    if (type?.toLowerCase() === 'tablet') return <Tablet size={21} />;
    return <Monitor size={21} />;
  };

  const getOsName = (os?: string, type?: string) => {
    if (os && os.toLowerCase() !== 'unknown os') return os;
    const t = type?.toLowerCase();
    if (t === 'mobile') return tr('securityCenter.mobileDevice', 'Mobil qurilma');
    if (t === 'tablet') return tr('securityCenter.tabletDevice', 'Planshet');
    return tr('securityCenter.desktopDevice', 'Kompyuter');
  };

  const getBrowserName = (browser?: string) => {
    if (browser && browser.toLowerCase() !== 'unknown browser') return browser;
    return tr('securityCenter.webBrowser', 'Web Brauzer');
  };

  return (
    <main className="user-security-shell">
      <style>{userSecurityStyles}</style>

      <section className="user-security-hero">
        <div className="hero-copy">
          <div className="hero-kicker safe">
            <ShieldCheck size={15} />
            {tr('securityCenter.noAlerts', "So'nggi davrda shubhali faollik aniqlanmadi.")}
          </div>
          <h1>{tr('securityCenter.title', 'Xavfsizlik markazi')}</h1>
          <p>{tr('securityCenter.subtitle', 'Faol qurilmalar, sessiyalar va kirish tarixini boshqaring.')}</p>
        </div>
        <button onClick={fetchSecurityData} className="security-refresh-action">
          <RefreshCcw size={16} />
          {t('common.refresh', 'Yangilash')}
        </button>
      </section>

      {error && (
        <div className="user-security-alert">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      <section className="user-metric-grid" style={{ gridTemplateColumns: deviceCounts.unknown > 0 ? 'repeat(5, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))' }}>
        <MetricCard icon={Monitor} label={tr('securityCenter.activeSessionsMetric', 'Faol sessiyalar')} value={loading ? '-' : sessions.length} tone="blue" />
        <MetricCard icon={Monitor} label={tr('securityCenter.desktopMetric', 'Desktop')} value={loading ? '-' : deviceCounts.desktop} tone="cyan" />
        <MetricCard icon={Smartphone} label={tr('securityCenter.mobileMetric', 'Mobile')} value={loading ? '-' : deviceCounts.mobile + deviceCounts.tablet} tone="violet" />
        {deviceCounts.unknown > 0 && (
          <MetricCard icon={AlertTriangle} label={tr('securityCenter.unknownMetric', "Noma'lum")} value={loading ? '-' : deviceCounts.unknown} tone="amber" />
        )}
        <MetricCard icon={Clock} label={tr('securityCenter.historyMetric', 'Kirishlar tarixi')} value={loading ? '-' : history.length} tone="amber" />
      </section>

      <section className="security-dashboard-grid">
        <div className="user-security-panel devices-panel">
          <div className="panel-toolbar">
            <div>
              <h2>{tr('securityCenter.activeDevices', 'Faol qurilmalar ({{count}})', { count: sessions.length })}</h2>
              <p>{tr('securityCenter.activeDevicesSub', 'Qurilmalar, IP manzillar va oxirgi faollik')}</p>
            </div>
            {sessions.length > 1 && (
              <button onClick={handleLogoutAll} className="danger-action subtle">
                <Trash2 size={15} />
                {tr('securityCenter.logoutAll', 'Barcha qurilmalardan chiqish')}
              </button>
            )}
          </div>

          <div className="device-list">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => <div key={index} className="security-skeleton tall" />)
            ) : sessions.length === 0 ? (
              <EmptyState icon={<Monitor size={26} />} title={tr('securityCenter.emptySessions', 'Faol sessiyalar topilmadi.')} />
            ) : sessions.map((session, index) => (
              <article key={session.id} className="device-card">
                <div className="device-icon">{getDeviceIcon(session.device?.deviceType)}</div>
                <div className="device-body">
                  <div className="device-title-row">
                    <h3>{getOsName(session.device?.os, session.device?.deviceType)}</h3>
                    {index === 0 && <span className="safe-pill">{tr('securityCenter.thisDevice', 'HOZIRGI QURILMA')}</span>}
                  </div>
                  <p>{getBrowserName(session.device?.browser)}</p>
                  <div className="device-meta">
                    <span><MapPin size={13} />{session.device?.ipAddress || '-'}</span>
                    <span><Clock size={13} />{formatDate(session.lastActivity, i18n.language)}</span>
                  </div>
                </div>
                {index !== 0 && (
                  <button onClick={() => handleRemoveSession(session.id)} className="danger-icon-action" aria-label={tr('securityCenter.remove', "O'chirish")}>
                    <Trash2 size={17} />
                  </button>
                )}
              </article>
            ))}
          </div>
        </div>

        <aside className="security-side-stack">
          <article className="side-panel">
            <div className="side-icon blue"><KeyRound size={21} /></div>
            <h2>{tr('securityCenter.accountSecurity', 'Hisob xavfsizligi')}</h2>
            <p>{tr('securityCenter.accountSecurityText', "Parolni yangilash va shaxsiy ma'lumotlar sozlamalar bo'limida boshqariladi.")}</p>
          </article>
          <article className="side-panel warning">
            <div className="side-icon amber"><AlertTriangle size={21} /></div>
            <h2>{tr('securityCenter.alerts', 'Xavfsizlik ogohlantirishlari')}</h2>
            <p>{tr('securityCenter.noAlerts', "So'nggi davrda shubhali faollik aniqlanmadi.")}</p>
          </article>
        </aside>
      </section>

      <section className="user-security-panel">
        <div className="panel-toolbar">
          <div>
            <h2>{tr('securityCenter.loginHistory', 'Kirish tarixi')}</h2>
            <p>{tr('securityCenter.loginHistorySub', "Oxirgi muvaffaqiyatli kirishlar ro'yxati")}</p>
          </div>
        </div>

        {loading ? (
          <div className="security-skeleton-list">
            {Array.from({ length: 4 }).map((_, index) => <div key={index} className="security-skeleton" />)}
          </div>
        ) : history.length === 0 ? (
          <EmptyState icon={<Clock size={26} />} title={tr('securityCenter.emptyHistory', 'Kirish tarixi mavjud emas.')} />
        ) : (
          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>{tr('securityCenter.browserOs', 'Brauzer va OS')}</th>
                  <th>{t('settings.ipAddress', 'IP Manzil')}</th>
                  <th>{t('common.time', 'Vaqt')}</th>
                  <th>{t('common.status', 'Holat')}</th>
                </tr>
              </thead>
              <tbody>
                {history.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="history-device">
                        <span>{getDeviceIcon(item.deviceType)}</span>
                        <strong>{getOsName(item.os, item.deviceType)} / {getBrowserName(item.browser)}</strong>
                      </div>
                    </td>
                    <td>{item.ipAddress || '-'}</td>
                    <td>{formatDate(item.loginAt, i18n.language)}</td>
                    <td>
                      {item.status === 'FAILED' ? (
                        <span className="danger-badge">
                          <AlertTriangle size={13} />
                          {tr('securityCenter.failed', 'Xato parol')}
                        </span>
                      ) : (
                        <span className="success-badge">
                          <CheckCircle2 size={13} />
                          {tr('securityCenter.success', 'Muvaffaqiyatli')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {Math.ceil(history.length / itemsPerPage) > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, padding: '16px', borderTop: '1px solid var(--border-1)', alignItems: 'center' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                >
                  {t('common.prev', 'Oldingi')}
                </button>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {currentPage} / {Math.ceil(history.length / itemsPerPage)}
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={currentPage === Math.ceil(history.length / itemsPerPage)}
                  onClick={() => setCurrentPage(p => p + 1)}
                  style={{ opacity: currentPage === Math.ceil(history.length / itemsPerPage) ? 0.5 : 1 }}
                >
                  {t('common.next', 'Keyingi')}
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function MetricCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string | number; tone: string }) {
  return (
    <article className={`user-metric-card tone-${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="metric-icon"><Icon size={22} /></div>
    </article>
  );
}

function EmptyState({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="user-empty">
      <div>{icon}</div>
      <strong>{title}</strong>
    </div>
  );
}

const userSecurityStyles = `
.user-security-shell {
  width: min(1280px, 100%);
  margin: 0 auto;
  padding: 24px;
  display: grid;
  gap: 18px;
}
.user-security-hero {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border-1);
  background: linear-gradient(180deg, color-mix(in srgb, var(--surface-1) 90%, #ffffff 10%), var(--surface-1));
  border-radius: 18px;
  padding: 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  box-shadow: 0 18px 60px rgba(0,0,0,.14);
}
.user-security-hero::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 4px;
  background: linear-gradient(90deg, #22c55e, #3b82f6, #06b6d4);
}
.hero-copy { position: relative; min-width: 0; }
.hero-kicker {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  padding: 7px 11px;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: .08em;
}
.hero-kicker.safe {
  border: 1px solid rgba(34,197,94,.24);
  background: rgba(34,197,94,.1);
  color: #34d399;
}
.user-security-hero h1 {
  margin: 14px 0 0;
  color: var(--text-primary);
  font-size: clamp(26px, 3vw, 38px);
  line-height: 1.05;
  font-weight: 950;
  letter-spacing: 0;
}
.user-security-hero p {
  margin: 10px 0 0;
  max-width: 720px;
  color: var(--text-tertiary);
  font-size: 15px;
  line-height: 1.65;
}
.security-refresh-action {
  min-height: 44px;
  border: 1px solid var(--border-2);
  border-radius: 12px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  background: var(--surface-2);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
  white-space: nowrap;
}
.security-refresh-action:hover {
  background: var(--surface-3);
  border-color: var(--border-3);
}
.user-security-alert {
  border: 1px solid rgba(239,68,68,.24);
  background: rgba(239,68,68,.1);
  color: #fca5a5;
  border-radius: 14px;
  padding: 13px 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 700;
}
.user-metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}
.user-metric-card {
  border: 1px solid var(--border-1);
  background: var(--surface-1);
  border-radius: 16px;
  padding: 18px;
  min-height: 112px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.user-metric-card span {
  color: var(--text-tertiary);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.user-metric-card strong {
  display: block;
  margin-top: 8px;
  color: var(--text-primary);
  font-size: 34px;
  line-height: 1;
  font-weight: 950;
}
.metric-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  border: 1px solid currentColor;
  background: color-mix(in srgb, currentColor 12%, transparent);
}
.tone-blue .metric-icon { color: #60a5fa; }
.tone-cyan .metric-icon { color: #22d3ee; }
.tone-violet .metric-icon { color: #a78bfa; }
.tone-amber .metric-icon { color: #f59e0b; }
.security-dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 18px;
}
.user-security-panel {
  border: 1px solid var(--border-1);
  background: var(--surface-1);
  border-radius: 18px;
  overflow: hidden;
}
.panel-toolbar {
  border-bottom: 1px solid var(--border-1);
  background: var(--surface-2);
  padding: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}
.panel-toolbar h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: 17px;
  font-weight: 950;
}
.panel-toolbar p {
  margin: 5px 0 0;
  color: var(--text-tertiary);
  font-size: 12px;
}
.device-list {
  display: grid;
  gap: 12px;
  padding: 16px;
}
.device-card {
  border: 1px solid var(--border-1);
  background: var(--surface-2);
  border-radius: 16px;
  padding: 16px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
}
.device-card:hover { border-color: var(--border-2); }
.device-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  border: 1px solid rgba(34,197,94,.24);
  background: rgba(34,197,94,.1);
  color: #34d399;
  display: grid;
  place-items: center;
}
.device-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.device-title-row h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 950;
}
.device-body p {
  margin: 4px 0 0;
  color: var(--text-tertiary);
  font-size: 12px;
}
.device-meta {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: var(--text-tertiary);
  font-size: 12px;
}
.device-meta span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.safe-pill,
.success-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 26px;
  border-radius: 999px;
  padding: 0 9px;
  border: 1px solid rgba(34,197,94,.24);
  background: rgba(34,197,94,.1);
  color: #34d399;
  font-size: 11px;
  font-weight: 900;
}
.danger-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 26px;
  border-radius: 999px;
  padding: 0 9px;
  border: 1px solid rgba(239,68,68,.24);
  background: rgba(239,68,68,.1);
  color: #f87171;
  font-size: 11px;
  font-weight: 900;
}
.danger-action {
  min-height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(239,68,68,.22);
  background: rgba(239,68,68,.08);
  color: #f87171;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
}
.danger-action.subtle {
  border-color: var(--border-2);
  background: var(--surface-3);
  color: var(--text-secondary);
}
.danger-icon-action {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid rgba(239,68,68,.22);
  background: rgba(239,68,68,.08);
  color: #f87171;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.security-side-stack {
  display: grid;
  gap: 18px;
  align-content: start;
}
.side-panel {
  border: 1px solid var(--border-1);
  background: var(--surface-1);
  border-radius: 18px;
  padding: 20px;
}
.side-panel.warning {
  border-color: rgba(245,158,11,.22);
  background: rgba(245,158,11,.08);
}
.side-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  margin-bottom: 14px;
  border: 1px solid currentColor;
  background: color-mix(in srgb, currentColor 12%, transparent);
}
.side-icon.blue { color: #60a5fa; }
.side-icon.amber { color: #f59e0b; }
.side-panel h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 950;
}
.side-panel p {
  margin: 10px 0 0;
  color: var(--text-tertiary);
  font-size: 13px;
  line-height: 1.65;
}
.history-table-wrap { overflow-x: auto; }
.history-table {
  width: 100%;
  min-width: 760px;
  border-collapse: separate;
  border-spacing: 0;
}
.history-table th {
  padding: 14px 18px;
  color: var(--text-tertiary);
  background: var(--surface-1);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .08em;
  font-weight: 900;
}
.history-table td {
  padding: 16px 18px;
  border-top: 1px solid var(--border-1);
  color: var(--text-secondary);
  font-size: 13px;
}
.history-table tr:hover td { background: var(--surface-2); }
.history-device {
  display: flex;
  align-items: center;
  gap: 10px;
}
.history-device span {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid rgba(96,165,250,.24);
  background: rgba(96,165,250,.1);
  color: #60a5fa;
  display: grid;
  place-items: center;
}
.history-device strong {
  color: var(--text-primary);
  font-size: 13px;
}
.security-skeleton-list { display: grid; gap: 12px; padding: 16px; }
.security-skeleton {
  height: 68px;
  border-radius: 14px;
  background: linear-gradient(90deg, var(--surface-2), var(--surface-3), var(--surface-2));
  background-size: 220% 100%;
  animation: userSecurityPulse 1.2s linear infinite;
}
.security-skeleton.tall { height: 88px; }
.user-empty {
  min-height: 220px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 12px;
  color: var(--text-tertiary);
}
.user-empty strong { color: var(--text-secondary); font-size: 14px; }
@keyframes userSecurityPulse { to { background-position: -220% 0; } }
@media (max-width: 1080px) {
  .user-metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .security-dashboard-grid { grid-template-columns: 1fr; }
}
@media (max-width: 760px) {
  .user-security-shell { padding: 16px; }
  .user-security-hero { align-items: stretch; flex-direction: column; padding: 22px; }
  .user-metric-grid { grid-template-columns: 1fr; }
  .panel-toolbar { align-items: stretch; flex-direction: column; }
  .device-card { grid-template-columns: auto minmax(0, 1fr); }
  .danger-icon-action { grid-column: 1 / -1; width: 100%; }
}
`;
