import { useState, useEffect, useCallback, useMemo } from 'react';
import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { useSocket } from '@/hooks/useSocket';
import {
  Users, BookOpen, Award, Shield, Search, Filter,
  TrendingUp, TrendingDown, BarChart3, Settings, Mail, Plus,
  Sparkles, CheckCircle, AlertTriangle, Download, SlidersHorizontal,
  LayoutDashboard, ServerCrash, Calendar, Clock, Trash2
} from 'lucide-react';
import {
  AreaChart, Area, ResponsiveContainer, Tooltip,
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { apiClient } from '@/api/axios';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import { customConfirm } from '@/shared/lib/toast-utils';
import { useTranslation } from 'react-i18next';
import AdminUserModal from '@/components/AdminUserModal';
import AdminUserDetailsPanel from '@/components/AdminUserDetailsPanel';
import AddCourseModal from '../components/AddCourseModal';
import { CreateExamWizard } from '@/components/exam/CreateExamWizard';

type Tab = 'overview' | 'users' | 'courses' | 'analytics' | 'settings' | 'monitoring';

const ROLE_OPTIONS = ['employee', 'trainer', 'department_manager', 'hr_manager', 'executive', 'admin', 'super_admin'];

const EmptyState = ({ text, height = 180 }: { text: string; height?: number }) => (
  <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center', padding: 20 }}>
    {text}
  </div>
);

const InlineState = ({ text, height = 180, action }: { text: string; height?: number; action?: ReactNode }) => (
  <div style={{ height, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center', padding: 20 }}>
    <span>{text}</span>
    {action}
  </div>
);

const unwrapArray = (response: any) => {
  const payload = response?.data?.data ?? response?.data ?? response;
  return Array.isArray(payload) ? payload : [];
};

const numberValue = (value: any) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const normalizeMonthly = (items: any[]) => items
  .map((item) => ({
    m: String(item?.m || item?.month || ''),
    users: numberValue(item?.users ?? item?.activeUsers ?? item?.attempts),
    completions: numberValue(item?.completions ?? item?.completed ?? item?.passed),
  }))
  .filter((item) => item.m);

const normalizeDepartments = (items: any[]) => items
  .map((item) => ({
    dept: String(item?.dept || item?.department || item?.name || ''),
    score: numberValue(item?.score ?? item?.averageScore),
    enrolled: numberValue(item?.enrolled ?? item?.participants ?? item?.attempts),
  }))
  .filter((item) => item.dept);

export default function AdminPage() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Users Tab state
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [debouncedUserSearch, setDebouncedUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userDepartmentFilter, setUserDepartmentFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userSort, setUserSort] = useState('newest');
  const [usersPage, setUsersPage] = useState(1);
  const [usersLimit] = useState(10);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [showUserFilters, setShowUserFilters] = useState(false);
  const [compactUsersView, setCompactUsersView] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Courses & Exams Tab state
  const [courses, setCourses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [coursesExamsLoading, setCoursesExamsLoading] = useState(true);
  const [coursesExamsTab, setCoursesExamsTab] = useState<'courses' | 'exams'>('courses');

  const [courseSearch, setCourseSearch] = useState('');
  const [coursePage, setCoursePage] = useState(1);
  const coursesPerPage = 10;

  const [examSearch, setExamSearch] = useState('');
  const [examPage, setExamPage] = useState(1);
  const examsPerPage = 10;

  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedExam, setSelectedExam] = useState<any>(null);

  // Analytics Tab state
  const [kpis, setKpis] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [deptData, setDeptData] = useState<any[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedUserSearch(userSearch.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [userSearch]);

  useEffect(() => {
    setUsersPage(1);
  }, [debouncedUserSearch, userRoleFilter, userDepartmentFilter, userStatusFilter, userSort]);

  const loadUsers = useCallback((showToast = false) => {
    let cancelled = false;
    const run = async () => {
      setLoadingUsers(true);
      setUsersError(null);
      try {
        const res = await apiClient.get('/users', {
          params: {
            paginated: true,
            page: usersPage,
            limit: usersLimit,
            search: debouncedUserSearch || undefined,
            role: userRoleFilter !== 'all' ? userRoleFilter : undefined,
            department: userDepartmentFilter || undefined,
            status: userStatusFilter !== 'all' ? userStatusFilter : undefined,
            sort: userSort,
          },
        });
        if (cancelled) return;
        const payload = res.data?.data ?? res.data ?? {};
        const items = Array.isArray(payload) ? payload : (Array.isArray(payload.items) ? payload.items : []);
        setUsers(items);
        setUsersTotal(Number(payload.total ?? items.length));
        setUsersTotalPages(Math.max(1, Number(payload.totalPages ?? 1)));
      } catch (err: any) {
        if (cancelled) return;
        const message = err.response?.data?.message || t('admin.errors.usersLoad', 'Foydalanuvchilarni yuklashda xatolik');
        setUsersError(message);
        if (showToast) toast.error(message);
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [debouncedUserSearch, userDepartmentFilter, userRoleFilter, userSort, userStatusFilter, usersLimit, usersPage, t]);

  // Fetch Users
  useEffect(() => {
    if (activeTab === 'users' || activeTab === 'overview') {
      return loadUsers(false);
    }
    return undefined;
  }, [activeTab, loadUsers]);

  const reloadCoursesAndExams = useCallback(() => {
    setCoursesExamsLoading(true);
    Promise.all([
      apiClient.get('/courses'),
      apiClient.get('/exams')
    ])
      .then(([coursesRes, examsRes]) => {
        setCourses(unwrapArray(coursesRes));
        setExams(unwrapArray(examsRes));
        setCoursesExamsLoading(false);
      })
      .catch(err => {
        toast.error(err.response?.data?.message || t('admin.errors.coursesLoad', 'Yuklashda xatolik'));
        setCoursesExamsLoading(false);
      });
  }, [t]);

  // Fetch Courses & Exams
  useEffect(() => {
    if (activeTab === 'courses') {
      reloadCoursesAndExams();
    }
  }, [activeTab, reloadCoursesAndExams]);

  const loadAnalytics = useCallback((showToast = false) => {
    let cancelled = false;
    const run = async () => {
      setLoadingAnalytics(true);
      setAnalyticsError(null);
      try {
        const [kpisRes, monthlyRes, deptRes] = await Promise.all([
          apiClient.get('/analytics/kpis'),
          apiClient.get('/analytics/monthly'),
          apiClient.get('/analytics/departments')
        ]);
        if (cancelled) return;
        setKpis(unwrapArray(kpisRes));
        setMonthlyData(normalizeMonthly(unwrapArray(monthlyRes)));
        setDeptData(normalizeDepartments(unwrapArray(deptRes)));
      } catch (err: any) {
        if (cancelled) return;
        const message = err.response?.data?.message || t('admin.errors.analyticsLoad', 'Analitikani yuklashda xatolik');
        setAnalyticsError(message);
        if (showToast) toast.error(message);
      } finally {
        if (!cancelled) setLoadingAnalytics(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [t]);

  // Fetch Analytics
  useEffect(() => {
    if (activeTab === 'analytics' || activeTab === 'overview') {
      return loadAnalytics(false);
    }
    return undefined;
  }, [activeTab, loadAnalytics]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await apiClient.patch(`/users/${userId}/role`, { role: newRole });
      toast.success(t('admin.users.roleChanged', 'Rol muvaffaqiyatli o‘zgartirildi'));
      loadUsers(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('admin.users.roleChangeError', 'Rolni o‘zgartirishda xatolik yuz berdi'));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    customConfirm(t('admin.users.confirmDelete', 'Haqiqatan ham bu foydalanuvchini o‘chirmoqchimisiz?'), async () => {
      try {
        await apiClient.delete(`/users/${userId}`);
        toast.success(t('admin.users.deleted', 'Foydalanuvchi muvaffaqiyatli o‘chirildi'));
        if (users.length === 1 && usersPage > 1) {
          setUsersPage((page) => Math.max(1, page - 1));
        } else {
          loadUsers(false);
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || t('admin.users.deleteError', 'Foydalanuvchini o‘chirishda xatolik yuz berdi'));
      }
    });
  };

  const displayUsers = users;

  const filteredCourses = useMemo(() => {
    let list = courses;
    if (courseSearch) {
      list = list.filter(c => c.title?.toLowerCase().includes(courseSearch.toLowerCase()));
    }
    return list;
  }, [courses, courseSearch]);

  const displayCourses = useMemo(() => {
    const start = (coursePage - 1) * coursesPerPage;
    return filteredCourses.slice(start, start + coursesPerPage);
  }, [filteredCourses, coursePage]);

  const filteredExams = useMemo(() => {
    let list = exams;
    if (examSearch) {
      list = list.filter(e => e.title?.toLowerCase().includes(examSearch.toLowerCase()));
    }
    return list;
  }, [exams, examSearch]);

  const displayExams = useMemo(() => {
    const start = (examPage - 1) * examsPerPage;
    return filteredExams.slice(start, start + examsPerPage);
  }, [filteredExams, examPage]);

  const handleDeleteCourse = (id: string) => {
    customConfirm(t('admin.coursesTab.confirmDeleteCourse', "Rostdan ham ushbu kursni o'chirmoqchimisiz?"), async () => {
      try {
        await apiClient.delete(`/courses/${id}`);
        toast.success(t('admin.coursesTab.deletedCourse', "Kurs muvaffaqiyatli o'chirildi"));
        reloadCoursesAndExams();
      } catch (err) {
        toast.error('Xatolik');
      }
    });
  };

  const handleDeleteExam = (id: string) => {
    customConfirm(t('admin.coursesTab.confirmDeleteExam', "Rostdan ham ushbu imtihonni o'chirmoqchimisiz?"), async () => {
      try {
        await apiClient.delete(`/exams/${id}`);
        toast.success(t('admin.coursesTab.deletedExam', "Imtihon muvaffaqiyatli o'chirildi"));
        reloadCoursesAndExams();
      } catch (err) {
        toast.error('Xatolik');
      }
    });
  };
  const displayKpis = kpis;
  const displayMonthly = monthlyData;
  const displayDept = deptData;
  const userDepartments = useMemo(
    () => [...new Set(users.map((user) => user.departmentName || user.dept).filter(Boolean))].sort(),
    [users],
  );
  const usersPageStart = usersTotal === 0 ? 0 : (usersPage - 1) * usersLimit + 1;
  const usersPageEnd = Math.min(usersTotal, usersPage * usersLimit);
  const roleLabel = useCallback((role?: string) => t(`userRoles.${role || 'employee'}`, role || t('userRoles.employee', 'Xodim')), [t]);
  const statusLabel = useCallback((status?: string) => {
    if (status === 'active') return t('admin.users.status.active', 'Faol');
    if (status === 'offline') return t('admin.users.status.offline', 'Oflayn');
    return t('admin.users.status.inactive', 'Nofaol');
  }, [t]);
  const retryAnalytics = () => loadAnalytics(true);
  const retryUsers = () => loadUsers(true);
  const formatKpiChange = useCallback((kpi: any) => {
    const change = kpi.change ?? '';
    const count = numberValue(change);
    if (kpi.changeType === 'active') return t('admin.kpiChange.active', '{{count}} faol', { count });
    if (kpi.changeType === 'published') return t('admin.kpiChange.published', '{{count}} nashrda', { count });
    if (kpi.changeType === 'issued') return t('admin.kpiChange.issued', 'Jami berilgan');
    if (kpi.changeType === 'attempts') return t('admin.kpiChange.attempts', '{{count}} urinish', { count });
    return String(change || t('admin.kpiChange.updated', 'Yangilangan'));
  }, [t]);
  const overviewStats = useMemo(() => {
    const meta: Record<string, { icon: typeof Users; color: string }> = {
      totalUsers: { icon: Users, color: '#3b82f6' },
      activeCourses: { icon: BookOpen, color: '#8b5cf6' },
      certificates: { icon: Award, color: '#22c55e' },
      averageScore: { icon: ServerCrash, color: '#f59e0b' },
    };
    return displayKpis.slice(0, 4).map((kpi, index) => {
      const key = kpi.key || ['totalUsers', 'activeCourses', 'certificates', 'averageScore'][index] || `metric${index + 1}`;
      const metric = meta[key] || { icon: BarChart3, color: '#3b82f6' };
      const direction = kpi.direction || (kpi.up === false ? 'down' : 'up');
      return {
      key,
      label: t(`admin.kpis.${key}`, kpi.label || key),
      value: kpi.value ?? 0,
      icon: metric.icon,
      color: kpi.color || metric.color,
      trend: formatKpiChange(kpi),
      up: direction !== 'down',
      };
    });
  }, [displayKpis, formatKpiChange, t]);
  const adminInsights = useMemo(() => {
    const lowScoreDept = [...displayDept].sort((a, b) => Number(a.score || 0) - Number(b.score || 0))[0];
    const lastMonth = displayMonthly[displayMonthly.length - 1];
    const insights: Array<{ type: string; icon: typeof AlertTriangle; title: string; sub: string }> = [];
    if (lowScoreDept) insights.push({
      type: 'warning',
      icon: AlertTriangle,
      title: t('admin.insights.lowScoreTitle', '{{dept}} bo‘limida o‘rtacha ball {{score}}', { dept: lowScoreDept.dept, score: lowScoreDept.score }),
      sub: t('admin.insights.lowScoreSub', 'Qo‘shimcha trening rejasini ko‘rib chiqing'),
    });
    if (lastMonth) insights.push({
      type: 'info',
      icon: TrendingUp,
      title: t('admin.insights.activeUsersTitle', '{{count}} faol foydalanuvchi', { count: lastMonth.users || 0 }),
      sub: t('admin.insights.activeUsersSub', '{{month}} oyidagi test faolligi', { month: lastMonth.m }),
    });
    if (displayKpis.length) insights.push({
      type: 'success',
      icon: CheckCircle,
      title: t('admin.insights.kpiFreshTitle', 'KPI ma’lumotlari real va yangilangan'),
      sub: t('admin.insights.kpiFreshSub', '{{count}} ta ko‘rsatkich yuklandi', { count: displayKpis.length }),
    });
    return insights;
  }, [displayDept, displayMonthly, displayKpis, t]);

  const Tip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
          <p style={{ color: 'var(--text-tertiary)', marginBottom: 4 }}>{label}</p>
          <p style={{ color: payload[0].color, fontWeight: 700 }}>{t('admin.chart.usersValue', '{{value}} foydalanuvchi', { value: payload[0].value ?? 0 })}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="admin-layout">
      {/* -- Header -- */}
      <div className="admin-header fade-in">
        <div>
          <h1 className="page-title">{t('admin.title', 'Boshqaruv Paneli')}</h1>
          <p className="page-sub">{t('admin.subtitle', 'AGMK LMS Enterprise • Tizim administratsiyasi')}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setActiveTab('analytics')}><Download size={14} /> {t('admin.actions.report', 'Hisobot')}</button>
          <button className="btn btn-primary" onClick={() => { setSelectedUser(null); setIsUserModalOpen(true); }}><Plus size={14} /> {t('admin.actions.newUser', 'Yangi foydalanuvchi')}</button>
        </div>
      </div>

      {/* -- Navigation -- */}
      <div className="admin-nav fade-in">
        {[
          { id: 'overview', icon: LayoutDashboard, label: t('admin.tabs.overview', 'Umumiy') },
          { id: 'users', icon: Users, label: t('admin.tabs.users', 'Foydalanuvchilar') },
          { id: 'courses', icon: BookOpen, label: t('admin.tabs.courses', 'Kurslar & Testlar') },
          { id: 'analytics', icon: BarChart3, label: t('admin.tabs.analytics', 'Tahlil') },
          { id: 'monitoring', icon: Shield, label: t('admin.tabs.monitoring', 'Monitoring') },
          { id: 'settings', icon: Settings, label: t('admin.tabs.settings', 'Sozlamalar') },
        ].map(tab => (
          <button
            key={tab.id}
            className={clsx('admin-nav-item', activeTab === tab.id && 'active')}
            onClick={() => setActiveTab(tab.id as Tab)}
          >
            <tab.icon size={15} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* -- Content Area -- */}
      <div className="admin-content fade-in fade-in-1">

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="admin-overview">
            <div className="grid grid-4" style={{ marginBottom: 24 }}>
              {loadingAnalytics ? (
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                  <InlineState text={t('admin.loading.kpis', 'KPI ko‘rsatkichlari yuklanmoqda...')} height={120} />
                </div>
              ) : analyticsError ? (
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                  <InlineState
                    text={analyticsError}
                    height={120}
                    action={<button className="btn btn-secondary btn-sm" onClick={retryAnalytics}>{t('common.retry', 'Qayta urinish')}</button>}
                  />
                </div>
              ) : overviewStats.length === 0 ? (
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                  <EmptyState text={t('admin.empty.kpis', 'KPI ma’lumotlari hali shakllanmagan')} height={120} />
                </div>
              ) : overviewStats.map((s, i) => (
                <div key={s.key || i} className="stat-card">
                  <div className="stat-header">
                    <div>
                      <div className="stat-label">{s.label as React.ReactNode}</div>
                      <div className="stat-value" style={{ marginTop: 6 }}>{s.value as React.ReactNode}</div>
                    </div>
                    <div className="stat-icon" style={{ background: `${s.color}15` }}>
                      <s.icon size={20} color={s.color} />
                    </div>
                  </div>
                  <div className={clsx('stat-change', s.up ? 'up' : 'down')}>
                    {s.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {s.trend}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-3" style={{ gap: 24 }}>
              <div className="card" style={{ gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{t('admin.overview.systemActivity', 'Tizim faolligi')}</div>
                  <button className="btn btn-ghost btn-sm" onClick={retryAnalytics}><Calendar size={13} /> {t('admin.overview.lastSixMonths', 'Oxirgi 6 oy')}</button>
                </div>
                <div style={{ height: 260 }}>
                  {loadingAnalytics ? (
                    <InlineState text={t('admin.loading.monthly', 'Oylik faollik yuklanmoqda...')} height={260} />
                  ) : analyticsError ? (
                    <InlineState
                      text={analyticsError}
                      height={260}
                      action={<button className="btn btn-secondary btn-sm" onClick={retryAnalytics}>{t('common.retry', 'Qayta urinish')}</button>}
                    />
                  ) : displayMonthly.length === 0 ? <EmptyState text={t('admin.empty.monthly', 'Oylik faollik ma’lumotlari hali yo‘q')} height={260} /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={displayMonthly} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="m" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<Tip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Sparkles size={16} color="var(--violet-400)" />
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{t('admin.insights.title', 'Tizim kuzatuvlari')}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {loadingAnalytics ? (
                    <InlineState text={t('admin.loading.insights', 'Kuzatuvlar tayyorlanmoqda...')} height={180} />
                  ) : analyticsError ? (
                    <InlineState
                      text={analyticsError}
                      height={180}
                      action={<button className="btn btn-secondary btn-sm" onClick={retryAnalytics}>{t('common.retry', 'Qayta urinish')}</button>}
                    />
                  ) : adminInsights.length === 0 ? <EmptyState text={t('admin.empty.insights', 'Tahlil uchun ma’lumot yetarli emas')} height={180} /> : adminInsights.map((insight, index) => (
                    <div key={index} className={clsx('admin-alert', insight.type)}>
                      <insight.icon size={15} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{insight.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', opacity: 0.9 }}>{insight.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="admin-users card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="admin-toolbar">
              <div className="search-wrap" style={{ width: 340 }}>
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  className="input"
                  placeholder={t('admin.users.search', 'Xodim, email, username yoki tabel raqami...')}
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  style={{ paddingLeft: 36, fontSize: 13 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
                <button className={clsx('btn btn-secondary', showUserFilters && 'active')} onClick={() => setShowUserFilters((value) => !value)}>
                  <Filter size={14} /> {t('admin.users.filters', 'Filtrlar')}
                </button>
                <button className="btn btn-secondary" onClick={() => setCompactUsersView((value) => !value)}>
                  <SlidersHorizontal size={14} /> {compactUsersView ? t('admin.users.fullView', 'To‘liq') : t('admin.users.compactView', 'Ixcham')}
                </button>
              </div>
            </div>

            {showUserFilters && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(160px, 1fr))', gap: 12, padding: '14px 20px', borderBottom: '1px solid var(--border-1)', background: 'var(--surface-1)' }}>
                <select className="input" value={userRoleFilter} onChange={(event) => setUserRoleFilter(event.target.value)}>
                  <option value="all">{t('admin.users.allRoles', 'Barcha rollar')}</option>
                  {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}
                </select>
                <input
                  className="input"
                  value={userDepartmentFilter}
                  onChange={(event) => setUserDepartmentFilter(event.target.value)}
                  placeholder={t('admin.users.departmentFilter', 'Bo‘lim bo‘yicha filter')}
                  list="admin-user-departments"
                />
                <datalist id="admin-user-departments">
                  {userDepartments.map((department) => <option key={department} value={department} />)}
                </datalist>
                <select className="input" value={userStatusFilter} onChange={(event) => setUserStatusFilter(event.target.value)}>
                  <option value="all">{t('admin.users.allStatuses', 'Barcha holatlar')}</option>
                  <option value="active">{t('admin.users.status.active', 'Faol')}</option>
                  <option value="inactive">{t('admin.users.status.inactive', 'Nofaol')}</option>
                </select>
                <select className="input" value={userSort} onChange={(event) => setUserSort(event.target.value)}>
                  <option value="newest">{t('admin.users.sort.newest', 'Avval yangilar')}</option>
                  <option value="oldest">{t('admin.users.sort.oldest', 'Avval eskilar')}</option>
                  <option value="name">{t('admin.users.sort.name', 'Ism bo‘yicha')}</option>
                  <option value="lastLogin">{t('admin.users.sort.lastLogin', 'Oxirgi kirish')}</option>
                </select>
              </div>
            )}

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('admin.users.table.user', 'Xodim')}</th>
                    {!compactUsersView && <th>{t('admin.users.table.employeeId', 'Tabel / username')}</th>}
                    <th>{t('admin.users.table.role', 'Rol')}</th>
                    <th>{t('admin.users.table.department', 'Bo‘lim')}</th>
                    {!compactUsersView && <th>{t('admin.users.table.position', 'Lavozim')}</th>}
                    <th>{t('admin.users.table.courses', 'Kurslar')}</th>
                    <th>{t('admin.users.table.status', 'Holat')}</th>
                    <th style={{ width: 70 }}>{t('common.actions', 'Amallar')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={compactUsersView ? 6 : 8} style={{ textAlign: 'center', padding: 30, color: 'var(--text-tertiary)' }}>{t('common.loading', 'Yuklanmoqda')}...</td>
                    </tr>
                  ) : usersError ? (
                    <tr>
                      <td colSpan={compactUsersView ? 6 : 8} style={{ textAlign: 'center', padding: 30, color: 'var(--text-tertiary)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                          <span>{usersError}</span>
                          <button className="btn btn-secondary btn-sm" onClick={retryUsers}>{t('common.retry', 'Qayta urinish')}</button>
                        </div>
                      </td>
                    </tr>
                  ) : displayUsers.length === 0 ? (
                    <tr>
                      <td colSpan={compactUsersView ? 6 : 8} style={{ textAlign: 'center', padding: 30, color: 'var(--text-tertiary)' }}>{t('admin.empty.users', 'Foydalanuvchilar topilmadi')}</td>
                    </tr>
                  ) : (
                    displayUsers.map((u) => {
                      const userId = u.id || u._id;
                      const initials = (u.name || u.fullName || 'F U')
                        .split(' ')
                        .filter(Boolean)
                        .map((n: string) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2);
                      const roleText = roleLabel(u.role);
                      const deptText = u.dept || u.departmentName || '-';
                      const positionText = u.position || u.positionRu || '-';
                      const coursesText = u.courses !== undefined ? u.courses : (u.coursesCount || 0);
                      const isSelf = currentUser?.id === userId || (currentUser as any)?.userId === userId;
                      const isGreen = u.status === 'active';
                      const isGray = u.status === 'offline';
                      const canManage = currentUser?.role === 'super_admin' || currentUser?.role === 'admin';
                      const targetIsAdmin = u.role === 'admin' || u.role === 'super_admin';
                      const disableActions = !canManage || isSelf || (currentUser?.role === 'admin' && targetIsAdmin);
                      const disabledReason = isSelf
                        ? t('admin.users.currentUserProtected', 'Joriy foydalanuvchi himoyalangan')
                        : !canManage
                          ? t('admin.users.readOnlyRole', 'Bu rol faqat ko‘rish huquqiga ega')
                          : t('admin.users.roleProtected', 'Bu foydalanuvchi roli himoyalangan');

                      return (
                        <tr key={userId}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div className="avatar" style={{ width: 32, height: 32, fontSize: 11, background: 'var(--surface-2)' }}>
                                {initials}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{u.name || u.fullName || t('admin.users.userFallback', 'Foydalanuvchi')}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{u.email || t('admin.users.noEmail', 'Email yo‘q')}</div>
                              </div>
                            </div>
                          </td>
                          {!compactUsersView && (
                            <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                              <div style={{ fontWeight: 700 }}>{u.employeeId || '-'}</div>
                              <div style={{ color: 'var(--text-tertiary)' }}>{u.username || '-'}</div>
                            </td>
                          )}
                          <td>
                            {canManage && !disableActions ? (
                              <select
                                className="input"
                                style={{ padding: '4px 8px', fontSize: 12, height: 'auto', minHeight: 28 }}
                                value={u.role || 'employee'}
                                onChange={(e) => handleRoleChange(userId, e.target.value)}
                              >
                                {ROLE_OPTIONS.map((role) => {
                                  if (currentUser?.role === 'admin' && (role === 'super_admin' || role === 'admin')) return null;
                                  return <option key={role} value={role}>{roleLabel(role)}</option>;
                                })}
                              </select>
                            ) : (
                              <span className="badge badge-gray" title={disabledReason}>{roleText}</span>
                            )}
                          </td>
                          <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{deptText}</td>
                          {!compactUsersView && (
                            <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                              <div>{positionText}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                                {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : t('admin.users.neverLoggedIn', 'Hali kirmagan')}
                              </div>
                            </td>
                          )}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                              <BookOpen size={13} color="var(--text-tertiary)" /> {coursesText}
                            </div>
                          </td>
                          <td>
                            <span className={clsx('badge',
                              isGreen ? 'badge-green' :
                              isGray ? 'badge-gray' : 'badge-red'
                            )}>
                              {statusLabel(u.status)}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button
                                className="btn btn-ghost btn-sm btn-icon"
                                onClick={() => { setSelectedUser(u); setIsUserDetailsOpen(true); }}
                                title="Batafsil ma'lumot"
                              >
                                <LayoutDashboard size={14} color="var(--blue-400)" />
                              </button>
                              <button
                                className="btn btn-ghost btn-sm btn-icon"
                                onClick={() => { setSelectedUser(u); setIsUserModalOpen(true); }}
                                title="Tahrirlash"
                                disabled={disableActions}
                                style={{ opacity: disableActions ? 0.55 : 1 }}
                              >
                                <Settings size={14} />
                              </button>
                              <button
                                className="btn btn-ghost btn-sm btn-icon"
                                style={{ color: disableActions ? 'var(--text-tertiary)' : 'var(--red-400)', opacity: disableActions ? 0.55 : 1 }}
                                onClick={() => !disableActions && handleDeleteUser(userId)}
                                title={disableActions ? disabledReason : t('common.delete', 'O‘chirish')}
                                disabled={disableActions}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="admin-pagination">
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                {t('admin.users.pagination', '{{start}}-{{end}} / {{total}} ko‘rsatilmoqda', { start: usersPageStart, end: usersPageEnd, total: usersTotal })}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-secondary btn-sm" disabled={usersPage <= 1 || loadingUsers} onClick={() => setUsersPage((page) => Math.max(1, page - 1))}>{t('common.prev', 'Oldingi')}</button>
                <button className="btn btn-secondary btn-sm" disabled={usersPage >= usersTotalPages || loadingUsers} onClick={() => setUsersPage((page) => Math.min(usersTotalPages, page + 1))}>{t('common.next', 'Keyingi')}</button>
              </div>
            </div>
          </div>
        )}

        {/* KURSLAR & TESTLAR TAB */}
        {activeTab === 'courses' && (
          <div className="admin-users card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="admin-toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border-1)' }}>
              <div style={{ display: 'flex', gap: 10, background: 'var(--surface-1)', borderRadius: 10, padding: 3, border: '1px solid var(--border-1)' }}>
                <button
                  className={clsx('btn btn-sm', coursesExamsTab === 'courses' ? 'btn-primary' : 'btn-ghost')}
                  style={{ borderRadius: 6 }}
                  onClick={() => setCoursesExamsTab('courses')}
                >
                  {t('admin.coursesTab.courses', 'Kurslar')}
                </button>
                <button
                  className={clsx('btn btn-sm', coursesExamsTab === 'exams' ? 'btn-primary' : 'btn-ghost')}
                  style={{ borderRadius: 6 }}
                  onClick={() => setCoursesExamsTab('exams')}
                >
                  {t('admin.coursesTab.exams', 'Imtihonlar / Testlar')}
                </button>
              </div>

              <div style={{ display: 'flex', gap: 12, flex: 1, justifyContent: 'flex-end' }}>
                <div className="search-bar" style={{ width: 250 }}>
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder={coursesExamsTab === 'courses' ? t('admin.coursesTab.searchCourses', 'Kurslarni qidirish...') : t('admin.coursesTab.searchExams', 'Imtihonlarni qidirish...')}
                    value={coursesExamsTab === 'courses' ? courseSearch : examSearch}
                    onChange={(e) => {
                      if (coursesExamsTab === 'courses') { setCourseSearch(e.target.value); setCoursePage(1); }
                      else { setExamSearch(e.target.value); setExamPage(1); }
                    }}
                    className="input"
                  />
                </div>
                <button className="btn btn-primary" onClick={() => {
                  if (coursesExamsTab === 'courses') { setSelectedCourse(null); setIsCourseModalOpen(true); }
                  else { setSelectedExam(null); setIsExamModalOpen(true); }
                }}>
                  <Plus size={18} />
                  {coursesExamsTab === 'courses' ? t('admin.coursesTab.newCourse', 'Yangi kurs') : t('admin.coursesTab.newExam', 'Yangi imtihon')}
                </button>
              </div>
            </div>

            {coursesExamsLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>{t('common.loading', 'Yuklanmoqda')}...</div>
            ) : coursesExamsTab === 'courses' ? (
              <>
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>{t('admin.coursesTab.tableCourses.title', 'Kurs nomi')}</th>
                        <th>{t('admin.coursesTab.tableCourses.category', 'Kategoriya')}</th>
                        <th>{t('admin.coursesTab.tableCourses.level', 'Daraja')}</th>
                        <th>{t('admin.coursesTab.tableCourses.lessons', 'Darslar')}</th>
                        <th>{t('admin.coursesTab.tableCourses.duration', 'Davomiyligi')}</th>
                        <th>{t('admin.coursesTab.tableCourses.status', 'Holat')}</th>
                        <th style={{ textAlign: 'right' }}>{t('admin.coursesTab.tableCourses.actions', 'Amallar')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayCourses.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: 30, color: 'var(--text-tertiary)' }}>{t('admin.coursesTab.emptyCourses', 'Kurslar topilmadi')}</td>
                        </tr>
                      ) : displayCourses.map(c => (
                        <tr key={c.id || c._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ width: 10, height: 10, borderRadius: '50%', background: c.color || '#3b82f6', flexShrink: 0 }} />
                              <span style={{ fontWeight: 600 }}>{c.title}</span>
                            </div>
                          </td>
                          <td><span className="badge badge-gray">{c.cat || c.category || '-'}</span></td>
                          <td>{c.level || '-'}</td>
                          <td>{c.lessons || (c.modules ? c.modules.length : 0)} ta</td>
                          <td>{c.duration || '-'}</td>
                          <td>
                            <span className={clsx('badge', c.status === 'active' || c.status === 'published' ? 'badge-green' : 'badge-amber')}>
                              {c.status === 'active' || c.status === 'published' ? t('admin.coursesTab.status.active', 'Faol') : t('admin.coursesTab.status.draft', 'Qoralama')}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setSelectedCourse(c); setIsCourseModalOpen(true); }} title={t('common.edit', 'Tahrirlash')}>
                                <Settings size={16} />
                              </button>
                              <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--red-500)' }} onClick={() => handleDeleteCourse(c.id || c._id)} title={t('common.delete', "O'chirish")}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredCourses.length > coursesPerPage && (
                  <div className="admin-pagination" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-1)', display: 'flex', justifyContent: 'center', gap: 10 }}>
                    <button className="btn btn-secondary btn-sm" disabled={coursePage === 1} onClick={() => setCoursePage(p => p - 1)}>{t('common.prev', 'Oldingi')}</button>
                    <span style={{ fontSize: 13, alignSelf: 'center', fontWeight: 500 }}>{coursePage} / {Math.ceil(filteredCourses.length / coursesPerPage)}</span>
                    <button className="btn btn-secondary btn-sm" disabled={coursePage >= Math.ceil(filteredCourses.length / coursesPerPage)} onClick={() => setCoursePage(p => p + 1)}>{t('common.next', 'Keyingi')}</button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>{t('admin.coursesTab.tableExams.title', 'Imtihon nomi')}</th>
                        <th>{t('admin.coursesTab.tableExams.questionsCount', 'Savollar')}</th>
                        <th>{t('admin.coursesTab.tableExams.passingScore', "O'tish bali")}</th>
                        <th>{t('admin.coursesTab.tableExams.timeLimit', 'Vaqt limiti')}</th>
                        <th>{t('admin.coursesTab.tableExams.status', 'Holat')}</th>
                        <th style={{ textAlign: 'right' }}>{t('admin.coursesTab.tableExams.actions', 'Amallar')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayExams.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: 30, color: 'var(--text-tertiary)' }}>{t('admin.coursesTab.emptyExams', 'Imtihonlar topilmadi')}</td>
                        </tr>
                      ) : displayExams.map(e => (
                        <tr key={e.id || e._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ width: 10, height: 10, borderRadius: '50%', background: e.color || '#ef4444', flexShrink: 0 }} />
                              <span style={{ fontWeight: 600 }}>{e.title}</span>
                            </div>
                          </td>
                          <td>{e.questionsCount || (e.questions ? e.questions.length : 0)} ta</td>
                          <td>{e.passing || e.passingScore || 0}%</td>
                          <td>{e.duration || e.timeLimitMinutes || 0} {t('schedule.minutes', 'daqiqa')}</td>
                          <td>
                            <span className="badge badge-green">{t('admin.coursesTab.status.active', 'Faol')}</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setSelectedExam(e); setIsExamModalOpen(true); }} title={t('common.edit', 'Tahrirlash')}>
                                <Settings size={16} />
                              </button>
                              <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--red-500)' }} onClick={() => handleDeleteExam(e.id || e._id)} title={t('common.delete', "O'chirish")}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredExams.length > examsPerPage && (
                  <div className="admin-pagination" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-1)', display: 'flex', justifyContent: 'center', gap: 10 }}>
                    <button className="btn btn-secondary btn-sm" disabled={examPage === 1} onClick={() => setExamPage(p => p - 1)}>{t('common.prev', 'Oldingi')}</button>
                    <span style={{ fontSize: 13, alignSelf: 'center', fontWeight: 500 }}>{examPage} / {Math.ceil(filteredExams.length / examsPerPage)}</span>
                    <button className="btn btn-secondary btn-sm" disabled={examPage >= Math.ceil(filteredExams.length / examsPerPage)} onClick={() => setExamPage(p => p + 1)}>{t('common.next', 'Keyingi')}</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAHLIL TAB */}
        {activeTab === 'analytics' && (
          <div className="admin-overview" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="grid grid-4">
              {loadingAnalytics ? (
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                  <InlineState text={t('admin.loading.kpis', 'KPI ko‘rsatkichlari yuklanmoqda...')} height={120} />
                </div>
              ) : analyticsError ? (
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                  <InlineState
                    text={analyticsError}
                    height={120}
                    action={<button className="btn btn-secondary btn-sm" onClick={retryAnalytics}>{t('common.retry', 'Qayta urinish')}</button>}
                  />
                </div>
              ) : displayKpis.length === 0 ? (
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                  <EmptyState text={t('admin.empty.kpis', 'KPI ma’lumotlari hali shakllanmagan')} height={120} />
                </div>
              ) : displayKpis.map((kpi, i) => {
                const key = kpi.key || ['totalUsers', 'activeCourses', 'certificates', 'averageScore'][i] || `metric${i + 1}`;
                const IconComponent = key === 'totalUsers' ? Users : key === 'activeCourses' ? BookOpen : key === 'certificates' ? Award : Clock;
                const trendUp = (kpi.direction || (kpi.up === false ? 'down' : 'up')) !== 'down';
                return (
                  <div key={key} className="stat-card">
                    <div className="stat-header">
                      <div>
                        <div className="stat-label">{t(`admin.kpis.${key}`, kpi.label || key) as React.ReactNode}</div>
                        <div className="stat-value" style={{ marginTop: 6 }}>{kpi.value as React.ReactNode}</div>
                      </div>
                      <div className="stat-icon" style={{ background: `${kpi.color || '#3b82f6'}15` }}>
                        <IconComponent size={20} color={kpi.color || '#3b82f6'} />
                      </div>
                    </div>
                    <div className={clsx('stat-change', trendUp ? 'up' : 'down')}>
                      {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {formatKpiChange(kpi)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-2" style={{ gap: 24 }}>
              <div className="card">
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>{t('admin.analytics.monthlyActivity', 'Foydalanuvchilar faolligi (Oylik)')}</div>
                {loadingAnalytics ? (
                  <InlineState text={t('admin.loading.monthly', 'Oylik faollik yuklanmoqda...')} height={260} />
                ) : analyticsError ? (
                  <InlineState
                    text={analyticsError}
                    height={260}
                    action={<button className="btn btn-secondary btn-sm" onClick={retryAnalytics}>{t('common.retry', 'Qayta urinish')}</button>}
                  />
                ) : displayMonthly.length === 0 ? (
                  <EmptyState text={t('admin.empty.monthly', 'Oylik faollik ma’lumotlari hali yo‘q')} height={260} />
                ) : (
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={displayMonthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="m" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 10, fontSize: 12 }} />
                        <Line type="monotone" dataKey="users" name={t('admin.chart.users', 'A’zolar')} stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="completions" name={t('admin.chart.completions', 'Bitiruvlar')} stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="card">
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>{t('admin.analytics.departmentRatings', 'Bo‘limlar kesimida reytinglar')}</div>
                {loadingAnalytics ? (
                  <InlineState text={t('admin.loading.departments', 'Bo‘limlar reytingi yuklanmoqda...')} height={260} />
                ) : analyticsError ? (
                  <InlineState
                    text={analyticsError}
                    height={260}
                    action={<button className="btn btn-secondary btn-sm" onClick={retryAnalytics}>{t('common.retry', 'Qayta urinish')}</button>}
                  />
                ) : displayDept.length === 0 ? (
                  <EmptyState text={t('admin.empty.departments', 'Bo‘limlar kesimida reyting ma’lumotlari hali yo‘q')} height={260} />
                ) : (
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={displayDept} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={16}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="dept" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 10, fontSize: 12 }} />
                        <Bar dataKey="score" name={t('admin.chart.averageScore', 'O‘rtacha ball')} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="enrolled" name={t('admin.chart.enrolled', 'Ro‘yxatdan o‘tganlar')} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="grid grid-12" style={{ gap: 24, alignItems: 'start' }}>
            <div className="card" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 4, padding: 12 }}>
              <button className="admin-nav-item active" style={{ justifyContent: 'flex-start', padding: '10px 14px' }}>
                <Settings size={15} /> Umumiy sozlamalar
              </button>
              <button className="admin-nav-item" style={{ justifyContent: 'flex-start', padding: '10px 14px' }}>
                <Shield size={15} /> Xavfsizlik & Kirish
              </button>
              <button className="admin-nav-item" style={{ justifyContent: 'flex-start', padding: '10px 14px' }}>
                <Mail size={15} /> Xabarnomalar
              </button>
              <button className="admin-nav-item" style={{ justifyContent: 'flex-start', padding: '10px 14px' }}>
                <SlidersHorizontal size={15} /> Integratsiyalar
              </button>
            </div>
            <div className="card" style={{ gridColumn: 'span 8' }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Umumiy tizim sozlamalari</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="form-group">
                  <label className="form-label">Korporatsiya nomi</label>
                  <input type="text" className="input" defaultValue="AGMK Korporatsiyasi" />
                </div>
                <div className="form-group">
                  <label className="form-label">Tizim tili (Default)</label>
                  <select className="input" defaultValue="uz">
                    <option value="uz">O'zbekcha (Lotin)</option>
                    <option value="ru">Русский</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderTop: '1px solid var(--border-1)', borderBottom: '1px solid var(--border-1)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>AI yordamchi</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Barcha foydalanuvchilar uchun AI chatni yoqish</div>
                  </div>
                  <div className="toggle active">
                    <div className="toggle-thumb" />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                  <button className="btn btn-secondary">Bekor qilish</button>
                  <button className="btn btn-primary">Saqlash</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MONITORING TAB */}
        {activeTab === 'monitoring' && <ExamMonitoringPanel />}

      </div>

      <AdminUserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSave={() => loadUsers(false)}
        user={selectedUser}
        tr={t}
        departments={userDepartments}
        currentUser={currentUser}
      />
      <AdminUserDetailsPanel
        isOpen={isUserDetailsOpen}
        onClose={() => setIsUserDetailsOpen(false)}
        user={selectedUser}
        tr={t}
        onEdit={(u: any) => { setIsUserDetailsOpen(false); setSelectedUser(u); setIsUserModalOpen(true); }}
      />

      {isCourseModalOpen && (
        <AddCourseModal
          onClose={() => setIsCourseModalOpen(false)}
          onSuccess={() => { setIsCourseModalOpen(false); reloadCoursesAndExams(); }}
          courseToEdit={selectedCourse}
        />
      )}

      {isExamModalOpen && (
        <CreateExamWizard
          onClose={() => setIsExamModalOpen(false)}
          onSuccess={() => { setIsExamModalOpen(false); reloadCoursesAndExams(); }}
          examToEdit={selectedExam}
        />
      )}

    </div>
  );
}

// --- Exam Monitoring Panel ---------------------------------------------------
const RISK_COLORS: Record<string, string> = {
  NORMAL: '#22c55e', WARNING: '#f59e0b', CRITICAL: '#ef4444', TERMINATED: '#7f1d1d',
};
const RISK_LABELS: Record<string, string> = {
  NORMAL: 'XAVFSIZ', WARNING: 'OGOHLANTIRISH', CRITICAL: 'KRITIK', TERMINATED: 'YAKUNLANDI',
};

interface SessionData {
  attemptId: string;
  userId: string;
  testId: string;
  startedAt: string;
  activeDurationSeconds?: number;
  riskScore: number;
  violationCount: number;
  securityStatus: string;
  userName?: string;
  userNameRu?: string;
  employeeId?: string;
  departmentName?: string;
  position?: string;
  positionRu?: string;
  examTitle?: string;
  examTitleRu?: string;
  examCategory?: string;
  timeLimitMinutes?: number;
  recentViolation?: string;
  recentViolationAt?: string;
}

interface ViolationData {
  id: string;
  violationType: string;
  riskScore: number;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

function ExamMonitoringPanel() {
  const { t, i18n } = useTranslation();
  const socket = useSocket();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [events, setEvents] = useState<Array<{ time: string; msg: string; type: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [violations, setViolations] = useState<ViolationData[]>([]);
  const [loadingViolations, setLoadingViolations] = useState(false);
  const locale = i18n.language?.startsWith('ru') ? 'ru-RU' : 'uz-UZ';
  const isRu = i18n.language?.startsWith('ru');

  const formatTime = useCallback((value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  }, [locale]);

  const formatDuration = useCallback((seconds?: number) => {
    const safeSeconds = Math.max(0, Number(seconds) || 0);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }, []);

  const getUserName = useCallback((session: SessionData) => {
    const name = isRu ? session.userNameRu || session.userName : session.userName || session.userNameRu;
    return name || session.employeeId || session.userId?.slice(0, 8) || '-';
  }, [isRu]);

  const getExamTitle = useCallback((session: SessionData) => {
    const title = isRu ? session.examTitleRu || session.examTitle : session.examTitle || session.examTitleRu;
    return title || session.testId?.slice(0, 8) || '-';
  }, [isRu]);

  const getPosition = useCallback((session: SessionData) => {
    return (isRu ? session.positionRu || session.position : session.position || session.positionRu) || '-';
  }, [isRu]);

  const filteredSessions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sessions.filter((session) => {
      const status = session.securityStatus || 'NORMAL';
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      if (!matchesStatus) return false;
      if (!needle) return true;
      return [
        getUserName(session),
        getExamTitle(session),
        session.employeeId,
        session.departmentName,
        session.position,
        session.positionRu,
        session.recentViolation,
      ].some((value) => String(value || '').toLowerCase().includes(needle));
    });
  }, [getExamTitle, getUserName, query, sessions, statusFilter]);

  const loadSessions = useCallback(async () => {
    try {
      setError(null);
      const res = await apiClient.get('/exams/violations/admin/active-sessions');
      const data = res.data?.data ?? res.data ?? [];
      setSessions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || t('admin.monitoring.loadError', 'Monitoring malumotlarini yuklashda xatolik yuz berdi'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const openSessionDetails = useCallback(async (session: SessionData) => {
    setSelectedSession(session);
    setViolations([]);
    setLoadingViolations(true);
    try {
      const res = await apiClient.get(`/exams/violations/${session.attemptId}`);
      const data = res.data?.data ?? res.data ?? [];
      setViolations(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('admin.monitoring.detailsLoadError', 'Sessiya tafsilotlarini yuklashda xatolik'));
    } finally {
      setLoadingViolations(false);
    }
  }, [t]);

  useEffect(() => {
    loadSessions();
    const t = setInterval(loadSessions, 15000);
    return () => clearInterval(t);
  }, [loadSessions]);

  useEffect(() => {
    if (!socket) return;

    const handleViolation = (data: any) => {
      setSessions(prev => {
        const exists = prev.some(s => s.attemptId === data.attemptId);
        if (!exists) {
          return [{
            attemptId: data.attemptId,
            userId: data.userId || '',
            testId: data.testId || '',
            startedAt: new Date().toISOString(),
            riskScore: Number(data.riskScore) || 0,
            violationCount: Number(data.violationCount) || 0,
            securityStatus: data.securityStatus || 'WARNING',
            recentViolation: data.type,
            recentViolationAt: new Date().toISOString(),
          }, ...prev];
        }
        return prev.map(s =>
          s.attemptId === data.attemptId
            ? { ...s, riskScore: data.riskScore, violationCount: data.violationCount, securityStatus: data.securityStatus, recentViolation: data.type, recentViolationAt: new Date().toISOString() }
            : s
        );
      });
      setEvents(prev => [{
        time: new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        msg: t('admin.monitoring.eventViolation', '{{type}} - urinish: {{attempt}}', { type: data.type, attempt: String(data.attemptId || '').slice(0, 8) }),
        type: 'violation',
      }, ...prev].slice(0, 50));
    };

    const handleAutoSubmit = (data: any) => {
      setSessions(prev => prev.filter(s => s.attemptId !== data.attemptId));
      setEvents(prev => [{
        time: new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        msg: t('admin.monitoring.eventAutoSubmit', 'Avtomatik yakunlandi - {{attempt}} ({{reason}})', { attempt: String(data.attemptId || '').slice(0, 8), reason: data.reason || '-' }),
        type: 'auto_submit',
      }, ...prev].slice(0, 50));
    };

    socket.on('exam.violation', handleViolation);
    socket.on('exam.auto_submitted', handleAutoSubmit);
    return () => {
      socket.off('exam.violation', handleViolation);
      socket.off('exam.auto_submitted', handleAutoSubmit);
    };
  }, [locale, socket, t]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={20} color="#ef4444" /> {t('admin.monitoring.title', 'Imtihon monitoringi')}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {t('admin.monitoring.subtitle', 'Real-time anti-cheat nazorati - {{count}} ta faol sessiya', { count: sessions.length })}
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadSessions}>
          <CheckCircle size={13} /> {t('common.refresh', 'Yangilash')}
        </button>
      </div>

      <div className="card" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', padding: 14 }}>
        <div style={{ position: 'relative', minWidth: 240, flex: '1 1 320px' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            className="input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('admin.monitoring.searchPlaceholder', 'Xodim, tabel, imtihon yoki bolim boyicha qidirish')}
            style={{ paddingLeft: 34 }}
          />
        </div>
        <select className="input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={{ width: 190 }}>
          <option value="all">{t('admin.monitoring.allStatuses', 'Barcha holatlar')}</option>
          {Object.keys(RISK_LABELS).map((status) => (
            <option key={status} value={status}>{t(`admin.monitoring.risk.${status}`, RISK_LABELS[status])}</option>
          ))}
        </select>
      </div>

      <div className="r-grid-75">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-1)', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={14} color="var(--blue-400)" /> {t('admin.monitoring.activeSessions', 'Faol sessiyalar')}
            {!loading && <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 11 }}>{filteredSessions.length}/{sessions.length}</span>}
          </div>
          {loading ? (
            <InlineState text={t('admin.monitoring.loading', 'Faol sessiyalar yuklanmoqda...')} height={220} />
          ) : error ? (
            <InlineState
              text={error}
              height={220}
              action={<button className="btn btn-secondary btn-sm" onClick={loadSessions}>{t('common.retry', 'Qayta urinish')}</button>}
            />
          ) : filteredSessions.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              {sessions.length === 0
                ? t('admin.monitoring.noSessions', 'Hozirda faol imtihon sessiyalari yoq')
                : t('admin.monitoring.noFilteredSessions', 'Tanlangan filter boyicha sessiya topilmadi')}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--border-1)' }}>
                    {[
                      t('admin.monitoring.table.user', 'Foydalanuvchi'),
                      t('admin.monitoring.table.exam', 'Imtihon'),
                      t('admin.monitoring.table.started', 'Boshlangan'),
                      t('admin.monitoring.table.duration', 'Davomiylik'),
                      t('admin.monitoring.table.risk', 'Risk'),
                      t('admin.monitoring.table.violations', 'Buzilishlar'),
                      t('admin.monitoring.table.status', 'Holat'),
                      t('admin.monitoring.table.latest', 'Songgi'),
                      t('admin.monitoring.table.actions', 'Amallar'),
                    ].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map(s => (
                    <tr key={s.attemptId} style={{ borderBottom: '1px solid var(--border-1)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                        <div>{getUserName(s)}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{s.employeeId || '-'} - {s.departmentName || '-'}</div>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                        <div>{getExamTitle(s)}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{s.examCategory || getPosition(s)}</div>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{formatTime(s.startedAt)}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                        <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />{formatDuration(s.activeDurationSeconds)}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ height: 4, width: 60, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, Number(s.riskScore) || 0))}%`, background: s.riskScore > 70 ? '#ef4444' : s.riskScore > 40 ? '#f59e0b' : '#22c55e', borderRadius: 99 }} />
                          </div>
                          <span style={{ fontWeight: 700, color: s.riskScore > 70 ? '#ef4444' : s.riskScore > 40 ? '#f59e0b' : '#22c55e', fontSize: 11 }}>{s.riskScore}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{ fontWeight: 800, color: s.violationCount > 0 ? '#ef4444' : 'var(--text-muted)' }}>{s.violationCount}</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 99, fontSize: 10, fontWeight: 800, background: `${RISK_COLORS[s.securityStatus] || '#22c55e'}18`, color: RISK_COLORS[s.securityStatus] || '#22c55e', border: `1px solid ${RISK_COLORS[s.securityStatus] || '#22c55e'}30` }}>
                          {t(`admin.monitoring.risk.${s.securityStatus}`, RISK_LABELS[s.securityStatus] || s.securityStatus)}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: 11 }}>{s.recentViolation || '-'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openSessionDetails(s)}>
                          <Shield size={12} /> {t('common.details', 'Batafsil')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-1)', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={14} color="#f59e0b" /> {t('admin.monitoring.liveEvents', 'Jonli hodisalar')}
            {events.length > 0 && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{t('admin.monitoring.eventsCount', '{{count}} ta', { count: events.length })}</span>}
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto', padding: '8px 0' }}>
            {events.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                {t('admin.monitoring.waitingEvents', 'Hodisalar kutilmoqda...')}
              </div>
            ) : events.map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 16px', borderBottom: '1px solid var(--border-1)', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', marginTop: 2 }}>{e.time}</span>
                <span style={{ fontSize: 12, color: e.type === 'auto_submit' ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>
                  {e.type === 'auto_submit' ? '!' : '*'} {e.msg}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedSession && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedSession(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(15, 23, 42, 0.62)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div className="card" onClick={(event) => event.stopPropagation()} style={{ width: 'min(860px, 100%)', maxHeight: '86vh', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-1)', display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{t('admin.monitoring.detailsTitle', 'Sessiya tafsilotlari')}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>{getUserName(selectedSession)} - {getExamTitle(selectedSession)}</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedSession(null)}>{t('common.close', 'Yopish')}</button>
            </div>
            <div style={{ padding: 22, overflowY: 'auto' }}>
              <div className="grid grid-12" style={{ gap: 12, marginBottom: 18 }}>
                {[
                  [t('admin.monitoring.table.user', 'Foydalanuvchi'), getUserName(selectedSession)],
                  [t('admin.monitoring.employeeId', 'Tabel raqami'), selectedSession.employeeId || '-'],
                  [t('admin.monitoring.department', 'Bolim'), selectedSession.departmentName || '-'],
                  [t('admin.monitoring.position', 'Lavozim'), getPosition(selectedSession)],
                  [t('admin.monitoring.table.exam', 'Imtihon'), getExamTitle(selectedSession)],
                  [t('admin.monitoring.table.started', 'Boshlangan'), formatTime(selectedSession.startedAt)],
                  [t('admin.monitoring.table.duration', 'Davomiylik'), formatDuration(selectedSession.activeDurationSeconds)],
                  [t('admin.monitoring.table.status', 'Holat'), t(`admin.monitoring.risk.${selectedSession.securityStatus}`, RISK_LABELS[selectedSession.securityStatus] || selectedSession.securityStatus)],
                ].map(([label, value]) => (
                  <div key={label} className="card" style={{ gridColumn: 'span 3', padding: 12, background: 'var(--bg-2)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 5 }}>{label}</div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontWeight: 800, marginBottom: 10 }}>{t('admin.monitoring.violationsHistory', 'Buzilishlar tarixi')}</div>
              {loadingViolations ? (
                <InlineState text={t('admin.monitoring.detailsLoading', 'Tafsilotlar yuklanmoqda...')} height={140} />
              ) : violations.length === 0 ? (
                <InlineState text={t('admin.monitoring.noViolations', 'Bu sessiyada buzilishlar qayd etilmagan')} height={140} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {violations.map((violation) => (
                    <div key={violation.id} style={{ border: '1px solid var(--border-1)', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 13 }}>{violation.violationType}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>{formatTime(violation.createdAt)}</div>
                      </div>
                      <span style={{ color: '#ef4444', fontWeight: 800 }}>{violation.riskScore}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
