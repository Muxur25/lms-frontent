import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Award, Download, CheckCircle, Clock, AlertCircle, Shield, Sparkles, Star,
  Eye, Trophy, TrendingUp, X, RefreshCw,
  BarChart3, Bell, Ban, History, Search, XCircle,
  Share2, QrCode, AlertTriangle, Layers, RotateCcw, Printer,
} from 'lucide-react';
import { useCertificateStore } from '@/store/certificate.store';
import { useExamStore } from '@/store/exam.store';
import { useAuthStore } from '@/store/auth.store';
import { type Certificate } from '@/api/certificates';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';


// ─── Types ────────────────────────────────────────────────────────
type TabId = 'my' | 'verification' | 'analytics' | 'templates' | 'expiration' | 'revoked' | 'history';

interface TabConfig {
  id: TabId;
  labelKey: string;
  icon: any;
  adminOnly?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────
const TABS: TabConfig[] = [
  { id: 'my', labelKey: 'certifications.tabs.my', icon: Award },
  { id: 'verification', labelKey: 'certifications.tabs.verification', icon: Shield },
  { id: 'analytics', labelKey: 'certifications.tabs.analytics', icon: BarChart3 },
  { id: 'templates', labelKey: 'certifications.tabs.templates', icon: Layers, adminOnly: true },
  { id: 'expiration', labelKey: 'certifications.tabs.expiration', icon: Bell },
  { id: 'revoked', labelKey: 'certifications.tabs.revoked', icon: Ban, adminOnly: true },
  { id: 'history', labelKey: 'certifications.tabs.history', icon: History },
];

const STATUS_MAP = {
  active: { labelKey: 'certifications.statusMap.active', cls: 'cert-badge-green', icon: CheckCircle, color: '#22c55e' },
  expiring_soon: { labelKey: 'certifications.statusMap.expiring_soon', cls: 'cert-badge-amber', icon: Clock, color: '#f59e0b' },
  expired: { labelKey: 'certifications.statusMap.expired', cls: 'cert-badge-red', icon: AlertCircle, color: '#ef4444' },
  revoked: { labelKey: 'certifications.statusMap.revoked', cls: 'cert-badge-gray', icon: Ban, color: '#6b7280' },
};

const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#6b7280', '#3b82f6', '#8b5cf6'];

const certFallbacks: Record<string, string> = {
  'certifications.eyebrow': 'Sertifikatlar',
  'certifications.title': 'Sertifikat boshqaruvi',
  'certifications.subtitle': 'QR tekshiruvi, analitika va sertifikatlarni boshqarish.',
  'certifications.loading': 'Sertifikatlar yuklanmoqda...',
  'certifications.score': 'Natija',
  'certifications.searchPlaceholder': 'Sertifikat qidirish...',
  'certifications.noCertsTitle': 'Sertifikatlar topilmadi',
  'certifications.noCertsDesc': 'Filtr yoki qidiruv shartlarini o\'zgartirib ko\'ring.',
  'certifications.tabs.my': 'Mening sertifikatlarim',
  'certifications.tabs.verification': 'Tekshirish markazi',
  'certifications.tabs.analytics': 'Analitika',
  'certifications.tabs.templates': 'Shablonlar',
  'certifications.tabs.expiration': 'Muddatlar',
  'certifications.tabs.revoked': 'Bekor qilingan',
  'certifications.tabs.history': 'Yuklash tarixi',
  'certifications.statusMap.active': 'Faol',
  'certifications.statusMap.expiring_soon': 'Tugayapti',
  'certifications.statusMap.expired': 'Muddati o\'tgan',
  'certifications.statusMap.revoked': 'Bekor qilingan',
  'certifications.card.issued': 'Berilgan',
  'certifications.card.expires': 'Amal qiladi',
  'certifications.card.download': 'Yuklab olish',
  'certifications.card.view': 'Ko\'rish',
  'certifications.filter.all': 'Barchasi',
  'certifications.filter.active': 'Faol',
  'certifications.filter.expiring_soon': 'Tugayapti',
  'certifications.filter.expired': 'Muddati o\'tgan',
  'certifications.pdf.certTitle': 'SERTIFIKAT',
  'certifications.pdf.completed': 'MUVAFFAQIYATLI YAKUNLANGAN',
  'certifications.pdf.holderLabel': 'Ushbu sertifikat egasi',
  'certifications.pdf.desc': '{{title}} yo\'nalishi bo\'yicha imtihondan muvaffaqiyatli o\'tib, {{score}} natija ko\'rsatgani tasdiqlanadi.',
  'certifications.pdf.issued': 'Berilgan sana',
  'certifications.pdf.authorizer': 'Tasdiqlovchi',
  'certifications.pdf.expires': 'Amal qiladi',
  'certifications.pdf.verify': 'TEKSHIRISH',
  'certifications.pdf.unlimited': 'Muddatsiz',
  'certifications.verification.error': 'Sertifikatni tekshirishda xato yuz berdi',
  'certifications.verification.title': 'Tekshirish markazi',
  'certifications.verification.sub': 'Darhol tekshirish uchun sertifikat ID yoki UUID kiriting',
  'certifications.verification.placeholder': 'AGMK-2026-000001 yoki UUID...',
  'certifications.verification.btn': 'Tekshirish',
  'certifications.verification.hint': 'Avtomatik tekshirish uchun sertifikatdagi QR kodni skaner qiling',
  'certifications.verification.valid': 'Haqiqiy sertifikat',
  'certifications.verification.invalid': 'Haqiqiy emas',
  'certifications.verification.status': 'Holat: {{status}}',
  'certifications.verification.holder': 'Sertifikat egasi',
  'certifications.verification.course': 'Kurs / imtihon',
  'certifications.verification.score': 'Natija',
  'certifications.verification.issued': 'Berilgan sana',
  'certifications.verification.expires': 'Amal qiladi',
  'certifications.verification.revokeReasonLabel': 'Bekor qilish sababi: ',
  'certifications.analytics.total': 'Jami',
  'certifications.analytics.active': 'Faol',
  'certifications.analytics.expiring': 'Tugayapti',
  'certifications.analytics.expired': 'Muddati o\'tgan',
  'certifications.analytics.revoked': 'Bekor qilingan',
  'certifications.analytics.avgScore': 'O\'rtacha ball',
  'certifications.analytics.trend': 'Oylik trend',
  'certifications.analytics.category': 'Kategoriya bo\'yicha',
  'certifications.analytics.department': 'Bo\'limlar bo\'yicha',
  'certifications.templates.default': 'Default',
  'certifications.templates.loading': 'Shablonlar yuklanmoqda...',
  'certifications.expiration.days': '{{days}} kun',
  'certifications.expiration.expiredLabel': 'Tugagan',
  'certifications.expiration.soon': 'Tez orada tugaydi ({{count}})',
  'certifications.expiration.noSoon': 'Tugayotgan sertifikatlar yo\'q',
  'certifications.expiration.expired': 'Muddati o\'tganlar ({{count}})',
  'certifications.expiration.noExpired': 'Muddati o\'tgan sertifikatlar yo\'q',
  'certifications.revoked.warning': 'Bekor qilingan sertifikatlar',
  'certifications.revoked.noData': 'Bekor qilingan sertifikatlar yo\'q',
  'certifications.revoked.reason': 'Sabab: {{reason}}',
  'certifications.revoked.restore': 'Qaytarish',
  'certifications.history.noData': 'Tarix bo\'sh',
  'certifications.history.desc': 'Sertifikat amallari bu yerda ko\'rinadi',
};

const ct = (
  t: (key: string, options?: Record<string, unknown>) => string,
  key: string,
  values?: Record<string, string | number>,
) => t(key, { defaultValue: certFallbacks[key] || key.split('.').pop() || key, ...(values || {}) });


// ─── PDF Print Helper ──────────────────────────────────────────────
async function printCertificate(cert: Certificate, t: any, isRu: boolean, holderOverride?: string) {
  const holder = holderOverride || cert.holderName;
  const title = isRu ? cert.examTitleRu : cert.examTitle;
  const certId = cert.certificateId || cert.id;
  const issued = new Date(cert.issuedAt).toISOString().split('T')[0];
  const expires = cert.expiresAt ? new Date(cert.expiresAt).toISOString().split('T')[0] : ct(t, 'certifications.pdf.unlimited');
  const trainer = cert.trainerName || 'AGMK LMS';
  const primaryColor = cert.color || '#d4af37';

  const html = `
    <div class="cb" style="width:840px;height:550px;padding:24px;border:14px solid #0d1b2a;background:#fff;position:relative;box-sizing:border-box;font-family:'Montserrat',sans-serif;">
      <div style="border:2px solid ${primaryColor};height:100%;padding:28px 36px;text-align:center;box-sizing:border-box;position:relative;background:radial-gradient(circle,#fffcf4 30%,#fbf8ef 70%,#f4ebd0 100%);">

        <!-- Corner Ornaments (Standard HTML divs for html2canvas compatibility) -->
        <!-- Top-Left Ornament -->
        <div style="position:absolute;top:10px;left:10px;width:25px;height:25px;border-top:2px solid ${primaryColor};border-left:2px solid ${primaryColor};box-sizing:border-box;"></div>
        <div style="position:absolute;top:13px;left:13px;width:15px;height:15px;border-top:1px solid #aa7c11;border-left:1px solid #aa7c11;box-sizing:border-box;"></div>

        <!-- Top-Right Ornament -->
        <div style="position:absolute;top:10px;right:10px;width:25px;height:25px;border-top:2px solid ${primaryColor};border-right:2px solid ${primaryColor};box-sizing:border-box;"></div>
        <div style="position:absolute;top:13px;right:13px;width:15px;height:15px;border-top:1px solid #aa7c11;border-right:1px solid #aa7c11;box-sizing:border-box;"></div>

        <!-- Bottom-Left Ornament -->
        <div style="position:absolute;bottom:10px;left:10px;width:25px;height:25px;border-bottom:2px solid ${primaryColor};border-left:2px solid ${primaryColor};box-sizing:border-box;"></div>
        <div style="position:absolute;bottom:13px;left:13px;width:15px;height:15px;border-bottom:1px solid #aa7c11;border-left:1px solid #aa7c11;box-sizing:border-box;"></div>

        <!-- Bottom-Right Ornament -->
        <div style="position:absolute;bottom:10px;right:10px;width:25px;height:25px;border-bottom:2px solid ${primaryColor};border-right:2px solid ${primaryColor};box-sizing:border-box;"></div>
        <div style="position:absolute;bottom:13px;right:13px;width:15px;height:15px;border-bottom:1px solid #aa7c11;border-right:1px solid #aa7c11;box-sizing:border-box;"></div>

        <!-- Top Info -->
        <div style="position:absolute;top:11px;right:17px;font-family:monospace;font-size:8px;color:#aa7c11;font-weight:bold;">№ ${certId}</div>
        <div style="position:absolute;top:12px;left:16px;font-size:9px;font-weight:900;letter-spacing:1.5px;color:#aa7c11;text-transform:uppercase;">AGMK LMS</div>

        <!-- Content -->
        <h2 style="font-family:'Georgia',serif;font-size:24px;color:#0d1117;letter-spacing:5px;font-weight:900;margin-top:10px;margin-bottom:2px;text-align:center;">${ct(t, 'certifications.pdf.certTitle')}</h2>
        <div style="font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:5px;color:#aa7c11;margin-bottom:16px;text-align:center;">${ct(t, 'certifications.pdf.completed') || 'MUVAFFAQIYATLI YAKUNLANGAN'}</div>

        <div style="font-size:12px;color:#64748b;margin-bottom:4px;text-align:center;">${ct(t, 'certifications.pdf.holderLabel')}</div>
        <div style="font-size:26px;font-weight:800;color:#0d1117;border-bottom:2px double ${primaryColor};display:inline-block;padding-bottom:3px;margin-bottom:14px;min-width:280px;letter-spacing:-0.5px;text-align:center;">${holder}</div>

        <div style="font-size:11.5px;line-height:1.7;color:#475569;max-width:500px;margin:0 auto 12px;text-align:center;">
          ${ct(t, 'certifications.pdf.desc', {
            title: `<strong style="color:#0d1117">"${title}"</strong>`,
            score: `<strong style="color:#0d1117">${cert.score}%</strong>`
          })}
        </div>

        <!-- Meta row -->
        <div style="display:flex;justify-content:space-between;padding:0 24px;margin-top:20px;font-size:10px;color:#64748b;">
          <div style="text-align:center;">
            <div style="font-size:11px;font-weight:700;color:#0d1117;margin-bottom:3px;">${issued}</div>
            <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;font-weight:700;border-top:1px solid #cbd5e1;padding-top:4px;width:100px;margin:0 auto;">${ct(t, 'certifications.pdf.issued')}</div>
          </div>
          <div style="text-align:center;">
            <div style="font-family:'Georgia',serif;font-size:16px;color:#1e3a8a;font-style:italic;margin-bottom:3px;">${trainer}</div>
            <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;font-weight:700;border-top:1px solid #cbd5e1;padding-top:4px;width:100px;margin:0 auto;">${ct(t, 'certifications.pdf.authorizer')}</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:11px;font-weight:700;color:#0d1117;margin-bottom:3px;">${expires}</div>
            <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;font-weight:700;border-top:1px solid #cbd5e1;padding-top:4px;width:100px;margin:0 auto;">${ct(t, 'certifications.pdf.expires')}</div>
          </div>
        </div>

        <!-- QR Code bottom-left -->
        <div style="position:absolute;bottom:16px;left:22px;display:flex;gap:8px;align-items:center;text-align:left;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=52&data=${encodeURIComponent(window.location.protocol + '//' + window.location.host + '/verify-certificate?id=' + certId)}" width="52" height="52" style="border:1px solid ${primaryColor};padding:2px;background:#fff;" />
          <div>
            <div style="font-weight:bold;color:#aa7c11;font-size:8px;letter-spacing:0.5px;">${ct(t, 'certifications.pdf.verify')}</div>
            <div style="font-size:7px;color:#64748b;font-family:monospace;">${certId}</div>
          </div>
        </div>

        <!-- Gold Seal Badge bottom-right -->
        <div style="position:absolute;bottom:20px;right:24px;">
          <svg style="width:60px;height:60px;filter:drop-shadow(0 3px 5px rgba(0,0,0,0.15));" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="url(#gold-g-print)" stroke="#b8860b" stroke-width="1" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="#fff" stroke-dasharray="3 3" stroke-width="1.5" opacity="0.8" />
            <polygon points="50,22 58,38 76,41 63,54 66,72 50,64 34,72 37,54 24,41 42,38" fill="#fff" opacity="0.95" />
            <defs>
              <linearGradient id="gold-g-print" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#f3e0aa" />
                <stop offset="30%" stop-color="#d4af37" />
                <stop offset="70%" stop-color="#aa7c11" />
                <stop offset="100%" stop-color="#ffd700" />
              </linearGradient>
            </defs>
          </svg>
        </div>

      </div>
    </div>`;

  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:890px;background:#f0f2f5;';
  container.innerHTML = html;
  document.body.appendChild(container);

  const { default: html2canvas } = await import('html2canvas');
  const { jsPDF } = await import('jspdf');
  const el = container.querySelector('.cb') as HTMLElement;
  const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#f0f2f5' });
  document.body.removeChild(container);
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [840, 550] });
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 840, 550);
  pdf.save(`${certId}.pdf`);
}

