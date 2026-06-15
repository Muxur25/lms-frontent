import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Award,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  Filter,
  Loader2,
  Search,
  Target,
  TrendingUp,
  User,
  X,
  XCircle,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { examsApi, type ExamResultsQuery } from '@/api/exams.api';
import { apiClient } from '@/api/axios';

type ResultRow = {
  attemptId: string;
  employeeName: string;
  department: string;
  examName: string;
  trainerName: string;
  score: number;
  percentage: number;
  passed: boolean;
  status: 'passed' | 'failed';
  attemptNumber: number;
  completedAt: string;
  duration: string;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  totalQuestions: number;
  certificateEligible: boolean;
};

type AnalyticsData = {
  kpis: {
    totalAttempts: number;
    passedExams: number;
    failedExams: number;
    averageScore: number;
    averageDuration: string;
    certificatesEarned: number;
    passRate: number;
    failRate: number;
  };
  results: ResultRow[];
  charts: {
    scoreDistribution: { range: string; count: number }[];
    passFail: { name: string; value: number }[];
    departments: { department: string; attempts: number; averageScore: number; passRate: number }[];
    trainers: { trainerId: string; trainerName: string; examsCreated: number; totalAttempts: number; averagePassRate: number; averageScore: number }[];
  };
  questionAnalytics: { questionId: string; examName: string; question: string; attempts: number; successPercentage: number; failurePercentage: number; skippedPercentage: number }[];
  topPerformers: ResultRow[];
  filters: {
    departments: string[];
    trainers: { id: string; name: string }[];
    exams: { id: string; title: string }[];
  };
};

type ExecutiveData = {
  generatedAt: string;
  scope: string;
  kpis: { key: string; label: string; value: string | number; change: string; direction: 'up' | 'down' }[];
  executiveKpis: {
    totalLearningHours: number;
    monthlyActiveLearners: number;
    averageScore: number;
    certificationRate: number;
    aiAdoptionRate: number;
    employeeEngagement: number;
  };
  learning: { totalCourses: number; enrollments: number; completions: number; abandonmentRate: number; averageCompletionTimeHours: number };
  exams: { attempts: number; passed: number; failed: number; passRate: number; averageScore: number };
  certificates: { issued: number; active: number; expired: number; revoked: number; trend: { month: string; issued: number }[] };
  webinars: { total: number; totalJoins: number; trend: { month: string; webinars: number; joins: number }[] };
  ai: { sessions: number; tokensUsed: number; adoptionRate: number; trend: { month: string; sessions: number; tokens: number }[] };
  rankings: {
    departments: { rank: number; name: string; attempts: number; averageScore: number; passRate: number }[];
    trainers: { rank: number; name: string; exams: number; attempts: number; averageScore: number; passRate: number }[];
    courses: { rank: number; name: string; enrollments: number; completionRate: number }[];
  };
  predictive: {
    certificationProbability: number;
    examSuccessProbability: number;
    dropoutRisk: number;
    lowEngagementUsers: number;
    recommendations: string[];
  };
  trends: { monthly: { month: string; attempts: number; averageScore: number; passRate: number }[] };
};

const emptyData: AnalyticsData = {
  kpis: {
    totalAttempts: 0,
    passedExams: 0,
    failedExams: 0,
    averageScore: 0,
    averageDuration: '0m 0s',
    certificatesEarned: 0,
    passRate: 0,
    failRate: 0,
  },
  results: [],
  charts: { scoreDistribution: [], passFail: [], departments: [], trainers: [] },
  questionAnalytics: [],
  topPerformers: [],
  filters: { departments: [], trainers: [], exams: [] },
};

const chartColors = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b'];
const pageSize = 15;

const unwrap = (payload: any): AnalyticsData => payload || emptyData;

  const formatChange = (t: any, changeStr: string) => {
    if (!changeStr) return changeStr;
    return changeStr
      .replace('active', tr(t, 'analytics.executive.kpiChange.active', 'active'))
      .replace('issued', tr(t, 'analytics.executive.kpiChange.issued', 'issued'))
      .replace('joins', tr(t, 'analytics.executive.kpiChange.joins', 'joins'))
      .replace('tokens', tr(t, 'analytics.executive.kpiChange.tokens', 'tokens'));
  };


const tr = (
  t: (key: string, options?: Record<string, unknown>) => string,
  key: string,
  defaultValue: string,
  values?: Record<string, string | number>,
) => t(key, { defaultValue, ...(values || {}) });

const initials = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';

