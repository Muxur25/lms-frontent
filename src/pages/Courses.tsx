import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Filter, Clock, Users, Star, BookOpen, Play } from 'lucide-react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
import { apiClient } from '@/api/axios';
import { useAuthStore } from '@/store/auth.store';

const CATEGORIES = [
  { id: 'IT', uz: 'IT', ru: 'IT' },
  { id: 'Security', uz: 'Xavfsizlik', ru: 'Безопасность' },
  { id: 'Management', uz: 'Boshqaruv', ru: 'Управление' },
  { id: 'Finance', uz: 'Moliya', ru: 'Финансы' },
  { id: 'Engineering', uz: 'Muhandislik', ru: 'Инженерия' },
  { id: 'HR', uz: 'HR', ru: 'HR' },
];

const LEVELS = [
  { id: 'Beginner', uz: "Boshlang'ich", ru: 'Начальный' },
  { id: 'Intermediate', uz: "O'rta", ru: 'Средний' },
  { id: 'Advanced', uz: 'Yuqori', ru: 'Продвинутый' },
];

const COLOR_PRESETS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Orange', value: '#f59e0b' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Green', value: '#22c55e' },
];

const hasPositiveNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
};

export default function Courses() {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const user = useAuthStore((state) => state.user);
  const canCreate =
    user?.role === 'super_admin' ||
    user?.role === 'admin' ||
    user?.role === 'hr_manager' ||
    user?.role === 'trainer';

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [languageFilter, setLanguageFilter] = useState<'uz' | 'ru'>('uz');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cat: 'IT',
    catRu: 'IT',
    level: "Boshlang'ich",
    levelRu: 'Начальный',
    lessons: 1,
    duration: '',
    color: '#3b82f6',
    instructor: '',
    status: 'draft',
    language: 'uz',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const isRu = i18n.language === 'ru';

  useEffect(() => {
    if (user) {
      const name = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'O\'qituvchi';
      setFormData(prev => ({ ...prev, instructor: name }));
    }
  }, [user]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    apiClient.get('/courses', { params: { language: languageFilter }, signal: controller.signal })
      .then(res => {
        const fetchedData = res.data?.data || res.data || [];
        setCourses(Array.isArray(fetchedData) ? fetchedData : []);
      })
      .catch((err: any) => {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
        setError(t('common.error', 'Xatolik yuz berdi'));
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [languageFilter]);

  const handleCategoryChange = (catId: string) => {
    const found = CATEGORIES.find(c => c.id === catId);
    if (found) {
      setFormData(prev => ({
        ...prev,
        cat: found.uz,
        catRu: found.ru
      }));
    }
  };

  const handleLevelChange = (levelId: string) => {
    const found = LEVELS.find(l => l.id === levelId);
    if (found) {
      setFormData(prev => ({
        ...prev,
        level: found.uz,
        levelRu: found.ru
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = t('courses_page.errTitle');
    if (!formData.description.trim()) newErrors.description = t('courses_page.errDescription');
    if (!formData.instructor.trim()) newErrors.instructor = t('courses_page.errInstructor');
    if (formData.lessons <= 0) newErrors.lessons = t('courses_page.errLessons');
    if (!formData.duration.trim()) newErrors.duration = t('courses_page.errDuration');
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    setSubmitting(true);
    
    try {
      const res = await apiClient.post('/courses', formData);
      const newCreatedCourse = res.data?.data || res.data;
      
      const normalizedCourse = {
        ...newCreatedCourse,
        id: newCreatedCourse._id || newCreatedCourse.id,
        status: newCreatedCourse.status === 'published' ? 'active' : newCreatedCourse.status
      };
      
      setCourses(prev => [normalizedCourse, ...prev]);
      setIsModalOpen(false);
      
      setFormData(prev => ({
        ...prev,
        title: '',
        description: '',
        lessons: 1,
        duration: '',
        status: 'draft',
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : (t('common.error') || 'Xatolik yuz berdi');
      setErrors({ submit: message });
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: 'all', label: t('courses.all') },
    { id: 'active', label: t('courses.active') },
    ...(canCreate ? [{ id: 'draft', label: t('courses.draft') }] : []),
  ];

  const isActiveStatus = (status: string) =>
    status === 'active' || status === 'published';

  const filtered = courses.filter(c => {
    // Extra client-side safety: non-creators never see drafts
    if (!canCreate && c.status === 'draft') return false;

    const title = isRu ? (c.titleRu || c.title || '') : (c.title || '');
    const category = isRu ? (c.catRu || c.cat || '') : (c.cat || '');
    const matchSearch = `${title} ${category}`.toLowerCase().includes(search.toLowerCase());

    let matchFilter = true;
    if (filter === 'active') matchFilter = isActiveStatus(c.status);
    else if (filter === 'draft') matchFilter = c.status === 'draft';
    // 'all' → matchFilter stays true

    return matchFilter && matchSearch;
  });

  if (loading) {
    return (
      <div>
        <div className="page-header fade-in">
          <div>
            <div className="page-title">{t('courses.title')}</div>
            <div className="page-sub">{t('courses.loading', 'Yuklanmoqda...')}</div>
          </div>
          {canCreate && (
            <button className="btn btn-primary" disabled><Plus size={15} /> {t('courses.newCourse')}</button>
          )}
        </div>
        <div className="grid grid-3 fade-in">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="course-card skeleton-card" style={{ height: 350, background: 'var(--surface-1)', borderRadius: 'var(--radius-xl)', opacity: 0.6, padding: 0 }}>
              <div className="skeleton" style={{ height: 160, borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0' }} />
              <div style={{ padding: 20 }}>
                <div className="skeleton" style={{ height: 15, width: '40%', marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 20, width: '90%', marginBottom: 16 }} />
                <div className="skeleton" style={{ height: 12, width: '80%', marginBottom: 20 }} />
                <div className="skeleton" style={{ height: 8, width: '100%', marginBottom: 12 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="skeleton" style={{ height: 26, width: 26, borderRadius: '50%' }} />
                  <div className="skeleton" style={{ height: 28, width: 70, borderRadius: 8 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }} className="fade-in">
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{error}</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>{t('courses.errorText', "Ma'lumotlarni yuklashda xatolik yuz berdi. Tizim bilan ulanishni tekshiring.")}</p>
        <button className="btn btn-primary" onClick={() => { setLoading(true); setError(null); window.location.reload(); }}>{t('courses.retry', 'Qayta yuklash')}</button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header fade-in">
        <div>
          <div className="page-title">{t('courses.title')}</div>
          <div className="page-sub">
            {filtered.length} {t('courses.available', 'ta kurs mavjud')}
          </div>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={15} /> {t('courses.newCourse')}
          </button>
        )}
      </div>

      <div className="card fade-in fade-in-1" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ width: 'auto', flex: 1, minWidth: 200, display: 'flex' }}>
            <Search size={14} color="var(--text-muted)" />
            <input placeholder={t('courses.search')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'var(--surface-1)', borderRadius: 12, padding: 4, border: '1px solid var(--border-1)' }}>
            <button
              className={clsx('btn btn-sm', languageFilter === 'uz' ? 'btn-primary' : 'btn-ghost')}
              style={{ borderRadius: 8 }}
              onClick={() => setLanguageFilter('uz')}
            >
              O'zbekcha
            </button>
            <button
              className={clsx('btn btn-sm', languageFilter === 'ru' ? 'btn-primary' : 'btn-ghost')}
              style={{ borderRadius: 8 }}
              onClick={() => setLanguageFilter('ru')}
            >
              Русский
            </button>
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'var(--surface-1)', borderRadius: 12, padding: 4, border: '1px solid var(--border-1)' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={clsx('btn btn-sm', filter === tab.id ? 'btn-primary' : 'btn-ghost')}
                style={{ borderRadius: 8 }}
                onClick={() => setFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button className="btn btn-secondary btn-sm"><Filter size={13} /> {t('courses.filter')}</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card fade-in fade-in-2" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <BookOpen size={42} color="var(--text-muted)" style={{ marginBottom: 14 }} />
          <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>
            {isRu ? 'Курсы не найдены' : 'Kurslar topilmadi'}
          </div>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 420, margin: '0 auto' }}>
            {isRu ? 'Измените поиск, фильтр или язык, чтобы увидеть доступные курсы.' : 'Mavjud kurslarni ko‘rish uchun qidiruv, filtr yoki tilni o‘zgartiring.'}
          </p>
        </div>
      ) : (
      <div className="grid grid-3 fade-in fade-in-2">
        {filtered.map(course => {
          const showRating = hasPositiveNumber(course.rating);
          return (
          <div key={course.id} className="course-card">
            <div className="course-thumb" style={{ background: `linear-gradient(135deg, ${course.color}30, ${course.color}10)` }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: `${course.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${course.color}40` }}>
                  <BookOpen size={26} color={course.color} />
                </div>
              </div>
              <div style={{ position: 'absolute', top: 12, left: 12 }}>
                <span className={clsx('badge', isActiveStatus(course.status) ? 'badge-green' : 'badge-amber')}>
                  {isActiveStatus(course.status) ? t('courses.active') : t('courses.draft')}
                </span>
              </div>
              {showRating && (
                <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.5)', borderRadius: 8, padding: '4px 8px', fontSize: 11, color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Star size={10} color="#f59e0b" fill="#f59e0b" /> {Number(course.rating).toFixed(1)}
                </div>
              )}
            </div>
            <div className="course-body">
              <div className="course-category" style={{ color: course.color }}>
                {isRu ? (course.catRu || course.cat) : course.cat}
              </div>
              <div className="course-title">
                {isRu ? (course.titleRu || course.title) : course.title}
              </div>
              <div className="course-meta">
                <span><Users size={11} /> {course.enrolled || 0}</span>
                <span><Clock size={11} /> {course.duration}</span>
                <span><BookOpen size={11} /> {course.lessons}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div className="progress-bar" style={{ flex: 1, height: 5 }}>
                  <div className="progress-fill" style={{ width: `${course.completion || 0}%`, background: course.color }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: course.color }}>{course.completion || 0}%</span>
              </div>
              <div className="course-footer">
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div className="avatar" style={{ width: 26, height: 26, fontSize: 10, background: `${course.color}30`, color: course.color }}>{course.instructor ? course.instructor.split(' ').map((n: string) => n[0]).join('') : 'T'}</div>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{course.instructor}</span>
                </div>
                <Link to={`/courses/${course.id}`} className="btn btn-primary btn-sm" style={{ padding: '6px 12px' }}>
                  <Play size={12} /> {t('courses_page.watch')}
                </Link>
              </div>
            </div>
          </div>
        );})}
      </div>
      )}

      {/* Course Creation Modal */}
      {isModalOpen && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20,
          overflowY: 'auto'
        }}>
          <div className="card card-glass modal-animate" style={{
            width: '100%',
            maxWidth: 680,
            background: 'var(--bg-2)',
            border: '1px solid var(--border-3)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
            padding: 28,
            position: 'relative'
          }}>
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              ✕
            </button>

            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={20} color="var(--blue-400)" />
              {t('courses_page.createTitle')}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              {t('courses_page.createSubtitle')}
            </p>

            <div style={{ display: 'flex', gap: 4, background: 'var(--surface-1)', borderRadius: 10, padding: 3, border: '1px solid var(--border-1)', width: 'fit-content', marginBottom: 20 }}>
              <button 
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, language: 'uz' }))}
                className={clsx('btn btn-sm', formData.language === 'uz' ? 'btn-primary' : 'btn-ghost')}
                style={{ borderRadius: 6, padding: '4px 12px' }}
              >
                O'zbek tili
              </button>
              <button 
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, language: 'ru' }))}
                className={clsx('btn btn-sm', formData.language === 'ru' ? 'btn-primary' : 'btn-ghost')}
                style={{ borderRadius: 6, padding: '4px 12px' }}
              >
                Русский язык
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label className="input-label">{t('courses_page.createTitleLabel', formData.language === 'ru' ? 'Название курса *' : 'Kurs nomi *')}</label>
                <input 
                  className="input" 
                  placeholder={t('courses_page.createTitlePlaceholder', formData.language === 'ru' ? 'Например: Основы промышленной безопасности' : 'Masalan: Sanoat Xavfsizligi Asoslari')}
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
                {errors.title && <span style={{ color: 'var(--red-400)', fontSize: 12 }}>{errors.title}</span>}
              </div>

              <div className="input-group">
                <label className="input-label">{t('courses_page.createDescLabel', formData.language === 'ru' ? 'Описание курса *' : 'Kurs tavsifi *')}</label>
                <textarea 
                  className="input" 
                  rows={3}
                  placeholder={t('courses_page.createDescPlaceholder', formData.language === 'ru' ? 'Подробное описание курса...' : 'Kurs haqida batafsil ma\'lumot...')}
                  value={formData.description}
                  style={{ resize: 'none' }}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
                {errors.description && <span style={{ color: 'var(--red-400)', fontSize: 12 }}>{errors.description}</span>}
              </div>

              <div className="form-grid-2" style={{ gap: 16 }}>
                <div className="input-group">
                  <label className="input-label">{t('courses_page.categoryLabel')}</label>
                  <select 
                    className="input"
                    value={CATEGORIES.find(c => c.uz === formData.cat)?.id || 'IT'}
                    onChange={e => handleCategoryChange(e.target.value)}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{isRu ? c.ru : c.uz}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">{t('courses_page.levelLabel')}</label>
                  <select 
                    className="input"
                    value={LEVELS.find(l => l.uz === formData.level)?.id || 'Beginner'}
                    onChange={e => handleLevelChange(e.target.value)}
                  >
                    {LEVELS.map(l => (
                      <option key={l.id} value={l.id}>{isRu ? l.ru : l.uz}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">{t('courses_page.lessonsLabel')}</label>
                  <input 
                    type="number"
                    className="input"
                    min={1}
                    value={formData.lessons}
                    onChange={e => setFormData(prev => ({ ...prev, lessons: parseInt(e.target.value) || 1 }))}
                  />
                  {errors.lessons && <span style={{ color: 'var(--red-400)', fontSize: 12 }}>{errors.lessons}</span>}
                </div>

                <div className="input-group">
                  <label className="input-label">{t('courses_page.durationLabel')}</label>
                  <input 
                    className="input"
                    placeholder={t('courses_page.durationPlaceholder')}
                    value={formData.duration}
                    onChange={e => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  />
                  {errors.duration && <span style={{ color: 'var(--red-400)', fontSize: 12 }}>{errors.duration}</span>}
                </div>

                <div className="input-group">
                  <label className="input-label">{t('courses_page.instructorLabel')}</label>
                  <input 
                    className="input"
                    placeholder={t('courses_page.instructorPlaceholder', 'Masalan: B. Rahimov')}
                    value={formData.instructor}
                    onChange={e => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
                  />
                  {errors.instructor && <span style={{ color: 'var(--red-400)', fontSize: 12 }}>{errors.instructor}</span>}
                </div>

                <div className="input-group">
                  <label className="input-label">{t('courses_page.statusLabel')}</label>
                  <select 
                    className="input"
                    value={formData.status}
                    onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="draft">{t('courses_page.statusDraft')}</option>
                    <option value="published">{t('courses_page.statusPublished')}</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">{t('courses_page.colorLabel')}</label>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  {COLOR_PRESETS.map(preset => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color: preset.value }))}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: preset.value,
                        border: formData.color === preset.value ? '2.5px solid #fff' : 'none',
                        boxShadow: formData.color === preset.value ? '0 0 10px rgba(255,255,255,0.4)' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      {formData.color === preset.value && (
                        <span style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
                {errors.submit && (
                  <span style={{ alignSelf: 'center', marginRight: 'auto', color: 'var(--red-400)', fontSize: 12 }}>
                    {errors.submit}
                  </span>
                )}
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  {t('common.cancel')}
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? t('courses_page.creating') : t('courses_page.createBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
