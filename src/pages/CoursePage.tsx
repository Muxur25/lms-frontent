import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import {
  Play, Pause, Volume2, Maximize2, Settings,
  ChevronDown, ChevronRight, CheckCircle,
  Clock, BookOpen, Star, Users, Award, Sparkles,

  FileText, Download, MessageSquare, Bookmark,
  SkipForward, SkipBack, X, Send, ThumbsUp,
} from 'lucide-react';

/* ── Data ─────────────────────────────────────── */
const course = {
  title: 'React va TypeScript Professional',
  titleRu: 'React и TypeScript Professional',
  instructor: 'Alisher Toshev',
  rating: 4.9, enrolled: 847, duration: '24 soat',
  lessons: 64, level: "O'rta", color: '#3b82f6',
  progress: 68,
  description: 'Zamonaviy React.js va TypeScript texnologiyalarini professional darajada o\'zlashtiring.',
};

const modules = [
  {
    id: 1, title: 'Kirish', titleRu: 'Введение', lessons: 4, done: 4,
    items: [
      { id: 1, title: 'Kurs haqida', dur: '5:20', done: true, type: 'video' },
      { id: 2, title: 'Muhit sozlash', dur: '12:45', done: true, type: 'video' },
      { id: 3, title: 'Birinchi loyiha', dur: '18:30', done: true, type: 'video' },
      { id: 4, title: 'Kirish testi', dur: '10 savol', done: true, type: 'quiz' },
    ],
  },
  {
    id: 2, title: 'React Asoslari', titleRu: 'Основы React', lessons: 8, done: 5,
    items: [
      { id: 5, title: 'JSX va Komponentlar', dur: '22:10', done: true, type: 'video' },
      { id: 6, title: 'Props va State', dur: '28:45', done: true, type: 'video' },
      { id: 7, title: 'Hooks: useState', dur: '25:30', done: true, type: 'video' },
      { id: 8, title: 'Hooks: useEffect', dur: '30:15', done: true, type: 'video', current: true },
      { id: 9, title: 'Context API', dur: '20:00', done: false, type: 'video' },
      { id: 10, title: 'Custom Hooks', dur: '18:40', done: false, type: 'video' },
      { id: 11, title: 'Amaliy mashq', dur: 'Loyiha', done: false, type: 'assignment' },
      { id: 12, title: 'Bo\'lim testi', dur: '15 savol', done: false, type: 'quiz' },
    ],
  },
  {
    id: 3, title: 'TypeScript Chuqurlashish', titleRu: 'Углублённый TypeScript', lessons: 10, done: 0,
    items: [
      { id: 13, title: 'Tiplash asoslari', dur: '24:00', done: false, type: 'video' },
      { id: 14, title: 'Interfeys va Tiplar', dur: '20:15', done: false, type: 'video' },
    ],
  },
];

const aiMessages = [
  { role: 'ai', text: 'Salom! Hooks: useEffect darsida nimalar haqida savolingiz bor?' },
  { role: 'user', text: 'useEffect dependency array qanday ishlaydi?' },
  { role: 'ai', text: 'Dependency array useEffect qachon qayta ishga tushishini belgilaydi. Bo\'sh massiv [] bo\'lsa — faqat bir marta, qiymat bo\'lsa — u o\'zgarganda qayta ishlaydi.' },
];

const materials = [
  { name: 'React Hooks Cheatsheet.pdf', size: '2.4 MB', type: 'PDF' },
  { name: 'useEffect Examples.zip', size: '1.1 MB', type: 'ZIP' },
  { name: 'Amaliy mashq topshiriq.docx', size: '0.8 MB', type: 'DOC' },
];

const comments = [
  { name: 'Kamola Y.', time: '2 soat oldin', text: 'useEffect dan keyin komponent unmount bo\'lganda cleanup qilishni ham tushintirasizmi?', likes: 12, avatar: 'KY', color: '#8b5cf6' },
  { name: 'Bobur R.', time: 'Kecha', text: 'Juda yaxshi tushuntirilgan! dependency array haqida ko\'p savollarim bor edi.', likes: 8, avatar: 'BR', color: '#22c55e' },
];

