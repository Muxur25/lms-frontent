import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, User, Shield, BellRing, 
  MonitorSmartphone, Laptop, Globe, CheckCircle2, X 
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { useUIStore } from '../store/useUIStore';
import { useTranslation } from 'react-i18next';
import { getInitials } from '../shared/lib/auth-user';

type TabType = 'profile' | 'security' | 'notifications' | 'system' | 'sessions';

const translations = {
  uz: {
    title: "Sozlamalar",
    subTitle: "Profil, xavfsizlik va tizim parametrlarini boshqarish",
    tabProfile: "Profil ma'lumotlari",
    tabSecurity: "Xavfsizlik va Parol",
    tabNotifications: "Xabarnomalar",
    tabSystem: "Tizim sozlamalari",
    tabSessions: "Qurilmalar va Sessiyalar",
    profileTitle: "Profil sozlamalari",
    securityTitle: "Xavfsizlik sozlamalari",
    notificationsTitle: "Xabarnomalar sozlamalari",
    systemTitle: "Tizim sozlamalari",
    sessionsTitle: "Faol sessiyalar",
    firstName: "Ism",
    lastName: "Familiya",
    email: "Korporativ Email",
    position: "Lavozim",
    department: "Bo'lim",
    cancel: "Bekor qilish",
    save: "Saqlash",
    avatarUpdate: "Suratni yangilash",
    avatarDesc: "Tavsiya etilgan o'lcham: 256x256, Format: JPG, PNG",
    emailNote: "Email manzilni faqat kadrlar bo'limi orqali o'zgartirish mumkin.",
    currentPassword: "Joriy parol",
    newPassword: "Yangi parol",
    confirmPassword: "Yangi parolni tasdiqlash",
    passwordsMismatch: "Yangi parollar mos kelmadi",
    passwordShort: "Parol kamida 6 ta belgidan iborat bo'lishi kerak",
    passwordSuccess: "Parol muvaffaqiyatli yangilandi",
    profileSuccess: "Profil ma'lumotlari muvaffaqiyatli saqlandi",
    emailNotifs: "Email orqali xabarnomalar",
    emailNotifsDesc: "Muhim yangiliklar, darslar va sertifikatlar haqida email xabarlari",
    pushNotifs: "Push xabarnomalar",
    pushNotifsDesc: "Brauzer va mobil ilova orqali tezkor bildirishnomalar",
    weeklyDigests: "Haftalik o'quv hisobotlari",
    weeklyDigestsDesc: "Sizning va bo'limingizning haftalik o'zlashtirish tahlili",
    examReminders: "Imtihon eslatmalari",
    examRemindersDesc: "Yaqinlashayotgan testlar va deadline eslatmalari",
    notifSuccess: "Xabarnoma sozlamalari saqlandi",
    themeLabel: "Interfeys rejimi (Mavzu)",
    themeDark: "To'q rejim (Obisidian)",
    themeLight: "Yorug' rejim (Pearl)",
    themeSystem: "Tizim sozlamasi bo'yicha",
    langLabel: "Tizim tili",
    langUz: "O'zbekcha (Lotin)",
    langRu: "Русский (Кириллица)",
    systemSuccess: "Tizim sozlamalari muvaffaqiyatli saqlandi",
    activeDevice: "Hozir faol qurilma",
    revokeSession: "Sessiyani tugatish",
    revokeAll: "Barcha boshqa sessiyalarni tugatish",
    sessionRevoked: "Sessiya muvaffaqiyatli yakunlandi",
    sessionRevokedAll: "Barcha boshqa sessiyalar yakunlandi",
    browser: "Brauzer",
    os: "Operatsion tizim",
    ipAddress: "IP Manzil",
  },
  ru: {
    title: "Настройки",
    subTitle: "Управление профилем, безопасностью и системными параметрами",
    tabProfile: "Данные профиля",
    tabSecurity: "Безопасность и пароль",
    tabNotifications: "Уведомления",
    tabSystem: "Системные настройки",
    tabSessions: "Устройства и сессии",
    profileTitle: "Настройки профиля",
    securityTitle: "Настройки безопасности",
    notificationsTitle: "Настройки уведомлений",
    systemTitle: "Системные настройки",
    sessionsTitle: "Активные сессии",
    firstName: "Имя",
    lastName: "Фамилия",
    email: "Корпоративный Email",
    position: "Должность",
    department: "Отдел",
    cancel: "Отмена",
    save: "Сохранить",
    avatarUpdate: "Обновить фото",
    avatarDesc: "Рекомендуемый размер: 256x256, Формат: JPG, PNG",
    emailNote: "Email адрес можно изменить только через отдел кадров.",
    currentPassword: "Текущий пароль",
    newPassword: "Новый пароль",
    confirmPassword: "Подтверждение нового пароля",
    passwordsMismatch: "Новые пароли не совпадают",
    passwordShort: "Пароль должен быть не менее 6 символов",
    passwordSuccess: "Пароль успешно обновлен",
    profileSuccess: "Данные профиля успешно сохранены",
    emailNotifs: "Уведомления по email",
    emailNotifsDesc: "Сообщения о важных новостях, уроках и сертификатах на почту",
    pushNotifs: "Push-уведомления",
    pushNotifsDesc: "Мгновенные уведомления в браузере и мобильном приложении",
    weeklyDigests: "Еженедельные отчеты об обучении",
    weeklyDigestsDesc: "Анализ вашей успеваемости и успеваемости вашего отдела за неделю",
    examReminders: "Напоминания об экзаменах",
    examRemindersDesc: "Напоминания о приближающихся тестах и дедлайнах",
    notifSuccess: "Настройки уведомлений сохранены",
    themeLabel: "Режим интерфейса (Тема)",
    themeDark: "Темный режим (Обсидиан)",
    themeLight: "Светлый режим (Перламутр)",
    themeSystem: "Как в системе",
    langLabel: "Язык системы",
    langUz: "O'zbekcha (Lotin)",
    langRu: "Русский (Кириллица)",
    systemSuccess: "Системные настройки успешно сохранены",
    activeDevice: "Активно сейчас",
    revokeSession: "Завершить сессию",
    revokeAll: "Завершить все остальные сессии",
    sessionRevoked: "Сессия успешно завершена",
    sessionRevokedAll: "Все остальные сессии завершены",
    browser: "Браузер",
    os: "Операционная система",
    ipAddress: "IP Адрес",
  }
};

