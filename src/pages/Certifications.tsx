import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Award, Download, CheckCircle, Clock, AlertCircle,
  Shield, Sparkles, Star, Eye, Trophy,
  TrendingUp, Zap, ChevronRight, Lock, X, RefreshCw,
} from 'lucide-react';
import { useExamStore } from '@/store/exam.store';
import { useAuthStore } from '@/store/auth.store';

const mockCerts = [
  { id: 'mock-1', title: 'Sanoat Xavfsizligi', titleRu: 'Промышленная безопасность', holder: 'Jahongir Toshmatov', issued: '2026-03-15', expires: '2027-03-15', status: 'active', color: '#22c55e', score: 94, category: 'Xavfsizlik' },
  { id: 'mock-2', title: 'ISO 9001 Sifat', titleRu: 'ISO 9001 Качество', holder: 'Kamola Yusupova', issued: '2025-11-01', expires: '2026-11-01', status: 'expiring', color: '#f59e0b', score: 87, category: 'Sifat' },
  { id: 'mock-3', title: 'React Professional', titleRu: 'React Professional', holder: 'Alisher Hasanov', issued: '2026-01-20', expires: '2027-01-20', status: 'active', color: '#3b82f6', score: 91, category: 'Texnologiya' },
  { id: 'mock-4', title: 'Moliyaviy Auditor', titleRu: 'Финансовый аудитор', holder: 'Dilnoza Karimova', issued: '2024-06-10', expires: '2026-06-10', status: 'expired', color: '#ef4444', score: 78, category: 'Moliya' },
  { id: 'mock-5', title: 'Project Manager', titleRu: 'Project Manager', holder: 'Nargiza Sultanova', issued: '2026-02-28', expires: '2027-02-28', status: 'active', color: '#8b5cf6', score: 96, category: 'Boshqaruv' },
  { id: 'mock-6', title: 'DevOps Engineer', titleRu: 'DevOps Engineer', holder: 'Muzaffar Umarov', issued: '2025-09-15', expires: '2026-09-15', status: 'expiring', color: '#06b6d4', score: 82, category: 'Texnologiya' },
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
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);

  const { exams, history, loadExams, loadHistory } = useExamStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (exams.length === 0) loadExams();
    loadHistory();
  }, [loadExams, loadHistory, exams.length]);

  // Find passed attempts
  const passedAttempts = history.filter(h => h.status === 'submitted' && h.passed);

  // Map to certificates
  const realCerts = passedAttempts.map(attempt => {
    const exam = exams.find(e => e.id === attempt.testId);
    const title = exam ? exam.title : 'Imtihon';
    const titleRu = exam ? (exam.titleRu || exam.title) : 'Экзамен';
    const category = exam ? (exam.category || 'Professional') : 'Professional';
    const color = exam ? (exam.color || '#3b82f6') : '#3b82f6';
    
    const issuedDate = new Date(attempt.submittedAt || attempt.startedAt);
    const expiresDate = new Date(issuedDate);
    expiresDate.setFullYear(issuedDate.getFullYear() + 1); // 1 year validity

    const today = new Date();
    const msDiff = expiresDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(msDiff / 86400000);
    
    let status: 'active' | 'expiring' | 'expired' = 'active';
    if (daysLeft <= 0) {
      status = 'expired';
    } else if (daysLeft <= 30) {
      status = 'expiring';
    }

    return {
      id: attempt.id,
      title,
      titleRu,
      holder: user ? `${user.firstName} ${user.lastName}` : 'Xodim',
      issued: issuedDate.toISOString().split('T')[0],
      expires: expiresDate.toISOString().split('T')[0],
      status,
      color,
      score: attempt.score,
      category,
      daysLeft
    };
  });

  const isDemoActive = realCerts.length === 0 || showDemo;
  
  const displayCerts = isDemoActive 
    ? mockCerts.map(c => ({
        ...c,
        holder: user ? `${user.firstName} ${user.lastName}` : c.holder,
        daysLeft: Math.ceil((new Date(c.expires).getTime() - Date.now()) / 86400000)
      }))
    : realCerts;

  const counts = {
    active: displayCerts.filter(c => c.status === 'active').length,
    expiring: displayCerts.filter(c => c.status === 'expiring').length,
    expired: displayCerts.filter(c => c.status === 'expired').length,
  };

  const filtered = filter === 'all' ? displayCerts : displayCerts.filter(c => c.status === filter);
  const avgScore = displayCerts.length > 0 
    ? Math.round(displayCerts.reduce((s, c) => s + c.score, 0) / displayCerts.length) 
    : 0;

  const achievements = [
    { 
      icon: Trophy, 
      label: 'Top Performer', 
      desc: isRu ? '5+ сертификатов' : '5+ sertifikat', 
      color: '#f59e0b', 
      unlocked: displayCerts.length >= 5 
    },
    { 
      icon: Zap, 
      label: 'Speed Learner', 
      desc: isRu ? '3 сертификата за 30 дней' : '30 kunda 3 sertifikat', 
      color: '#3b82f6', 
      unlocked: passedAttempts.filter(h => {
        const d = new Date(h.submittedAt || h.startedAt);
        return (Date.now() - d.getTime()) <= 30 * 86400000;
      }).length >= 3 || (!isDemoActive && displayCerts.length >= 3)
    },
    { 
      icon: Star, 
      label: 'Excellence', 
      desc: isRu ? 'Средний балл 90%+' : '90%+ o\'rtacha ball', 
      color: '#8b5cf6', 
      unlocked: avgScore >= 90 
    },
    { 
      icon: Shield, 
      label: 'Safety Master', 
      desc: isRu ? 'Сертификат безопасности' : 'Xavfsizlik sertifikati', 
      color: '#22c55e', 
      unlocked: displayCerts.some(c => c.category.toLowerCase().includes('xavfsizlik') || c.category.toLowerCase().includes('безопасность')) 
    },
  ];

  const handlePrint = async (cert: any) => {
    const examTitle = cert.title;
    const examTitleRu = cert.titleRu || cert.title;
    const holderName = cert.holder;
    const certId = cert.id;
    const certScore = cert.score;
    const submittedAt = cert.issued;

    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:0;width:888px;background:#f0f2f5;';
    container.innerHTML = `
      <div class="certificate-border" style="width:840px;height:550px;padding:24px;border:14px solid #0d1b2a;background-color:#fff;position:relative;box-sizing:border-box;box-shadow:0 15px 45px rgba(0,0,0,0.15);border-radius:4px;font-family:'Montserrat',sans-serif;">
        <div style="border:2px solid #d4af37;height:100%;padding:35px 40px;text-align:center;box-sizing:border-box;position:relative;background:radial-gradient(circle,#fffcf4 30%,#fbf8ef 70%,#f4ebd0 100%);">
          <div style="position:absolute;top:15px;right:20px;font-family:monospace;font-size:9.5px;color:#aa7c11;font-weight:bold;letter-spacing:0.5px;">No. AGMK-LMS-${certId.toUpperCase()}</div>
          <div style="font-family:'Georgia',serif;font-size:28px;color:#0d1117;letter-spacing:5px;margin-bottom:2px;font-weight:900;">${isRu ? 'СЕРТИФИКАТ' : 'SERTIFIKAT'}</div>
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:5px;color:#aa7c11;margin-bottom:20px;">${isRu ? 'ПОДТВЕРЖДЕНИЕ КВАЛИФИКАЦИИ' : 'KVALIFIKATSIYANI TASDIQLASH'}</div>
          <div style="font-size:22px;color:#aa7c11;margin-bottom:4px;">${isRu ? 'Настоящим подтверждается, что' : 'Ushbu sertifikat egasi'}</div>
          <div style="font-size:34px;font-weight:700;color:#0d1117;border-bottom:2.5px double #d4af37;display:inline-block;padding-bottom:3px;margin-bottom:18px;min-width:360px;">${holderName}</div>
          <div style="font-size:13.5px;line-height:1.7;color:#475569;max-width:580px;margin:0 auto 15px;">
            ${isRu
              ? `успешно прошел(ла) программу оценки знаний по курсу <strong style="color:#0d1117;font-weight:700;">"${examTitleRu}"</strong> с результатом <strong style="color:#0d1117;font-weight:700;">${certScore}%</strong>.`
              : `<strong style="color:#0d1117;font-weight:700;">"${examTitle}"</strong> yo'nalishi bo'yicha imtihondan muvaffaqiyatli o'tib, <strong style="color:#0d1117;font-weight:700;">${certScore}%</strong> natija ko'rsatgani uchun ushbu sertifikat bilan taqdirlanadi.`}
          </div>
          <div style="display:flex;justify-content:space-between;padding:0 40px;margin-top:30px;font-size:11px;color:#64748b;">
            <div style="text-align:center;">
              <div>${submittedAt}</div>
              <div style="border-top:1px solid #cbd5e1;width:130px;margin:5px auto 0;"></div>
              <div style="margin-top:5px;font-weight:bold;color:#475569;">${isRu ? 'Дата выдачи' : 'Berilgan sana'}</div>
            </div>
            <div style="text-align:center;">
              <div style="font-size:18px;color:#1e3a8a;height:22px;line-height:22px;">Alisher Qodirov</div>
              <div style="border-top:1px solid #cbd5e1;width:130px;margin:5px auto 0;"></div>
              <div style="margin-top:5px;font-weight:bold;color:#475569;">${isRu ? 'Директор / Утвердил' : 'Tasdiqlovchi / Direktor'}</div>
            </div>
            <div style="text-align:center;">
              <div style="font-style:italic;font-size:12px;color:#0d1117;font-weight:700;">AGMK LMS</div>
              <div style="border-top:1px solid #cbd5e1;width:130px;margin:5px auto 0;"></div>
              <div style="margin-top:5px;font-weight:bold;color:#475569;">${isRu ? 'Организация' : 'Tashkilot'}</div>
            </div>
          </div>
          <div style="position:absolute;bottom:30px;left:45px;display:flex;gap:10px;align-items:center;">
            <div style="font-size:8px;color:#64748b;font-family:monospace;">
              <div style="font-weight:bold;color:#aa7c11;font-size:9px;margin-bottom:2px;letter-spacing:0.5px;">${isRu ? 'ПРОВЕРИТЬ' : 'TEKSHIRISH'}</div>
              <div>ID: ${certId.toUpperCase()}</div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(container);

    const { default: html2canvas } = await import('html2canvas');
    const { jsPDF } = await import('jspdf');

    const el = container.querySelector('.certificate-border') as HTMLElement;
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#f0f2f5' });
    document.body.removeChild(container);

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [840, 550] });
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 840, 550);
    pdf.save(`AGMK-LMS-${certId.toUpperCase()}.pdf`);

  };

  return (
    <div className="cert-dashboard-root blur-fade">
      {/* ─── Cinematic Certificate Preview Modal ─── */}
      {previewId && (
        <div className="cert-preview-modal-overlay">
          <div className="cert-preview-modal">
            {/* Close Button */}
            <button className="cert-modal-close" onClick={() => setPreviewId(null)}>
              <X size={20} />
            </button>

            {/* Certificate Card */}
            {(() => {
              const cert = displayCerts.find(c => c.id === previewId);
              if (!cert) return null;
              return (
                <div className="cert-view-container">
                  <div className="cert-card-frame">
                    <div className="cert-card-inner">
                      {/* Corner Ornaments */}
                      <div className="corner-ornament corner-tl"></div>
                      <div className="corner-ornament corner-tr"></div>
                      <div className="corner-ornament corner-bl"></div>
                      <div className="corner-ornament corner-br"></div>

                      <div className="cert-serial" style={{ position: 'absolute', top: 12, right: 18, fontFamily: 'monospace', fontSize: '8.5px', color: '#aa7c11', fontWeight: 'bold' }}>
                        No. AGMK-LMS-{cert.id.toUpperCase()}
                      </div>

                      <div className="cert-modal-logo">AGMK LMS</div>
                      <h2 className="cert-modal-header">{isRu ? 'СЕРТИФИКАТ' : 'SERTIFIKAT'}</h2>
                      <div className="cert-modal-sub">{isRu ? 'УСПЕШНО ЗАВЕРШЕН' : 'MUVAFFAQIYATLI YAKUNLANGAN'}</div>

                      <div className="cert-modal-holder-label">{isRu ? 'Настоящий сертификат подтверждает, что' : 'Ushbu sertifikat egasi'}</div>
                      <div className="cert-modal-holder-name">{cert.holder}</div>

                      <div
                        className="cert-modal-description"
                        dangerouslySetInnerHTML={{
                          __html: isRu
                            ? `успешно завершил(а) программу оценки знаний по теме <strong>"${cert.titleRu || cert.title}"</strong> с общим баллом <strong>${cert.score}%</strong>.`
                            : `<strong>"${cert.title}"</strong> yo'nalishi bo'yicha sertifikatlash imtihonidan muvaffaqiyatli o'tib, <strong>${cert.score}%</strong> natija ko'rsatgani tasdiqlanadi.`
                        }}
                      />

                      <div className="cert-modal-meta-row">
                        <div className="cert-meta-col">
                          <div className="cert-meta-val">{cert.issued}</div>
                          <div className="cert-meta-lbl">{isRu ? 'Дата выдачи' : 'Berilgan sana'}</div>
                        </div>
                        <div className="cert-meta-col">
                          <div className="signature-specimen" style={{ fontFamily: 'Pinyon Script', fontSize: '18px', color: '#1e3a8a', height: '22px', lineHeight: '22px', marginBottom: '-4px' }}>Alisher Qodirov</div>
                          <div className="cert-meta-val" style={{ minWidth: '100px' }}></div>
                          <div className="cert-meta-lbl">{isRu ? 'Утвердил' : 'Tasdiqlovchi'}</div>
                        </div>
                        <div className="cert-meta-col">
                          <div className="cert-meta-val">AGMK LMS</div>
                          <div className="cert-meta-lbl">{isRu ? 'Выдано' : 'Tashkilot'}</div>
                        </div>
                      </div>

                      {/* QR Code and ID */}
                      <div style={{ position: 'absolute', bottom: 18, left: 24, display: 'flex', gap: 10, alignItems: 'center', textAlign: 'left' }}>
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=48&data=${encodeURIComponent(window.location.protocol + '//' + window.location.host + '/verify-certificate?id=' + cert.id)}`} 
                          width="48" 
                          height="48" 
                          style={{ border: '1px solid #d4af37', padding: '2px', background: 'white' }} 
                        />
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#aa7c11', fontSize: '8px', letterSpacing: '0.5px' }}>{isRu ? 'ПРОВЕРИТЬ' : 'TEKSHIRISH'}</div>
                          <div style={{ fontSize: '7.5px', color: '#64748b', fontFamily: 'monospace' }}>ID: {cert.id.toUpperCase()}</div>
                        </div>
                      </div>

                      <div className="cert-modal-badge-seal">
                        <div style={{ position: 'absolute', bottom: -8, left: 14, width: 12, height: 35, background: '#a91d22', transform: 'rotate(15deg)', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}></div>
                        <div style={{ position: 'absolute', bottom: -8, right: 14, width: 12, height: 35, background: '#25408f', transform: 'rotate(-15deg)', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}></div>
                        <svg style={{ width: 60, height: 60, filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.15))', position: 'relative', zIndex: 2 }} viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="44" fill="url(#goldGradModal)" stroke="#b8860b" strokeWidth="1"/>
                          <circle cx="50" cy="50" r="38" fill="none" stroke="#fff" strokeDasharray="3 3" strokeWidth="1.5" opacity="0.8"/>
                          <polygon points="50,22 58,38 76,41 63,54 66,72 50,64 34,72 37,54 24,41 42,38" fill="#fff" opacity="0.95"/>
                          <defs>
                            <linearGradient id="goldGradModal" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#f3e0aa" />
                              <stop offset="30%" stopColor="#d4af37" />
                              <stop offset="70%" stopColor="#aa7c11" />
                              <stop offset="100%" stopColor="#ffd700" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons inside modal */}
                  <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center' }}>
                    <button className="btn btn-primary" onClick={() => handlePrint(cert)} style={{ background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)' }}>
                      <Download size={14} /> {isRu ? 'Скачать / Печать PDF' : 'Yuklab olish / Chop etish'}
                    </button>
                    <button className="btn btn-secondary" onClick={() => setPreviewId(null)}>
                      {isRu ? 'Закрыть' : 'Yopish'}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ─── Premium Hero ─── */}
      <div className="cert-hero">
        <div className="cert-hero-bg" />
        <div className="cert-hero-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#f59e0b,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(245,158,11,0.4)' }}>
              <Award size={18} color="#fff" />
            </div>
            <span className="badge badge-amber" style={{ fontSize: 11 }}>
              <Sparkles size={10} /> {isRu ? 'Экосистема сертификации' : 'Sertifikatlash Ekosistemi'}
            </span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 10, background: 'linear-gradient(180deg,#f1f5f9,#94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {isRu ? 'Мои Сертификаты' : 'Mening Sertifikatlarim'}
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', maxWidth: 440, lineHeight: 1.6 }}>
            {isRu 
              ? 'Корпоративная платформа сертификации. Управляйте всеми своими сертификатами в одном месте.'
              : 'Enterprise sertifikatlash platformasi. Barcha sertifikatlaringizni bir joyda boshqaring va karyerangizni kuchaytiring.'}
          </p>
        </div>

        {/* Hero Stats */}
        <div className="cert-hero-stats">
          {[
            { label: isRu ? 'Всего' : 'Jami', value: displayCerts.length, color: 'var(--text-primary)' },
            { label: isRu ? 'Средний балл' : "O'rtacha ball", value: `${avgScore}%`, color: '#8b5cf6' },
            { label: isRu ? 'Активные' : 'Faol', value: counts.active, color: '#22c55e' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '16px 20px', background: 'var(--surface-1)', borderRadius: 16, border: '1px solid var(--border-1)', flex: 1 }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: s.color, letterSpacing: '-0.5px' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Demo Mode Banner / Indicator ─── */}
      {isDemoActive && (
        <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 16, padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={18} color="var(--amber-400)" />
            <span style={{ fontSize: 13, color: 'var(--amber-400)', fontWeight: 500 }}>
              {realCerts.length === 0 
                ? (isRu ? 'У вас пока нет сданных экзаменов. Отображаются демо-данные.' : 'Sizda hozircha topshirilgan imtihonlar yo‘q. Demo ma’lumotlar ko‘rsatilmoqda.')
                : (isRu ? 'Включен демонстрационный режим.' : 'Demo rejim faollashtirilgan.')}
            </span>
          </div>
          {realCerts.length > 0 && (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setShowDemo(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: 'rgba(245,158,11,0.3)', color: 'var(--amber-400)' }}
            >
              <RefreshCw size={12} /> {isRu ? 'Показать реальные' : 'Haqiqiylarni ko‘rsatish'}
            </button>
          )}
        </div>
      )}

      {realCerts.length > 0 && !showDemo && (
        <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 16, padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle size={18} color="var(--green-400)" />
            <span style={{ fontSize: 13, color: 'var(--green-400)', fontWeight: 500 }}>
              {isRu ? 'Отображаются ваши реальные сертификаты.' : 'Sizning haqiqiy sertifikatlaringiz ko‘rsatilmoqda.'}
            </span>
          </div>
          <button 
            className="btn btn-ghost btn-sm"
            onClick={() => setShowDemo(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}
          >
            {isRu ? 'Показать демо' : 'Demo ko‘rsatish'}
          </button>
        </div>
      )}

      {/* ─── Status Filter Tabs ─── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }} className="hide-scrollbar">
        {([
          { key: 'all', label: isRu ? "Все" : "Barchasi", count: displayCerts.length, color: '#3b82f6' },
          { key: 'active', label: isRu ? "Активные" : "Faol", count: counts.active, color: '#22c55e' },
          { key: 'expiring', label: isRu ? "Истекает" : "Tugayapti", count: counts.expiring, color: '#f59e0b' },
          { key: 'expired', label: isRu ? "Просроченные" : "Muddati o'tgan", count: counts.expired, color: '#ef4444' },
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
      </div>

      <div className="r-sidebar-layout">

        {/* ─── Certificate Cards Grid ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 20 }}>
          {filtered.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', background: 'var(--surface-1)', borderRadius: 24, border: '1px solid var(--border-1)' }}>
              <Trophy size={48} color="var(--text-muted)" style={{ opacity: 0.3, marginBottom: 16 }} />
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
                {isRu ? 'Сертификаты не найдены' : 'Sertifikatlar topilmadi'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {isRu ? 'В выбранной категории нет сертификатов.' : 'Tanlangan toifada hech qanday sertifikat mavjud emas.'}
              </div>
            </div>
          ) : (
            filtered.map((cert, idx) => {
              const st = statusMap[cert.status];

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
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{isRu ? 'Балл' : 'Ball'}</div>
                        <div style={{ height: 6, width: 120, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${cert.score}%`, background: `linear-gradient(90deg, ${cert.color}, ${cert.color}88)`, borderRadius: 99 }} />
                        </div>
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: cert.color }}>{cert.score}%</div>
                    </div>

                    {/* Dates */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16, padding: '12px 14px', background: 'var(--surface-1)', borderRadius: 10, border: '1px solid var(--border-1)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{isRu ? 'Дата выдачи' : 'Berilgan sana'}</span>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{cert.issued}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{isRu ? 'Действителен до' : 'Amal qiladi'}</span>
                        <span style={{ color: cert.status === 'expired' ? 'var(--red-400)' : cert.status === 'expiring' ? 'var(--amber-400)' : 'var(--text-secondary)', fontWeight: 700 }}>
                          {cert.expires}
                          {cert.status === 'expiring' && cert.daysLeft > 0 && (
                            <span style={{ fontSize: 10, marginLeft: 6 }}>({cert.daysLeft} {isRu ? 'дн' : 'kun'})</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, justifyContent: 'center', fontSize: 12, borderRadius: 10 }}
                        onClick={() => handlePrint(cert)}
                      >
                        <Download size={12} /> {isRu ? 'Печать' : 'Chop etish'}
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ borderRadius: 10, fontSize: 12 }}
                        onClick={() => setPreviewId(cert.id)}
                      >
                        <Eye size={12} /> {isRu ? 'Смотреть' : 'Ko\'rish'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ─── Right Panel ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 20 }}>

          {/* Achievements */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '-0.2px' }}>
              <Trophy size={15} color="#f59e0b" /> {isRu ? 'Достижения' : 'Yutuqlar'}
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
              <TrendingUp size={15} color="var(--blue-400)" /> {isRu ? 'Статистика' : 'Statistika'}
            </div>
            {[
              { label: isRu ? "Средний балл" : "O'rtacha ball", value: `${avgScore}%`, color: '#8b5cf6' },
              { label: isRu ? "Активные сертификаты" : "Faol sertifikatlar", value: counts.active, color: '#22c55e' },
              { label: isRu ? "Получено в этом году" : "Ushbu yil olingan", value: isDemoActive ? 3 : realCerts.length, color: '#3b82f6' },
              { label: isRu ? "Требует обновления" : "Yangilanishi kerak", value: counts.expiring, color: '#f59e0b' },
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
              <div style={{ fontWeight: 800, fontSize: 13 }}>{isRu ? 'Следующая цель' : 'Keyingi maqsad'}</div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>
              {isRu 
                ? 'Рекомендуем подготовиться к продлению ключевых сертификатов.' 
                : 'Kvalifikatsiyani oshirish uchun tavsiya etilgan imtihonlarni topshiring.'}
            </div>
            <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', fontSize: 12 }} onClick={() => window.location.hash = '#/exams'}>
              {isRu ? 'Начать подготовку' : 'Tayyorgarlikni boshlash'} <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
