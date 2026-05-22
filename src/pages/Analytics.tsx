import { useTranslation } from 'react-i18next';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { TrendingUp, TrendingDown, Users, BookOpen, Award, Clock } from 'lucide-react';

const monthlyData = [
  { m: 'Yan', users: 820, completions: 340, hours: 2100 },
  { m: 'Fev', users: 890, completions: 420, hours: 2480 },
  { m: 'Mar', users: 960, completions: 510, hours: 2850 },
  { m: 'Apr', users: 1020, completions: 580, hours: 3100 },
  { m: 'May', users: 1100, completions: 640, hours: 3400 },
  { m: 'Iyn', users: 1180, completions: 710, hours: 3800 },
  { m: 'Iyl', users: 1284, completions: 790, hours: 4200 },
];

const deptData = [
  { dept: 'IT', score: 87, enrolled: 145, completed: 112 },
  { dept: 'HR', score: 74, enrolled: 98, completed: 68 },
  { dept: 'Moliya', score: 91, enrolled: 87, completed: 79 },
  { dept: 'Muhandis', score: 68, enrolled: 234, completed: 142 },
  { dept: 'Xavfsizlik', score: 82, enrolled: 312, completed: 258 },
  { dept: 'Boshqaruv', score: 79, enrolled: 56, completed: 44 },
];

const radarData = [
  { subject: 'O\'quv', A: 85 },
  { subject: 'Test', A: 78 },
  { subject: 'Sertifikat', A: 62 },
  { subject: 'Davomiylik', A: 91 },
  { subject: 'Aktiv', A: 74 },
  { subject: 'Sifat', A: 88 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 10, padding: '10px 14px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const { t } = useTranslation();

  const kpis = [
    { label: 'Jami o\'quvchilar', value: '1,284', change: '+8.4%', up: true, icon: Users, color: '#3b82f6' },
    { label: 'Kurslar yakunladi', value: '790', change: '+12.1%', up: true, icon: BookOpen, color: '#22c55e' },
    { label: 'Sertifikatlar', value: '342', change: '+5.7%', up: true, icon: Award, color: '#f59e0b' },
    { label: 'O\'rtacha soat', value: '34.2', change: '-2.3%', up: false, icon: Clock, color: '#8b5cf6' },
  ];

  return (
    <div>
      <div className="page-header fade-in">
        <div>
          <div className="page-title">{t('nav.analytics')}</div>
          <div className="page-sub">2026 yil — To'liq tahlil</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {['Bu oy', 'Bu yil', 'Barchasi'].map((l, i) => (
            <button key={i} className={`btn btn-sm ${i === 0 ? 'btn-primary' : 'btn-secondary'}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-4 fade-in fade-in-1" style={{ marginBottom: 24 }}>
        {kpis.map((k, i) => (
          <div key={i} className="stat-card">
            <div className="stat-header">
              <div>
                <div className="stat-label">{k.label}</div>
                <div className="stat-value" style={{ marginTop: 6 }}>{k.value}</div>
              </div>
              <div className="stat-icon" style={{ background: `${k.color}15` }}>
                <k.icon size={22} color={k.color} />
              </div>
            </div>
            <div className={`stat-change ${k.up ? 'up' : 'down'}`}>
              {k.up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {k.change} o'tgan oyga nisbatan
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-12 fade-in fade-in-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>O'quvchilar o'sishi</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 18 }}>Oylik dinamika</div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="m" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="users" name="Foydalanuvchilar" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="completions" name="Yakunlandi" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: '#22c55e', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>KPI Radar</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>Umumiy ko'rsatkichlar</div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Radar name="Ball" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} />
                <Tooltip contentStyle={{ background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 10, fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card fade-in fade-in-3">
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Bo'limlar tahlili</div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 20 }}>Ro'yxatga olindi va yakunlandi</div>
        <div style={{ height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={deptData} barSize={20} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="dept" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="enrolled" name="Ro'yxatga olindi" fill="#3b82f6" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
              <Bar dataKey="completed" name="Yakunlandi" fill="#22c55e" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
