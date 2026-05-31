import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, TrendingDown, BookOpen, BarChart3, Award,
  Clock, Sparkles, Play, FileText,
  Trophy, Flame, Target, Zap, Calendar,
  ChevronRight, Star, CheckCircle, Bell, Video,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { getInitials, type EnterpriseRole } from '@/shared/lib/auth-user';
import { apiClient } from '@/api/axios';
import { aiApi } from '@/api/ai.api';

/* ── Data ─────────────────────────────────────── */
const areaData = [
  { m: 'Yan', h: 12 }, { m: 'Fev', h: 18 }, { m: 'Mar', h: 14 },
  { m: 'Apr', h: 22 }, { m: 'May', h: 28 }, { m: 'Iyn', h: 24 },
  { m: 'Iyl', h: 34 },
];
const pieData = [
  { name: 'Yakunlagan', value: 45, color: 'var(--green-500)' },
  { name: 'Jarayonda', value: 30, color: 'var(--blue-500)' },
  { name: 'Boshlamagan', value: 25, color: 'var(--border-3)' },
];
const barData = [
  { d: 'IT', v: 87 }, { d: 'HR', v: 74 }, { d: 'Mol', v: 91 },
  { d: 'Muh', v: 68 }, { d: 'Xav', v: 82 },
];
const MOCK_COURSES = [
  { id: '1', title: 'React va TypeScript', cat: 'IT', prog: 68, lessons: 32, color: '#3b82f6', instructor: 'A.Toshev', left: '4 soat' },
  { id: '2', title: 'Sanoat Xavfsizligi', cat: 'Xavfsizlik', prog: 34, lessons: 18, color: '#ef4444', instructor: 'B.Rahimov', left: '8 soat' },
  { id: '3', title: 'Menejment Asoslari', cat: 'Boshqaruv', prog: 85, lessons: 24, color: '#8b5cf6', instructor: 'N.Karimova', left: '1 soat' },
];
const events = [
  { type: 'webinar', title: 'React 2026 Yangiliklari', date: '24 May', time: '14:00', color: '#3b82f6', icon: Video },
  { type: 'exam', title: 'Xavfsizlik sertifikati', date: '26 May', time: '10:00', color: '#f59e0b', icon: FileText },
  { type: 'deadline', title: 'ISO 9001 kursini tugating', date: '28 May', time: '23:59', color: '#ef4444', icon: Clock },
];
const MOCK_LEADERS = [
  { name: 'Kamola Y.', dept: 'HR', pts: 2840, change: 'up', rank: 1 },
  { name: 'Jahongir T.', dept: 'Muhandis', pts: 2710, change: 'up', rank: 2 },
  { name: 'Alisher H.', dept: 'IT', pts: 2580, change: 'same', rank: 3 },
  { name: 'Nargiza S.', dept: 'Boshqaruv', pts: 2450, change: 'down', rank: 4 },
  { name: 'Dilnoza K.', dept: 'Moliya', pts: 2310, change: 'up', rank: 5 },
];
const MOCK_AI_RECS = [
  { title: 'Docker va Kubernetes', reason: 'IT ko\'nikmalaringizga mos', color: '#3b82f6', match: 94 },
  { title: 'Loyiha Boshqaruvi', reason: 'Karyerangizni rivojlantirish uchun', color: '#8b5cf6', match: 88 },
  { title: 'Ma\'lumotlar Tahlili', reason: 'Eng ko\'p o\'qilayotgan kurs', color: '#06b6d4', match: 82 },
];
const MOCK_ACTIVITY = [
  { color: '#22c55e', text: 'React Hooks darsini yakunladingiz', time: '10 daqiqa oldin', icon: CheckCircle },
  { color: '#3b82f6', text: 'Sanoat Xavfsizligi kursiga yozildingiz', time: '2 soat oldin', icon: BookOpen },
  { color: '#f59e0b', text: 'ISO 9001 sertifikati yangilandi', time: 'Kecha', icon: Award },
  { color: '#8b5cf6', text: 'AI test natijasi: 94/100', time: '2 kun oldin', icon: Star },
];

