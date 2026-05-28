import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Award, Download, CheckCircle, Clock, AlertCircle,
  Shield, Sparkles, Star, Eye, Share2, Trophy,
  TrendingUp, Zap, ChevronRight, Lock,
} from 'lucide-react';

const certs = [
  { id: 1, title: 'Sanoat Xavfsizligi', titleRu: 'Промышленная безопасность', holder: 'Jahongir Toshmatov', issued: '2026-03-15', expires: '2027-03-15', status: 'active', color: '#22c55e', score: 94, category: 'Xavfsizlik' },
  { id: 2, title: 'ISO 9001 Sifat', titleRu: 'ISO 9001 Качество', holder: 'Kamola Yusupova', issued: '2025-11-01', expires: '2026-11-01', status: 'expiring', color: '#f59e0b', score: 87, category: 'Sifat' },
  { id: 3, title: 'React Professional', titleRu: 'React Professional', holder: 'Alisher Hasanov', issued: '2026-01-20', expires: '2027-01-20', status: 'active', color: '#3b82f6', score: 91, category: 'Texnologiya' },
  { id: 4, title: 'Moliyaviy Auditor', titleRu: 'Финансовый аудитор', holder: 'Dilnoza Karimova', issued: '2024-06-10', expires: '2026-06-10', status: 'expired', color: '#ef4444', score: 78, category: 'Moliya' },
  { id: 5, title: 'Project Manager', titleRu: 'Project Manager', holder: 'Nargiza Sultanova', issued: '2026-02-28', expires: '2027-02-28', status: 'active', color: '#8b5cf6', score: 96, category: 'Boshqaruv' },
  { id: 6, title: 'DevOps Engineer', titleRu: 'DevOps Engineer', holder: 'Muzaffar Umarov', issued: '2025-09-15', expires: '2026-09-15', status: 'expiring', color: '#06b6d4', score: 82, category: 'Texnologiya' },
];

const achievements = [
  { icon: Trophy, label: 'Top Performer', desc: '5+ sertifikat', color: '#f59e0b', unlocked: true },
  { icon: Zap, label: 'Speed Learner', desc: '30 kunda 3 sertifikat', color: '#3b82f6', unlocked: true },
  { icon: Star, label: 'Excellence', desc: '90%+ o\'rtacha ball', color: '#8b5cf6', unlocked: true },
  { icon: Shield, label: 'Safety Master', desc: 'Xavfsizlik sertifikati', color: '#22c55e', unlocked: false },
];

const statusMap: Record<string, { label: string; labelRu: string; cls: string; icon: any; glow: string }> = {
  active: { label: 'Faol', labelRu: 'Активный', cls: 'badge-green', icon: CheckCircle, glow: 'rgba(34,197,94,0.2)' },
  expiring: { label: 'Tugayapti', labelRu: 'Истекает', cls: 'badge-amber', icon: Clock, glow: 'rgba(245,158,11,0.2)' },
  expired: { label: 'Muddati o\'tgan', labelRu: 'Просрочен', cls: 'badge-red', icon: AlertCircle, glow: 'rgba(239,68,68,0.2)' },
};

