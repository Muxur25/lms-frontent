import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Filter, Clock, Users, Star, BookOpen, Play } from 'lucide-react';
import { clsx } from 'clsx';

const courses = [
  { id: 1, title: 'Sanoat Xavfsizligi Asoslari', titleRu: 'Основы промышленной безопасности', cat: 'Xavfsizlik', catRu: 'Безопасность', level: 'Boshlang\'ich', levelRu: 'Начальный', enrolled: 245, lessons: 18, duration: '12 soat', rating: 4.9, completion: 78, status: 'active', color: '#ef4444', instructor: 'B. Rahimov' },
  { id: 2, title: 'React va TypeScript', titleRu: 'React и TypeScript', cat: 'IT', catRu: 'IT', level: 'O\'rta', levelRu: 'Средний', enrolled: 189, lessons: 32, duration: '24 soat', rating: 4.8, completion: 65, status: 'active', color: '#3b82f6', instructor: 'A. Toshev' },
  { id: 3, title: 'Menejment va Liderlik', titleRu: 'Менеджмент и лидерство', cat: 'Boshqaruv', catRu: 'Управление', level: 'Yuqori', levelRu: 'Продвинутый', enrolled: 156, lessons: 24, duration: '16 soat', rating: 4.7, completion: 82, status: 'active', color: '#8b5cf6', instructor: 'N. Karimova' },
  { id: 4, title: 'Moliyaviy Tahlil', titleRu: 'Финансовый анализ', cat: 'Moliya', catRu: 'Финансы', level: 'O\'rta', levelRu: 'Средний', enrolled: 134, lessons: 20, duration: '14 soat', rating: 4.6, completion: 71, status: 'active', color: '#f59e0b', instructor: 'D. Yusupov' },
  { id: 5, title: 'Elektr Muhandisligi', titleRu: 'Электроинженерия', cat: 'Muhandislik', catRu: 'Инженерия', level: 'Yuqori', levelRu: 'Продвинутый', enrolled: 98, lessons: 28, duration: '20 soat', rating: 4.5, completion: 55, status: 'active', color: '#06b6d4', instructor: 'M. Hasanov' },
  { id: 6, title: 'HR Boshqaruvi', titleRu: 'Управление персоналом', cat: 'HR', catRu: 'HR', level: 'Boshlang\'ich', levelRu: 'Начальный', enrolled: 112, lessons: 15, duration: '10 soat', rating: 4.4, completion: 89, status: 'draft', color: '#22c55e', instructor: 'S. Nazarova' },
];

export default function Courses() {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const isRu = i18n.language === 'ru';

  const tabs = [
    { id: 'all', label: t('courses.all') },
    { id: 'active', label: t('courses.active') },
    { id: 'draft', label: t('courses.draft') },
  ];

  const filtered = courses.filter(c => {
    const title = isRu ? c.titleRu : c.title;
    const matchFilter = filter === 'all' || c.status === filter;
    const matchSearch = title.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div>
      <div className="page-header fade-in">
        <div>
          <div className="page-title">{t('courses.title')}</div>
          <div className="page-sub">{courses.length} ta kurs mavjud</div>
        </div>
        <button className="btn btn-primary"><Plus size={15} /> {t('courses.newCourse')}</button>
      </div>

      <div className="card fade-in fade-in-1" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ width: 'auto', flex: 1, minWidth: 200, display: 'flex' }}>
            <Search size={14} color="var(--text-muted)" />
            <input placeholder={t('courses.search')} value={search} onChange={e => setSearch(e.target.value)} />
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

      <div className="grid grid-3 fade-in fade-in-2">
        {filtered.map(course => (
          <div key={course.id} className="course-card">
            <div className="course-thumb" style={{ background: `linear-gradient(135deg, ${course.color}30, ${course.color}10)` }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: `${course.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${course.color}40` }}>
                  <BookOpen size={26} color={course.color} />
                </div>
              </div>
              <div style={{ position: 'absolute', top: 12, left: 12 }}>
                <span className={clsx('badge', course.status === 'active' ? 'badge-green' : 'badge-amber')}>
                  {course.status === 'active' ? t('courses.active') : t('courses.draft')}
                </span>
              </div>
              <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.5)', borderRadius: 8, padding: '4px 8px', fontSize: 11, color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Star size={10} color="#f59e0b" fill="#f59e0b" /> {course.rating}
              </div>
            </div>
            <div className="course-body">
              <div className="course-category" style={{ color: course.color }}>{isRu ? course.catRu : course.cat}</div>
              <div className="course-title">{isRu ? course.titleRu : course.title}</div>
              <div className="course-meta">
                <span><Users size={11} /> {course.enrolled}</span>
                <span><Clock size={11} /> {course.duration}</span>
                <span><BookOpen size={11} /> {course.lessons}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div className="progress-bar" style={{ flex: 1, height: 5 }}>
                  <div className="progress-fill" style={{ width: `${course.completion}%`, background: course.color }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: course.color }}>{course.completion}%</span>
              </div>
              <div className="course-footer">
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div className="avatar" style={{ width: 26, height: 26, fontSize: 10, background: `${course.color}30`, color: course.color }}>{course.instructor.split(' ').map(n => n[0]).join('')}</div>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{course.instructor}</span>
                </div>
                <button className="btn btn-primary btn-sm" style={{ padding: '6px 12px' }}>
                  <Play size={12} /> Ko'rish
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