/* ── Component ─────────────────────────────────── */
export default function CoursePage() {
  const { i18n } = useTranslation();
  const [view, setView] = useState<'overview' | 'player'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'ai' | 'notes' | 'materials' | 'discussion'>('ai');
  const [openModule, setOpenModule] = useState<number | null>(2);
  const [playing, setPlaying] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const isRu = i18n.language === 'ru';
  const title = isRu ? course.titleRu : course.title;

  if (view === 'overview') {
    return <CourseOverview course={course} title={title} isRu={isRu} onStart={() => setView('player')} />;
  }

  return (
    <div className="course-player-layout">
      {/* ── VIDEO AREA ── */}
      <div className={clsx('player-main', !sidebarOpen && 'player-main-full')}>
        {/* Video */}
        <div className="video-container">
          <div className="video-screen">
            <div style={{ color: 'rgba(255,255,255,0.15)', textAlign: 'center' }}>
              <Play size={64} />
              <div style={{ marginTop: 12, fontSize: 16 }}>Hooks: useEffect — 30:15</div>
            </div>
            <div className="video-overlay-top">
              <button className="btn btn-ghost btn-sm" style={{ color: '#fff' }} onClick={() => setView('overview')}>
                <X size={14} /> Kursga qaytish
              </button>
            </div>
          </div>
          {/* Controls */}
          <div className="video-controls">
            <div className="video-progress">
              <div className="video-progress-fill" style={{ width: '42%' }} />
            </div>
            <div className="video-ctrl-row">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="video-btn"><SkipBack size={16} /></button>
                <button className="video-btn video-btn-play" onClick={() => setPlaying(!playing)}>
                  {playing ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button className="video-btn"><SkipForward size={16} /></button>
                <button className="video-btn"><Volume2 size={15} /></button>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>12:48 / 30:15</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="video-btn" style={{ fontSize: 12, width: 'auto', padding: '0 8px' }}>1.0x</button>
                <button className="video-btn"><Settings size={14} /></button>
                <button className="video-btn"><Maximize2 size={14} /></button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="player-tabs">
          <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-1)', paddingBottom: 0 }}>
            {[
              { id: 'ai', icon: Sparkles, label: 'AI Assistant' },
              { id: 'notes', icon: Bookmark, label: 'Eslatmalar' },
              { id: 'materials', icon: FileText, label: 'Materiallar' },
              { id: 'discussion', icon: MessageSquare, label: 'Muhokama' },
            ].map(tab => (
              <button
                key={tab.id}
                className={clsx('player-tab', activeTab === tab.id && 'active')}
                onClick={() => setActiveTab(tab.id as any)}
              >
                <tab.icon size={13} /> {tab.label}
              </button>
            ))}
            <div style={{ marginLeft: 'auto' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? 'Yopish' : 'Darslar'} <ChevronRight size={13} />
              </button>
            </div>
          </div>

          <div className="player-tab-content">
            {activeTab === 'ai' && (
              <div className="ai-chat">
                <div className="ai-chat-messages">
                  {aiMessages.map((m, i) => (
                    <div key={i} className={clsx('ai-msg', m.role === 'user' && 'ai-msg-user')}>
                      {m.role === 'ai' && (
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 28 }}>
                          <Sparkles size={13} color="#fff" />
                        </div>
                      )}
                      <div className={clsx('ai-bubble', m.role === 'user' && 'ai-bubble-user')}>{m.text}</div>
                    </div>
                  ))}
                </div>
                <div className="ai-input-row">
                  <input
                    className="input"
                    placeholder="Savolingizni yozing..."
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                    style={{ fontSize: 13 }}
                  />
                  <button className="btn btn-primary btn-icon btn-sm"><Send size={14} /></button>
                </div>
              </div>
            )}

            {activeTab === 'materials' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {materials.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 8, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={16} color="#3b82f6" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.type} • {m.size}</div>
                    </div>
                    <button className="btn btn-ghost btn-sm btn-icon"><Download size={14} /></button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'notes' && (
              <div>
                <textarea
                  className="input"
                  placeholder="12:48 — Bu yerga eslatmangizni yozing..."
                  rows={4}
                  style={{ resize: 'none', marginBottom: 10, fontSize: 13 }}
                />
                <button className="btn btn-primary btn-sm"><Bookmark size={13} /> Saqlash</button>
              </div>
            )}

            {activeTab === 'discussion' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {comments.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10 }}>
                    <div className="avatar" style={{ width: 32, height: 32, fontSize: 11, background: `${c.color}30`, color: c.color, minWidth: 32 }}>{c.avatar}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.time}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.text}</div>
                      <button className="btn btn-ghost btn-sm" style={{ marginTop: 6, padding: '4px 8px', fontSize: 11 }}>
                        <ThumbsUp size={11} /> {c.likes}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── LESSON SIDEBAR ── */}
      {sidebarOpen && (
        <aside className="lesson-sidebar">
          <div className="lesson-sidebar-header">
            <div style={{ fontWeight: 700, fontSize: 14 }}>Darslar</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{course.progress}% bajarildi</div>
          </div>
          <div className="progress-bar" style={{ height: 4, margin: '0 16px 12px', borderRadius: 99 }}>
            <div className="progress-fill" style={{ width: `${course.progress}%` }} />
          </div>
          <div className="lesson-sidebar-body">
            {modules.map(mod => (
              <div key={mod.id} className="lesson-module">
                <button
                  className="lesson-module-header"
                  onClick={() => setOpenModule(openModule === mod.id ? null : mod.id)}
                >
                  <ChevronDown size={14} style={{ transform: openModule === mod.id ? 'rotate(0)' : 'rotate(-90deg)', transition: '0.2s', minWidth: 14 }} />
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{isRu ? mod.titleRu : mod.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{mod.done}/{mod.lessons} dars</div>
                  </div>
                  {mod.done === mod.lessons && <CheckCircle size={14} color="var(--green-400)" />}
                </button>
                {openModule === mod.id && (
                  <div className="lesson-items">
                    {mod.items.map(item => (
                      <div key={item.id} className={clsx('lesson-item', item.done && 'lesson-item-done', (item as any).current && 'lesson-item-current')}>
                        <div className="lesson-item-icon">
                          {item.done
                            ? <CheckCircle size={13} color="var(--green-400)" />
                            : item.type === 'quiz' ? <FileText size={13} />
                            : item.type === 'assignment' ? <Award size={13} />
                            : <Play size={13} />
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{item.dur}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}

/* ── Course Overview ────────────────────────────── */
function CourseOverview({ course, title, isRu, onStart }: any) {
  const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'reviews'>('overview');

  return (
    <div>
      {/* Hero */}
      <div className="course-hero" style={{ marginBottom: 24 }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${course.color}20, rgba(0,0,0,0.7))`, borderRadius: 'inherit' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.07 }}>
          <BookOpen size={200} />
        </div>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 680 }}>
          <span className="badge badge-blue" style={{ marginBottom: 12, display: 'inline-flex' }}>IT • {isRu ? 'Средний' : "O'rta daraja"}</span>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 10, lineHeight: 1.25 }}>{title}</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 20, lineHeight: 1.6 }}>{course.description}</p>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Star size={13} color="#f59e0b" fill="#f59e0b" /> {course.rating}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Users size={13} /> {course.enrolled} o'quvchi</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={13} /> {course.duration}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><BookOpen size={13} /> {course.lessons} dars</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div className="avatar" style={{ width: 30, height: 30, fontSize: 11, background: `${course.color}40` }}>AT</div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{course.instructor}</span>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span>Umumiy jarayon</span>
              <span style={{ fontWeight: 700, color: course.color }}>{course.progress}%</span>
            </div>
            <div className="progress-bar" style={{ height: 8 }}>
              <div className="progress-fill" style={{ width: `${course.progress}%` }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={onStart}><Play size={15} /> Davom etish</button>
            <button className="btn btn-secondary"><Bookmark size={14} /> Saqlash</button>
            <button className="btn btn-secondary"><Award size={14} /> Sertifikat</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: 14, padding: 4, width: 'fit-content' }}>
        {[{ id: 'overview', label: 'Umumiy' }, { id: 'modules', label: 'Darslar' }, { id: 'reviews', label: 'Sharhlar' }].map(tab => (
          <button key={tab.id} className={clsx('btn btn-sm', activeTab === tab.id ? 'btn-primary' : 'btn-ghost')} style={{ borderRadius: 10 }} onClick={() => setActiveTab(tab.id as any)}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-12">
        <div>
          {activeTab === 'overview' && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Kurs haqida</div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                Ushbu kurs orqali siz React.js va TypeScript texnologiyalarini professional darajada o'rganasiz.
                Hook'lar, Context API, Custom Hook'lar, va zamonaviy state management'ni amalda qo'llaysiz.
              </p>
              <div className="grid grid-2" style={{ marginTop: 16, gap: 12 }}>
                {[
                  { icon: CheckCircle, text: '64 ta video dars' },
                  { icon: FileText, text: '8 ta test va topshiriq' },
                  { icon: Award, text: 'Sertifikat beriladi' },
                  { icon: Clock, text: '24 soat kontent' },
                ].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <f.icon size={15} color="var(--green-400)" /> {f.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'modules' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {modules.map(mod => (
                <div key={mod.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{mod.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{mod.lessons} dars • {mod.done} bajarildi</div>
                    </div>
                    <div className="progress-bar" style={{ width: 80, height: 6 }}>
                      <div className="progress-fill" style={{ width: `${(mod.done / mod.lessons) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {comments.map((c, i) => (
                <div key={i} className="card">
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div className="avatar" style={{ width: 38, height: 38, fontSize: 13, background: `${c.color}25`, color: c.color }}>{c.avatar}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</span>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={11} color="#f59e0b" fill="#f59e0b" />)}
                        </div>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.08),rgba(59,130,246,0.05))', border: '1px solid rgba(139,92,246,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={14} color="#fff" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 14 }}>AI Tavsiya</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
              Ushbu kursni tugatsangiz, "Node.js va API" kursini boshlashni tavsiya qilamiz — 94% mos keladi.
            </p>
            <button className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
              <Sparkles size={13} /> Ko'rish
            </button>
          </div>

          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Materiallar</div>
            {materials.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < materials.length - 1 ? '1px solid var(--border-1)' : 'none' }}>
                <FileText size={14} color="var(--blue-400)" />
                <span style={{ flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                <button className="btn btn-ghost btn-sm btn-icon"><Download size={12} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
