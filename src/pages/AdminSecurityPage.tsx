import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Filter,
  MonitorOff,
  RefreshCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { apiClient } from '@/api/axios';
import toast from 'react-hot-toast';
import { customConfirm } from '@/shared/lib/toast-utils';

const unwrapArray = (response: any) => {
  const payload = response?.data?.data ?? response?.data ?? response;
  return Array.isArray(payload) ? payload : [];
};

export default function AdminSecurityPage() {
  const { t } = useTranslation();
  const tr = (key: string, fallback: string) => t(key, { defaultValue: fallback });
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get('/users');
      setUsers(unwrapArray(res));
    } catch {
      const message = tr('adminSecurity.loadError', "Foydalanuvchilarni yuklab bo'lmadi.");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForceLogout = async (userId: string) => {
    customConfirm(tr('adminSecurity.confirmForceLogout', 'Ushbu foydalanuvchini barcha qurilmalardan chiqarib yubormoqchimisiz?'), async () => {
      try {
        await apiClient.post(`/admin/security/force-logout/${userId}`);
        toast.success(tr('adminSecurity.forceLogoutSuccess', 'Foydalanuvchi barcha qurilmalardan chiqarildi.'));
      } catch {
        toast.error(tr('adminSecurity.forceLogoutError', 'Majburiy logout bajarilmadi.'));
      }
    });
  };

  const roles = useMemo(() => Array.from(new Set(users.map((user) => user.role).filter(Boolean))).sort(), [users]);
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = !q || [user.fullName, user.email, user.username, user.employeeId]
        .some((value) => String(value || '').toLowerCase().includes(q));
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [roleFilter, search, users]);

  const adminsCount = users.filter((user) => ['super_admin', 'admin'].includes(user.role)).length;
  const activeUsersCount = users.filter((user) => user.isActive !== false).length;

  return (
    <main className="security-shell">
      <style>{securityStyles}</style>

      <section className="security-hero admin-hero">
        <div className="hero-copy">
          <div className="hero-kicker danger">
            <ShieldAlert size={15} />
            {tr('adminSecurity.highSecurity', 'Yuqori xavfsizlik hududi')}
          </div>
          <h1>{tr('adminSecurity.title', 'Admin xavfsizlik markazi')}</h1>
          <p>{tr('adminSecurity.subtitle', 'Foydalanuvchi sessiyalarini nazorat qiling va zaruratda majburiy logout qiling.')}</p>
        </div>
        <button onClick={fetchUsers} className="security-refresh-action">
          <RefreshCcw size={16} />
          {t('common.refresh', 'Yangilash')}
        </button>
      </section>

      {error && (
        <div className="security-alert">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      <section className="metric-grid three">
        <MetricCard icon={Users} label={tr('adminSecurity.totalUsers', 'Jami foydalanuvchilar')} value={loading ? '-' : users.length} tone="blue" />
        <MetricCard icon={UserCheck} label={tr('adminSecurity.activeUsers', 'Faol foydalanuvchilar')} value={loading ? '-' : activeUsersCount} tone="green" />
        <MetricCard icon={ShieldCheck} label={tr('adminSecurity.adminUsers', 'Admin rollar')} value={loading ? '-' : adminsCount} tone="amber" />
      </section>

      <section className="security-panel">
        <div className="panel-toolbar">
          <div>
            <h2>{tr('adminSecurity.userSessions', 'Foydalanuvchi sessiyalari')}</h2>
            <p>{tr('adminSecurity.userSessionsSub', 'Qidiruv, rollar va majburiy logout amallari')}</p>
          </div>

          <div className="toolbar-controls">
            <label className="security-input">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={tr('adminSecurity.search', 'Ism, email yoki username bo‘yicha qidirish...')}
              />
            </label>
            <label className="security-select">
              <Filter size={16} />
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                <option value="all">{tr('adminSecurity.allRoles', 'Barcha rollar')}</option>
                {roles.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </label>
          </div>
        </div>

        {loading ? (
          <div className="security-skeleton-list">
            {Array.from({ length: 6 }).map((_, index) => <div key={index} className="security-skeleton" />)}
          </div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState title={tr('adminSecurity.empty', 'Foydalanuvchilar topilmadi.')} />
        ) : (
          <>
            <div className="security-table-wrap">
              <table className="security-table">
                <thead>
                  <tr>
                    <th>{tr('adminSecurity.user', 'Foydalanuvchi')}</th>
                    <th>{t('common.role', 'Rol')}</th>
                    <th>{t('employees.department', "Bo'lim")}</th>
                    <th className="right">{tr('adminSecurity.actions', 'Xavfsizlik amallari')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="identity-cell">
                          <Avatar name={user.fullName} />
                          <div>
                            <strong>{user.fullName || '-'}</strong>
                            <span>{user.email || user.username || user.employeeId || '-'}</span>
                          </div>
                        </div>
                      </td>
                      <td><RoleBadge role={user.role} /></td>
                      <td><span className="soft-pill">{user.departmentName || user.department || '-'}</span></td>
                      <td className="right">
                        <button onClick={() => handleForceLogout(user.id)} className="danger-action">
                          <MonitorOff size={15} />
                          {tr('adminSecurity.forceLogout', 'Majburiy logout')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-user-grid">
              {filteredUsers.map((user) => (
                <article key={user.id} className="mobile-user-card">
                  <div className="identity-cell">
                    <Avatar name={user.fullName} />
                    <div>
                      <strong>{user.fullName || '-'}</strong>
                      <span>{user.email || user.username || user.employeeId || '-'}</span>
                    </div>
                  </div>
                  <div className="mobile-card-meta">
                    <RoleBadge role={user.role} />
                    <span className="soft-pill">{user.departmentName || user.department || '-'}</span>
                  </div>
                  <button onClick={() => handleForceLogout(user.id)} className="danger-action full">
                    <MonitorOff size={15} />
                    {tr('adminSecurity.forceLogout', 'Majburiy logout')}
                  </button>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function MetricCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string | number; tone: string }) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="metric-icon"><Icon size={22} /></div>
    </article>
  );
}

function Avatar({ name }: { name?: string }) {
  const initials = String(name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return <div className="security-avatar">{initials || 'U'}</div>;
}

function RoleBadge({ role }: { role?: string }) {
  const elevated = role === 'super_admin' || role === 'admin';
  return <span className={`role-badge ${elevated ? 'elevated' : ''}`}>{role || '-'}</span>;
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="security-empty">
      <Users size={28} />
      <strong>{title}</strong>
    </div>
  );
}

const securityStyles = `
.security-shell {
  width: min(1280px, 100%);
  margin: 0 auto;
  padding: 24px;
  display: grid;
  gap: 18px;
}
.security-hero {
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
  box-shadow: 0 18px 60px rgba(0,0,0,.16);
}
.security-hero::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 4px;
  background: linear-gradient(90deg, #ef4444, #f59e0b, #3b82f6);
}
.hero-copy { position: relative; min-width: 0; }
.hero-kicker {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(239,68,68,.24);
  background: rgba(239,68,68,.1);
  color: #f87171;
  border-radius: 999px;
  padding: 7px 11px;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: .08em;
}
.security-hero h1 {
  margin: 14px 0 0;
  color: var(--text-primary);
  font-size: clamp(26px, 3vw, 38px);
  line-height: 1.05;
  font-weight: 950;
  letter-spacing: 0;
}
.security-hero p {
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
.security-alert {
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
.metric-grid {
  display: grid;
  gap: 14px;
}
.metric-grid.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.metric-card {
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
.metric-card span {
  color: var(--text-tertiary);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.metric-card strong {
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
.tone-green .metric-icon { color: #34d399; }
.tone-amber .metric-icon { color: #f59e0b; }
.security-panel {
  border: 1px solid var(--border-1);
  background: var(--surface-1);
  border-radius: 18px;
  overflow: hidden;
  min-height: 560px;
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
.toolbar-controls {
  display: flex;
  gap: 10px;
}
.security-input,
.security-select {
  height: 42px;
  border: 1px solid var(--border-2);
  background: var(--surface-3);
  border-radius: 12px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--text-tertiary);
}
.security-input { width: 360px; }
.security-select { width: 210px; }
.security-input input,
.security-select select {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 700;
}
.security-select select { appearance: none; cursor: pointer; }
.security-table-wrap { overflow-x: auto; }
.security-table {
  width: 100%;
  min-width: 860px;
  border-collapse: separate;
  border-spacing: 0;
}
.security-table th {
  padding: 14px 18px;
  color: var(--text-tertiary);
  background: var(--surface-1);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .08em;
  font-weight: 900;
}
.security-table td {
  padding: 16px 18px;
  border-top: 1px solid var(--border-1);
  color: var(--text-secondary);
}
.security-table tr:hover td { background: var(--surface-2); }
.right { text-align: right; }
.identity-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.identity-cell strong {
  display: block;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 900;
}
.identity-cell span {
  display: block;
  margin-top: 3px;
  color: var(--text-tertiary);
  font-size: 12px;
}
.security-avatar {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  border: 1px solid rgba(96,165,250,.24);
  background: rgba(96,165,250,.1);
  color: #60a5fa;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 950;
  flex: 0 0 auto;
}
.role-badge,
.soft-pill {
  display: inline-flex;
  align-items: center;
  min-height: 27px;
  border-radius: 999px;
  padding: 0 10px;
  border: 1px solid var(--border-1);
  background: var(--surface-3);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 850;
}
.role-badge.elevated {
  border-color: rgba(239,68,68,.25);
  background: rgba(239,68,68,.1);
  color: #f87171;
}
.danger-action {
  min-height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(245,158,11,.24);
  background: rgba(245,158,11,.1);
  color: #f59e0b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
}
.danger-action:hover { background: rgba(245,158,11,.16); }
.danger-action.full { width: 100%; margin-top: 14px; }
.security-skeleton-list { display: grid; gap: 12px; padding: 16px; }
.security-skeleton {
  height: 68px;
  border-radius: 14px;
  background: linear-gradient(90deg, var(--surface-2), var(--surface-3), var(--surface-2));
  background-size: 220% 100%;
  animation: securityPulse 1.2s linear infinite;
}
.security-empty {
  min-height: 260px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 12px;
  color: var(--text-tertiary);
}
.security-empty strong { color: var(--text-secondary); font-size: 14px; }
.mobile-user-grid { display: none; }
@keyframes securityPulse { to { background-position: -220% 0; } }
@media (max-width: 980px) {
  .security-shell { padding: 16px; }
  .security-hero { align-items: stretch; flex-direction: column; padding: 22px; }
  .metric-grid.three { grid-template-columns: 1fr; }
  .panel-toolbar { align-items: stretch; flex-direction: column; }
  .toolbar-controls { flex-direction: column; }
  .security-input, .security-select { width: 100%; }
}
@media (max-width: 760px) {
  .security-table-wrap { display: none; }
  .mobile-user-grid { display: grid; gap: 12px; padding: 14px; }
  .mobile-user-card {
    border: 1px solid var(--border-1);
    background: var(--surface-2);
    border-radius: 15px;
    padding: 14px;
  }
  .mobile-card-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }
}
`;