const analyticsStyles = `
  .exam-analytics-root {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .analytics-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 4px;
    flex-wrap: wrap;
  }
  .analytics-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .analytics-scope-bar {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }
  .analytics-scope-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-height: 62px;
    padding: 12px 16px;
    border: 1px solid var(--border-1);
    border-radius: var(--radius-lg);
    background: var(--bg-2);
  }
  .analytics-scope-label {
    color: var(--text-tertiary);
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
  }
  .analytics-scope-value {
    color: var(--text-primary);
    font-size: 18px;
    font-weight: 900;
  }
  .exam-kpi-grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 12px;
  }
  .executive-bi-shell {
    display: grid;
    gap: 14px;
    padding: 18px;
    border: 1px solid var(--border-1);
    border-radius: var(--radius-2xl);
    background:
      linear-gradient(135deg, rgba(59,130,246,.12), rgba(34,211,238,.05)),
      var(--bg-2);
  }
  .executive-bi-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }
  .executive-bi-title {
    color: var(--text-primary);
    font-size: 22px;
    font-weight: 950;
  }
  .executive-bi-sub {
    margin-top: 4px;
    color: var(--text-tertiary);
    font-size: 13px;
  }
  .executive-bi-badge {
    display: inline-flex;
    align-items: center;
    min-height: 34px;
    padding: 0 12px;
    border: 1px solid rgba(34,211,238,.25);
    border-radius: 999px;
    background: rgba(34,211,238,.08);
    color: var(--cyan-400);
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
  }
  .executive-kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }
  .executive-kpi-card {
    min-height: 116px;
    padding: 16px;
    border: 1px solid var(--border-1);
    border-radius: var(--radius-lg);
    background: color-mix(in srgb, var(--bg-1) 82%, transparent);
  }
  .executive-kpi-label {
    color: var(--text-tertiary);
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }
  .executive-kpi-value {
    margin-top: 9px;
    color: var(--text-primary);
    font-size: 26px;
    font-weight: 950;
  }
  .executive-kpi-change {
    margin-top: 12px;
    font-size: 12px;
    font-weight: 850;
  }
  .executive-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(340px, .85fr);
    gap: 14px;
  }
  .executive-mini-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }
  .executive-mini {
    padding: 13px;
    border: 1px solid var(--border-1);
    border-radius: var(--radius-md);
    background: var(--surface-1);
  }
  .executive-mini span {
    display: block;
    color: var(--text-tertiary);
    font-size: 10px;
    font-weight: 900;
    text-transform: uppercase;
  }
  .executive-mini strong {
    display: block;
    margin-top: 7px;
    color: var(--text-primary);
    font-size: 20px;
    font-weight: 950;
  }
  .executive-recommendation {
    padding: 12px;
    border-radius: var(--radius-md);
    border: 1px solid rgba(59,130,246,.18);
    background: rgba(59,130,246,.08);
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.5;
  }
  .exam-kpi-card {
    position: relative;
    overflow: hidden;
    min-height: 116px;
    padding: 18px;
    border: 1px solid var(--border-1);
    border-radius: var(--radius-xl);
    background: var(--bg-2);
    transition: border-color .2s ease, background .2s ease, box-shadow .2s ease;
  }
  .exam-kpi-card:hover {
    border-color: var(--border-3);
    box-shadow: var(--shadow-sm);
  }
  .exam-kpi-card::before {
    content: "";
    position: absolute;
    inset: 0 0 auto;
    height: 2px;
    background: var(--accent);
    opacity: .75;
  }
  .exam-kpi-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .exam-kpi-label {
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 800;
  }
  .exam-kpi-value {
    margin-top: 9px;
    color: var(--text-primary);
    font-size: 24px;
    line-height: 1;
    font-weight: 950;
  }
  .exam-kpi-icon {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    border: 1px solid var(--border-1);
  }
  .exam-kpi-hint {
    margin-top: 18px;
    color: var(--text-tertiary);
    font-size: 12px;
    font-weight: 700;
  }
  .exam-filter-panel,
  .exam-panel {
    border: 1px solid var(--border-1);
    border-radius: var(--radius-xl);
    background: var(--bg-2);
  }
  .exam-filter-panel {
    padding: 16px;
  }
  .exam-filter-panel .input {
    min-height: 42px;
    background: var(--surface-1);
    border-color: var(--border-1);
  }
  .exam-panel {
    padding: 20px;
  }
  .exam-panel-title {
    color: var(--text-primary);
    font-size: 17px;
    font-weight: 900;
  }
  .exam-panel-sub {
    margin-top: 3px;
    color: var(--text-tertiary);
    font-size: 13px;
  }
  .exam-results-table {
    overflow-x: auto;
    border: 1px solid var(--border-1);
    border-radius: var(--radius-lg);
    background: var(--bg-1);
  }
  .exam-results-table table {
    min-width: 920px;
  }
  .exam-results-table thead th {
    background: var(--bg-2);
  }
  .exam-results-table tbody td {
    vertical-align: middle;
  }
  .exam-employee-cell {
    display: flex;
    align-items: center;
    gap: 11px;
    min-width: 190px;
  }
  .exam-row-avatar {
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: 11px;
    background: var(--surface-2);
    border: 1px solid var(--border-1);
    color: var(--blue-400);
    font-size: 12px;
    font-weight: 900;
  }
  .exam-score-track {
    height: 7px;
    width: 88px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--surface-2);
  }
  .exam-score-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--green-500), var(--cyan-400));
  }
  .exam-list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 12px;
    border: 1px solid var(--border-1);
    border-radius: var(--radius-md);
    background: var(--surface-1);
  }
  .exam-list-rank {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: 10px;
    background: var(--surface-2);
    color: var(--blue-400);
    font-size: 12px;
    font-weight: 950;
  }
  .exam-secondary-grid {
    display: grid;
    grid-template-columns: minmax(0, .92fr) minmax(0, 1.08fr);
    gap: 20px;
  }
  .exam-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-top: 16px;
  }
  .exam-pagination-info {
    color: var(--text-tertiary);
    font-size: 12px;
    font-weight: 800;
  }
  .exam-pagination-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .exam-page-pill {
    min-width: 38px;
    height: 34px;
    display: grid;
    place-items: center;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-1);
    background: var(--surface-1);
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 900;
  }
  .exam-page-pill.is-active {
    border-color: rgba(59,130,246,.35);
    background: rgba(59,130,246,.12);
    color: var(--blue-400);
  }
  .exam-soft-card {
    border: 1px solid var(--border-1);
    border-radius: var(--radius-md);
    background: var(--surface-1);
  }
  .exam-detail-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 18px;
    background: rgba(2,6,23,.62);
    background: color-mix(in srgb, var(--bg-0) 72%, transparent);
    backdrop-filter: blur(14px);
  }
  .exam-detail-modal {
    width: min(980px, 100%);
    max-height: 90vh;
    overflow: hidden;
    border: 1px solid var(--border-2);
    border-radius: var(--radius-2xl);
    background: var(--bg-1);
    box-shadow: var(--shadow-lg);
  }
  .exam-detail-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 18px;
    padding: 22px;
    border-bottom: 1px solid var(--border-1);
    background:
      linear-gradient(135deg, rgba(59,130,246,.12), rgba(34,211,238,.06)),
      var(--bg-2);
  }
  .exam-detail-title-row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }
  .exam-detail-avatar {
    width: 46px;
    height: 46px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-2);
    background: var(--surface-2);
    color: var(--blue-400);
  }
  .exam-detail-summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    padding: 18px 22px 0;
  }
  .exam-detail-question {
    border: 1px solid var(--border-1);
    border-radius: var(--radius-lg);
    background: var(--surface-1);
    padding: 16px;
  }
  @media (max-width: 1280px) {
    .exam-kpi-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .executive-kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .executive-grid { grid-template-columns: 1fr; }
    .exam-secondary-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 980px) {
    .analytics-scope-bar { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .analytics-header-actions { width: 100%; justify-content: flex-start; }
  }
  @media (max-width: 760px) {
    .analytics-scope-bar { grid-template-columns: 1fr; }
    .exam-kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .executive-mini-grid { grid-template-columns: 1fr; }
    .exam-panel { padding: 17px; }
    .exam-pagination { align-items: stretch; flex-direction: column; }
    .exam-pagination-actions { justify-content: space-between; }
    .exam-detail-hero { grid-template-columns: 1fr; }
    .exam-detail-summary { grid-template-columns: 1fr; padding: 14px 16px 0; }
  }
  @media (max-width: 520px) {
    .exam-kpi-grid { grid-template-columns: 1fr; }
    .executive-kpi-grid { grid-template-columns: 1fr; }
    .analytics-header-actions .btn { flex: 1 1 auto; }
    .exam-detail-backdrop { padding: 10px; align-items: stretch; }
    .exam-detail-modal { max-height: calc(100vh - 20px); }
  }
`;

