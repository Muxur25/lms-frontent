import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
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

type Tab = 'overview' | 'users' | 'courses' | 'analytics' | 'settings';

const areaData = [
  { name: 'Yan', users: 400 }, { name: 'Fev', users: 300 }, { name: 'Mar', users: 550 },
  { name: 'Apr', users: 480 }, { name: 'May', users: 700 }, { name: 'Iyn', users: 650 },
];

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  hr_manager: 'HR Manager',
  trainer: 'Trainer',
  employee: 'Xodim',
  executive: 'Executive',
  department_manager: 'Rahbar',
};

const MOCK_ADMIN_COURSES = [
  { id: '1', title: 'Sanoat Xavfsizligi Asoslari', cat: 'Xavfsizlik', level: "Boshlang'ich", enrolled: 245, lessons: 18, duration: '12 soat', rating: 4.9, status: 'active', color: '#ef4444', instructor: 'B. Rahimov' },
  { id: '2', title: 'React va TypeScript', cat: 'IT', level: "O'rta", enrolled: 189, lessons: 32, duration: '24 soat', rating: 4.8, status: 'active', color: '#3b82f6', instructor: 'A. Toshev' },
  { id: '3', title: 'Menejment va Liderlik', cat: 'Boshqaruv', level: 'Yuqori', enrolled: 156, lessons: 24, duration: '16 soat', rating: 4.7, status: 'active', color: '#8b5cf6', instructor: 'N. Karimova' },
];

const MOCK_ADMIN_EXAMS = [
  { id: '1', title: 'Sanoat Xavfsizligi', passing: 75, duration: 60, questionsCount: 40, status: 'active', color: '#ef4444' },
  { id: '2', title: 'React TypeScript Pro', passing: 80, duration: 90, questionsCount: 60, status: 'active', color: '#3b82f6' },
  { id: '3', title: 'Menejment Asoslari', passing: 70, duration: 45, questionsCount: 30, status: 'active', color: '#8b5cf6' },
];

const MOCK_KPIS = [
  { label: "Jami o'quvchilar", value: '1,284', change: '+8.4%', up: true, color: '#3b82f6' },
  { label: 'Kurslar yakunladi', value: '790', change: '+12.1%', up: true, color: '#22c55e' },
  { label: 'Sertifikatlar', value: '342', change: '+5.7%', up: true, color: '#f59e0b' },
  { label: "O'rtacha soat", value: '34.2', change: '-2.3%', up: false, color: '#8b5cf6' },
];

const MOCK_MONTHLY_DATA = [
  { m: 'Yan', users: 820, completions: 340, hours: 2100 },
  { m: 'Fev', users: 890, completions: 420, hours: 2480 },
  { m: 'Mar', users: 960, completions: 510, hours: 2850 },
  { m: 'Apr', users: 1020, completions: 580, hours: 3100 },
  { m: 'May', users: 1100, completions: 640, hours: 3400 },
  { m: 'Iyn', users: 1180, completions: 710, hours: 3800 },
  { m: 'Iyl', users: 1284, completions: 790, hours: 4200 },
];

const MOCK_DEPT_DATA = [
  { dept: 'IT', score: 87, enrolled: 145, completed: 112 },
  { dept: 'HR', score: 74, enrolled: 98, completed: 68 },
  { dept: 'Moliya', score: 91, enrolled: 87, completed: 79 },
  { dept: 'Muhandis', score: 68, enrolled: 234, completed: 142 },
  { dept: 'Xavfsizlik', score: 82, enrolled: 312, completed: 258 },
  { dept: 'Boshqaruv', score: 79, enrolled: 56, completed: 44 },
];

