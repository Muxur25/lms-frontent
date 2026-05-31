import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Filter, Mail, MoreHorizontal } from 'lucide-react';
import { clsx } from 'clsx';
import { apiClient } from '@/api/axios';

const deptColors: Record<string, string> = {
  IT: '#3b82f6', HR: '#8b5cf6', Muhandislik: '#06b6d4', Moliya: '#f59e0b',
  Xavfsizlik: '#ef4444', Boshqaruv: '#22c55e', Инженерия: '#06b6d4',
  'IT va Raqamli Transformatsiya': '#3b82f6', 'HR departamenti': '#8b5cf6', 
  'Oquv markazi': '#06b6d4', 'Muhandislik bolimi': '#06b6d4',
  'Ijroiya boshqaruvi': '#22c55e', 'Texnika xavfsizligi': '#ef4444'
};

export default function Employees() {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isRu = i18n.language === 'ru';

  useEffect(() => {
    let isMounted = true;
    apiClient.get('/users')
      .then(res => {
        if (isMounted) {
          const fetchedData = res.data?.data || res.data || [];
          setEmployees(Array.isArray(fetchedData) ? fetchedData : []);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error('Error fetching employees:', err);
          setError(t('common.error') || 'Xatolik yuz berdi');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [t]);

  const filtered = employees.filter(e => {
    const name = isRu ? (e.nameRu || e.name || e.fullName || '') : (e.name || e.fullName || '');
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const toggleSelect = (id: string) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  if (loading) {
    return (
      <div>
        <div className="page-header fade-in">
          <div>
            <div className="page-title">{t('employees.title')}</div>
            <div className="page-sub">Yuklanmoqda...</div>
          </div>
        </div>
        <div className="card fade-in" style={{ padding: 20 }}>
          <div className="skeleton" style={{ height: 40, width: '100%', marginBottom: 20, borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 300, width: '100%', borderRadius: 12 }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }} className="fade-in">
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{error}</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>{t('employees.loadError', "Ma'lumotlarni yuklashda xatolik yuz berdi. Tizim bilan ulanishni tekshiring.")}</p>
        <button className="btn btn-primary" onClick={() => { setLoading(true); setError(null); window.location.reload(); }}>{t('common.refresh')}</button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header fade-in">
        <div>
          <div className="page-title">{t('employees.title')}</div>
          <div className="page-sub">{employees.length} {t('employees.title').toLowerCase()}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm"><Mail size={14} /> {t('employees.invite')}</button>
          <button className="btn btn-primary btn-sm"><Plus size={14} /> {t('common.create')}</button>
        </div>
      </div>

      <div className="card fade-in fade-in-1" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="search-bar" style={{ flex: 1, display: 'flex' }}>
            <Search size={14} color="var(--text-muted)" />
            <input placeholder={t('employees.search')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-secondary btn-sm"><Filter size={13} /> {t('common.all')}</button>
        </div>
      </div>

      <div className="card fade-in fade-in-2" style={{ padding: 0 }}>
        <div className="table-wrap" style={{ borderRadius: 'var(--radius-xl)', border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 40, paddingLeft: 20 }}><input type="checkbox" style={{ accentColor: 'var(--blue-500)' }} /></th>
                <th>{t('employees.employee', 'Xodim')}</th>
                <th>{t('employees.department')}</th>
                <th>{t('employees.position')}</th>
                <th>{t('employees.courses')}</th>
                <th>{t('employees.progress')}</th>
                <th>{t('employees.status')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => {
                const displayName = isRu ? (emp.nameRu || emp.name || emp.fullName || 'Xodim') : (emp.name || emp.fullName || 'Xodim');
                const deptKey = emp.dept || emp.departmentName || '';
                const color = deptColors[deptKey] || '#3b82f6';
                const initials = displayName.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase() || '??';
                return (
                  <tr key={emp.id}>
                    <td style={{ paddingLeft: 20 }}>
                      <input type="checkbox" checked={selected.includes(emp.id)} onChange={() => toggleSelect(emp.id)} style={{ accentColor: 'var(--blue-500)' }} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ width: 34, height: 34, fontSize: 12, background: `${color}25`, color }}>{initials}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{displayName}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-blue" style={{ background: `${color}15`, color, borderColor: `${color}30` }}>{isRu ? emp.deptRu || emp.dept || emp.departmentName : emp.dept || emp.departmentName}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{isRu ? emp.positionRu || emp.position : emp.position}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{emp.courses ?? emp.coursesCount ?? 0}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}> {t('employees.coursesUnit', 'ta')}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar" style={{ height: 5, width: 80 }}>
                          <div className="progress-fill" style={{ width: `${emp.progress}%`, background: color }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: emp.progress >= 80 ? 'var(--green-400)' : emp.progress >= 60 ? 'var(--amber-400)' : 'var(--red-400)' }}>{emp.progress}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={clsx('badge', emp.status === 'active' ? 'badge-green' : 'badge-red')}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                        {emp.status === 'active' ? t('employees.active') : t('employees.inactive')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm btn-icon"><Mail size={13} /></button>
                        <button className="btn btn-ghost btn-sm btn-icon"><MoreHorizontal size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
