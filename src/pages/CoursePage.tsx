import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  Play, 
  ChevronRight, CheckCircle,
  Clock, BookOpen, Star, Users, Award, Sparkles,
  FileText, Download, MessageSquare, Bookmark,
  X, Send, ZoomIn, ZoomOut,
  Trash2, Plus, Edit3, Save, Loader,
  Pause, Volume2, VolumeX, Maximize, RotateCcw, RotateCw, Lock,
} from 'lucide-react';
import { apiClient } from '@/api/axios';
import { aiApi } from '@/api/ai.api';
import { useAuthStore } from '@/store/auth.store';
import { QuizBuilderModal, QuizPlayer } from '../components/Quiz';
import { PDFViewer } from '@/components/BookReader';
import toast from 'react-hot-toast';
import { getApiOrigin } from '@/shared/lib/api-config';

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

export interface QuizData {
  timeLimit: number;
  passingScore: number;
  questions: QuizQuestion[];
}

interface LessonItem {
  id: string | number;
  title: string;
  titleRu?: string; // Kept for interface backward compatibility if needed
  dur: string;
  done?: boolean;
  type: 'video' | 'quiz' | 'assignment';
  videoUrl?: string;
  quizData?: QuizData;
  current?: boolean;
}

interface Module {
  id: string | number;
  title: string;
  titleRu?: string; // Kept for interface backward compatibility if needed
  lessons: number;
  done?: number;
  items: LessonItem[];
}

const EDITOR_ROLES = ['super_admin', 'hr_manager', 'trainer'];

/* ── Helpers ─────────────────────────────────── */
function nextId() {
  return Date.now().toString();
}

function normalizeMediaUrl(url?: string) {
  const value = url?.trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) return `${getApiOrigin()}${value}`;
  return `${getApiOrigin()}/${value}`;
}

const hasPositiveNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
};

const getCourseDiscussionAuthor = (item: any) => {
  const fullName = item.user?.fullName || [item.user?.firstName, item.user?.lastName].filter(Boolean).join(' ');
  return fullName || item.authorName || 'User';
};

const getInitialsFromName = (name: string) => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase())
  .join('') || 'U';

function getYoutubeEmbedUrl(url?: string) {
  const value = url?.trim();
  if (!value) return '';

  try {
    const parsed = new URL(value);
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '');
      return id ? `https://www.youtube.com/embed/${id}` : '';
    }
    if (parsed.hostname.includes('youtube.com')) {
      const watchId = parsed.searchParams.get('v');
      const embedMatch = parsed.pathname.match(/\/embed\/([^/?]+)/);
      const shortsMatch = parsed.pathname.match(/\/shorts\/([^/?]+)/);
      const id = watchId || embedMatch?.[1] || shortsMatch?.[1];
      return id ? `https://www.youtube.com/embed/${id}` : '';
    }
  } catch {
    return '';
  }

  return '';
}

/* ── Component ─────────────────────────────────── */
function formatVideoTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const rounded = Math.floor(seconds);
  const h = Math.floor(rounded / 3600);
  const m = Math.floor((rounded % 3600) / 60);
  const s = rounded % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const getAiGreeting = (isRu: boolean) => (
  isRu
    ? 'Здравствуйте! Можете задать вопрос по текущему уроку.'
    : 'Salom! Dars haqida savolingiz bo\'lsa so\'rashingiz mumkin.'
);

