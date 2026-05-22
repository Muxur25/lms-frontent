import { useTranslation } from 'react-i18next';
import { Award, Download, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const certs = [
  { id: 1, title: 'Sanoat Xavfsizligi', titleRu: 'Промышленная безопасность', holder: 'Jahongir Toshmatov', issued: '2026-03-15', expires: '2027-03-15', status: 'active', color: '#22c55e' },
  { id: 2, title: 'ISO 9001 Sifat', titleRu: 'ISO 9001 Качество', holder: 'Kamola Yusupova', issued: '2025-11-01', expires: '2026-11-01', status: 'expiring', color: '#f59e0b' },
  { id: 3, title: 'React Professional', titleRu: 'React Professional', holder: 'Alisher Hasanov', issued: '2026-01-20', expires: '2027-01-20', status: 'active', color: '#3b82f6' },
  { id: 4, title: 'Moliyaviy Auditor', titleRu: 'Финансовый аудитор', holder: 'Dilnoza Karimova', issued: '2024-06-10', expires: '2026-06-10', status: 'expired', color: '#ef4444' },
  { id: 5, title: 'Project Manager', titleRu: 'Project Manager', holder: 'Nargiza Sultanova', issued: '2026-02-28', expires: '2027-02-28', status: 'active', color: '#8b5cf6' },
  { id: 6, title: 'DevOps Engineer', titleRu: 'DevOps Engineer', holder: 'Muzaffar Umarov', issued: '2025-09-15', expires: '2026-09-15', status: 'expiring', color: '#06b6d4' },
];

const statusMap: Record<string, { label: string; labelRu: string; cls: string; icon: any }> = {
  active: { label: 'Faol', labelRu: 'Активный', cls: 'badge-green', icon: CheckCircle },
  expiring: { label: 'Tugayapti', labelRu: 'Истекает', cls: 'badge-amber', icon: Clock },
  expired: { label: 'Muddati o\'tgan', labelRu: 'Просрочен', cls: 'badge-red', icon: AlertCircle },
};

export default function Certifications() {
  const { t, i18n } = useTranslation();
  const isRu = i18n.language === 'ru';

  const counts = { active: certs.filter(c => c.status === 'active').length, expiring: certs.filter(c => c.status === 'expiring').length, expired: certs.filter(c => c.status === 'expired').length };

  return (
    <div>
      <div className="page-header fade-in">
        <div>
          <div className="page-title">{t('nav.certifications')}</div>
          <div className="page-sub">{certs.length} ta sertifikat</div>
        </div>
        <button className="btn btn-primary btn-sm"><Award size={14} /> Yangi sertifikat</button>
      </div>

      <div className="grid grid-3 fade-in fade-in-1" style={{ marginBottom: 24 }}>
        {[
          { label: 'Faol', value: counts.active, color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: CheckCircle },
          { label: 'Tugayapti', value: counts.expiring, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Clock },
          { label: 'Muddati o\'tgan', value: counts.expired, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: AlertCircle },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-header">
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ marginTop: 6 }}>{s.value}</div>
              </div>
              <div className="stat-icon" style={{ background: s.bg }}>
                <s.icon size={22} color={s.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-3 fade-in fade-in-2">
        {certs.map(cert => {
          const st = statusMap[cert.status];
          return (
            <div key={cert.id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${cert.color}, ${cert.color}88)` }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: `${cert.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={22} color={cert.color} />
                </div>
                <span className={`badge ${st.cls}`}>
                  <st.icon size={10} /> {isRu ? st.labelRu : st.label}
                </span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>
                {isRu ? cert.titleRu : cert.title}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>{cert.holder}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-tertiary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Berilgan</span><span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{cert.issued}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Amal qiladi</span>
                  <span style={{ color: cert.status === 'expired' ? 'var(--red-400)' : cert.status === 'expiring' ? 'var(--amber-400)' : 'var(--text-secondary)', fontWeight: 600 }}>{cert.expires}</span>
                </div>
              </div>
              <hr className="divider" />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}><Download size={12} /> Yuklab olish</button>
                <button className="btn btn-ghost btn-sm">Ko'rish</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
