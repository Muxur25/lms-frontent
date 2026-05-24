import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  Play, 
  ChevronDown, ChevronRight, CheckCircle,
  Clock, BookOpen, Star, Users, Award, Sparkles,
  FileText, Download, MessageSquare, Bookmark,
  X, Send,
  Trash2, Plus, Edit3, Save, Loader,
} from 'lucide-react';
import { apiClient } from '@/api/axios';
import { useAuthStore } from '@/store/auth.store';

/* ── Types ─────────────────────────────────────── */
interface LessonItem {
  id: number;
  title: string;
  titleRu?: string;
  dur: string;
  done?: boolean;
  type: 'video' | 'quiz' | 'assignment';
  videoUrl?: string;
  current?: boolean;
}

interface Module {
  id: number;
  title: string;
  titleRu?: string;
  lessons: number;
  done?: number;
  items: LessonItem[];
}

/* ── Default fallback data ─────────────────────── */
const DEFAULT_COURSE = {
  title: 'React va TypeScript Professional',
  titleRu: 'React и TypeScript Professional',
  instructor: 'Alisher Toshev',
  rating: 4.9, enrolled: 847, duration: '24 soat',
  lessons: 14, level: "O'rta", color: '#3b82f6',
  progress: 68,
  description: 'Zamonaviy React.js va TypeScript texnologiyalarini professional darajada o\'zlashtiring.',
  modules: [] as Module[],
};

const DEFAULT_MODULES: Module[] = [
  {
    id: 1, title: 'Kirish', titleRu: 'Введение', lessons: 4, done: 4,
    items: [
      { id: 1, title: 'Kurs haqida', titleRu: 'О курсе', dur: '5:20', done: true, type: 'video' },
      { id: 2, title: 'Muhit sozlash', titleRu: 'Настройка окружения', dur: '12:45', done: true, type: 'video' },
      { id: 3, title: 'Birinchi loyiha', titleRu: 'Первый проект', dur: '18:30', done: true, type: 'video' },
      { id: 4, title: 'Kirish testi', titleRu: 'Входной тест', dur: '10 savol', done: true, type: 'quiz' },
    ],
  },
  {
    id: 2, title: 'React Asoslari', titleRu: 'Основы React', lessons: 8, done: 5,
    items: [
      { id: 5, title: 'JSX va Komponentlar', titleRu: 'JSX и компоненты', dur: '22:10', done: true, type: 'video' },
      { id: 6, title: 'Props va State', titleRu: 'Props и State', dur: '28:45', done: true, type: 'video' },
      { id: 7, title: 'Hooks: useState', titleRu: 'Hooks: useState', dur: '25:30', done: true, type: 'video' },
      { id: 8, title: 'Hooks: useEffect', titleRu: 'Hooks: useEffect', dur: '30:15', done: true, type: 'video', current: true },
      { id: 9, title: 'Context API', titleRu: 'Context API', dur: '20:00', done: false, type: 'video' },
      { id: 10, title: 'Custom Hooks', titleRu: 'Custom Hooks', dur: '18:40', done: false, type: 'video' },
      { id: 11, title: 'Amaliy mashq', titleRu: 'Практическое упражнение', dur: 'Loyiha', done: false, type: 'assignment' },
      { id: 12, title: 'Bo\'lim testi', titleRu: 'Тест раздела', dur: '15 savol', done: false, type: 'quiz' },
    ],
  },
  {
    id: 3, title: 'TypeScript Chuqurlashish', titleRu: 'Углублённый TypeScript', lessons: 2, done: 0,
    items: [
      { id: 13, title: 'Tiplash asoslari', titleRu: 'Основы типизации', dur: '24:00', done: false, type: 'video' },
      { id: 14, title: 'Interfeys va Tiplar', titleRu: 'Интерфейсы и типы', dur: '20:15', done: false, type: 'video' },
    ],
  },
];

const materials = [
  { name: 'React Hooks Cheatsheet.pdf', size: '2.4 MB', type: 'PDF' },
  { name: 'useEffect Examples.zip', size: '1.1 MB', type: 'ZIP' },
  { name: 'Amaliy mashq topshiriq.docx', size: '0.8 MB', type: 'DOC' },
];

const mockReviews = [
  { name: 'Kamola Y.', text: 'Juda zo\'r kurs, barchasiga tushundim.', avatar: 'KY', color: '#8b5cf6' },
  { name: 'Bobur R.', text: 'Ajoyib ustoz!', avatar: 'BR', color: '#22c55e' },
];

const EDITOR_ROLES = ['super_admin', 'hr_manager', 'trainer'];