export default function Settings() {
  const { user, updateUser } = useAuthStore();
  const { theme, setTheme, language, setLanguage } = useUIStore();
  const { i18n } = useTranslation();
  
  const isRu = i18n.language === 'ru' || language === 'ru';
  const t = isRu ? translations.ru : translations.uz;

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

  // Sessions State
  const [sessions, setSessions] = useState([
    { id: '1', current: true, browser: 'Chrome', os: 'Windows 11', ip: '192.168.10.114', activeAt: 'Faol hozir' },
    { id: '2', current: false, browser: 'Safari', os: 'iOS 17.4', ip: '83.221.144.12', activeAt: '2 soat oldin' },
    { id: '3', current: false, browser: 'Firefox', os: 'macOS Sonoma', ip: '213.206.56.90', activeAt: '3 kun oldin' }
  ]);

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

  // Submit Profile Changes
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      position
    });
    showToast(t.profileSuccess, 'success');
  };

  // Submit Security Changes
  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast(t.passwordShort, 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast(t.passwordsMismatch, 'error');
      return;
    }
    
    // Simulate API update
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast(t.passwordSuccess, 'success');
  };

  // Submit Notifications Changes
  const handleNotificationsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(t.notifSuccess, 'success');
  };

  // Submit System Changes
  const handleSystemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTheme(localTheme);
    setLanguage(localLang);
    i18n.changeLanguage(localLang);
    showToast(t.systemSuccess, 'success');
  };

  // Terminate Single Session
  const handleRevokeSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    showToast(t.sessionRevoked, 'success');
  };

  // Terminate All Other Sessions
  const handleRevokeAllOther = () => {
    setSessions(prev => prev.filter(s => s.current));
    showToast(t.sessionRevokedAll, 'success');
  };

  const initials = getInitials(firstName, lastName, `${firstName} ${lastName}`);

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
            {t.title}
          </h1>
          <p className="page-sub" style={{ marginTop: 6 }}>{t.subTitle}</p>
        </div>
      </div>

      <div className="grid grid-12">
        {/* Navigation Sidebar Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { id: 'profile', icon: User, label: t.tabProfile },
            { id: 'security', icon: Shield, label: t.tabSecurity },
            { id: 'notifications', icon: BellRing, label: t.tabNotifications },
            { id: 'system', icon: Globe, label: t.tabSystem },
            { id: 'sessions', icon: MonitorSmartphone, label: t.tabSessions }
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
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>{t.profileTitle}</h3>
              
              <div style={{ display: 'flex', gap: 24, marginBottom: 32, alignItems: 'center', paddingBottom: 32, borderBottom: '1px solid var(--border-1)' }}>
                <div style={{ 
                  width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(to top right, var(--blue-500), var(--violet-500))', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff', 
                  boxShadow: '0 8px 32px rgba(59,130,246,0.3)', flexShrink: 0
                }}>
                  {initials}
                </div>
                <div>
                  <button className="btn btn-secondary" style={{ marginBottom: 8 }} type="button">{t.avatarUpdate}</button>
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{t.avatarDesc}</p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="grid grid-2">
                  <div className="input-group">
                    <label className="input-label">{t.firstName}</label>
                    <input type="text" className="input" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t.lastName}</label>
                    <input type="text" className="input" value={lastName} onChange={e => setLastName(e.target.value)} required />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">{t.email}</label>
                  <input type="email" className="input" style={{ background: 'var(--surface-1)', color: 'var(--text-muted)', cursor: 'not-allowed' }} value={user?.email || 'admin@agmk.uz'} disabled />
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>{t.emailNote}</p>
                </div>

                <div className="grid grid-2">
                  <div className="input-group">
                    <label className="input-label">{t.position}</label>
                    <input type="text" className="input" value={position} onChange={e => setPosition(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t.department}</label>
                    <input type="text" className="input" style={{ background: 'var(--surface-1)', color: 'var(--text-muted)', cursor: 'not-allowed' }} value={user?.department || 'AGMK Korporatsiyasi'} disabled />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => { setFirstName(user?.firstName || ''); setLastName(user?.lastName || ''); setPosition(user?.position || ''); }}>{t.cancel}</button>
                  <button type="submit" className="btn btn-primary">{t.save}</button>
                </div>
              </form>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>{t.securityTitle}</h3>
              
              <form onSubmit={handleSecuritySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="input-group">
                  <label className="input-label">{t.currentPassword}</label>
                  <input type="password" className="input" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                </div>
                <div className="grid grid-2">
                  <div className="input-group">
                    <label className="input-label">{t.newPassword}</label>
                    <input type="password" className="input" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t.confirmPassword}</label>
                    <input type="password" className="input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => { setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}>{t.cancel}</button>
                  <button type="submit" className="btn btn-primary">{t.save}</button>
                </div>
              </form>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>{t.notificationsTitle}</h3>
              
              <form onSubmit={handleNotificationsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[
                  { id: 'email', label: t.emailNotifs, desc: t.emailNotifsDesc, val: emailNotifs, setVal: setEmailNotifs },
                  { id: 'push', label: t.pushNotifs, desc: t.pushNotifsDesc, val: pushNotifs, setVal: setPushNotifs },
                  { id: 'weekly', label: t.weeklyDigests, desc: t.weeklyDigestsDesc, val: weeklyDigests, setVal: setWeeklyDigests },
                  { id: 'exams', label: t.examReminders, desc: t.examRemindersDesc, val: examReminders, setVal: setExamReminders }
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
                  <button type="submit" className="btn btn-primary">{t.save}</button>
                </div>
              </form>
            </div>
          )}

          {/* SYSTEM TAB */}
          {activeTab === 'system' && (
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>{t.systemTitle}</h3>
              
              <form onSubmit={handleSystemSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Theme selection */}
                <div className="input-group">
                  <label className="input-label" style={{ marginBottom: 12 }}>{t.themeLabel}</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {[
                      { id: 'dark', label: t.themeDark, color: '#0d1117', border: '#1f2937' },
                      { id: 'light', label: t.themeLight, color: '#f8fafc', border: '#e2e8f0' },
                      { id: 'system', label: t.themeSystem, color: 'linear-gradient(135deg,#0d1117 50%,#f8fafc 50%)', border: '#cbd5e1' }
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
                  <label className="input-label" style={{ marginBottom: 10 }}>{t.langLabel}</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {[
                      { id: 'uz', label: t.langUz },
                      { id: 'ru', label: t.langRu }
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
                  <button type="button" className="btn btn-ghost" onClick={() => { setLocalTheme(theme); setLocalLang(language); }}>{t.cancel}</button>
                  <button type="submit" className="btn btn-primary">{t.save}</button>
                </div>
              </form>
            </div>
          )}

          {/* SESSIONS TAB */}
          {activeTab === 'sessions' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{t.sessionsTitle}</h3>
                {sessions.length > 1 && (
                  <button className="btn btn-sm btn-secondary" onClick={handleRevokeAllOther} style={{ color: 'var(--red-400)', borderColor: 'rgba(239,68,68,0.2)' }}>
                    {t.revokeAll}
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {sessions.map((sess) => (
                  <div 
                    key={sess.id} 
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', 
                      background: 'var(--bg-2)', border: '1px solid var(--border-1)',
                      borderRadius: 'var(--radius-xl)', position: 'relative'
                    }}
                  >
                    <div style={{ 
                      width: 42, height: 42, borderRadius: 10, background: 'var(--surface-1)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)'
                    }}>
                      <Laptop size={20} />
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{sess.browser} — {sess.os}</span>
                        {sess.current ? (
                          <span className="badge badge-green" style={{ fontSize: 9, padding: '1px 6px' }}>{t.activeDevice}</span>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sess.activeAt}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                        {t.ipAddress}: <span style={{ fontFamily: 'var(--font-mono)' }}>{sess.ip}</span>
                      </div>
                    </div>

                    {!sess.current && (
                      <button 
                        onClick={() => handleRevokeSession(sess.id)}
                        className="btn btn-sm btn-secondary"
                        style={{ padding: '6px 12px', fontSize: 11, height: 'fit-content' }}
                      >
                        {t.revokeSession}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