// Backend activity type -> icon/color mapping
const ACTIVITY_STYLE: Record<string, { color: string; icon: any }> = {
  lesson: { color: '#22c55e', icon: CheckCircle },
  enroll: { color: '#3b82f6', icon: BookOpen },
  cert: { color: '#f59e0b', icon: Award },
  exam: { color: '#8b5cf6', icon: Star },
};
const quickActions = [
  { label: 'Davom etish', icon: Play, color: '#3b82f6', sub: 'React kursi', link: '/courses' },
  { label: 'Test boshlash', icon: FileText, color: '#f59e0b', sub: 'Xavfsizlik', link: '/assessments' },
  { label: 'Vebinar', icon: Video, color: '#22c55e', sub: 'Bugun 14:00', link: '/webinars' },
  { label: 'AI Assistant', icon: Sparkles, color: '#8b5cf6', sub: 'Yordam so\'rash', link: '/ai' },
  { label: 'Kurslar', icon: BookOpen, color: '#06b6d4', sub: 'Mavjud kurslar', link: '/courses' },
  { label: 'Sertifikatlar', icon: Award, color: '#f59e0b', sub: 'Sertifikatlarim', link: '/certifications' },
];

const Tip = ({ active, payload, label }: any) => active && payload?.length ? (
  <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
    <p style={{ color: 'var(--text-tertiary)', marginBottom: 4 }}>{label}</p>
    {payload.map((p: any) => <p key={p.name} style={{ color: p.color, fontWeight: 700 }}>{p.value}</p>)}
  </div>
) : null;

const rankColors = ['#f59e0b', '#94a3b8', '#b45309', '#64748b', '#64748b'];

