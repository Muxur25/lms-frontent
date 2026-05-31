import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen, Play, Award, Clock, CheckCircle, TrendingUp,
  Search, Star, ChevronRight, Loader2, AlertCircle,
} from 'lucide-react';
import { apiClient } from '@/api/axios';

interface EnrolledCourse {
  enrollmentId: string;
  courseId: string;
  progress: number;
  status: string;
  enrolledAt: string;
  course: {
    id: string;
    title: string;
    titleRu?: string;
    cat?: string;
    catRu?: string;
    level?: string;
    color?: string;
    instructor?: string;
    lessons?: number;
    duration?: string;
    rating?: number;
  } | null;
}

export default function MyLearning() {
  const { i18n } = useTranslation();
  const isRu = i18n.language === 'ru';

  const [enrollments, setEnrollments] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiClient.get('/courses/my-enrollments')
      .then(res => {
        if (!mounted) return;
        const data = res.data?.data ?? res.data ?? [];
        setEnrollments(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (mounted) setError(isRu ? 'Ошибка загрузки данных' : 'Ma\'lumotlarni yuklashda xatolik');
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [isRu]);

  const filtered = enrollments.filter(e => {
    if (!e.course) return false;
    const title = isRu ? (e.course.titleRu || e.course.title) : e.course.title;
    const matchSearch = title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || e.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: enrollments.length,
    inProgress: enrollments.filter(e => e.status === 'in-progress').length,
    completed: enrollments.filter(e => e.status === 'completed').length,
    avgProgress: enrollments.length
      ? Math.round(enrollments.reduce((s, e) => s + e.progress, 0) / enrollments.length)
      : 0,
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <Loader2 size={32} style={{ animation: 'spin-fast 1s linear infinite', color: 'var(--blue-400)' }} />
    </div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <AlertCircle size={40} color="var(--red-400)" style={{ marginBottom: 12 }} />
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{error}</div>
      <button className="btn btn-secondary" onClick={() => window.location.reload()}>
        {isRu ? 'Повторить' : 'Qayta urinish'}
      </button>
    </div>
  );

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookOpen color="var(--blue-400)" size={24} />
            {isRu ? 'Моё обучение' : "Mening ta'limim"}
          </h1>
          <p className="page-sub" style={{ marginTop: 6 }}>
            {isRu ? 'Ваши курсы и прогресс обучения' : 'Kurslaringiz va o\'quv jarayoni'}
          </p>
        </div>
        <Link to="/courses" className="btn btn-primary">
          <BookOpen size={15} /> {isRu ? 'Найти курсы' : 'Kurslarni ko\'rish'}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: isRu ? 'Всего курсов' : 'Jami kurslar', value: stats.total, color: '#3b82f6', icon: BookOpen },
          { label: isRu ? 'В процессе' : 'Jarayonda', value: stats.inProgress, color: '#f59e0b', icon: TrendingUp },
          { label: isRu ? 'Завершено' : 'Yakunlangan', value: stats.completed, color: '#22c55e', icon: CheckCircle },
          { label: isRu ? 'Средний прогресс' : "O'rtacha jarayon", value: `${stats.avgProgress}%`, color: '#8b5cf6', icon: Star },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-header">
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ marginTop: 6, color: s.color }}>{s.value}</div>
              </div>
              <div className="stat-icon" style={{ background: `${s.color}15` }}>
                <s.icon size={22} color={s.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter & Search */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 200, display: 'flex' }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              placeholder={isRu ? 'Поиск курса...' : 'Kurs qidirish...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {([
              { key: 'all', label: isRu ? 'Все' : 'Barchasi' },
              { key: 'in-progress', label: isRu ? 'В процессе' : 'Jarayonda' },
              { key: 'completed', label: isRu ? 'Завершено' : 'Yakunlangan' },
            ] as const).map(f => (
              <button
                key={f.key}
                className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--surface-1)', borderRadius: 20, border: '1px solid var(--border-1)' }}>
          <BookOpen size={48} color="var(--text-muted)" style={{ opacity: 0.3, marginBottom: 16 }} />
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
            {enrollments.length === 0
              ? (isRu ? 'Вы ещё не записались ни на один курс' : 'Siz hali hech qanday kursga yozilmagansiz')
              : (isRu ? 'Курсы не найдены' : 'Kurslar topilmadi')}
          </div>
          {enrollments.length === 0 && (
            <Link to="/courses" className="btn btn-primary" style={{ marginTop: 12, display: 'inline-flex' }}>
              {isRu ? 'Найти курсы' : "Kurslarni ko'rish"} <ChevronRight size={14} />
            </Link>
          )}
        </div>
      )}

      {/* Course cards */}
      <div className="grid grid-3">
        {filtered.map(e => {
          if (!e.course) return null;
          const c = e.course;
          const title = isRu ? (c.titleRu || c.title) : c.title;
          const cat = isRu ? (c.catRu || c.cat) : c.cat;
          const color = c.color || '#3b82f6';
          const isCompleted = e.status === 'completed';

          return (
            <div key={e.enrollmentId} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Color bar */}
              <div style={{ height: 4, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />

              <div style={{ padding: '18px 20px' }}>
                {/* Category & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span className="badge badge-blue" style={{ background: `${color}15`, color, borderColor: `${color}30`, fontSize: 10 }}>
                    {cat || 'Kurs'}
                  </span>
                  <span className={`badge ${isCompleted ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: 10 }}>
                    {isCompleted
                      ? (isRu ? '✓ Завершено' : '✓ Yakunlangan')
                      : (isRu ? 'В процессе' : 'Jarayonda')}
                  </span>
                </div>

                {/* Title */}
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, lineHeight: 1.3 }}>{title}</div>
                {c.instructor && (
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>{c.instructor}</div>
                )}

                {/* Progress */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{isRu ? 'Прогресс' : 'Jarayon'}</span>
                    <span style={{ fontWeight: 800, color }}>{e.progress}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: 6 }}>
                    <div className="progress-fill" style={{ width: `${e.progress}%`, background: color }} />
                  </div>
                </div>

                {/* Meta */}
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>
                  {c.lessons && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <BookOpen size={11} /> {c.lessons} {isRu ? 'уроков' : 'dars'}
                    </span>
                  )}
                  {c.duration && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} /> {c.duration}
                    </span>
                  )}
                  {c.rating && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star size={11} /> {c.rating}
                    </span>
                  )}
                </div>

                {/* Action */}
                <Link
                  to={`/courses/${c.id}`}
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', justifyContent: 'center', background: isCompleted ? `linear-gradient(135deg,#22c55e,#16a34a)` : `linear-gradient(135deg,${color},${color}cc)` }}
                >
                  {isCompleted ? (
                    <><Award size={13} /> {isRu ? 'Просмотреть' : "Ko'rish"}</>
                  ) : (
                    <><Play size={13} /> {isRu ? 'Продолжить' : 'Davom etish'}</>
                  )}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