export default function Certifications() {
  const { i18n } = useTranslation();
  const isRu = i18n.language === 'ru';
  const [filter, setFilter] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');
  const [previewId, setPreviewId] = useState<number | null>(null);

  const counts = {
    active: certs.filter(c => c.status === 'active').length,
    expiring: certs.filter(c => c.status === 'expiring').length,
    expired: certs.filter(c => c.status === 'expired').length,
  };

  const filtered = filter === 'all' ? certs : certs.filter(c => c.status === filter);
  const avgScore = Math.round(certs.reduce((s, c) => s + c.score, 0) / certs.length);

  return (
    <div className="cert-dashboard-root blur-fade">

      {/* ─── Premium Hero ─── */}
      <div className="cert-hero">
        <div className="cert-hero-bg" />
        <div className="cert-hero-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#f59e0b,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(245,158,11,0.4)' }}>
              <Award size={18} color="#fff" />
            </div>
            <span className="badge badge-amber" style={{ fontSize: 11 }}>
              <Sparkles size={10} /> Sertifikatlash Ekosistemi
            </span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 10, background: 'linear-gradient(180deg,#f1f5f9,#94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Mening Sertifikatlarim
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', maxWidth: 440, lineHeight: 1.6 }}>
            Enterprise sertifikatlash platformasi. Barcha sertifikatlaringizni bir joyda boshqaring va karyerangizni kuchaytiring.
          </p>
        </div>

        {/* Hero Stats */}
        <div className="cert-hero-stats">
          {[
            { label: 'Jami', value: certs.length, color: 'var(--text-primary)' },
            { label: "O'rtacha ball", value: `${avgScore}%`, color: '#8b5cf6' },
            { label: 'Faol', value: counts.active, color: '#22c55e' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '16px 20px', background: 'var(--surface-1)', borderRadius: 16, border: '1px solid var(--border-1)', flex: 1 }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: s.color, letterSpacing: '-0.5px' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Status Filter Tabs ─── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }} className="hide-scrollbar">
        {([
          { key: 'all', label: "Barchasi", count: certs.length, color: '#3b82f6' },
          { key: 'active', label: "Faol", count: counts.active, color: '#22c55e' },
          { key: 'expiring', label: "Tugayapti", count: counts.expiring, color: '#f59e0b' },
          { key: 'expired', label: "Muddati o'tgan", count: counts.expired, color: '#ef4444' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
              background: filter === tab.key ? `${tab.color}15` : 'var(--surface-1)',
              border: `1px solid ${filter === tab.key ? tab.color + '35' : 'var(--border-1)'}`,
              borderRadius: 99, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
              color: filter === tab.key ? tab.color : 'var(--text-secondary)',
              fontWeight: filter === tab.key ? 700 : 500, fontSize: 13,
            }}
          >
            {tab.label}
            <span style={{ fontSize: 11, fontWeight: 800, background: filter === tab.key ? tab.color : 'var(--surface-2)', color: filter === tab.key ? '#fff' : 'var(--text-muted)', padding: '1px 7px', borderRadius: 99 }}>
              {tab.count}
            </span>
          </button>
        ))}

        <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
          <button className="btn btn-primary btn-sm" style={{ borderRadius: 99 }}>
            <Award size={13} /> Yangi sertifikat qo'shish
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

        {/* ─── Certificate Cards Grid ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {filtered.map((cert, idx) => {
            const st = statusMap[cert.status];
            const isPreview = previewId === cert.id;
            const daysLeft = Math.ceil((new Date(cert.expires).getTime() - Date.now()) / 86400000);

            return (
              <div
                key={cert.id}
                className={`cert-card-premium ${cert.status}`}
                style={{ animationDelay: `${idx * 0.06}s` }}
              >
                {/* Color accent bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${cert.color}, ${cert.color}55)`, borderRadius: '20px 20px 0 0' }} />

                {/* Ambient glow */}
                <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: cert.color, filter: 'blur(50px)', opacity: 0.07, borderRadius: '50%', pointerEvents: 'none' }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: `${cert.color}15`, border: `1px solid ${cert.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Award size={22} color={cert.color} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>
                          {cert.category}
                        </div>
                        <div style={{ fontWeight: 800, fontSize: 14.5, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                          {isRu ? cert.titleRu : cert.title}
                        </div>
                      </div>
                    </div>
                    <span className={`badge ${st.cls}`} style={{ fontSize: 10, flexShrink: 0 }}>
                      <st.icon size={10} /> {isRu ? st.labelRu : st.label}
                    </span>
                  </div>

                  {/* Holder */}
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${cert.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 9, fontWeight: 800, color: cert.color }}>{cert.holder[0]}</span>
                    </div>
                    {cert.holder}
                  </div>

                  {/* Score Ring */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Ball</div>
                      <div style={{ height: 6, width: 120, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${cert.score}%`, background: `linear-gradient(90deg, ${cert.color}, ${cert.color}88)`, borderRadius: 99 }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: cert.color }}>{cert.score}%</div>
                  </div>

                  {/* Dates */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16, padding: '12px 14px', background: 'var(--surface-1)', borderRadius: 10, border: '1px solid var(--border-1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Berilgan sana</span>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{cert.issued}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Amal qiladi</span>
                      <span style={{ color: cert.status === 'expired' ? 'var(--red-400)' : cert.status === 'expiring' ? 'var(--amber-400)' : 'var(--text-secondary)', fontWeight: 700 }}>
                        {cert.expires}
                        {cert.status === 'expiring' && daysLeft > 0 && <span style={{ fontSize: 10, marginLeft: 6 }}>({daysLeft} kun)</span>}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, justifyContent: 'center', fontSize: 12, borderRadius: 10 }}
                      onClick={() => window.open('#', '_blank')}
                    >
                      <Download size={12} /> Yuklab olish
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ borderRadius: 10, fontSize: 12 }}
                      onClick={() => setPreviewId(isPreview ? null : cert.id)}
                    >
                      <Eye size={12} /> Ko'rish
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ borderRadius: 10, fontSize: 12 }}>
                      <Share2 size={12} />
                    </button>
                  </div>

                  {/* Certificate Preview (expandable) */}
                  {isPreview && (
                    <div style={{ marginTop: 12, padding: '16px', background: `${cert.color}08`, border: `1px solid ${cert.color}20`, borderRadius: 12, textAlign: 'center' }}>
                      <div style={{ width: 40, height: 40, margin: '0 auto 8px', borderRadius: 10, background: `${cert.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Award size={20} color={cert.color} />
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 4 }}>Sertifikat Namunasi</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Bu sertifikat {cert.holder}ga {cert.issued} sanasida berilgan
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── Right Panel ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 20 }}>

          {/* Achievements */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '-0.2px' }}>
              <Trophy size={15} color="#f59e0b" /> Yutuqlar
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {achievements.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px', background: a.unlocked ? `${a.color}08` : 'var(--surface-1)', border: `1px solid ${a.unlocked ? a.color + '25' : 'var(--border-1)'}`, borderRadius: 12, opacity: a.unlocked ? 1 : 0.5 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${a.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {a.unlocked ? <a.icon size={17} color={a.color} /> : <Lock size={15} color="var(--text-muted)" />}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: a.unlocked ? 'var(--text-primary)' : 'var(--text-muted)' }}>{a.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.desc}</div>
                  </div>
                  {a.unlocked && <CheckCircle size={14} color={a.color} style={{ marginLeft: 'auto', flexShrink: 0 }} />}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={15} color="var(--blue-400)" /> Statistika
            </div>
            {[
              { label: "O'rtacha ball", value: `${avgScore}%`, color: '#8b5cf6' },
              { label: "Faol sertifikatlar", value: counts.active, color: '#22c55e' },
              { label: "Ushbu yil olingan", value: 3, color: '#3b82f6' },
              { label: "Yangilanishi kerak", value: counts.expiring, color: '#f59e0b' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < 3 ? '1px solid var(--border-1)' : 'none' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.label}</span>
                <span style={{ fontWeight: 800, fontSize: 15, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Next Milestone */}
          <div style={{ padding: '20px', background: 'linear-gradient(135deg,rgba(139,92,246,0.1),rgba(59,130,246,0.06))', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 20 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={14} color="#fff" />
              </div>
              <div style={{ fontWeight: 800, fontSize: 13 }}>Keyingi maqsad</div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>
              Sanoat Xavfsizligi sertifikatingiz yangilanishi uchun 30 kun qoldi
            </div>
            <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', fontSize: 12 }}>
              Tayyorlanishni boshlash <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
