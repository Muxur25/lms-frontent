import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, TrendingDown, BookOpen, BarChart3, Award,
  Clock, Sparkles, Play, FileText,
  Trophy, Target, Zap, Calendar,
  ChevronRight, Star, CheckCircle, Bell, Video,
  Bot, CalendarDays, CircleDot, PieChart as PieChartIcon, X,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { getInitials, type EnterpriseRole } from '@/shared/lib/auth-user';
import { apiClient } from '@/api/axios';
import { aiApi, type AiRecommendation, type AiSource } from '@/api/ai.api';
import { gamificationApi, type GamificationSummary } from '@/api/gamification.api';
import { scheduleApi, type ScheduleEvent } from '@/api/schedule.api';
import {
  getResponseList,
  normalizeEnrollment,
  sortCurrentEnrollments,
  type EnrolledCourse,
} from '@/shared/lib/course-enrollments';

/* ── Data ─────────────────────────────────────── */
// Backend activity type -> icon/color mapping
const ACTIVITY_STYLE: Record<string, { color: string; icon: any }> = {
  lesson: { color: '#22c55e', icon: CheckCircle },
  enroll: { color: '#3b82f6', icon: BookOpen },
  cert: { color: '#f59e0b', icon: Award },
  exam: { color: '#8b5cf6', icon: Star },
};
const quickActions = [
  { label: 'Davom etish', tKey: 'continue', icon: Play, color: '#3b82f6', link: '/mylearning' },
  { label: 'Test boshlash', tKey: 'test', icon: FileText, color: '#f59e0b', link: '/assessments' },
  { label: 'Vebinar', tKey: 'webinar', icon: Video, color: '#22c55e', link: '/webinars' },
  { label: 'AI Assistant', tKey: 'ai', icon: Sparkles, color: '#8b5cf6', link: '/ai' },
  { label: 'Kurslar', tKey: 'courses', icon: BookOpen, color: '#06b6d4', link: '/courses' },
  { label: 'Sertifikatlar', tKey: 'certs', icon: Award, color: '#f59e0b', link: '/certifications' },
];

const Tip = ({ active, payload, label }: any) => active && payload?.length ? (
  <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
    <p style={{ color: 'var(--text-tertiary)', marginBottom: 4 }}>{label}</p>
    {payload.map((p: any) => <p key={p.name} style={{ color: p.color, fontWeight: 700 }}>{p.value}</p>)}
  </div>
) : null;

const rankColors = ['#f59e0b', '#94a3b8', '#b45309', '#64748b', '#64748b'];
const kpiColors = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6'];

type EmptyVariant = 'default' | 'courses' | 'ai' | 'events' | 'courseStatus' | 'departments' | 'activity';

type DashboardCourse = {
  id: string;
  enrollmentId: string;
  title: string;
  cat: string;
  prog: number;
  status: EnrolledCourse['status'];
  lessons?: number;
  color: string;
  instructor?: string;
  duration?: string;
};

type DashboardEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  status: ScheduleEvent['status'];
  type: ScheduleEvent['type'];
  color: string;
  icon: any;
  link: string;
  location: string;
  startsAtMs: number;
};

const emptyVisuals: Record<EmptyVariant, { icon: any; tone: string }> = {
  default: { icon: Sparkles, tone: '#64748b' },
  courses: { icon: BookOpen, tone: '#3b82f6' },
  ai: { icon: Bot, tone: '#8b5cf6' },
  events: { icon: CalendarDays, tone: '#06b6d4' },
  courseStatus: { icon: PieChartIcon, tone: '#22c55e' },
  departments: { icon: Trophy, tone: '#f59e0b' },
  activity: { icon: Bell, tone: '#ef4444' },
};

const EmptyBlock = ({ text, variant = 'default' }: { text: string; variant?: EmptyVariant }) => {
  const visual = emptyVisuals[variant];
  const Icon = visual.icon;

  return (
    <div className={`dash-empty-state dash-empty-${variant}`} style={{ ['--empty-tone' as any]: visual.tone }}>
      <div className="dash-empty-visual" aria-hidden="true">
        <span className="dash-empty-ring ring-one" />
        <span className="dash-empty-ring ring-two" />
        <span className="dash-empty-glow" />
        <Icon size={28} />

        {variant === 'courses' && (
          <div className="dash-empty-books">
            <i /><i /><i />
          </div>
        )}
        {variant === 'ai' && (
          <div className="dash-empty-nodes">
            <i /><i /><i />
          </div>
        )}
        {variant === 'events' && (
          <div className="dash-empty-calendar-dots">
            <i /><i /><i /><i />
          </div>
        )}
        {variant === 'courseStatus' && (
          <div className="dash-empty-donut">
            <i />
          </div>
        )}
        {variant === 'departments' && (
          <div className="dash-empty-podium">
            <i /><i /><i />
          </div>
        )}
        {variant === 'activity' && (
          <div className="dash-empty-feed">
            <i /><i /><i />
          </div>
        )}
        {variant === 'default' && <CircleDot className="dash-empty-dot-icon" size={15} />}
      </div>
      <div className="dash-empty-copy">{text}</div>
    </div>
  );
};

