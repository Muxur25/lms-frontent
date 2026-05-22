import { useState } from 'react';
import { clsx } from 'clsx';
import {
  FileText, Clock, Award, Shield, CheckCircle, Flag,
  ChevronRight, BarChart3, Sparkles, Download, AlertCircle,
  TrendingUp, Star, X,
} from 'lucide-react';

type View = 'dashboard' | 'start' | 'exam' | 'result';

const exams = [
  { id: 1, title: 'Sanoat Xavfsizligi', titleRu: 'Промышленная безопасность', duration: 60, questions: 40, passing: 75, deadline: '26 May', color: '#ef4444', status: 'upcoming', attempts: 1 },
  { id: 2, title: 'React TypeScript Pro', titleRu: 'React TypeScript Pro', duration: 90, questions: 60, passing: 80, deadline: '28 May', color: '#3b82f6', status: 'upcoming', attempts: 2 },
  { id: 3, title: 'Menejment Asoslari', titleRu: 'Основы менеджмента', duration: 45, questions: 30, passing: 70, deadline: '01 Iyn', color: '#8b5cf6', status: 'available', attempts: 0 },
];

const history = [
  { title: 'ISO 9001 Sifat', score: 92, pass: true, date: '15 May', color: '#22c55e' },
  { title: 'Elektr Xavfsizligi', score: 64, pass: false, date: '10 May', color: '#ef4444' },
  { title: 'Loyiha Boshqaruvi', score: 88, pass: true, date: '05 May', color: '#22c55e' },
];

const questions = [
  {
    id: 1, type: 'single',
    text: 'React Hook\'lari qaysi React versiyasidan joriy etilgan?',
    options: ['React 15', 'React 16.8', 'React 17', 'React 18'],
    answer: null,
  },
  {
    id: 2, type: 'single',
    text: 'useEffect hook qachon ishga tushadi?',
    options: ['Faqat component mount bo\'lganda', 'Har bir render\'da', 'Dependency o\'zgarganda', 'B va C to\'g\'ri'],
    answer: null,
  },
  {
    id: 3, type: 'single',
    text: 'TypeScript da interface va type o\'rtasidagi asosiy farq nima?',
    options: ['Interface extend qilinadi', 'Type primitiv qiymatlarga ham qo\'llanadi', 'Interface faqat ob\'ektlar uchun', 'Farq yo\'q'],
    answer: null,
  },
  { id: 4, type: 'single', text: 'useState hook qaysi qiymatlarni qaytaradi?', options: ['Faqat state', 'State va setter', 'State, setter va ref', 'Effect va cleanup'], answer: null },
  { id: 5, type: 'single', text: 'React Context API nima uchun ishlatiladi?', options: ['API so\'rovlar', 'Global state', 'Routing', 'Animatsiya'], answer: null },
  { id: 6, type: 'single', text: 'useMemo hook nima uchun ishlatiladi?', options: ['Side effect', 'Memoization', 'Event handling', 'DOM manipulation'], answer: null },
];

const resultData = {
  score: 82, passing: 80, total: 60, correct: 49, wrong: 8, skipped: 3,
  topics: [
    { name: 'React Asoslari', score: 90, color: '#22c55e' },
    { name: 'TypeScript', score: 78, color: '#f59e0b' },
    { name: 'Hooks', score: 85, color: '#3b82f6' },
    { name: 'State Management', score: 72, color: '#f59e0b' },
    { name: 'Performance', score: 65, color: '#ef4444' },
  ],
};

