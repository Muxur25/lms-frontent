import { useEffect, useMemo, useState } from 'react';
import {
  Bell, CheckCircle2, AlertTriangle, Info, ShieldAlert, Search,
  Archive, Trash2, ExternalLink, Send, BarChart3, Sparkles,
  BookOpen, ClipboardCheck, Video, Award, Megaphone, RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationStore, type Notification, type NotificationType, type NotificationPriority } from '@/store/notification.store';
import toast from 'react-hot-toast';

const sections: Array<{ id: 'ALL' | 'UNREAD' | NotificationType; labelKey: string; icon: any }> = [
  { id: 'ALL', labelKey: 'notifications.sections.all', icon: Bell },
  { id: 'UNREAD', labelKey: 'notifications.sections.unread', icon: AlertTriangle },
  { id: 'COURSE', labelKey: 'notifications.sections.courses', icon: BookOpen },
  { id: 'EXAM', labelKey: 'notifications.sections.exams', icon: ClipboardCheck },
  { id: 'WEBINAR', labelKey: 'notifications.sections.webinars', icon: Video },
  { id: 'CERTIFICATE', labelKey: 'notifications.sections.certificates', icon: Award },
  { id: 'SECURITY', labelKey: 'notifications.sections.security', icon: ShieldAlert },
  { id: 'ANNOUNCEMENT', labelKey: 'notifications.sections.announcements', icon: Megaphone },
  { id: 'AI', labelKey: 'notifications.sections.ai', icon: Sparkles },
];

const typeIcon: Record<NotificationType, any> = {
  COURSE: BookOpen,
  EXAM: ClipboardCheck,
  WEBINAR: Video,
  CERTIFICATE: Award,
  SECURITY: ShieldAlert,
  AI: Sparkles,
  ANNOUNCEMENT: Megaphone,
  SYSTEM: Info,
};

const priorityColor: Record<NotificationPriority, string> = {
  LOW: 'var(--text-tertiary)',
  NORMAL: 'var(--blue-400)',
  HIGH: 'var(--amber-400)',
  CRITICAL: 'var(--red-400)',
};