const roleDashboards: Record<EnterpriseRole, {
  title: string;
  subtitle: string;
  primaryAction: string;
  secondaryAction: string;
  primaryLink: string;
  secondaryLink: string;
}> = {
  super_admin: {
    title: 'Super Admin Boshqaruv Dashboardi',
    subtitle: 'Tizimning to\'liq boshqaruvi va nazorati (Super Admin)',
    primaryAction: 'Admin panel',
    secondaryAction: 'System AI',
    primaryLink: '/admin',
    secondaryLink: '/ai',
  },
  admin: {
    title: 'Tizim boshqaruvi dashboardi',
    subtitle: 'Platforma, foydalanuvchilar, rollar va xavfsizlik holati',
    primaryAction: 'Admin panel',
    secondaryAction: 'System AI',
    primaryLink: '/admin',
    secondaryLink: '/ai',
  },
  hr_manager: {
    title: 'HR boshqaruv dashboardi',
    subtitle: 'Xodimlar onboarding, progress va hisobotlari',
    primaryAction: 'Xodimlar',
    secondaryAction: 'HR AI',
    primaryLink: '/employees',
    secondaryLink: '/ai',
  },
  trainer: {
    title: 'Instruktor dashboardi',
    subtitle: 'Kurslar, vebinarlar, imtihonlar va oquvchilar natijasi',
    primaryAction: 'Kurs yaratish',
    secondaryAction: 'AI test',
    primaryLink: '/courses',
    secondaryLink: '/ai',
  },
  employee: {
    title: 'Mening oquv dashboardim',
    subtitle: 'Kurslar, imtihonlar, sertifikatlar va AI tavsiyalar',
    primaryAction: 'Davom etish',
    secondaryAction: 'AI Maslahat',
    primaryLink: '/mylearning',
    secondaryLink: '/ai',
  },
  executive: {
    title: 'Executive analytics dashboard',
    subtitle: 'Korporativ ta lim KPI, risklar va strategik hisobotlar',
    primaryAction: 'Analytics',
    secondaryAction: 'Executive AI',
    primaryLink: '/analytics',
    secondaryLink: '/ai',
  },
  department_manager: {
    title: 'Bolim rahbari dashboardi',
    subtitle: 'Bolim xodimlari progressi, imtihonlar va compliance',
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
  const dashboardInfo = roleDashboards[role] || roleDashboards.employee;
  const dashboard = {
    ...dashboardInfo,
    title: t('dash.roles.' + role + '.title', dashboardInfo.title),
    subtitle: t('dash.roles.' + role + '.subtitle', dashboardInfo.subtitle),
    primaryAction: t('dash.roles.' + role + '.primaryAction', dashboardInfo.primaryAction),
    secondaryAction: t('dash.roles.' + role + '.secondaryAction', dashboardInfo.secondaryAction)
  };
  const initials = getInitials(user?.firstName, user?.lastName, user?.fullName);
  const displayName = user?.firstName || user?.fullName?.split(' ')[0] || t('dash.userFallback', 'Foydalanuvchi');
  const userSubtitle = `${user?.department || 'AGMK'} • ${user?.position || dashboard.subtitle} • ${user?.roleLabel || role}`;
  const isRu = i18n.language === 'ru';

  const [courses, setCourses] = useState<DashboardCourse[]>([]);
  const [aiRecs, setAiRecs] = useState<AiRecommendation[]>([]);
  const [aiSource, setAiSource] = useState<AiSource>('fallback');
  const [aiLoading, setAiLoading] = useState(true);
  const [aiError, setAiError] = useState(false);
  const [aiHistory, setAiHistory] = useState<AiRecommendation[]>([]);
  const [aiHistoryLoading, setAiHistoryLoading] = useState(false);
  const [aiHistoryOpen, setAiHistoryOpen] = useState(false);
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(false);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState(false);
  const [gamification, setGamification] = useState<GamificationSummary | null>(null);

  const toDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const normalizeDashboardEvent = (event: ScheduleEvent): DashboardEvent | null => {
    if (!event?.id || !event?.startsAt) return null;
    if (!['upcoming', 'live', 'expiring'].includes(event.status)) return null;
    const title = isRu ? event.titleRu || event.title : event.title;
    if (!title) return null;
    const meta = {
      exam: { icon: FileText, color: '#22c55e', link: '/assessments' },
      webinar: { icon: Video, color: '#06b6d4', link: '/webinars' },
      certificate: { icon: Award, color: '#f59e0b', link: '/certifications' },
    }[event.type];
    return {
      id: event.id,
      title,
      date: new Date(event.startsAt).toLocaleDateString(isRu ? 'ru-RU' : 'uz-UZ', { day: '2-digit', month: 'short' }),
      time: event.time || new Date(event.startsAt).toLocaleTimeString(isRu ? 'ru-RU' : 'uz-UZ', { hour: '2-digit', minute: '2-digit' }),
      status: event.status,
      type: event.type,
      color: event.accent || meta.color,
      icon: meta.icon,
      link: meta.link,
      location: event.location || 'LMS',
      startsAtMs: new Date(event.startsAt).getTime(),
    };
  };

  useEffect(() => {
    let mounted = true;
    setAiLoading(true);
    setAiError(false);
    aiApi.getRecommendations(isRu ? 'ru' : 'uz')
      .then(res => {
        if (!mounted) return;
        setAiRecs(res.recommendations.slice(0, 3));
        setAiSource(res.source);
      })
      .catch(() => {
        if (!mounted) return;
        setAiError(true);
        setAiRecs([]);
        setAiSource('fallback');
      })
      .finally(() => { if (mounted) setAiLoading(false); });
    return () => { mounted = false; };
  }, [isRu]);

  useEffect(() => {
    let mounted = true;
    apiClient.get('/analytics/dashboard-extras')
      .then(res => {
        const data = res.data?.data ?? res.data;
        if (!mounted || !data) return;
        setLeaders(Array.isArray(data.leaders) ? data.leaders : []);
        setActivity(Array.isArray(data.activity) ? data.activity.map((a: any) => ({
            ...a,
            color: ACTIVITY_STYLE[a.type]?.color || '#3b82f6',
            icon: ACTIVITY_STYLE[a.type]?.icon || CheckCircle,
          })) : []);
      })
      .catch(() => {
        if (!mounted) return;
        setLeaders([]);
        setActivity([]);
      });

    setAnalyticsLoading(true);
    setAnalyticsError(false);
    apiClient.get('/analytics/executive')
      .then(res => {
        if (mounted) setAnalytics(res.data?.data ?? res.data ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setAnalytics(null);
        setAnalyticsError(true);
      })
      .finally(() => { if (mounted) setAnalyticsLoading(false); });

    gamificationApi.getMySummary()
      .then(res => {
        if (mounted) setGamification(res);
      })
      .catch(() => { if (mounted) setGamification(null); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!aiHistoryOpen) return;
    let mounted = true;
    setAiHistoryLoading(true);
    aiApi.getRecommendationHistory(isRu ? 'ru' : 'uz')
      .then(res => {
        if (mounted) setAiHistory(res.recommendations);
      })
      .catch(() => {
        if (mounted) setAiHistory([]);
      })
      .finally(() => { if (mounted) setAiHistoryLoading(false); });
    return () => { mounted = false; };
  }, [aiHistoryOpen, isRu]);

  useEffect(() => {
    let mounted = true;
    const from = new Date();
    const to = new Date(from);
    to.setDate(to.getDate() + 14);
    setEventsLoading(true);
    setEventsError(false);
    scheduleApi.get({ from: toDateKey(from), to: toDateKey(to) })
      .then(res => {
        if (!mounted) return;
        const normalized = Array.isArray(res?.events)
          ? res.events
            .map(normalizeDashboardEvent)
            .filter((item: DashboardEvent | null): item is DashboardEvent => Boolean(item))
            .sort((a: DashboardEvent, b: DashboardEvent) => a.startsAtMs - b.startsAtMs)
            .slice(0, 4)
          : [];
        setEvents(normalized);
      })
      .catch(() => {
        if (!mounted) return;
        setEvents([]);
        setEventsError(true);
      })
      .finally(() => { if (mounted) setEventsLoading(false); });
    return () => { mounted = false; };
  }, [isRu]);

  useEffect(() => {
    let isMounted = true;
    apiClient.get('/courses/my-enrollments')
      .then(res => {
        const normalized = getResponseList(res)
          .map(normalizeEnrollment)
          .filter((item: EnrolledCourse | null): item is EnrolledCourse => Boolean(item));
        const formatted = sortCurrentEnrollments(normalized).slice(0, 3).map((enrollment) => {
          const course = enrollment.course;
          return {
            id: course?.id || enrollment.courseId,
            enrollmentId: enrollment.enrollmentId,
            title: isRu ? course?.titleRu || course?.title || '' : course?.title || '',
            cat: isRu ? course?.catRu || course?.cat || '' : course?.cat || '',
            prog: enrollment.progress,
            status: enrollment.status,
            lessons: course?.lessons ?? 0,
            color: course?.color || '#3b82f6',
            instructor: course?.instructor || (isRu ? 'Преподаватель не указан' : "O'qituvchi belgilanmagan"),
            duration: course?.duration || '',
          };
        }).filter((course) => Boolean(course.id));
        if (isMounted) setCourses(formatted);
      })
      .catch(() => { if (isMounted) setCourses([]); });
    return () => {
      isMounted = false;
    };
  }, [isRu]);

  const areaData: any[] = useMemo(() => (analytics?.trends?.monthly || []).map((row: any) => ({
    m: row.month,
    h: row.learningHours ?? row.averageScore ?? row.attempts ?? 0,
    attempts: row.attempts || 0,
    learningHours: row.learningHours || 0,
  })), [analytics]);

  const pieData: any[] = useMemo(() => {
    const learning = analytics?.learning;
    const breakdown = learning?.statusBreakdown;
    const total = Number(breakdown?.total ?? learning?.enrollments ?? 0);
    if (!Number.isFinite(total) || total <= 0) return [];

    const completed = Math.min(total, Math.max(0, Number(breakdown?.completed ?? learning?.completions ?? 0)));
    const inProgress = breakdown
      ? Math.min(total, Math.max(0, Number(breakdown.inProgress ?? 0)))
      : Math.max(0, total - completed);
    const notStarted = breakdown ? Math.min(total, Math.max(0, Number(breakdown.notStarted ?? 0))) : 0;
    const rows = [
      { name: t('dash.statusPie.completed', 'Yakunlangan'), count: completed, color: '#22c55e' },
      { name: t('dash.statusPie.inProgress', 'Jarayonda'), count: inProgress, color: '#3b82f6' },
      { name: t('dash.statusPie.notStarted', 'Boshlanmagan'), count: notStarted, color: '#f59e0b' },
    ].filter((item) => item.count > 0);

    let remainingPercent = 100;
    return rows.map((item, index) => {
      const value = index === rows.length - 1
        ? Math.max(0, remainingPercent)
        : Math.round((item.count / total) * 100);
      remainingPercent -= value;
      return { ...item, value };
    }).filter((item) => item.value > 0);
  }, [analytics, t]);

  const barData: any[] = useMemo(() => (analytics?.rankings?.departments || []).map((dept: any) => ({
    d: dept.organizationCode ? `${dept.organizationCode} · ${dept.name || dept.department || dept.dept}` : dept.name || dept.department || dept.dept,
    name: dept.name || dept.department || dept.dept,
    organizationCode: dept.organizationCode || '',
    v: dept.averageScore || dept.score || 0,
    attempts: dept.attempts || 0,
    passRate: dept.passRate || 0,
    participants: dept.participants || 0,
  })), [analytics]);
  const topDepartment = barData[0];
  const departmentSummary = useMemo(() => {
    const attempts = barData.reduce((sum, item) => sum + Number(item.attempts || 0), 0);
    const participants = barData.reduce((sum, item) => sum + Number(item.participants || 0), 0);
    const avgScore = barData.length
      ? Math.round(barData.reduce((sum, item) => sum + Number(item.v || 0), 0) / barData.length)
      : 0;
    const avgPassRate = barData.length
      ? Math.round(barData.reduce((sum, item) => sum + Number(item.passRate || 0), 0) / barData.length)
      : 0;
    return { attempts, participants, avgScore, avgPassRate };
  }, [barData]);

  const dashboardStats: any[] = useMemo(() => {
    const apiStats = analytics?.kpis || [];
    if (!apiStats.length) return [];
    const iconMap = [CheckCircle, BookOpen, Star, Award];
    return apiStats.slice(0, 4).map((kpi: any, index: number) => {
      const label = kpi.labelKey
        ? t(kpi.labelKey, kpi.label)
        : kpi.label;

      // Build a contextual change subtitle based on changeType
      let changeText = '';
      const ch = kpi.change;
      switch (kpi.changeType) {
        case 'growth':
          changeText = ch !== 0 ? `${ch > 0 ? '+' : ''}${ch}% ${t('dash.vsLastMonth')}` : t('dash.vsLastMonth');
          break;
        case 'percent':
          changeText = `${ch} ${t('dash.kpi.ofTotal', 'jami dan')}`;
          break;
        case 'fraction':
          changeText = `${ch} ${t('dash.kpi.outOf', 'tadan')}`;
          break;
        case 'issued':
          changeText = `${ch} ${t('dash.kpi.issued', 'berilgan')}`;
          break;
        case 'joins':
          changeText = `${ch} ${t('dash.kpi.joins', 'qatnashuv')}`;
          break;
        case 'tokens':
          changeText = `${Number(ch).toLocaleString()} ${t('dash.kpi.tokens', 'token')}`;
          break;
        case 'active':
          changeText = `${ch} ${t('dash.kpi.active', 'faol')}`;
          break;
        default:
          changeText = String(ch || '');
      }

      return {
        label,
        value: String(kpi.value ?? 0),
        change: changeText,
        up: kpi.direction ? kpi.direction === 'up' : kpi.up !== false,
        icon: iconMap[index] || CheckCircle,
        c: kpiColors[index] || '#3b82f6',
        bg: `${kpiColors[index] || '#3b82f6'}18`,
      };
    });
  }, [analytics, t]);

  const goal = analytics?.executiveKpis?.employeeEngagement ?? 0;
  const learningSummary = [
    { l: t('dash.summary.totalHours', 'Jami soat'), v: `${analytics?.executiveKpis?.totalLearningHours ?? 0}h`, c: '#3b82f6' },
    { l: t('dash.summary.activeThisMonth', 'Bu oy faol'), v: analytics?.executiveKpis?.monthlyActiveLearners ?? 0, c: '#22c55e' },
    { l: t('dash.summary.averageScore', "O'rtacha ball"), v: analytics?.executiveKpis?.averageScore ?? 0, c: '#f59e0b' },
  ];
  const dashboardBadges = [
    { icon: Target, label: `Engagement ${goal}%`, color: '#3b82f6' },
    { icon: Trophy, label: `Completion ${analytics?.learning?.completions ?? 0}/${analytics?.learning?.enrollments ?? 0}`, color: '#22c55e' },
    { icon: Award, label: `${t('dash.certBadge', 'Sertifikat')} ${analytics?.certificates?.issued ?? 0}`, color: '#f59e0b' },
  ];
  const weekLabels = t('dash.gamification.weekdays', { returnObjects: true, defaultValue: ['D', 'S', 'C', 'P', 'J', 'S', 'Y'] }) as string[];
  const weekActivity = gamification?.weekActivity?.length ? gamification.weekActivity : weekLabels.map((_, index) => ({ date: String(index), active: false, isToday: false }));
  const journeyXp = gamification?.xp ?? user?.xp ?? 0;
  const journeyLevel = gamification?.level ?? user?.level ?? 1;
  const journeyTitleKey = gamification?.titleKey || String(gamification?.title || user?.title || 'Beginner').toLowerCase();
  const journeyTitle = t(`dash.gamification.titles.${journeyTitleKey}`, gamification?.title || user?.title || t('dash.gamification.beginner', 'Beginner'));
  const journeyBaseXp = gamification?.levelBaseXp ?? 0;
  const journeyNextLevelXp = gamification?.nextLevelXp ?? Math.max(100, journeyXp);
  const journeyXpToNext = gamification?.xpToNextLevel ?? Math.max(journeyNextLevelXp - journeyXp, 0);
  const journeyProgress = gamification?.levelProgress ?? Math.min(((journeyXp - journeyBaseXp) / Math.max(journeyNextLevelXp - journeyBaseXp, 1)) * 100, 100);
  const streakMessage = gamification?.nextBonus
    ? t('dash.gamification.streakMsgDynamic', {
      days: gamification.nextBonus.daysRemaining,
      target: gamification.nextBonus.days,
      xp: gamification.nextBonus.xp,
      defaultValue: `Yana ${gamification.nextBonus.daysRemaining} kun davom etsangiz ${gamification.nextBonus.days}-kunlik bonus (${gamification.nextBonus.xp} XP) olasiz.`,
    })
    : t('dash.gamification.streakComplete', 'Barcha streak bonuslari olingan. Faollikni davom ettiring.');
  const formatAiDate = (value?: string) => {
    if (!value) return '';
    try {
      return new Intl.DateTimeFormat(isRu ? 'ru-RU' : 'uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
    } catch {
      return '';
    }
  };

  return (
    <div>

      {/* ── HERO ── */}
      <div className="dash-hero fade-in" style={{ marginBottom: 24 }}>
        <div className="dash-hero-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div className="avatar avatar-lg" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', flexShrink: 0, overflow: 'hidden' }}>
              {(user as any)?.avatarName ? (
                <img src={(user as any).avatarName} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (user as any)?.avatar ? (
                <img src={(user as any).avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                initials
              )}
            </div>
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
              ...dashboardBadges,
            ].map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                <b.icon size={15} color={b.color} />
                <span>{b.label}</span>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t('dash.monthlyGoal', 'Faollik indeksi')}</span>
              <span style={{ fontWeight: 700, color: '#3b82f6' }}>{goal}%</span>
            </div>
            <div className="progress-bar" style={{ height: 8 }}>
              <div className="progress-fill" style={{ width: `${Math.min(goal, 100)}%` }} />
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
            {areaData.length ? (
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
            ) : <EmptyBlock text={t('dash.empty.activity_stats', "O'quv faolligi bo'yicha ma'lumot hali yo'q")} />}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
            {learningSummary.map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: s.c }}>{s.v}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      {role !== 'employee' && (
        <div className="grid grid-4 fade-in fade-in-1" style={{ marginBottom: 24 }}>
          {dashboardStats.length === 0 ? (
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <EmptyBlock text={t('dash.empty.kpi', "KPI ma'lumotlari hali shakllanmagan")} />
            </div>
          ) : dashboardStats.map((s, i) => (
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
                {s.change}
              </div>
            </div>
          ))}
        </div>
      )}

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
              <span style={{ fontSize: 11, fontWeight: 700 }}>{t('dash.qa.' + a.tKey, a.label)}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── GAMIFICATION (Streak & Journey) ── */}
      <div className="grid grid-2 fade-in fade-in-2" style={{ marginBottom: 24 }}>
        {/* Streak Widget */}
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(217,119,6,0.05))', border: '1px solid rgba(245,158,11,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#fbbf24' }}>
              <Zap size={18} fill="#fbbf24" /> {t('dash.learningStreak', 'O\'quv Seriyasi')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', background: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: 12 }}>
              Max: {gamification?.longestStreak ?? 0} {t('dash.gamification.days', 'kun')}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flexShrink: 0, width: 80, height: 80, borderRadius: '50%', background: 'rgba(245,158,11,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(245,158,11,0.3)' }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#fbbf24', lineHeight: 1 }}>{gamification?.currentStreak ?? 0}</span>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{t('dash.gamification.day', 'Kun')}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                {streakMessage}
              </p>
              <div style={{ display: 'flex', gap: 6, width: '100%' }}>
                {weekLabels.map((d, i) => (
                  <div key={`${weekActivity[i]?.date || i}`} title={weekActivity[i]?.date} style={{ flex: 1, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, background: weekActivity[i]?.active ? '#fbbf24' : 'rgba(255,255,255,0.05)', color: weekActivity[i]?.active ? '#000' : 'var(--text-tertiary)', outline: weekActivity[i]?.isToday ? '1px solid rgba(251,191,36,0.55)' : 'none' }}>
                    {d}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Level / Journey Widget */}
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(37,99,235,0.05))', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#60a5fa' }}>
              <Trophy size={18} fill="#3b82f6" /> {t('dash.yourJourney', 'Sizning yo\'lingiz')}
            </div>
            <Link to="/achievements" className="btn btn-ghost btn-sm" style={{ padding: '4px 10px', height: 'auto', fontSize: 11 }}>
              {t('dash.gamification.details', 'Batafsil')} <ChevronRight size={12} />
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flexShrink: 0, width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #3b82f6, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(59,130,246,0.3)' }}>
              <Star size={32} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{journeyTitle}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#60a5fa' }}>{t('dash.gamification.lvl', 'Lvl')} {journeyLevel}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>
                {journeyXp} / {journeyNextLevelXp} XP
              </div>
              <div className="progress-bar" style={{ height: 8, background: 'rgba(0,0,0,0.3)' }}>
                <div className="progress-fill" style={{ width: `${Math.min(Math.max(journeyProgress, 0), 100)}%`, background: '#60a5fa' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
                <span>{t('dash.gamification.xpEarned', "XP to'plandi")}</span>
                <span style={{ color: '#93c5fd', fontWeight: 700 }}>
                  {journeyXpToNext > 0
                    ? t('dash.gamification.nextLevelLeft', '{{xp}} XP qoldi', { xp: journeyXpToNext })
                    : t('dash.gamification.levelReady', 'Keyingi daraja tayyor')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CURRENT COURSES ── */}
      <div data-testid="dashboard-current-courses" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <BookOpen size={16} color="var(--blue-400)" /> {t('dash.myCourses', 'Joriy kurslarim')}
          </div>
          <Link to="/mylearning" data-testid="dashboard-current-courses-all" className="btn btn-ghost btn-sm">{t('common.all')} <ChevronRight size={13} /></Link>
        </div>
        <div className="grid grid-3 fade-in fade-in-2">
          {courses.length === 0 ? (
            <div className="card" data-testid="dashboard-current-courses-empty" style={{ gridColumn: '1 / -1' }}>
              <EmptyBlock text={t('dash.empty.courses', "Joriy kurslar topilmadi")} variant="courses" />
            </div>
          ) : courses.map((c) => (
            <div key={c.enrollmentId} data-testid="dashboard-current-course-card" className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ height: 6, background: `linear-gradient(90deg, ${c.color}, ${c.color}88)` }} />
              <div style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span className="badge badge-blue" style={{ background: `${c.color}15`, color: c.color, borderColor: `${c.color}30`, fontSize: 10 }}>{c.cat || t('myLearning.courseFallback', 'Kurs')}</span>
                  <span className={`badge ${c.status === 'completed' ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: 10 }}>
                    {c.status === 'completed' ? t('myLearning.completed', 'Yakunlangan') : t('myLearning.inProgress', 'Jarayonda')}
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{c.title || t('myLearning.courseFallback', 'Kurs')}</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>
                  <span>{c.instructor}</span>
                  {Boolean(c.lessons) && <span>{c.lessons} {t('dash.lessons')}</span>}
                  {c.duration && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} /> {c.duration}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div className="progress-bar" style={{ flex: 1, height: 6 }}>
                    <div className="progress-fill" style={{ width: `${c.prog}%`, background: c.color }} />
                  </div>
                  <span data-testid="dashboard-current-course-progress" style={{ fontSize: 12, fontWeight: 800, color: c.color }}>{c.prog}%</span>
                </div>
                <Link to={`/courses/${c.id}`} data-testid="dashboard-current-course-continue" className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
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
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{t('dash.aiRecs', 'AI Tavsiyalar')}</div>
              <div style={{ fontSize: 11, color: 'var(--violet-400)' }}>{t('dash.aiRecsSub', 'Sizga maxsus tanlangan')}</div>
            </div>
            <span className={`badge ${aiSource === 'ai' ? 'badge-green' : 'badge-blue'}`} style={{ fontSize: 10 }}>
              {aiSource === 'ai' ? 'AI' : t('dash.aiFallback', 'Smart')}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {aiLoading ? (
              Array.from({ length: 2 }).map((_, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--surface-1)', borderRadius: 12, border: '1px solid var(--border-1)' }}>
                  <div className="skeleton" style={{ width: 38, height: 38, borderRadius: 10 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ width: '70%', height: 14, marginBottom: 8 }} />
                    <div className="skeleton" style={{ width: '92%', height: 11 }} />
                  </div>
                </div>
              ))
            ) : aiRecs.length === 0 ? (
              <EmptyBlock text={aiError ? t('dash.aiLoadError', 'AI tavsiyalarni yuklab bo‘lmadi') : t('dash.empty.ai', "AI tavsiyalar hali shakllanmagan")} variant="ai" />
            ) : aiRecs.map((r, i) => {
              const content = (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--surface-1)', borderRadius: 12, border: '1px solid var(--border-1)', cursor: r.courseId ? 'pointer' : 'default', transition: 'all 0.2s' }}>
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
              );
              return r.courseId ? (
                <Link key={r.id || i} to={`/courses/${r.courseId}`} style={{ color: 'inherit', textDecoration: 'none' }}>{content}</Link>
              ) : (
                <div key={r.id || i}>{content}</div>
              );
            })}
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            data-testid="dashboard-ai-history-open"
            onClick={() => {
              setAiHistory(aiRecs);
              setAiHistoryOpen(true);
            }}
            style={{ width: '100%', marginTop: 14, justifyContent: 'center' }}
          >
            <Sparkles size={13} /> {t('dash.allRecs', 'Barcha tavsiyalar')}
          </button>
        </div>

        {/* Events */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={14} color="var(--cyan-400)" /> {t('dash.upcomingEvents', 'Yaqinlashayotgan voqealar')}
          </div>
          {eventsLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="skeleton-card" style={{ height: 58, marginBottom: index < 2 ? 8 : 0 }} />
            ))
          ) : eventsError ? (
            <EmptyBlock text={t('dash.eventsLoadError', "Voqealarni yuklab bo'lmadi")} variant="events" />
          ) : events.length === 0 ? (
            <EmptyBlock text={t('dash.empty.events', 'Yaqin kunlarga voqealar topilmadi')} variant="events" />
          ) : events.map((e, i) => (
            <Link
              key={e.id}
              to={e.link}
              data-testid="dashboard-upcoming-event"
              style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: i < events.length - 1 ? '1px solid var(--border-1)' : 'none', color: 'inherit', textDecoration: 'none', alignItems: 'center' }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${e.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 40 }}>
                <e.icon size={16} color={e.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span>{e.date}</span><span>{e.time}</span><span>{e.location}</span>
                </div>
              </div>
              <span className="badge badge-blue" style={{ fontSize: 10, flexShrink: 0 }}>{t(`schedule.status.${e.status}`, e.status)}</span>
              <ChevronRight size={14} color="var(--text-muted)" />
            </Link>
          ))}
          <Link to="/schedule" className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: 14, justifyContent: 'center' }}>
            {t('dash.fullSchedule', 'Butun jadval')}
          </Link>
        </div>
      </div>

      {/* ── CHARTS ── */}
      <div className="grid grid-2 fade-in fade-in-3" style={{ marginBottom: 24 }}>
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{t('dash.courseStatus', 'Kurs holati')}</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 14 }}>{t('dash.distribution', 'Umumiy taqsimot')}</div>
          <div style={{ height: 160 }}>
            {analyticsLoading ? (
              <div className="skeleton-card" style={{ height: '100%' }} />
            ) : analyticsError ? (
              <EmptyBlock text={t('dash.courseStatusLoadError', "Kurs holatini yuklab bo'lmadi")} variant="courseStatus" />
            ) : pieData.length ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 10, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyBlock text={t('dash.empty.course_status', "Kurs holati bo'yicha ma'lumot yo'q")} variant="courseStatus" />}
          </div>
          {pieData.map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />{p.name}
              </span>
              <span style={{ fontWeight: 700 }}>{p.value}% / {p.count}</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ gridColumn: '1 / -1', order: -1, position: 'relative', overflow: 'hidden', background: 'linear-gradient(145deg, var(--surface-1), rgba(59,130,246,0.05))' }}>
          <div style={{ position: 'absolute', inset: '0 0 auto auto', width: 180, height: 180, background: 'radial-gradient(circle, rgba(59,130,246,0.16), transparent 62%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 30, height: 30, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
                  <BarChart3 size={16} />
                </span>
                {t('dash.deptRating', "Bo'limlar reytingi")}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.45 }}>
                {t('dash.deptRatingSub', "Bo'limlar test natijasi, urinishlar va o'tish foizi bo'yicha solishtiriladi.")}
              </div>
            </div>
            <Link to="/leaderboard" style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '7px 10px', borderRadius: 10, background: 'var(--bg-2)', border: '1px solid var(--border-1)', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textDecoration: 'none' }}>
              {t('common.detail', 'Batafsil')} <ChevronRight size={13} />
            </Link>
          </div>
          <div style={{ position: 'relative' }}>
            {analyticsLoading ? (
              <div className="skeleton-card" style={{ height: 312 }} />
            ) : analyticsError ? (
              <EmptyBlock text={t('dash.deptRatingLoadError', "Bo'limlar reytingini yuklab bo'lmadi")} variant="departments" />
            ) : barData.length ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 14 }}>
                  <div style={{ padding: 14, borderRadius: 16, background: 'linear-gradient(135deg, rgba(15,23,42,0.04), rgba(59,130,246,0.09))', border: '1px solid var(--border-1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f59e0b', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0, marginBottom: 8 }}>
                      <Trophy size={14} /> {t('dash.deptTop', 'Eng yuqori bo‘lim')}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.25, marginBottom: 10, wordBreak: 'break-word' }}>{topDepartment?.d}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ padding: '5px 8px', borderRadius: 999, background: 'rgba(34,197,94,0.12)', color: '#16a34a', fontSize: 11, fontWeight: 800 }}>{topDepartment?.v}% {t('dash.score', 'Ball')}</span>
                      <span style={{ padding: '5px 8px', borderRadius: 999, background: 'rgba(59,130,246,0.12)', color: '#2563eb', fontSize: 11, fontWeight: 800 }}>{topDepartment?.passRate}% {t('dash.passRateShort', "o'tish")}</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(86px, 1fr))', gap: 8 }}>
                    {[
                      { label: t('dash.avgScore', "O'rtacha ball"), value: `${departmentSummary.avgScore}%`, color: '#3b82f6' },
                      { label: t('dash.passRate', "O'tish foizi"), value: `${departmentSummary.avgPassRate}%`, color: '#22c55e' },
                      { label: t('dash.attempts', 'Urinishlar'), value: departmentSummary.attempts.toLocaleString(), color: '#f59e0b' },
                      { label: t('dash.participants', 'Ishtirokchilar'), value: departmentSummary.participants.toLocaleString(), color: '#8b5cf6' },
                    ].map((item) => (
                      <div key={item.label} style={{ padding: 10, borderRadius: 14, background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 800, marginBottom: 5 }}>{item.label}</div>
                        <div style={{ fontSize: 16, color: item.color, fontWeight: 900 }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: 14, alignItems: 'stretch' }}>
                  <div style={{ minHeight: 178, padding: '10px 0 0', borderRadius: 14, background: 'rgba(255,255,255,0.025)' }}>
                    <ResponsiveContainer>
                      <BarChart data={barData.slice(0, 8)} barSize={18}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                        <XAxis dataKey="d" hide />
                        <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                        <Tooltip content={<Tip />} />
                        <Bar dataKey="v" name={t('dash.score', "Ball")} radius={[8, 8, 0, 0]}>
                          {barData.slice(0, 8).map((_, i) => <Cell key={i} fill={`hsl(${205 + i * 17}, 78%, 56%)`} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {barData.slice(0, 5).map((dept, index) => {
                      const color = index === 0 ? '#f59e0b' : index === 1 ? '#3b82f6' : index === 2 ? '#22c55e' : '#64748b';
                      return (
                        <div key={`${dept.d}-${index}`} style={{ display: 'grid', gridTemplateColumns: '30px minmax(0, 1fr) auto', alignItems: 'center', gap: 10, padding: 10, borderRadius: 14, background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}>
                          <div style={{ width: 28, height: 28, borderRadius: 10, background: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900 }}>#{index + 1}</div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 850, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dept.d}</div>
                            <div style={{ marginTop: 6, height: 5, borderRadius: 999, background: 'var(--border-1)', overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(100, Math.max(0, dept.v))}%`, height: '100%', borderRadius: 999, background: color }} />
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', minWidth: 72 }}>
                            <div style={{ fontSize: 13, fontWeight: 900, color }}>{dept.v}%</div>
                            <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{dept.attempts} {t('dash.attemptsShort', 'urinish')} · {dept.passRate}%</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : <EmptyBlock text={t('dash.empty.dept_ranking', "Bo'limlar reytingi hali shakllanmagan")} variant="departments" />}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Trophy size={14} color="#f59e0b" /> {t('dash.leaderboard', 'Reyting jadvali')}
          </div>
          {leaders.length === 0 ? <EmptyBlock text={t('dash.empty.leaderboard', "Reyting jadvali uchun ma'lumot yo'q")} variant="departments" /> : leaders.map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < leaders.length - 1 ? '1px solid var(--border-1)' : 'none' }}>
              <div style={{ width: 24, height: 24, borderRadius: 8, background: `${rankColors[i]}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: rankColors[i], minWidth: 24 }}>
                {l.rank}
              </div>
              <div className="avatar" style={{ width: 30, height: 30, fontSize: 10, background: `hsl(${200 + i * 25}, 70%, 45%)`, minWidth: 30 }}>
                {String(l.name || '').split(' ').map((n: string) => n[0]).join('')}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {l.name}
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
          {activity.length === 0 ? <EmptyBlock text={t('dash.empty.recent_activity', "So'nggi faollik topilmadi")} variant="activity" /> : activity.map((a, i) => (
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

      {aiHistoryOpen && typeof document !== 'undefined' && createPortal((
        <div
          data-testid="dashboard-ai-history-modal"
          role="dialog"
          aria-modal="true"
          aria-label={t('dash.aiHistoryTitle', 'Barcha AI tavsiyalar')}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.58)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setAiHistoryOpen(false)}
        >
          <div
            className="card"
            style={{
              width: 'min(720px, 100%)',
              maxHeight: '82vh',
              overflow: 'hidden',
              padding: 0,
              border: '1px solid rgba(139,92,246,0.28)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.42)',
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-1)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={18} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{t('dash.aiHistoryTitle', 'Barcha AI tavsiyalar')}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {t('dash.aiHistorySub', 'Sizga avval berilgan tavsiyalar tarixi')}
                </div>
              </div>
              <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => setAiHistoryOpen(false)} aria-label={t('common.close', 'Yopish')}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: 20, maxHeight: 'calc(82vh - 76px)', overflowY: 'auto' }}>
              {aiHistoryLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} style={{ display: 'flex', gap: 12, padding: 14, borderRadius: 12, background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
                      <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10 }} />
                      <div style={{ flex: 1 }}>
                        <div className="skeleton" style={{ width: '50%', height: 14, marginBottom: 8 }} />
                        <div className="skeleton" style={{ width: '86%', height: 12 }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : aiHistory.length === 0 ? (
                <EmptyBlock text={t('dash.aiHistoryEmpty', 'Tavsiyalar tarixi hali shakllanmagan')} variant="ai" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {aiHistory.map((item, index) => (
                    <div key={item.id || index} style={{ display: 'flex', gap: 12, padding: 14, borderRadius: 12, background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 40 }}>
                        <BookOpen size={17} color={item.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <div style={{ fontWeight: 800, fontSize: 14 }}>{item.title}</div>
                          <span className={`badge ${item.source === 'ai' ? 'badge-green' : 'badge-blue'}`} style={{ fontSize: 10 }}>
                            {item.source === 'ai' ? 'AI' : t('dash.aiFallback', 'Smart')}
                          </span>
                          {item.createdAt && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatAiDate(item.createdAt)}</span>}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>{item.reason}</div>
                        {item.courseId && (
                          <Link to={`/courses/${item.courseId}`} className="btn btn-ghost btn-sm" style={{ marginTop: 10, padding: '4px 0', height: 'auto' }} onClick={() => setAiHistoryOpen(false)}>
                            {t('dash.openCourse', 'Kursni ochish')} <ChevronRight size={12} />
                          </Link>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: item.color }}>{item.match}%</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t('dash.match', 'mos')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ), document.body)}

    </div>
  );
}
