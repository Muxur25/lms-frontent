import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Filter, Mail, MoreHorizontal } from 'lucide-react';
import { clsx } from 'clsx';

const employees = [
  { id: 1, name: 'Alisher Hasanov', nameRu: 'Алишер Хасанов', dept: 'IT', deptRu: 'IT', position: 'Senior Developer', positionRu: 'Старший разработчик', email: 'a.hasanov@agmk.uz', joined: '2022-03-15', courses: 8, progress: 87, status: 'active' },
  { id: 2, name: 'Kamola Yusupova', nameRu: 'Камола Юсупова', dept: 'HR', deptRu: 'HR', position: 'HR Manager', positionRu: 'HR Менеджер', email: 'k.yusupova@agmk.uz', joined: '2021-07-01', courses: 12, progress: 95, status: 'active' },
  { id: 3, name: 'Jahongir Toshmatov', nameRu: 'Жахонгир Тошматов', dept: 'Muhandislik', deptRu: 'Инженерия', position: 'Chief Engineer', positionRu: 'Главный инженер', email: 'j.toshmatov@agmk.uz', joined: '2019-11-20', courses: 15, progress: 72, status: 'active' },
  { id: 4, name: 'Dilnoza Karimova', nameRu: 'Дилноза Каримова', dept: 'Moliya', deptRu: 'Финансы', position: 'Finance Analyst', positionRu: 'Финансовый аналитик', email: 'd.karimova@agmk.uz', joined: '2023-01-10', courses: 6, progress: 61, status: 'active' },
  { id: 5, name: 'Bobur Rahimov', nameRu: 'Бобур Рахимов', dept: 'Xavfsizlik', deptRu: 'Безопасность', position: 'Safety Officer', positionRu: 'Специалист по безопасности', email: 'b.rahimov@agmk.uz', joined: '2020-05-14', courses: 10, progress: 88, status: 'active' },
  { id: 6, name: 'Sarvinoz Nazarova', nameRu: 'Сарвиноз Назарова', dept: 'HR', deptRu: 'HR', position: 'Recruiter', positionRu: 'Рекрутер', email: 's.nazarova@agmk.uz', joined: '2024-02-28', courses: 4, progress: 45, status: 'inactive' },
  { id: 7, name: 'Muzaffar Umarov', nameRu: 'Музаффар Умаров', dept: 'IT', deptRu: 'IT', position: 'DevOps Engineer', positionRu: 'DevOps инженер', email: 'm.umarov@agmk.uz', joined: '2022-09-01', courses: 9, progress: 79, status: 'active' },
  { id: 8, name: 'Nargiza Sultanova', nameRu: 'Наргиза Султанова', dept: 'Boshqaruv', deptRu: 'Управление', position: 'Project Manager', positionRu: 'Менеджер проектов', email: 'n.sultanova@agmk.uz', joined: '2021-04-12', courses: 14, progress: 93, status: 'active' },
];

const deptColors: Record<string, string> = {
  IT: '#3b82f6', HR: '#8b5cf6', Muhandislik: '#06b6d4', Moliya: '#f59e0b',
  Xavfsizlik: '#ef4444', Boshqaruv: '#22c55e', Инженерия: '#06b6d4',
};

export default function Employees() {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const isRu = i18n.language === 'ru';

  const filtered = employees.filter(e => {
    const name = isRu ? e.nameRu : e.name;
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const toggleSelect = (id: number) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  return (
    <div>
      <div className="page-header fade-in">
        <div>
          <div className="page-title">{t('employees.title')}</div>
          <div className="page-sub">{employees.length} {t('employees.title').toLowerCase()}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm"><Mail size={14} /> {t('employees.invite')}</button>
          <button className="btn btn-primary btn-sm"><Plus size={14} /> Qo'shish</button>
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
                <th>Xodim</th>
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
                const color = deptColors[emp.dept] || '#3b82f6';
                const initials = (isRu ? emp.nameRu : emp.name).split(' ').map(n => n[0]).join('');
                return (
                  <tr key={emp.id}>
                    <td style={{ paddingLeft: 20 }}>
                      <input type="checkbox" checked={selected.includes(emp.id)} onChange={() => toggleSelect(emp.id)} style={{ accentColor: 'var(--blue-500)' }} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ width: 34, height: 34, fontSize: 12, background: `${color}25`, color }}>{initials}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{isRu ? emp.nameRu : emp.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-blue" style={{ background: `${color}15`, color, borderColor: `${color}30` }}>{isRu ? emp.deptRu : emp.dept}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{isRu ? emp.positionRu : emp.position}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{emp.courses}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}> ta</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar" style={{ height: 5, width: 80 }}>
                          <div className="progress-fill" style={{ width: `${emp.progress}%` }} />
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