export default function Notifications() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const {
    notifications, unreadCount, loading, error,
    fetchNotifications, markAsRead, markAllAsRead, archive, remove,
  } = useNotificationStore();

  const [section, setSection] = useState<'ALL' | 'UNREAD' | NotificationType>('ALL');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [composerOpen, setComposerOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    titleUz: '',
    titleRu: '',
    messageUz: '',
    messageRu: '',
    type: 'SYSTEM' as NotificationType,
    priority: 'NORMAL' as NotificationPriority,
    targetRoles: '',
    targetDepartments: '',
  });

  const canCreate = ['super_admin', 'admin', 'trainer'].includes(user?.role || '');
  const locale = i18n.language === 'ru' ? 'ru' : 'uz';

  const queryParams = useMemo(() => {
    const params: Record<string, string> = { sort };
    if (section === 'UNREAD') params.unread = 'true';
    if (section !== 'ALL' && section !== 'UNREAD') params.type = section;
    if (search.trim()) params.search = search.trim();
    return params;
  }, [section, search, sort]);

  useEffect(() => {
    fetchNotifications(queryParams);
  }, [fetchNotifications, queryParams]);

  useEffect(() => {
    if (!canCreate) return;
    api.get('/notifications/admin/stats')
      .then((res: any) => setStats(res?.data ?? res))
      .catch(() => setStats(null));
  }, [canCreate]);

  const titleOf = (notification: Notification) => locale === 'ru'
    ? notification.titleRu || notification.titleUz
    : notification.titleUz || notification.titleRu;

  const messageOf = (notification: Notification) => locale === 'ru'
    ? notification.messageRu || notification.messageUz
    : notification.messageUz || notification.messageRu;

  const typeLabel = (type: NotificationType) => t(`notifications.types.${type.toLowerCase()}`);
  const priorityLabel = (priority: NotificationPriority) => t(`notifications.priorities.${priority.toLowerCase()}`);

  const formatDate = (value: string) => new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'uz-UZ', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

  const submitComposer = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    try {
      await api.post('/notifications', {
        ...form,
        targetRoles: form.targetRoles.split(',').map((item) => item.trim()).filter(Boolean),
        targetDepartments: form.targetDepartments.split(',').map((item) => item.trim()).filter(Boolean),
      });
      setComposerOpen(false);
      setForm({ ...form, titleUz: '', titleRu: '', messageUz: '', messageRu: '', targetRoles: '', targetDepartments: '' });
      toast.success(t('notifications.form.sent', 'Xabarnoma yuborildi'));
      fetchNotifications(queryParams);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || t('notifications.form.sendError', 'Xabarnomani yuborib bo‘lmadi'));
    } finally {
      setSending(false);
    }
  };

  const openRelated = (notification: Notification) => {
    if (notification.actionUrl) window.location.href = notification.actionUrl;
  };

  return (
    <div className="fade-in" style={{ display: 'grid', gap: 20 }}>
      <div className="page-header" style={{ alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell color="var(--amber-400)" size={24} />
            {t('notifications.title')}
          </h1>
          <p className="page-sub" style={{ marginTop: 6 }}>{t('notifications.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => fetchNotifications(queryParams)}>
            <RefreshCw size={16} />
            {t('common.refresh')}
          </button>
          {unreadCount > 0 && (
            <button className="btn btn-secondary" onClick={markAllAsRead}>
              <CheckCircle2 size={16} />
              {t('notifications.markAllRead')}
            </button>
          )}
          {canCreate && (
            <button className="btn btn-primary" onClick={() => setComposerOpen((value) => !value)}>
              <Send size={16} />
              {t('notifications.compose')}
            </button>
          )}
        </div>
      </div>

      {canCreate && stats && (
        <div className="grid grid-4">
          {[
            [t('notifications.stats.sent'), stats.sent, Bell],
            [t('notifications.stats.readRate'), `${stats.readRate}%`, BarChart3],
            [t('notifications.stats.unread'), stats.unread, AlertTriangle],
            [t('notifications.stats.critical'), stats.critical, ShieldAlert],
          ].map(([label, value, Icon]: any) => (
            <div key={label} className="stat-card">
              <div className="stat-header">
                <div className="stat-icon" style={{ background: 'var(--surface-2)', color: 'var(--blue-400)' }}>
                  <Icon size={20} />
                </div>
              </div>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      )}

      {composerOpen && (
        <motion.form
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={submitComposer}
          className="card"
          style={{ display: 'grid', gap: 16 }}
        >
          <div className="grid grid-2">
            <input className="input" placeholder={t('notifications.form.titleUz')} value={form.titleUz} onChange={(e) => setForm({ ...form, titleUz: e.target.value })} required />
            <input className="input" placeholder={t('notifications.form.titleRu')} value={form.titleRu} onChange={(e) => setForm({ ...form, titleRu: e.target.value })} />
          </div>
          <div className="grid grid-2">
            <textarea className="input" placeholder={t('notifications.form.messageUz')} value={form.messageUz} onChange={(e) => setForm({ ...form, messageUz: e.target.value })} required style={{ minHeight: 90 }} />
            <textarea className="input" placeholder={t('notifications.form.messageRu')} value={form.messageRu} onChange={(e) => setForm({ ...form, messageRu: e.target.value })} style={{ minHeight: 90 }} />
          </div>
          <div className="grid grid-4">
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as NotificationType })}>
              {['SYSTEM', 'COURSE', 'EXAM', 'WEBINAR', 'CERTIFICATE', 'SECURITY', 'AI', 'ANNOUNCEMENT'].map((item) => <option key={item}>{item}</option>)}
            </select>
            <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as NotificationPriority })}>
              {['LOW', 'NORMAL', 'HIGH', 'CRITICAL'].map((item) => <option key={item}>{item}</option>)}
            </select>
            <input className="input" placeholder={t('notifications.form.targetRoles')} value={form.targetRoles} onChange={(e) => setForm({ ...form, targetRoles: e.target.value })} />
            <input className="input" placeholder={t('notifications.form.targetDepartments')} value={form.targetDepartments} onChange={(e) => setForm({ ...form, targetDepartments: e.target.value })} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" type="submit" disabled={sending}>
              <Send size={16} /> {sending ? t('common.sending', 'Yuborilmoqda...') : t('notifications.form.send')}
            </button>
          </div>
        </motion.form>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 10, padding: 16, borderBottom: '1px solid var(--border-1)', flexWrap: 'wrap' }}>
          <div className="input" style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 260px' }}>
            <Search size={16} color="var(--text-tertiary)" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('notifications.search')}
              style={{ border: 0, outline: 0, background: 'transparent', color: 'var(--text-primary)', width: '100%' }}
            />
          </div>
          <select className="input" value={sort} onChange={(event) => setSort(event.target.value as 'newest' | 'oldest')} style={{ maxWidth: 160 }}>
            <option value="newest">{t('notifications.sortNewest')}</option>
            <option value="oldest">{t('notifications.sortOldest')}</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 8, padding: '14px 16px', overflowX: 'auto', borderBottom: '1px solid var(--border-1)' }}>
          {sections.map((item) => (
            <button
              key={item.id}
              className={`btn btn-sm ${section === item.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSection(item.id)}
            >
              <item.icon size={14} />
              {t(item.labelKey)}
            </button>
          ))}
        </div>

        {loading && <div style={{ padding: 32, color: 'var(--text-secondary)', textAlign: 'center' }}>{t('common.loading')}</div>}
        {!loading && error && <div style={{ padding: 32, color: 'var(--red-400)', textAlign: 'center' }}>{t('notifications.loadError')}</div>}
        {!loading && !error && notifications.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>
            {t('notifications.empty')}
          </div>
        )}

        {!loading && notifications.map((notification, index) => {
          const Icon = typeIcon[notification.type] || Info;
          const critical = notification.priority === 'CRITICAL';
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: 20,
                borderBottom: index !== notifications.length - 1 ? '1px solid var(--border-1)' : 'none',
                display: 'flex',
                gap: 16,
                background: notification.isRead ? 'transparent' : critical ? 'rgba(239,68,68,0.07)' : 'rgba(59,130,246,0.04)',
              }}
            >
              <div style={{ paddingTop: 2, color: priorityColor[notification.priority] }}>
                <Icon size={22} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 4 }}>
                  <h4 style={{ fontWeight: 700, fontSize: 15, color: notification.isRead ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                    {titleOf(notification)}
                  </h4>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{formatDate(notification.createdAt)}</span>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{messageOf(notification)}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <span className={`badge ${critical ? 'badge-red' : 'badge-blue'}`}>{priorityLabel(notification.priority)}</span>
                  <span className="badge badge-violet">{typeLabel(notification.type)}</span>
                  {notification.metadata?.mandatory && <span className="badge badge-amber">{t('notifications.mandatory')}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {!notification.isRead && (
                  <button className="btn btn-sm btn-secondary" title={t('notifications.actions.markRead')} onClick={() => markAsRead(notification.id)}><CheckCircle2 size={14} /></button>
                )}
                {notification.actionUrl && (
                  <button className="btn btn-sm btn-secondary" title={t('notifications.actions.open')} onClick={() => openRelated(notification)}><ExternalLink size={14} /></button>
                )}
                <button className="btn btn-sm btn-secondary" title={t('notifications.actions.archive')} onClick={() => archive(notification.id)}><Archive size={14} /></button>
                <button className="btn btn-sm btn-secondary" title={t('notifications.actions.delete')} onClick={() => remove(notification.id)} style={{ color: 'var(--red-400)' }}><Trash2 size={14} /></button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