/* ── Helpers ─────────────────────────────────── */
function nextId(items: { id: number }[]) {
  return items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
}

/* ── Component ─────────────────────────────────── */
export default function CoursePage() {
  const { i18n } = useTranslation();
  const { courseId } = useParams<{ courseId: string }>();
  const user = useAuthStore(s => s.user);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'overview' | 'player'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'ai' | 'notes' | 'materials' | 'discussion'>('ai');
  const [openModule, setOpenModule] = useState<number | null>(2);
  const [aiInput, setAiInput] = useState('');
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(null);

  // AI & Discussion State
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: 'Salom! Dars haqida savolingiz bo\'lsa so\'rashingiz mumkin.' }
  ]);
  const [aiLoading, setAiLoading] = useState(false);

  const [discussions, setDiscussions] = useState<any[]>([]);
  const [discussionInput, setDiscussionInput] = useState('');
  const [discussionImageUrl, setDiscussionImageUrl] = useState('');
  const [discussionLoading, setDiscussionLoading] = useState(false);

  // Course modules state — driven from backend
  const [courseModules, setCourseModules] = useState<Module[]>([]);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [addingModule, setAddingModule] = useState(false);

  const [materialUploading, setMaterialUploading] = useState(false);

  const isRu = i18n.language === 'ru';
  const canEdit = user && EDITOR_ROLES.includes(user.role as string);

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
            ? fetched.modules
            : DEFAULT_MODULES;
            
          // Map completed lessons if enrolled
          if (fetched.enrollment?.completedLessons) {
            mods = mods.map(m => ({
              ...m,
              done: m.items.filter(i => fetched.enrollment.completedLessons.includes(i.id)).length,
              items: m.items.map(i => ({
                ...i,
                done: fetched.enrollment.completedLessons.includes(i.id)
              }))
            }));
          }
          setCourseModules(mods);
        } else if (isMounted) {
          setCourse(DEFAULT_COURSE);
          setCourseModules(DEFAULT_MODULES);
        }
      } catch (err) {
        console.error('Error fetching course:', err);
        if (isMounted) {
          setCourse(DEFAULT_COURSE);
          setCourseModules(DEFAULT_MODULES);
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
      await apiClient.patch(`/courses/${course.id}`, { modules: courseModules });
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
      id: nextId(courseModules),
      title,
      titleRu: title,
      lessons: 0,
      done: 0,
      items: [],
    };
    setCourseModules(prev => [...prev, newMod]);
    setNewModuleTitle('');
    setAddingModule(false);
    setOpenModule(newMod.id);
  };

  const deleteModule = (modId: number) => {
    setCourseModules(prev => prev.filter(m => m.id !== modId));
  };

  const updateModuleTitle = (modId: number, title: string) => {
    setCourseModules(prev => prev.map(m =>
      m.id === modId ? { ...m, title, titleRu: title } : m
    ));
  };

  const addLesson = (modId: number) => {
    setCourseModules(prev => prev.map(m => {
      if (m.id !== modId) return m;
      const allItems = courseModules.flatMap(mod => mod.items);
      const newItem: LessonItem = {
        id: nextId(allItems),
        title: 'Yangi dars',
        titleRu: 'Новый урок',
        dur: '0:00',
        done: false,
        type: 'video',
      };
      return { ...m, lessons: m.lessons + 1, items: [...m.items, newItem] };
    }));
  };

  const deleteLesson = (modId: number, lessonId: number) => {
    setCourseModules(prev => prev.map(m => {
      if (m.id !== modId) return m;
      const newItems = m.items.filter(i => i.id !== lessonId);
      return { ...m, lessons: newItems.length, items: newItems };
    }));
  };

  const updateLesson = (modId: number, lessonId: number, field: keyof LessonItem, value: string) => {
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

  const handleLessonUpload = async (modId: number, lessonId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('visibility', 'public');
    
    try {
      const res = await apiClient.post('/uploads/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data?.url || res.data?.data?.url;
      if (url) {
        updateLesson(modId, lessonId, 'videoUrl', url);
      }
    } catch (err) {
      console.error('Error uploading lesson file:', err);
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

  const handleLessonComplete = async (lessonId: number) => {
    if (!course?.id) return;
    try {
      await apiClient.post(`/courses/${course.id}/progress`, { lessonId });
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
      setCourse(prev => ({ ...prev, progress: Math.min((prev.progress || 0) + 5, 100) }));
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

  const handleAiSend = async () => {
    const text = aiInput.trim();
    if (!text || aiLoading) return;
    setAiInput('');
    setAiMessages(p => [...p, { role: 'user', text }]);
    setAiLoading(true);
    try {
      const res = await apiClient.post('/ai/chat', { prompt: text });
      const answer = res.data?.response || res.data?.data?.response || 'Xatolik yuz berdi.';
      setAiMessages(p => [...p, { role: 'ai', text: answer }]);
    } catch (err) {
      setAiMessages(p => [...p, { role: 'ai', text: 'Kechirasiz, xatolik yuz berdi.' }]);
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
    formData.append('visibility', 'public');
    try {
      const res = await apiClient.post('/uploads/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data?.url || res.data?.data?.url;
      if (url) setDiscussionImageUrl(url);
    } catch (err) {
      console.error('Upload failed', err);
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
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data?.url || res.data?.data?.url;
      if (url) {
        const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
        
        const newMaterial = {
          name: file.name,
          url,
          size: sizeMb,
          type: ext
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

  const title = isRu ? (course?.titleRu || course?.title) : course?.title;
  const allLessons = courseModules.flatMap(m => m.items);
  const currentLesson = currentLessonId 
    ? allLessons.find(i => i.id === currentLessonId) 
    : allLessons.find(i => (i as any).current) || allLessons[0];

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
      />
    );
  }

  return (
    <div className="course-player-layout">
      {/* ── VIDEO AREA ── */}
      <div className={clsx('player-main', !sidebarOpen && 'player-main-full')}>
        {/* Video */}
        <div className="video-container">
          {currentLesson?.type === 'video' && currentLesson?.videoUrl ? (
            <video 
              src={currentLesson.videoUrl} 
              controls 
              autoPlay
              onEnded={() => handleLessonComplete(currentLesson.id)}
              style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} 
            />
          ) : (
            <div className="video-screen">
              <div style={{ color: 'rgba(255,255,255,0.15)', textAlign: 'center' }}>
                <Play size={64} />
                <div style={{ marginTop: 12, fontSize: 16 }}>
                  {currentLesson?.title || 'Dars'} — {currentLesson?.dur || ''}
                </div>
                <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                  Video yuklanmagan
                </div>
              </div>
            </div>
          )}
          <div className="video-overlay-top" style={{ position: 'absolute', top: 0, right: 0, padding: 16, zIndex: 10 }}>
            <button className="btn btn-ghost btn-sm" style={{ color: '#fff', background: 'rgba(0,0,0,0.5)' }} onClick={() => setView('overview')}>
              <X size={14} /> Kursga qaytish
            </button>
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
                    onKeyDown={e => e.key === 'Enter' && handleAiSend()}
                    style={{ fontSize: 13 }}
                  />
                  <button className="btn btn-primary btn-icon btn-sm" onClick={handleAiSend} disabled={aiLoading}>
                    {aiLoading ? <Loader size={14} className="spin" /> : <Send size={14} />}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'materials' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {editMode && (
                  <div style={{ marginBottom: 12 }}>
                    <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                      {materialUploading ? <Loader size={14} className="spin" /> : <Plus size={14} />} 
                      {isRu ? 'Загрузить файл' : 'Yangi material yuklash'}
                      <input type="file" style={{ display: 'none' }} onChange={handleMaterialUpload} disabled={materialUploading} />
                    </label>
                  </div>
                )}
                
                {(!course?.materials || course.materials.length === 0) && !editMode ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: 13 }}>
                    {isRu ? 'Материалы пока не добавлены' : 'Hozircha materiallar yuklanmagan'}
                  </div>
                ) : (
                  (course?.materials || []).map((m: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 8, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={16} color="#3b82f6" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.type} • {m.size}</div>
                      </div>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => window.open(m.url, '_blank')} title={isRu ? 'Скачать' : 'Yuklab olish'}>
                        <Download size={14} />
                      </button>
                      {editMode && (
                        <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--red-400)' }} onClick={() => handleDeleteMaterial(i)}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))
                )}
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
                <div style={{ background: 'var(--surface-1)', padding: 12, borderRadius: 12, border: '1px solid var(--border-1)' }}>
                  <textarea
                    className="input"
                    placeholder="Fikringizni yoki savolingizni qoldiring..."
                    value={discussionInput}
                    onChange={e => setDiscussionInput(e.target.value)}
                    rows={2}
                    style={{ resize: 'none', marginBottom: 10, fontSize: 13 }}
                  />
                  {discussionImageUrl && (
                    <div style={{ marginBottom: 10, position: 'relative', display: 'inline-block' }}>
                      <img src={discussionImageUrl} alt="Upload" style={{ maxHeight: 100, borderRadius: 8 }} />
                      <button 
                        className="btn btn-ghost btn-sm btn-icon" 
                        style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', color: '#fff' }}
                        onClick={() => setDiscussionImageUrl('')}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
                    <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                      <FileText size={14} /> {isRu ? 'Фото' : 'Rasm'}
                      <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleDiscussionImageUpload} />
                    </label>
                    <button className="btn btn-primary btn-sm" onClick={handleDiscussionSubmit} disabled={discussionLoading || !discussionInput.trim()}>
                      {discussionLoading ? <Loader size={13} className="spin" /> : <Send size={13} />} Yuborish
                    </button>
                  </div>
                </div>

                {discussions.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: 12, background: 'var(--surface-2)', borderRadius: 12 }}>
                    <div className="avatar" style={{ width: 32, height: 32, fontSize: 11, background: 'rgba(59,130,246,0.2)', color: '#3b82f6', minWidth: 32 }}>
                      {c.user?.firstName ? c.user.firstName[0] : 'U'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>{c.user?.firstName} {c.user?.lastName}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {c.message}
                      </div>
                      {c.imageUrl && (
                        <div style={{ marginTop: 8 }}>
                          <img src={c.imageUrl} alt="attached" style={{ maxWidth: 200, borderRadius: 8 }} />
                        </div>
                      )}
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
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{course?.progress || 0}% bajarildi</div>
          </div>
          <div className="progress-bar" style={{ height: 4, margin: '0 16px 12px', borderRadius: 99 }}>
            <div className="progress-fill" style={{ width: `${course?.progress || 0}%` }} />
          </div>
          <div className="lesson-sidebar-body">
            {courseModules.map(mod => (
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
                  {mod.done === mod.lessons && mod.lessons > 0 && <CheckCircle size={14} color="var(--green-400)" />}
                </button>
                {openModule === mod.id && (
                  <div className="lesson-items">
                    {mod.items.map(item => (
                      <div 
                        key={item.id} 
                        className={clsx('lesson-item', item.done && 'lesson-item-done', currentLesson?.id === item.id && 'lesson-item-current')}
                        onClick={() => setCurrentLessonId(item.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="lesson-item-icon">
                          {item.done
                            ? <CheckCircle size={13} color="var(--green-400)" />
                            : item.type === 'quiz' ? <FileText size={13} />
                            : item.type === 'assignment' ? <Award size={13} />
                            : <Play size={13} />
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{isRu ? item.titleRu || item.title : item.title}</div>
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
function CourseOverview({
  course, title, isRu, onStart, onEnroll, isEnrolled,
  courseModules, editMode, canEdit, saving, saveError,
  addingModule, newModuleTitle,
  onToggleEdit, onSave, onAddModule, onDeleteModule, onUpdateModuleTitle,
  onAddLesson, onDeleteLesson, onUpdateLesson, handleLessonUpload,
  setAddingModule, setNewModuleTitle,
}: any) {
  const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'reviews'>('overview');
  const [editingModId, setEditingModId] = useState<number | null>(null);
  const [editingLessonKey, setEditingLessonKey] = useState<string | null>(null); // 'modId-lessonId'

  const desc = isRu ? (course.descriptionRu || course.description) : course.description;
  const level = isRu ? (course.levelRu || course.level) : course.level;
  const cat = isRu ? (course.catRu || course.cat) : course.cat;

  return (
    <div>
      {/* Hero */}
      <div className="course-hero" style={{ marginBottom: 24 }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${course.color || '#3b82f6'}20, rgba(0,0,0,0.7))`, borderRadius: 'inherit' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.07 }}>
          <BookOpen size={200} />
        </div>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 680 }}>
          <span className="badge badge-blue" style={{ marginBottom: 12, display: 'inline-flex' }}>{cat} • {level}</span>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 10, lineHeight: 1.25 }}>{title}</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 20, lineHeight: 1.6 }}>{desc}</p>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Star size={13} color="#f59e0b" fill="#f59e0b" /> {course.rating || 5.0}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Users size={13} /> {course.enrolled || 0} {isRu ? 'учеников' : "o'quvchi"}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={13} /> {course.duration}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><BookOpen size={13} /> {course.lessons} {isRu ? 'уроков' : 'dars'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div className="avatar" style={{ width: 30, height: 30, fontSize: 11, background: `${course.color || '#3b82f6'}40` }}>
              {course.instructor ? course.instructor.split(' ').map((n: string) => n[0]).join('') : 'T'}
            </div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{course.instructor}</span>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span>{isRu ? 'Общий прогресс' : 'Umumiy jarayon'}</span>
              <span style={{ fontWeight: 700, color: course.color || '#3b82f6' }}>{course.progress || 0}%</span>
            </div>
            <div className="progress-bar" style={{ height: 8 }}>
              <div className="progress-fill" style={{ width: `${course.progress || 0}%`, background: course.color || '#3b82f6' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {isEnrolled ? (
              <button className="btn btn-primary" onClick={onStart}><Play size={15} /> {isRu ? 'Продолжить' : 'Davom etish'}</button>
            ) : (
              <button className="btn btn-primary" onClick={onEnroll}><Play size={15} /> {isRu ? 'Начать курс' : 'Kursni boshlash'}</button>
            )}
            <button className="btn btn-secondary"><Bookmark size={14} /> {isRu ? 'Сохранить' : 'Saqlash'}</button>
            <button className="btn btn-secondary"><Award size={14} /> {isRu ? 'Сертификат' : 'Sertifikat'}</button>
            {canEdit && (
              <button
                className={`btn btn-sm ${editMode ? 'btn-primary' : 'btn-secondary'}`}
                style={editMode ? { background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', border: 'none' } : {}}
                onClick={onToggleEdit}
              >
                <Edit3 size={13} /> {editMode ? (isRu ? 'Режим редактирования' : 'Tahrirlash rejimi') : (isRu ? 'Редактировать' : 'Tahrirlash')}
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
          { id: 'reviews', label: isRu ? 'Отзывы' : 'Sharhlar' },
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {mod.items.map((item: LessonItem) => (
                        <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 10,
                            border: '1px solid var(--border-1)'
                          }}>
                            <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 24 }}>
                              {item.type === 'quiz' ? <FileText size={11} color="#3b82f6" />
                                : item.type === 'assignment' ? <Award size={11} color="#f59e0b" />
                                : <Play size={11} color="#3b82f6" />}
                            </div>
                            {editingLessonKey === `${mod.id}-${item.id}` ? (
                              <input
                                className="input"
                                style={{ fontSize: 13, flex: 1, padding: '4px 8px' }}
                                value={item.title}
                                autoFocus
                                onChange={e => onUpdateLesson(mod.id, item.id, 'title', e.target.value)}
                                onBlur={() => setEditingLessonKey(null)}
                                onKeyDown={(e: any) => e.key === 'Enter' && setEditingLessonKey(null)}
                              />
                            ) : (
                              <span style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)' }}>{item.title}</span>
                            )}
                            <select
                              className="input"
                              style={{ width: 100, fontSize: 11, padding: '3px 6px' }}
                              value={item.type}
                              onChange={e => onUpdateLesson(mod.id, item.id, 'type', e.target.value)}
                            >
                              <option value="video">Video</option>
                              <option value="quiz">Test</option>
                              <option value="assignment">Topshiriq</option>
                            </select>
                            <input
                              className="input"
                              style={{ width: 70, fontSize: 11, padding: '3px 6px' }}
                              value={item.dur}
                              placeholder="10:00"
                              onChange={e => onUpdateLesson(mod.id, item.id, 'dur', e.target.value)}
                            />
                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setEditingLessonKey(`${mod.id}-${item.id}`)}>
                              <Edit3 size={11} color="#8b5cf6" />
                            </button>
                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => onDeleteLesson(mod.id, item.id)}>
                              <Trash2 size={11} color="var(--red-400)" />
                            </button>
                          </div>
                          {editingLessonKey === `${mod.id}-${item.id}` && item.type === 'video' && (
                            <div style={{ padding: '8px 10px', background: 'var(--surface-1)', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Video URL:</span>
                              <input
                                className="input"
                                style={{ flex: 1, fontSize: 12, padding: '4px 8px' }}
                                placeholder="Fayl yuklang yoki YouTube/Video URL kiriting..."
                                value={item.videoUrl || ''}
                                onChange={e => onUpdateLesson(mod.id, item.id, 'videoUrl', e.target.value)}
                              />
                              <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', padding: '4px 12px' }}>
                                Yuklash
                                <input 
                                  type="file" 
                                  style={{ display: 'none' }} 
                                  accept="video/*"
                                  onChange={e => handleLessonUpload(mod.id, item.id, e)}
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      ))}

                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ alignSelf: 'flex-start', marginTop: 4, fontSize: 12, color: '#3b82f6', border: '1px dashed rgba(59,130,246,0.4)', borderRadius: 8 }}
                        onClick={() => onAddLesson(mod.id)}
                      >
                        <Plus size={12} /> {isRu ? '+ Новый урок' : '+ Yangi dars'}
                      </button>
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
              {mockReviews.map((c, i) => (
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
          <div className="card" style={{ background: 'var(--ai-promo-bg)', border: '1px solid var(--ai-promo-border)' }}>
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

