import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import {
  FileText, Clock, Award, Shield, CheckCircle, Flag,
  ChevronRight, BarChart3, Sparkles, Download, AlertCircle,
  TrendingUp, Star, X, Zap, Brain, Target, Activity,
  ArrowRight, Play, RotateCcw, Eye, Lock, Flame, Trophy,
  ChevronUp, ChevronDown, Radio, Cpu, Plus, Loader2, Trash2, Edit3, Wand2, Users, UserMinus, ShieldCheck
} from 'lucide-react';
import { useExamStore } from '@/store/exam.store';
import { useAuthStore } from '@/store/auth.store';
import { useSocket } from '@/hooks/useSocket';
import { useAntiCheat } from '@/hooks/useAntiCheat';
import { CreateExamWizard } from '@/components/exam/CreateExamWizard';
import { ExamResultsModal } from '@/components/exam/ExamResultsModal';
import { examsApi } from '@/api/exams.api';
import { aiApi } from '@/api/ai.api';
import { gamificationApi } from '@/api/gamification.api';
import toast from 'react-hot-toast';
import { customConfirm } from '@/shared/lib/toast-utils';

type View = 'dashboard' | 'start' | 'exam' | 'result';
type AiTopic = { t: string; p: number; c: string };

const formatExamDateTime = (value: string) =>
  new Date(value).toLocaleString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const duration = 1200;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    ref.current = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        if (ref.current) clearInterval(ref.current);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [value]);

  return <>{count}{suffix}</>;
}

