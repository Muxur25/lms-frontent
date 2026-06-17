import { Fragment, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Ban,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Laptop,
  LogOut,
  MonitorOff,
  RefreshCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  UserCheck,
  Users,
  Wifi,
} from 'lucide-react';
import { apiClient } from '@/api/axios';
import toast from 'react-hot-toast';
import { customConfirm } from '@/shared/lib/toast-utils';
import { useAuthStore } from '@/store/auth.store';

type AdminUser = {
  id: string;
  fullName?: string;
  fullNameRu?: string;
  email?: string | null;
  username?: string | null;
  employeeId?: string | null;
  role?: string;
  departmentName?: string | null;
  department?: string | null;
  isActive?: boolean;
};

type SessionSummary = {
  userId: string;
  activeSessions: number;
  deviceCount: number;
  lastActivity?: string | null;
};

type AdminSession = {
  id: string;
  userId: string;
  deviceId: string;
  expiresAt?: string;
  lastActivity?: string;
  current?: boolean;
  device?: {
    browser?: string | null;
    operatingSystem?: string | null;
    deviceType?: string | null;
    ipAddress?: string | null;
    lastActivity?: string | null;
  } | null;
};

type BlockedIp = {
  id: string;
  ipAddress: string;
  reason?: string | null;
  blockedAt?: string | null;
  blockedByUserId?: string | null;
  sourceUserId?: string | null;
};

type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type SecurityView = 'sessions' | 'ip';

const unwrapArray = <T,>(response: any): T[] => {
  const payload = response?.data?.data ?? response?.data ?? response;
  return Array.isArray(payload) ? payload : [];
};

const unwrapMetadata = (response: any): PaginationMeta => {
  const metadata = response?.data?.metadata || response?.metadata || {};
  return {
    page: Number(metadata.page || 1),
    limit: Number(metadata.limit || 10),
    total: Number(metadata.total || 0),
    totalPages: Math.max(1, Number(metadata.totalPages || 1)),
  };
};

const getErrorMessage = (error: any, fallback: string) => {
  const message = error?.response?.data?.message || error?.response?.data?.error || error?.message;
  return typeof message === 'string' && message.trim() ? message : fallback;
};

const safeText = (value: unknown, fallback = '-') => {
  const text = String(value ?? '').trim();
  return text || fallback;
};

const safeDateTime = (value?: string | null, fallback = '-') => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString();
};

const getBlockedIpReasonLabel = (
  reason: string | null | undefined,
  tr: (key: string, fallback: string, values?: Record<string, string | number>) => string,
) => {
  const normalized = String(reason || '').trim().toLowerCase();
  if (!normalized) return tr('adminSecurity.manualBlock', 'Manual blok');
  if (normalized.includes('blocked manually')) return tr('adminSecurity.manualBlock', 'Manual blok');
  if (normalized.includes('admin security panel')) return tr('adminSecurity.panelBlock', 'Admin panel orqali bloklangan');
  return reason || tr('adminSecurity.manualBlock', 'Manual blok');
};

