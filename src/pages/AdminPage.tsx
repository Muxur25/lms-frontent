import { useState } from 'react';

import { clsx } from 'clsx';
import {
  Users, BookOpen, Award, Shield, Search, Filter, MoreHorizontal,
  TrendingUp, BarChart3, Settings, Mail, Plus,
  Sparkles, CheckCircle, AlertTriangle, Download, SlidersHorizontal,
  LayoutDashboard, ServerCrash, Calendar,
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

type Tab = 'overview' | 'users' | 'courses' | 'analytics' | 'settings';

const areaData = [
  { name: 'Yan', users: 400 }, { name: 'Fev', users: 300 }, { name: 'Mar', users: 550 },
  { name: 'Apr', users: 480 }, { name: 'May', users: 700 }, { name: 'Iyn', users: 650 },
];

const mockUsers = [
  { id: 1, name: 'Alisher Hasanov', email: 'a.hasanov@agmk.uz', role: 'Admin', dept: 'IT', status: 'active', courses: 12 },
  { id: 2, name: 'Nargiza Karimova', email: 'n.karimova@agmk.uz', role: 'Manager', dept: 'HR', status: 'active', courses: 8 },
  { id: 3, name: 'Bobur Rahimov', email: 'b.rahimov@agmk.uz', role: 'Employee', dept: 'Engineering', status: 'offline', courses: 4 },
  { id: 4, name: 'Kamola Yuldasheva', email: 'k.yuldasheva@agmk.uz', role: 'Trainer', dept: 'Education', status: 'active', courses: 24 },
  { id: 5, name: 'Rustam Toshmatov', email: 'r.toshmatov@agmk.uz', role: 'Employee', dept: 'Security', status: 'disabled', courses: 2 },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const Tip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
          <p style={{ color: 'var(--text-tertiary)', marginBottom: 4 }}>{label}</p>
          <p style={{ color: payload[0].color, fontWeight: 700 }}>{payload[0].value} foydalanuvchi</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="admin-layout">
      {/* ── Header ── */}
      <div className="admin-header fade-in">
        <div>
          <h1 className="page-title">Boshqaruv Paneli</h1>
          <p className="page-sub">AGMK LMS Enterprise • Tizim administratsiyasi</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary"><Download size={14} /> Hisobot</button>
          <button className="btn btn-primary"><Plus size={14} /> Yangi foydalanuvchi</button>
        </div>
      </div>

      {/* ── Navigation ── */}
      <div className="admin-nav fade-in">
        {[
          { id: 'overview', icon: LayoutDashboard, label: 'Umumiy' },
          { id: 'users', icon: Users, label: 'Foydalanuvchilar' },
          { id: 'courses', icon: BookOpen, label: 'Kurslar & Testlar' },
          { id: 'analytics', icon: BarChart3, label: 'Tahlil' },
          { id: 'settings', icon: Settings, label: 'Sozlamalar' },
        ].map(tab => (
          <button
            key={tab.id}
            className={clsx('admin-nav-item', activeTab === tab.id && 'active')}
            onClick={() => setActiveTab(tab.id as Tab)}
          >
            <tab.icon size={15} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Content Area ── */}
      <div className="admin-content fade-in fade-in-1">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="admin-overview">
            <div className="grid grid-4" style={{ marginBottom: 24 }}>
              {[
                { label: 'Jami xodimlar', value: '1,284', icon: Users, color: '#3b82f6', trend: '+12%' },
                { label: 'Faol kurslar', value: '64', icon: BookOpen, color: '#8b5cf6', trend: '+4' },
                { label: 'Sertifikatlar', value: '892', icon: Award, color: '#22c55e', trend: '+28%' },
                { label: 'Tizim salomatligi', value: '99.9%', icon: ServerCrash, color: '#10b981', trend: 'Zo\'r' },
              ].map((s, i) => (
                <div key={i} className="stat-card">
                  <div className="stat-header">
                    <div>
                      <div className="stat-label">{s.label}</div>
                      <div className="stat-value" style={{ marginTop: 6 }}>{s.value}</div>
                    </div>
                    <div className="stat-icon" style={{ background: `${s.color}15` }}>
                      <s.icon size={20} color={s.color} />
                    </div>
                  </div>
                  <div className="stat-change up">
                    <TrendingUp size={12} /> {s.trend}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-3" style={{ gap: 24 }}>
              <div className="card" style={{ gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Tizim faolligi</div>
                  <button className="btn btn-ghost btn-sm"><Calendar size={13} /> Oxirgi 6 oy</button>
                </div>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={areaData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Tooltip content={<Tip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Sparkles size={16} color="var(--violet-400)" />
                  <span style={{ fontWeight: 700, fontSize: 15 }}>AI Tahlil & Muammolar</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="admin-alert warning">
                    <AlertTriangle size={15} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>32 xodim testdan o'tmadi</div>
                      <div style={{ fontSize: 11, color: 'var(--amber-400)', opacity: 0.8 }}>Sanoat xavfsizligi kursi</div>
                    </div>
                  </div>
                  <div className="admin-alert info">
                    <TrendingUp size={15} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>Trafik 45% ga oshdi</div>
                      <div style={{ fontSize: 11, color: 'var(--blue-400)', opacity: 0.8 }}>Server resurslarini optimallashtiring</div>
                    </div>
                  </div>
                  <div className="admin-alert success">
                    <CheckCircle size={15} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>Yangi modul muvaffaqiyatli</div>
                      <div style={{ fontSize: 11, color: 'var(--green-400)', opacity: 0.8 }}>"React asoslari" 98% bitiruvchiga ega</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="admin-users card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="admin-toolbar">
              <div className="search-wrap" style={{ width: 300 }}>
                <Search size={14} className="search-icon" />
                <input type="text" className="input" placeholder="Xodimni qidirish..." style={{ paddingLeft: 36, fontSize: 13 }} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
                <button className="btn btn-secondary"><Filter size={14} /> Filtrlar</button>
                <button className="btn btn-secondary"><SlidersHorizontal size={14} /> Ko'rinish</button>
              </div>
            </div>
            
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Xodim</th>
                    <th>Rol</th>
                    <th>Bo'lim</th>
                    <th>Kurslar</th>
                    <th>Holat</th>
                    <th style={{ width: 50 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {mockUsers.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className="avatar" style={{ width: 32, height: 32, fontSize: 11, background: 'var(--surface-2)' }}>
                            {u.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{u.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-gray">{u.role}</span></td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{u.dept}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                          <BookOpen size={13} color="var(--text-tertiary)" /> {u.courses}
                        </div>
                      </td>
                      <td>
                        <span className={clsx('badge', 
                          u.status === 'active' ? 'badge-green' : 
                          u.status === 'offline' ? 'badge-gray' : 'badge-red'
                        )}>
                          {u.status === 'active' ? 'Faol' : u.status === 'offline' ? 'Oflayn' : 'Bloklangan'}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-sm btn-icon"><MoreHorizontal size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="admin-pagination">
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>1-5 dan jami 1,284 ko'rsatilmoqda</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-secondary btn-sm" disabled>Oldingi</button>
                <button className="btn btn-secondary btn-sm">Keyingi</button>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="grid grid-12" style={{ gap: 24, alignItems: 'start' }}>
            <div className="card" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 4, padding: 12 }}>
              <button className="admin-nav-item active" style={{ justifyContent: 'flex-start', padding: '10px 14px' }}>
                <Settings size={15} /> Umumiy sozlamalar
              </button>
              <button className="admin-nav-item" style={{ justifyContent: 'flex-start', padding: '10px 14px' }}>
                <Shield size={15} /> Xavfsizlik & Kirish
              </button>
              <button className="admin-nav-item" style={{ justifyContent: 'flex-start', padding: '10px 14px' }}>
                <Mail size={15} /> Xabarnomalar
              </button>
              <button className="admin-nav-item" style={{ justifyContent: 'flex-start', padding: '10px 14px' }}>
                <SlidersHorizontal size={15} /> Integratsiyalar
              </button>
            </div>
            <div className="card" style={{ gridColumn: 'span 8' }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Umumiy tizim sozlamalari</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="form-group">
                  <label className="form-label">Korporatsiya nomi</label>
                  <input type="text" className="input" defaultValue="AGMK Korporatsiyasi" />
                </div>
                <div className="form-group">
                  <label className="form-label">Tizim tili (Default)</label>
                  <select className="input" defaultValue="uz">
                    <option value="uz">O'zbekcha (Lotin)</option>
                    <option value="ru">Русский</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderTop: '1px solid var(--border-1)', borderBottom: '1px solid var(--border-1)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>AI yordamchi</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Barcha foydalanuvchilar uchun AI chatni yoqish</div>
                  </div>
                  <div className="toggle active">
                    <div className="toggle-thumb" />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                  <button className="btn btn-secondary">Bekor qilish</button>
                  <button className="btn btn-primary">Saqlash</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