export default function ExamPage() {
  const [view, setView] = useState<View>('dashboard');
  const [selectedExam, setSelectedExam] = useState(exams[0]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft] = useState(5400);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const answered = Object.keys(answers).length;
  const progress = Math.round((answered / questions.length) * 100);

  if (view === 'result') return <ResultScreen score={resultData} onBack={() => setView('dashboard')} />;

  if (view === 'exam') return (
    <div className="exam-layout">
      {/* Header */}
      <div className="exam-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Shield size={16} color="var(--green-400)" />
          <span style={{ fontSize: 13, fontWeight: 700 }}>{selectedExam.title}</span>
        </div>
        <div className="exam-timer" style={{ color: mins < 5 ? 'var(--red-400)' : 'var(--text-primary)' }}>
          <Clock size={15} />
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{answered}/{questions.length} javoblandi</div>
          <button className="btn btn-primary btn-sm" onClick={() => setView('result')}>Topshirish</button>
        </div>
      </div>

      {/* Progress */}
      <div style={{ background: 'var(--bg-1)', padding: '0 24px 10px', borderBottom: '1px solid var(--border-1)' }}>
        <div className="progress-bar" style={{ height: 4 }}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="exam-body">
        {/* Question Area */}
        <div className="exam-question-area">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span className="badge badge-blue" style={{ fontSize: 11 }}>Savol {current + 1} / {questions.length}</span>
            <button
              className={clsx('btn btn-sm', flagged.has(current) ? 'btn-secondary' : 'btn-ghost')}
              onClick={() => setFlagged(f => { const n = new Set(f); n.has(current) ? n.delete(current) : n.add(current); return n; })}
              style={{ color: flagged.has(current) ? 'var(--amber-400)' : undefined }}
            >
              <Flag size={13} /> {flagged.has(current) ? 'Belgilangan' : 'Belgilash'}
            </button>
          </div>

          <div className="exam-question-card">
            <p style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.7, marginBottom: 24 }}>
              {questions[current].text}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {questions[current].options.map((opt, i) => (
                <button
                  key={i}
                  className={clsx('exam-option', answers[current] === i && 'exam-option-selected')}
                  onClick={() => setAnswers(a => ({ ...a, [current]: i }))}
                >
                  <div className={clsx('exam-option-dot', answers[current] === i && 'active')}>
                    {answers[current] === i && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                  <span style={{ fontSize: 14 }}>{opt}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>
              ← Oldingi
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => current < questions.length - 1 ? setCurrent(c => c + 1) : setView('result')}>
              {current < questions.length - 1 ? 'Keyingi →' : 'Topshirish'}
            </button>
          </div>
        </div>

        {/* Navigation Panel */}
        <aside className="exam-nav-panel">
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Savollar</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 14 }}>
            {questions.map((_, i) => (
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
          <div style={{ fontSize: 11, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { cls: 'exam-nav-answered', label: `Javoblandi (${answered})` },
              { cls: 'exam-nav-flagged', label: `Belgilandi (${flagged.size})` },
              { cls: 'exam-nav-btn', label: `Javobsiz (${questions.length - answered})` },
            ].map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className={clsx('exam-nav-btn', l.cls)} style={{ width: 18, height: 18, fontSize: 9, pointerEvents: 'none' }} />
                <span style={{ color: 'var(--text-tertiary)' }}>{l.label}</span>
              </div>
            ))}
          </div>
          <hr className="divider" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--green-400)' }}>
            <Shield size={13} /> AI monitoring faol
          </div>
        </aside>
      </div>
    </div>
  );

  if (view === 'start') return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="card" style={{ marginBottom: 16, background: `linear-gradient(135deg, ${selectedExam.color}15, var(--bg-2))`, border: `1px solid ${selectedExam.color}30` }}>
        <div style={{ display: 'flex', gap: 14, marginBottom: 18 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: `${selectedExam.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={26} color={selectedExam.color} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20 }}>{selectedExam.title}</div>
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 3 }}>Imtihon • {selectedExam.duration} daqiqa</div>
          </div>
        </div>
        <div className="grid grid-2" style={{ gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Davomiyligi', value: `${selectedExam.duration} min`, icon: Clock, color: '#3b82f6' },
            { label: 'Savollar', value: selectedExam.questions, icon: FileText, color: '#8b5cf6' },
            { label: 'O\'tish bali', value: `${selectedExam.passing}%`, icon: Award, color: '#22c55e' },
            { label: 'Urinish', value: `${selectedExam.attempts + 1}-chi`, icon: TrendingUp, color: '#f59e0b' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--surface-1)', borderRadius: 12, border: '1px solid var(--border-1)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={16} color={s.color} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="card" style={{ marginBottom: 16, padding: 16, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--red-400)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertCircle size={14} /> Qoidalar
          </div>
          {["Brauzerni to'liq ekranda ishlating", "Vaqt tugaganda avtomatik topshiriladi", "Har bir savolga faqat bir marta javob berish mumkin", "AI monitoring faol bo'ladi"].map((r, i) => (
            <div key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '4px 0', display: 'flex', gap: 8 }}>
              <span style={{ color: 'var(--red-400)' }}>•</span> {r}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setView('dashboard')}>Bekor qilish</button>
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setView('exam')}>
            <Shield size={15} /> Imtihonni boshlash
          </button>
        </div>
      </div>
    </div>
  );

  // Dashboard
  return (
    <div>
      <div className="page-header fade-in">
        <div>
          <div className="page-title">Testlar va Imtihonlar</div>
          <div className="page-sub">Sertifikatlash markazi • AGMK</div>
        </div>
        <button className="btn btn-primary btn-sm"><Award size={14} /> Sertifikatlarim</button>
      </div>

      {/* Stats */}
      <div className="grid grid-4 fade-in fade-in-1" style={{ marginBottom: 24 }}>
        {[
          { label: 'Jami urinishlar', value: '14', icon: FileText, c: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
          { label: 'O\'tildi', value: '11', icon: CheckCircle, c: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
          { label: 'O\'rtacha ball', value: '84%', icon: Star, c: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { label: 'Sertifikatlar', value: '5', icon: Award, c: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-header">
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ marginTop: 6 }}>{s.value}</div>
              </div>
              <div className="stat-icon" style={{ background: s.bg }}><s.icon size={22} color={s.c} /></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-12 fade-in fade-in-2" style={{ marginBottom: 24 }}>
        {/* Upcoming exams */}
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Kutilayotgan imtihonlar</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {exams.map(exam => (
              <div key={exam.id} className="card" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${exam.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 44 }}>
                    <FileText size={20} color={exam.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{exam.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3, display: 'flex', gap: 10 }}>
                      <span><Clock size={10} style={{ marginRight: 3 }} />{exam.duration} min</span>
                      <span><FileText size={10} style={{ marginRight: 3 }} />{exam.questions} savol</span>
                      <span style={{ color: 'var(--amber-400)' }}>Muddat: {exam.deadline}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>O'tish: {exam.passing}%</div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => { setSelectedExam(exam); setView('start'); }}
                    >
                      Boshlash <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* AI Prep */}
          <div className="card" style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.08),rgba(59,130,246,0.05))', border: '1px solid rgba(139,92,246,0.2)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={14} color="#fff" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 14 }}>AI Tayyorgarlik</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
              React TypeScript imtihoniga 85% tayyor ekansiz. "TypeScript Generics" bo'limini takrorlang.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[{ t: 'TypeScript Generics', p: 65, c: '#f59e0b' }, { t: 'React Performance', p: 72, c: '#f59e0b' }, { t: 'Hooks asoslari', p: 92, c: '#22c55e' }].map((t, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{t.t}</span>
                    <span style={{ fontWeight: 700, color: t.c }}>{t.p}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: 4 }}>
                    <div className="progress-fill" style={{ width: `${t.p}%`, background: t.c }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* History */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Oxirgi natijalar</div>
            {history.map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < history.length - 1 ? '1px solid var(--border-1)' : 'none' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: `${h.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {h.pass ? <CheckCircle size={14} color={h.color} /> : <X size={14} color={h.color} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{h.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{h.date}</div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: h.color }}>{h.score}%</div>
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}>
              Barcha natijalar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultScreen({ score, onBack }: { score: typeof resultData; onBack: () => void }) {
  const passed = score.score >= score.passing;
  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Score Card */}
      <div className="card" style={{ textAlign: 'center', marginBottom: 20, padding: '40px 32px', background: `linear-gradient(135deg, ${passed ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)'}, var(--bg-2))`, border: `1px solid ${passed ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: passed ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          {passed ? <Award size={40} color="#22c55e" /> : <AlertCircle size={40} color="#ef4444" />}
        </div>
        <div style={{ fontSize: 48, fontWeight: 900, color: passed ? 'var(--green-400)' : 'var(--red-400)', letterSpacing: '-1px' }}>{score.score}%</div>
        <div style={{ fontSize: 20, fontWeight: 700, margin: '8px 0 4px' }}>{passed ? 'Tabriklaymiz! ✨' : 'Yana urinib ko\'ring'}</div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{passed ? 'Sertifikat olishga haqli bo\'ldingiz' : `O'tish uchun ${score.passing}% talab qilinadi`}</div>
        <div className="grid grid-3" style={{ marginTop: 24, gap: 12 }}>
          {[
            { label: 'To\'g\'ri', value: score.correct, color: '#22c55e' },
            { label: 'Noto\'g\'ri', value: score.wrong, color: '#ef4444' },
            { label: 'O\'tkazildi', value: score.skipped, color: '#f59e0b' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '14px', background: 'var(--surface-1)', borderRadius: 12, border: '1px solid var(--border-1)' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Topic Breakdown */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
          <BarChart3 size={15} color="var(--blue-400)" /> Mavzu bo'yicha tahlil
        </div>
        {score.topics.map((t, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t.name}</span>
              <span style={{ fontWeight: 700, color: t.color }}>{t.score}%</span>
            </div>
            <div className="progress-bar" style={{ height: 6 }}>
              <div className="progress-fill" style={{ width: `${t.score}%`, background: t.color }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-secondary" onClick={onBack}>← Orqaga</button>
        {passed && <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}><Download size={14} /> Sertifikat yuklab olish</button>}
        {!passed && <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Qayta urinish</button>}
      </div>
    </div>
  );
}
