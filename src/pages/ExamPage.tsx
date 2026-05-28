import { useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import {
  FileText, Clock, Award, Shield, CheckCircle, Flag,
  ChevronRight, BarChart3, Sparkles, Download, AlertCircle,
  TrendingUp, Star, X, Zap, Brain, Target, Activity,
  ArrowRight, Play, RotateCcw, Eye, Lock, Flame, Trophy,
  ChevronUp, ChevronDown, Radio, Cpu, Plus,
} from 'lucide-react';
import { useExamStore } from '@/store/exam.store';
import { useAuthStore } from '@/store/auth.store';
import { CreateExamWizard } from '@/components/exam/CreateExamWizard';

type View = 'dashboard' | 'start' | 'exam' | 'result';

const history = [
  { title: 'ISO 9001 Sifat', score: 92, pass: true, date: '15 May', color: '#22c55e', icon: CheckCircle },
  { title: 'Elektr Xavfsizligi', score: 64, pass: false, date: '10 May', color: '#ef4444', icon: X },
  { title: 'Loyiha Boshqaruvi', score: 88, pass: true, date: '05 May', color: '#22c55e', icon: CheckCircle },
];

const aiTopics = [
  { t: 'TypeScript Generics', p: 65, c: '#f59e0b', status: 'weak' },
  { t: 'React Performance', p: 72, c: '#f59e0b', status: 'moderate' },
  { t: 'State Management', p: 78, c: '#3b82f6', status: 'moderate' },
  { t: 'Hooks asoslari', p: 92, c: '#22c55e', status: 'strong' },
  { t: 'TypeScript Types', p: 88, c: '#22c55e', status: 'strong' },
];

const certRoadmap = [
  { title: 'React Foundation', done: true, date: 'Mar 2026' },
  { title: 'TypeScript Pro', done: true, date: 'Apr 2026' },
  { title: 'React Advanced', done: false, date: 'Jun 2026', active: true },
  { title: 'Full Stack', done: false, date: 'Aug 2026' },
  { title: 'Architecture', done: false, date: 'Oct 2026' },
];

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

function RadarChart({ topics }: { topics: typeof aiTopics }) {
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const r = 55;
  const n = topics.length;

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
  const { exams, isLoading: loading, error, loadExams } = useExamStore();
  const { user } = useAuthStore();
  
  const [showWizard, setShowWizard] = useState(false);
  const canCreate = user?.role && ['super_admin', 'admin', 'trainer'].includes(user.role);

  const [view, setView] = useState<View>('dashboard');
  const [selectedExam, setSelectedExam] = useState<any | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(5400);
  const [result, setResult] = useState<any | null>(null);
  const [aiExpanded, setAiExpanded] = useState(true);
  const [readiness] = useState(85);
  const [streak] = useState(7);

  const questions = selectedExam?.questions || [];
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const answered = Object.keys(answers).length;
  const progress = questions.length > 0 ? Math.round((answered / questions.length) * 100) : 0;
  const isUrgent = mins < 5;

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const handleSubmitExam = () => {
    const questionsList = selectedExam?.questions || [];
    let correct = 0, wrong = 0;
    questionsList.forEach((q: any, index: number) => {
      const ua = answers[index];
      if (ua !== undefined) {
        if (ua === q.answer) correct++;
        else wrong++;
      }
    });
    const total = questionsList.length;
    const skipped = total - correct - wrong;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    setResult({
      score, passing: selectedExam?.passing || 70, total, correct, wrong, skipped,
      topics: [
        { name: selectedExam?.title || 'Imtihon', score, color: score >= (selectedExam?.passing || 70) ? '#22c55e' : '#ef4444' },
        { name: 'Nazariy qism', score: Math.min(Math.round(score * 0.95), 100), color: '#3b82f6' },
        { name: 'Amaliy qism', score: Math.min(Math.round(score * 1.05), 100), color: '#8b5cf6' },
      ],
    });
    setView('result');
  };

  useEffect(() => {
    if (view !== 'exam') return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(interval); handleSubmitExam(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [view, selectedExam, answers]);

  // ── Result View ──────────────────────────────────
  if (view === 'result') return <ResultScreen score={result} onBack={() => setView('dashboard')} />;

  // ── Exam View ────────────────────────────────────
  if (view === 'exam') return (
    <div className="exam-immersive-layout">
      {/* Ambient */}
      <div className="exam-ambient" />

      {/* Header */}
      <div className="exam-immersive-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#22c55e,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={14} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedExam.title}</div>
            <div style={{ fontSize: 11, color: 'var(--green-400)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Radio size={9} style={{ animation: 'pulse 2s infinite' }} /> AI monitoring faol
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
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Javoblandi</div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSubmitExam}
            style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 0 20px rgba(34,197,94,0.3)' }}
          >
            <CheckCircle size={13} /> Topshirish
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
                Savol {current + 1} / {questions.length}
              </span>
              {flagged.has(current) && <span className="badge badge-amber"><Flag size={10} /> Belgilangan</span>}
            </div>
            <button
              className={clsx('btn btn-sm', flagged.has(current) ? 'btn-secondary' : 'btn-ghost')}
              style={{ color: flagged.has(current) ? 'var(--amber-400)' : undefined, borderRadius: 99 }}
              onClick={() => setFlagged(f => { const n = new Set(f); n.has(current) ? n.delete(current) : n.add(current); return n; })}
            >
              <Flag size={12} /> {flagged.has(current) ? 'Belgini olib tashlash' : 'Belgilash'}
            </button>
          </div>

          <div className="exam-question-premium">
            <p style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.75, marginBottom: 28, color: 'var(--text-primary)' }}>
              {questions[current].text}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {questions[current].options.map((opt: string, i: number) => {
                const isSelected = answers[current] === i;
                const letters = ['A', 'B', 'C', 'D'];
                return (
                  <button
                    key={i}
                    className={clsx('exam-option-premium', isSelected && 'selected')}
                    onClick={() => setAnswers(a => ({ ...a, [current]: i }))}
                  >
                    <div className={clsx('exam-option-letter', isSelected && 'selected')}>
                      {letters[i] || i + 1}
                    </div>
                    <span style={{ fontSize: 14.5, lineHeight: 1.5 }}>{opt}</span>
                    {isSelected && <CheckCircle size={16} style={{ marginLeft: 'auto', color: 'var(--blue-400)', flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, gap: 12 }}>
            <button
              className="btn btn-secondary"
              onClick={() => setCurrent(c => Math.max(0, c - 1))}
              disabled={current === 0}
            >
              ← Oldingi
            </button>
            <button
              className="btn btn-primary"
              onClick={() => current < questions.length - 1 ? setCurrent(c => c + 1) : handleSubmitExam()}
              style={{ minWidth: 140, justifyContent: 'center' }}
            >
              {current < questions.length - 1 ? <>Keyingi <ArrowRight size={14} /></> : <><CheckCircle size={14} /> Topshirish</>}
            </button>
          </div>
        </div>

        {/* Navigation Panel */}
        <aside className="exam-nav-premium">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: 14 }}>
            Navigatsiya
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 20 }}>
            {questions.map((_: any, i: number) => (
              <button
                key={i}
                className={clsx('exam-nav-btn',
                  i === current && 'exam-nav-current',
                  answers[i] !== undefined && 'exam-nav-answered',
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
              { cls: 'exam-nav-answered', label: `Javoblandi`, count: answered, color: '#22c55e' },
              { cls: 'exam-nav-flagged', label: `Belgilandi`, count: flagged.size, color: '#f59e0b' },
              { cls: 'exam-nav-btn', label: `Javobsiz`, count: questions.length - answered, color: '#64748b' },
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
              <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e' }}>AI Monitoring</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Faol himoya</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );

  // ── Start View — Premium Exam Pre-Entry ──────────────────────────────────
  if (view === 'start') return (
    <div className="exam-start-fullscreen blur-fade">

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
            <span>Xavfsiz imtihon muhiti faol</span>
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
                Rasmiy Sertifikatlash Imtihoni
              </div>
              <h1 className="exam-start-name">{selectedExam.title}</h1>
              <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                <span className="badge badge-blue" style={{ fontSize: 11 }}>
                  <Clock size={10} /> {selectedExam.duration} daqiqa
                </span>
                <span className="badge badge-violet" style={{ fontSize: 11 }}>
                  <FileText size={10} /> {selectedExam.questionsCount || selectedExam.questions?.length || 0} savol
                </span>
                <span className="badge badge-green" style={{ fontSize: 11 }}>
                  <Award size={10} /> {selectedExam.passing}% o'tish
                </span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="exam-start-stats">
            {[
              { label: 'Davomiylik', value: `${selectedExam.duration}`, unit: 'min', icon: Clock, color: '#3b82f6' },
              { label: 'Savollar', value: selectedExam.questionsCount || selectedExam.questions?.length || 0, unit: 'ta', icon: FileText, color: '#8b5cf6' },
              { label: "O'tish bali", value: selectedExam.passing, unit: '%', icon: Award, color: '#22c55e' },
              { label: 'Urinish', value: (selectedExam.attempts || 0) + 1, unit: '-chi', icon: TrendingUp, color: '#f59e0b' },
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
              <span>Imtihon qoidalari</span>
            </div>
            <div className="exam-start-rules-list">
              {[
                { icon: '🖥️', text: "Brauzerni to'liq ekranda ishlating" },
                { icon: '⏱️', text: 'Vaqt tugaganda avtomatik topshiriladi' },
                { icon: '✏️', text: "Har bir savolga faqat bir marta javob bering" },
                { icon: '🤖', text: "AI monitoring butun imtihon davomida faol bo'ladi" },
                { icon: '🔒', text: "Imtihon davomida boshqa sahifaga o'tish taqiqlanadi" },
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
            <button
              className="btn btn-secondary"
              onClick={() => setView('dashboard')}
              style={{ borderRadius: 14, padding: '12px 24px' }}
            >
              ← Orqaga
            </button>
            <button
              className="exam-start-launch-btn"
              onClick={() => {
                setTimeLeft((selectedExam?.duration || 60) * 60);
                setCurrent(0);
                setAnswers({});
                setFlagged(new Set());
                setView('exam');
              }}
            >
              <div className="exam-launch-btn-glow" />
              <Shield size={17} />
              <span>Imtihonni boshlash</span>
              <ChevronRight size={17} />
            </button>
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
                  <div style={{ fontSize: 11, color: 'var(--violet-400)' }}>Enterprise monitoring tizimi</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 99 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#22c55e' }}>FAOL</span>
                </div>
              </div>

              {/* Monitoring Checks */}
              {[
                { label: 'Sessiya xavfsizligi', status: 'ok', icon: Shield },
                { label: 'AI kamera monitoring', status: 'ok', icon: Eye },
                { label: 'Fokus kuzatish', status: 'ok', icon: Activity },
                { label: 'Shubhali faollik deteksiya', status: 'ok', icon: Zap },
              ].map((check, i) => (
                <div key={i} className="exam-proctor-check" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <check.icon size={13} color="var(--green-400)" />
                  </div>
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{check.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle size={13} color="var(--green-400)" />
                    <span style={{ fontSize: 11, color: 'var(--green-400)', fontWeight: 700 }}>Tayyor</span>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Xavfsizlik darajasi</div>
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
              Tayyorgarlik darajasi
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
                <svg width="90" height="90" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle cx="45" cy="45" r="38" fill="none" stroke="url(#readGrad)" strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 38 * 85 / 100} ${2 * Math.PI * 38}`}
                    strokeLinecap="round" style={{ transition: 'stroke-dasharray 1.2s' }} />
                  <defs>
                    <linearGradient id="readGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#4ade80" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>85%</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>tayyor</div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Yaxshi tayyor!
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  "TypeScript Generics" bo'limini biroz takrorlasangiz, 95%+ ehtimol bilan o'tasiz.
                </div>
              </div>
            </div>
          </div>

          {/* Exam Timer Preview */}
          <div className="exam-timer-preview">
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 12 }}>
              Imtihon vaqti
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 38, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1px' }}>
                {String(selectedExam.duration || 60).padStart(2, '0')}:00
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>daqiqa</span>
            </div>
            <div style={{ marginTop: 12, height: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '100%', background: 'linear-gradient(90deg,#3b82f6,#8b5cf6)', borderRadius: 99 }} />
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
              Vaqt tugaganda avtomatik topshiriladi
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  // ── Dashboard View ────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 110, borderRadius: 20 }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 20 }}>
        <div className="skeleton" style={{ height: 320, borderRadius: 20 }} />
        <div className="skeleton" style={{ height: 320, borderRadius: 20 }} />
      </div>
    </div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <AlertCircle size={48} color="var(--red-400)" style={{ marginBottom: 16 }} />
      <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{error}</div>
      <button className="btn btn-secondary btn-sm" onClick={() => window.location.reload()}>Qayta urinish</button>
    </div>
  );

  return (
    <div className="exam-dashboard-root blur-fade">
      {/* ─── Cinematic Hero ─── */}
      <div className="exam-hero-section">
        <div className="exam-hero-ambient" />
        <div className="exam-hero-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(139,92,246,0.4)' }}>
              <Cpu size={16} color="#fff" />
            </div>
            <span className="badge badge-violet" style={{ fontSize: 11 }}>
              <Sparkles size={10} /> Sertifikatlash Markazi
            </span>
          </div>

          <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 12, background: 'linear-gradient(180deg, #f1f5f9, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Imtihon Ekosistemi
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 28, maxWidth: 480, lineHeight: 1.6 }}>
            AI-powered sertifikatlash platformasi. Real-time tahlil, aqlli tavsiyalar va premium imtihon tajribasi.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 99 }}>
              <Flame size={13} color="#22c55e" />
              <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 700 }}>{streak} kunlik streak</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 99 }}>
              <Brain size={13} color="#8b5cf6" />
              <span style={{ fontSize: 13, color: '#8b5cf6', fontWeight: 700 }}>AI tayyor: {readiness}%</span>
            </div>
            {canCreate && (
              <button 
                onClick={() => setShowWizard(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', borderRadius: 99, color: '#fff', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 15px rgba(59,130,246,0.4)', transition: 'all 0.3s' }}
              >
                <Plus size={16} /> Test Yaratish
              </button>
            )}
          </div>
        </div>

        {/* Right: AI Readiness Gauge */}
        <div className="exam-hero-gauge">
          {showWizard && (
            <CreateExamWizard 
              onClose={() => setShowWizard(false)} 
              onSuccess={() => { 
                setShowWizard(false); 
                loadExams(); 
              }} 
            />
          )}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: 8 }}>AI Tayyor Ko'rsatkich</div>
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
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>tayyor</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: "O'tildi", value: '11', color: '#22c55e' },
              { label: 'Sertifikat', value: '5', color: '#8b5cf6' },
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
          { label: 'Jami urinishlar', value: 14, icon: FileText, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', change: '+2', up: true, sub: 'bu oy' },
          { label: "O'tilgan imtihonlar", value: 11, icon: CheckCircle, color: '#22c55e', bg: 'rgba(34,197,94,0.08)', change: '+3', up: true, sub: '78% muvaffaqiyat' },
          { label: "O'rtacha ball", value: 84, icon: Star, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', change: '+6%', up: true, sub: "vs. o'tgan oy", suffix: '%' },
          { label: 'Sertifikatlar', value: 5, icon: Award, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', change: '+1', up: true, sub: 'oxirgi 30 kun' },
          { label: 'AI Tayyor', value: readiness, icon: Brain, color: '#06b6d4', bg: 'rgba(6,182,212,0.08)', change: '+12%', up: true, sub: 'keyingi imtihon', suffix: '%' },
          { label: 'Streak', value: streak, icon: Flame, color: '#f87171', bg: 'rgba(248,113,113,0.08)', change: 'rekord', up: true, sub: "kunlik o'qish", suffix: ' kun' },
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
              <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.3px' }}>Kutilayotgan imtihonlar</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{exams.length} ta imtihon siz uchun tayyor</div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>
              Barchasi <ChevronRight size={12} />
            </button>
          </div>

          {exams.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--surface-1)', borderRadius: 20, border: '1px solid var(--border-1)' }}>
              <Trophy size={40} color="var(--text-muted)" style={{ marginBottom: 12, opacity: 0.4 }} />
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Imtihonlar topilmadi</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Yangi imtihonlar qo'shilganda shu yerda ko'rinadi</div>
            </div>
          ) : (
            exams.map((exam, idx) => (
              <div key={exam.id} className="exam-card-premium" style={{ animationDelay: `${idx * 0.06}s` }}>
                {/* Difficulty band */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: `linear-gradient(180deg, ${exam.color || '#3b82f6'}, transparent)`, borderRadius: '20px 0 0 20px' }} />

                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: `${exam.color || '#3b82f6'}15`, border: `1px solid ${exam.color || '#3b82f6'}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={22} color={exam.color || '#3b82f6'} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>{exam.title}</div>
                      <span className="badge badge-blue" style={{ fontSize: 10 }}>Rasmiy</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={10} /> {exam.timeLimitMinutes || 60} min
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FileText size={10} /> {exam.questionsCount || exam.questions?.length || 0} savol
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Target size={10} /> O'tish: {exam.passingScore || 70}%
                      </span>
                      {exam.deadline && <span style={{ color: 'var(--amber-400)' }}>Muddat: {exam.deadline}</span>}
                    </div>

                    {/* AI Readiness for this exam */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, height: 4, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${readiness}%`, background: `linear-gradient(90deg, ${exam.color || '#3b82f6'}, rgba(139,92,246,0.8))`, borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: exam.color || '#3b82f6', whiteSpace: 'nowrap' }}>
                        {readiness}% tayyor
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => { setSelectedExam(exam); setView('start'); }}
                      style={{ borderRadius: 12, whiteSpace: 'nowrap' }}
                    >
                      Boshlash <ChevronRight size={12} />
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      <Eye size={11} /> Ko'rish
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Certification Roadmap */}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 16, letterSpacing: '-0.3px' }}>Sertifikatlash yo'nalishi</div>
            <div className="cert-roadmap-container">
              {certRoadmap.map((item, i) => (
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
              ))}
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
                    <div style={{ fontSize: 11, color: 'var(--violet-400)' }}>Aqlli tayyorgarlik yordamchisi</div>
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
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>O'tish ehtimoli</span>
                      <span style={{ fontSize: 18, fontWeight: 900, color: '#22c55e' }}>87%</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '87%', background: 'linear-gradient(90deg,#22c55e,#4ade80)', borderRadius: 99, boxShadow: '0 0 10px rgba(34,197,94,0.4)' }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>TypeScript bo'limlarini takrorlang — 95% bo'ladi!</div>
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
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 2 }}>Aqlli tavsiyalar</div>
                    {[
                      { text: 'TypeScript Generics bo\'limini o\'tkazing', priority: 'high', icon: Zap, color: '#f59e0b' },
                      { text: 'React Performance patternsini takrorlang', priority: 'medium', icon: Activity, color: '#3b82f6' },
                      { text: '3 ta amaliy test ishlang', priority: 'low', icon: Target, color: '#22c55e' },
                    ].map((s, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: 'var(--surface-1)', borderRadius: 10, border: '1px solid var(--border-1)', cursor: 'pointer' }} className="card-hover-subtle">
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <s.icon size={13} color={s.color} />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, alignSelf: 'center' }}>{s.text}</span>
                        <ChevronRight size={12} color="var(--text-muted)" style={{ marginLeft: 'auto', alignSelf: 'center', flexShrink: 0 }} />
                      </div>
                    ))}
                  </div>

                  <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)' }}>
                    <Sparkles size={13} /> AI amaliy test rejimi
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Last Results */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 16, letterSpacing: '-0.2px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={15} color="var(--blue-400)" /> Oxirgi natijalar
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {history.map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--surface-1)', borderRadius: 12, border: '1px solid var(--border-1)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${h.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <h.icon size={16} color={h.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{h.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{h.date}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: h.color }}>{h.score}%</div>
                    <div style={{ fontSize: 10, color: h.pass ? 'var(--green-400)' : 'var(--red-400)', fontWeight: 600 }}>
                      {h.pass ? "O'tdi" : "O'tmadi"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 12, width: '100%', justifyContent: 'center', fontSize: 12 }}>
              Barcha natijalar ko'rish <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Result Screen ─────────────────────────────────────
function ResultScreen({ score, onBack }: { score: any; onBack: () => void }) {
  const passed = score.score >= score.passing;

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }} className="blur-fade">
      {/* Score Hero */}
      <div className={clsx('result-hero-panel', passed ? 'pass' : 'fail')}>
        <div className="result-hero-ambient" style={{ background: passed ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)' }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: passed ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', border: `2px solid ${passed ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: passed ? '0 0 40px rgba(34,197,94,0.2)' : '0 0 40px rgba(239,68,68,0.2)' }}>
            {passed ? <Award size={48} color="#22c55e" /> : <AlertCircle size={48} color="#ef4444" />}
          </div>

          <div style={{ fontSize: 64, fontWeight: 900, color: passed ? 'var(--green-400)' : 'var(--red-400)', letterSpacing: '-2px', lineHeight: 1 }}>
            {score.score}%
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, margin: '12px 0 6px', letterSpacing: '-0.5px' }}>
            {passed ? '🎉 Tabriklaymiz!' : 'Yana harakat qiling'}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28 }}>
            {passed ? "Sertifikat olishga haqli bo'ldingiz!" : `O'tish uchun ${score.passing}% kerak`}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxWidth: 400, margin: '0 auto' }}>
            {[
              { label: "To'g'ri", value: score.correct, color: '#22c55e', icon: CheckCircle },
              { label: "Noto'g'ri", value: score.wrong, color: '#ef4444', icon: X },
              { label: "O'tkazildi", value: score.skipped, color: '#f59e0b', icon: Flag },
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
          <BarChart3 size={16} color="var(--blue-400)" /> Mavzu bo'yicha tahlil
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
        <button className="btn btn-secondary" onClick={onBack}>← Orqaga</button>
        {passed && (
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 8px 24px rgba(34,197,94,0.3)' }}>
            <Download size={14} /> Sertifikat yuklab olish
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