const roleDashboards: Record<EnterpriseRole, {
  title: string;
  subtitle: string;
  goal: number;
  badges: Array<{ icon: typeof Flame; label: string; color: string }>;
  stats: Array<{ label: string; value: string; change: string; up: boolean; icon: typeof CheckCircle; c: string; bg: string }>;
  primaryAction: string;
  secondaryAction: string;
  primaryLink: string;
  secondaryLink: string;
}> = {
  super_admin: {
    title: 'Super Admin Boshqaruv Dashboardi',
    subtitle: 'Tizimning to\'liq boshqaruvi va nazorati (Super Admin)',
    goal: 98,
    badges: [
      { icon: Award, label: 'Barcha tizimlar faol', color: '#8b5cf6' },
      { icon: Trophy, label: 'System health 100%', color: '#22c55e' },
      { icon: Target, label: 'Barcha huquqlar', color: '#ef4444' },
    ],
    stats: [
      { label: 'Foydalanuvchilar', value: '1,284', change: '+42', up: true, icon: CheckCircle, c: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
      { label: 'Faol rollar', value: '7', change: '+2', up: true, icon: BookOpen, c: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
      { label: 'Audit ball', value: '99.9', change: '+0.8', up: true, icon: Star, c: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
      { label: 'Sertifikatlar', value: '24k', change: '+318', up: true, icon: Award, c: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    ],
    primaryAction: 'Admin panel',
    secondaryAction: 'System AI',
    primaryLink: '/admin',
    secondaryLink: '/ai',
  },
  admin: {
    title: 'Tizim boshqaruvi dashboardi',
    subtitle: 'Platforma, foydalanuvchilar, rollar va xavfsizlik holati',
    goal: 96,
    badges: [
      { icon: Award, label: '7 ta rol faol', color: '#3b82f6' },
      { icon: Trophy, label: 'System health 99.9%', color: '#22c55e' },
      { icon: Target, label: 'Audit tayyor', color: '#f59e0b' },
    ],
    stats: [
      { label: 'Foydalanuvchilar', value: '1,284', change: '+42', up: true, icon: CheckCircle, c: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
      { label: 'Faol rollar', value: '7', change: '+2', up: true, icon: BookOpen, c: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
      { label: 'Audit ball', value: '99.1', change: '+0.4', up: true, icon: Star, c: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
      { label: 'Sertifikatlar', value: '24k', change: '+318', up: true, icon: Award, c: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    ],
    primaryAction: 'Admin panel',
    secondaryAction: 'System AI',
    primaryLink: '/admin',
    secondaryLink: '/ai',
  },
  hr_manager: {
    title: 'HR boshqaruv dashboardi',
    subtitle: 'Xodimlar onboarding, progress va hisobotlari',
    goal: 84,
    badges: [
      { icon: Flame, label: '42 yangi onboarding', color: '#f59e0b' },
      { icon: Trophy, label: 'HR KPI 84%', color: '#22c55e' },
      { icon: Target, label: 'Compliance nazorat', color: '#3b82f6' },
    ],
    stats: [
      { label: 'Onboarding', value: '42', change: '+12', up: true, icon: CheckCircle, c: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
      { label: 'Faol xodimlar', value: '1,128', change: '+36', up: true, icon: BookOpen, c: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
      { label: 'Ortacha progress', value: '81%', change: '+4%', up: true, icon: Star, c: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
      { label: 'Hisobotlar', value: '18', change: '+3', up: true, icon: Award, c: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    ],
    primaryAction: 'Xodimlar',
    secondaryAction: 'HR AI',
    primaryLink: '/employees',
    secondaryLink: '/ai',
  },
  trainer: {
    title: 'Instruktor dashboardi',
    subtitle: 'Kurslar, vebinarlar, imtihonlar va oquvchilar natijasi',
    goal: 78,
    badges: [
      { icon: Flame, label: '8 ta dars tayyor', color: '#f59e0b' },
      { icon: Trophy, label: '245 learner', color: '#22c55e' },
      { icon: Target, label: 'Test sifati 91%', color: '#3b82f6' },
    ],
    stats: [
      { label: 'Kurslar', value: '12', change: '+2', up: true, icon: CheckCircle, c: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
      { label: 'Vebinarlar', value: '6', change: '+1', up: true, icon: BookOpen, c: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
      { label: 'Ortacha ball', value: '89.2', change: '+1.8', up: true, icon: Star, c: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
      { label: 'Sertifikat', value: '318', change: '+24', up: true, icon: Award, c: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    ],
    primaryAction: 'Kurs yaratish',
    secondaryAction: 'AI test',
    primaryLink: '/courses',
    secondaryLink: '/ai',
  },
  employee: {
    title: 'Mening oquv dashboardim',
    subtitle: 'Kurslar, imtihonlar, sertifikatlar va AI tavsiyalar',
    goal: 73,
    badges: [
      { icon: Flame, label: '12 kunlik streak', color: '#f59e0b' },
      { icon: Trophy, label: 'Top 3 da turibsiz', color: '#f59e0b' },
      { icon: Target, label: '73% maqsad', color: '#3b82f6' },
    ],
    stats: [
      { label: 'Yakunlangan', value: '24', change: '+3', up: true, icon: CheckCircle, c: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
      { label: 'Jarayondagi', value: '3', change: '+1', up: true, icon: BookOpen, c: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
      { label: "O'rtacha ball", value: '87.4', change: '+2.1', up: true, icon: Star, c: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
      { label: 'Sertifikatlar', value: '5', change: '+1', up: true, icon: Award, c: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    ],
    primaryAction: 'Davom etish',
    secondaryAction: 'AI Maslahat',
    primaryLink: '/courses',
    secondaryLink: '/ai',
  },
  executive: {
    title: 'Executive analytics dashboard',
    subtitle: 'Korporativ ta lim KPI, risklar va strategik hisobotlar',
    goal: 91,
    badges: [
      { icon: Flame, label: 'KPI 91%', color: '#22c55e' },
      { icon: Trophy, label: '24k sertifikat', color: '#f59e0b' },
      { icon: Target, label: 'Risk nazorat', color: '#3b82f6' },
    ],
    stats: [
      { label: 'Completion', value: '91%', change: '+6%', up: true, icon: CheckCircle, c: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
      { label: 'Faol bolimlar', value: '18', change: '+2', up: true, icon: BookOpen, c: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
      { label: 'Risk score', value: '7.2', change: '-1.4', up: false, icon: Star, c: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
      { label: 'ROI indeks', value: '3.4x', change: '+0.6', up: true, icon: Award, c: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    ],
    primaryAction: 'Analytics',
    secondaryAction: 'Executive AI',
    primaryLink: '/analytics',
    secondaryLink: '/ai',
  },
  department_manager: {
    title: 'Bolim rahbari dashboardi',
    subtitle: 'Bolim xodimlari progressi, imtihonlar va compliance',
    goal: 82,
    badges: [
      { icon: Flame, label: '64 xodim kuzatuvda', color: '#f59e0b' },
      { icon: Trophy, label: 'Compliance 82%', color: '#22c55e' },
      { icon: Target, label: '4 ta risk guruhi', color: '#ef4444' },
    ],
    stats: [
      { label: 'Bolim progress', value: '82%', change: '+5%', up: true, icon: CheckCircle, c: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
      { label: 'Xodimlar', value: '64', change: '+3', up: true, icon: BookOpen, c: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
      { label: 'Imtihon ball', value: '84.6', change: '+2.2', up: true, icon: Star, c: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
      { label: 'Sertifikatlar', value: '51', change: '+8', up: true, icon: Award, c: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    ],
    primaryAction: 'Bolim hisoboti',
    secondaryAction: 'Risk AI',
    primaryLink: '/analytics',
    secondaryLink: '/ai',
  },
};


/* ── Component ─────────────────────────────────── */
export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const role = (user?.role || user?.roles?.[0] || 'employee') as EnterpriseRole;
  const dashboard = roleDashboards[role] || roleDashboards.employee;
  const initials = getInitials(user?.firstName, user?.lastName, user?.fullName);
  const displayName = user?.firstName || user?.fullName?.split(' ')[0] || 'Alisher';
  const userSubtitle = `${user?.department || 'AGMK'} • ${user?.position || dashboard.subtitle} • ${user?.roleLabel || role}`;
  const isRu = i18n.language === 'ru';

  const [courses, setCourses] = useState<any[]>([]);
  const [aiRecs, setAiRecs] = useState(MOCK_AI_RECS);
  const [leaders, setLeaders] = useState(MOCK_LEADERS);
  const [activity, setActivity] = useState<any[]>(MOCK_ACTIVITY);

  useEffect(() => {
    let mounted = true;
    aiApi.getRecommendations()
      .then(res => {
        if (mounted && res?.recommendations?.length) setAiRecs(res.recommendations);
      })
      .catch(() => { /* mock fallback already set */ });

    apiClient.get('/analytics/dashboard-extras')
      .then(res => {
        const data = res.data?.data ?? res.data;
        if (!mounted || !data) return;
        if (data.leaders?.length) setLeaders(data.leaders);
        if (data.activity?.length) {
          setActivity(data.activity.map((a: any) => ({
            ...a,
            color: ACTIVITY_STYLE[a.type]?.color || '#3b82f6',
            icon: ACTIVITY_STYLE[a.type]?.icon || CheckCircle,
          })));
        }
      })
      .catch(() => { /* mock fallback already set */ });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    apiClient.get('/courses')
      .then(res => {
        const fetched = res.data?.data || res.data || [];
        const formatted = fetched.slice(0, 3).map((c: any) => ({
          id: c._id || c.id,
          title: isRu ? c.titleRu || c.title : c.title,
          cat: isRu ? c.catRu || c.cat : c.cat,
          prog: c.completion || 0,
          lessons: c.lessons,
          color: c.color || '#3b82f6',
          instructor: c.instructor,
          left: c.duration || '10 soat'
        }));
        if (isMounted) {
          setCourses(formatted.length > 0 ? formatted : MOCK_COURSES);
        }
      })
      .catch(err => {
        console.error('Error fetching dashboard courses:', err);
        if (isMounted) {
          setCourses(MOCK_COURSES);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [isRu]);

  return (
    <div>

      {/* ── HERO ── */}
      <div className="dash-hero fade-in" style={{ marginBottom: 24 }}>
        <div className="dash-hero-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div className="avatar avatar-lg" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', flexShrink: 0 }}>{initials}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px' }}>
                {t('dash.hello')}, {displayName}!
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
                {userSubtitle}
              </div>
              <div style={{ fontSize: 12, color: 'var(--blue-400)', marginTop: 6, fontWeight: 700 }}>
                {dashboard.title}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, marginBottom: 18, flexWrap: 'wrap' }}>
            {[
              ...dashboard.badges,
            ].map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                <b.icon size={15} color={b.color} />
                <span>{b.label}</span>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t('dash.monthlyGoal', 'Oylik maqsad')}</span>
              <span style={{ fontWeight: 700, color: '#3b82f6' }}>{dashboard.goal}%</span>
            </div>
            <div className="progress-bar" style={{ height: 8 }}>
              <div className="progress-fill" style={{ width: `${dashboard.goal}%` }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to={dashboard.primaryLink} className="btn btn-primary btn-sm"><Play size={13} /> {dashboard.primaryAction}</Link>
            <Link to={dashboard.secondaryLink} className="btn btn-secondary btn-sm"><Sparkles size={13} /> {dashboard.secondaryAction}</Link>
          </div>
        </div>

        <div className="dash-hero-right">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <BarChart3 size={14} color="var(--blue-400)" /> {t('dash.learningHours', "O'quv soatlari")}
          </div>
          <div style={{ height: 120 }}>
            <ResponsiveContainer>
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip content={<Tip />} />
                <Area type="monotone" dataKey="h" stroke="#3b82f6" strokeWidth={2} fill="url(#hg)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
            {[{ l: 'Jami soat', v: '34h', c: '#3b82f6' }, { l: 'Bu oy', v: '+12h', c: '#22c55e' }, { l: 'O\'rtacha', v: '4.8/kun', c: '#f59e0b' }].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: s.c }}>{s.v}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-4 fade-in fade-in-1" style={{ marginBottom: 24 }}>
            {dashboard.stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-header">
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ marginTop: 6 }}>{s.value}</div>
              </div>
              <div className="stat-icon" style={{ background: s.bg }}>
                <s.icon size={22} color={s.c} />
              </div>
            </div>
            <div className={`stat-change ${s.up ? 'up' : 'down'}`}>
              {s.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {s.change} {t('dash.vsLastMonth')}
            </div>
          </div>
        ))}
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="card fade-in fade-in-2" style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={14} color="var(--amber-400)" /> {t('dash.quickActions')}
        </div>
        <div className="r-grid-6">
          {quickActions.map((a, i) => (
            <Link key={i} to={a.link} className="btn btn-secondary" style={{ flexDirection: 'column', height: 80, gap: 6, borderRadius: 14, padding: '10px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: `${a.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <a.icon size={16} color={a.color} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700 }}>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── CURRENT COURSES ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <BookOpen size={16} color="var(--blue-400)" /> {t('dash.myCourses', 'Joriy kurslarim')}
          </div>
          <Link to="/courses" className="btn btn-ghost btn-sm">{t('common.all')} <ChevronRight size={13} /></Link>
        </div>
        <div className="grid grid-3 fade-in fade-in-2">
          {courses.map((c, i) => (
            <div key={i} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ height: 6, background: `linear-gradient(90deg, ${c.color}, ${c.color}88)` }} />
              <div style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span className="badge badge-blue" style={{ background: `${c.color}15`, color: c.color, borderColor: `${c.color}30`, fontSize: 10 }}>{c.cat}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} /> {c.left} {t('dash.left', 'qoldi')}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>{c.instructor} • {c.lessons} {t('dash.lessons')}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div className="progress-bar" style={{ flex: 1, height: 6 }}>
                    <div className="progress-fill" style={{ width: `${c.prog}%`, background: c.color }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: c.color }}>{c.prog}%</span>
                </div>
                <Link to={`/courses/${c.id}`} className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                  <Play size={12} /> {t('dash.continue', 'Davom etish')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── AI + EVENTS ── */}
      <div className="grid grid-12 fade-in fade-in-3" style={{ marginBottom: 24 }}>
        {/* AI Assistant */}
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(59,130,246,0.05))', border: '1px solid rgba(139,92,246,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{t('dash.aiRecs', 'AI Tavsiyalar')}</div>
              <div style={{ fontSize: 11, color: 'var(--violet-400)' }}>{t('dash.aiRecsSub', 'Sizga maxsus tanlangan')}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {aiRecs.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--surface-1)', borderRadius: 12, border: '1px solid var(--border-1)', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${r.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 38 }}>
                  <BookOpen size={16} color={r.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{r.reason}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: r.color }}>{r.match}%</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t('dash.match', 'mos')}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: 14, justifyContent: 'center' }}>
            <Sparkles size={13} /> {t('dash.allRecs', 'Barcha tavsiyalar')}
          </button>
        </div>

        {/* Events */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={14} color="var(--cyan-400)" /> {t('dash.upcomingEvents', 'Yaqinlashayotgan voqealar')}
          </div>
          {events.map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: i < events.length - 1 ? '1px solid var(--border-1)' : 'none' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${e.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 40 }}>
                <e.icon size={16} color={e.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{e.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, display: 'flex', gap: 8 }}>
                  <span>{e.date}</span><span>•</span><span>{e.time}</span>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm btn-icon"><ChevronRight size={14} /></button>
            </div>
          ))}
          <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: 14, justifyContent: 'center' }}>
            {t('dash.fullSchedule', 'Butun jadval')}
          </button>
        </div>
      </div>

      {/* ── CHARTS ── */}
      <div className="grid grid-3 fade-in fade-in-3" style={{ marginBottom: 24 }}>
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{t('dash.courseStatus', 'Kurs holati')}</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 14 }}>{t('dash.distribution', 'Umumiy taqsimot')}</div>
          <div style={{ height: 160 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 10, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {pieData.map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />{p.name}
              </span>
              <span style={{ fontWeight: 700 }}>{p.value}%</span>
            </div>
          ))}
        </div>

        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{t('dash.deptRating', "Bo'limlar reytingi")}</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 14 }}>{t('dash.testScores', 'Test ballari')}</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={barData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="d" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[50, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="v" name="Ball" radius={[6, 6, 0, 0]}>
                  {barData.map((_, i) => <Cell key={i} fill={`hsl(${200 + i * 18}, 75%, 58%)`} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Trophy size={14} color="#f59e0b" /> {t('dash.leaderboard', 'Reyting jadvali')}
          </div>
          {leaders.map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < leaders.length - 1 ? '1px solid var(--border-1)' : 'none' }}>
              <div style={{ width: 24, height: 24, borderRadius: 8, background: `${rankColors[i]}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: rankColors[i], minWidth: 24 }}>
                {l.rank}
              </div>
              <div className="avatar" style={{ width: 30, height: 30, fontSize: 10, background: `hsl(${200 + i * 25}, 70%, 45%)`, minWidth: 30 }}>
                {l.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {l.name}
                  {l.name === 'Alisher H.' && <span style={{ fontSize: 9, background: '#3b82f620', color: '#3b82f6', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>SEN</span>}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{l.dept}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: rankColors[i] }}>{l.pts.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: l.change === 'up' ? 'var(--green-400)' : l.change === 'down' ? 'var(--red-400)' : 'var(--text-muted)' }}>
                  {l.change === 'up' ? '↑' : l.change === 'down' ? '↓' : '–'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ACTIVITY ── */}
      <div className="card fade-in fade-in-4">
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Bell size={14} color="var(--blue-400)" /> {t('dash.recentActivity')}
        </div>
        <div className="form-grid-2" style={{ gap: '0 24px' }}>
          {activity.map((a, i) => (
            <div key={i} className="activity-item">
              <div style={{ width: 32, height: 32, borderRadius: 10, background: `${a.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 32 }}>
                <a.icon size={14} color={a.color} />
              </div>
              <div>
                <div style={{ fontSize: 13 }}>{a.text}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{a.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