function CourseVideoPlayer({
  src,
  title,
  seekEnabled,
  onError,
  onEnded,
}: {
  src: string;
  title?: string;
  seekEnabled: boolean;
  onError: () => void;
  onEnded: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const controlsTimerRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [watchedOnce, setWatchedOnce] = useState(seekEnabled);
  const [controlsVisible, setControlsVisible] = useState(false);
  const canSeek = seekEnabled || watchedOnce;

  useEffect(() => {
    setWatchedOnce(seekEnabled);
    setCurrentTime(0);
    setDuration(0);
    setPlaying(true);
    setControlsVisible(false);
  }, [src, seekEnabled]);

  useEffect(() => {
    return () => {
      if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current);
    };
  }, []);

  const revealControls = () => {
    setControlsVisible(true);
    if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = window.setTimeout(() => {
      setControlsVisible(false);
    }, 5000);
  };

  const blurControl = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.blur();
  };

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      await video.play().catch(() => setPlaying(false));
    } else {
      video.pause();
    }
  };

  const seekBy = (delta: number) => {
    if (!canSeek) return;
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(Math.max(video.currentTime + delta, 0), duration || video.duration || 0);
  };

  const seekToPercent = (value: number) => {
    if (!canSeek) return;
    const video = videoRef.current;
    const total = duration || video?.duration || 0;
    if (!video || !total) return;
    video.currentTime = (value / 100) * total;
  };

  const changeVolume = (value: number) => {
    const video = videoRef.current;
    const next = Math.min(Math.max(value, 0), 1);
    setVolume(next);
    setMuted(next === 0);
    if (video) {
      video.volume = next;
      video.muted = next === 0;
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const next = !video.muted;
    video.muted = next;
    setMuted(next);
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2, 0.75];
    const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    setSpeed(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  };

  const toggleFullscreen = async () => {
    const shell = shellRef.current;
    if (!shell) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => undefined);
    } else {
      await shell.requestFullscreen().catch(() => undefined);
    }
    revealControls();
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const handleEnded = () => {
    setWatchedOnce(true);
    onEnded();
  };

  return (
    <div
      className={clsx('course-video-player', controlsVisible && 'controls-visible')}
      ref={shellRef}
      onMouseMove={revealControls}
      onMouseLeave={() => setControlsVisible(false)}
      onTouchStart={revealControls}
    >
      <video
        ref={videoRef}
        key={src}
        src={src}
        autoPlay
        playsInline
        preload="metadata"
        onClick={togglePlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
        onVolumeChange={(event) => {
          setMuted(event.currentTarget.muted);
          setVolume(event.currentTarget.volume);
        }}
        onError={onError}
        onEnded={handleEnded}
        className="course-video-element"
      />

      <div className="course-video-title">{title}</div>
      <div className="course-video-center">
        <button type="button" className="course-video-round" onClick={(event) => { blurControl(event); seekBy(-10); }} disabled={!canSeek} title={canSeek ? '-10s' : 'Video tugagandan keyin ochiladi'}>
          <RotateCcw size={20} />
        </button>
        <button type="button" className="course-video-play" onClick={(event) => { blurControl(event); void togglePlay(); }} title={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
        </button>
        <button type="button" className="course-video-round" onClick={(event) => { blurControl(event); seekBy(10); }} disabled={!canSeek} title={canSeek ? '+10s' : 'Video tugagandan keyin ochiladi'}>
          <RotateCw size={20} />
        </button>
      </div>

      <div className="course-video-controls">
        <input
          className="course-video-progress"
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progress}
          disabled={!canSeek}
          onChange={(event) => seekToPercent(Number(event.target.value))}
          style={{ ['--progress' as string]: `${progress}%` }}
          aria-label="Video progress"
        />
        <div className="course-video-control-row">
          <div className="course-video-left-controls">
            <button type="button" className="course-video-icon" onClick={(event) => { blurControl(event); void togglePlay(); }}>
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button type="button" className="course-video-icon" onClick={(event) => { blurControl(event); toggleMute(); }}>
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              className="course-video-volume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={muted ? 0 : volume}
              onChange={(event) => changeVolume(Number(event.target.value))}
              aria-label="Volume"
            />
            <span className="course-video-time">
              {formatVideoTime(currentTime)} / {formatVideoTime(duration)}
            </span>
          </div>
          <div className="course-video-right-controls">
            <button type="button" className="course-video-speed" onClick={(event) => { blurControl(event); cycleSpeed(); }}>{speed}x</button>
            <button type="button" className="course-video-icon" onClick={(event) => { blurControl(event); void toggleFullscreen(); }}>
              <Maximize size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function isPdfUrl(url?: string) {
  return /\.pdf($|[?#])/i.test(url || '');
}

function getRequestUrl(url: string) {
  let clean = url;
  try {
    const origin = getApiOrigin();
    if (clean.startsWith(origin)) clean = clean.slice(origin.length);
  } catch {}
  if (clean.startsWith('/api/v1')) clean = clean.slice(7);
  if (clean.startsWith('api/v1')) clean = clean.slice(6);
  return clean;
}

function CourseAssignmentViewer({
  title,
  url,
  isRu,
  onComplete,
}: {
  title?: string;
  url?: string;
  isRu: boolean;
  onComplete: () => void;
}) {
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [scale, setScale] = useState(1.2);
  const normalizedUrl = normalizeMediaUrl(url);
  const isPdf = isPdfUrl(normalizedUrl);

  useEffect(() => {
    if (!normalizedUrl || !isPdf) {
      setPdfData(null);
      setLoadingPdf(false);
      return;
    }

    let cancelled = false;
    setLoadingPdf(true);
    setPdfError('');
    setPdfData(null);

    const loadPdf = async () => {
      try {
        const isLocal = normalizedUrl.startsWith(getApiOrigin()) || normalizedUrl.startsWith('/');
        if (isLocal) {
          const res = await apiClient.get(getRequestUrl(normalizedUrl), { responseType: 'arraybuffer' });
          if (!cancelled) setPdfData(new Uint8Array(res.data));
        } else {
          const res = await fetch(normalizedUrl);
          const buffer = await res.arrayBuffer();
          if (!cancelled) setPdfData(new Uint8Array(buffer));
        }
      } catch (err) {
        console.error('Assignment PDF failed to load', err);
        if (!cancelled) setPdfError(isRu ? 'PDF faylni ochib bo‘lmadi.' : 'PDF faylni ochib bo‘lmadi.');
      } finally {
        if (!cancelled) setLoadingPdf(false);
      }
    };

    loadPdf();
    return () => { cancelled = true; };
  }, [normalizedUrl, isPdf, isRu]);

  if (!normalizedUrl) {
    return (
      <div className="assignment-empty-state">
        <Award size={46} color="#f59e0b" />
        <h2>{title}</h2>
        <p>{isRu ? 'Файл задания не прикреплен' : 'Topshiriq fayli biriktirilmagan'}</p>
      </div>
    );
  }

  if (!isPdf) {
    return (
      <div className="assignment-empty-state">
        <FileText size={46} color="#f87171" />
        <h2>{title}</h2>
        <p>{isRu ? 'Задание должно быть только в формате PDF.' : 'Topshiriq faqat PDF formatda ko‘rsatiladi.'}</p>
      </div>
    );
  }

  return (
    <div className="assignment-reader">
      <div className="assignment-reader-header">
        <div className="assignment-reader-title">
          <span className="badge badge-amber">PDF</span>
          <div>
            <h2>{title}</h2>
            <p>{isRu ? 'Задание открыто в режиме чтения' : 'Topshiriq o‘qish rejimida ochildi'}</p>
          </div>
        </div>
        <div className="assignment-reader-actions">
          <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setScale(s => Math.max(0.6, +(s - 0.2).toFixed(2)))}>
            <ZoomOut size={15} />
          </button>
          <span>{Math.round(scale * 100)}%</span>
          <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setScale(s => Math.min(2.6, +(s + 0.2).toFixed(2)))}>
            <ZoomIn size={15} />
          </button>
          <a className="btn btn-primary btn-sm" href={normalizedUrl} target="_blank" rel="noreferrer" onClick={onComplete}>
            <Download size={14} /> {isRu ? 'Открыть' : 'Ochish'}
          </a>
        </div>
      </div>

      <div className="assignment-reader-body">
        {loadingPdf ? (
          <div className="assignment-empty-state">
            <Loader size={38} style={{ animation: 'spin 1s linear infinite' }} />
            <p>{isRu ? 'PDF yuklanmoqda...' : 'PDF yuklanmoqda...'}</p>
          </div>
        ) : pdfError ? (
          <div className="assignment-empty-state">
            <FileText size={46} color="#f87171" />
            <p>{pdfError}</p>
          </div>
        ) : pdfData ? (
          <PDFViewer data={pdfData} downloadable scale={scale} />
        ) : null}
      </div>
    </div>
  );
}

export default function CoursePage() {
  const { i18n } = useTranslation();
  const { courseId } = useParams<{ courseId: string }>();
  const user = useAuthStore(s => s.user);
  const isRu = i18n.language === 'ru';
  const aiEndRef = useRef<HTMLDivElement | null>(null);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'overview' | 'player'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'ai' | 'notes' | 'materials' | 'discussion'>('ai');

  const [aiInput, setAiInput] = useState('');
  const [currentLessonId, setCurrentLessonId] = useState<string | number | null>(null);
  const [videoError, setVideoError] = useState(false);

  // AI & Discussion State
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: getAiGreeting(isRu) }
  ]);
  const [aiLoading, setAiLoading] = useState(false);

  const [discussions, setDiscussions] = useState<any[]>([]);
  const [discussionInput, setDiscussionInput] = useState('');
  const [discussionImageUrl, setDiscussionImageUrl] = useState('');
  const [discussionLoading, setDiscussionLoading] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [lessonNotes, setLessonNotes] = useState<Array<{ id: string; text: string; createdAt: string }>>([]);

  // Course modules state — driven from backend
  const [courseModules, setCourseModules] = useState<Module[]>([]);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [addingModule, setAddingModule] = useState(false);

  const [materialUploading, setMaterialUploading] = useState(false);
  const [uploadingLessons, setUploadingLessons] = useState<Record<string, boolean>>({});

  const canEdit = user && EDITOR_ROLES.includes(user.role as string);

  useEffect(() => {
    setAiMessages((messages) => {
      if (messages.length !== 1 || messages[0].role !== 'ai') return messages;
      return [{ role: 'ai', text: getAiGreeting(isRu) }];
    });
  }, [isRu]);

  useEffect(() => {
    let isMounted = true;

    const fetchCourse = async () => {
      try {
        setLoading(true);
        let fetched: any = null;
        if (!courseId) {
          const res = await apiClient.get('/courses');
          const data = res.data?.data || res.data || [];
          fetched = Array.isArray(data) && data.length > 0 ? data[0] : null;
        } else {
          const res = await apiClient.get(`/courses/${courseId}`);
          fetched = res.data?.data || res.data;
        }

        if (fetched && isMounted) {
          const courseData = {
            ...fetched,
            id: fetched._id || fetched.id,
            progress: fetched.enrollment?.progress || fetched.completion || fetched.progress || 0,
            enrollment: fetched.enrollment,
          };
          setCourse(courseData);
          
          let mods: Module[] = (fetched.modules && fetched.modules.length > 0)
            ? fetched.modules.map((m: any) => ({
                ...m,
                lessons: m.items?.length || 0,
                done: m.done ?? 0,
                items: m.items || [],
              }))
            : [];
            
          // Map completed lessons if enrolled
          if (fetched.enrollment?.completedLessons) {
            mods = mods.map((m: any) => ({
              ...m,
              done: m.items.filter((i: any) => fetched.enrollment.completedLessons.includes(i.id)).length,
              items: m.items.map((i: any) => ({
                ...i,
                done: fetched.enrollment.completedLessons.includes(i.id)
              }))
            }));
          }
          setCourseModules(mods);
          if (!currentLessonId) {
            const firstLesson = mods.flatMap((m) => m.items).find((i: any) => i.current) || mods.flatMap((m) => m.items)[0];
            if (firstLesson) setCurrentLessonId(firstLesson.id);
          }
        } else if (isMounted) {
          setCourse(null);
          setCourseModules([]);
        }
      } catch (err) {
        console.error('Error fetching course:', err);
        if (isMounted) {
          setCourse(null);
          setCourseModules([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCourse();
    return () => { isMounted = false; };
  }, [courseId]);

  /* ── Edit mode actions ─────────────────────── */
  const handleSave = useCallback(async () => {
    if (!course?.id) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await apiClient.patch(`/courses/${course.id}`, { modules: courseModules });
      // Refresh modules from backend response to get proper DB UUIDs
      const saved = res.data?.data || res.data;
      if (saved?.modules && Array.isArray(saved.modules)) {
        setCourseModules(saved.modules);
      }
      setEditMode(false);
    } catch (e) {
      setSaveError('Saqlashda xatolik. Qayta urinib ko\'ring.');
    } finally {
      setSaving(false);
    }
  }, [course, courseModules]);

  const addModule = () => {
    const title = newModuleTitle.trim();
    if (!title) return;
    const newMod: Module = {
      id: nextId(),
      title,
      lessons: 0,
      done: 0,
      items: [],
    };
    setCourseModules(prev => [...prev, newMod]);
    setNewModuleTitle('');
    setAddingModule(false);

  };

  const deleteModule = (modId: string | number) => {
    setCourseModules(prev => prev.filter(m => m.id !== modId));
  };

  const updateModuleTitle = (modId: string | number, title: string) => {
    setCourseModules(prev => prev.map(m =>
      m.id === modId ? { ...m, title } : m
    ));
  };

  const addLesson = (modId: string | number) => {
    setCourseModules(prev => prev.map(m => {
      if (m.id !== modId) return m;

      const newItem: LessonItem = {
        id: nextId(),
        title: 'Yangi dars',
        dur: '0:00',
        done: false,
        type: 'video',
      };
      return { ...m, lessons: m.lessons + 1, items: [...m.items, newItem] };
    }));
  };

  const deleteLesson = (modId: string | number, lessonId: string | number) => {
    setCourseModules(prev => prev.map(m => {
      if (m.id !== modId) return m;
      const newItems = m.items.filter(i => i.id !== lessonId);
      return { ...m, lessons: newItems.length, items: newItems };
    }));
  };

  const updateLesson = (modId: string | number, lessonId: string | number, field: keyof LessonItem, value: any) => {
    setCourseModules(prev => prev.map(m => {
      if (m.id !== modId) return m;
      return {
        ...m,
        items: m.items.map(item =>
          item.id === lessonId ? { ...item, [field]: value } : item
        ),
      };
    }));
  };

  const handleLessonUpload = async (modId: string | number, lessonId: string | number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const key = `${modId}-${lessonId}`;
    setUploadingLessons(prev => ({ ...prev, [key]: true }));
    
    const formData = new FormData();
    formData.append('visibility', 'public');
    formData.append('file', file);
    
    try {
      const res = await apiClient.post('/uploads/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 0, // Disable timeout for uploads
      });
      // Backend returns relative url like /api/v1/uploads/download/:id
      // Build absolute URL so video player can use it
      const relativeUrl = res.data?.url || res.data?.data?.url;
      if (relativeUrl) {
        updateLesson(modId, lessonId, 'videoUrl', normalizeMediaUrl(relativeUrl));
      }
    } catch (err) {
      console.error('Error uploading lesson file:', err);
      toast.error('Fayl yuklashda xatolik yuz berdi');
    } finally {
      setUploadingLessons(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleEnroll = async () => {
    if (!course?.id) return;
    try {
      setLoading(true);
      await apiClient.post(`/courses/${course.id}/enroll`);
      window.location.reload();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleLessonComplete = async (lessonId: string | number, score?: number) => {
    if (!course?.id) return;
    try {
      const res = await apiClient.post(`/courses/${course.id}/progress`, {
        lessonId,
        ...(typeof score === 'number' ? { score } : {}),
      });
      const updatedEnrollment = res.data?.data || res.data;
      const nextProgress = Number(updatedEnrollment?.progress ?? updatedEnrollment?.enrollment?.progress);
      setCourseModules(prev => prev.map(m => {
        let changed = false;
        const newItems = m.items.map(i => {
          if (i.id === lessonId && !i.done) {
            changed = true;
            return { ...i, done: true };
          }
          return i;
        });
        if (changed) {
          return { ...m, done: (m.done || 0) + 1, items: newItems };
        }
        return m;
      }));
      if (Number.isFinite(nextProgress)) {
        setCourse((prev: any) => ({ ...prev, progress: Math.min(nextProgress, 100), enrollment: updatedEnrollment }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* ── AI & Discussions ───────────────────────── */
  const fetchDiscussions = useCallback(async () => {
    if (!course?.id) return;
    try {
      const res = await apiClient.get(`/courses/${course.id}/discussions`);
      const data = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      setDiscussions(data);
    } catch (err) {
      console.error(err);
    }
  }, [course?.id]);

  useEffect(() => {
    if (activeTab === 'discussion' && course?.id) {
      fetchDiscussions();
    }
  }, [activeTab, course?.id, fetchDiscussions]);

  useEffect(() => {
    setVideoError(false);
  }, [currentLessonId]);

  useEffect(() => {
    if (activeTab !== 'ai') return;
    const scrollToAiBottom = () => {
      aiEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    };
    requestAnimationFrame(scrollToAiBottom);
    const timer = window.setTimeout(scrollToAiBottom, 80);
    return () => window.clearTimeout(timer);
  }, [aiMessages, aiLoading, activeTab]);

  useEffect(() => {
    document.body.classList.toggle('focus-mode-active', view === 'player');
    return () => {
      document.body.classList.remove('focus-mode-active');
    };
  }, [view]);

  useEffect(() => {
    if (!course?.id || !currentLessonId) {
      setLessonNotes([]);
      return;
    }
    const key = `course_notes:${course.id}:${currentLessonId}`;
    try {
      setLessonNotes(JSON.parse(localStorage.getItem(key) || '[]'));
    } catch {
      setLessonNotes([]);
    }
  }, [course?.id, currentLessonId]);

  const getActiveLessonTitle = () => {
    const active = courseModules.flatMap((m) => m.items).find((item) => item.id === currentLessonId);
    return (isRu && active?.titleRu) || active?.title || course?.title || (isRu ? 'урок' : 'dars');
  };

  const formatDateTime = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const uzMonths = [
      'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
      'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
    ];
    const ruMonths = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
    ];
    const months = isRu ? ruMonths : uzMonths;
    const day = String(date.getDate()).padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    return `${day} ${month} ${year}, ${hour}:${minute}`;
  };

  const getDiscussionAuthor = (item: any) => {
    const fullName = item.user?.fullName || [item.user?.firstName, item.user?.lastName].filter(Boolean).join(' ');
    return fullName || user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';
  };

  const getInitials = (name: string) => name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';

  const buildAiPrompt = (text: string) => {
    const lessonTitle = getActiveLessonTitle();
    if (isRu) {
      return [
        `Тема урока: ${lessonTitle}`,
        `Запрос пользователя: ${text}`,
        'Отвечай на русском языке. Дай точный и практичный ответ только по этой теме урока. Если пользователь просит мини-тест, составь 5 вопросов с вариантами ответов и ключом правильных ответов. Если просит краткое резюме, оформи ответ короткими пунктами. Если просит объяснить урок, объясни простым языком с понятными примерами.',
      ].join('\n');
    }

    return [
      `Mavzu: ${lessonTitle}`,
      `Foydalanuvchi so'rovi: ${text}`,
      "Faqat shu mavzuga oid, aniq va amaliy javob ber. Agar mini-test so'ralsa, 5 ta savol va javob kalitini tuz. Agar xulosa so'ralsa, qisqa punktlar bilan yoz. Agar tushuntirish so'ralsa, sodda izoh va misollar bilan tushuntir.",
    ].join('\n');
  };

  const handleSaveNote = () => {
    const text = noteInput.trim();
    if (!text || !course?.id || !currentLessonId) return;
    const next = [{ id: nextId(), text, createdAt: new Date().toISOString() }, ...lessonNotes];
    setLessonNotes(next);
    setNoteInput('');
    localStorage.setItem(`course_notes:${course.id}:${currentLessonId}`, JSON.stringify(next));
  };

  const handleDeleteNote = (id: string) => {
    if (!course?.id || !currentLessonId) return;
    const next = lessonNotes.filter((note) => note.id !== id);
    setLessonNotes(next);
    localStorage.setItem(`course_notes:${course.id}:${currentLessonId}`, JSON.stringify(next));
  };

  const handleAiSend = async (promptOverride?: string) => {
    const text = (promptOverride ?? aiInput).trim();
    if (!text || aiLoading) return;
    setAiInput('');
    setAiMessages(p => [...p, { role: 'user', text }]);
    setAiLoading(true);
    try {
      const res = await apiClient.post('/ai/chat', { prompt: buildAiPrompt(text) });
      const answer = res.data?.response || res.data?.data?.response || (isRu ? 'Произошла ошибка.' : 'Xatolik yuz berdi.');
      setAiMessages(p => [...p, { role: 'ai', text: answer }]);
    } catch (err) {
      setAiMessages(p => [...p, { role: 'ai', text: isRu ? 'Извините, произошла ошибка.' : 'Kechirasiz, xatolik yuz berdi.' }]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleDiscussionSubmit = async () => {
    const text = discussionInput.trim();
    if (!text || !course?.id) return;
    setDiscussionLoading(true);
    try {
      await apiClient.post(`/courses/${course.id}/discussions`, {
        message: text,
        imageUrl: discussionImageUrl || undefined
      });
      setDiscussionInput('');
      setDiscussionImageUrl('');
      await fetchDiscussions();
    } catch (err) {
      console.error(err);
    } finally {
      setDiscussionLoading(false);
    }
  };
  const handleDiscussionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('visibility', 'authenticated');
    try {
      const res = await apiClient.post('/uploads/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 0, // Disable timeout for uploads
      });
      const url = res.data?.url || res.data?.data?.url;
      if (url) setDiscussionImageUrl(url);
    } catch (err) {
      console.error('Upload failed', err);
      toast.error('Rasm yuklashda xatolik yuz berdi');
    }
  };

  const handleMaterialUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !course) return;
    
    setMaterialUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('visibility', 'public');
    
    try {
      const res = await apiClient.post('/uploads/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 0, // Disable timeout for uploads
      });
      const url = res.data?.url || res.data?.data?.url;
      if (url) {
        const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
        
        const newMaterial = {
          name: file.name,
          url,
          size: sizeMb,
          type: ext,
          lessonTitle: getActiveLessonTitle(),
          uploadedAt: new Date().toISOString(),
        };
        
        const updatedCourse = {
          ...course,
          materials: [...(course.materials || []), newMaterial]
        };
        
        setCourse(updatedCourse);
        
        // Auto save to backend
        await apiClient.patch(`/courses/${course.id}`, { materials: updatedCourse.materials });
      }
    } catch (err) {
      console.error('Error uploading material:', err);
    } finally {
      setMaterialUploading(false);
    }
  };

  const handleDeleteMaterial = async (index: number) => {
    if (!course) return;
    const updatedMaterials = [...(course.materials || [])];
    updatedMaterials.splice(index, 1);
    const updatedCourse = { ...course, materials: updatedMaterials };
    setCourse(updatedCourse);
    try {
      await apiClient.patch(`/courses/${course.id}`, { materials: updatedMaterials });
    } catch (err) {
      console.error(err);
      toast.error('Material yuklashda xatolik yuz berdi');
    }
  };
  /* ── Render ─────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="skeleton" style={{ width: 64, height: 64, borderRadius: '50%' }} />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <BookOpen size={48} color="var(--text-muted)" style={{ marginBottom: 16, opacity: 0.5 }} />
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
          {isRu ? 'Курс не найден' : 'Kurs topilmadi'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
          {isRu ? 'Возможно, курс был удален или ссылка недействительна.' : 'Ehtimol, kurs o\'chirilgan yoki havola noto\'g\'ri.'}
        </p>
        <button className="btn btn-primary" onClick={() => window.history.back()}>
          {isRu ? 'Назад' : 'Orqaga qaytish'}
        </button>
      </div>
    );
  }

  const title = course?.title || '';
  const allLessons = courseModules.flatMap(m => m.items);
  const currentLesson = currentLessonId 
    ? allLessons.find(i => i.id === currentLessonId) 
    : allLessons.find(i => (i as any).current) || allLessons[0];
  const isLessonUnlocked = (lessonId: string | number) => {
    const targetIndex = allLessons.findIndex(item => item.id === lessonId);
    if (targetIndex <= 0) return true;
    const target = allLessons[targetIndex];
    if (target?.type === 'assignment') return true;
    return allLessons
      .slice(0, targetIndex)
      .filter(item => item.type !== 'assignment')
      .every(item => item.done);
  };
  const selectLesson = (lesson: LessonItem) => {
    if (!isLessonUnlocked(lesson.id)) return;
    setCurrentLessonId(lesson.id);
  };
  const currentMediaUrl = normalizeMediaUrl(currentLesson?.videoUrl);
  const youtubeEmbedUrl = getYoutubeEmbedUrl(currentMediaUrl);
  const playerText = isRu
    ? {
        back: 'К курсу',
        lessonFallback: 'Урок',
        hideLessons: 'Скрыть уроки',
        showLessons: 'Уроки',
        learningPlan: 'Учебный план',
        progress: 'Прогресс',
        videoMissing: 'Видео пока не загружено',
        questionsMissing: 'К этому уроку пока не добавлены вопросы.',
        assignmentIntro: 'Это практическое задание. Откройте файл и выполните задачу.',
        openAssignment: 'Открыть задание',
        assignmentMissing: 'Файл задания не прикреплен',
        ai: 'AI Copilot',
        notes: 'Заметки',
        materials: 'Материалы',
        discussion: 'Обсуждение',
        askAi: 'Спросите AI Copilot...',
        aiPrompts: ['Объясни урок', 'Сделай краткое резюме', 'Подготовь мини-тест'],
        aiSummary: 'AI резюме',
        bookmark: 'Закладка',
        uploadFile: 'Загрузить файл',
        noMaterials: 'Материалы пока не добавлены',
        download: 'Скачать',
        notesReady: 'Умные заметки готовы. Добавляйте важные мысли по ходу урока.',
        addNote: 'Добавить заметку...',
        save: 'Сохранить',
        discussionPlaceholder: 'Оставьте вопрос или комментарий...',
        photo: 'Фото',
        send: 'Отправить',
      }
    : {
        back: 'Kursga qaytish',
        lessonFallback: 'Dars',
        hideLessons: 'Darslarni yashirish',
        showLessons: 'Darslar',
        learningPlan: 'O‘quv rejasi',
        progress: 'Jarayon',
        videoMissing: 'Video hozircha yuklanmagan',
        questionsMissing: 'Ushbu dars uchun savollar biriktirilmagan.',
        assignmentIntro: 'Bu amaliy topshiriq. Faylni oching va vazifani bajaring.',
        openAssignment: 'Topshiriqni ochish',
        assignmentMissing: 'Topshiriq fayli biriktirilmagan',
        ai: 'AI Copilot',
        notes: 'Eslatmalar',
        materials: 'Materiallar',
        discussion: 'Muhokama',
        askAi: "AI Copilot'dan so'rang...",
        aiPrompts: ['Darsni tushuntir', 'Qisqa xulosa qil', 'Mini-test tuz'],
        aiSummary: 'AI xulosa',
        bookmark: 'Xatcho‘p',
        uploadFile: 'Yangi material yuklash',
        noMaterials: 'Hozircha materiallar yuklanmagan',
        download: 'Yuklab olish',
        notesReady: 'Aqlli eslatmalar tayyor. Dars davomida muhim fikrlarni yozib boring.',
        addNote: "Eslatma qo'shish...",
        save: 'Saqlash',
        discussionPlaceholder: 'Fikringizni yoki savolingizni qoldiring...',
        photo: 'Rasm',
        send: 'Yuborish',
      };

  if (view === 'overview') {
    return (
      <CourseOverview
        course={course}
        title={title}
        isRu={isRu}
        onStart={() => setView('player')}
        onEnroll={handleEnroll}
        isEnrolled={!!course?.enrollment}
        courseModules={courseModules}
        editMode={editMode}
        canEdit={!!canEdit}
        saving={saving}
        saveError={saveError}
        addingModule={addingModule}
        newModuleTitle={newModuleTitle}
        onToggleEdit={() => { setEditMode(e => !e); setSaveError(null); }}
        onSave={handleSave}
        onAddModule={addModule}
        onDeleteModule={deleteModule}
        onUpdateModuleTitle={updateModuleTitle}
        onAddLesson={addLesson}
        onDeleteLesson={deleteLesson}
        onUpdateLesson={updateLesson}
        handleLessonUpload={handleLessonUpload}
        setAddingModule={setAddingModule}
        setNewModuleTitle={setNewModuleTitle}
        uploadingLessons={uploadingLessons}
      />
    );
  }

  return (
    <div className="course-player-layout learning-window">
      <div className="ambient-bg" />
      
      {/* ── VIDEO / CONTENT AREA ── */}
      <div className={clsx('player-main learning-main', !sidebarOpen && 'player-main-full learning-main-full')}>
        
        {/* Main Workspace Card */}
        <div className="learning-shell glass-panel-2">
          
          {/* Header over video */}
          <div className="learning-header">
             <div className="learning-title-row">
               <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setView('overview')} title={playerText.back}>
                 <X size={16} />
               </button>
               <div className="learning-title-block">
                 <span className="learning-kicker">{title}</span>
                 <span className="learning-title">{currentLesson?.title || playerText.lessonFallback}</span>
               </div>
               <span className="badge badge-blue learning-type-badge">{currentLesson?.type}</span>
             </div>
             <div className="learning-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
                  {sidebarOpen ? <ChevronRight size={14} /> : <BookOpen size={14} />} 
                  {sidebarOpen ? playerText.hideLessons : playerText.showLessons}
                </button>
             </div>
          </div>

          {/* Content Area */}
          <div className={clsx('learning-content', currentLesson?.type === 'quiz' && 'learning-content-quiz')}>
            
            {currentLesson?.type === 'video' ? (
              <div className="video-container" style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {currentMediaUrl && !videoError ? (
                  <>
                    {youtubeEmbedUrl ? (
                      <iframe
                        key={youtubeEmbedUrl}
                        src={`${youtubeEmbedUrl}?autoplay=1&rel=0&modestbranding=1`}
                        title={currentLesson?.title || 'Video dars'}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        style={{ width: '100%', height: '100%', border: 0, zIndex: 2, background: '#000' }}
                      />
                    ) : (
                      <CourseVideoPlayer
                        src={currentMediaUrl}
                        title={currentLesson?.title || 'Video dars'}
                        seekEnabled={!!currentLesson?.done}
                        onError={() => setVideoError(true)}
                        onEnded={() => currentLesson && handleLessonComplete(currentLesson.id)}
                      />
                    )}
                    {/* Blurred background for cinematic effect */}
                    <div style={{ position: 'absolute', inset: -50, background: 'radial-gradient(circle at center, rgba(59,130,246,0.18), rgba(139,92,246,0.10), transparent 65%)', filter: 'blur(80px)', opacity: 0.8, zIndex: 1, pointerEvents: 'none' }} />
                    
                    {/* Cinematic Overlays */}
                    <div className="video-overlay-cinematic" />
                    {youtubeEmbedUrl && (
                      <div className="cinematic-controls">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                           <div style={{ display: 'flex', gap: 12 }}>
                             <button className="btn btn-primary btn-sm" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
                               <Sparkles size={14} /> {playerText.aiSummary}
                             </button>
                             <button className="btn btn-secondary btn-sm" style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                               <Bookmark size={14} /> {playerText.bookmark}
                             </button>
                           </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="video-screen" style={{ zIndex: 2 }}>
                    <div style={{ color: 'rgba(255,255,255,0.15)', textAlign: 'center' }}>
                      <Play size={64} />
                      <div style={{ marginTop: 12, fontSize: 16 }}>
                        {currentLesson?.title || 'Dars'} — {currentLesson?.dur || ''}
                      </div>
                      <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                        {playerText.videoMissing}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : currentLesson?.type === 'quiz' ? (
              <div className="learning-quiz-shell">
                {currentLesson.quizData ? (
                  <QuizPlayer 
                    key={currentLesson.id}
                    quizData={{
                      ...currentLesson.quizData,
                      passingScore: Math.max(75, currentLesson.quizData.passingScore || 0),
                    }}
                    isRu={isRu}
                    onComplete={(score, passed) => {
                      if (passed && score >= 75) handleLessonComplete(currentLesson.id, score);
                    }} 
                  />
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <div style={{ textAlign: 'center' }}>
                       <FileText size={48} color="#3b82f6" style={{ marginBottom: 16, display: 'inline-block' }} />
                       <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{currentLesson?.title}</h2>
                       <p style={{ color: 'var(--text-secondary)' }}>{playerText.questionsMissing}</p>
                     </div>
                  </div>
                )}
              </div>
            ) : (
              <CourseAssignmentViewer
                title={currentLesson?.title}
                url={currentLesson?.videoUrl}
                isRu={isRu}
                onComplete={() => currentLesson && handleLessonComplete(currentLesson.id)}
              />
            )}
            
            {/* Smart Workspace Tabs (AI, Notes, Materials) */}
            {currentLesson?.type !== 'quiz' && (
            <div className="learning-panel">
              <div className="learning-tabbar">
                {[
                  { id: 'ai', icon: Sparkles, label: playerText.ai },
                  { id: 'notes', icon: Bookmark, label: playerText.notes },
                  { id: 'materials', icon: FileText, label: playerText.materials },
                  { id: 'discussion', icon: MessageSquare, label: playerText.discussion },
                ].map(tab => (
                  <button
                    key={tab.id}
                    className={clsx('player-tab', activeTab === tab.id && 'active')}
                    style={{ flex: 1 }}
                    onClick={() => setActiveTab(tab.id as any)}
                  >
                    <tab.icon size={14} style={{ color: activeTab === tab.id ? 'var(--blue-400)' : 'var(--text-secondary)' }} /> {tab.label}
                  </button>
                ))}
              </div>
              
              <div className="learning-panel-body">
                {activeTab === 'ai' && (
                  <div className="course-ai-panel">
                    <div className="course-panel-heading">
                      <div>
                        <span>{playerText.ai}</span>
                        <p>{isRu ? 'Ответы привязаны к текущей теме' : `Javoblar "${getActiveLessonTitle()}" mavzusiga bog'lanadi`}</p>
                      </div>
                      <Sparkles size={18} />
                    </div>
                    <div className="course-ai-messages">
                      {aiMessages.map((m, i) => (
                        <div key={i} className={clsx('course-ai-message', m.role === 'user' && 'user')}>
                          {m.role === 'ai' && (
                            <div className="course-ai-avatar">
                              <Sparkles size={12} color="#fff" />
                            </div>
                          )}
                          <div className="course-ai-bubble">
                            {m.text}
                          </div>
                        </div>
                      ))}
                      {aiLoading && (
                        <div className="course-ai-message">
                           <div className="course-ai-avatar">
                              <Sparkles size={12} color="#fff" />
                           </div>
                           <div className="course-ai-bubble">
                             <div className="ai-typing-indicator">
                               <div className="ai-dot" />
                               <div className="ai-dot" />
                               <div className="ai-dot" />
                             </div>
                           </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="course-ai-composer">
                      <div className="course-ai-prompts hide-scrollbar">
                        {playerText.aiPrompts.map(prompt => (
                           <button key={prompt} className="course-ai-chip" onClick={() => handleAiSend(prompt)}>
                             {prompt}
                           </button>
                        ))}
                      </div>
                      <div className="course-ai-input-row">
                        <input
                          className="course-ai-input"
                          placeholder={playerText.askAi}
                          value={aiInput}
                          onChange={e => setAiInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAiSend()}
                        />
                        <button className="btn btn-primary btn-sm btn-icon" onClick={() => handleAiSend()} disabled={aiLoading} style={{ borderRadius: 8 }}>
                          <Send size={14} />
                        </button>
                      </div>
                    </div>
                    <div ref={aiEndRef} className="course-ai-scroll-anchor" />
                  </div>
                )}
                
                {activeTab === 'materials' && (
                  <div className="course-material-panel">
                    {canEdit && (
                      <label className="course-material-upload">
                        <span className="course-material-upload-icon">
                          {materialUploading ? <Loader size={20} className="spin" /> : <Plus size={20} />}
                        </span>
                        <span>
                          <strong>{playerText.uploadFile}</strong>
                          <small>PDF, DOCX, PPTX, ZIP va boshqa materiallar</small>
                        </span>
                        <input type="file" style={{ display: 'none' }} onChange={handleMaterialUpload} disabled={materialUploading} />
                      </label>
                    )}
                    
                    {(!course?.materials || course.materials.length === 0) ? (
                      <div className="course-empty-panel">
                        <FileText size={34} />
                        <span>{playerText.noMaterials}</span>
                      </div>
                    ) : (
                      (course?.materials || []).map((m: any, i: number) => (
                        <div key={i} className="course-material-card">
                          <div className="course-material-icon">
                            <FileText size={18} color="#3b82f6" />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{m.name}</div>
                            {m.lessonTitle && <small style={{ display: 'block', marginTop: 3, color: 'var(--blue-400)', fontSize: 11 }}>{m.lessonTitle}</small>}
                            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{m.type} • {m.size}</div>
                          </div>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => window.open(normalizeMediaUrl(m.url), '_blank')} title={playerText.download}>
                            <Download size={15} />
                          </button>
                          {canEdit && (
                            <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--red-400)' }} onClick={() => handleDeleteMaterial(i)}>
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
                
                {activeTab === 'notes' && (
                  <div className="course-notes-panel">
                    <div className="course-panel-heading">
                      <div>
                        <span>{playerText.notes}</span>
                        <p>{getActiveLessonTitle()}</p>
                      </div>
                      <Bookmark size={18} />
                    </div>
                    <div className="course-note-composer">
                      <textarea
                        className="course-note-input"
                        placeholder={playerText.addNote}
                        value={noteInput}
                        onChange={(event) => setNoteInput(event.target.value)}
                        onKeyDown={(event) => {
                          if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') handleSaveNote();
                        }}
                      />
                      <button className="btn btn-primary btn-sm" onClick={handleSaveNote} disabled={!noteInput.trim()}>
                        <Bookmark size={14} /> {playerText.save}
                      </button>
                    </div>
                    {lessonNotes.length === 0 ? (
                      <div className="course-empty-panel">
                        <Bookmark size={34} />
                        <span>{playerText.notesReady}</span>
                      </div>
                    ) : (
                      <div className="course-note-grid">
                        {lessonNotes.map((note) => (
                          <article key={note.id} className="course-note-card">
                            <button type="button" className="course-note-delete" onClick={() => handleDeleteNote(note.id)}>
                              <X size={13} />
                            </button>
                            <p>{note.text}</p>
                            <time>{formatDateTime(note.createdAt)}</time>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'discussion' && (
                  <div className="course-discussion-panel">
                    <div className="course-panel-heading">
                      <div>
                        <span>{playerText.discussion}</span>
                        <p>{isRu ? 'Вопросы и комментарии по текущему уроку' : `${getActiveLessonTitle()} bo'yicha fikr va savollar`}</p>
                      </div>
                      <MessageSquare size={18} />
                    </div>
                    <div className="course-discussion-composer">
                      <textarea
                        className="course-discussion-input"
                        placeholder={playerText.discussionPlaceholder}
                        value={discussionInput}
                        onChange={e => setDiscussionInput(e.target.value)}
                        rows={2}
                      />
                      {discussionImageUrl && (
                        <div className="course-discussion-preview">
                          <img src={normalizeMediaUrl(discussionImageUrl)} alt="Upload" />
                          <button 
                            className="btn btn-ghost btn-sm btn-icon" 
                            onClick={() => setDiscussionImageUrl('')}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      )}
                      <div className="course-discussion-actions">
                        <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <FileText size={15} /> {playerText.photo}
                          <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleDiscussionImageUpload} />
                        </label>
                        <button className="btn btn-primary btn-sm" onClick={handleDiscussionSubmit} disabled={discussionLoading || !discussionInput.trim()}>
                          {discussionLoading ? <Loader size={14} className="spin" /> : <Send size={14} />} {playerText.send}
                        </button>
                      </div>
                    </div>

                    {discussions.length === 0 && (
                      <div className="course-empty-panel">
                        <MessageSquare size={34} />
                        <span>{isRu ? 'Пока нет комментариев' : 'Hozircha izohlar yo‘q'}</span>
                      </div>
                    )}

                    {discussions.map((c, i) => {
                      const author = getDiscussionAuthor(c);
                      return (
                      <div key={i} className="course-discussion-card">
                        <div className="course-discussion-avatar">
                          {getInitials(author)}
                        </div>
                        <div className="course-discussion-content">
                          <div className="course-discussion-meta">
                            <strong>{author}</strong>
                            <time>{formatDateTime(c.createdAt)}</time>
                          </div>
                          <div className="course-discussion-text">
                            {c.message}
                          </div>
                          {c.imageUrl && (
                            <div className="course-discussion-image">
                              <img src={normalizeMediaUrl(c.imageUrl)} alt="attached" />
                            </div>
                          )}
                        </div>
                      </div>
                    );})}
                  </div>
                )}
              </div>
            </div>
            )}
            
          </div>
        </div>
      </div>

      {/* ── INTERACTIVE TIMELINE SIDEBAR ── */}
      {sidebarOpen && (
        <aside className="lesson-sidebar learning-sidebar glass-panel-2">
          <div className="learning-sidebar-head">
            <div className="learning-sidebar-title">
              {playerText.learningPlan}
            </div>
            <div className="learning-progress-row">
              <span>{playerText.progress}</span>
              <span style={{ color: 'var(--blue-400)', fontWeight: 700 }}>{course?.progress || 0}%</span>
            </div>
            <div className="progress-bar" style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.05)' }}>
              <div className="progress-fill" style={{ width: `${course?.progress || 0}%`, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', boxShadow: '0 0 10px rgba(139,92,246,0.5)' }} />
            </div>
          </div>
          
          <div className="lesson-sidebar-body learning-sidebar-body">
            {courseModules.map((mod, modIdx) => (
              <div key={mod.id} style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 24, height: 1, background: 'var(--border-2)' }} />
                  {isRu ? mod.titleRu || mod.title : mod.title}
                </div>
                
                <div style={{ position: 'relative' }}>
                  {mod.items.map((item, i) => {
                    const isCurrent = currentLesson?.id === item.id;
                    const isLast = i === mod.items.length - 1 && modIdx === courseModules.length - 1;
                    const unlocked = isLessonUnlocked(item.id);
                    return (
                      <div 
                        key={item.id} 
                        title={!unlocked ? 'Oldingi darsni tugating' : undefined}
                        style={{
                          display: 'flex',
                          gap: 16,
                          padding: '12px 0',
                          position: 'relative',
                          cursor: unlocked ? 'pointer' : 'not-allowed',
                          opacity: item.done || isCurrent ? 1 : unlocked ? 0.7 : 0.42,
                        }}
                        onClick={() => selectLesson(item)}
                      >
                        {!isLast && <div className={clsx('timeline-connector', item.done && 'active')} />}
                        
                        <div style={{ 
                          width: 34, height: 34, borderRadius: '50%', flexShrink: 0, 
                          background: isCurrent ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : item.done ? 'var(--surface-2)' : 'var(--bg-0)',
                          border: `2px solid ${isCurrent ? 'transparent' : item.done ? 'var(--blue-500)' : 'var(--border-2)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: isCurrent ? '#fff' : item.done ? 'var(--blue-400)' : 'var(--text-muted)',
                          position: 'relative', zIndex: 1,
                          boxShadow: isCurrent ? '0 0 15px rgba(139,92,246,0.4)' : 'none'
                        }}>
                          {!unlocked ? <Lock size={14} /> : item.done && !isCurrent ? <CheckCircle size={16} /> : item.type === 'quiz' ? <FileText size={14} /> : item.type === 'assignment' ? <Award size={14} /> : <Play size={14} />}
                        </div>
                        
                        <div style={{ flex: 1, paddingTop: 6 }}>
                          <div style={{ fontSize: 13, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                            {!unlocked ? 'Oldingi darsni tugating' : item.dur}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}

/* ── Course Overview ────────────────────────────── */
function CourseOverview({
  course, title, isRu, onStart, onEnroll, isEnrolled,
  courseModules, editMode, canEdit, saving, saveError,
  addingModule, newModuleTitle,
  onToggleEdit, onSave, onAddModule, onDeleteModule, onUpdateModuleTitle,
  onAddLesson, onDeleteLesson, onUpdateLesson, handleLessonUpload,
  setAddingModule, setNewModuleTitle,
  uploadingLessons = {},
}: any) {
  const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'reviews'>('overview');
  const [editingModId, setEditingModId] = useState<string | number | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<{ title: string; reason: string } | null>(null);
  const [courseDiscussions, setCourseDiscussions] = useState<any[]>([]);
  const [discussionLoading, setDiscussionLoading] = useState(false);
  const [discussionError, setDiscussionError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    aiApi.getRecommendations()
      .then(res => {
        const first = res?.recommendations?.[0];
        if (mounted && first) setAiSuggestion({ title: first.title, reason: first.reason });
      })
      .catch(() => undefined);
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (activeTab !== 'reviews' || !course?.id) return;
    let mounted = true;
    setDiscussionLoading(true);
    setDiscussionError(null);
    apiClient.get(`/courses/${course.id}/discussions`)
      .then((res) => {
        if (!mounted) return;
        const data = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
        setCourseDiscussions(data);
      })
      .catch(() => {
        if (mounted) setDiscussionError(isRu ? 'Muhokamalarni yuklab bo‘lmadi' : 'Muhokamalarni yuklab bo‘lmadi');
      })
      .finally(() => {
        if (mounted) setDiscussionLoading(false);
      });
    return () => { mounted = false; };
  }, [activeTab, course?.id, isRu]);
  const [activeQuizBuilder, setActiveQuizBuilder] = useState<{ modId: string | number; lessonId: string | number; item: LessonItem } | null>(null);

  const desc = course.description || '';
  const level = course.level || '';
  const cat = course.cat || '';
  const ratingVisible = hasPositiveNumber(course.rating);
  const courseMaterials = Array.isArray(course.materials) ? course.materials : [];

  return (
    <div>
      {/* Hero */}
      {/* Hero */}
      <div className="course-hero" style={{ marginBottom: 32, borderRadius: 'var(--radius-2xl)', overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 30px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${course.color || '#3b82f6'}30, #000)`, zIndex: 0 }} />
        <div style={{ position: 'absolute', top: -50, right: -50, width: 300, height: 300, background: `${course.color || '#3b82f6'}`, filter: 'blur(100px)', opacity: 0.2, borderRadius: '50%', zIndex: 0 }} />
        
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', opacity: 0.05, right: 40, pointerEvents: 'none', zIndex: 0 }}>
          <BookOpen size={240} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, padding: '48px 40px', maxWidth: 800 }}>
          <span className="badge badge-blue" style={{ marginBottom: 16, display: 'inline-flex', padding: '6px 12px', fontSize: 13, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', backdropFilter: 'blur(10px)' }}>
            <Sparkles size={12} style={{ marginRight: 6 }} /> {cat} • {level}
          </span>
          
          <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-1px', marginBottom: 16, lineHeight: 1.1, background: 'linear-gradient(180deg, #fff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {title}
          </h1>
          
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', marginBottom: 28, lineHeight: 1.6, maxWidth: 600 }}>{desc}</p>
          
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 28, fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
            {ratingVisible && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Star size={14} color="#f59e0b" fill="#f59e0b" /> <strong style={{ color: '#fff' }}>{Number(course.rating).toFixed(1)}</strong> {isRu ? 'Рейтинг' : 'Reyting'}</span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Users size={14} color="var(--blue-400)" /> <strong style={{ color: '#fff' }}>{course.enrolled || 0}</strong> {isRu ? 'учеников' : "o'quvchi"}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14} color="var(--violet-400)" /> <strong style={{ color: '#fff' }}>{course.duration}</strong></span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><BookOpen size={14} color="var(--green-400)" /> <strong style={{ color: '#fff' }}>{course.lessons}</strong> {isRu ? 'уроков' : 'dars'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: 16, width: 'fit-content', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
            <div className="avatar" style={{ width: 36, height: 36, fontSize: 13, background: `linear-gradient(135deg, ${course.color || '#3b82f6'}, #1e3a8a)`, color: '#fff', fontWeight: 700 }}>
              {course.instructor ? course.instructor.split(' ').map((n: string) => n[0]).join('') : 'T'}
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{isRu ? 'Инструктор' : 'Instruktor'}</div>
              <div style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>{course.instructor}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {isEnrolled ? (
              <button className="btn btn-primary" onClick={onStart} style={{ padding: '0 24px', height: 44, fontSize: 15, boxShadow: `0 10px 25px ${course.color || '#3b82f6'}40` }}>
                <Play size={16} /> {isRu ? 'Продолжить обучение' : 'Ta\'limni davom etish'}
              </button>
            ) : (
              <button className="btn btn-primary" onClick={onEnroll} style={{ padding: '0 24px', height: 44, fontSize: 15, boxShadow: `0 10px 25px ${course.color || '#3b82f6'}40` }}>
                <Play size={16} /> {isRu ? 'Начать курс' : 'Kursni boshlash'}
              </button>
            )}
            <button className="btn btn-secondary" style={{ height: 44, padding: '0 20px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}>
              <Bookmark size={15} /> {isRu ? 'Сохранить' : 'Saqlash'}
            </button>
            {canEdit && (
              <button
                className={`btn ${editMode ? 'btn-primary' : 'btn-secondary'}`}
                style={{ height: 44, padding: '0 20px', ...(editMode ? { background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', border: 'none' } : { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }) }}
                onClick={onToggleEdit}
              >
                <Edit3 size={15} /> {editMode ? (isRu ? 'Выйти из ред.' : 'Tahrirlashni tugatish') : (isRu ? 'Редактировать' : 'Tahrirlash')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: 14, padding: 4, width: 'fit-content' }}>
        {[
          { id: 'overview', label: isRu ? 'Общий' : 'Umumiy' },
          { id: 'modules', label: isRu ? 'Уроки' : 'Darslar' },
          { id: 'reviews', label: isRu ? 'Обсуждения' : 'Muhokamalar' },
        ].map(tab => (
          <button key={tab.id} className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`} style={{ borderRadius: 10 }} onClick={() => setActiveTab(tab.id as any)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Edit mode save bar */}
      {editMode && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
          background: 'var(--ai-promo-bg)',
          border: '1px solid var(--ai-promo-border)', borderRadius: 14, marginBottom: 20,
        }}>
          <Edit3 size={16} color="#8b5cf6" />
          <span style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)' }}>
            {isRu ? 'Режим редактирования активен. Добавьте модули и уроки, затем сохраните.' : 'Tahrirlash rejimi faol. Modul va darslarni qo\'shib, saqlang.'}
          </span>
          {saveError && <span style={{ fontSize: 12, color: 'var(--red-400)' }}>{saveError}</span>}
          <button className="btn btn-sm btn-secondary" onClick={onToggleEdit} disabled={saving}>
            <X size={13} /> {isRu ? 'Отмена' : 'Bekor'}
          </button>
          <button className="btn btn-sm btn-primary" onClick={onSave} disabled={saving} style={{ background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', border: 'none' }}>
            {saving ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
            {isRu ? 'Сохранить' : 'Saqlash'}
          </button>
        </div>
      )}

      <div className="grid grid-12">
        <div>
          {activeTab === 'overview' && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>{isRu ? 'О курсе' : 'Kurs haqida'}</div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{desc}</p>
              <div className="grid grid-2" style={{ marginTop: 16, gap: 12 }}>
                {[
                  { icon: CheckCircle, text: isRu ? `${course.lessons} видеоуроков` : `${course.lessons} ta video dars` },
                  { icon: FileText, text: isRu ? 'Тесты и задания' : 'Testlar va topshiriqlar' },
                  { icon: Award, text: isRu ? 'Выдается сертификат' : 'Sertifikat beriladi' },
                  { icon: Clock, text: course.duration },
                ].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <f.icon size={15} color="var(--green-400)" /> {f.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'modules' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(courseModules as Module[]).map((mod: Module) => (
                <div key={mod.id} className="card" style={editMode ? { border: '1px solid rgba(139,92,246,0.3)' } : {}}>
                  {/* Module header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: editMode && mod.items.length > 0 ? 12 : 0 }}>
                    {editMode && editingModId === mod.id ? (
                      <input
                        className="input"
                        style={{ fontSize: 14, fontWeight: 700, flex: 1, marginRight: 8, padding: '6px 10px' }}
                        value={mod.title}
                        autoFocus
                        onChange={e => onUpdateModuleTitle(mod.id, e.target.value)}
                        onBlur={() => setEditingModId(null)}
                        onKeyDown={e => e.key === 'Enter' && setEditingModId(null)}
                      />
                    ) : (
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{isRu ? mod.titleRu : mod.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{mod.lessons} dars • {mod.done || 0} bajarildi</div>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {!editMode && (
                        <div className="progress-bar" style={{ width: 80, height: 6 }}>
                          <div className="progress-fill" style={{ width: `${mod.lessons > 0 ? ((mod.done || 0) / mod.lessons) * 100 : 0}%` }} />
                        </div>
                      )}
                      {editMode && (
                        <>
                          <button className="btn btn-ghost btn-sm btn-icon" title="Nomini o'zgartirish" onClick={() => setEditingModId(mod.id)}>
                            <Edit3 size={13} color="#8b5cf6" />
                          </button>
                          <button className="btn btn-ghost btn-sm btn-icon" title="Bo'limni o'chirish" onClick={() => onDeleteModule(mod.id)}>
                            <Trash2 size={13} color="var(--red-400)" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Lesson list in edit mode */}
                  {editMode && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: mod.items.length > 0 ? 10 : 0 }}>
                      {mod.items.map((item: LessonItem) => (
                        <div key={item.id} style={{
                          background: 'var(--surface-2)',
                          border: '1px solid var(--border-1)',
                          borderRadius: 12,
                          overflow: 'hidden',
                        }}>
                          {/* Lesson header row */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px' }}>
                            <div style={{ width: 26, height: 26, borderRadius: 6, background: item.type === 'quiz' ? 'rgba(59,130,246,0.15)' : item.type === 'assignment' ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {item.type === 'quiz' ? <FileText size={12} color="#3b82f6" /> : item.type === 'assignment' ? <Award size={12} color="#f59e0b" /> : <Play size={12} color="#22c55e" />}
                            </div>
                            {/* Title input */}
                            <input
                              className="input"
                              style={{ flex: 1, fontSize: 13, padding: '5px 10px', height: 32 }}
                              value={item.title}
                              placeholder="Dars nomi..."
                              onChange={e => onUpdateLesson(mod.id, item.id, 'title', e.target.value)}
                            />
                            {/* Type selector */}
                            <select
                              className="input"
                              style={{ width: 110, fontSize: 12, padding: '5px 8px', height: 32, flexShrink: 0 }}
                              value={item.type}
                              onChange={e => onUpdateLesson(mod.id, item.id, 'type', e.target.value)}
                            >
                              <option value="video">🎬 Video</option>
                              <option value="quiz">📝 Test</option>
                              <option value="assignment">📎 Topshiriq</option>
                            </select>
                            {/* Duration */}
                            <input
                              className="input"
                              style={{ width: 65, fontSize: 12, padding: '5px 8px', height: 32, flexShrink: 0 }}
                              value={item.dur}
                              placeholder="10:00"
                              onChange={e => onUpdateLesson(mod.id, item.id, 'dur', e.target.value)}
                            />
                            {/* Delete */}
                            <button className="btn btn-ghost btn-sm btn-icon" style={{ flexShrink: 0 }} onClick={() => onDeleteLesson(mod.id, item.id)} title="O'chirish">
                              <Trash2 size={13} color="var(--red-400)" />
                            </button>
                          </div>

                          {/* Content row — always visible based on type */}
                          <div style={{ padding: '0 12px 12px 12px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            {item.type === 'video' && (
                              <>
                                <input
                                  className="input"
                                  style={{ flex: 1, minWidth: 180, fontSize: 12, padding: '6px 10px', height: 34 }}
                                  placeholder="YouTube yoki MP4 URL kiriting..."
                                  value={item.videoUrl || ''}
                                  onChange={e => onUpdateLesson(mod.id, item.id, 'videoUrl', e.target.value)}
                                />
                                <label
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    padding: '6px 14px', borderRadius: 8, height: 34,
                                    background: uploadingLessons[`${mod.id}-${item.id}`] ? 'var(--text-muted)' : 'linear-gradient(135deg,#3b82f6,#2563eb)',
                                    color: '#fff', fontSize: 12, fontWeight: 600,
                                    cursor: uploadingLessons[`${mod.id}-${item.id}`] ? 'not-allowed' : 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
                                    border: 'none',
                                    pointerEvents: uploadingLessons[`${mod.id}-${item.id}`] ? 'none' : 'auto',
                                  }}
                                >
                                  {uploadingLessons[`${mod.id}-${item.id}`] ? (
                                    <>
                                      <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> Yuklanmoqda...
                                    </>
                                  ) : (
                                    <>
                                      <Play size={12} /> Video yuklash
                                    </>
                                  )}
                                  <input
                                    type="file"
                                    style={{ display: 'none' }}
                                    accept="video/*,audio/*"
                                    onChange={e => handleLessonUpload(mod.id, item.id, e)}
                                    disabled={uploadingLessons[`${mod.id}-${item.id}`]}
                                  />
                                </label>
                                {item.videoUrl && (
                                  <span style={{ fontSize: 11, color: 'var(--green-400)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <CheckCircle size={11} /> Yuklangan
                                  </span>
                                )}
                              </>
                            )}

                            {item.type === 'assignment' && (
                              <>
                                <label
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    padding: '8px 14px', borderRadius: 8, minHeight: 36,
                                    background: uploadingLessons[`${mod.id}-${item.id}`] ? 'var(--text-muted)' : 'linear-gradient(135deg,#f59e0b,#d97706)',
                                    color: '#fff', fontSize: 12, fontWeight: 600,
                                    cursor: uploadingLessons[`${mod.id}-${item.id}`] ? 'not-allowed' : 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
                                    pointerEvents: uploadingLessons[`${mod.id}-${item.id}`] ? 'none' : 'auto',
                                  }}
                                >
                                  {uploadingLessons[`${mod.id}-${item.id}`] ? (
                                    <>
                                      <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> Yuklanmoqda...
                                    </>
                                  ) : (
                                    <>
                                      <Award size={12} /> Fayl yuklash
                                    </>
                                  )}
                                  <input
                                    type="file"
                                    style={{ display: 'none' }}
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.png,.jpg,.jpeg"
                                    onChange={e => handleLessonUpload(mod.id, item.id, e)}
                                    disabled={uploadingLessons[`${mod.id}-${item.id}`]}
                                  />
                                </label>
                                {item.videoUrl ? (
                                  <span style={{ fontSize: 11, color: 'var(--green-400)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <CheckCircle size={11} /> Serverga yuklangan
                                  </span>
                                ) : (
                                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                    Topshiriq faqat fayl yuklash orqali biriktiriladi
                                  </span>
                                )}
                              </>
                            )}

                            {item.type === 'quiz' && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                                <div style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <FileText size={13} color="#3b82f6" />
                                  {item.quizData?.questions?.length
                                    ? <span style={{ color: 'var(--green-400)', fontWeight: 600 }}>✓ {item.quizData.questions.length} ta savol yaratilgan</span>
                                    : <span style={{ color: 'var(--text-muted)' }}>Hali savol qo'shilmagan</span>
                                  }
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-sm"
                                  style={{
                                    background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
                                    color: '#fff', border: 'none',
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    fontSize: 12, padding: '6px 14px', borderRadius: 8, flexShrink: 0,
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setActiveQuizBuilder({ modId: mod.id, lessonId: item.id, item });
                                  }}
                                >
                                  <Edit3 size={12} />
                                  {item.quizData?.questions?.length ? 'Testni tahrirlash' : 'Test yaratish'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ alignSelf: 'flex-start', marginTop: 2, fontSize: 12, color: '#3b82f6', border: '1px dashed rgba(59,130,246,0.4)', borderRadius: 8, padding: '6px 14px' }}
                        onClick={() => onAddLesson(mod.id)}
                      >
                        <Plus size={12} /> {isRu ? '+ Yangi dars' : '+ Yangi dars'}
                      </button>
                    </div>
                  )}

                  {/* Lesson list in non-edit mode */}
                  {!editMode && mod.items && mod.items.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                      {mod.items.map((item: LessonItem) => (
                        <div key={item.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 14px',
                          background: 'var(--surface-2)',
                          border: '1px solid var(--border-1)',
                          borderRadius: 10,
                        }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: 6,
                            background: item.type === 'quiz' ? 'rgba(59,130,246,0.1)' : item.type === 'assignment' ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                          }}>
                            {item.type === 'quiz' ? <FileText size={12} color="#3b82f6" /> : item.type === 'assignment' ? <Award size={12} color="#f59e0b" /> : <Play size={12} color="#22c55e" />}
                          </div>
                          <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>
                            {item.title}
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {item.type === 'quiz' ? (item.quizData?.questions?.length ? `${item.quizData.questions.length} ta savol` : 'Test') : item.dur}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Add new module */}
              {editMode && (
                <div className="card" style={{ border: '1px dashed var(--ai-msg-border)', background: 'var(--ai-msg-bg)' }}>
                  {addingModule ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        className="input"
                        style={{ flex: 1, fontSize: 14, padding: '8px 12px' }}
                        placeholder={isRu ? "Название нового модуля" : "Yangi bo'lim nomi"}
                        value={newModuleTitle}
                        autoFocus
                        onChange={e => setNewModuleTitle(e.target.value)}
                        onKeyDown={(e: any) => {
                          if (e.key === 'Enter') onAddModule();
                          if (e.key === 'Escape') { setAddingModule(false); setNewModuleTitle(''); }
                        }}
                      />
                      <button className="btn btn-primary btn-sm" onClick={onAddModule}><Plus size={13} /> {isRu ? 'Добавить' : 'Qo\'shish'}</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setAddingModule(false); setNewModuleTitle(''); }}><X size={13} /></button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-ghost"
                      style={{ width: '100%', justifyContent: 'center', color: '#8b5cf6', fontSize: 14 }}
                      onClick={() => setAddingModule(true)}
                    >
                      <Plus size={15} /> {isRu ? '+ Yangi bo\'lim qo\'shish' : '+ Yangi bo\'lim qo\'shish'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {discussionLoading && (
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)' }}>
                  <Loader size={16} className="spin" />
                  {isRu ? 'Загрузка обсуждений...' : 'Muhokamalar yuklanmoqda...'}
                </div>
              )}
              {discussionError && (
                <div className="card" style={{ color: 'var(--red-400)', fontSize: 13 }}>{discussionError}</div>
              )}
              {!discussionLoading && !discussionError && courseDiscussions.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
                  <MessageSquare size={34} color="var(--text-muted)" style={{ marginBottom: 10 }} />
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{isRu ? 'Обсуждений пока нет' : 'Hozircha muhokamalar yo‘q'}</div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {isRu ? 'Комментарии появятся здесь после публикации участниками курса.' : 'Kurs ishtirokchilari fikr yozganda ular shu yerda ko‘rinadi.'}
                  </p>
                </div>
              )}
              {courseDiscussions.map((item, i) => {
                const author = getCourseDiscussionAuthor(item);
                return (
                  <div key={item.id || i} className="card">
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div className="avatar" style={{ width: 38, height: 38, fontSize: 13, background: 'rgba(59,130,246,0.16)', color: 'var(--blue-400)' }}>{getInitialsFromName(author)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: 14 }}>{author}</span>
                          {item.createdAt && <time style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(item.createdAt).toLocaleDateString()}</time>}
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ background: 'var(--ai-promo-bg)', border: '1px solid var(--ai-promo-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={14} color="#fff" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 14 }}>AI Tavsiya</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
              {aiSuggestion
                ? `${aiSuggestion.reason} - "${aiSuggestion.title}" kursini tavsiya qilamiz.`
                : (isRu ? 'AI-рекомендации пока недоступны.' : 'AI tavsiyalar hozircha mavjud emas.')}
            </p>
            <button className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }} disabled={!aiSuggestion}>
              <Sparkles size={13} /> Ko'rish
            </button>
          </div>

          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Materiallar</div>
            {courseMaterials.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: 12, padding: '8px 0' }}>
                <FileText size={14} />
                {isRu ? 'Материалов пока нет' : 'Hozircha materiallar yo‘q'}
              </div>
            ) : (
              courseMaterials.map((m: any, i: number) => (
                <div key={m.id || m.url || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < courseMaterials.length - 1 ? '1px solid var(--border-1)' : 'none' }}>
                  <FileText size={14} color="var(--blue-400)" />
                  <span style={{ flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                  {m.url && (
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => window.open(normalizeMediaUrl(m.url), '_blank')}>
                      <Download size={12} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {activeQuizBuilder && (
        <QuizBuilderModal
          initialData={activeQuizBuilder.item.quizData}
          isRu={isRu}
          onSave={(quizData) => {
            onUpdateLesson(activeQuizBuilder.modId, activeQuizBuilder.lessonId, 'quizData', quizData);
            setActiveQuizBuilder(null);
          }}
          onClose={() => setActiveQuizBuilder(null)}
        />
      )}
    </div>
  );
}
