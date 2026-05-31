import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { TrendingUp, TrendingDown, Users, BookOpen, Award, Clock, AlertCircle } from 'lucide-react';
import { apiClient } from '@/api/axios';



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

const iconMap: Record<string, any> = {
  users: Users,
  completions: BookOpen,
  certs: Award,
  hours: Clock,
};

export default function Analytics() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [kpisData, setKpisData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [deptData, setDeptData] = useState<any[]>([]);
  const [radarData, setRadarData] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      apiClient.get('/analytics/kpis'),
      apiClient.get('/analytics/monthly'),
      apiClient.get('/analytics/departments'),
      apiClient.get('/analytics/radar')
    ])
    .then(([kpisRes, monthlyRes, deptRes, radarRes]) => {
      if (isMounted) {
        setKpisData(kpisRes.data?.data || kpisRes.data || []);
        setMonthlyData(monthlyRes.data?.data || monthlyRes.data || []);
        setDeptData(deptRes.data?.data || deptRes.data || []);
        setRadarData(radarRes.data?.data || radarRes.data || []);
        setLoading(false);
      }
    })
    .catch(err => {
      if (isMounted) {
        console.error('Error fetching analytics data:', err);
        setError('Analitika ma\'lumotlarini yuklashda xatolik yuz berdi');
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div>
        <div className="page-header fade-in">
          <div>
            <div className="page-title">{t('nav.analytics')}</div>
            <div className="page-sub">Yuklanmoqda...</div>
          </div>
        </div>

        {/* Skeleton KPIs */}
        <div className="grid grid-4 fade-in" style={{ marginBottom: 24 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat-card skeleton-card" style={{ height: 120, background: 'var(--surface-1)', borderRadius: 12, opacity: 0.6 }}>
              <div style={{ padding: 20 }}>
                <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 10 }} />
                <div className="skeleton" style={{ height: 24, width: '40%', marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 10, width: '80%' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Skeleton Charts */}
        <div className="grid grid-12 fade-in" style={{ marginBottom: 24 }}>
          <div className="card skeleton-card" style={{ height: 320, background: 'var(--surface-1)', borderRadius: 12, opacity: 0.6, padding: 20 }}>
            <div className="skeleton" style={{ height: 16, width: '40%', marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 10, width: '20%', marginBottom: 24 }} />
            <div className="skeleton" style={{ height: 220, width: '100%' }} />
          </div>
          <div className="card skeleton-card" style={{ height: 320, background: 'var(--surface-1)', borderRadius: 12, opacity: 0.6, padding: 20 }}>
            <div className="skeleton" style={{ height: 16, width: '40%', marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 10, width: '20%', marginBottom: 24 }} />
            <div className="skeleton" style={{ height: 220, width: '100%' }} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <AlertCircle size={40} color="var(--red-400)" style={{ marginBottom: 12 }} />
        <div style={{ fontSize: 16, fontWeight: 600 }}>{error}</div>
        <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => window.location.reload()}>{t('common.refresh')}</button>
      </div>
    );
  }

  const kpis = kpisData.map(k => ({
    label: k.label,
    value: k.value,
    change: k.change,
    up: k.up,
    icon: iconMap[k.key] || Users,
    color: k.color || '#3b82f6'
  }));

  return (
    <div>
      <div className="page-header fade-in">
        <div>
          <div className="page-title">{t('nav.analytics')}</div>
          <div className="page-sub">2026 {t('analytics.year', 'yil')} — {t('analytics.fullAnalysis', "To'liq tahlil")}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[t('common.thisMonth'), t('common.thisYear', 'Bu yil'), t('common.all')].map((l, i) => (
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
              {k.change} {t('dash.vsLastMonth')}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-12 fade-in fade-in-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{t('analytics.userGrowth', "O'quvchilar o'sishi")}</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 18 }}>{t('analytics.monthlyDynamic', 'Oylik dinamika')}</div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="m" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="users" name={t('analytics.users', 'Foydalanuvchilar')} stroke="var(--blue-500)" strokeWidth={2.5} dot={{ fill: 'var(--blue-500)', r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="completions" name={t('analytics.completed', 'Yakunlandi')} stroke="var(--green-500)" strokeWidth={2.5} dot={{ fill: 'var(--green-500)', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{t('analytics.kpiRadar', 'KPI Radar')}</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>{t('analytics.generalIndicators', "Umumiy ko'rsatkichlar")}</div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--radar-grid)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Radar name="Ball" dataKey="A" stroke="var(--violet-500)" fill="var(--violet-500)" fillOpacity={0.2} strokeWidth={2} />
                <Tooltip contentStyle={{ background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 10, fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card fade-in fade-in-3">
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{t('analytics.deptAnalysis', "Bo'limlar tahlili")}</div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 20 }}>{t('analytics.enrolledCompleted', "Ro'yxatga olindi va yakunlandi")}</div>
        <div style={{ height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={deptData} barSize={20} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="dept" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="enrolled" name={t('analytics.enrolled', "Ro'yxatga olindi")} fill="var(--blue-500)" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
              <Bar dataKey="completed" name={t('analytics.completed', 'Yakunlandi')} fill="var(--green-500)" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