// ─── Sub-components ────────────────────────────────────────────────

function CertificateCardView({ cert, onView, onDownload, isDownloading }: {
  cert: Certificate;
  onView: (cert: Certificate) => void;
  onDownload: (cert: Certificate) => void;
  isDownloading?: boolean;
}) {
  const { t } = useTranslation();
  const st = STATUS_MAP[cert.status] || STATUS_MAP.active;
  const daysLeft = cert.expiresAt
    ? Math.ceil((new Date(cert.expiresAt).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="cert-card-premium" style={{ animationDelay: '0.05s' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${cert.color || '#3b82f6'}, ${cert.color || '#3b82f6'}55)`, borderRadius: '20px 20px 0 0' }} />
      <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: cert.color || '#3b82f6', filter: 'blur(50px)', opacity: 0.07, borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${cert.color || '#3b82f6'}15`, border: `1px solid ${cert.color || '#3b82f6'}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Award size={20} color={cert.color || '#3b82f6'} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>{cert.category || 'Professional'}</div>
              <div style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--text-primary)', lineHeight: 1.3 }}>{t('common.language') === 'ru' ? cert.examTitleRu : cert.examTitle}</div>
            </div>
          </div>
          <span style={{ fontSize: 10, padding: '4px 8px', borderRadius: 99, background: `${st.color}15`, border: `1px solid ${st.color}30`, color: st.color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <st.icon size={9} />{ct(t, st.labelKey)}
          </span>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>{cert.holderName}</div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ct(t, 'certifications.score')}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: cert.color || '#3b82f6' }}>{cert.score}%</div>
        </div>
        <div style={{ height: 5, width: '100%', background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ height: '100%', width: `${cert.score}%`, background: `linear-gradient(90deg, ${cert.color || '#3b82f6'}, ${cert.color || '#3b82f6'}88)`, borderRadius: 99 }} />
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 14, padding: '10px 12px', background: 'var(--surface-1)', borderRadius: 9, border: '1px solid var(--border-1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>{ct(t, 'certifications.card.issued')}</span>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{new Date(cert.issuedAt).toLocaleDateString()}</span>
          </div>
          {cert.expiresAt && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{ct(t, 'certifications.card.expires')}</span>
              <span style={{ fontWeight: 700, color: cert.status === 'expired' ? '#ef4444' : cert.status === 'expiring_soon' ? '#f59e0b' : 'var(--text-secondary)' }}>
                {new Date(cert.expiresAt).toLocaleDateString()}
                {cert.status === 'expiring_soon' && daysLeft && daysLeft > 0 && <span style={{ fontSize: 9, marginLeft: 5 }}>({ct(t, 'certifications.expiration.days', { days: daysLeft })})</span>}
              </span>
            </div>
          )}
        </div>

        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 12, fontFamily: 'monospace', background: 'var(--surface-1)', padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border-1)' }}>
          ID: {cert.certificateId}
        </div>

        <div style={{ display: 'flex', gap: 7 }}>
          <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: 11, borderRadius: 9, opacity: isDownloading ? 0.7 : 1 }} onClick={() => onDownload(cert)} disabled={isDownloading}>
            {isDownloading ? (
              <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Download size={11} />
            )}
            {' '}
            {ct(t, 'certifications.card.download')}
          </button>
          <button className="btn btn-ghost btn-sm" style={{ borderRadius: 9, fontSize: 11 }} onClick={() => onView(cert)} disabled={isDownloading}>
            <Eye size={11} /> {ct(t, 'certifications.card.view')}
          </button>
        </div>
      </div>
    </div>
  );
}

function CertificateModal({ cert, onClose, onDownload }: {
  cert: Certificate; onClose: () => void; onDownload: (cert: Certificate) => void;
}) {
  const { t } = useTranslation();
  const verifyUrl = `${window.location.protocol}//${window.location.host}/verify-certificate?id=${cert.certificateId}`;
  const primaryColor = cert.color || '#d4af37';
  const examTitle = t('common.language') === 'ru' ? (cert.examTitleRu || cert.examTitle) : cert.examTitle;

  return (
    <div className="cert-preview-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cert-preview-modal">
        <button className="cert-modal-close" onClick={onClose}><X size={20} /></button>
        <div className="cert-view-container">
          <div className="cert-card-frame">
            <div className="cert-card-inner">
              <div className="corner-ornament corner-tl" /><div className="corner-ornament corner-tr" />
              <div className="corner-ornament corner-bl" /><div className="corner-ornament corner-br" />
              <div style={{ position: 'absolute', top: 11, right: 17, fontFamily: 'monospace', fontSize: '8px', color: '#aa7c11', fontWeight: 'bold' }}>№ {cert.certificateId}</div>
              <div className="cert-modal-logo">AGMK LMS</div>
              <h2 className="cert-modal-header">{ct(t, 'certifications.pdf.certTitle')}</h2>
              <div className="cert-modal-sub">{ct(t, 'certifications.pdf.completed') || 'MUVAFFAQIYATLI YAKUNLANGAN'}</div>
              <div className="cert-modal-holder-label">{ct(t, 'certifications.pdf.holderLabel')}</div>
              <div className="cert-modal-holder-name">{cert.holderName}</div>
              <div className="cert-modal-description" dangerouslySetInnerHTML={{
                __html: ct(t, 'certifications.pdf.desc', {
                  title: `<strong>"${examTitle}"</strong>`,
                  score: `<strong>${cert.score}%</strong>`
                })
              }} />
              <div className="cert-modal-meta-row">
                <div className="cert-meta-col">
                  <div className="cert-meta-val">{new Date(cert.issuedAt).toLocaleDateString()}</div>
                  <div className="cert-meta-lbl">{ct(t, 'certifications.pdf.issued')}</div>
                </div>
                <div className="cert-meta-col">
                  <div style={{ fontFamily: 'Georgia', fontSize: 16, color: '#1e3a8a', fontStyle: 'italic' }}>{cert.trainerName || 'AGMK LMS'}</div>
                  <div className="cert-meta-lbl">{ct(t, 'certifications.pdf.authorizer')}</div>
                </div>
                <div className="cert-meta-col">
                  <div className="cert-meta-val">{cert.expiresAt ? new Date(cert.expiresAt).toLocaleDateString() : ct(t, 'certifications.pdf.unlimited')}</div>
                  <div className="cert-meta-lbl">{ct(t, 'certifications.pdf.expires')}</div>
                </div>
              </div>
              <div style={{ position: 'absolute', bottom: 16, left: 22, display: 'flex', gap: 8, alignItems: 'center' }}>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=52&data=${encodeURIComponent(verifyUrl)}`} width="52" height="52" style={{ border: `1px solid ${primaryColor}`, padding: 2, background: '#fff' }} />
                <div>
                  <div style={{ fontWeight: 'bold', color: '#aa7c11', fontSize: '8px', letterSpacing: '0.5px' }}>{ct(t, 'certifications.pdf.verify')}</div>
                  <div style={{ fontSize: '7px', color: '#64748b', fontFamily: 'monospace' }}>{cert.certificateId}</div>
                </div>
              </div>
              <div className="cert-modal-badge-seal">
                <svg style={{ width: 60, height: 60, filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.15))' }} viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="url(#gold-g)" stroke="#b8860b" strokeWidth="1" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#fff" strokeDasharray="3 3" strokeWidth="1.5" opacity="0.8" />
                  <polygon points="50,22 58,38 76,41 63,54 66,72 50,64 34,72 37,54 24,41 42,38" fill="#fff" opacity="0.95" />
                  <defs><linearGradient id="gold-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f3e0aa" /><stop offset="30%" stopColor="#d4af37" /><stop offset="70%" stopColor="#aa7c11" /><stop offset="100%" stopColor="#ffd700" /></linearGradient></defs>
                </svg>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => onDownload(cert)} style={{ background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', gap: 7 }}>
              <Download size={14} /> {t('common.download')} PDF
            </button>
            <button className="btn btn-secondary" onClick={() => { navigator.clipboard?.writeText(verifyUrl); }}>
              <Share2 size={14} /> {t('common.share')}
            </button>
            <button className="btn btn-ghost" onClick={onClose}>{t('common.close')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TAB: My Certificates ──────────────────────────────────────────
function TabMyCerts({ certs, isRu, loading }: { certs: Certificate[]; isRu: boolean; loading: boolean }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'active' | 'expiring_soon' | 'expired'>('all');
  const [search, setSearch] = useState('');
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const { trackAction } = useCertificateStore();

  const filtered = certs
    .filter(c => filter === 'all' || c.status === filter)
    .filter(c => !search || (isRu ? c.examTitleRu : c.examTitle).toLowerCase().includes(search.toLowerCase()) || c.certificateId.toLowerCase().includes(search.toLowerCase()));

  const counts = {
    active: certs.filter(c => c.status === 'active').length,
    expiring_soon: certs.filter(c => c.status === 'expiring_soon').length,
    expired: certs.filter(c => c.status === 'expired').length,
  };

  const handleDownload = async (cert: Certificate) => {
    setDownloading(cert.id);
    try {
      await printCertificate(cert, t, isRu);
      await trackAction(cert.id, 'download');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
      <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: 16, color: '#3b82f6' }} />
      <div>{ct(t, 'certifications.loading')}</div>
    </div>
  );

  return (
    <>
      {previewCert && <CertificateModal cert={previewCert} onClose={() => setPreviewCert(null)} onDownload={handleDownload} />}

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder={ct(t, 'certifications.searchPlaceholder')}
            style={{ width: '100%', height: 40, paddingLeft: 36, paddingRight: 12, background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 13 }}
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          { key: 'all', labelKey: 'certifications.filter.all', count: certs.length, color: '#3b82f6' },
          { key: 'active', labelKey: 'certifications.filter.active', count: counts.active, color: '#22c55e' },
          { key: 'expiring_soon', labelKey: 'certifications.filter.expiring_soon', count: counts.expiring_soon, color: '#f59e0b' },
          { key: 'expired', labelKey: 'certifications.filter.expired', count: counts.expired, color: '#ef4444' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key as any)} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px',
            background: filter === tab.key ? `${tab.color}15` : 'var(--surface-1)',
            border: `1px solid ${filter === tab.key ? tab.color + '35' : 'var(--border-1)'}`,
            borderRadius: 99, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
            color: filter === tab.key ? tab.color : 'var(--text-secondary)', fontWeight: filter === tab.key ? 700 : 500, fontSize: 12,
          }}>
            {ct(t, tab.labelKey)}
            <span style={{ fontSize: 10, fontWeight: 800, background: filter === tab.key ? tab.color : 'var(--surface-2)', color: filter === tab.key ? '#fff' : 'var(--text-muted)', padding: '1px 6px', borderRadius: 99 }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 270px), 1fr))', gap: 18 }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', background: 'var(--surface-1)', borderRadius: 20, border: '1px solid var(--border-1)' }}>
            <Trophy size={44} style={{ opacity: 0.2, marginBottom: 14, color: 'var(--text-muted)' }} />
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{ct(t, 'certifications.noCertsTitle')}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ct(t, 'certifications.noCertsDesc')}</div>
          </div>
        ) : filtered.map(cert => (
          <CertificateCardView key={cert.id} cert={cert}
            onView={() => setPreviewCert(cert)}
            onDownload={handleDownload}
            isDownloading={downloading === cert.id}
          />
        ))}
      </div>
    </>
  );
}

// ─── TAB: Verification ────────────────────────────────────────────
function TabVerification() {
  const { t, i18n } = useTranslation();
  const isRu = i18n.language === 'ru';
  const [inputId, setInputId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputId.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const { verifyCertificate } = await import('@/api/certificates');
      const data = await verifyCertificate(inputId.trim());
      setResult(data);
    } catch {
      setError(ct(t, 'certifications.verification.error'));
    } finally {
      setLoading(false);
    }
  };

  const isValid = result?.valid;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 30px rgba(59,130,246,0.3)' }}>
          <Shield size={28} color="#fff" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>{ct(t, 'certifications.verification.title')}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>
          {ct(t, 'certifications.verification.sub')}
        </p>
      </div>

      <form onSubmit={handleVerify} style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 10, background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: 16, padding: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={inputId} onChange={e => setInputId(e.target.value)}
              placeholder={ct(t, 'certifications.verification.placeholder')}
              style={{ width: '100%', height: 44, paddingLeft: 38, paddingRight: 12, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'monospace' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: 120, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
            {loading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <><Shield size={14} /> {ct(t, 'certifications.verification.btn')}</>}
          </button>
        </div>
      </form>

      {/* QR hint */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 12, marginBottom: 24, fontSize: 12, color: 'var(--text-muted)' }}>
        <QrCode size={16} color="#3b82f6" />
        {ct(t, 'certifications.verification.hint')}
      </div>

      {error && (
        <div style={{ padding: '16px 20px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, display: 'flex', gap: 12, alignItems: 'center', color: '#ef4444', fontSize: 13 }}>
          <AlertCircle size={18} />{error}
        </div>
      )}

      {result && (
        <div style={{ borderRadius: 20, border: `1px solid ${isValid ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`, background: isValid ? 'rgba(34,197,94,0.04)' : 'rgba(239,68,68,0.04)', overflow: 'hidden', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${isValid ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}`, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: isValid ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isValid ? <CheckCircle size={26} color="#22c55e" /> : <XCircle size={26} color="#ef4444" />}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: isValid ? '#22c55e' : '#ef4444' }}>{isValid ? ct(t, 'certifications.verification.valid') : ct(t, 'certifications.verification.invalid')}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ct(t, 'certifications.verification.status', { status: ct(t, `certifications.statusMap.${result.status}`) })}</div>
            </div>
          </div>
          {result.certificate && (
            <div style={{ padding: '20px 24px' }}>
              {[
                { label: ct(t, 'certifications.verification.holder'), value: result.certificate.holderName },
                { label: ct(t, 'certifications.verification.course'), value: isRu ? result.certificate.examTitleRu : result.certificate.examTitle },
                { label: ct(t, 'certifications.verification.score'), value: `${result.certificate.score}%` },
                { label: ct(t, 'certifications.verification.issued'), value: new Date(result.certificate.issuedAt).toLocaleDateString() },
                { label: ct(t, 'certifications.verification.expires'), value: result.certificate.expiresAt ? new Date(result.certificate.expiresAt).toLocaleDateString() : ct(t, 'certifications.pdf.unlimited') },
                { label: 'ID', value: result.certificate.certificateId },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 5 ? '1px solid var(--border-1)' : 'none', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.value}</span>
                </div>
              ))}
              {result.certificate.revokeReason && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.06)', borderRadius: 10, fontSize: 12, color: '#ef4444' }}>
                  <strong>{ct(t, 'certifications.verification.revokeReasonLabel') || (isRu ? 'Причина отзыва: ' : 'Bekor qilish sababi: ')}</strong>{result.certificate.revokeReason}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── TAB: Analytics ───────────────────────────────────────────────
function TabAnalytics() {
  const { t } = useTranslation();
  const { analytics, analyticsLoading, loadAnalytics } = useCertificateStore();

  useEffect(() => { loadAnalytics(); }, []);

  if (analyticsLoading) return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', color: '#3b82f6', marginBottom: 16 }} />
    </div>
  );

  if (!analytics) return null;

  const { totals, byDepartment, byCategory, monthlyTrend, avgScore } = analytics;

  const kpiCards = [
    { label: ct(t, 'certifications.analytics.total'), value: totals.total, color: '#3b82f6', icon: Award },
    { label: ct(t, 'certifications.analytics.active'), value: totals.active, color: '#22c55e', icon: CheckCircle },
    { label: ct(t, 'certifications.analytics.expiring'), value: totals.expiring, color: '#f59e0b', icon: Clock },
    { label: ct(t, 'certifications.analytics.expired'), value: totals.expired, color: '#ef4444', icon: AlertCircle },
    { label: ct(t, 'certifications.analytics.revoked'), value: totals.revoked, color: '#6b7280', icon: Ban },
    { label: ct(t, 'certifications.analytics.avgScore'), value: `${avgScore}%`, color: '#8b5cf6', icon: Star },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 160px), 1fr))', gap: 14 }}>
        {kpiCards.map((k, i) => (
          <div key={i} className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: `${k.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <k.icon size={16} color={k.color} />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {/* Monthly Trend */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={15} color="#3b82f6" />{ct(t, 'certifications.analytics.trend')}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border-1)', borderRadius: 10, fontSize: 12 }} />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* By Category Pie */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={15} color="#8b5cf6" />{ct(t, 'certifications.analytics.category')}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byCategory} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${typeof percent === 'number' ? (percent * 100).toFixed(0) : 0}%`} labelLine={false}>
                {byCategory.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border-1)', borderRadius: 10, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* By Department Bar */}
      {byDepartment.length > 0 && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={15} color="#22c55e" />{ct(t, 'certifications.analytics.department')}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byDepartment.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border-1)', borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ─── TAB: Templates ───────────────────────────────────────────────
function TabTemplates() {
  const { t, i18n } = useTranslation();
  const isRu = i18n.language === 'ru';
  const { templates, loadTemplates } = useCertificateStore();

  useEffect(() => { loadTemplates(); }, []);

  const typeColors: Record<string, string> = {
    corporate: '#d4af37', safety: '#22c55e', technical: '#3b82f6', webinar: '#8b5cf6', custom: '#f59e0b',
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: 18 }}>
        {templates.map(tmpl => (
          <div key={tmpl.id} className="card" style={{ padding: 20, cursor: 'pointer', transition: 'transform 0.2s', border: tmpl.isDefault ? '1px solid rgba(212,175,55,0.3)' : undefined }}
            onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseOut={e => (e.currentTarget.style.transform = 'none')}>
            {/* Preview */}
            <div style={{ height: 120, borderRadius: 12, marginBottom: 14, position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${tmpl.accentColor}22, ${tmpl.primaryColor}11)`, border: `2px solid ${tmpl.borderColor}33` }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${tmpl.primaryColor}20`, border: `1px solid ${tmpl.primaryColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={16} color={tmpl.primaryColor} />
                </div>
                <div style={{ fontSize: 10, fontWeight: 800, color: tmpl.primaryColor, letterSpacing: '1.5px' }}>{ct(t, 'certifications.pdf.certTitle')}</div>
                <div style={{ width: 60, height: 1, background: tmpl.primaryColor, opacity: 0.4 }} />
                <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>AGMK LMS • {new Date().getFullYear()}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13.5, marginBottom: 4 }}>{isRu ? tmpl.nameRu : tmpl.name}</div>
                <div style={{
                  fontSize: 10,
                  padding: '2px 8px',
                  borderRadius: 99,
                  background: `${typeColors[tmpl.type] || '#6b7280'}15`,
                  border: `1px solid ${typeColors[tmpl.type] || '#6b7280'}30`,
                  color: typeColors[tmpl.type] || '#6b7280',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  display: 'inline-block',
                  marginTop: 4
                }}>
                  {tmpl.type}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {tmpl.isDefault && <span style={{ fontSize: 9, padding: '3px 7px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 99, color: '#d4af37', fontWeight: 700 }}>{ct(t, 'certifications.templates.default')}</span>}
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: tmpl.primaryColor, boxShadow: `0 0 8px ${tmpl.primaryColor}55` }} />
              </div>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <Layers size={40} style={{ opacity: 0.2, marginBottom: 14 }} />
            <div>{ct(t, 'certifications.templates.loading')}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TAB: Expiration ──────────────────────────────────────────────
function TabExpiration({ certs }: { certs: Certificate[] }) {
  const { t, i18n } = useTranslation();
  const isRu = i18n.language === 'ru';
  const expiring = certs.filter(c => c.status === 'expiring_soon' && c.expiresAt)
    .sort((a, b) => new Date(a.expiresAt!).getTime() - new Date(b.expiresAt!).getTime());
  const expired = certs.filter(c => c.status === 'expired')
    .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());

  const ExpirationRow = ({ cert }: { cert: Certificate }) => {
    const daysLeft = cert.expiresAt ? Math.ceil((new Date(cert.expiresAt).getTime() - Date.now()) / 86400000) : null;
    const isExpired = cert.status === 'expired';
    const color = isExpired ? '#ef4444' : daysLeft !== null && daysLeft <= 7 ? '#ef4444' : '#f59e0b';

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--surface-1)', border: `1px solid ${color}20`, borderRadius: 14, marginBottom: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {isExpired ? <AlertCircle size={18} color={color} /> : <Clock size={18} color={color} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isRu ? cert.examTitleRu : cert.examTitle}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cert.holderName} • {cert.certificateId}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color, letterSpacing: '-0.5px' }}>
            {isExpired ? ct(t, 'certifications.expiration.expiredLabel') : ct(t, 'certifications.expiration.days', { days: daysLeft ?? 0 })}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{cert.expiresAt ? new Date(cert.expiresAt).toLocaleDateString() : ''}</div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <div>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#f59e0b' }}>
          <AlertTriangle size={16} />{ct(t, 'certifications.expiration.soon', { count: expiring.length })}
        </div>
        {expiring.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--surface-1)', borderRadius: 16, fontSize: 13 }}>
            {ct(t, 'certifications.expiration.noSoon')}
          </div>
        ) : expiring.map(c => <ExpirationRow key={c.id} cert={c} />)}
      </div>
      <div>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444' }}>
          <AlertCircle size={16} />{ct(t, 'certifications.expiration.expired', { count: expired.length })}
        </div>
        {expired.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--surface-1)', borderRadius: 16, fontSize: 13 }}>
            {ct(t, 'certifications.expiration.noExpired')}
          </div>
        ) : expired.map(c => <ExpirationRow key={c.id} cert={c} />)}
      </div>
    </div>
  );
}

// ─── TAB: Revoked ─────────────────────────────────────────────────
function TabRevoked() {
  const { t, i18n } = useTranslation();
  const isRu = i18n.language === 'ru';
  const { allCerts, loadAllCerts, restoreOne } = useCertificateStore();
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => { loadAllCerts({ status: 'revoked' }); }, []);

  const revoked = allCerts.filter(c => c.status === 'revoked');

  const handleRestore = async (id: string) => {
    setRestoringId(id);
    try { await restoreOne(id); } finally { setRestoringId(null); }
  };

  return (
    <div>
      <div style={{ marginBottom: 20, padding: '12px 16px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12, fontSize: 12, color: '#ef4444', display: 'flex', gap: 8, alignItems: 'center' }}>
        <Ban size={14} />{ct(t, 'certifications.revoked.warning')}
      </div>
      {revoked.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', background: 'var(--surface-1)', borderRadius: 20, border: '1px solid var(--border-1)' }}>
          <CheckCircle size={40} style={{ opacity: 0.2, marginBottom: 14, color: '#22c55e' }} />
          <div style={{ fontSize: 15, fontWeight: 700 }}>{ct(t, 'certifications.revoked.noData')}</div>
        </div>
      ) : revoked.map(cert => (
        <div key={cert.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--surface-1)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 14, marginBottom: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ban size={18} color="#ef4444" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{isRu ? cert.examTitleRu : cert.examTitle}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cert.holderName} • {cert.certificateId}</div>
            {cert.revokeReason && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>{ct(t, 'certifications.revoked.reason', { reason: cert.revokeReason })}</div>}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>
            {cert.revokedAt && new Date(cert.revokedAt).toLocaleDateString()}
          </div>
          <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, gap: 5 }} onClick={() => handleRestore(cert.id)} disabled={restoringId === cert.id}>
            {restoringId === cert.id ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <RotateCcw size={12} />}
            {ct(t, 'certifications.revoked.restore')}
          </button>
        </div>
      ))}
    </div>
  );
}

function TabHistory() {
  const { t } = useTranslation();
  const { downloadHistory, loadDownloadHistory } = useCertificateStore();

  useEffect(() => { loadDownloadHistory(); }, []);

  const actionColors: Record<string, string> = {
    download: '#3b82f6',
    print: '#8b5cf6',
    share: '#22c55e',
    view: '#f59e0b',
  };

  return (
    <div>
      {downloadHistory.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', background: 'var(--surface-1)', borderRadius: 20, border: '1px solid var(--border-1)' }}>
          <History size={40} style={{ opacity: 0.2, marginBottom: 14 }} />
          <div style={{ fontSize: 15, fontWeight: 700 }}>{ct(t, 'certifications.history.noData')}</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>{ct(t, 'certifications.history.desc')}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {downloadHistory.map((h: any, i: number) => {
            const color = actionColors[h.action] || '#6b7280';
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {h.action === 'download' ? <Download size={14} color={color} /> : h.action === 'share' ? <Share2 size={14} color={color} /> : <Printer size={14} color={color} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color }}>{t(`certifications.history.actions.${h.action}`, { defaultValue: h.action })}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {h.certificateId || h.id} {h.ipAddress ? `• ${h.ipAddress}` : ''}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                  {h.downloadedAt ? new Date(h.downloadedAt).toLocaleString() : ''}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────
export default function Certifications() {
  const { t, i18n } = useTranslation();
  const isRu = i18n.language === 'ru';
  const { user } = useAuthStore();
  const isAdmin = ['super_admin', 'admin', 'hr_manager'].includes(user?.role || '');

  const [activeTab, setActiveTab] = useState<TabId>('my');

  // Certificate store
  const { myCerts, loading, loadMyCerts } = useCertificateStore();

  // Exam store for legacy fallback
  const { exams, history: examHistory, loadExams, loadHistory } = useExamStore();

  useEffect(() => {
    loadMyCerts();
    if (exams.length === 0) loadExams();
    loadHistory();
  }, []);

  // Merge: real DB certs + legacy (exam-based) certs that haven't been stored yet
  const legacyMapped: Certificate[] = examHistory
    .filter(h => h.status === 'submitted' && h.passed)
    .reduce((acc: typeof examHistory, h) => {
      const existing = acc.find(a => a.testId === h.testId);
      if (!existing || h.score > existing.score) {
        return [...acc.filter(a => a.testId !== h.testId), h];
      }
      return acc;
    }, [])
    .map(h => {
      const exam = exams.find(e => e.id === h.testId);
      const issuedAt = new Date(h.submittedAt || h.startedAt);
      const expiresAt = new Date(issuedAt);
      expiresAt.setFullYear(issuedAt.getFullYear() + 1);
      const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / 86400000);
      const status: Certificate['status'] = daysLeft <= 0 ? 'expired' : daysLeft <= 30 ? 'expiring_soon' : 'active';
      return {
        id: h.id,
        certificateId: h.id.toUpperCase(),
        userId: h.userId || '',
        examTitle: exam?.title || 'Imtihon',
        examTitleRu: exam?.titleRu || exam?.title || 'Экзамен',
        holderName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.fullName || 'Xodim' : 'Xodim',
        score: h.score,
        category: exam?.category || 'Professional',
        color: exam?.color || '#3b82f6',
        issuedAt: issuedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        status,
        downloadCount: 0,
        verificationCount: 0,
        examId: h.testId,
      } as Certificate;
    });

  // Real DB certs take priority; fill with legacy ones not yet in DB
  const realIds = new Set(myCerts.map(c => c.examId).filter(Boolean));
  const fillCerts = legacyMapped.filter(l => l.examId && !realIds.has(l.examId));
  const displayCerts: Certificate[] = [...myCerts, ...fillCerts];

  const visibleTabs = TABS.filter(t => !t.adminOnly || isAdmin);

  const avgScore = displayCerts.length > 0 ? Math.round(displayCerts.reduce((s, c) => s + c.score, 0) / displayCerts.length) : 0;
  const counts = {
    active: displayCerts.filter(c => c.status === 'active').length,
    expiring: displayCerts.filter(c => c.status === 'expiring_soon').length,
    expired: displayCerts.filter(c => c.status === 'expired').length,
  };

  return (
    <div className="cert-dashboard-root blur-fade">
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <div className="cert-hero">
        <div className="cert-hero-bg" />
        <div className="cert-hero-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#f59e0b,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(245,158,11,0.4)' }}>
              <Award size={18} color="#fff" />
            </div>
            <span className="badge badge-amber" style={{ fontSize: 11 }}>
              <Sparkles size={10} /> {ct(t, 'certifications.eyebrow')}
            </span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 8, background: 'linear-gradient(180deg,#f1f5f9,#94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {ct(t, 'certifications.title')}
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', maxWidth: 420, lineHeight: 1.6 }}>
            {ct(t, 'certifications.subtitle')}
          </p>
        </div>

        {/* Hero KPI Stats */}
        <div className="cert-hero-stats">
          {[
            { label: ct(t, 'certifications.analytics.total'), value: displayCerts.length, color: 'var(--text-primary)' },
            { label: ct(t, 'certifications.analytics.avgScore'), value: `${avgScore}%`, color: '#8b5cf6' },
            { label: ct(t, 'certifications.analytics.active'), value: counts.active, color: '#22c55e' },
            { label: ct(t, 'certifications.analytics.expiring'), value: counts.expiring, color: '#f59e0b' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '14px 18px', background: 'var(--surface-1)', borderRadius: 16, border: '1px solid var(--border-1)', flex: 1, minWidth: 80 }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: s.color, letterSpacing: '-0.5px' }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>



      {/* ─── Tab Navigation ───────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 6, marginBottom: 24, borderBottom: '1px solid var(--border-1)' }} className="hide-scrollbar">
        {visibleTabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', whiteSpace: 'nowrap',
              background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
              border: isActive ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent',
              borderRadius: 11, cursor: 'pointer', transition: 'all 0.2s',
              color: isActive ? '#3b82f6' : 'var(--text-muted)',
              fontWeight: isActive ? 700 : 500, fontSize: 12.5,
            }}>
              <tab.icon size={14} />
              {ct(t, tab.labelKey)}
            </button>
          );
        })}
      </div>

      {/* ─── Tab Content ──────────────────────────────────────── */}
      <div>
        {activeTab === 'my' && <TabMyCerts certs={displayCerts} isRu={isRu} loading={loading} />}
        {activeTab === 'verification' && <TabVerification />}
        {activeTab === 'analytics' && <TabAnalytics />}
        {activeTab === 'templates' && isAdmin && <TabTemplates />}
        {activeTab === 'expiration' && <TabExpiration certs={displayCerts} />}
        {activeTab === 'revoked' && isAdmin && <TabRevoked />}
        {activeTab === 'history' && <TabHistory />}
      </div>
    </div>
  );
}
