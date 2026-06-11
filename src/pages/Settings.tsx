import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, User, Shield, BellRing, 
  MonitorSmartphone, Laptop, Globe, CheckCircle2, X 
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { useUIStore } from '../store/useUIStore';
import { useTranslation } from 'react-i18next';
import { getInitials } from '../shared/lib/auth-user';
import { api } from '../services/api';

type TabType = 'profile' | 'security' | 'notifications' | 'system' | 'sessions';

type DeviceInfo = {
  id: string;
  browser?: string | null;
  operatingSystem?: string | null;
  deviceType?: string | null;
  ipAddress?: string | null;
  lastActivity?: string | null;
};

type SessionInfo = {
  id: string;
  current?: boolean;
  lastActivity?: string | null;
  expiresAt?: string | null;
  device?: DeviceInfo | null;
};



export default function Settings() {
  const { user, updateUser } = useAuthStore();
  const { theme, setTheme, language, setLanguage } = useUIStore();
  const { t, i18n } = useTranslation();

  // Active Tab State
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Feedback Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form Fields States
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [position, setPosition] = useState(user?.position || '');
  
  // Security Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification Toggle States
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [weeklyDigests, setWeeklyDigests] = useState(false);
  const [examReminders, setExamReminders] = useState(true);

  // System States (Local reflection)
  const [localTheme, setLocalTheme] = useState(theme);
  const [localLang, setLocalLang] = useState(language);

  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState('');

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPosition(user.position || '');
    }
  }, [user]);

  // Sync local selection when store theme/lang updates
  useEffect(() => {
    setLocalTheme(theme);
  }, [theme]);

  useEffect(() => {
    setLocalLang(language);
  }, [language]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const loadSessions = async () => {
    setSessionsLoading(true);
    setSessionsError('');

    try {
      const response: any = await api.get('/security/sessions');
      const payload = response?.data ?? response;
      setSessions(Array.isArray(payload) ? payload : []);
    } catch {
      setSessionsError('Sessiyalarni yuklashda xatolik yuz berdi.');
      showToast('Sessiyalarni yuklashda xatolik yuz berdi.', 'error');
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'sessions') {
      loadSessions();
    }
  }, [activeTab]);

  const formatSessionDate = (value?: string | null) => {
    if (!value) return 'Noma\'lum';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Noma\'lum';

    return new Intl.DateTimeFormat(i18n.language === 'ru' ? 'ru-RU' : 'uz-UZ', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getSessionIcon = (deviceType?: string | null) => {
    const normalized = (deviceType || '').toLowerCase();
    return normalized.includes('mobile') || normalized.includes('tablet')
      ? <MonitorSmartphone size={20} />
      : <Laptop size={20} />;
  };

  // Submit Profile Changes
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.patch('/users/me', {
        firstName,
        lastName,
        position
      });
      const updatedData = res.data?.user || res.data;
      updateUser({
        firstName: updatedData.firstName || firstName,
        lastName: updatedData.lastName || lastName,
        fullName: updatedData.fullName || `${firstName} ${lastName}`.trim(),
        position: updatedData.position || position
      });
      showToast(t('settings.profileSuccess'), 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Xatolik yuz berdi', 'error');
    }
  };

  // Submit Security Changes
  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast(t('settings.passwordShort'), 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast(t('settings.passwordsMismatch'), 'error');
      return;
    }
    
    try {
      await api.patch('/users/me/password', {
        currentPassword,
        newPassword
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast(t('settings.passwordSuccess'), 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Xatolik yuz berdi', 'error');
    }
  };

  // Submit Notifications Changes
  const handleNotificationsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(t('settings.notifSuccess'), 'success');
  };

  // Submit System Changes
  const handleSystemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTheme(localTheme);
    setLanguage(localLang);
    i18n.changeLanguage(localLang);
    showToast(t('settings.systemSuccess'), 'success');
  };

  // Terminate Single Session
  const handleRevokeSession = async (id: string) => {
    try {
      await api.delete(`/security/sessions/${id}`);
      setSessions(prev => prev.filter(s => s.id !== id));
      showToast(t('settings.sessionRevoked'), 'success');
    } catch {
      showToast('Sessiyani tugatib bo\'lmadi.', 'error');
    }
  };

  // Terminate All Other Sessions
  const handleRevokeAllOther = async () => {
    try {
      await api.delete('/security/sessions');
      setSessions(prev => prev.filter(s => s.current));
      showToast(t('settings.sessionRevokedAll'), 'success');
    } catch {
      showToast('Boshqa sessiyalarni tugatib bo\'lmadi.', 'error');
    }
  };

  const initials = getInitials(firstName, lastName, `${firstName} ${lastName}`);
  const otherSessions = sessions.filter((sess) => !sess.current);

  return (
    <div className="fade-in">
      {/* Toast Feedback */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          display: 'flex', alignItems: 'center', gap: 10,
          background: toast.type === 'success' ? 'rgba(34,197,94,0.95)' : 'rgba(239,68,68,0.95)',
          color: '#fff', padding: '14px 20px', borderRadius: 'var(--radius-lg)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)',
          fontWeight: 600, fontSize: 13, border: '1px solid rgba(255,255,255,0.1)'
        }} className="toast-enter">
          <CheckCircle2 size={16} />
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', marginLeft: 6 }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SettingsIcon color="var(--text-secondary)" size={24} />
            {t('settings.title')}
          </h1>
          <p className="page-sub" style={{ marginTop: 6 }}>{t('settings.subTitle')}</p>
        </div>
      </div>

      <div className="grid grid-12">
        {/* Navigation Sidebar Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { id: 'profile', icon: User, label: t('settings.tabProfile') },
            { id: 'security', icon: Shield, label: t('settings.tabSecurity') },
            { id: 'notifications', icon: BellRing, label: t('settings.tabNotifications') },
            { id: 'system', icon: Globe, label: t('settings.tabSystem') },
            { id: 'sessions', icon: MonitorSmartphone, label: t('settings.tabSessions') }
          ].map((item) => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id as TabType)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', 
                background: activeTab === item.id ? 'var(--surface-2)' : 'var(--bg-2)', 
                border: activeTab === item.id ? '1px solid var(--blue-500)' : '1px solid var(--border-1)', 
                color: activeTab === item.id ? 'var(--blue-400)' : 'var(--text-secondary)', 
                borderRadius: 'var(--radius-xl)', 
                fontWeight: activeTab === item.id ? 700 : 500, 
                textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: activeTab === item.id ? 'var(--shadow-blue)' : 'none'
              }}
            >
              <item.icon size={18} /> 
              {item.label}
            </button>
          ))}
        </div>

        {/* Tab Content Cards */}
        <div className="card" style={{ padding: 28 }}>
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>{t('settings.profileTitle')}</h3>
              
              <div style={{ display: 'flex', gap: 24, marginBottom: 32, alignItems: 'center', paddingBottom: 32, borderBottom: '1px solid var(--border-1)' }}>
                <div style={{ 
                  width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(to top right, var(--blue-500), var(--violet-500))', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff', 
                  boxShadow: '0 8px 32px rgba(59,130,246,0.3)', flexShrink: 0
                }}>
                  {initials}
                </div>
                <div>
                  <button className="btn btn-secondary" style={{ marginBottom: 8 }} type="button">{t('settings.avatarUpdate')}</button>
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{t('settings.avatarDesc')}</p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="grid grid-2">
                  <div className="input-group">
                    <label className="input-label">{t('settings.firstName')}</label>
                    <input type="text" className="input" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('settings.lastName')}</label>
                    <input type="text" className="input" value={lastName} onChange={e => setLastName(e.target.value)} required />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">{t('settings.email')}</label>
                  <input type="email" className="input" style={{ background: 'var(--surface-1)', color: 'var(--text-muted)', cursor: 'not-allowed' }} value={user?.email || 'admin@agmk.uz'} disabled />
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>{t('settings.emailNote')}</p>
                </div>

                <div className="grid grid-2">
                  <div className="input-group">
                    <label className="input-label">{t('settings.position')}</label>
                    <input type="text" className="input" value={position} onChange={e => setPosition(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('settings.department')}</label>
                    <input type="text" className="input" style={{ background: 'var(--surface-1)', color: 'var(--text-muted)', cursor: 'not-allowed' }} value={user?.department || 'AGMK Korporatsiyasi'} disabled />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => { setFirstName(user?.firstName || ''); setLastName(user?.lastName || ''); setPosition(user?.position || ''); }}>{t('settings.cancel')}</button>
                  <button type="submit" className="btn btn-primary">{t('settings.save')}</button>
                </div>
              </form>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>{t('settings.securityTitle')}</h3>
              
              <form onSubmit={handleSecuritySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="input-group">
                  <label className="input-label">{t('settings.currentPassword')}</label>
                  <input type="password" className="input" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                </div>
                <div className="grid grid-2">
                  <div className="input-group">
                    <label className="input-label">{t('settings.newPassword')}</label>
                    <input type="password" className="input" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('settings.confirmPassword')}</label>
                    <input type="password" className="input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => { setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}>{t('settings.cancel')}</button>
                  <button type="submit" className="btn btn-primary">{t('settings.save')}</button>
                </div>
              </form>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>{t('settings.notificationsTitle')}</h3>
              
              <form onSubmit={handleNotificationsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[
                  { id: 'email', label: t('settings.emailNotifs'), desc: t('settings.emailNotifsDesc'), val: emailNotifs, setVal: setEmailNotifs },
                  { id: 'push', label: t('settings.pushNotifs'), desc: t('settings.pushNotifsDesc'), val: pushNotifs, setVal: setPushNotifs },
                  { id: 'weekly', label: t('settings.weeklyDigests'), desc: t('settings.weeklyDigestsDesc'), val: weeklyDigests, setVal: setWeeklyDigests },
                  { id: 'exams', label: t('settings.examReminders'), desc: t('settings.examRemindersDesc'), val: examReminders, setVal: setExamReminders }
                ].map((item) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--border-1)' }}>
                    <div style={{ paddingRight: 16 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{item.desc}</div>
                    </div>
                    <div 
                      className={`toggle ${item.val ? 'active' : ''}`} 
                      onClick={() => item.setVal(!item.val)}
                    >
                      <div className="toggle-thumb" />
                    </div>
                  </div>
                ))}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                  <button type="submit" className="btn btn-primary">{t('settings.save')}</button>
                </div>
              </form>
            </div>
          )}

          {/* SYSTEM TAB */}
          {activeTab === 'system' && (
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>{t('settings.systemTitle')}</h3>
              
              <form onSubmit={handleSystemSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Theme selection */}
                <div className="input-group">
                  <label className="input-label" style={{ marginBottom: 12 }}>{t('settings.themeLabel')}</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {[
                      { id: 'dark', label: t('settings.themeDark'), color: '#0d1117', border: '#1f2937' },
                      { id: 'light', label: t('settings.themeLight'), color: '#f8fafc', border: '#e2e8f0' },
                      { id: 'system', label: t('settings.themeSystem'), color: 'linear-gradient(135deg,#0d1117 50%,#f8fafc 50%)', border: '#cbd5e1' }
                    ].map((mode) => (
                      <button 
                        key={mode.id} 
                        type="button" 
                        onClick={() => setLocalTheme(mode.id as 'dark' | 'light' | 'system')}
                        style={{
                          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '16px 12px',
                          background: 'var(--bg-2)', border: localTheme === mode.id ? '2px solid var(--blue-500)' : '1px solid var(--border-2)',
                          borderRadius: 'var(--radius-xl)', cursor: 'pointer', transition: 'all 0.2s', position: 'relative'
                        }}
                      >
                        <div style={{
                          width: 48, height: 32, borderRadius: 6, border: `1px solid ${mode.border}`,
                          background: mode.color, display: 'flex'
                        }} />
                        <span style={{ fontSize: 12, fontWeight: localTheme === mode.id ? 700 : 500, color: 'var(--text-primary)' }}>{mode.label}</span>
                        {localTheme === mode.id && (
                          <div style={{
                            position: 'absolute', top: 8, right: 8, background: 'var(--blue-500)', 
                            color: '#fff', borderRadius: '50%', width: 14, height: 14, 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8
                          }}>✓</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language selection */}
                <div className="input-group">
                  <label className="input-label" style={{ marginBottom: 10 }}>{t('settings.langLabel')}</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {[
                      { id: 'uz', label: t('settings.langUz') },
                      { id: 'ru', label: t('settings.langRu') }
                    ].map((langItem) => (
                      <button 
                        key={langItem.id} 
                        type="button" 
                        onClick={() => setLocalLang(langItem.id as 'uz' | 'ru')}
                        style={{
                          flex: 1, padding: 14, background: localLang === langItem.id ? 'var(--surface-2)' : 'var(--bg-2)',
                          border: localLang === langItem.id ? '1px solid var(--blue-500)' : '1px solid var(--border-1)',
                          color: localLang === langItem.id ? 'var(--blue-400)' : 'var(--text-secondary)',
                          borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'all 0.2s',
                          fontWeight: localLang === langItem.id ? 700 : 500, fontSize: 13
                        }}
                      >
                        {langItem.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => { setLocalTheme(theme); setLocalLang(language); }}>{t('settings.cancel')}</button>
                  <button type="submit" className="btn btn-primary">{t('settings.save')}</button>
                </div>
              </form>
            </div>
          )}

          {/* SESSIONS TAB */}
          {activeTab === 'sessions' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{t('settings.sessionsTitle')}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>
                    Login qilingan qurilmalarni nazorat qiling va keraksiz sessiyalarni chiqarib yuboring.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="btn btn-sm btn-secondary" onClick={loadSessions} disabled={sessionsLoading}>
                    {sessionsLoading ? 'Yuklanmoqda...' : 'Yangilash'}
                  </button>
                  {otherSessions.length > 0 && (
                    <button className="btn btn-sm btn-secondary" onClick={handleRevokeAllOther} style={{ color: 'var(--red-400)', borderColor: 'rgba(239,68,68,0.2)' }}>
                      {t('settings.revokeAll')}
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {sessionsLoading && sessions.length === 0 && (
                  <div style={{ padding: 24, border: '1px dashed var(--border-2)', borderRadius: 'var(--radius-xl)', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    Sessiyalar yuklanmoqda...
                  </div>
                )}

                {!sessionsLoading && sessionsError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 16, border: '1px solid rgba(239,68,68,0.18)', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-xl)', color: 'var(--red-400)' }}>
                    <X size={18} />
                    {sessionsError}
                  </div>
                )}

                {!sessionsLoading && !sessionsError && sessions.length === 0 && (
                  <div style={{ padding: 24, border: '1px dashed var(--border-2)', borderRadius: 'var(--radius-xl)', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    Faol sessiyalar topilmadi.
                  </div>
                )}

                {sessions.map((sess) => {
                  const device = sess.device;
                  const browser = device?.browser || 'Unknown Browser';
                  const os = device?.operatingSystem || 'Unknown OS';
                  const ip = device?.ipAddress || 'Noma\'lum';
                  const activeAt = formatSessionDate(device?.lastActivity || sess.lastActivity);

                  return (
                    <div 
                      key={sess.id} 
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', 
                        background: sess.current ? 'linear-gradient(135deg, rgba(34,197,94,0.08), var(--bg-2))' : 'var(--bg-2)',
                        border: sess.current ? '1px solid rgba(34,197,94,0.22)' : '1px solid var(--border-1)',
                        borderRadius: 'var(--radius-xl)', position: 'relative'
                      }}
                    >
                      <div style={{ 
                        width: 42, height: 42, borderRadius: 10, background: 'var(--surface-1)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: sess.current ? 'var(--green-400)' : 'var(--text-secondary)'
                      }}>
                        {getSessionIcon(device?.deviceType)}
                      </div>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{browser} - {os}</span>
                          {sess.current ? (
                            <span className="badge badge-green" style={{ fontSize: 9, padding: '1px 6px' }}>{t('settings.activeDevice')}</span>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{activeAt}</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                          <span>{t('settings.ipAddress')}: <span style={{ fontFamily: 'var(--font-mono)' }}>{ip}</span></span>
                          <span>Oxirgi faollik: {activeAt}</span>
                        </div>
                      </div>

                      {!sess.current && (
                        <button 
                          onClick={() => handleRevokeSession(sess.id)}
                          className="btn btn-sm btn-secondary"
                          style={{ padding: '6px 12px', fontSize: 11, height: 'fit-content', color: 'var(--red-400)' }}
                        >
                          {t('settings.revokeSession')}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