export default function AdminSecurityPage() {
  const { t, i18n } = useTranslation();
  const currentUser = useAuthStore((state) => state.user);
  const isRu = i18n.language === 'ru';
  const tr = (key: string, fallback: string, values?: Record<string, string | number>) => t(key, { defaultValue: fallback, ...(values || {}) });
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [summaries, setSummaries] = useState<Record<string, SessionSummary>>({});
  const [sessionsByUser, setSessionsByUser] = useState<Record<string, AdminSession[]>>({});
  const [sessionLoading, setSessionLoading] = useState<Record<string, boolean>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [removingSession, setRemovingSession] = useState<Record<string, boolean>>({});
  const [blockingIp, setBlockingIp] = useState<Record<string, boolean>>({});
  const [blockedIps, setBlockedIps] = useState<BlockedIp[]>([]);
  const [blockedIpMeta, setBlockedIpMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [blockedIpsLoading, setBlockedIpsLoading] = useState(false);
  const [manualIp, setManualIp] = useState('');
  const [manualBlockLoading, setManualBlockLoading] = useState(false);
  const [unblockingIp, setUnblockingIp] = useState<Record<string, boolean>>({});
  const [activeView, setActiveView] = useState<SecurityView>('sessions');
  const [blockedIpsLoaded, setBlockedIpsLoaded] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    void fetchUsers();
  }, []);

  useEffect(() => {
    if (activeView === 'ip' && !blockedIpsLoaded) {
      void fetchBlockedIps(1);
    }
  }, [activeView, blockedIpsLoaded]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const [usersRes, summariesRes] = await Promise.all([
        apiClient.get('/users'),
        apiClient.get('/admin/security/users/sessions/summary'),
      ]);
      setUsers(unwrapArray<AdminUser>(usersRes));
      const summaryList = unwrapArray<SessionSummary>(summariesRes);
      setSummaries(Object.fromEntries(summaryList.map((item) => [item.userId, item])));
    } catch (err) {
      const message = getErrorMessage(err, tr('adminSecurity.loadError', "Foydalanuvchilarni yuklab bo'lmadi."));
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const loadUserSessions = async (userId: string, force = false) => {
    if (!force && sessionsByUser[userId]) return;
    try {
      setSessionLoading((prev) => ({ ...prev, [userId]: true }));
      const res = await apiClient.get(`/admin/security/users/${userId}/sessions`);
      setSessionsByUser((prev) => ({ ...prev, [userId]: unwrapArray<AdminSession>(res) }));
    } catch (err) {
      toast.error(getErrorMessage(err, tr('adminSecurity.sessionsLoadError', "Sessiyalarni yuklab bo'lmadi.")));
      setSessionsByUser((prev) => ({ ...prev, [userId]: [] }));
    } finally {
      setSessionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const fetchBlockedIps = async (page = blockedIpMeta.page) => {
    try {
      setBlockedIpsLoading(true);
      const res = await apiClient.get(`/admin/security/blocked-ips?page=${page}&limit=10`);
      setBlockedIps(unwrapArray<BlockedIp>(res));
      setBlockedIpMeta(unwrapMetadata(res));
      setBlockedIpsLoaded(true);
    } catch (err) {
      toast.error(getErrorMessage(err, tr('adminSecurity.blockedIpsLoadError', "Bloklangan IPlarni yuklab bo'lmadi.")));
    } finally {
      setBlockedIpsLoading(false);
    }
  };

  const handleToggleSessions = async (userId: string) => {
    const next = expandedUserId === userId ? null : userId;
    setExpandedUserId(next);
    if (next) await loadUserSessions(next);
  };

  const handleForceLogout = async (user: AdminUser) => {
    const summary = getSummary(user.id);
    if (!canForceLogout(user, summary.activeSessions)) return;
    const isSelf = user.id === currentUser?.id;
    const message = isSelf
      ? tr('adminSecurity.confirmForceLogoutSelf', "O'zingizdan boshqa sessiyalarni yopmoqchimisiz?")
      : tr('adminSecurity.confirmForceLogout', 'Ushbu foydalanuvchini barcha qurilmalardan chiqarib yubormoqchimisiz?');

    customConfirm(message, async () => {
      try {
        setActionLoading((prev) => ({ ...prev, [user.id]: true }));
        await apiClient.post(`/admin/security/force-logout/${user.id}`);
        toast.success(isSelf
          ? tr('adminSecurity.forceLogoutSelfSuccess', 'Boshqa sessiyalaringiz yopildi.')
          : tr('adminSecurity.forceLogoutSuccess', 'Foydalanuvchi barcha qurilmalardan chiqarildi.'));
        await refreshSecurityState(user.id);
      } catch (err) {
        toast.error(getErrorMessage(err, tr('adminSecurity.forceLogoutError', 'Majburiy logout bajarilmadi.')));
      } finally {
        setActionLoading((prev) => ({ ...prev, [user.id]: false }));
      }
    });
  };

  const handleRemoveSession = async (userId: string, session: AdminSession) => {
    if (session.current) return;
    customConfirm(tr('adminSecurity.confirmRemoveSession', 'Ushbu qurilma sessiyasini tugatmoqchimisiz?'), async () => {
      try {
        setRemovingSession((prev) => ({ ...prev, [session.id]: true }));
        await apiClient.delete(`/admin/security/users/${userId}/sessions/${session.id}`);
        toast.success(tr('adminSecurity.removeSessionSuccess', 'Qurilma sessiyasi tugatildi.'));
        await refreshSecurityState(userId);
      } catch (err) {
        toast.error(getErrorMessage(err, tr('adminSecurity.removeSessionError', "Qurilma sessiyasini tugatib bo'lmadi.")));
      } finally {
        setRemovingSession((prev) => ({ ...prev, [session.id]: false }));
      }
    });
  };

  const handleBlockSessionIp = async (userId: string, session: AdminSession) => {
    if (session.current) return;
    const ipAddress = safeText(session.device?.ipAddress, tr('adminSecurity.unknownIp', "Noma'lum IP"));
    customConfirm(tr('adminSecurity.confirmBlockIp', '{{ip}} IP manzilini bloklamoqchimisiz?', { ip: ipAddress }), async () => {
      try {
        setBlockingIp((prev) => ({ ...prev, [session.id]: true }));
        await apiClient.post(`/admin/security/users/${userId}/sessions/${session.id}/block-ip`);
        toast.success(tr('adminSecurity.blockIpSuccess', 'IP bloklandi va shu IPdagi sessiyalar yopildi.'));
        await refreshSecurityState(userId);
        await fetchBlockedIps(1);
      } catch (err) {
        toast.error(getErrorMessage(err, tr('adminSecurity.blockIpError', "IP manzilni bloklab bo'lmadi.")));
      } finally {
        setBlockingIp((prev) => ({ ...prev, [session.id]: false }));
      }
    });
  };

  const handleManualBlockIp = async () => {
    const ipAddress = manualIp.trim();
    if (!ipAddress) {
      toast.error(tr('adminSecurity.ipRequired', 'IP manzil kiriting.'));
      return;
    }
    try {
      setManualBlockLoading(true);
      await apiClient.post('/admin/security/blocked-ips', { ipAddress });
      toast.success(tr('adminSecurity.blockIpSuccess', 'IP bloklandi va shu IPdagi sessiyalar yopildi.'));
      setManualIp('');
      await refreshSecurityState(expandedUserId || undefined);
      await fetchBlockedIps(1);
    } catch (err) {
      toast.error(getErrorMessage(err, tr('adminSecurity.blockIpError', "IP manzilni bloklab bo'lmadi.")));
    } finally {
      setManualBlockLoading(false);
    }
  };

  const handleUnblockIp = async (item: BlockedIp) => {
    customConfirm(tr('adminSecurity.confirmUnblockIp', '{{ip}} IP manzilini blokdan chiqarasizmi?', { ip: item.ipAddress }), async () => {
      try {
        setUnblockingIp((prev) => ({ ...prev, [item.id]: true }));
        await apiClient.delete(`/admin/security/blocked-ips/${item.id}`);
        toast.success(tr('adminSecurity.unblockIpSuccess', 'IP blokdan chiqarildi.'));
        const nextPage = blockedIps.length === 1 && blockedIpMeta.page > 1 ? blockedIpMeta.page - 1 : blockedIpMeta.page;
        await fetchBlockedIps(nextPage);
      } catch (err) {
        toast.error(getErrorMessage(err, tr('adminSecurity.unblockIpError', "IP manzilni blokdan chiqarib bo'lmadi.")));
      } finally {
        setUnblockingIp((prev) => ({ ...prev, [item.id]: false }));
      }
    });
  };

  const refreshSecurityState = async (userId?: string) => {
    const summariesRes = await apiClient.get('/admin/security/users/sessions/summary');
    const summaryList = unwrapArray<SessionSummary>(summariesRes);
    setSummaries(Object.fromEntries(summaryList.map((item) => [item.userId, item])));
    if (userId && expandedUserId === userId) {
      await loadUserSessions(userId, true);
    }
  };

  const getSummary = (userId: string): SessionSummary => summaries[userId] || {
    userId,
    activeSessions: 0,
    deviceCount: 0,
    lastActivity: null,
  };

  const canForceLogout = (user: AdminUser, activeSessions: number) => {
    if (!currentUser) return false;
    const isSelf = user.id === currentUser.id;
    if (isSelf) return activeSessions > 1;
    if (currentUser.role === 'super_admin') return activeSessions > 0;
    if (currentUser.role === 'admin') return activeSessions > 0 && user.role !== 'super_admin' && user.role !== 'admin';
    return false;
  };

  const getDisabledReason = (user: AdminUser, activeSessions: number) => {
    if (activeSessions === 0) return tr('adminSecurity.noActiveSessions', "Faol sessiya yo'q");
    if (user.id === currentUser?.id) return tr('adminSecurity.currentSessionProtected', 'Joriy sessiya himoyalangan');
    return tr('adminSecurity.roleProtected', 'Bu rol himoyalangan');
  };

  const roles = useMemo(() => Array.from(new Set(users.map((user) => user.role).filter(Boolean))).sort(), [users]);
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((user) => {
      const name = isRu ? user.fullNameRu || user.fullName : user.fullName || user.fullNameRu;
      const matchesSearch = !q || [name, user.fullName, user.fullNameRu, user.email, user.username, user.employeeId]
        .some((value) => String(value || '').toLowerCase().includes(q));
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [isRu, roleFilter, search, users]);

  const adminsCount = users.filter((user) => ['super_admin', 'admin'].includes(user.role || '')).length;
  const activeUsersCount = users.filter((user) => user.isActive !== false).length;
  const totalSessions = Object.values(summaries).reduce((sum, item) => sum + Number(item.activeSessions || 0), 0);

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
        <button onClick={() => void fetchUsers()} className="security-refresh-action" disabled={loading}>
          <RefreshCcw size={16} className={loading ? 'spin-icon' : ''} />
          {t('common.refresh', 'Yangilash')}
        </button>
      </section>

      {error && (
        <div className="security-alert">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      <section className="metric-grid four">
        <MetricCard icon={Users} label={tr('adminSecurity.totalUsers', 'Jami foydalanuvchilar')} value={loading ? '-' : users.length} tone="blue" />
        <MetricCard icon={UserCheck} label={tr('adminSecurity.activeUsers', 'Faol foydalanuvchilar')} value={loading ? '-' : activeUsersCount} tone="green" />
        <MetricCard icon={Wifi} label={tr('adminSecurity.activeSessions', 'Faol sessiyalar')} value={loading ? '-' : totalSessions} tone="cyan" />
        <MetricCard icon={ShieldCheck} label={tr('adminSecurity.adminUsers', 'Admin rollar')} value={loading ? '-' : adminsCount} tone="amber" />
      </section>

      <section className="security-view-switch">
        <button className={activeView === 'sessions' ? 'active' : ''} onClick={() => setActiveView('sessions')}>
          <Users size={15} />
          {tr('adminSecurity.userSessions', 'Foydalanuvchi sessiyalari')}
        </button>
        <button className={activeView === 'ip' ? 'active danger' : ''} onClick={() => setActiveView('ip')}>
          <Ban size={15} />
          {tr('adminSecurity.ipBlockKicker', 'IP nazorati')}
        </button>
      </section>

      {activeView === 'ip' && (
        <section className="ip-block-panel">
          <div className="ip-block-top">
            <div>
              <div className="ip-block-kicker">
                <Ban size={14} />
                {tr('adminSecurity.ipBlockKicker', 'IP nazorati')}
              </div>
              <h2>{tr('adminSecurity.ipBlockTitle', 'IP bloklash')}</h2>
              <p>{tr('adminSecurity.ipBlockSubtitle', 'Bloklangan IP manzildan hech bir foydalanuvchi tizimga kira olmaydi.')}</p>
            </div>
            <div className="ip-block-form">
              <label className="ip-block-input">
                <Wifi size={16} />
                <input
                  value={manualIp}
                  onChange={(event) => setManualIp(event.target.value)}
                  placeholder={tr('adminSecurity.ipPlaceholder', 'Masalan: 192.168.1.25')}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void handleManualBlockIp();
                  }}
                />
              </label>
              <button className="ip-block-submit" onClick={() => void handleManualBlockIp()} disabled={manualBlockLoading}>
                <Ban size={15} className={manualBlockLoading ? 'spin-icon' : ''} />
                {manualBlockLoading ? tr('adminSecurity.processing', 'Bajarilmoqda...') : tr('adminSecurity.blockIp', 'IP bloklash')}
              </button>
            </div>
          </div>

          <div className="blocked-ip-list">
            <div className="blocked-ip-list-head">
              <strong>{tr('adminSecurity.blockedIps', 'Bloklangan IPlar')}</strong>
              <span>{tr('adminSecurity.blockedIpCount', '{{count}} ta', { count: blockedIpMeta.total })}</span>
            </div>
            {blockedIpsLoading ? (
              <div className="security-skeleton compact" />
            ) : blockedIps.length === 0 ? (
              <div className="blocked-ip-empty">
                <ShieldCheck size={20} />
                {tr('adminSecurity.noBlockedIps', "Bloklangan IP yo'q.")}
              </div>
            ) : (
              <div className="blocked-ip-items">
                {blockedIps.map((item) => (
                  <div key={item.id} className="blocked-ip-card">
                    <div className="blocked-ip-icon"><Ban size={15} /></div>
                    <div className="blocked-ip-main">
                      <strong>{item.ipAddress}</strong>
                      <span>{safeDateTime(item.blockedAt)} - {getBlockedIpReasonLabel(item.reason, tr)}</span>
                    </div>
                    <button className="unblock-action" onClick={() => void handleUnblockIp(item)} disabled={Boolean(unblockingIp[item.id])}>
                      <ShieldCheck size={14} className={unblockingIp[item.id] ? 'spin-icon' : ''} />
                      {unblockingIp[item.id] ? tr('adminSecurity.processing', 'Bajarilmoqda...') : tr('adminSecurity.unblockIp', 'Blokdan chiqarish')}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {blockedIpMeta.totalPages > 1 && (
              <div className="blocked-ip-pagination">
                <button onClick={() => void fetchBlockedIps(blockedIpMeta.page - 1)} disabled={blockedIpMeta.page <= 1 || blockedIpsLoading}>
                  <ChevronLeft size={15} />
                </button>
                <span>{blockedIpMeta.page} / {blockedIpMeta.totalPages}</span>
                <button onClick={() => void fetchBlockedIps(blockedIpMeta.page + 1)} disabled={blockedIpMeta.page >= blockedIpMeta.totalPages || blockedIpsLoading}>
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {activeView === 'sessions' && (
        <section className="security-panel">
        <div className="panel-toolbar">
          <div>
            <h2>{tr('adminSecurity.userSessions', 'Foydalanuvchi sessiyalari')}</h2>
            <p>{tr('adminSecurity.userSessionsSub', 'Qidiruv, sessiyalar va majburiy logout amallari')}</p>
          </div>

          <div className="toolbar-controls">
            <label className="security-input">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={tr('adminSecurity.search', "Ism, email yoki username bo'yicha qidirish...")}
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
                    <th>{tr('adminSecurity.sessionStatus', 'Sessiyalar')}</th>
                    <th>{tr('adminSecurity.lastActivity', 'Oxirgi faollik')}</th>
                    <th className="right">{tr('adminSecurity.actions', 'Xavfsizlik amallari')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const summary = getSummary(user.id);
                    const expanded = expandedUserId === user.id;
                    return (
                      <Fragment key={user.id}>
                        <tr>
                          <td>
                            <div className="identity-cell">
                              <button className="expand-action" onClick={() => void handleToggleSessions(user.id)} aria-label={tr('adminSecurity.showSessions', "Sessiyalarni ko'rish")}>
                                {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                              </button>
                              <Avatar name={isRu ? user.fullNameRu || user.fullName : user.fullName || user.fullNameRu} />
                              <div>
                                <strong>{safeText(isRu ? user.fullNameRu || user.fullName : user.fullName || user.fullNameRu)}</strong>
                                <span>{safeText(user.email || user.username || user.employeeId)}</span>
                              </div>
                            </div>
                          </td>
                          <td><RoleBadge role={user.role} /></td>
                          <td><SessionPill summary={summary} tr={tr} /></td>
                          <td><span className="muted-cell">{safeDateTime(summary.lastActivity)}</span></td>
                          <td className="right">
                            <ForceLogoutButton
                              user={user}
                              activeSessions={summary.activeSessions}
                              loading={Boolean(actionLoading[user.id])}
                              canForce={canForceLogout(user, summary.activeSessions)}
                              disabledReason={getDisabledReason(user, summary.activeSessions)}
                              onClick={() => void handleForceLogout(user)}
                              tr={tr}
                              isSelf={user.id === currentUser?.id}
                            />
                          </td>
                        </tr>
                        {expanded && (
                          <tr className="session-detail-row">
                            <td colSpan={5}>
                              <SessionDetails
                                sessions={sessionsByUser[user.id] || []}
                                loading={Boolean(sessionLoading[user.id])}
                                removingSession={removingSession}
                                blockingIp={blockingIp}
                                onRemoveSession={(session) => void handleRemoveSession(user.id, session)}
                                onBlockIp={(session) => void handleBlockSessionIp(user.id, session)}
                                tr={tr}
                              />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mobile-user-grid">
              {filteredUsers.map((user) => {
                const summary = getSummary(user.id);
                const expanded = expandedUserId === user.id;
                return (
                  <article key={user.id} className="mobile-user-card">
                    <div className="mobile-card-head">
                      <div className="identity-cell">
                        <Avatar name={isRu ? user.fullNameRu || user.fullName : user.fullName || user.fullNameRu} />
                        <div>
                          <strong>{safeText(isRu ? user.fullNameRu || user.fullName : user.fullName || user.fullNameRu)}</strong>
                          <span>{safeText(user.email || user.username || user.employeeId)}</span>
                        </div>
                      </div>
                      <button className="expand-action" onClick={() => void handleToggleSessions(user.id)} aria-label={tr('adminSecurity.showSessions', "Sessiyalarni ko'rish")}>
                        {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      </button>
                    </div>
                    <div className="mobile-card-meta">
                      <RoleBadge role={user.role} />
                      <span className="soft-pill">{safeText(user.departmentName || user.department)}</span>
                      <SessionPill summary={summary} tr={tr} />
                    </div>
                    <div className="mobile-last-activity">
                      <Clock size={13} />
                      {safeDateTime(summary.lastActivity)}
                    </div>
                    {expanded && (
                      <SessionDetails
                        sessions={sessionsByUser[user.id] || []}
                        loading={Boolean(sessionLoading[user.id])}
                        removingSession={removingSession}
                        blockingIp={blockingIp}
                        onRemoveSession={(session) => void handleRemoveSession(user.id, session)}
                        onBlockIp={(session) => void handleBlockSessionIp(user.id, session)}
                        tr={tr}
                      />
                    )}
                    <ForceLogoutButton
                      user={user}
                      activeSessions={summary.activeSessions}
                      loading={Boolean(actionLoading[user.id])}
                      canForce={canForceLogout(user, summary.activeSessions)}
                      disabledReason={getDisabledReason(user, summary.activeSessions)}
                      onClick={() => void handleForceLogout(user)}
                      tr={tr}
                      isSelf={user.id === currentUser?.id}
                      full
                    />
                  </article>
                );
              })}
            </div>
          </>
        )}
        </section>
      )}
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

function SessionPill({ summary, tr }: { summary: SessionSummary; tr: (key: string, fallback: string, values?: Record<string, string | number>) => string }) {
  const active = Number(summary.activeSessions || 0);
  return (
    <span className={`session-pill ${active > 0 ? 'online' : ''}`}>
      <Wifi size={13} />
      {tr('adminSecurity.sessionCount', '{{count}} sessiya', { count: active })}
    </span>
  );
}

function ForceLogoutButton({
  activeSessions,
  loading,
  canForce,
  disabledReason,
  onClick,
  tr,
  isSelf,
  full,
}: {
  user: AdminUser;
  activeSessions: number;
  loading: boolean;
  canForce: boolean;
  disabledReason: string;
  onClick: () => void;
  tr: (key: string, fallback: string, values?: Record<string, string | number>) => string;
  isSelf: boolean;
  full?: boolean;
}) {
  const disabled = !canForce || loading;
  const label = isSelf
    ? tr('adminSecurity.forceLogoutOthers', 'Boshqa sessiyalarni yopish')
    : tr('adminSecurity.forceLogout', 'Majburiy logout');
  return (
    <button
      onClick={onClick}
      className={`danger-action ${full ? 'full' : ''}`}
      disabled={disabled}
      title={disabled && !loading ? disabledReason : label}
    >
      <MonitorOff size={15} className={loading ? 'spin-icon' : ''} />
      {loading ? tr('adminSecurity.processing', 'Bajarilmoqda...') : activeSessions === 0 ? tr('adminSecurity.noActiveSessions', "Faol sessiya yo'q") : label}
    </button>
  );
}

function SessionDetails({
  sessions,
  loading,
  removingSession,
  blockingIp,
  onRemoveSession,
  onBlockIp,
  tr,
}: {
  sessions: AdminSession[];
  loading: boolean;
  removingSession: Record<string, boolean>;
  blockingIp: Record<string, boolean>;
  onRemoveSession: (session: AdminSession) => void;
  onBlockIp: (session: AdminSession) => void;
  tr: (key: string, fallback: string, values?: Record<string, string | number>) => string;
}) {
  if (loading) {
    return (
      <div className="session-detail-box">
        <div className="security-skeleton compact" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="session-detail-box empty">
        <Wifi size={18} />
        {tr('adminSecurity.noSessionsDetail', 'Faol sessiyalar topilmadi.')}
      </div>
    );
  }

  return (
    <div className="session-detail-box">
      {sessions.map((session) => {
        const deviceType = String(session.device?.deviceType || '').toLowerCase();
        const DeviceIcon = deviceType.includes('mobile') || deviceType.includes('tablet') ? Smartphone : Laptop;
        return (
          <div key={session.id} className="session-card">
            <div className="session-device-icon"><DeviceIcon size={16} /></div>
            <div className="session-main">
              <strong>
                {safeText(session.device?.browser, tr('adminSecurity.unknownBrowser', "Noma'lum brauzer"))}
                {' / '}
                {safeText(session.device?.operatingSystem, tr('adminSecurity.unknownOs', "Noma'lum OS"))}
              </strong>
              <span>{safeText(session.device?.ipAddress, tr('adminSecurity.unknownIp', "Noma'lum IP"))}</span>
            </div>
            <div className="session-meta">
              {session.current && <span className="current-session-pill">{tr('adminSecurity.currentSession', 'Joriy sessiya')}</span>}
              <span>{safeDateTime(session.lastActivity)}</span>
            </div>
            <button
              className="session-remove-action"
              onClick={() => onRemoveSession(session)}
              disabled={session.current || Boolean(removingSession[session.id])}
              title={session.current ? tr('adminSecurity.currentSessionProtected', 'Joriy sessiya himoyalangan') : tr('adminSecurity.removeSession', 'Qurilmani logout qilish')}
            >
              <LogOut size={14} className={removingSession[session.id] ? 'spin-icon' : ''} />
              {removingSession[session.id] ? tr('adminSecurity.processing', 'Bajarilmoqda...') : tr('adminSecurity.removeSession', 'Qurilmani logout qilish')}
            </button>
            <button
              className="session-block-action"
              onClick={() => onBlockIp(session)}
              disabled={session.current || Boolean(blockingIp[session.id])}
              title={session.current ? tr('adminSecurity.currentSessionProtected', 'Joriy sessiya himoyalangan') : tr('adminSecurity.blockIp', 'IP bloklash')}
            >
              <Ban size={14} className={blockingIp[session.id] ? 'spin-icon' : ''} />
              {blockingIp[session.id] ? tr('adminSecurity.processing', 'Bajarilmoqda...') : tr('adminSecurity.blockIp', 'IP bloklash')}
            </button>
          </div>
        );
      })}
    </div>
  );
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
.security-refresh-action:hover { background: var(--surface-3); border-color: var(--border-3); }
.security-refresh-action:disabled,
.danger-action:disabled {
  opacity: .58;
  cursor: not-allowed;
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
.metric-grid { display: grid; gap: 14px; }
.metric-grid.four { grid-template-columns: repeat(4, minmax(0, 1fr)); }
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
.tone-cyan .metric-icon { color: #22d3ee; }
.security-view-switch {
  width: fit-content;
  max-width: 100%;
  display: inline-flex;
  gap: 6px;
  padding: 6px;
  border: 1px solid var(--border-1);
  background: var(--surface-1);
  border-radius: 15px;
  box-shadow: 0 12px 34px rgba(0,0,0,.10);
  overflow-x: auto;
}
.security-view-switch button {
  min-height: 38px;
  border: 1px solid transparent;
  border-radius: 11px;
  background: transparent;
  color: var(--text-tertiary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 950;
  white-space: nowrap;
  cursor: pointer;
}
.security-view-switch button.active {
  color: #60a5fa;
  border-color: rgba(96,165,250,.28);
  background: rgba(96,165,250,.10);
}
.security-view-switch button.active.danger {
  color: #f87171;
  border-color: rgba(239,68,68,.28);
  background: rgba(239,68,68,.10);
}
.ip-block-panel {
  border: 1px solid rgba(239,68,68,.18);
  background:
    radial-gradient(circle at 8% 0%, rgba(239,68,68,.12), transparent 34%),
    radial-gradient(circle at 94% 12%, rgba(245,158,11,.10), transparent 30%),
    var(--surface-1);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 18px 60px rgba(0,0,0,.14);
}
.ip-block-top {
  padding: 22px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 520px);
  gap: 18px;
  align-items: end;
  border-bottom: 1px solid var(--border-1);
}
.ip-block-kicker {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #f87171;
  background: rgba(239,68,68,.1);
  border: 1px solid rgba(239,68,68,.22);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: .08em;
}
.ip-block-panel h2 {
  margin: 12px 0 0;
  color: var(--text-primary);
  font-size: 24px;
  line-height: 1.1;
  font-weight: 950;
}
.ip-block-panel p {
  margin: 8px 0 0;
  color: var(--text-tertiary);
  font-size: 13px;
  line-height: 1.55;
}
.ip-block-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}
.ip-block-input {
  min-height: 46px;
  border: 1px solid var(--border-2);
  background: color-mix(in srgb, var(--surface-3) 86%, transparent);
  border-radius: 13px;
  padding: 0 13px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-tertiary);
}
.ip-block-input input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 850;
}
.ip-block-submit {
  min-height: 46px;
  border-radius: 13px;
  border: 1px solid rgba(239,68,68,.28);
  background: rgba(239,68,68,.12);
  color: #f87171;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 950;
  cursor: pointer;
  white-space: nowrap;
}
.ip-block-submit:hover:not(:disabled) { background: rgba(239,68,68,.18); }
.ip-block-submit:disabled,
.unblock-action:disabled,
.blocked-ip-pagination button:disabled {
  opacity: .55;
  cursor: not-allowed;
}
.blocked-ip-list {
  padding: 18px 22px 22px;
}
.blocked-ip-list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.blocked-ip-list-head strong {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 950;
}
.blocked-ip-list-head span {
  color: var(--text-tertiary);
  font-size: 12px;
  font-weight: 850;
}
.blocked-ip-items {
  display: grid;
  gap: 10px;
}
.blocked-ip-card {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--border-1);
  background: color-mix(in srgb, var(--surface-2) 88%, transparent);
  border-radius: 14px;
  padding: 12px;
}
.blocked-ip-icon {
  width: 36px;
  height: 36px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  color: #f87171;
  background: rgba(239,68,68,.1);
  border: 1px solid rgba(239,68,68,.18);
}
.blocked-ip-main strong {
  display: block;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 950;
}
.blocked-ip-main span {
  display: block;
  margin-top: 3px;
  color: var(--text-tertiary);
  font-size: 11px;
}
.blocked-ip-empty {
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border: 1px dashed var(--border-2);
  border-radius: 14px;
  color: var(--text-tertiary);
  font-size: 13px;
  font-weight: 850;
}
.unblock-action {
  min-height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(34,197,94,.24);
  background: rgba(34,197,94,.1);
  color: #34d399;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 950;
  cursor: pointer;
  white-space: nowrap;
}
.unblock-action:hover:not(:disabled) { background: rgba(34,197,94,.16); }
.blocked-ip-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
}
.blocked-ip-pagination button {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid var(--border-2);
  background: var(--surface-2);
  color: var(--text-secondary);
  display: grid;
  place-items: center;
  cursor: pointer;
}
.blocked-ip-pagination span {
  color: var(--text-tertiary);
  font-size: 12px;
  font-weight: 900;
}
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
.toolbar-controls { display: flex; gap: 10px; }
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
  min-width: 980px;
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
  vertical-align: middle;
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
.expand-action {
  width: 30px;
  height: 30px;
  border: 1px solid var(--border-2);
  border-radius: 9px;
  background: var(--surface-3);
  color: var(--text-secondary);
  display: inline-grid;
  place-items: center;
  cursor: pointer;
  flex: 0 0 auto;
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
.soft-pill,
.session-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 27px;
  border-radius: 999px;
  padding: 0 10px;
  border: 1px solid var(--border-1);
  background: var(--surface-3);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 850;
}
.session-pill.online {
  border-color: rgba(34,197,94,.25);
  background: rgba(34,197,94,.1);
  color: #34d399;
}
.role-badge.elevated {
  border-color: rgba(239,68,68,.25);
  background: rgba(239,68,68,.1);
  color: #f87171;
}
.muted-cell {
  color: var(--text-tertiary);
  font-size: 12px;
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
.danger-action:hover:not(:disabled) { background: rgba(245,158,11,.16); }
.danger-action.full { width: 100%; margin-top: 14px; }
.session-detail-row td {
  padding: 0 18px 16px;
  background: color-mix(in srgb, var(--surface-2) 70%, transparent);
}
.session-detail-box {
  border: 1px solid var(--border-1);
  border-radius: 14px;
  background: var(--surface-2);
  padding: 12px;
  display: grid;
  gap: 10px;
}
.session-detail-box.empty {
  min-height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  font-size: 12px;
  font-weight: 800;
}
.session-card {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto auto auto;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--border-1);
  background: var(--surface-1);
  border-radius: 12px;
}
.session-device-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: rgba(34,211,238,.1);
  color: #22d3ee;
}
.session-main strong {
  display: block;
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 900;
}
.session-main span,
.session-meta span {
  color: var(--text-tertiary);
  font-size: 11px;
}
.session-meta {
  text-align: right;
  display: grid;
  justify-items: end;
  gap: 4px;
}
.current-session-pill {
  width: fit-content;
  color: #34d399 !important;
  font-weight: 900;
}
.session-remove-action,
.session-block-action {
  min-height: 32px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 10px;
  font-size: 11px;
  font-weight: 900;
  cursor: pointer;
  white-space: nowrap;
}
.session-remove-action {
  border: 1px solid rgba(245,158,11,.24);
  background: rgba(245,158,11,.08);
  color: #f59e0b;
}
.session-block-action {
  border: 1px solid rgba(239,68,68,.24);
  background: rgba(239,68,68,.08);
  color: #f87171;
}
.session-remove-action:hover:not(:disabled) {
  background: rgba(245,158,11,.14);
}
.session-block-action:hover:not(:disabled) {
  background: rgba(239,68,68,.14);
}
.session-remove-action:disabled,
.session-block-action:disabled {
  opacity: .55;
  cursor: not-allowed;
}
.security-skeleton-list { display: grid; gap: 12px; padding: 16px; }
.security-skeleton {
  height: 68px;
  border-radius: 14px;
  background: linear-gradient(90deg, var(--surface-2), var(--surface-3), var(--surface-2));
  background-size: 220% 100%;
  animation: securityPulse 1.2s linear infinite;
}
.security-skeleton.compact { height: 48px; }
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
.spin-icon { animation: securitySpin .8s linear infinite; }
@keyframes securityPulse { to { background-position: -220% 0; } }
@keyframes securitySpin { to { transform: rotate(360deg); } }
@media (max-width: 1180px) {
  .metric-grid.four { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 980px) {
  .security-shell { padding: 16px; }
  .security-hero { align-items: stretch; flex-direction: column; padding: 22px; }
  .ip-block-top { grid-template-columns: 1fr; }
  .panel-toolbar { align-items: stretch; flex-direction: column; }
  .toolbar-controls { flex-direction: column; }
  .security-input, .security-select { width: 100%; }
}
@media (max-width: 760px) {
  .metric-grid.four { grid-template-columns: 1fr; }
  .security-table-wrap { display: none; }
  .mobile-user-grid { display: grid; gap: 12px; padding: 14px; }
  .mobile-user-card {
    border: 1px solid var(--border-1);
    background: var(--surface-2);
    border-radius: 15px;
    padding: 14px;
  }
  .mobile-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .mobile-card-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }
  .mobile-last-activity {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-top: 12px;
    color: var(--text-tertiary);
    font-size: 12px;
  }
  .mobile-user-card .session-detail-box {
    margin-top: 12px;
  }
  .ip-block-top,
  .blocked-ip-list {
    padding: 16px;
  }
  .ip-block-form,
  .blocked-ip-card {
    grid-template-columns: 1fr;
  }
  .unblock-action {
    width: 100%;
  }
  .blocked-ip-pagination {
    justify-content: center;
  }
  .session-card {
    grid-template-columns: 34px minmax(0, 1fr);
  }
  .session-meta {
    grid-column: 2;
    text-align: left;
    justify-items: start;
  }
  .session-remove-action,
  .session-block-action {
    grid-column: 1 / -1;
    width: 100%;
  }
}
`;