export default function AdminPage() {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Users Tab state
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Courses & Exams Tab state
  const [courses, setCourses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [coursesExamsLoading, setCoursesExamsLoading] = useState(true);
  const [coursesExamsTab, setCoursesExamsTab] = useState<'courses' | 'exams'>('courses');

  // Analytics Tab state
  const [kpis, setKpis] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [deptData, setDeptData] = useState<any[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Fetch Users
  useEffect(() => {
    if (activeTab === 'users' || activeTab === 'overview') {
      setLoadingUsers(true);
      apiClient.get('/users')
        .then(res => {
          const data = res.data?.data || res.data || [];
          setUsers(Array.isArray(data) ? data : []);
          setLoadingUsers(false);
        })
        .catch(err => {
          console.error('Error fetching users in admin:', err);
          setLoadingUsers(false);
        });
    }
  }, [activeTab]);

  // Fetch Courses & Exams
  useEffect(() => {
    if (activeTab === 'courses') {
      setCoursesExamsLoading(true);
      Promise.all([
        apiClient.get('/courses'),
        apiClient.get('/exams')
      ])
        .then(([coursesRes, examsRes]) => {
          const coursesData = coursesRes.data?.data || coursesRes.data || [];
          const examsData = examsRes.data?.data || examsRes.data || [];
          setCourses(Array.isArray(coursesData) ? coursesData : []);
          setExams(Array.isArray(examsData) ? examsData : []);
          setCoursesExamsLoading(false);
        })
        .catch(err => {
          console.error('Error fetching courses/exams in admin:', err);
          setCoursesExamsLoading(false);
        });
    }
  }, [activeTab]);

  // Fetch Analytics
  useEffect(() => {
    if (activeTab === 'analytics') {
      setLoadingAnalytics(true);
      Promise.all([
        apiClient.get('/analytics/kpis'),
        apiClient.get('/analytics/monthly'),
        apiClient.get('/analytics/departments')
      ])
        .then(([kpisRes, monthlyRes, deptRes]) => {
          setKpis(kpisRes.data || []);
          setMonthlyData(monthlyRes.data || []);
          setDeptData(deptRes.data || []);
          setLoadingAnalytics(false);
        })
        .catch(err => {
          console.error('Error fetching analytics in admin:', err);
          setLoadingAnalytics(false);
        });
    }
  }, [activeTab]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await apiClient.patch(`/users/${userId}/role`, { role: newRole });
      setUsers(users.map(u => u.id === userId || u._id === userId ? { ...u, role: newRole } : u));
      toast.success('Rol muvaffaqiyatli o\'zgartirildi');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Rolni o\'zgartirishda xatolik yuz berdi');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    customConfirm('Haqiqatan ham bu foydalanuvchini o\'chirmoqchimisiz?', async () => {
      try {
        await apiClient.delete(`/users/${userId}`);
        setUsers(users.filter(u => u.id !== userId && u._id !== userId));
        toast.success('Foydalanuvchi muvaffaqiyatli o\'chirildi');
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Foydalanuvchini o\'chirishda xatolik yuz berdi');
      }
    });
  };

  const displayUsers = users;
  const displayCourses = courses.length > 0 ? courses : MOCK_ADMIN_COURSES;
  const displayExams = exams.length > 0 ? exams : MOCK_ADMIN_EXAMS;
  const displayKpis = kpis.length > 0 ? kpis : MOCK_KPIS;
  const displayMonthly = monthlyData.length > 0 ? monthlyData : MOCK_MONTHLY_DATA;
  const displayDept = deptData.length > 0 ? deptData : MOCK_DEPT_DATA;

  const Tip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
          <p style={{ color: 'var(--text-tertiary)', marginBottom: 4 }}>{label}</p>
          <p style={{ color: payload[0].color, fontWeight: 700 }}>{payload[0].value} foydalanuvchi</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="admin-layout">
      {/* ── Header ── */}
      <div className="admin-header fade-in">
        <div>
          <h1 className="page-title">Boshqaruv Paneli</h1>
          <p className="page-sub">AGMK LMS Enterprise • Tizim administratsiyasi</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary"><Download size={14} /> Hisobot</button>
          <button className="btn btn-primary"><Plus size={14} /> Yangi foydalanuvchi</button>
        </div>
      </div>

      {/* ── Navigation ── */}
      <div className="admin-nav fade-in">
        {[
          { id: 'overview', icon: LayoutDashboard, label: 'Umumiy' },
          { id: 'users', icon: Users, label: 'Foydalanuvchilar' },
          { id: 'courses', icon: BookOpen, label: 'Kurslar & Testlar' },
          { id: 'analytics', icon: BarChart3, label: 'Tahlil' },
          { id: 'settings', icon: Settings, label: 'Sozlamalar' },
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

      {/* ── Content Area ── */}
      <div className="admin-content fade-in fade-in-1">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="admin-overview">
            <div className="grid grid-4" style={{ marginBottom: 24 }}>
              {[
                { label: 'Jami xodimlar', value: '1,284', icon: Users, color: '#3b82f6', trend: '+12%' },
                { label: 'Faol kurslar', value: '64', icon: BookOpen, color: '#8b5cf6', trend: '+4' },
                { label: 'Sertifikatlar', value: '892', icon: Award, color: '#22c55e', trend: '+28%' },
                { label: 'Tizim salomatligi', value: '99.9%', icon: ServerCrash, color: '#10b981', trend: 'Zo\'r' },
              ].map((s, i) => (
                <div key={i} className="stat-card">
                  <div className="stat-header">
                    <div>
                      <div className="stat-label">{s.label}</div>
                      <div className="stat-value" style={{ marginTop: 6 }}>{s.value}</div>
                    </div>
                    <div className="stat-icon" style={{ background: `${s.color}15` }}>
                      <s.icon size={20} color={s.color} />
                    </div>
                  </div>
                  <div className="stat-change up">
                    <TrendingUp size={12} /> {s.trend}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-3" style={{ gap: 24 }}>
              <div className="card" style={{ gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Tizim faolligi</div>
                  <button className="btn btn-ghost btn-sm"><Calendar size={13} /> Oxirgi 6 oy</button>
                </div>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={areaData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Tooltip content={<Tip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Sparkles size={16} color="var(--violet-400)" />
                  <span style={{ fontWeight: 700, fontSize: 15 }}>AI Tahlil & Muammolar</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="admin-alert warning">
                    <AlertTriangle size={15} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>32 xodim testdan o'tmadi</div>
                      <div style={{ fontSize: 11, color: 'var(--amber-400)', opacity: 0.8 }}>Sanoat xavfsizligi kursi</div>
                    </div>
                  </div>
                  <div className="admin-alert info">
                    <TrendingUp size={15} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>Trafik 45% ga oshdi</div>
                      <div style={{ fontSize: 11, color: 'var(--blue-400)', opacity: 0.8 }}>Server resurslarini optimallashtiring</div>
                    </div>
                  </div>
                  <div className="admin-alert success">
                    <CheckCircle size={15} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>Yangi modul muvaffaqiyatli</div>
                      <div style={{ fontSize: 11, color: 'var(--green-400)', opacity: 0.8 }}>"React asoslari" 98% bitiruvchiga ega</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="admin-users card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="admin-toolbar">
              <div className="search-wrap" style={{ width: 300 }}>
                <Search size={14} className="search-icon" />
                <input type="text" className="input" placeholder="Xodimni qidirish..." style={{ paddingLeft: 36, fontSize: 13 }} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
                <button className="btn btn-secondary"><Filter size={14} /> Filtrlar</button>
                <button className="btn btn-secondary"><SlidersHorizontal size={14} /> Ko'rinish</button>
              </div>
            </div>
            
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Xodim</th>
                    <th>Rol</th>
                    <th>Bo'lim</th>
                    <th>Kurslar</th>
                    <th>Holat</th>
                    <th style={{ width: 50 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 30, color: 'var(--text-tertiary)' }}>Yuklanmoqda...</td>
                    </tr>
                  ) : displayUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 30, color: 'var(--text-tertiary)' }}>Foydalanuvchilar topilmadi</td>
                    </tr>
                  ) : (
                    displayUsers.map(u => {
                      const initials = (u.name || u.fullName || 'F U')
                        .split(' ')
                        .filter(Boolean)
                        .map((n: string) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2);
                      const roleText = roleLabels[u.role] || u.role || 'Xodim';
                      const deptText = u.dept || u.departmentName || '—';
                      const coursesText = u.courses !== undefined ? u.courses : (u.coursesCount || 0);
                      
                      const isGreen = u.status === 'active';
                      const isGray = u.status === 'offline';
                      
                      const canManage = currentUser?.role === 'super_admin' || currentUser?.role === 'admin';
                      const targetIsAdmin = u.role === 'admin' || u.role === 'super_admin';
                      
                      const disableActions = !canManage || (currentUser?.role === 'admin' && targetIsAdmin);
                      
                      return (
                        <tr key={u.id || u._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div className="avatar" style={{ width: 32, height: 32, fontSize: 11, background: 'var(--surface-2)' }}>
                                {initials}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{u.name || u.fullName}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            {canManage && !disableActions ? (
                              <select 
                                className="input" 
                                style={{ padding: '4px 8px', fontSize: 12, height: 'auto', minHeight: 28 }}
                                value={u.role || 'employee'}
                                onChange={(e) => handleRoleChange(u.id || u._id, e.target.value)}
                              >
                                {Object.entries(roleLabels).map(([key, label]) => {
                                  if (currentUser?.role === 'admin' && (key === 'super_admin' || key === 'admin')) return null;
                                  return <option key={key} value={key}>{label}</option>;
                                })}
                              </select>
                            ) : (
                              <span className="badge badge-gray">{roleText}</span>
                            )}
                          </td>
                          <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{deptText}</td>
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
                              {isGreen ? 'Faol' : isGray ? 'Oflayn' : 'Nofaol'}
                            </span>
                          </td>
                          <td>
                            {!disableActions && (
                              <button 
                                className="btn btn-ghost btn-sm btn-icon" 
                                style={{ color: 'var(--red-400)' }}
                                onClick={() => handleDeleteUser(u.id || u._id)}
                                title="O'chirish"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="admin-pagination">
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>1-5 dan jami {displayUsers.length} ko'rsatilmoqda</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-secondary btn-sm" disabled>Oldingi</button>
                <button className="btn btn-secondary btn-sm">Keyingi</button>
              </div>
            </div>
          </div>
        )}

        {/* KURSLAR & TESTLAR TAB */}
        {activeTab === 'courses' && (
          <div className="admin-users card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="admin-toolbar">
              <div style={{ display: 'flex', gap: 10, background: 'var(--surface-1)', borderRadius: 10, padding: 3, border: '1px solid var(--border-1)' }}>
                <button
                  className={clsx('btn btn-sm', coursesExamsTab === 'courses' ? 'btn-primary' : 'btn-ghost')}
                  style={{ borderRadius: 6 }}
                  onClick={() => setCoursesExamsTab('courses')}
                >
                  Kurslar
                </button>
                <button
                  className={clsx('btn btn-sm', coursesExamsTab === 'exams' ? 'btn-primary' : 'btn-ghost')}
                  style={{ borderRadius: 6 }}
                  onClick={() => setCoursesExamsTab('exams')}
                >
                  Imtihonlar / Testlar
                </button>
              </div>
            </div>
            
            {coursesExamsLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>Yuklanmoqda...</div>
            ) : coursesExamsTab === 'courses' ? (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Kurs nomi</th>
                      <th>Kategoriya</th>
                      <th>Daraja</th>
                      <th>Darslar</th>
                      <th>Davomiyligi</th>
                      <th>A'zolar</th>
                      <th>Reyting</th>
                      <th>Holat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayCourses.map(c => (
                      <tr key={c.id || c._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: c.color || '#3b82f6', flexShrink: 0 }} />
                            <span style={{ fontWeight: 600 }}>{c.title}</span>
                          </div>
                        </td>
                        <td><span className="badge badge-gray">{c.cat}</span></td>
                        <td>{c.level}</td>
                        <td>{c.lessons} ta</td>
                        <td>{c.duration}</td>
                        <td>{c.enrolled || 0} ta</td>
                        <td>⭐ {c.rating || 5.0}</td>
                        <td>
                          <span className={clsx('badge', c.status === 'active' || c.status === 'published' ? 'badge-green' : 'badge-amber')}>
                            {c.status === 'active' || c.status === 'published' ? 'Faol' : 'Qoralama'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Imtihon nomi</th>
                      <th>Savollar soni</th>
                      <th>O'tish bali</th>
                      <th>Vaqt limiti</th>
                      <th>Holat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayExams.map(e => (
                      <tr key={e.id || e._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: e.color || '#ef4444', flexShrink: 0 }} />
                            <span style={{ fontWeight: 600 }}>{e.title}</span>
                          </div>
                        </td>
                        <td>{e.questionsCount || (e.questions ? e.questions.length : 0)} ta</td>
                        <td>{e.passing || e.passingScore}%</td>
                        <td>{e.duration || e.timeLimitMinutes} daqiqa</td>
                        <td>
                          <span className="badge badge-green">Faol</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAHLIL TAB */}
        {activeTab === 'analytics' && (
          <div className="admin-overview" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="grid grid-4">
              {displayKpis.map((kpi, i) => {
                const IconComponent = i === 0 ? Users : i === 1 ? CheckCircle : i === 2 ? Award : Clock;
                const trendUp = kpi.up !== undefined ? kpi.up : kpi.change.startsWith('+');
                return (
                  <div key={i} className="stat-card">
                    <div className="stat-header">
                      <div>
                        <div className="stat-label">{kpi.label}</div>
                        <div className="stat-value" style={{ marginTop: 6 }}>{kpi.value}</div>
                      </div>
                      <div className="stat-icon" style={{ background: `${kpi.color || '#3b82f6'}15` }}>
                        <IconComponent size={20} color={kpi.color || '#3b82f6'} />
                      </div>
                    </div>
                    <div className={clsx('stat-change', trendUp ? 'up' : 'down')}>
                      {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {kpi.change} o'tgan oyga nisbatan
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-2" style={{ gap: 24 }}>
              <div className="card">
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Foydalanuvchilar faolligi (Oylik)</div>
                {loadingAnalytics ? (
                  <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>Yuklanmoqda...</div>
                ) : (
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={displayMonthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="m" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 10, fontSize: 12 }} />
                        <Line type="monotone" dataKey="users" name="A'zolar" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="completions" name="Bitiruvlar" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="card">
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Bo'limlar kesimida reytinglar</div>
                {loadingAnalytics ? (
                  <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>Yuklanmoqda...</div>
                ) : (
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={displayDept} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={16}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="dept" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 10, fontSize: 12 }} />
                        <Bar dataKey="score" name="O'rtacha ball" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="enrolled" name="Ro'yxatdan o'tganlar" fill="#3b82f6" radius={[4, 4, 0, 0]} />
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

      </div>
    </div>
  );
}