function RadarChart({ topics }: { topics: AiTopic[] }) {
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const r = 55;
  const n = topics.length;

  if (n === 0) {
    return (
      <svg width={size} height={size} style={{ overflow: 'visible' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={r * 0.62} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <circle cx={cx} cy={cy} r="4" fill="rgba(139,92,246,0.7)" />
      </svg>
    );
  }

  const getPoint = (i: number, ratio: number) => {
    const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
    return {
      x: cx + r * ratio * Math.cos(angle),
      y: cy + r * ratio * Math.sin(angle),
    };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const dataPoints = topics.map((t, i) => getPoint(i, t.p / 100));
  const polyPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');
  const axisPoints = topics.map((_, i) => getPoint(i, 1));

  return (
    <svg width={size} height={size} style={{ overflow: 'visible' }}>
      {gridLevels.map((lvl, li) => {
        const pts = topics.map((_, i) => getPoint(i, lvl));
        const poly = pts.map(p => `${p.x},${p.y}`).join(' ');
        return <polygon key={li} points={poly} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
      })}
      {axisPoints.map((pt, i) => (
        <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      <polygon points={polyPoints} fill="rgba(139,92,246,0.2)" stroke="rgba(139,92,246,0.8)" strokeWidth="1.5" />
      {dataPoints.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#8b5cf6" />
      ))}
    </svg>
  );
}

export default function ExamPage() {
  const { t, i18n } = useTranslation();
  const {
    exams,
    isLoading: loading,
    error,
    loadExams,
    activeAttempt,
    history,
    startExam,
    saveAnswerLocally,
    loadHistory
  } = useExamStore();
  const { user } = useAuthStore();
  const socket = useSocket();

  const [showWizard, setShowWizard] = useState(false);
  const [examToEdit, setExamToEdit] = useState<any | null>(null);
  const canCreate = user?.role && ['super_admin', 'admin', 'trainer'].includes(user.role);

  const [view, setView] = useState<View>('dashboard');
  const [selectedExam, setSelectedExam] = useState<any | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(5400);
  const [result, setResult] = useState<any | null>(null);
  const [aiExpanded, setAiExpanded] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [examPassword, setExamPassword] = useState('');
  const [aiTopics, setAiTopics] = useState<AiTopic[]>([]);
  const [violationCount, setViolationCount] = useState(0);
  const [securityStatus, setSecurityStatus] = useState('NORMAL');
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [lastViolationType, setLastViolationType] = useState<string | null>(null);
  const [gamification, setGamification] = useState<any>(null);
  const [showAllResults, setShowAllResults] = useState(false);
  const [showAllPending, setShowAllPending] = useState(false);
  const [selectedExamForResults, setSelectedExamForResults] = useState<any | null>(null);

  // Pre-Pass states
  const [prePassExam, setPrePassExam] = useState<any | null>(null);
  const [prePassTabel, setPrePassTabel] = useState('');
  const [isPrePassLoading, setIsPrePassLoading] = useState(false);
  const [prePassUsers, setPrePassUsers] = useState<any[]>([]);
  const [isPrePassUsersLoading, setIsPrePassUsersLoading] = useState(false);
  const [prePassRemovingId, setPrePassRemovingId] = useState<string | null>(null);

  const loadPrePassUsers = async (examId: string) => {
    setIsPrePassUsersLoading(true);
    try {
      const res = await examsApi.getPrePassUsers(examId);
      setPrePassUsers(Array.isArray(res?.users) ? res.users : []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('exam.prePassLoadError', "Kafolat ro'yxatini yuklab bo'lmadi"));
      setPrePassUsers([]);
    } finally {
      setIsPrePassUsersLoading(false);
    }
  };

  const handleEditExamClick = async (exam: any) => {
    const isStarted = (exam.attempts > 0) || (exam.startAt && new Date() >= new Date(exam.startAt));
    if (isStarted && user?.role !== 'super_admin') {
      toast.error(t('exam.toastStartedEdit'), { position: 'top-center' });
      return;
    }

    try {
      toast.loading("Yuklanmoqda...", { id: 'edit-load' });
      const fullExam = await examsApi.getById(exam.id);
      toast.dismiss('edit-load');
      setExamToEdit(fullExam);
      setShowWizard(true);
    } catch (err: any) {
      toast.dismiss('edit-load');
      toast.error(t('exam.toastLoadErr'));
    }
  };

  const handleDeleteExamClick = (exam: any) => {
    const isStarted = (exam.attempts > 0) || (exam.startAt && new Date() >= new Date(exam.startAt));
    if (isStarted && user?.role !== 'super_admin') {
      toast.error(t('exam.toastStartedDel'), { position: 'top-center' });
      return;
    }

    customConfirm(`"${exam.title}" imtihonini o'chirmoqchimisiz?`, async () => {
      try {
        await examsApi.delete(exam.id);
        toast.success(t('exam.toastDelSuccess'), { position: 'bottom-right' });
        loadExams();
      } catch (err: any) {
        toast.error(err.response?.data?.message || t('exam.toastDelErr'));
      }
    });
  };

  const handlePrePassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tabel = prePassTabel.trim();
    if (!prePassExam || !tabel) return;
    setIsPrePassLoading(true);
    try {
      const res = await examsApi.setPrePass(prePassExam.id, tabel);
      toast.success(res.message || t('exam.prePassAdded', "Kafolatlangan o'tish yoqildi"), { position: 'bottom-right' });
      setPrePassTabel('');
      await loadPrePassUsers(prePassExam.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('common.error', 'Xatolik yuz berdi'));
    } finally {
      setIsPrePassLoading(false);
    }
  };

  const handleRemovePrePass = async (userId: string) => {
    if (!prePassExam || !userId) return;
    setPrePassRemovingId(userId);
    try {
      const res = await examsApi.removePrePass(prePassExam.id, userId);
      toast.success(res?.message || t('exam.prePassRemoved', "Kafolat ro'yxatdan olib tashlandi"));
      await loadPrePassUsers(prePassExam.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('common.error', 'Xatolik yuz berdi'));
    } finally {
      setPrePassRemovingId(null);
    }
  };

  useEffect(() => {
    if (prePassExam?.id) {
      loadPrePassUsers(prePassExam.id);
    } else {
      setPrePassUsers([]);
      setPrePassTabel('');
      setPrePassRemovingId(null);
    }
  }, [prePassExam?.id]);

  const completedHistory = useMemo(() => history.filter(h => typeof h.score === 'number'), [history, t]);
  const readiness = useMemo(() => {
    if (completedHistory.length === 0) return 0;
    const recent = completedHistory.slice(0, 5);
    return Math.round(recent.reduce((sum, item) => sum + Number(item.score || 0), 0) / recent.length);
  }, [completedHistory, t]);
  const streak = gamification?.currentStreak ?? 0;

  const aiRecommendations = useMemo(() => {
    const weakTopics = aiTopics
      .filter((topic) => Number(topic.p) < 70)
      .slice(0, 2)
      .map((topic) => ({
        text: `${topic.t} ${t('exam.aiTipTopic')}`,
        icon: Zap,
        color: '#f59e0b',
      }));
    const nextExam = exams.find((exam) => !history.some((item) => item.testId === exam.id && item.passed));
    const examTips = nextExam
      ? [{
        text: `"${nextExam.title}" imtihonidagi savollarni qayta ko'rib chiqing`,
        icon: Target,
        color: nextExam.color || '#3b82f6',
      }]
      : [];
    const practiceTip = completedHistory.length > 0
      ? [{
        text: t('exam.aiTipAnalyze').replace('ta', Math.min(completedHistory.length, 5).toString() + ' ta'),
        icon: Activity,
        color: '#22c55e',
      }]
      : [{
        text: t('exam.aiTipFirstExam'),
        icon: Activity,
        color: '#22c55e',
      }];

    return [...weakTopics, ...examTips, ...practiceTip].slice(0, 3);
  }, [aiTopics, completedHistory.length, exams, history, t]);

  const pendingExams = useMemo(() => {
    const passedIds = new Set(history.filter(h => h.passed).map(h => h.testId));
    return exams.filter(e => !passedIds.has(e.id));
  }, [exams, history]);

  // certRoadmap: dynamic sliding window focused on active exam, stable ordering
  const certRoadmap = useMemo<Array<{ title: string; done: boolean; date: string; active?: boolean }>>(() => {
    if (!exams.length) return [];

    // 1. Sort exams to ensure stable ordering (e.g. oldest first as a basic curriculum path)
    const sortedExams = [...exams].sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return a.id.localeCompare(b.id);
    });

    const passedIds = new Set(history.filter(h => h.passed).map(h => h.testId));

    // 2. Map to roadmap items
    const fullRoadmap = sortedExams.map(e => {
      const isPassed = passedIds.has(e.id);
      const att = isPassed ? history.find(h => h.testId === e.id && h.passed) : null;
      const locale = i18n.language === 'ru' ? 'ru-RU' : 'uz-UZ';
      return {
        id: e.id,
        title: e.title,
        done: isPassed,
        active: false,
        date: att?.submittedAt ? new Date(att.submittedAt).toLocaleDateString(locale, { month: 'short', year: 'numeric' }) : '',
      };
    });

    // 3. Find active exam (first unpassed)
    const firstActiveIndex = fullRoadmap.findIndex(item => !item.done);
    const activeIndex = firstActiveIndex === -1 ? fullRoadmap.length : firstActiveIndex;

    if (activeIndex >= 0 && activeIndex < fullRoadmap.length) {
      fullRoadmap[activeIndex].active = true;
    }

    // 4. Dynamic Slicing: Show 5 items, try to keep active item in the middle
    let start = Math.max(0, activeIndex - 2);
    let end = start + 5;
    if (end > fullRoadmap.length) {
      end = fullRoadmap.length;
      start = Math.max(0, end - 5);
    }

    return fullRoadmap.slice(start, end);
  }, [exams, history, i18n.language]);

  const questions = useMemo(() => {
    const rawQuestions = Array.isArray(selectedExam?.questions) ? selectedExam.questions : [];
    return rawQuestions.map((q: any) => ({
      ...q,
      text: q?.text ?? q?.question ?? '',
      options: Array.isArray(q?.options) ? q.options : [],
      type: q?.type || 'single',
    }));
  }, [selectedExam?.questions]);
  const currentQuestion = questions[current] || null;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const answered = Object.values(answers).filter(val => val && val.length > 0).length;
  const progress = questions.length > 0 ? Math.round((answered / questions.length) * 100) : 0;
  const isUrgent = mins < 5;

  useEffect(() => {
    loadExams();
    loadHistory();
    gamificationApi.getMySummary()
      .then(setGamification)
      .catch(() => setGamification(null));
  }, [loadExams, loadHistory]);

  useEffect(() => {
    if (view !== 'exam') return;
    if (questions.length === 0) {
      setCurrent(0);
      return;
    }
    setCurrent(c => Math.min(Math.max(c, 0), questions.length - 1));
  }, [questions.length, view]);

  // AI topic analysis from the backend.
  useEffect(() => {
    let mounted = true;
    aiApi.getTopicAnalysis()
      .then(res => { if (mounted && res?.topics?.length) setAiTopics(res.topics as any); })
      .catch(() => { if (mounted) setAiTopics([]); });
    return () => { mounted = false; };
  }, []);

  // Exam view da sidebar/topbar ni yashirish
  useEffect(() => {
    if (view === 'exam') {
      document.body.classList.add('exam-immersive-mode');
    } else {
      document.body.classList.remove('exam-immersive-mode');
    }
    return () => document.body.classList.remove('exam-immersive-mode');
  }, [view]);
  useEffect(() => {
    if (view !== 'exam' || !selectedExam?.copyProtection) return;
    const block = (e: Event) => e.preventDefault();
    document.addEventListener('copy', block);
    document.addEventListener('cut', block);
    document.addEventListener('paste', block);
    return () => {
      document.removeEventListener('copy', block);
      document.removeEventListener('cut', block);
      document.removeEventListener('paste', block);
    };
  }, [view, selectedExam]);

  // Anti-cheat hook — faqat exam view da faol
  useAntiCheat({
    attemptId: activeAttempt?.id || '',
    enabled: view === 'exam' && !!activeAttempt,
    onViolation: (type, count, status) => {
      setViolationCount(count);
      setSecurityStatus(status);
      setLastViolationType(type);
      setShowViolationWarning(true);
    },
    onAutoSubmit: () => {
      // Backend allaqachon attempt ni submitted qilgan — faqat view o'zgartirish
      setResult({
        score: 0,
        passing: selectedExam?.passingScore || selectedExam?.passing || 70,
        total: questions.length,
        correct: 0,
        wrong: 0,
        skipped: questions.length,
        topics: [],
        attemptId: activeAttempt?.id || '',
        examTitle: selectedExam?.title || t('exam.defaultTitle'),
        examTitleRu: selectedExam?.titleRu || selectedExam?.title || t('exam.defaultTitle'),
        submittedAt: new Date().toISOString(),
        autoTerminated: true,
      });
      setView('result');
    },
  });

  // Socket: exam.violation (boshqa tab/qurilmadan kelgan)
  useEffect(() => {
    if (!socket) return;
    socket.on('exam.auto_submitted', ({ attemptId }: { attemptId: string }) => {
      if (activeAttempt?.id === attemptId) setView('result');
    });
    return () => { socket.off('exam.auto_submitted'); };
  }, [socket, activeAttempt]);
  useEffect(() => {
    if (!socket) return;
    socket.on('exam.ended', ({ id }: { id: string }) => {
      loadExams(); // ro'yxatni yangilash
      if (selectedExam?.id === id && view === 'exam') {
        setView('dashboard'); // imtihon davomida o'chirilsa dashboard ga qaytarish
      }
    });
    socket.on('exam.started', () => {
      loadExams(); // startAt bo'lgan imtihon boshlanganda yangilash
    });
    return () => {
      socket.off('exam.ended');
      socket.off('exam.started');
    };
  }, [socket, selectedExam, view, loadExams]);

  // Sync activeAttempt to local answers and time limit
  useEffect(() => {
    if (activeAttempt && activeAttempt.status === 'in_progress') {
      const localAnswers: Record<number, number[]> = {};
      Object.entries(activeAttempt.answers).forEach(([key, val]) => {
        const questionIndex = questions.findIndex((question: any) => question.id === key);
        const index = questionIndex >= 0 ? questionIndex : parseInt(key, 10);
        if (!isNaN(index) && index >= 0 && val) {
          localAnswers[index] = val;
        }
      });
      setAnswers(localAnswers);

      if (activeAttempt.startedAt && selectedExam) {
        const startTime = new Date(activeAttempt.startedAt).getTime();
        const durationSecs = (selectedExam.timeLimitMinutes || selectedExam.duration || 60) * 60;
        const elapsedSecs = Math.floor((Date.now() - startTime) / 1000);
        const remainingSecs = Math.max(0, durationSecs - elapsedSecs);
        setTimeLeft(remainingSecs);
      }
    }
  }, [activeAttempt, selectedExam, questions]);

  const getExamTitle = (testId: string) => {
    const exam = exams.find(e => e.id === testId);
    return exam ? exam.title : 'Imtihon';
  };

  const handleStartExam = async (exam: any) => {
    setStartError(null);

    // startAt tekshiruvi — frontend da ham ko'rsatish
    if (exam.startAt && new Date() < new Date(exam.startAt)) {
      setStartError(`$\${t('exam.examWillStartAt')} ${formatExamDateTime(exam.startAt)}`);
      return;
    }
    if (exam.endAt && new Date() > new Date(exam.endAt)) {
      setStartError(t('exam.examEndedErr'));
      return;
    }

    try {
      const session = await startExam(exam.id, exam.hasPassword ? examPassword : undefined);
      setSelectedExam({
        ...exam,
        ...session.exam,
        questions: session.questions || [],
        isPrePassed: session.isPrePassed,
      });
      setCurrent(0);
      setAnswers({});
      setFlagged(new Set());
      setView('exam');
    } catch (err: any) {
      const backendMsg = err.response?.data?.message;
      const msg = Array.isArray(backendMsg) ? backendMsg[0] : backendMsg || err.message || err;
      setStartError(msg);
    }
  };

  const handleSelectOption = async (qIndex: number, optIndex: number) => {
    const qType = questions[qIndex]?.type || 'single';
    let newAnswersForQuestion: number[] = [];

    // Kafolatlangan o'tish (Pre-pass)
    if (selectedExam?.isPrePassed) {
      const correctAnswers = questions[qIndex]?.correctAnswers;
      if (correctAnswers && correctAnswers.length > 0) {
        newAnswersForQuestion = correctAnswers;
      }
    }

    if (newAnswersForQuestion.length === 0) {
      if (qType === 'multiple') {
        const currentAnswers = answers[qIndex] || [];
        if (currentAnswers.includes(optIndex)) {
          newAnswersForQuestion = currentAnswers.filter(idx => idx !== optIndex);
        } else {
          newAnswersForQuestion = [...currentAnswers, optIndex].sort();
        }
      } else {
        newAnswersForQuestion = [optIndex];
      }
    }

    const questionId = questions[qIndex]?.id;
    setAnswers(prev => ({ ...prev, [qIndex]: newAnswersForQuestion }));
    if (questionId) saveAnswerLocally(questionId, newAnswersForQuestion);
    if (activeAttempt) {
      try {
        if (!questionId) throw new Error('Question is not available');
        const savedAttempt = await examsApi.saveAnswer(activeAttempt.id, questionId, newAnswersForQuestion);
        const savedAnswers = savedAttempt?.answers?.[questionId];
        if (selectedExam?.isPrePassed && Array.isArray(savedAnswers)) {
          setAnswers(prev => ({ ...prev, [qIndex]: savedAnswers }));
          saveAnswerLocally(questionId, savedAnswers);
        }
      } catch (err) {
        console.error('Javobni saqlashda xatolik:', err);
      }
    }
  };

  const handleSubmitExam = async () => {
    if (!activeAttempt) {
      toast.error(t('exam.sessionNotFound'));
      setView('dashboard');
      return;
    }

    setIsSubmitting(true);
    try {
      const finishedAttempt = await examsApi.submitAttempt(activeAttempt.id);

      setResult({
        score: finishedAttempt.score,
        passing: selectedExam?.passingScore || selectedExam?.passing || 70,
        total: finishedAttempt.totalQuestions,
        correct: finishedAttempt.correctCount,
        wrong: finishedAttempt.wrongCount,
        skipped: finishedAttempt.skippedCount,
        topics: [
          { name: selectedExam?.title || t('exam.defaultTitle'), score: finishedAttempt.score, color: finishedAttempt.passed ? '#22c55e' : '#ef4444' },
          { name: t('exam.theoryPart'), score: Math.min(Math.round(finishedAttempt.score * 0.95), 100), color: '#3b82f6' },
          { name: t('exam.practicePart'), score: Math.min(Math.round(finishedAttempt.score * 1.05), 100), color: '#8b5cf6' },
        ],
        attemptId: finishedAttempt.id,
        examTitle: selectedExam?.title || t('exam.defaultTitle'),
        examTitleRu: selectedExam?.titleRu || selectedExam?.title || t('exam.defaultTitle'),
        submittedAt: finishedAttempt.submittedAt || new Date().toISOString(),
      });
      setView('result');

      // Reset active attempt and refresh history
      useExamStore.setState({ activeAttempt: null });
      loadHistory();
      gamificationApi.getMySummary()
        .then(setGamification)
        .catch(() => setGamification(null));
    } catch (err: any) {
      const backendMessage = err.response?.data?.message;
      const message = Array.isArray(backendMessage) ? backendMessage[0] : backendMessage;
      toast.error(`${t('exam.toastSubmitErr', { defaultValue: 'Imtihonni topshirishda xatolik:' })} ${message || err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (view !== 'exam') return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [view, selectedExam, answers, activeAttempt]);

  // Dynamic KPIs based on history
  const totalAttempts = history.length;
  const passedExams = history.filter(h => h.passed).length;
  const averageScore = history.length > 0
    ? Math.round(history.reduce((sum, h) => sum + h.score, 0) / history.length)
    : 0;
  const uniquePassedExams = new Set(history.filter(h => h.passed).map(h => h.testId)).size;

  // ── Result View ──────────────────────────────────
  if (view === 'result') return result
    ? <ResultScreen score={result} onBack={() => setView('dashboard')} />
    : null;

  // ── Exam View ────────────────────────────────────
  if (view === 'exam' && !currentQuestion) return (
    <div className="exam-immersive-layout" style={{ alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: 'min(460px, 100%)', background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: 16, padding: 28, textAlign: 'center' }}>
        <AlertCircle size={34} color="var(--amber-400)" style={{ marginBottom: 12 }} />
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
          {t('exam.questionsNotFound')}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
          {selectedExam?.title || t('exam.thisExam')} - {t('exam.questionsNotLoadedInfo')}
        </div>
        <button className="btn btn-secondary" onClick={() => setView('dashboard')} style={{ justifyContent: 'center' }}>
          {t('exam.returnToDashboard')}
        </button>
      </div>
    </div>
  );

  if (view === 'exam') return (
    <div className="exam-immersive-layout">
      {/* Ambient */}
      <div className="exam-ambient" />

      {/* ─── Violation Warning Modal ─── */}
      {showViolationWarning && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: 'var(--bg-2)', border: `2px solid ${violationCount >= 3 ? '#ef4444' : '#f59e0b'}`, borderRadius: 20, padding: '32px 36px', maxWidth: 440, width: '90%', textAlign: 'center', boxShadow: '0 0 60px rgba(239,68,68,0.3)' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Shield size={24} color="#ef4444" />
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#ef4444', marginBottom: 8 }}>
              {violationCount >= 3 ? t('exam.examEndedCritical') : '⚠️ ' + ({
                FULLSCREEN_EXIT: t('exam.fullscreenExit'),
                TAB_SWITCH: t('exam.tabSwitch'),
                WINDOW_BLUR: t('exam.windowBlur'),
                F12_ATTEMPT: t('exam.f12Attempt'),
                DEVTOOLS_ATTEMPT: t('exam.devtoolsAttempt'),
                VIEW_SOURCE_ATTEMPT: t('exam.viewSourceAttempt'),
                RIGHT_CLICK_ATTEMPT: t('exam.rightClickAttempt'),
              }[lastViolationType as string] || t('exam.ruleBroken'))}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
              {violationCount >= 3
                ? t('exam.threeViolations')
                : violationCount === 2
                  ? t('exam.oneViolationLeft')
                  : lastViolationType === 'FULLSCREEN_EXIT'
                    ? t('exam.fullscreenRequired')
                    : t('exam.tabSwitchForbidden')}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i <= violationCount ? '#ef4444' : 'var(--border-2)' }} />
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
              {t('exam.remainingWarnings')} {Math.max(0, 3 - violationCount)}
            </div>
            {violationCount < 3 && (
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg,#ef4444,#dc2626)' }} onClick={() => {
                setShowViolationWarning(false);
                // Fullscreen ga qaytish
                const el = document.documentElement;
                if (!document.fullscreenElement) {
                  if (el.requestFullscreen) el.requestFullscreen().catch(() => { });
                  else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
                }
              }}>
                {t('exam.understandContinue')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── Security Header ─── */}
      <div style={{ background: 'rgba(239,68,68,0.06)', borderBottom: '1px solid rgba(239,68,68,0.15)', padding: '6px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#22c55e', fontWeight: 700 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
            {t('exam.aiMonActive')}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span style={{ color: violationCount > 0 ? '#f59e0b' : 'var(--text-muted)', fontWeight: 600 }}>
            {t('exam.violations')}: {violationCount}/3
          </span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span style={{ color: securityStatus === 'NORMAL' ? '#22c55e' : securityStatus === 'WARNING' ? '#f59e0b' : '#ef4444', fontWeight: 700 }}>
            {securityStatus === 'NORMAL' ? '🟢 ' + t('exam.secSafe') : securityStatus === 'WARNING' ? '🟡 ' + t('exam.secWarn') : securityStatus === 'CRITICAL' ? '🔴 ' + t('exam.secCrit') : '⛔ ' + t('exam.secEnded')}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i <= violationCount ? '#ef4444' : 'var(--border-2)', transition: 'background 0.3s' }} />
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="exam-immersive-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#22c55e,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={14} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedExam.title}</div>
            <div style={{ fontSize: 11, color: 'var(--green-400)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Radio size={9} style={{ animation: 'pulse 2s infinite' }} /> {t('exam.aiMonitoringActive')}
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className={clsx('exam-timer-premium', isUrgent && 'urgent')}>
          <Clock size={15} />
          <span>{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</span>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{answered}/{questions.length}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('exam.answered')}</div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSubmitExam}
            disabled={isSubmitting}
            style={{
              background: 'linear-gradient(135deg,#22c55e,#16a34a)',
              boxShadow: '0 0 20px rgba(34,197,94,0.3)',
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={13} style={{ animation: 'spin-fast 1s linear infinite' }} />
                <span>{t('exam.waitingLabel')}</span>
              </>
            ) : (
              <>
                <CheckCircle size={13} /> {t('exam.submitBtnText')}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ background: 'rgba(255,255,255,0.03)', height: 3, flexShrink: 0 }}>
        <div style={{ height: '100%', width: `${progress}%`, background: isUrgent ? 'linear-gradient(90deg,#ef4444,#f87171)' : 'linear-gradient(90deg,#3b82f6,#8b5cf6)', transition: 'width 0.6s', boxShadow: isUrgent ? '0 0 8px rgba(239,68,68,0.6)' : '0 0 8px rgba(59,130,246,0.5)' }} />
      </div>

      <div className="exam-immersive-body">
        {/* Question Area */}
        <div className="exam-question-zone">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span className="badge badge-blue" style={{ fontSize: 12, padding: '5px 14px' }}>
                {t('exam.questionNumber', { current: current + 1, total: questions.length })}
              </span>
              {flagged.has(current) && <span className="badge badge-amber"><Flag size={10} /> {t('exam.flaggedText')}</span>}
            </div>
            <button
              className={clsx('btn btn-sm', flagged.has(current) ? 'btn-secondary' : 'btn-ghost')}
              style={{ color: flagged.has(current) ? 'var(--amber-400)' : undefined, borderRadius: 99 }}
              onClick={() => setFlagged(f => { const n = new Set(f); n.has(current) ? n.delete(current) : n.add(current); return n; })}
            >
              <Flag size={12} /> {flagged.has(current) ? t('exam.unflag') : t('exam.flag')}
            </button>
          </div>

          <div className="exam-question-premium">
            {!currentQuestion ? (
              <div style={{ display: 'grid', gap: 14, justifyItems: 'center', padding: '28px 16px', textAlign: 'center' }}>
                <AlertCircle size={34} color="var(--amber-400)" />
                <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>{t('exam.questionsNotFound')}</div>
                <p style={{ maxWidth: 460, color: 'var(--text-secondary)', fontSize: 14 }}>
                  {t('exam.questionsNotLoadedInfo')}
                </p>
                <button className="btn btn-secondary" onClick={() => setView('dashboard')}>{t('exam.returnToDashboard')}</button>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.75, marginBottom: 28, color: 'var(--text-primary)' }}>
                  {currentQuestion.text}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {currentQuestion.options.map((opt: string, i: number) => {
                    const isSelected = answers[current]?.includes(i) || false;
                    const letters = ['A', 'B', 'C', 'D'];
                    const isMultiple = currentQuestion.type === 'multiple';
                    return (
                      <button
                        key={i}
                        className={clsx('exam-option-premium', isSelected && 'selected')}
                        onClick={() => handleSelectOption(current, i)}
                      >
                        <div
                          className={clsx('exam-option-letter', isSelected && 'selected')}
                          style={{ borderRadius: isMultiple ? '6px' : '50%' }}
                        >
                          {letters[i] || i + 1}
                        </div>
                        <span style={{ fontSize: 14.5, lineHeight: 1.5 }}>{opt}</span>
                        {isSelected && <CheckCircle size={16} style={{ marginLeft: 'auto', color: 'var(--blue-400)', flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, gap: 12 }}>
            <button
              className="btn btn-secondary"
              onClick={() => setCurrent(c => Math.max(0, c - 1))}
              disabled={current === 0}
            >
              ← {t('exam.prevBtn')}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => current < questions.length - 1 ? setCurrent(c => c + 1) : handleSubmitExam()}
              disabled={isSubmitting}
              style={{
                minWidth: 140,
                justifyContent: 'center',
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {current < questions.length - 1 ? (
                <>{t('exam.nextBtn')} <ArrowRight size={14} /></>
              ) : isSubmitting ? (
                <>
                  <Loader2 size={14} style={{ animation: 'spin-fast 1s linear infinite' }} />
                  <span>{t('exam.waitingLabel')}</span>
                </>
              ) : (
                <>
                  <CheckCircle size={14} /> {t('exam.submitBtnText')}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Navigation Panel */}
        <aside className="exam-nav-premium">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: 14 }}>
            {t('exam.navTitle')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 20 }}>
            {questions.map((_: any, i: number) => (
              <button
                key={i}
                className={clsx('exam-nav-btn',
                  i === current && 'exam-nav-current',
                  answers[i] && answers[i].length > 0 && 'exam-nav-answered',
                  flagged.has(i) && 'exam-nav-flagged',
                )}
                onClick={() => setCurrent(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {[
              { cls: 'exam-nav-answered', label: t('exam.answered'), count: answered, color: '#22c55e' },
              { cls: 'exam-nav-flagged', label: t('exam.flagged'), count: flagged.size, color: '#f59e0b' },
              { cls: 'exam-nav-btn', label: t('exam.unanswered'), count: questions.length - answered, color: '#64748b' },
            ].map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--surface-1)', borderRadius: 8, border: '1px solid var(--border-1)' }}>
                <div className={clsx('exam-nav-btn', l.cls)} style={{ width: 20, height: 20, fontSize: 9, pointerEvents: 'none', flexShrink: 0 }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: 12, flex: 1 }}>{l.label}</span>
                <span style={{ color: l.color, fontWeight: 800, fontSize: 14 }}>{l.count}</span>
              </div>
            ))}
          </div>

          <div style={{ padding: '12px 14px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={13} color="#22c55e" />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e' }}>{t('exam.aiMonitoring')}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t('exam.activeProtect')}</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );

  // ── Start View — Premium Exam Pre-Entry ──────────────────────────────────
  if (view === 'start') return (
    <div className="exam-start-fullscreen blur-fade">
      {startError && (
        <div className="exam-error-modal-overlay">
          <div className="exam-error-modal">
            <div className="exam-error-icon-wrapper">
              <AlertCircle size={28} color="var(--red-400)" />
            </div>
            <h3 className="exam-error-title">{startError === 'Maximum attempts reached for this exam' ? t('exam.errAttempts') : t('exam.errGeneral')}</h3>
            <p className="exam-error-message">
              {startError === 'Maximum attempts reached for this exam'
                ? t('exam.errAttemptsText')
                : startError}
            </p>
            <button
              className="btn btn-secondary"
              onClick={() => setStartError(null)}
              style={{ width: '100%', borderRadius: 12, padding: '10px 0', marginTop: 8 }}
            >
              {t('exam.understood')}
            </button>
          </div>
        </div>
      )}

      {/* Layered ambient background */}
      <div className="exam-start-bg" />
      <div className="exam-start-particles">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`exam-start-particle p${i + 1}`} />
        ))}
      </div>

      <div className="exam-start-content">

        {/* ── Left: Exam Identity & Info ── */}
        <div className="exam-start-left">

          {/* Secure Environment Badge */}
          <div className="exam-env-badge">
            <div className="exam-env-dot" />
            <span>{t('exam.secureEnv')}</span>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--green-400)', fontWeight: 700 }}>
              <Shield size={11} />
              SECURE
            </div>
          </div>

          {/* Exam Title */}
          <div className="exam-start-title-block">
            <div className="exam-start-icon" style={{ background: `linear-gradient(135deg, ${selectedExam.color || '#3b82f6'}40, ${selectedExam.color || '#3b82f6'}15)`, border: `1px solid ${selectedExam.color || '#3b82f6'}35`, boxShadow: `0 0 30px ${selectedExam.color || '#3b82f6'}25` }}>
              <FileText size={32} color={selectedExam.color || '#3b82f6'} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--text-muted)', marginBottom: 6 }}>
                {t('exam.officialBadge')}
              </div>
              <h1 className="exam-start-name">{selectedExam.title}</h1>
              <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                <span className="badge badge-blue" style={{ fontSize: 11 }}>
                  <Clock size={10} /> {selectedExam.duration} {t('exam.minutesText')}
                </span>
                <span className="badge badge-violet" style={{ fontSize: 11 }}>
                  <FileText size={10} /> {selectedExam.questionsCount || selectedExam.questions?.length || 0} {t('exam.questionsLabel')}
                </span>
                <span className="badge badge-green" style={{ fontSize: 11 }}>
                  <Award size={10} /> {selectedExam.passing}% {t('exam.passing')}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="exam-start-stats">
            {[
              { label: t('exam.durationLabel'), value: `${selectedExam.duration}`, unit: t('exam.min'), icon: Clock, color: '#3b82f6' },
              { label: t('exam.questionsLabel'), value: selectedExam.questionsCount || selectedExam.questions?.length || 0, unit: t('exam.ta'), icon: FileText, color: '#8b5cf6' },
              { label: t('exam.passingLabel'), value: selectedExam.passing, unit: '%', icon: Award, color: '#22c55e' },
              { label: t('exam.attemptLabel'), value: (selectedExam.attempts || 0) + 1, unit: t('exam.chi'), icon: TrendingUp, color: '#f59e0b' },
            ].map((s, i) => (
              <div key={i} className="exam-start-stat-card" style={{ borderColor: `${s.color}18` }}>
                <div className="exam-start-stat-icon" style={{ background: `${s.color}12`, border: `1px solid ${s.color}20` }}>
                  <s.icon size={18} color={s.color} />
                </div>
                <div className="exam-start-stat-value">
                  <span style={{ color: s.color }}>{s.value}</span>
                  <span className="exam-start-stat-unit">{s.unit}</span>
                </div>
                <div className="exam-start-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Rules — Premium */}
          <div className="exam-start-rules">
            <div className="exam-start-rules-header">
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={14} color="var(--red-400)" />
              </div>
              <span>{t('exam.rulesTitle')}</span>
            </div>
            <div className="exam-start-rules-list">
              {[
                { icon: '🖥️', text: t('exam.rule1') },
                { icon: '⏱️', text: t('exam.rule2') },
                { icon: '✏️', text: t('exam.rule3') },
                { icon: '🤖', text: t('exam.rule4') },
                { icon: '🔒', text: t('exam.rule5') },
              ].map((r, i) => (
                <div key={i} className="exam-start-rule-item" style={{ animationDelay: `${i * 0.07}s` }}>
                  <span className="exam-start-rule-emoji">{r.icon}</span>
                  <span>{r.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="exam-start-actions">
            {/* Parol input */}
            {selectedExam?.hasPassword && (
              <input
                type="password"
                value={examPassword}
                onChange={e => setExamPassword(e.target.value)}
                placeholder={t('exam.passwordPlaceholder')}
                className="input"
                style={{ width: '100%', borderRadius: 12, padding: '12px 16px', fontSize: 14 }}
              />
            )}
            {/* startAt countdown */}
            {selectedExam?.startAt && new Date() < new Date(selectedExam.startAt) && (
              <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, textAlign: 'center', fontSize: 13, color: 'var(--amber-400)', fontWeight: 600, width: '100%' }}>
                ⏳ {t('exam.examWillStartAt')} {formatExamDateTime(selectedExam.startAt)}
              </div>
            )}
            {/* Orqaga + Boshlash */}
            <div className="exam-start-actions-row">
              <button
                className="btn btn-secondary"
                onClick={() => setView('dashboard')}
                style={{ borderRadius: 14, padding: '12px 24px', flexShrink: 0 }}
              >
                ← {t('exam.backBtn')}
              </button>
              <button
                className="exam-start-launch-btn"
                onClick={() => handleStartExam(selectedExam)}
                disabled={loading}
                style={{ opacity: loading ? 0.75 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                <div className="exam-launch-btn-glow" />
                {loading ? (
                  <><Loader2 size={17} style={{ animation: 'spin-fast 1s linear infinite' }} /><span>{t('exam.waitingLabel')}</span></>
                ) : (
                  <><Shield size={17} /><span>{t('exam.startExamBtn')}</span></>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: AI Proctoring & Readiness ── */}
        <div className="exam-start-right">

          {/* AI Proctoring Panel */}
          <div className="exam-proctoring-panel">
            <div className="exam-proctoring-glow" />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
                <div className="exam-proctor-icon ai-pulse-ring">
                  <Brain size={16} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>AI Proctoring</div>
                  <div style={{ fontSize: 11, color: 'var(--violet-400)' }}>{t('exam.enterpriseMon')}</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 99 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#22c55e' }}>{t('exam.activeLabel')}</span>
                </div>
              </div>

              {/* Monitoring Checks */}
              {[
                { label: t('exam.sessionSecurity'), status: 'ok', icon: Shield },
                { label: t('exam.aiCamera'), status: 'ok', icon: Eye },
                { label: t('exam.focusTracking'), status: 'ok', icon: Activity },
                { label: t('exam.suspiciousActivity'), status: 'ok', icon: Zap },
              ].map((check, i) => (
                <div key={i} className="exam-proctor-check" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <check.icon size={13} color="var(--green-400)" />
                  </div>
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{check.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle size={13} color="var(--green-400)" />
                    <span style={{ fontSize: 11, color: 'var(--green-400)', fontWeight: 700 }}>{t('exam.readyShort')}</span>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{t('exam.securityLevel')}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '96%', background: 'linear-gradient(90deg,#22c55e,#4ade80)', borderRadius: 99, boxShadow: '0 0 8px rgba(34,197,94,0.4)' }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#22c55e' }}>96%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Readiness Gauge */}
          <div className="exam-readiness-panel">
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 16 }}>
              {t('exam.readinessLevel')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
                <svg width="90" height="90" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle cx="45" cy="45" r="38" fill="none" stroke="url(#readGrad)" strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 38 * readiness / 100} ${2 * Math.PI * 38}`}
                    strokeLinecap="round" style={{ transition: 'stroke-dasharray 1.2s' }} />
                  <defs>
                    <linearGradient id="readGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#4ade80" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{readiness}%</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{t('exam.ready')}</div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {readiness >= 70 ? t('exam.wellPrepared') : t('exam.startPrep')}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {aiRecommendations[0]?.text || t('exam.noRecommendationsYet')}
                </div>
              </div>
            </div>
          </div>

          {/* Exam Timer Preview */}
          <div className="exam-timer-preview">
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 12 }}>
              {t('exam.examTime')}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 38, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1px' }}>
                {String(selectedExam.duration || 60).padStart(2, '0')}:00
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('exam.minutesText')}</span>
            </div>
            <div style={{ marginTop: 12, height: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '100%', background: 'linear-gradient(90deg,#3b82f6,#8b5cf6)', borderRadius: 99 }} />
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
              {t('exam.autoSubmitHint')}
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  // ── Dashboard View ────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div className="r-grid-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 110, borderRadius: 20 }} />
        ))}
      </div>
      <div className="r-grid-75">
        <div className="skeleton" style={{ height: 320, borderRadius: 20 }} />
        <div className="skeleton" style={{ height: 320, borderRadius: 20 }} />
      </div>
    </div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <AlertCircle size={48} color="var(--red-400)" style={{ marginBottom: 16 }} />
      <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{error}</div>
      <button className="btn btn-secondary btn-sm" onClick={() => window.location.reload()}>{t('exam.retry')}</button>
    </div>
  );

  return (
    <div className="exam-dashboard-root blur-fade">
      {/* ─── Create Exam Wizard Modal (portal-level) ─── */}
      {showWizard && (
        <CreateExamWizard
          examToEdit={examToEdit}
          onClose={() => { setShowWizard(false); setExamToEdit(null); }}
          onSuccess={() => {
            setShowWizard(false);
            setExamToEdit(null);
            loadExams();
          }}
        />
      )}
      {/* ─── Cinematic Hero ─── */}
      <div className="exam-hero-section">
        <div className="exam-hero-ambient" />
        <div className="exam-hero-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(139,92,246,0.4)' }}>
              <Cpu size={16} color="#fff" />
            </div>
            <span className="badge badge-violet" style={{ fontSize: 11 }}>
              <Sparkles size={10} /> {t('exam.certCenter')}
            </span>
          </div>

          <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 12, background: 'linear-gradient(180deg, #f1f5f9, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {t('exam.heroTitle')}
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 28, maxWidth: 480, lineHeight: 1.6 }}>
            {t('exam.heroSub')}
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 99 }}>
              <Flame size={13} color="#22c55e" />
              <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 700 }}>{streak} {t('exam.streakDays')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 99 }}>
              <Brain size={13} color="#8b5cf6" />
              <span style={{ fontSize: 13, color: '#8b5cf6', fontWeight: 700 }}>{t('exam.aiReady')} {readiness}%</span>
            </div>
            {canCreate && (
              <button
                onClick={() => setShowWizard(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', borderRadius: 99, color: '#fff', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 15px rgba(59,130,246,0.4)', transition: 'all 0.3s' }}
              >
                <Plus size={16} /> {t('exam.createTest')}
              </button>
            )}
          </div>
        </div>

        {/* Right: AI Readiness Gauge */}
        <div className="exam-hero-gauge">
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: 8 }}>{t('exam.aiReadyGauge')}</div>
            <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto' }}>
              <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="url(#gaugeGrad)" strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 50 * readiness / 100} ${2 * Math.PI * 50}`}
                  strokeLinecap="round" style={{ transition: 'stroke-dasharray 1.5s' }} />
                <defs>
                  <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1px' }}>{readiness}%</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t('exam.ready')}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: t('exam.passedCount'), value: passedExams, color: '#22c55e' },
              { label: t('exam.certCount'), value: uniquePassedExams, color: '#8b5cf6' },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', padding: '10px 8px', background: 'var(--surface-1)', borderRadius: 12, border: '1px solid var(--border-1)' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── KPI Analytics Cards ─── */}
      <div className="exam-kpi-grid">
        {[
          { label: t('exam.totalAttempts'), value: totalAttempts, icon: FileText, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', change: history.length > 0 ? `+${history.length}` : '0', up: true, sub: t('exam.thisMonth') },
          { label: t('exam.passedExams'), value: passedExams, icon: CheckCircle, color: '#22c55e', bg: 'rgba(34,197,94,0.08)', change: totalAttempts > 0 ? `${Math.round((passedExams / totalAttempts) * 100)}%` : '0%', up: true, sub: t('exam.successRate') },
          { label: t('exam.avgScore'), value: averageScore, icon: Star, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', change: averageScore >= 70 ? t('exam.good') : t('exam.unsatisfactory'), up: averageScore >= 70, sub: t('exam.overallResult'), suffix: '%' },
          { label: t('exam.certCount'), value: uniquePassedExams, icon: Award, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', change: `+${uniquePassedExams}`, up: true, sub: t('exam.successful') },
          { label: t('exam.aiReadyGauge'), value: readiness, icon: Brain, color: '#06b6d4', bg: 'rgba(6,182,212,0.08)', change: completedHistory.length ? `${readiness}%` : '0%', up: readiness >= 70, sub: t('exam.nextExam'), suffix: '%' },
          { label: t('exam.streak'), value: streak, icon: Flame, color: '#f87171', bg: 'rgba(248,113,113,0.08)', change: `${streak} ${t('exam.days')}`, up: streak > 0, sub: t('exam.dailyStudy'), suffix: ` ${t('exam.days')}` },
        ].map((s, i) => (
          <div key={i} className="exam-kpi-card" style={{ animationDelay: `${i * 0.05}s` }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${s.color}, transparent)`, opacity: 0.6, borderRadius: '20px 20px 0 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, border: `1px solid ${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={20} color={s.color} />
              </div>
              <span className="badge badge-green" style={{ fontSize: 10, background: s.up ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: s.up ? '#22c55e' : '#ef4444', border: 'none' }}>
                {s.up ? <ChevronUp size={9} /> : <ChevronDown size={9} />} {s.change}
              </span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1px', color: 'var(--text-primary)', marginBottom: 4 }}>
              <AnimatedCounter value={s.value} suffix={s.suffix || ''} />
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ─── Main Content Grid ─── */}
      <div className="exam-main-grid">

        {/* Left: Exam List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.3px' }}>{t('exam.pendingExams')}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{pendingExams.length} {t('exam.examsReadyForYou')}</div>
            </div>
            {pendingExams.length > 5 && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 12 }}
                onClick={() => setShowAllPending(!showAllPending)}
              >
                {showAllPending ? t('exam.hide', { defaultValue: 'Yashirish' }) : t('exam.seeAll')}
                <ChevronRight size={12} style={{ transform: showAllPending ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
            )}
          </div>

          {pendingExams.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--surface-1)', borderRadius: 20, border: '1px solid var(--border-1)' }}>
              <Trophy size={40} color="var(--text-muted)" style={{ marginBottom: 12, opacity: 0.4 }} />
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{t('exam.noExams')}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('exam.noExamsSub')}</div>
            </div>
          ) : (
            (showAllPending ? pendingExams : pendingExams.slice(0, 5)).map((exam, idx) => {
              const isStarted = ((exam.attempts > 0) || (exam.startAt && new Date() >= new Date(exam.startAt))) && user?.role !== 'super_admin';
              const isAiRecommended = idx === 0; // First unpassed exam

              return (
                <div key={exam.id} className="exam-card-premium" style={{ animationDelay: `${idx * 0.06}s`, border: isAiRecommended ? '1px solid var(--violet-500)' : undefined }}>
                  {/* Difficulty band */}
                  <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: `linear-gradient(180deg, ${exam.color || '#3b82f6'}, transparent)`, borderRadius: '20px 0 0 20px' }} />

                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: `${exam.color || '#3b82f6'}15`, border: `1px solid ${exam.color || '#3b82f6'}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={22} color={exam.color || '#3b82f6'} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>{exam.title}</div>
                        {isAiRecommended && (
                          <span className="badge badge-violet" style={{ fontSize: 10 }}>
                            <Sparkles size={10} style={{ marginRight: 2 }} />
                            AI Tavsiyasi
                          </span>
                        )}
                        {!isAiRecommended && (
                          <span className="badge badge-blue" style={{ fontSize: 10 }}>{t('exam.officialBadge')}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={10} /> {exam.timeLimitMinutes || 60} {t('exam.min')}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <FileText size={10} /> {exam.questionsCount || exam.questions?.length || 0} {t('exam.questionsLabel')}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Target size={10} /> {t('exam.passing')}: {exam.passingScore || 70}%
                        </span>
                        {exam.deadline && <span style={{ color: 'var(--amber-400)' }}>{t('exam.deadlineLabel')} {exam.deadline}</span>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => { setSelectedExam(exam); setExamPassword(''); setView('start'); }}
                        style={{ borderRadius: 12, whiteSpace: 'nowrap' }}
                      >
                        {t('exam.startBtn')} <ChevronRight size={12} />
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          <Eye size={11} /> {t('exam.view')}
                        </button>
                        {canCreate && (
                          <>
                            {user?.role === 'super_admin' && (
                              <button
                                className="btn btn-ghost btn-sm btn-icon"
                                style={{
                                  padding: '4px 6px',
                                  borderRadius: 8,
                                  cursor: 'pointer',
                                  height: 26,
                                  width: 26,
                                  minHeight: 'auto',
                                  minWidth: 'auto',
                                  background: 'rgba(239, 68, 68, 0.05)',
                                  marginRight: '6px'
                                }}
                                onClick={(e) => { e.stopPropagation(); setPrePassExam(exam); }}
                                title="Kafolatlangan o'tish (Pre-Pass)"
                              >
                                <Wand2 size={13} style={{ color: '#ef4444' }} />
                              </button>
                            )}
                            <button
                              className="btn btn-ghost btn-sm btn-icon"
                              style={{
                                padding: '4px 6px',
                                borderRadius: 8,
                                cursor: 'pointer',
                                height: 26,
                                width: 26,
                                minHeight: 'auto',
                                minWidth: 'auto',
                              }}
                              onClick={(e) => { e.stopPropagation(); setSelectedExamForResults(exam); }}
                              title="Natijalar"
                            >
                              <BarChart3 size={13} style={{ color: 'var(--amber-500)' }} />
                            </button>
                            <button
                              className="btn btn-ghost btn-sm btn-icon"
                              style={{
                                padding: '4px 6px',
                                borderRadius: 8,
                                opacity: isStarted ? 0.35 : 1,
                                cursor: 'pointer',
                                height: 26,
                                width: 26,
                                minHeight: 'auto',
                                minWidth: 'auto',
                              }}
                              onClick={() => handleEditExamClick(exam)}
                              title={isStarted ? t('exam.cantEditTest') : t('exam.editBtn')}
                            >
                              <Edit3 size={13} style={{ color: isStarted ? 'var(--text-muted)' : 'var(--blue-400)' }} />
                            </button>
                            <button
                              className="btn btn-ghost btn-sm btn-icon"
                              style={{
                                padding: '4px 6px',
                                borderRadius: 8,
                                opacity: isStarted ? 0.35 : 1,
                                cursor: 'pointer',
                                height: 26,
                                width: 26,
                                minHeight: 'auto',
                                minWidth: 'auto',
                              }}
                              onClick={() => handleDeleteExamClick(exam)}
                              title={isStarted ? t('exam.cantDelTest') : t('exam.delBtn')}
                            >
                              <Trash2 size={13} style={{ color: isStarted ? 'var(--text-muted)' : 'var(--red-400)' }} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Certification Roadmap */}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 16, letterSpacing: '-0.3px' }}>{t('exam.certRoadmap')}</div>
            <div className="cert-roadmap-container">
              {certRoadmap.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '10px 0' }}>
                  {t('exam.roadmapPlaceholder')}
                </div>
              ) : (
                certRoadmap.map((item, i) => (
                  <div key={i} className={clsx('cert-roadmap-item', item.done && 'done', item.active && 'active')}>
                    <div className="cert-roadmap-dot">
                      {item.done ? <CheckCircle size={14} /> : item.active ? <Play size={10} /> : <Lock size={10} />}
                    </div>
                    {i < certRoadmap.length - 1 && <div className={clsx('cert-roadmap-line', item.done && 'done')} />}
                    <div className="cert-roadmap-label">
                      <div style={{ fontSize: 12, fontWeight: 600, color: item.done ? 'var(--text-primary)' : item.active ? 'var(--blue-400)' : 'var(--text-muted)' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.date}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: AI Coach + History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* AI Exam Coach */}
          <div className="ai-coach-panel">
            <div className="ai-coach-glow" />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div className="ai-coach-icon ai-pulse-ring">
                    <Brain size={16} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>AI Exam Coach</div>
                    <div style={{ fontSize: 11, color: 'var(--violet-400)' }}>{t('exam.aiCoachSub')}</div>
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-sm btn-icon"
                  onClick={() => setAiExpanded(!aiExpanded)}
                  style={{ borderRadius: 99 }}
                >
                  {aiExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {aiExpanded && (
                <>
                  {/* Pass Probability */}
                  <div style={{ marginBottom: 16, padding: '14px 16px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t('exam.passProb')}</span>
                      <span style={{ fontSize: 18, fontWeight: 900, color: '#22c55e' }}>{readiness}%</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${readiness}%`, background: 'linear-gradient(90deg,#22c55e,#4ade80)', borderRadius: 99, boxShadow: '0 0 10px rgba(34,197,94,0.4)' }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                      {aiRecommendations[0]?.text || t('exam.noRecommendationsYet')}
                    </div>
                  </div>

                  {/* Radar Chart + Topics */}
                  <div style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'center' }}>
                    <div style={{ flexShrink: 0 }}>
                      <RadarChart topics={aiTopics} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {aiTopics.slice(0, 4).map((t, i) => (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                            <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>{t.t}</span>
                            <span style={{ fontWeight: 700, color: t.c, flexShrink: 0 }}>{t.p}%</span>
                          </div>
                          <div style={{ height: 3, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${t.p}%`, background: t.c, borderRadius: 99, transition: 'width 1s' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Suggestions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 2 }}>{t('exam.smartRecs')}</div>
                    {aiRecommendations.map((s, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: 'var(--surface-1)', borderRadius: 10, border: '1px solid var(--border-1)', cursor: 'pointer' }} className="card-hover-subtle">
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <s.icon size={13} color={s.color} />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, alignSelf: 'center' }}>{s.text}</span>
                        <ChevronRight size={12} color="var(--text-muted)" style={{ marginLeft: 'auto', alignSelf: 'center', flexShrink: 0 }} />
                      </div>
                    ))}
                  </div>

                  <button
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)' }}
                    onClick={() => toast('AI amaliy test rejimi tez kunda ishga tushadi! 🚀', { icon: '✨' })}
                  >
                    <Sparkles size={13} /> {t('exam.aiPracticeMode')}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Last Results */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 16, letterSpacing: '-0.2px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={15} color="var(--blue-400)" /> {t('exam.lastResults')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {completedHistory.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                  {t('exam.noHistory')}
                </div>
              ) : (
                completedHistory.slice(0, 5).map((h, i) => {
                  const title = getExamTitle(h.testId);
                  const color = h.passed ? '#22c55e' : '#ef4444';
                  const IconComponent = h.passed ? CheckCircle : X;
                  const dateStr = h.submittedAt ? new Date(h.submittedAt).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' }) : (h.startedAt ? new Date(h.startedAt).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' }) : '');
                  return (
                    <div key={h.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--surface-1)', borderRadius: 12, border: '1px solid var(--border-1)' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <IconComponent size={16} color={color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{dateStr}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: color }}>{h.score}%</div>
                        <div style={{ fontSize: 10, color: h.passed ? 'var(--green-400)' : 'var(--red-400)', fontWeight: 600 }}>
                          {h.passed ? t('exam.passedLabel') : t('exam.failedLabel')}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 12, width: '100%', justifyContent: 'center', fontSize: 12 }}
              onClick={() => setShowAllResults(true)}
            >
              {t('exam.seeAllResults')} <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* All Results Modal */}
      {selectedExamForResults && (
        <ExamResultsModal
          exam={selectedExamForResults}
          onClose={() => setSelectedExamForResults(null)}
        />
      )}

      {/* Pre-Pass Premium Modal */}
      {prePassExam && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.72)', backdropFilter: 'blur(16px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="prepass-modal-shell" style={{ background: 'linear-gradient(145deg, rgba(15,23,42,0.98), rgba(24,24,27,0.98))', borderRadius: 24, width: 'min(960px, 96vw)', maxHeight: '88vh', boxShadow: '0 28px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden', display: 'grid', gridTemplateColumns: 'minmax(280px, 0.85fr) minmax(360px, 1.15fr)' }}>
            <div style={{ position: 'absolute', inset: '0 0 auto 0', height: 4, background: 'linear-gradient(90deg, #f97316, #ef4444, #a855f7)' }} />
            <button
              className="btn btn-ghost btn-icon"
              style={{ position: 'absolute', top: 16, right: 16, zIndex: 3, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              onClick={() => setPrePassExam(null)}
            >
              <X size={18} />
            </button>

            <div style={{ padding: 32, borderRight: '1px solid rgba(255,255,255,0.08)', background: 'radial-gradient(circle at 30% 10%, rgba(239,68,68,0.2), transparent 34%), radial-gradient(circle at 80% 90%, rgba(168,85,247,0.16), transparent 38%)' }}>
              <div style={{ width: 70, height: 70, borderRadius: 18, background: 'linear-gradient(135deg, rgba(239,68,68,0.22), rgba(249,115,22,0.16))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22, boxShadow: 'inset 0 0 28px rgba(239,68,68,0.14), 0 18px 44px rgba(239,68,68,0.16)' }}>
                <Wand2 size={34} color="#fb7185" style={{ filter: 'drop-shadow(0 0 10px rgba(251,113,133,0.55))' }} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.2, color: '#fb923c', textTransform: 'uppercase', marginBottom: 10 }}>
                {t('exam.prePassMode', "O'tish kafolati")}
              </div>
              <h3 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: '0 0 10px', letterSpacing: 0, lineHeight: 1.1 }}>
                {t('exam.prePassTitle', "Kafolatlangan o'tish")}
              </h3>
              <p style={{ fontSize: 13, color: 'rgba(226,232,240,0.74)', lineHeight: 1.6, marginBottom: 20 }}>
                <strong style={{ color: '#fff' }}>{prePassExam.title}</strong> {t('exam.prePassDescription', "imtihoni uchun xodim testni boshlaganda noto'g'ri javob tanlasa ham javob avtomatik to'g'ri variantga o'tadi.")}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#86efac', fontSize: 12, fontWeight: 800 }}>
                    <ShieldCheck size={15} /> {t('exam.prePassProtected', 'Server himoyasi')}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(226,232,240,0.6)', marginTop: 6 }}>{t('exam.prePassProtectedDesc', 'Javob serverda ham to‘g‘rilanadi')}</div>
                </div>
                <div style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fca5a5', fontSize: 12, fontWeight: 800 }}>
                    <Users size={15} /> {prePassUsers.length}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(226,232,240,0.6)', marginTop: 6 }}>{t('exam.prePassUsersCount', 'Kafolat berilganlar')}</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '32px 32px 28px', display: 'flex', flexDirection: 'column', gap: 18, minHeight: 520, maxHeight: '88vh', overflow: 'hidden' }}>
              <form onSubmit={handlePrePassSubmit} style={{ padding: 16, borderRadius: 18, background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.09)' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'rgba(241,245,249,0.92)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>
                  {t('exam.prePassEmployeeId', 'Xodim tabel raqami')}
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="text"
                    className="input"
                    placeholder={t('exam.prePassEmployeePlaceholder', 'Masalan: 1607')}
                    value={prePassTabel}
                    onChange={(e) => setPrePassTabel(e.target.value)}
                    required
                    autoFocus
                    style={{ flex: 1, minWidth: 0, fontSize: 15, padding: '12px 14px', borderRadius: 12, background: 'rgba(15,23,42,0.78)', border: '1px solid rgba(148,163,184,0.24)', color: '#fff', outline: 'none' }}
                  />
                  <button
                    type="submit"
                    disabled={isPrePassLoading || !prePassTabel.trim()}
                    className="btn btn-primary"
                    style={{ padding: '0 18px', borderRadius: 12, fontSize: 13, fontWeight: 900, background: 'linear-gradient(135deg, #f97316, #ef4444)', border: 'none', color: '#fff', boxShadow: '0 12px 26px rgba(239,68,68,0.22)', opacity: (isPrePassLoading || !prePassTabel.trim()) ? 0.6 : 1, cursor: (isPrePassLoading || !prePassTabel.trim()) ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {isPrePassLoading ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                    {isPrePassLoading ? t('common.saving', 'Saqlanmoqda') : t('exam.prePassAdd', "Qo'shish")}
                  </button>
                </div>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>{t('exam.prePassListTitle', "Kafolat berilganlar ro'yxati")}</div>
                  <div style={{ fontSize: 12, color: 'rgba(226,232,240,0.58)', marginTop: 3 }}>{t('exam.prePassListSubtitle', "Xodimlar testda avtomatik to'g'ri javoblarga yo'naltiriladi")}</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => loadPrePassUsers(prePassExam.id)} style={{ borderRadius: 10 }}>
                  <RotateCcw size={13} /> {t('common.refresh', 'Yangilash')}
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {isPrePassUsersLoading ? (
                  <div style={{ minHeight: 180, display: 'grid', placeItems: 'center', color: 'rgba(226,232,240,0.7)' }}>
                    <Loader2 size={24} className="animate-spin" />
                  </div>
                ) : prePassUsers.length === 0 ? (
                  <div style={{ minHeight: 180, borderRadius: 18, border: '1px dashed rgba(148,163,184,0.28)', background: 'rgba(15,23,42,0.4)', display: 'grid', placeItems: 'center', textAlign: 'center', padding: 24 }}>
                    <div>
                      <Users size={30} color="rgba(148,163,184,0.65)" style={{ marginBottom: 10 }} />
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'rgba(241,245,249,0.9)' }}>{t('exam.prePassEmptyTitle', 'Hali hech kimga kafolat berilmagan')}</div>
                      <div style={{ fontSize: 12, color: 'rgba(226,232,240,0.55)', marginTop: 5 }}>{t('exam.prePassEmptyDesc', 'Tabel raqamini kiriting va ro‘yxatga qo‘shing')}</div>
                    </div>
                  </div>
                ) : (
                  prePassUsers.map((item) => {
                    const displayName = i18n.language === 'ru' && item.fullNameRu ? item.fullNameRu : item.fullName;
                    return (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ width: 42, height: 42, borderRadius: 13, background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(14,165,233,0.14))', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                          <ShieldCheck size={19} color="#86efac" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 850, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName || t('common.unknown', 'Noma’lum')}</div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11, color: 'rgba(226,232,240,0.58)', marginTop: 4 }}>
                            <span>{t('profile.employeeId', 'Tabel raqami')}: {item.employeeId || '-'}</span>
                            {item.department && <span>{item.department}</span>}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-icon"
                          disabled={prePassRemovingId === item.id}
                          onClick={() => handleRemovePrePass(item.id)}
                          title={t('exam.prePassRemove', 'Ro‘yxatdan olib tashlash')}
                          style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.18)', opacity: prePassRemovingId === item.id ? 0.6 : 1 }}
                        >
                          {prePassRemovingId === item.id ? <Loader2 size={15} className="animate-spin" /> : <UserMinus size={15} color="#fca5a5" />}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAllResults && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
          <div className="card" style={{ maxWidth: 650, width: '90%', position: 'relative', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)' }}>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setShowAllResults(false)}
              style={{ position: 'absolute', top: 16, right: 16, borderRadius: '50%', background: 'var(--surface-2)' }}
            >
              <X size={20} color="var(--text-secondary)" />
            </button>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-primary)' }}>
              <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'var(--blue-400)', opacity: 0.1, position: 'absolute' }} />
              <BarChart3 size={22} color="var(--blue-400)" style={{ marginLeft: 9 }} />
              <span style={{ position: 'relative' }}>{t('exam.lastResults')} - {t('exam.seeAllResults')}</span>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: 8, display: 'flex', flexDirection: 'column', gap: 12 }} className="custom-scrollbar">
              {completedHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                  <Activity size={48} color="var(--text-muted)" style={{ opacity: 0.5, margin: '0 auto 16px' }} />
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{t('exam.noHistory')}</div>
                </div>
              ) : (
                completedHistory.map((h, i) => {
                  const title = getExamTitle(h.testId);
                  const color = h.passed ? '#22c55e' : '#ef4444';
                  const IconComponent = h.passed ? CheckCircle : X;
                  const dateStr = h.submittedAt ? new Date(h.submittedAt).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
                  return (
                    <div key={h.id || i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'var(--surface-1)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-1)', transition: 'var(--transition)' }}>
                      <div style={{ width: 48, height: 48, borderRadius: '14px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <IconComponent size={24} color={color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} /> {dateStr}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: color }}>{h.score}%</div>
                        <div style={{ fontSize: 11, color: h.passed ? 'var(--green-400)' : 'var(--red-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2, background: `${color}15`, padding: '2px 8px', borderRadius: '99px', display: 'inline-block' }}>
                          {h.passed ? t('exam.passedLabel') : t('exam.failedLabel')}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ── Result Screen ─────────────────────────────────────
function ResultScreen({ score, onBack }: { score: any; onBack: () => void }) {
  const passed = score.score >= score.passing;
  const { t, i18n } = useTranslation();
  const isRu = i18n.language === 'ru';

  const handlePrint = () => {
    if (!score) return;
    if (!score.attemptId) {
      alert(t('exam.certCount') + ' ' + t('exam.onlyVerifiedResult'));
      return;
    }
    const printWindow = window.open('', '_blank', 'width=900,height=650');
    if (!printWindow) return;

    const { user } = useAuthStore.getState();
    const holderName = user ? (user.fullName || `${user.firstName} ${user.lastName}`) : 'Xodim';
    const examTitle = score.examTitle || t('exam.defaultTitle');
    const examTitleRu = score.examTitleRu || score.examTitle || t('exam.defaultTitle');
    const certId = score.attemptId;
    const certScore = score.score || 0;
    const submittedAt = score.submittedAt ? new Date(score.submittedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    printWindow.document.write(`
      <html>
        <head>
          <title>${isRu ? 'Сертификат' : t('exam.certLabel')} - ${isRu ? examTitleRu : examTitle}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@600;700;800;900&family=Great+Vibes&family=Pinyon+Script&family=Montserrat:wght@400;500;600;700&display=swap');
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              background-color: #f0f2f5;
              font-family: 'Montserrat', sans-serif;
              box-sizing: border-box;
            }
            .certificate-border {
              width: 840px;
              height: 550px;
              padding: 24px;
              border: 14px solid #0d1b2a;
              background-color: #fff;
              position: relative;
              box-sizing: border-box;
              box-shadow: 0 15px 45px rgba(0,0,0,0.15);
              border-radius: 4px;
            }
            .certificate-inner {
              border: 2px solid #d4af37;
              height: 100%;
              padding: 35px 40px;
              text-align: center;
              box-sizing: border-box;
              position: relative;
              background: radial-gradient(circle, #fffcf4 30%, #fbf8ef 70%, #f4ebd0 100%);
              background-image:
                radial-gradient(circle, #fffcf4 30%, #fbf8ef 70%, #f4ebd0 100%),
                url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cpath d='M30 0 A 30 30 0 0 0 0 30 A 30 30 0 0 0 30 60 A 30 30 0 0 0 60 30 A 30 30 0 0 0 30 0 Z M30 5 A 25 25 0 0 1 55 30 A 25 25 0 0 1 30 55 A 25 25 0 0 1 30 5 Z M30 5 A 25 25 0 0 1 30 5 A 25 25 0 0 1 30 5 Z' fill='none' stroke='%23d4af37' stroke-width='0.12' opacity='0.15'/%3E%3Ccircle cx='30' cy='30' r='12' fill='none' stroke='%23d4af37' stroke-width='0.08' opacity='0.15'/%3E%3C/svg%3E");
            }
            .corner-ornament {
              position: absolute;
              width: 25px;
              height: 25px;
              border: 2px solid #d4af37;
            }
            .corner-tl { top: 12px; left: 12px; border-right: none; border-bottom: none; }
            .corner-tl::after { content: ''; position: absolute; top: 3px; left: 3px; width: 15px; height: 15px; border: 1px solid #aa7c11; border-right: none; border-bottom: none; }

            .corner-tr { top: 12px; right: 12px; border-left: none; border-bottom: none; }
            .corner-tr::after { content: ''; position: absolute; top: 3px; right: 3px; width: 15px; height: 15px; border: 1px solid #aa7c11; border-left: none; border-bottom: none; }

            .corner-bl { bottom: 12px; left: 12px; border-right: none; border-top: none; }
            .corner-bl::after { content: ''; position: absolute; bottom: 3px; left: 3px; width: 15px; height: 15px; border: 1px solid #aa7c11; border-right: none; border-top: none; }

            .corner-br { bottom: 12px; right: 12px; border-left: none; border-top: none; }
            .corner-br::after { content: ''; position: absolute; bottom: 3px; right: 3px; width: 15px; height: 15px; border: 1px solid #aa7c11; border-left: none; border-top: none; }

            .cert-serial {
              position: absolute;
              top: 15px;
              right: 20px;
              font-family: monospace;
              font-size: 9.5px;
              color: #aa7c11;
              font-weight: bold;
              letter-spacing: 0.5px;
            }

            .cert-header {
              font-family: 'Cinzel Decorative', serif;
              font-size: 32px;
              color: #0d1117;
              letter-spacing: 5px;
              margin-bottom: 2px;
              font-weight: 900;
              text-shadow: 0.5px 0.5px 0px rgba(212,175,55,0.4);
            }
            .cert-subtitle {
              font-size: 9px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 5px;
              color: #aa7c11;
              margin-bottom: 20px;
            }
            .award-to {
              font-family: 'Great Vibes', cursive;
              font-size: 26px;
              color: #aa7c11;
              margin-bottom: 4px;
            }
            .holder-name {
              font-family: 'Pinyon Script', cursive;
              font-size: 38px;
              font-weight: 700;
              color: #0d1117;
              border-bottom: 2.5px double #d4af37;
              display: inline-block;
              padding-bottom: 3px;
              margin-bottom: 18px;
              min-width: 360px;
              letter-spacing: 0.5px;
            }
            .cert-body {
              font-size: 13.5px;
              line-height: 1.7;
              color: #475569;
              max-width: 580px;
              margin: 0 auto 15px;
            }
            .cert-body strong {
              color: #0d1117;
              font-weight: 700;
            }
            .cert-meta {
              display: flex;
              justify-content: space-between;
              padding: 0 40px;
              margin-top: 30px;
              font-size: 11px;
              color: #64748b;
            }
            .signature-line {
              border-top: 1px solid #cbd5e1;
              width: 130px;
              margin: 5px auto 0;
            }
            .signature-specimen {
              font-family: 'Pinyon Script', cursive;
              font-size: 20px;
              color: #1e3a8a;
              height: 25px;
              line-height: 25px;
              margin-bottom: -5px;
            }

            .qr-code {
              font-family: monospace;
              font-size: 9px;
              color: #94a3b8;
              position: absolute;
              bottom: 30px;
              left: 45px;
              text-align: left;
            }

            .seal-container {
              position: absolute;
              bottom: 25px;
              right: 45px;
              width: 90px;
              height: 110px;
            }
            .ribbon-left {
              position: absolute;
              bottom: 0;
              left: 26px;
              width: 16px;
              height: 50px;
              background: #a91d22;
              transform: rotate(20deg);
              clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%);
              box-shadow: 0 2px 4px rgba(0,0,0,0.12);
            }
            .ribbon-right {
              position: absolute;
              bottom: 0;
              right: 26px;
              width: 16px;
              height: 50px;
              background: #25408f;
              transform: rotate(-20deg);
              clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%);
              box-shadow: 0 2px 4px rgba(0,0,0,0.12);
            }
            .gold-seal {
              position: absolute;
              top: 0;
              left: 0;
              width: 90px;
              height: 90px;
              filter: drop-shadow(0 4px 6px rgba(0,0,0,0.15));
            }
          </style>
        </head>
        <body>
          <div class="certificate-border">
            <div class="certificate-inner">
              <div class="corner-ornament corner-tl"></div>
              <div class="corner-ornament corner-tr"></div>
              <div class="corner-ornament corner-bl"></div>
              <div class="corner-ornament corner-br"></div>

              <div class="cert-serial">No. AGMK-LMS-${certId.substring(0, 8).toUpperCase()}</div>

              <div class="cert-header">${isRu ? 'СЕРТИФИКАТ' : t('exam.certLabel')}</div>
              <div class="cert-subtitle">${isRu ? 'ПОДТВЕРЖДЕНИЕ КВАЛИФИКАЦИИ' : t('exam.certSub')}</div>

              <div class="award-to">${isRu ? 'Настоящим подтверждается, что' : t('exam.awardTo')}</div>
              <div class="holder-name">${holderName}</div>

              <div class="cert-body">
                ${isRu
        ? `успешно прошел(ла) программу оценки знаний по курсу <strong>"${examTitleRu}"</strong> с результатом <strong>${certScore}%</strong>.`
        : t('exam.certBody', { title: examTitle, score: certScore })}
              </div>

              <div class="cert-meta">
                <div>
                  <div>${submittedAt}</div>
                  <div class="signature-line"></div>
                  <div style="margin-top:5px; font-weight:bold; color: #475569;">${isRu ? 'Дата выдачи' : t('exam.dateIssued')}</div>
                </div>
                <div>
                  <div class="signature-specimen">Alisher Qodirov</div>
                  <div class="signature-line"></div>
                  <div style="margin-top:5px; font-weight:bold; color: #475569;">${isRu ? 'Директор / Утвердил' : t('exam.directorSign')}</div>
                </div>
                <div>
                  <div style="font-style:italic; font-family:'Cinzel', serif; font-size:12px; color:#0d1117; font-weight: 700;">AGMK LMS</div>
                  <div class="signature-line"></div>
                  <div style="margin-top:5px; font-weight:bold; color: #475569;">${isRu ? 'Организация' : t('exam.organization')}</div>
                </div>
              </div>

              <div class="qr-code" style="display: flex; gap: 10px; align-items: center;">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=64&data=${encodeURIComponent(window.location.protocol + '//' + window.location.host + '/verify-certificate?id=' + certId)}" width="64" height="64" style="border: 1px solid #d4af37; padding: 2px; background: white;" />
                <div>
                  <div style="font-weight: bold; color: #aa7c11; font-size: 9px; margin-bottom: 2px; letter-spacing: 0.5px;">${isRu ? 'ПРОВЕРИТЬ' : t('exam.verify')}</div>
                  <div style="font-size: 8px; color: #64748b;">ID: ${certId.substring(0, 18).toUpperCase()}...</div>
                </div>
              </div>

              <div class="seal-container">
                <div class="ribbon-left"></div>
                <div class="ribbon-right"></div>
                <svg class="gold-seal" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="url(#goldGrad)" stroke="#b8860b" stroke-width="1"/>
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#fff" stroke-dasharray="3 3" stroke-width="1.5" opacity="0.85"/>
                  <polygon points="50,22 58,38 76,41 63,54 66,72 50,64 34,72 37,54 24,41 42,38" fill="#fff" opacity="0.95"/>
                  <defs>
                    <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stop-color="#f3e0aa" />
                      <stop offset="30%" stop-color="#d4af37" />
                      <stop offset="70%" stop-color="#aa7c11" />
                      <stop offset="100%" stop-color="#ffd700" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }} className="blur-fade">
      {/* Score Hero */}
      <div className={clsx('result-hero-panel', passed ? 'pass' : 'fail')}>
        <div className="result-hero-ambient" style={{ background: passed ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)' }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: passed ? 'rgba(34,197,94,0.12)' : 'rgba(239, 68, 68, 0.12)', border: `2px solid ${passed ? 'rgba(34,197,94,0.3)' : 'rgba(239, 68, 68, 0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: passed ? '0 0 40px rgba(34,197,94,0.2)' : '0 0 40px rgba(239, 68, 68, 0.2)' }}>
            {passed ? <Award size={48} color="#22c55e" /> : <AlertCircle size={48} color="#ef4444" />}
          </div>

          <div style={{ fontSize: 64, fontWeight: 900, color: passed ? 'var(--green-400)' : 'var(--red-400)', letterSpacing: '-2px', lineHeight: 1 }}>
            {score.score}%
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, margin: '12px 0 6px', letterSpacing: '-0.5px' }}>
            {passed ? t('exam.congratulations') : t('exam.tryAgain')}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28 }}>
            {passed ? t('exam.earnedCert') : t('exam.needMoreForPassing', { passing: score.passing })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxWidth: 400, margin: '0 auto' }}>
            {[
              { label: t('exam.correct'), value: score.correct, color: '#22c55e', icon: CheckCircle },
              { label: t('exam.wrong'), value: score.wrong, color: '#ef4444', icon: X },
              { label: t('exam.skipped'), value: score.skipped, color: '#f59e0b', icon: Flag },
            ].map((s, i) => (
              <div key={i} style={{ padding: '16px 12px', background: 'var(--surface-1)', borderRadius: 14, border: '1px solid var(--border-1)', textAlign: 'center' }}>
                <s.icon size={18} color={s.color} style={{ marginBottom: 6 }} />
                <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Topic Breakdown */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 15, marginBottom: 20, letterSpacing: '-0.2px' }}>
          <BarChart3 size={16} color="var(--blue-400)" /> {t('exam.topicBreakdown')}
        </div>
        {score.topics.map((t: any, i: number) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
              <span style={{ fontWeight: 600 }}>{t.name}</span>
              <span style={{ fontWeight: 800, color: t.color }}>{t.score}%</span>
            </div>
            <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${t.score}%`, background: `linear-gradient(90deg, ${t.color}, ${t.color}88)`, borderRadius: 99, boxShadow: `0 0 10px ${t.color}40`, transition: 'width 1s' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn-secondary" onClick={onBack}>← {t('exam.backBtn')}</button>
        {passed && (
          <button className="btn btn-primary" onClick={handlePrint} style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 8px 24px rgba(34,197,94,0.3)' }}>
            <Download size={14} /> {t('exam.downloadCert')}
          </button>
        )}
        {!passed && (
          <>
            <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
              <RotateCcw size={14} /> Qayta urinish
            </button>
            <button className="btn btn-primary" style={{ justifyContent: 'center', background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)' }}>
              <Brain size={14} /> AI bilan tayyorlan
            </button>
          </>
        )}
      </div>
    </div>
  );
}