export default function Analytics() {
  const { t } = useTranslation();
  const [data, setData] = useState<AnalyticsData>(emptyData);
  const [executive, setExecutive] = useState<ExecutiveData | null>(null);
  const [executiveLoading, setExecutiveLoading] = useState(true);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<ExamResultsQuery>({ status: 'all', sort: 'newest' });
  const [page, setPage] = useState(1);

  useEffect(() => {
    let mounted = true;
    setExecutiveLoading(true);
    apiClient.get('/analytics/executive')
      .then((response) => {
        if (mounted) setExecutive(response.data?.data || response.data || null);
      })
      .catch(() => {
        if (mounted) setExecutive(null);
      })
      .finally(() => {
        if (mounted) setExecutiveLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');

    const params = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value && value !== 'all'),
    ) as ExamResultsQuery;

    examsApi.getResultsAnalytics(params)
      .then((payload) => {
        if (mounted) setData(unwrap(payload));
      })
      .catch(() => {
        if (mounted) setError(tr(t, 'analytics.results.loadError', 'Imtihon natijalarini yuklashda xatolik yuz berdi.'));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [filters, t]);

  useEffect(() => {
    setPage(1);
  }, [filters, data.results.length]);

  useEffect(() => {
    if (!selectedAttemptId) {
      setDetails(null);
      return;
    }

    setDetailsLoading(true);
    examsApi.getAttemptResultDetails(selectedAttemptId)
      .then(setDetails)
      .catch(() => setError(tr(t, 'analytics.results.details.loadError', 'Urinish tafsilotlarini yuklashda xatolik yuz berdi.')))
      .finally(() => setDetailsLoading(false));
  }, [selectedAttemptId, t]);

  const kpis = useMemo(() => [
    { label: tr(t, 'analytics.results.kpi.totalAttempts', 'Jami urinishlar'), value: data.kpis.totalAttempts, icon: BarChart3, color: '#60a5fa', hint: tr(t, 'analytics.results.hints.submittedAttempts', 'Yakunlangan urinishlar') },
    { label: tr(t, 'analytics.results.kpi.passed', "O'tganlar"), value: data.kpis.passedExams, icon: CheckCircle2, color: '#22c55e', hint: tr(t, 'analytics.results.hints.passRate', "{{value}}% o'tish darajasi", { value: data.kpis.passRate }) },
    { label: tr(t, 'analytics.results.kpi.failed', 'Yiqilganlar'), value: data.kpis.failedExams, icon: XCircle, color: '#ef4444', hint: tr(t, 'analytics.results.hints.failRate', '{{value}}% yiqilish darajasi', { value: data.kpis.failRate }) },
    { label: tr(t, 'analytics.results.kpi.averageScore', "O'rtacha ball"), value: `${data.kpis.averageScore}%`, icon: Target, color: '#a78bfa', hint: tr(t, 'analytics.results.hints.averageScore', "O'rtacha natija") },
    { label: tr(t, 'analytics.results.kpi.averageDuration', "O'rtacha vaqt"), value: data.kpis.averageDuration, icon: Clock, color: '#f59e0b', hint: tr(t, 'analytics.results.hints.completionTime', 'Yakunlash vaqti') },
    { label: tr(t, 'analytics.results.kpi.certificates', 'Sertifikatlar'), value: data.kpis.certificatesEarned, icon: Award, color: '#2dd4bf', hint: tr(t, 'analytics.results.hints.eligibleAttempts', 'Sertifikatga mos urinishlar') },
  ], [data, t]);

  const passFailData = useMemo(() => data.charts.passFail.map((item) => ({
    ...item,
    name: item.name === 'Passed' ? tr(t, 'analytics.results.status.passed', "O'tdi") : tr(t, 'analytics.results.status.failed', 'Yiqildi'),
  })), [data.charts.passFail, t]);

  const totalPages = Math.max(1, Math.ceil(data.results.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedResults = useMemo(
    () => data.results.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [data.results, currentPage],
  );
  const pageStart = data.results.length ? (currentPage - 1) * pageSize + 1 : 0;
  const pageEnd = Math.min(currentPage * pageSize, data.results.length);

  const updateFilter = (key: keyof ExamResultsQuery, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const exportCsv = async () => {
    try {
      setExporting(true);
      setError('');
      const csv = await examsApi.exportResultsCsv(
        Object.fromEntries(Object.entries(filters).filter(([, value]) => value && value !== 'all')) as ExamResultsQuery,
      );
      const blob = new Blob([String(csv).startsWith('\uFEFF') ? csv : `\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `imtihon-natijalari-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError(tr(t, 'analytics.results.exportError', 'CSV eksport qilishda xatolik yuz berdi.'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="exam-analytics-root">
      <style>{analyticsStyles}</style>

      <div className="analytics-header fade-in">
        <div>
          <div className="page-title">{tr(t, 'analytics.results.title', 'Imtihon natijalari')}</div>
          <div className="page-sub">
            {tr(t, 'analytics.results.subtitle', "Natijalar, o'tish/yiqilish monitoringi, trainer va bo'lim statistikasi.")}
          </div>
        </div>
        <div className="analytics-header-actions">
          <button className="btn btn-primary" onClick={exportCsv} disabled={exporting || loading}>
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {exporting ? tr(t, 'analytics.results.actions.exporting', 'Yuklanmoqda...') : tr(t, 'analytics.results.actions.csvExport', 'CSV eksport')}
          </button>
          <button className="btn btn-secondary" onClick={() => setFilters({ status: 'all', sort: 'newest' })}>
            <Filter size={16} />
            {tr(t, 'analytics.results.actions.clear', 'Tozalash')}
          </button>
        </div>
      </div>

      <ExecutiveCenter data={executive} loading={executiveLoading} />

      <div className="analytics-scope-bar">
        <div className="analytics-scope-item">
          <span className="analytics-scope-label">{tr(t, 'analytics.results.scope.passRate', "O'tish darajasi")}</span>
          <span className="analytics-scope-value">{data.kpis.passRate}%</span>
        </div>
        <div className="analytics-scope-item">
          <span className="analytics-scope-label">{tr(t, 'analytics.results.scope.averageScore', "O'rtacha ball")}</span>
          <span className="analytics-scope-value">{data.kpis.averageScore}%</span>
        </div>
        <div className="analytics-scope-item">
          <span className="analytics-scope-label">{tr(t, 'analytics.results.scope.certificates', 'Sertifikatlar')}</span>
          <span className="analytics-scope-value">{data.kpis.certificatesEarned}</span>
        </div>
      </div>

      <div className="exam-kpi-grid">
        {kpis.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.035 }}
            className="exam-kpi-card"
            style={{ ['--accent' as any]: item.color }}
          >
            <div className="exam-kpi-top">
              <div>
                <div className="exam-kpi-label">{item.label}</div>
                <div className="exam-kpi-value">{item.value}</div>
              </div>
              <div className="exam-kpi-icon" style={{ background: `${item.color}18` }}>
                <item.icon size={22} color={item.color} />
              </div>
            </div>
            <div className="exam-kpi-hint">{item.hint}</div>
          </motion.div>
        ))}
      </div>

      <div className="exam-filter-panel">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold">
            <Filter size={17} color="var(--blue-400)" />
            {tr(t, 'analytics.results.filters.title', 'Natijalarni filtrlash')}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ status: 'all', sort: 'newest' })}>
            {tr(t, 'analytics.results.actions.clear', 'Tozalash')}
          </button>
        </div>
        <div className="grid gap-3 lg:grid-cols-6 md:grid-cols-3 sm:grid-cols-2">
          <FilterInput placeholder={tr(t, 'analytics.results.filters.search', 'Qidirish...')} value={filters.search || ''} onChange={(value) => updateFilter('search', value)} />
          <FilterSelect value={filters.department || ''} onChange={(value) => updateFilter('department', value)} options={data.filters.departments.map((name) => ({ value: name, label: name }))} placeholder={tr(t, 'analytics.results.filters.department', "Bo'lim")} />
          <FilterSelect value={filters.trainerId || ''} onChange={(value) => updateFilter('trainerId', value)} options={data.filters.trainers.map((item) => ({ value: item.id, label: item.name }))} placeholder={tr(t, 'analytics.results.filters.trainer', 'Trainer')} />
          <FilterSelect value={filters.examId || ''} onChange={(value) => updateFilter('examId', value)} options={data.filters.exams.map((item) => ({ value: item.id, label: item.title }))} placeholder={tr(t, 'analytics.results.filters.exam', 'Imtihon')} />
          <FilterSelect value={filters.status || 'all'} onChange={(value) => updateFilter('status', value)} options={[{ value: 'all', label: tr(t, 'common.all', 'Barchasi') }, { value: 'passed', label: tr(t, 'analytics.results.status.passed', "O'tdi") }, { value: 'failed', label: tr(t, 'analytics.results.status.failed', 'Yiqildi') }]} placeholder={tr(t, 'common.status', 'Holat')} />
          <FilterSelect value={filters.sort || 'newest'} onChange={(value) => updateFilter('sort', value)} options={[{ value: 'newest', label: tr(t, 'analytics.results.sort.newest', 'Eng yangi') }, { value: 'oldest', label: tr(t, 'analytics.results.sort.oldest', 'Eng eski') }, { value: 'highest', label: tr(t, 'analytics.results.sort.highest', 'Eng yuqori') }, { value: 'lowest', label: tr(t, 'analytics.results.sort.lowest', 'Eng past') }]} placeholder={tr(t, 'analytics.results.filters.sort', 'Saralash')} />
        </div>
      </div>

      {error && (
        <div className="card border-red-500/20 text-red-300">{error}</div>
      )}

      <div className="exam-panel">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="exam-panel-title">{tr(t, 'analytics.results.sections.resultsTable', 'Natijalar jadvali')}</div>
            <div className="exam-panel-sub">{tr(t, 'analytics.results.sections.resultsTableSub', 'Xodim, imtihon, ball, urinish va sertifikatga moslik.')}</div>
          </div>
          {loading && <div className="skeleton h-7 w-24" />}
        </div>
        <div className="exam-results-table">
          <table>
            <thead>
              <tr>
                <th>{tr(t, 'analytics.results.table.employee', 'Xodim')}</th>
                <th>{tr(t, 'analytics.results.table.exam', 'Imtihon')}</th>
                <th>{tr(t, 'analytics.results.table.score', 'Ball')}</th>
                <th>{tr(t, 'analytics.results.table.status', 'Holat')}</th>
                <th>{tr(t, 'analytics.results.table.attempt', 'Urinish')}</th>
                <th>{tr(t, 'analytics.results.table.completed', 'Yakunlangan')}</th>
                <th>{tr(t, 'analytics.results.table.duration', 'Davomiylik')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginatedResults.map((row) => (
                <tr key={row.attemptId}>
                  <td>
                    <div className="exam-employee-cell">
                      <div className="exam-row-avatar">{initials(row.employeeName)}</div>
                      <div className="min-w-0">
                        <div className="truncate font-bold text-[var(--text-primary)]">{row.employeeName}</div>
                        <div className="truncate text-xs text-[var(--text-tertiary)]">{row.department}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>{row.examName}</div>
                    <div className="text-xs text-[var(--text-tertiary)]">{row.trainerName}</div>
                  </td>
                  <td>
                    <div className="font-black text-[var(--text-primary)]">{row.score}%</div>
                    <div className="exam-score-track mt-2">
                      <div className="exam-score-fill" style={{ width: `${row.score}%` }} />
                    </div>
                  </td>
                  <td><span className={`badge ${row.passed ? 'badge-green' : 'badge-red'}`}>{row.passed ? tr(t, 'analytics.results.status.passed', "O'tdi") : tr(t, 'analytics.results.status.failed', 'Yiqildi')}</span></td>
                  <td>#{row.attemptNumber}</td>
                  <td>{row.completedAt ? new Date(row.completedAt).toLocaleDateString() : '-'}</td>
                  <td>{row.duration}</td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => setSelectedAttemptId(row.attemptId)}>
                      <Eye size={14} />
                      {tr(t, 'analytics.results.actions.detail', 'Batafsil')}
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && data.results.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[var(--text-tertiary)]">{tr(t, 'analytics.results.empty', 'Natijalar topilmadi.')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {data.results.length > pageSize && (
          <div className="exam-pagination">
            <div className="exam-pagination-info">
              {tr(t, 'analytics.results.pagination.range', '{{start}}-{{end}} / {{total}} natija', { start: pageStart, end: pageEnd, total: data.results.length })}
            </div>
            <div className="exam-pagination-actions">
              <button className="btn btn-secondary btn-sm" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                <ChevronLeft size={15} />
                {tr(t, 'analytics.results.pagination.prev', 'Oldingi')}
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).slice(Math.max(0, currentPage - 3), Math.max(0, currentPage - 3) + 5).map((item) => (
                <button key={item} className={`exam-page-pill ${item === currentPage ? 'is-active' : ''}`} onClick={() => setPage(item)}>
                  {item}
                </button>
              ))}
              <button className="btn btn-secondary btn-sm" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
                {tr(t, 'analytics.results.pagination.next', 'Keyingi')}
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="exam-secondary-grid">
        <Leaderboard title={tr(t, 'analytics.results.sections.topPerformers', 'Eng yaxshi natijalar')} rows={data.topPerformers.map((item) => ({
          name: item.employeeName,
          metric: `${item.score}%`,
          sub: `${item.examName} / ${item.department}`,
        }))} />
        <QuestionAnalytics rows={data.questionAnalytics} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <ChartCard title={tr(t, 'analytics.results.charts.scoreDistribution', 'Ball taqsimoti')} subtitle={tr(t, 'analytics.results.charts.scoreDistributionSub', "Ball diapazonlari bo'yicha urinishlar")}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.charts.scoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="range" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 10 }} />
              <Bar dataKey="count" fill="var(--blue-500)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={tr(t, 'analytics.results.charts.passFail', "O'tdi / yiqildi")} subtitle={tr(t, 'analytics.results.charts.passFailSub', 'Monitoring hisoblagichlari')}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={passFailData} dataKey="value" nameKey="name" outerRadius={92} innerRadius={58} paddingAngle={4}>
                {passFailData.map((_, index) => <Cell key={index} fill={chartColors[index]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Leaderboard title={tr(t, 'analytics.results.sections.departmentLeaderboard', "Bo'limlar reytingi")} rows={data.charts.departments.map((item) => ({
          name: item.department,
          metric: tr(t, 'analytics.results.metrics.avgPercent', "{{value}}% o'rtacha", { value: item.averageScore }),
          sub: tr(t, 'analytics.results.metrics.passAttempts', "{{passRate}}% o'tish / {{attempts}} urinish", { passRate: item.passRate, attempts: item.attempts }),
        }))} />
        <Leaderboard title={tr(t, 'analytics.results.sections.trainerAnalytics', 'Trainer tahlili')} rows={data.charts.trainers.map((item) => ({
          name: item.trainerName,
          metric: tr(t, 'analytics.results.metrics.passPercent', "{{value}}% o'tish", { value: item.averagePassRate }),
          sub: tr(t, 'analytics.results.metrics.trainerSummary', "{{exams}} imtihon / {{attempts}} urinish / {{average}}% o'rtacha", { exams: item.examsCreated, attempts: item.totalAttempts, average: item.averageScore }),
        }))} />
      </div>


      {selectedAttemptId && (
        <AttemptDetails
          loading={detailsLoading}
          details={details}
          onClose={() => setSelectedAttemptId(null)}
        />
      )}
    </div>
  );
}

function FilterInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={15} />
      <input className="input w-full pl-9" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ExecutiveCenter({ data, loading }: { data: ExecutiveData | null; loading: boolean }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="executive-bi-shell">
        <div className="skeleton h-8 w-72" />
        <div className="executive-kpi-grid">
          {Array.from({ length: 8 }, (_, index) => <div key={index} className="skeleton h-28" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const trend = data.trends.monthly.length ? data.trends.monthly : [
    { month: '-', attempts: 0, averageScore: 0, passRate: 0 },
  ];

  return (
    <div className="executive-bi-shell">
      <div className="executive-bi-top">
        <div>
          <div className="executive-bi-title">{tr(t, 'analytics.executive.title', 'Executive Analytics & BI Center')}</div>
          <div className="executive-bi-sub">
            {tr(t, 'analytics.executive.subtitle', 'Learning, exams, certificates, webinars, AI adoption and predictive intelligence in one command center.')}
          </div>
        </div>
        <div className="executive-bi-badge">{tr(t, `analytics.executive.scope.${data.scope}`, data.scope)}</div>
      </div>

      <div className="executive-kpi-grid">
        {data.kpis.map((item) => (
          <div key={item.key} className="executive-kpi-card">
            <div className="executive-kpi-label">{tr(t, `analytics.executive.kpi.${item.key}`, item.label)}</div>
            <div className="executive-kpi-value">{item.value}</div>
            <div className="executive-kpi-change" style={{ color: item.direction === 'up' ? 'var(--green-400)' : 'var(--red-400)' }}>
              {formatChange(t, item.change)}
            </div>
          </div>
        ))}
      </div>

      <div className="executive-grid">
        <ChartCard
          title={tr(t, 'analytics.executive.trend', 'Enterprise Performance Trend')}
          subtitle={tr(t, 'analytics.executive.trendSub', 'Monthly attempts, average score and pass-rate movement.')}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 10 }} />
              <Bar dataKey="attempts" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="averageScore" fill="#22c55e" radius={[6, 6, 0, 0]} />
              <Bar dataKey="passRate" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="exam-panel">
          <div className="mb-4">
            <div className="exam-panel-title">{tr(t, 'analytics.executive.kpiCenter', 'Executive KPI Center')}</div>
            <div className="exam-panel-sub">{tr(t, 'analytics.executive.kpiCenterSub', 'Board-level operating indicators and AI readiness.')}</div>
          </div>
          <div className="executive-mini-grid">
            <ExecutiveMini label={tr(t, 'analytics.executive.mini.learningHours', 'Learning Hours')} value={data.executiveKpis.totalLearningHours} />
            <ExecutiveMini label={tr(t, 'analytics.executive.mini.monthlyActive', 'Monthly Active')} value={data.executiveKpis.monthlyActiveLearners} />
            <ExecutiveMini label={tr(t, 'analytics.executive.mini.avgScore', 'Avg Score')} value={`${data.executiveKpis.averageScore}%`} />
            <ExecutiveMini label={tr(t, 'analytics.executive.mini.certification', 'Certification')} value={`${data.executiveKpis.certificationRate}%`} />
            <ExecutiveMini label={tr(t, 'analytics.executive.mini.aiAdoption', 'AI Adoption')} value={`${data.executiveKpis.aiAdoptionRate}%`} />
            <ExecutiveMini label={tr(t, 'analytics.executive.mini.engagement', 'Engagement')} value={`${data.executiveKpis.employeeEngagement}%`} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Leaderboard title={tr(t, 'analytics.executive.departmentRanking', 'Top Departments')} rows={data.rankings.departments.map((item) => ({
          name: item.name === 'Unassigned' ? tr(t, 'analytics.executive.department.unassigned', 'Unassigned') : item.name,
          metric: `${item.averageScore}%`,
          sub: tr(t, 'analytics.results.metrics.passAttempts', '{{passRate}}% pass / {{attempts}} attempts', { passRate: String(item.passRate), attempts: String(item.attempts) }),
        }))} />
        <Leaderboard title={tr(t, 'analytics.executive.trainerRanking', 'Top Trainers')} rows={data.rankings.trainers.map((item) => ({
          name: item.name === 'Unknown trainer' ? tr(t, 'analytics.executive.trainer.unknown', 'Unknown trainer') : (item.name === 'Current trainer' ? tr(t, 'analytics.executive.trainer.current', 'Current trainer') : item.name),
          metric: `${item.passRate}%`,
          sub: tr(t, 'analytics.results.metrics.trainerSummary', '{{exams}} exams / {{attempts}} attempts / {{average}}% avg', { exams: String(item.exams), attempts: String(item.attempts), average: String(item.averageScore) }),
        }))} />
        <Leaderboard title={tr(t, 'analytics.executive.courseRanking', 'Top Courses')} rows={data.rankings.courses.map((item) => ({
          name: item.name,
          metric: `${item.completionRate}%`,
          sub: tr(t, 'analytics.executive.metrics.enrollments', '{{enrollments}} enrollments', { enrollments: String(item.enrollments) }),
        }))} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[.95fr_1.05fr]">
        <div className="exam-panel">
          <div className="exam-panel-title">{tr(t, 'analytics.executive.predictive', 'Predictive Analytics')}</div>
          <div className="mt-4 executive-mini-grid">
            <ExecutiveMini label={tr(t, 'analytics.executive.mini.certProb', 'Certification Probability')} value={`${data.predictive.certificationProbability}%`} />
            <ExecutiveMini label={tr(t, 'analytics.executive.mini.examProb', 'Exam Success Probability')} value={`${data.predictive.examSuccessProbability}%`} />
            <ExecutiveMini label={tr(t, 'analytics.executive.mini.dropoutRisk', 'Dropout Risk')} value={`${data.predictive.dropoutRisk}%`} />
          </div>
        </div>
            <div className="exam-panel">
          <div className="exam-panel-title">{tr(t, 'analytics.executive.recommendations', 'AI Recommendations')}</div>
          <div className="mt-4 grid gap-3">
            {data.predictive.recommendations.map((item, index) => {
              let key = '';
              const cleanItem = String(item || '').trim().toLowerCase();
              if (cleanItem.includes('launch targeted nudges')) {
                key = 'analytics.executive.recommendationsList.nudges';
              } else if (cleanItem.includes('review exam difficulty')) {
                key = 'analytics.executive.recommendationsList.review';
              } else if (cleanItem.includes('promote ai assistant')) {
                key = 'analytics.executive.recommendationsList.promoteAi';
              } else if (cleanItem.includes('maintain current learning')) {
                key = 'analytics.executive.recommendationsList.maintain';
              }
              return (
                <div key={index} className="executive-recommendation">
                  {key ? tr(t, key, item) : item}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExecutiveMini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="executive-mini">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function FilterSelect({ value, onChange, options, placeholder }: { value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; placeholder: string }) {
  return (
    <select className="input w-full" value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
    </select>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="exam-panel">
      <div className="mb-4">
        <div className="exam-panel-title">{title}</div>
        <div className="exam-panel-sub">{subtitle}</div>
      </div>
      {children}
    </div>
  );
}

function Leaderboard({ title, rows }: { title: string; rows: { name: string; metric: string; sub: string }[] }) {
  const { t } = useTranslation();
  return (
    <div className="exam-panel">
      <div className="mb-4 flex items-center gap-2 exam-panel-title">
        <TrendingUp size={18} color="var(--green-400)" />
        {title}
      </div>
      <div className="space-y-3">
        {rows.slice(0, 8).map((row, index) => (
          <div key={`${row.name}-${index}`} className="exam-list-item">
            <div className="exam-list-rank">{index + 1}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold">{row.name}</div>
              <div className="truncate text-xs text-[var(--text-tertiary)]">{row.sub}</div>
            </div>
            <div className="shrink-0 rounded-full bg-[var(--surface-2)] px-3 py-1 text-sm font-black text-[var(--blue-400)]">{row.metric}</div>
          </div>
        ))}
        {rows.length === 0 && <div className="py-6 text-sm text-[var(--text-tertiary)]">{tr(t, 'common.noData', "Ma'lumot yo'q")}</div>}
      </div>
    </div>
  );
}

function QuestionAnalytics({ rows }: { rows: AnalyticsData['questionAnalytics'] }) {
  const { t } = useTranslation();
  return (
    <div className="exam-panel">
      <div className="mb-4 exam-panel-title">{tr(t, 'analytics.results.sections.questionAnalytics', 'Savollar tahlili')}</div>
      <div className="space-y-3">
        {rows.slice(0, 6).map((row) => (
          <div key={row.questionId} className="rounded-xl border border-[var(--border-1)] bg-[var(--surface-1)] p-3">
            <div className="line-clamp-2 text-sm font-bold">{row.question}</div>
            <div className="mt-1 text-xs text-[var(--text-tertiary)]">{tr(t, 'analytics.results.metrics.questionAttempts', '{{exam}} / {{attempts}} urinish', { exam: row.examName, attempts: row.attempts })}</div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <Metric label={tr(t, 'analytics.results.question.success', 'Muvaffaqiyat')} value={`${row.successPercentage}%`} className="text-green-400" />
              <Metric label={tr(t, 'analytics.results.question.failed', 'Xato')} value={`${row.failurePercentage}%`} className="text-red-400" />
              <Metric label={tr(t, 'analytics.results.question.skipped', "O'tkazib yuborilgan")} value={`${row.skippedPercentage}%`} className="text-amber-400" />
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="py-6 text-sm text-[var(--text-tertiary)]">{tr(t, 'analytics.results.question.empty', "Savol analitikasi hali yo'q.")}</div>}
      </div>
    </div>
  );
}

function Metric({ label, value, className }: { label: string; value: string; className: string }) {
  return (
    <div className="exam-soft-card p-2">
      <div className="text-[10px] uppercase text-[var(--text-tertiary)]">{label}</div>
      <div className={`font-black ${className}`}>{value}</div>
    </div>
  );
}

function AttemptDetails({ loading, details, onClose }: { loading: boolean; details: any; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="exam-detail-backdrop">
      <div className="exam-detail-modal">
        <div className="exam-detail-hero">
          <div className="exam-detail-title-row">
            <div className="exam-detail-avatar">
              <User size={22} />
            </div>
            <div className="min-w-0">
              <div className="text-xl font-black text-[var(--text-primary)]">{tr(t, 'analytics.results.details.title', 'Urinish tafsilotlari')}</div>
              <div className="truncate text-sm text-[var(--text-tertiary)]">{details?.employee?.fullName || tr(t, 'common.loading', 'Yuklanmoqda')} / {details?.exam?.title || ''}</div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[calc(90vh-92px)] overflow-y-auto pb-5">
          {loading || !details ? (
            <div className="grid gap-3 p-5">
              <div className="skeleton h-24" />
              <div className="skeleton h-64" />
            </div>
          ) : (
            <>
              <div className="exam-detail-summary">
                <MetricCard label={tr(t, 'analytics.results.table.score', 'Ball')} value={`${details.attempt.score}%`} />
                <MetricCard label={tr(t, 'exams.correct', "To'g'ri")} value={details.attempt.correctAnswers} />
                <MetricCard label={tr(t, 'exams.wrong', "Noto'g'ri")} value={details.attempt.wrongAnswers} />
                <MetricCard label={tr(t, 'exams.skipped', "O'tkazib yuborilgan")} value={details.attempt.skippedAnswers} />
                <MetricCard label={tr(t, 'analytics.results.table.duration', 'Davomiylik')} value={details.attempt.duration} />
                <MetricCard label={tr(t, 'analytics.results.table.status', 'Holat')} value={details.attempt.passed ? tr(t, 'analytics.results.status.passed', "O'tdi") : tr(t, 'analytics.results.status.failed', 'Yiqildi')} />
              </div>
              <div className="mt-5 space-y-3 px-5">
                {details.questions.map((question: any, index: number) => (
                  <div key={question.questionId} className="exam-detail-question">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="badge badge-blue">#{index + 1}</span>
                      <span className={`badge ${question.correct ? 'badge-green' : question.skipped ? 'badge-amber' : 'badge-red'}`}>
                        {question.correct ? tr(t, 'exams.correct', "To'g'ri") : question.skipped ? tr(t, 'exams.skipped', "O'tkazib yuborilgan") : tr(t, 'exams.wrong', "Noto'g'ri")}
                      </span>
                    </div>
                    <div className="font-bold">{question.question}</div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <AnswerBlock title={tr(t, 'analytics.results.details.selectedAnswer', 'Tanlangan javob')} value={question.selectedAnswer?.join(', ') || '-'} />
                      <AnswerBlock title={tr(t, 'analytics.results.details.correctAnswer', "To'g'ri javob")} value={question.correctAnswer?.join(', ') || '-'} />
                    </div>
                    {question.explanation && <div className="mt-3 rounded-lg bg-[var(--surface-2)] p-3 text-sm text-[var(--text-secondary)]">{question.explanation}</div>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="exam-soft-card p-4">
      <div className="text-xs font-bold uppercase text-[var(--text-tertiary)]">{label}</div>
      <div className="mt-2 text-2xl font-black">{value}</div>
    </div>
  );
}

function AnswerBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="exam-soft-card p-3">
      <div className="mb-1 text-xs font-bold uppercase text-[var(--text-tertiary)]">{title}</div>
      <div className="text-sm text-[var(--text-primary)]">{value}</div>
    </div>
  );
}
