import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Settings } from 'lucide-react';
import { clsx } from 'clsx';
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

type CourseLanguage = 'uz' | 'ru';

interface AddCourseModalProps {
  onClose: () => void;
  onSuccess: (course: any) => void;
  courseToEdit?: any;
}

const getCourseLanguage = (course?: any): CourseLanguage => (
  course?.language === 'ru' ? 'ru' : 'uz'
);

export default function AddCourseModal({ onClose, onSuccess, courseToEdit }: AddCourseModalProps) {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const isEdit = !!courseToEdit;

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
  const selectedIsRu = formData.language === 'ru';

  useEffect(() => {
    if (isEdit && courseToEdit) {
      setFormData({
        title: getCourseLanguage(courseToEdit) === 'ru' ? (courseToEdit.titleRu || courseToEdit.title || '') : (courseToEdit.title || ''),
        description: getCourseLanguage(courseToEdit) === 'ru' ? (courseToEdit.descriptionRu || courseToEdit.description || '') : (courseToEdit.description || ''),
        cat: courseToEdit.cat || 'IT',
        catRu: courseToEdit.catRu || courseToEdit.cat || 'IT',
        level: courseToEdit.level || "Boshlang'ich",
        levelRu: courseToEdit.levelRu || courseToEdit.level || 'Начальный',
        lessons: courseToEdit.lessons || (courseToEdit.modules ? courseToEdit.modules.length : 1),
        duration: courseToEdit.duration || '',
        color: courseToEdit.color || '#3b82f6',
        instructor: courseToEdit.instructor || '',
        status: courseToEdit.status === 'active' ? 'published' : (courseToEdit.status || 'draft'),
        language: getCourseLanguage(courseToEdit),
      });
    } else if (user) {
      const name = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'O\'qituvchi';
      setFormData(prev => ({ ...prev, instructor: name }));
    }
  }, [user, isEdit, courseToEdit]);

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
    if (!formData.title.trim()) newErrors.title = t('courses_page.errTitle', 'Kurs nomini kiriting');
    if (!formData.description.trim()) newErrors.description = t('courses_page.errDescription', 'Tavsifni kiriting');
    if (!formData.instructor.trim()) newErrors.instructor = t('courses_page.errInstructor', 'O\'qituvchini kiriting');
    if (formData.lessons <= 0) newErrors.lessons = t('courses_page.errLessons', 'Darslar soni noldan katta bo\'lishi kerak');
    if (!formData.duration.trim()) newErrors.duration = t('courses_page.errDuration', 'Davomiylikni kiriting');

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const selectedLanguage = formData.language as CourseLanguage;
      const payload = {
        ...formData,
        title: formData.title.trim(),
        titleRu: selectedLanguage === 'ru' ? formData.title.trim() : '',
        description: formData.description.trim(),
        descriptionRu: selectedLanguage === 'ru' ? formData.description.trim() : '',
        status: formData.status === 'active' ? 'published' : formData.status,
      };

      let res;
      if (isEdit) {
        res = await apiClient.patch(`/courses/${courseToEdit.id || courseToEdit._id}`, payload);
      } else {
        res = await apiClient.post('/courses', payload);
      }

      const savedCourse = res.data?.data || res.data;
      onSuccess(savedCourse);
    } catch (err) {
      const message = err instanceof Error ? err.message : (t('common.error') || 'Xatolik yuz berdi');
      setErrors({ submit: message });
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000, // Higher than any admin page z-index
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
          onClick={onClose}
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
          {isEdit ? <Settings size={20} color="var(--blue-400)" /> : <Plus size={20} color="var(--blue-400)" />}
          {isEdit ? t('common.edit', 'Tahrirlash') : t('courses_page.createTitle', 'Yangi kurs yaratish')}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
          {isEdit ? 'Kurs parametrlarini tahrirlang' : t('courses_page.createSubtitle', 'Yangi kurs yaratish')}
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
            <label className="input-label">{selectedIsRu ? 'Название курса *' : 'Kurs nomi *'}</label>
            <input
              className="input"
              placeholder={selectedIsRu ? 'Например: Основы промышленной безопасности' : 'Masalan: Sanoat Xavfsizligi Asoslari'}
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
            {errors.title && <span style={{ color: 'var(--red-400)', fontSize: 12 }}>{errors.title}</span>}
          </div>

          <div className="input-group">
            <label className="input-label">{selectedIsRu ? 'Описание курса *' : 'Kurs tavsifi *'}</label>
            <textarea
              className="input"
              rows={3}
              placeholder={selectedIsRu ? 'Подробное описание курса...' : 'Kurs haqida batafsil ma\'lumot...'}
              value={formData.description}
              style={{ resize: 'none' }}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
            {errors.description && <span style={{ color: 'var(--red-400)', fontSize: 12 }}>{errors.description}</span>}
          </div>

          <div className="form-grid-2" style={{ gap: 16 }}>
            <div className="input-group">
              <label className="input-label">{t('courses_page.categoryLabel', 'Kategoriya')}</label>
              <select
                className="input"
                value={CATEGORIES.find(c => c.uz === formData.cat)?.id || 'IT'}
                onChange={e => handleCategoryChange(e.target.value)}
              >
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{selectedIsRu ? c.ru : c.uz}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">{t('courses_page.levelLabel', 'Daraja')}</label>
              <select
                className="input"
                value={LEVELS.find(l => l.uz === formData.level)?.id || 'Beginner'}
                onChange={e => handleLevelChange(e.target.value)}
              >
                {LEVELS.map(l => (
                  <option key={l.id} value={l.id}>{selectedIsRu ? l.ru : l.uz}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">{t('courses_page.lessonsLabel', 'Darslar soni')}</label>
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
              <label className="input-label">{t('courses_page.durationLabel', 'Davomiyligi')}</label>
              <input
                className="input"
                placeholder={t('courses_page.durationPlaceholder', "Masalan: 4 soat")}
                value={formData.duration}
                onChange={e => setFormData(prev => ({ ...prev, duration: e.target.value }))}
              />
              {errors.duration && <span style={{ color: 'var(--red-400)', fontSize: 12 }}>{errors.duration}</span>}
            </div>

            <div className="input-group">
              <label className="input-label">{t('courses_page.instructorLabel', "O'qituvchi")}</label>
              <input
                className="input"
                placeholder={t('courses_page.instructorPlaceholder', 'Masalan: B. Rahimov')}
                value={formData.instructor}
                onChange={e => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
              />
              {errors.instructor && <span style={{ color: 'var(--red-400)', fontSize: 12 }}>{errors.instructor}</span>}
            </div>

            <div className="input-group">
              <label className="input-label">{t('courses_page.statusLabel', 'Holati')}</label>
              <select
                className="input"
                value={formData.status}
                onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="draft">{t('courses_page.statusDraft', 'Qoralama')}</option>
                <option value="published">{t('courses_page.statusPublished', 'Faol')}</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">{t('courses_page.colorLabel', 'Rangi')}</label>
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
              onClick={onClose}
              disabled={submitting}
            >
              {t('common.cancel', 'Bekor qilish')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? t('courses_page.saving', 'Saqlanmoqda...') : (isEdit ? t('common.save', 'Saqlash') : t('courses_page.createBtn', 'Yaratish'))}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
