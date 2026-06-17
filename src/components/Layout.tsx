import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import {
  LayoutDashboard, BookOpen, GraduationCap, ClipboardCheck,
  Award, BarChart3, Sparkles, Video, Library, Bell,
  Settings, ShieldCheck, ChevronLeft, ChevronRight,
  Search, Menu, Command, Building2, Sun, Moon,
  ChevronDown, LogOut, User, HelpCircle, Plus,
  Home, Layers, Trophy, Star, FileText
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationStore } from '@/store/notification.store';
import { useUIStore } from '@/store/useUIStore';
import { getInitials } from '@/shared/lib/auth-user';
import ProfileModal from './ProfileModal';
import AddCourseModal from './AddCourseModal';
import { CreateExamWizard } from './exam/CreateExamWizard';
import toast from 'react-hot-toast';

/* ─── Types ────────────────────────────────────────────────── */
interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  activePage: string;
  setActivePage: (v: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

interface TopbarProps {
  activePage: string;
  setActivePage: (v: string) => void;
  setMobileOpen: (v: boolean) => void;
  lang: string;
  setLang: (v: string) => void;
  theme: string;
  setTheme: (v: string) => void;
}

/* ─── Nav Config ────────────────────────────────────────────── */
const NAV = [
  {
    section: 'nav.main',
    items: [
      { id: 'dashboard',      icon: LayoutDashboard, label: 'nav.dashboard',      badge: null },
      { id: 'courses',        icon: BookOpen,         label: 'nav.courses',        badge: null },
      { id: 'mylearning',     icon: GraduationCap,   label: 'nav.myLearning',     badge: '3'  },
      { id: 'assessments',    icon: ClipboardCheck,  label: 'nav.assessments',    badge: '5'  },
      { id: 'certifications', icon: Award,           label: 'nav.certifications', badge: null },
      { id: 'leaderboard',    icon: Trophy,          label: 'nav.leaderboard',    badge: null },
      { id: 'achievements',   icon: Star,            label: 'nav.achievements',   badge: null },
    ],
  },
  {
    section: 'nav.tools',
    items: [
      { id: 'analytics',   icon: BarChart3, label: 'nav.analytics',  badge: null },
      { id: 'ai',          icon: Sparkles,  label: 'nav.ai',         badge: 'AI' },
      { id: 'webinars',    icon: Video,     label: 'nav.webinars',   badge: null },
      { id: 'library',     icon: Library,   label: 'nav.library',    badge: null },
      { id: 'schedule',    icon: Layers,    label: 'nav.schedule',   badge: null },
    ],
  },
  {
    section: 'nav.system',
    items: [
      { id: 'notifications', icon: Bell,        label: 'nav.notifications', badge: '8' },
      { id: 'settings',      icon: Settings,    label: 'nav.settings',      badge: null },
      { id: 'security',      icon: ShieldCheck, label: 'nav.security',      badge: null },
      { id: 'enterprise',    icon: Building2,   label: 'nav.enterprise',    badge: null },
      { id: 'admin',         icon: ShieldCheck, label: 'nav.admin',         badge: null },
      { id: 'admin/security', icon: ShieldCheck, label: 'nav.adminSecurity', badge: null },
    ],
  },
];

const BOTTOM_NAV = [
  { id: 'dashboard', icon: Home,         label: 'nav.dashboard' },
  { id: 'courses',   icon: BookOpen,     label: 'nav.courses'   },
  { id: 'mylearning',icon: GraduationCap,label: 'nav.myLearning'},
  { id: 'analytics', icon: BarChart3,    label: 'nav.analytics' },
  { id: 'settings',  icon: Settings,     label: 'nav.settings'  },
];

/* ─── Sidebar ───────────────────────────────────────────────── */
export function Sidebar({ collapsed, setCollapsed, activePage, setActivePage, mobileOpen, setMobileOpen }: SidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const initials = getInitials(user?.firstName, user?.lastName, user?.fullName);
  const fullName = user?.fullName || `${user?.firstName || 'AGMK'} ${user?.lastName || 'User'}`.trim();

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  return (
    <>
      {mobileOpen && (
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={clsx('sidebar', collapsed && 'collapsed', mobileOpen && 'mobile-open')}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon">L</div>
          {!collapsed && (
            <>
              <div style={{ flex: 1 }}>
                <div className="logo-text">AGMK LMS</div>
                <div className="logo-sub">Enterprise Platform</div>
              </div>
              <button
                className="collapse-btn"
                onClick={() => setCollapsed(true)}
                title={t('layout.collapse')}
              >
                <ChevronLeft size={15} />
              </button>
            </>
          )}
          {collapsed && (
            <button
              className="collapse-btn"
              style={{ position: 'absolute', right: -13, top: 40, zIndex: 100, boxShadow: 'var(--shadow-sm)' }}
              onClick={() => setCollapsed(false)}
            >
              <ChevronRight size={13} />
            </button>
          )}
        </div>

        {/* Org Selector */}
        {!collapsed && (
          <div className="org-selector">
            <div className="org-icon"><Building2 size={14} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="org-name">{t('layout.orgName')}</div>
              <div className="org-sub">{t('layout.orgSub')}</div>
            </div>
            <ChevronDown size={13} color="var(--text-muted)" />
          </div>
        )}

        <nav className="sidebar-nav">
          {NAV.map(section => {
            const items = section.items.filter(item => {
              if (item.id === 'admin') {
                return user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'hr_manager';
              }
              if (item.id === 'admin/security') {
                return user?.role === 'super_admin' || user?.role === 'admin';
              }
              if (item.id === 'enterprise') {
                return user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'hr_manager';
              }
              return true;
            });
            if (items.length === 0) return null;
            return (
              <div key={section.section}>
                <div className="nav-section-label">{t(section.section)}</div>
                {items.map(item => {
                  const dynamicItem = item.id === 'notifications'
                    ? { ...item, badge: unreadCount > 0 ? unreadCount.toString() : null }
                    : item;
                  return (
                    <NavItem
                      key={item.id}
                      item={dynamicItem}
                      active={activePage === item.id}
                      collapsed={collapsed}
                      onClick={() => { setActivePage(item.id); setMobileOpen(false); }}
                      t={t}
                    />
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* AI Quick Access */}
        {!collapsed && (
          <div className="ai-promo">
            <div className="ai-promo-icon"><Sparkles size={14} /></div>
            <div>
              <div className="ai-promo-title">{t('layout.aiPromoTitle')}</div>
              <div className="ai-promo-sub">{t('layout.aiPromoSub')}</div>
            </div>
            <button className="btn btn-primary btn-sm" style={{ padding: '4px 10px', fontSize: 11 }}>{t('layout.aiPromoOpen')}</button>
          </div>
        )}

        {/* Footer User */}
        <div className="sidebar-footer">
          <div className="user-card" title={collapsed ? fullName : undefined}>
            <div className="avatar" style={{ overflow: 'hidden' }}>
              {(user as any)?.avatarName ? (
                <img src={(user as any).avatarName} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (user as any)?.avatar ? (
                <img src={(user as any).avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                initials
              )}
            </div>
            {!collapsed && (
              <>
                <div className="user-info">
                  <div className="user-name">{fullName}</div>
                  <div className="user-role" style={{ color: '#fbbf24', fontWeight: 600 }}>
                    Lvl {user?.level || 1} • {user?.title || 'Beginner'}
                  </div>
                </div>
                <button className="icon-btn" onClick={handleLogout} style={{ width: 28, height: 28, minWidth: 28 }}>
                  <LogOut size={13} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

function NavItem({ item, active, collapsed, onClick, t }: {
  item: typeof NAV[0]['items'][0];
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
  t: (k: string) => string;
}) {
  const isAI = item.id === 'ai';
  return (
    <div
      className={clsx('nav-item', active && 'active', isAI && 'nav-item-ai')}
      onClick={onClick}
      title={collapsed ? t(item.label) : undefined}
    >
      <div className="nav-icon">
        <item.icon size={18} />
      </div>
      {!collapsed && <span className="nav-label">{t(item.label)}</span>}
      {!collapsed && item.badge && (
        <span className={clsx('nav-badge', item.badge === 'AI' && 'nav-badge-ai')}>
          {item.badge}
        </span>
      )}
      {collapsed && item.badge && item.badge !== 'AI' && (
        <span className="nav-badge-dot" />
      )}
    </div>
  );
}

/* ─── Topbar ────────────────────────────────────────────────── */
export function Topbar({ activePage, setActivePage, setMobileOpen, lang, setLang, theme, setTheme }: TopbarProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const { activeModal, openModal, closeModal } = useUIStore();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ courses: any[]; users: any[] }>({ courses: [], users: [] });
  const [profileOpen, setProfileOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const role = user?.role || user?.roles?.[0] || 'employee';
  const canQuickAdd = ['super_admin', 'admin', 'trainer'].includes(role);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCmdOpen((open) => !open);
      }
      if (e.key === 'Escape' && cmdOpen) {
        setCmdOpen(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [cmdOpen]);

  useEffect(() => {
    if (!cmdOpen) {
      setSearchQuery('');
      setSearchResults({ courses: [], users: [] });
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        api.get(`/search?q=${encodeURIComponent(searchQuery)}`)
          .then(res => {
            setSearchResults(res.data || { courses: [], users: [] });
          })
          .catch(() => {})
          .finally(() => setIsSearching(false));
      } else {
        setSearchResults({ courses: [], users: [] });
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, cmdOpen]);

  const isProfileModalOpen = activeModal === 'profile';
  const initials = getInitials(user?.firstName, user?.lastName, user?.fullName);
  const fullName = user?.fullName || `${user?.firstName || 'AGMK'} ${user?.lastName || 'User'}`.trim();
  const shortName = user?.firstName ? `${user.firstName} ${user.lastName?.[0] || ''}.` : fullName;
  const roleLabel = user?.roleLabel || user?.roles?.[0] || 'User';

  const handleLogout = async () => {
    await logout();
    setProfileOpen(false);
    navigate('/auth/login');
  };

  const switchLang = (l: string) => { setLang(l); i18n.changeLanguage(l); };
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const pageLabels: Record<string, string> = {
    dashboard: t('nav.dashboard'), courses: t('nav.courses'),
    mylearning: t('nav.myLearning'), analytics: t('nav.analytics'),
    assessments: t('nav.assessments'), certifications: t('nav.certifications'),
    leaderboard: t('nav.leaderboard'),
    schedule: t('nav.schedule'), settings: t('nav.settings'),
    security: t('nav.security'), 'admin/security': t('nav.adminSecurity'),
    notifications: t('nav.notifications'), admin: t('nav.admin'),
    ai: t('nav.ai'), webinars: t('nav.webinars'),
    library: t('nav.library'), enterprise: t('nav.enterprise'),
  };

  return (
    <>
      <header className="topbar">
        <button className="icon-btn mobile-menu-btn" onClick={() => setMobileOpen(true)}>
          <Menu size={18} />
        </button>

        <div className="topbar-breadcrumb">
          <span className="topbar-title">{pageLabels[activePage] || activePage}</span>
        </div>

        <div className="topbar-sep" />

        {/* Search / Command */}
        <button className="cmd-bar" onClick={() => setCmdOpen(true)}>
          <Search size={14} color="var(--text-muted)" />
          <span className="cmd-placeholder">{t('common.search')}...</span>
          <span className="cmd-hint"><Command size={10} />K</span>
        </button>

        {/* Lang */}
        <div className="lang-switcher">
          <button className={clsx('lang-btn', lang === 'uz' && 'active')} onClick={() => switchLang('uz')}>UZ</button>
          <button className={clsx('lang-btn', lang === 'ru' && 'active')} onClick={() => switchLang('ru')}>RU</button>
        </div>

        {/* Theme */}
        <div className="tooltip-wrap">
          <button className="icon-btn" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <span className="tooltip">{theme === 'dark' ? t('layout.lightMode') : t('layout.darkMode')}</span>
        </div>

        {/* Notifications */}
        <div className="tooltip-wrap">
          <button className="icon-btn" id="notif-btn" onClick={() => setActivePage('notifications')}>
            <Bell size={17} />
            {unreadCount > 0 && <span className="notif-dot" />}
          </button>
          <span className="tooltip">
            {unreadCount > 0 ? `${unreadCount} ${t('layout.newNotif')}` : t('layout.noNotif')}
          </span>
        </div>

        {/* Quick Add */}
        {canQuickAdd && (
          <div className="profile-wrap">
            <button className="icon-btn quick-add-btn" onClick={() => setQuickAddOpen(!quickAddOpen)}>
              <Plus size={17} />
            </button>
            {quickAddOpen && (
              <div className="profile-dropdown" style={{ right: 0, width: 220 }} onClick={() => setQuickAddOpen(false)}>
                <div className="pd-header" style={{ padding: '12px 16px', paddingBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-secondary)' }}>Tezkor yaratish</div>
                </div>
                <div className="pd-item" onClick={() => { openModal('addCourse'); setQuickAddOpen(false); }}>
                  <BookOpen size={14} color="var(--blue-400)" />
                  <span>Yangi kurs</span>
                </div>
                <div className="pd-item" onClick={() => { openModal('addExam'); setQuickAddOpen(false); }}>
                  <FileText size={14} color="var(--purple-400)" />
                  <span>Yangi imtihon</span>
                </div>
                <div className="pd-item" onClick={() => { openModal('addWebinar'); setQuickAddOpen(false); }}>
                  <Video size={14} color="var(--green-400)" />
                  <span>Yangi vebinar</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile */}
        <div className="profile-wrap">
          <button
            className="profile-btn"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <div className="avatar" style={{ width: 32, height: 32, fontSize: 12, overflow: 'hidden' }}>
              {(user as any)?.avatarName ? (
                <img src={(user as any).avatarName} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (user as any)?.avatar ? (
                <img src={(user as any).avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                initials
              )}
            </div>
            <div className="profile-info">
              <span className="profile-name">{shortName}</span>
            </div>
            <ChevronDown size={12} color="var(--text-muted)" />
          </button>

          {profileOpen && (
            <div className="profile-dropdown" onClick={() => setProfileOpen(false)}>
              <div className="pd-header">
                <div className="avatar avatar-lg" style={{ overflow: 'hidden' }}>
                  {(user as any)?.avatarName ? (
                    <img src={(user as any).avatarName} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (user as any)?.avatar ? (
                    <img src={(user as any).avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    initials
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{fullName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{user?.email || 'user@agmk.uz'}</div>
                  <span className="badge badge-blue" style={{ marginTop: 4, fontSize: 10 }}>{roleLabel}</span>
                </div>
              </div>
              <hr className="divider" style={{ margin: '8px 0' }} />
              {[
                { icon: User, label: t('layout.profile'), onClick: () => openModal('profile') },
                { icon: Settings, label: t('nav.settings'), onClick: () => navigate('/settings') },
                { icon: HelpCircle, label: t('layout.help'), onClick: () => {} },
              ].map((m, i) => (
                <div key={i} className="pd-item" onClick={m.onClick}>
                  <m.icon size={14} />
                  <span>{m.label}</span>
                </div>
              ))}
              <hr className="divider" style={{ margin: '8px 0' }} />
              <div className="pd-item pd-item-danger" onClick={handleLogout}>
                <LogOut size={14} />
                <span>{t('layout.logout')}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Profile Modal */}
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => closeModal()} />

      {/* Global Modals */}
      {activeModal === 'addCourse' && (
        <AddCourseModal
          onClose={() => closeModal()}
          onSuccess={() => {
            closeModal();
            toast.success(t('courses_page.createSuccess', 'Kurs muvaffaqiyatli yaratildi!'));
            navigate('/courses');
          }}
        />
      )}

      {activeModal === 'addExam' && (
        <CreateExamWizard
          onClose={() => closeModal()}
          onSuccess={() => {
            closeModal();
            toast.success(t('exam.createSuccess', 'Imtihon muvaffaqiyatli yaratildi!'));
            navigate('/exams');
          }}
        />
      )}

      {/* Command Palette */}
      {cmdOpen && (
        <div className="cmd-overlay" onClick={() => setCmdOpen(false)}>
          <div className="cmd-palette" onClick={e => e.stopPropagation()}>
            <div className="cmd-input-wrap">
              <Search size={16} color="var(--text-muted)" />
              <input
                autoFocus
                className="cmd-input"
                placeholder={t('layout.cmdPlaceholder') || 'Qidirish yoki buyruq...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button className="cmd-esc" onClick={() => setCmdOpen(false)}>{t('layout.cmdEsc') || 'ESC'}</button>
            </div>
            <div className="cmd-results">
              {(() => {
                const staticPages = NAV.flatMap(sec => sec.items).filter(item => {
                  if (!searchQuery) return false;
                  return t(item.label).toLowerCase().includes(searchQuery.toLowerCase());
                }).slice(0, 5);

                const showSuggestions = !searchQuery;

                return (
                  <>
                    {showSuggestions && (
                      <div className="cmd-result-group">
                        <div className="cmd-group-label" style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>
                          Tavsiyalar
                        </div>
                        {['dashboard', 'courses', 'library'].map((pageId, i) => {
                          const item = NAV.flatMap(s => s.items).find(x => x.id === pageId);
                          if (!item) return null;
                          return (
                            <div key={i} className="cmd-result-item" onClick={() => { setActivePage(item.id); setCmdOpen(false); }}>
                              <item.icon size={14} color="var(--text-tertiary)" />
                              <span>{t(item.label)}</span>
                              <span className="cmd-result-type">{t('layout.pageLabel') || 'Sahifa'}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {!showSuggestions && staticPages.length > 0 && (
                      <div className="cmd-result-group">
                        <div className="cmd-group-label" style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Sahifalar</div>
                        {staticPages.map((page, i) => (
                          <div key={`page-${i}`} className="cmd-result-item" onClick={() => { setActivePage(page.id); setCmdOpen(false); }}>
                            <page.icon size={14} color="var(--text-tertiary)" />
                            <span>{t(page.label)}</span>
                            <span className="cmd-result-type">{t('layout.pageLabel') || 'Sahifa'}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {!showSuggestions && searchResults.courses?.length > 0 && (
                      <div className="cmd-result-group">
                        <div className="cmd-group-label" style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Kurslar</div>
                        {searchResults.courses.map((c, i) => (
                          <div key={`course-${i}`} className="cmd-result-item" onClick={() => { navigate(`/courses/${c.id}`); setCmdOpen(false); }}>
                            <BookOpen size={14} color="var(--text-tertiary)" />
                            <span>{lang === 'ru' ? (c.titleRu || c.title) : c.title}</span>
                            <span className="cmd-result-type">Kurs</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {!showSuggestions && searchResults.users?.length > 0 && (
                      <div className="cmd-result-group">
                        <div className="cmd-group-label" style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Xodimlar</div>
                        {searchResults.users.map((u, i) => (
                          <div key={`user-${i}`} className="cmd-result-item" onClick={() => { navigate(`/admin/users`); setCmdOpen(false); }}>
                            <User size={14} color="var(--text-tertiary)" />
                            <span>{u.fullName}</span>
                            <span className="cmd-result-type">{u.position || u.employeeId}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {!showSuggestions && searchQuery.length >= 2 && !isSearching && searchResults.courses?.length === 0 && searchResults.users?.length === 0 && staticPages.length === 0 && (
                      <div className="cmd-no-results" style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Natija topilmadi</div>
                    )}

                    {isSearching && (
                      <div className="cmd-no-results" style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div className="spinner" style={{ width: 16, height: 16, display: 'inline-block', verticalAlign: 'middle', marginRight: 8 }} />
                        Qidirilmoqda...
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav (Mobile) */}
      <BottomNav activePage={activePage} setActivePage={setActivePage} t={t} />
    </>
  );
}

function BottomNav({ activePage, setActivePage, t }: {
  activePage: string;
  setActivePage: (v: string) => void;
  t: (k: string) => string;
}) {
  return (
    <nav className="bottom-nav">
      {BOTTOM_NAV.map(item => (
        <button
          key={item.id}
          className={clsx('bottom-nav-item', activePage === item.id && 'active')}
          onClick={() => setActivePage(item.id)}
        >
          <item.icon size={20} />
          <span>{t(item.label)}</span>
        </button>
      ))}
    </nav>
  );
}
