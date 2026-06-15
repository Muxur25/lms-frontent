import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle,
  ChevronRight,
  Clock,
  Loader2,
  Play,
  Search,
  Star,
  TrendingUp,
} from 'lucide-react';
import { apiClient } from '@/api/axios';
import {
  getResponseList,
  isRecord,
  normalizeEnrollment,
  type EnrolledCourse,
  type EnrollmentStatus,
} from '@/shared/lib/course-enrollments';

export default function MyLearning() {
  const { t, i18n } = useTranslation();
  const isRu = i18n.language === 'ru';

  const text = {
    title: t('myLearning.title'),
    subtitle: t('myLearning.subtitle'),
    browseCourses: t('myLearning.browseCourses'),
    loading: t('myLearning.loading'),
    loadError: t('myLearning.loadError'),
    loadErrorHint: t('myLearning.loadErrorHint'),
    retry: t('myLearning.retry'),
    total: t('myLearning.total'),
    inProgress: t('myLearning.inProgress'),
    completed: t('myLearning.completed'),
    avgProgress: t('myLearning.avgProgress'),
    searchPlaceholder: t('myLearning.searchPlaceholder'),
    all: t('myLearning.all'),
    emptyTitle: t('myLearning.emptyTitle'),
    emptySearchTitle: t('myLearning.emptySearchTitle'),
    emptySubtitle: t('myLearning.emptySubtitle'),
    emptySearchSubtitle: t('myLearning.emptySearchSubtitle'),
    courseFallback: t('myLearning.courseFallback'),
    progress: t('myLearning.progress'),
    lessons: t('myLearning.lessons'),
    continue: t('myLearning.continue'),
    view: t('myLearning.view'),
    unknownInstructor: t('myLearning.unknownInstructor')
  };

  const [enrollments, setEnrollments] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<EnrollmentStatus>('all');

  const fetchEnrollments = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/courses/my-enrollments', { signal });
      const normalized = getResponseList(response)
        .map(normalizeEnrollment)
        .filter((item: EnrolledCourse | null): item is EnrolledCourse => Boolean(item));
      setEnrollments(normalized);
    } catch (err: unknown) {
      const isCancelled = isRecord(err) && (err.name === 'CanceledError' || err.code === 'ERR_CANCELED');
      if (!isCancelled) {
        setError(t('myLearning.loadError', 'Kurslarni yuklashda xatolik yuz berdi'));
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchEnrollments(controller.signal);
    return () => controller.abort();
  }, [fetchEnrollments]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return enrollments.filter((enrollment) => {
      if (!enrollment.course) return false;
      const title = isRu
        ? (enrollment.course.titleRu || enrollment.course.title)
        : enrollment.course.title;
      const category = isRu
        ? (enrollment.course.catRu || enrollment.course.cat || '')
        : (enrollment.course.cat || '');
      const matchesSearch = !query || `${title} ${category}`.toLowerCase().includes(query);
      const matchesFilter = filter === 'all' || enrollment.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [enrollments, filter, isRu, search]);

  const stats = useMemo(() => {
    const total = enrollments.length;
    const inProgress = enrollments.filter((item) => item.status === 'in-progress').length;
    const completed = enrollments.filter((item) => item.status === 'completed').length;
    const avgProgress = total
      ? Math.round(enrollments.reduce((sum, item) => sum + item.progress, 0) / total)
      : 0;

    return { total, inProgress, completed, avgProgress };
  }, [enrollments]);

  if (loading) {
    return (
      <div className="fade-in">
        <div className="page-header" style={{ marginBottom: 24 }}>
          <div>
            <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <BookOpen color="var(--blue-400)" size={24} />
              {text.title}
            </div>
            <div className="page-sub">{text.loading}</div>
          </div>
        </div>
        <div className="grid grid-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="card" style={{ padding: 20 }}>
              <div className="skeleton" style={{ width: '35%', height: 16, marginBottom: 14 }} />
              <div className="skeleton" style={{ width: '85%', height: 22, marginBottom: 10 }} />
              <div className="skeleton" style={{ width: '55%', height: 14, marginBottom: 22 }} />
              <div className="skeleton" style={{ width: '100%', height: 7, marginBottom: 18 }} />
              <div className="skeleton" style={{ width: '100%', height: 34, borderRadius: 10 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fade-in" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <AlertCircle size={42} color="var(--red-400)" style={{ marginBottom: 12 }} />
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{error}</div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>{text.loadErrorHint}</p>
        <button className="btn btn-primary" onClick={() => void fetchEnrollments()}>
          <Loader2 size={15} style={{ display: loading ? 'block' : 'none', animation: 'spin-fast 1s linear infinite' }} />
          {text.retry}
        </button>
      </div>
    );
  }

  const statCards = [
    { label: text.total, value: stats.total, color: '#3b82f6', icon: BookOpen },
    { label: text.inProgress, value: stats.inProgress, color: '#f59e0b', icon: TrendingUp },
    { label: text.completed, value: stats.completed, color: '#22c55e', icon: CheckCircle },
    { label: text.avgProgress, value: `${stats.avgProgress}%`, color: '#8b5cf6', icon: Star },
  ];

  const filters = [
    { key: 'all', label: text.all },
    { key: 'in-progress', label: text.inProgress },
    { key: 'completed', label: text.completed },
  ] as const;

  return (
    <div className="fade-in">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookOpen color="var(--blue-400)" size={24} />
            {text.title}
          </h1>
          <p className="page-sub" style={{ marginTop: 6 }}>{text.subtitle}</p>
        </div>
        <Link to="/courses" className="btn btn-primary">
          <BookOpen size={15} /> {text.browseCourses}
        </Link>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {statCards.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="stat-header">
              <div>
                <div className="stat-label">{stat.label}</div>
                <div className="stat-value" style={{ marginTop: 6, color: stat.color }}>{stat.value}</div>
              </div>
              <div className="stat-icon" style={{ background: `${stat.color}15` }}>
                <stat.icon size={22} color={stat.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <label className="search-bar" style={{ flex: 1, minWidth: 220, display: 'flex' }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              aria-label={text.searchPlaceholder}
              placeholder={text.searchPlaceholder}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: 12, padding: 4 }}>
            {filters.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`btn btn-sm ${filter === item.key ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 8 }}
                onClick={() => setFilter(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '56px 20px' }}>
          <BookOpen size={48} color="var(--text-muted)" style={{ opacity: 0.35, marginBottom: 16 }} />
          <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>
            {enrollments.length === 0 ? text.emptyTitle : text.emptySearchTitle}
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: enrollments.length === 0 ? 20 : 0 }}>
            {enrollments.length === 0 ? text.emptySubtitle : text.emptySearchSubtitle}
          </p>
          {enrollments.length === 0 && (
            <Link to="/courses" className="btn btn-primary" style={{ display: 'inline-flex' }}>
              {text.browseCourses} <ChevronRight size={14} />
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-3">
          {filtered.map((enrollment) => {
            const course = enrollment.course;
            if (!course) return null;

            const title = isRu ? (course.titleRu || course.title) : course.title;
            const category = isRu ? (course.catRu || course.cat) : course.cat;
            const color = course.color || '#3b82f6';
            const isCompleted = enrollment.status === 'completed';

            return (
              <article key={enrollment.enrollmentId} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ height: 4, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />

                <div style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span className="badge badge-blue" style={{ background: `${color}15`, color, borderColor: `${color}30`, fontSize: 10 }}>
                      {category || text.courseFallback}
                    </span>
                    <span className={`badge ${isCompleted ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: 10 }}>
                      {isCompleted ? text.completed : text.inProgress}
                    </span>
                  </div>

                  <h2 style={{ fontWeight: 800, fontSize: 15, marginBottom: 6, lineHeight: 1.35 }}>{title || text.courseFallback}</h2>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>
                    {course.instructor || text.unknownInstructor}
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{text.progress}</span>
                      <span style={{ fontWeight: 800, color }}>{enrollment.progress}%</span>
                    </div>
                    <div className="progress-bar" style={{ height: 6 }}>
                      <div className="progress-fill" style={{ width: `${enrollment.progress}%`, background: color }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>
                    {Boolean(course.lessons) && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <BookOpen size={11} /> {course.lessons} {text.lessons}
                      </span>
                    )}
                    {course.duration && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} /> {course.duration}
                      </span>
                    )}
                    {Boolean(course.rating) && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Star size={11} /> {course.rating}
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/courses/${course.id}`}
                    className="btn btn-primary btn-sm"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      background: isCompleted
                        ? 'linear-gradient(135deg,#22c55e,#16a34a)'
                        : `linear-gradient(135deg,${color},${color}cc)`,
                    }}
                  >
                    {isCompleted ? (
                      <>
                        <Award size={13} /> {text.view}
                      </>
                    ) : (
                      <>
                        <Play size={13} /> {text.continue}
                      </>
                    )}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
