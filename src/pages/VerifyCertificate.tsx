import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Award, Shield, AlertCircle, Search,
  Download, ArrowLeft, RefreshCw
} from 'lucide-react';
import { verifyCertificate } from '@/api/certificates';

export default function VerifyCertificate() {
  const [searchParams, setSearchParams] = useSearchParams();
  const certIdFromUrl = searchParams.get('id') || '';

  const [inputId, setInputId] = useState(certIdFromUrl);
  const [certData, setCertData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { t, i18n } = useTranslation();
  const isRu = i18n.language === 'ru';



  const handleVerify = async (idToVerify: string) => {
    const trimmedId = idToVerify.trim();
    if (!trimmedId) return;

    setLoading(true);
    setError(null);
    setCertData(null);

    // Keep the verification ID shareable in the URL.
    setSearchParams({ id: trimmedId });

    try {
      const result = await verifyCertificate(trimmedId);
      if (result.valid && result.certificate) {
        // Normalize the API response into the shape used by this view.
        setCertData({
          valid: true,
          holderName: result.certificate.holderName,
          examTitle: result.certificate.examTitle,
          examTitleRu: result.certificate.examTitleRu,
          examCategory: result.certificate.category || 'Professional',
          score: result.certificate.score,
          submittedAt: result.certificate.issuedAt,
          expiresAt: result.certificate.expiresAt,
          id: result.certificate.certificateId,
          status: result.status,
          revokeReason: result.certificate.revokeReason,
          verificationCount: result.certificate.verificationCount,
          trainerName: result.certificate.trainerName,
          color: result.certificate.color || '#d4af37',
        });
      } else {
        // Certificate found, but it is invalid, revoked, or expired.
        setCertData({
          valid: false,
          status: result.status,
          ...result.certificate,
          id: result.certificate?.certificateId || trimmedId,
          holderName: result.certificate?.holderName || '',
          examTitle: result.certificate?.examTitle || '',
          examTitleRu: result.certificate?.examTitleRu || '',
          examCategory: result.certificate?.category || '',
          score: result.certificate?.score || 0,
          submittedAt: result.certificate?.issuedAt || null,
        });
        if (!result.certificate) {
          setError(isRu ? 'Сертификат не найден в системе.' : "Sertifikat tizimda topilmadi.");
        }
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        (err.response?.status === 404
          ? t('verify.errorSub')
          : t('verify.errorFallback', { defaultValue: 'Tekshirishda xatolik yuz berdi' }))
      );
    } finally {
      setLoading(false);
    }
  };

  // Auto-verify if the URL already contains an ID.
  useEffect(() => {
    if (certIdFromUrl) {
      handleVerify(certIdFromUrl);
    }
  }, [certIdFromUrl]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(inputId);
  };

  const handlePrint = async () => {
    if (!certData) return;
    const examTitle = certData.examTitle;
    const examTitleRu = certData.examTitleRu || certData.examTitle;
    const holderName = certData.holderName;
    const certId = certData.id;
    const certScore = certData.score;
    const submittedAt = new Date(certData.submittedAt).toISOString().split('T')[0];
    const expires = certData.expiresAt ? new Date(certData.expiresAt).toISOString().split('T')[0] : t('certifications.pdf.unlimited');
    const trainer = certData.trainerName || 'AGMK LMS';
    const primaryColor = certData.color || '#d4af37';

    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:0;width:890px;background:#f0f2f5;';
    container.innerHTML = `
      <div class="certificate-border" style="width:840px;height:550px;padding:24px;border:14px solid #0d1b2a;background-color:#fff;position:relative;box-sizing:border-box;font-family:'Montserrat',sans-serif;">
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
          <h2 style="font-family:'Georgia',serif;font-size:24px;color:#0d1117;letter-spacing:5px;font-weight:900;margin-top:10px;margin-bottom:2px;text-align:center;">${t('certifications.pdf.certTitle')}</h2>
          <div style="font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:5px;color:#aa7c11;margin-bottom:16px;text-align:center;">${t('certifications.pdf.completed') || 'MUVAFFAQIYATLI YAKUNLANGAN'}</div>

          <div style="font-size:12px;color:#64748b;margin-bottom:4px;text-align:center;">${t('certifications.pdf.holderLabel')}</div>
          <div style="font-size:26px;font-weight:800;color:#0d1117;border-bottom:2px double ${primaryColor};display:inline-block;padding-bottom:3px;margin-bottom:14px;min-width:280px;letter-spacing:-0.5px;text-align:center;">${holderName}</div>

          <div style="font-size:11.5px;line-height:1.7;color:#475569;max-width:500px;margin:0 auto 12px;text-align:center;">
            ${t('certifications.pdf.desc', {
              title: `<strong style="color:#0d1117">"${isRu ? examTitleRu : examTitle}"</strong>`,
              score: `<strong style="color:#0d1117">${certScore}%</strong>`
            })}
          </div>

          <!-- Meta row -->
          <div style="display:flex;justify-content:space-between;padding:0 24px;margin-top:20px;font-size:10px;color:#64748b;">
            <div style="text-align:center;">
              <div style="font-size:11px;font-weight:700;color:#0d1117;margin-bottom:3px;">${submittedAt}</div>
              <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;font-weight:700;border-top:1px solid #cbd5e1;padding-top:4px;width:100px;margin:0 auto;">${t('certifications.pdf.issued')}</div>
            </div>
            <div style="text-align:center;">
              <div style="font-family:'Georgia',serif;font-size:16px;color:#1e3a8a;font-style:italic;margin-bottom:3px;">${trainer}</div>
              <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;font-weight:700;border-top:1px solid #cbd5e1;padding-top:4px;width:100px;margin:0 auto;">${t('certifications.pdf.authorizer')}</div>
            </div>
            <div style="text-align:center;">
              <div style="font-size:11px;font-weight:700;color:#0d1117;margin-bottom:3px;">${expires}</div>
              <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;font-weight:700;border-top:1px solid #cbd5e1;padding-top:4px;width:100px;margin:0 auto;">${t('certifications.pdf.expires')}</div>
            </div>
          </div>

          <!-- QR Code bottom-left -->
          <div style="position:absolute;bottom:16px;left:22px;display:flex;gap:8px;align-items:center;text-align:left;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=52&data=${encodeURIComponent(window.location.protocol + '//' + window.location.host + '/verify-certificate?id=' + certId)}" width="52" height="52" style="border:1px solid ${primaryColor};padding:2px;background:#fff;" />
            <div>
              <div style="font-weight:bold;color:#aa7c11;font-size:8px;letter-spacing:0.5px;">${t('certifications.pdf.verify')}</div>
              <div style="font-size:7px;color:#64748b;font-family:monospace;">${certId}</div>
            </div>
          </div>

          <!-- Gold Seal Badge bottom-right -->
          <div style="position:absolute;bottom:20px;right:24px;">
            <svg style="width:60px;height:60px;filter:drop-shadow(0 3px 5px rgba(0,0,0,0.15));" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="url(#gold-g-print-verify)" stroke="#b8860b" stroke-width="1" />
              <circle cx="50" cy="50" r="38" fill="none" stroke="#fff" stroke-dasharray="3 3" stroke-width="1.5" opacity="0.8" />
              <polygon points="50,22 58,38 76,41 63,54 66,72 50,64 34,72 37,54 24,41 42,38" fill="#fff" opacity="0.95" />
              <defs>
                <linearGradient id="gold-g-print-verify" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#f3e0aa" />
                  <stop offset="30%" stop-color="#d4af37" />
                  <stop offset="70%" stop-color="#aa7c11" />
                  <stop offset="100%" stop-color="#ffd700" />
                </linearGradient>
              </defs>
            </svg>
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
    <div className="vp-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');

        .vp-root {
          --vp-bg: #04060f;
          --vp-surface: rgba(255, 255, 255, 0.02);
          --vp-surface-hover: rgba(255, 255, 255, 0.05);
          --vp-border: rgba(255, 255, 255, 0.07);
          --vp-text: #f9fafb;
          --vp-muted: #9ca3af;
          --vp-soft: #6b7280;
          --vp-cyan: #22d3ee;
          --vp-blue: #3b82f6;
          --vp-violet: #8b5cf6;
          --vp-green: #10b981;
          --vp-red: #ef4444;

          min-height: 100vh;
          color: var(--vp-text);
          background:
            radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.15), transparent 45rem),
            radial-gradient(circle at 90% 10%, rgba(139, 92, 246, 0.15), transparent 45rem),
            radial-gradient(circle at 50% 80%, rgba(16, 185, 129, 0.05), transparent 40rem),
            var(--vp-bg);
          font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif;
          position: relative;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
        }

        .vp-root * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .vp-bg-grid {
          position: fixed;
          inset: 0;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.012) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.012) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: radial-gradient(ellipse at 50% 50%, rgba(0, 0, 0, 0.9), transparent 85%);
          z-index: 0;
        }

        /* Header Navigation */
        .vp-nav {
          position: relative;
          z-index: 10;
          border-bottom: 1px solid var(--vp-border);
          background: rgba(4, 6, 15, 0.7);
          backdrop-filter: blur(20px);
        }

        .vp-nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          height: 76px;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .vp-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: inherit;
        }

        .vp-brand-mark {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          display: grid;
          place-items: center;
          background: #fff;
          color: #04060f;
          font-weight: 900;
          font-size: 18px;
          box-shadow: 0 0 20px rgba(34, 211, 238, 0.2);
        }

        .vp-brand-text {
          display: flex;
          flex-direction: column;
        }

        .vp-brand-name {
          font-size: 14.5px;
          font-weight: 800;
          letter-spacing: -0.3px;
          color: #fff;
          line-height: 1.2;
        }

        .vp-brand-sub {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 2px;
          color: var(--vp-cyan);
          text-transform: uppercase;
          display: block;
          margin-top: 1px;
        }

        /* Buttons styling */
        .vp-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 0;
          min-height: 40px;
          border-radius: 10px;
          padding: 0 16px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
        }

        .vp-btn:hover {
          transform: translateY(-1.5px);
        }

        .vp-btn-dark {
          color: #fff;
          border: 1px solid var(--vp-border);
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(10px);
        }

        .vp-btn-dark:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.12);
        }

        .vp-btn-primary {
          background: linear-gradient(135deg, var(--vp-blue), var(--vp-violet));
          color: #fff;
          box-shadow: 0 8px 20px rgba(139, 92, 246, 0.2);
        }

        .vp-btn-primary:hover {
          box-shadow: 0 12px 25px rgba(139, 92, 246, 0.3);
        }

        /* Body container */
        .vp-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 24px;
          position: relative;
          z-index: 1;
        }

        .vp-content-wrapper {
          width: 100%;
          max-width: 680px;
        }

        /* Title Area */
        .vp-header-block {
          text-align: center;
          margin-bottom: 36px;
        }

        .vp-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 99px;
          background: rgba(59, 130, 246, 0.07);
          border: 1px solid rgba(59, 130, 246, 0.15);
          color: var(--vp-cyan);
          font-size: 10.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 14px;
        }

        .vp-title {
          font-size: clamp(1.8rem, 4.5vw, 2.5rem);
          font-weight: 900;
          letter-spacing: -0.8px;
          line-height: 1.2;
          color: #fff;
          background: linear-gradient(to bottom, #ffffff 50%, #d1d5db 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .vp-subtitle {
          color: var(--vp-muted);
          font-size: 14.5px;
          margin-top: 10px;
          line-height: 1.6;
        }

        /* Search Section */
        .vp-search-card {
          padding: 24px;
          border-radius: 20px;
          border: 1px solid var(--vp-border);
          background: rgba(13, 17, 23, 0.35);
          backdrop-filter: blur(20px);
          box-shadow:
            0 20px 40px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
          margin-bottom: 24px;
        }

        .vp-search-bar {
          display: flex;
          gap: 10px;
        }

        @media (max-width: 600px) {
          .vp-search-bar {
            flex-direction: column;
          }
        }

        .vp-input-container {
          position: relative;
          flex: 1;
        }

        .vp-input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--vp-soft);
          transition: color 0.3s;
          pointer-events: none;
        }

        .vp-input {
          width: 100%;
          height: 48px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 12px;
          padding: 0 16px 0 46px;
          color: #fff;
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: all 0.3s ease;
        }

        .vp-input::placeholder {
          color: var(--vp-soft);
        }

        .vp-input:focus {
          border-color: rgba(59, 130, 246, 0.4);
          background: rgba(255, 255, 255, 0.04);
          box-shadow:
            0 0 0 3px rgba(59, 130, 246, 0.1),
            0 0 20px rgba(59, 130, 246, 0.1);
        }

        .vp-input:focus + .vp-input-icon {
          color: var(--vp-cyan);
        }

        /* Loading Area */
        .vp-loading-block {
          text-align: center;
          padding: 48px 24px;
          border-radius: 20px;
          border: 1px solid var(--vp-border);
          background: rgba(255, 255, 255, 0.01);
          backdrop-filter: blur(10px);
        }

        .vp-spinner {
          animation: vp-spin-fast 1s linear infinite;
          margin: 0 auto 16px;
          color: var(--vp-cyan);
        }

        @keyframes vp-spin-fast {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .vp-loading-title {
          font-size: 15px;
          font-weight: 700;
          color: #fff;
        }

        .vp-loading-sub {
          font-size: 12.5px;
          color: var(--vp-muted);
          margin-top: 6px;
        }

        /* Error block */
        .vp-error-card {
          display: flex;
          gap: 16px;
          padding: 24px;
          border-radius: 20px;
          border: 1px solid rgba(239, 68, 68, 0.2);
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(239, 68, 68, 0.01));
          backdrop-filter: blur(20px);
          animation: vp-fade 0.3s ease forwards;
        }

        .vp-error-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: var(--vp-red);
        }

        .vp-error-title {
          font-size: 15px;
          font-weight: 800;
          color: #fca5a5;
        }

        .vp-error-text {
          font-size: 13px;
          color: var(--vp-muted);
          margin-top: 4px;
          line-height: 1.5;
        }

        /* Premium Verified Card */
        .vp-verified-card {
          padding: 36px;
          border-radius: 24px;
          border: 1px solid rgba(16, 185, 129, 0.2);
          background: linear-gradient(135deg, rgba(5, 8, 20, 0.9), rgba(16, 185, 129, 0.015));
          backdrop-filter: blur(24px);
          box-shadow:
            0 25px 60px rgba(0, 0, 0, 0.5),
            0 0 35px rgba(16, 185, 129, 0.02),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
          position: relative;
          overflow: hidden;
          animation: vp-fade-in 0.4s ease forwards;
        }

        .vp-verified-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--vp-green), rgba(16, 185, 129, 0.15));
        }

        .vp-glow-spot {
          position: absolute;
          top: -40px;
          right: -40px;
          width: 150px;
          height: 150px;
          background: var(--vp-green);
          filter: blur(60px);
          opacity: 0.1;
          pointer-events: none;
        }

        .vp-vh {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .vp-vh-logo-area {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .vp-vh-icon-box {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--vp-green);
        }

        .vp-vh-org-label {
          font-size: 10px;
          color: var(--vp-soft);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          font-weight: 700;
        }

        .vp-vh-org-name {
          font-size: 13.5px;
          font-weight: 800;
          color: #fff;
        }

        .vp-badge-verified {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 99px;
          font-size: 10.5px;
          font-weight: 800;
          color: var(--vp-green);
          letter-spacing: 0.5px;
        }

        .vp-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--vp-green);
          box-shadow: 0 0 8px var(--vp-green);
          animation: vp-pulse 2s infinite;
        }

        @keyframes vp-pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); }
          70% { transform: scale(1); box-shadow: 0 0 0 5px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        .vp-info-group {
          padding-bottom: 18px;
          margin-bottom: 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .vp-info-label {
          font-size: 11px;
          color: var(--vp-soft);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .vp-info-value-name {
          font-size: 20px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.3px;
        }

        .vp-info-value-title {
          font-size: 16.5px;
          font-weight: 800;
          color: var(--vp-cyan);
          line-height: 1.35;
        }

        .vp-info-value-category {
          font-size: 11.5px;
          color: var(--vp-soft);
          margin-top: 3px;
          font-weight: 600;
        }

        .vp-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 24px;
        }

        @media (max-width: 480px) {
          .vp-stats-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }
        }

        .vp-stat-box {
          display: flex;
          flex-direction: column;
        }

        .vp-stat-lbl {
          font-size: 10px;
          color: var(--vp-soft);
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .vp-stat-val {
          font-size: 15px;
          font-weight: 800;
          color: #fff;
        }

        .vp-stat-val-green {
          font-size: 17px;
          font-weight: 900;
          color: var(--vp-green);
        }

        .vp-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .vp-cert-id-box {
          font-size: 11.5px;
          color: var(--vp-soft);
        }

        .vp-cert-id-value {
          font-family: var(--font-mono);
          color: #fff;
          font-size: 11px;
          font-weight: 600;
          margin-left: 4px;
          background: rgba(255, 255, 255, 0.03);
          padding: 3px 6px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        @keyframes vp-fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes vp-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Footer */
        .vp-footer {
          position: relative;
          z-index: 10;
          border-top: 1px solid var(--vp-border);
          padding: 24px 0;
          margin-top: auto;
          background: rgba(4, 6, 15, 0.5);
        }

        .vp-footer-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: var(--vp-soft);
          flex-wrap: wrap;
          gap: 12px;
        }
      `}</style>

      <div className="vp-bg-grid" />

      {/* Header */}
      <header className="vp-nav">
        <div className="vp-nav-inner">
          <Link className="vp-brand" to="/">
            <span className="vp-brand-mark">A</span>
            <div className="vp-brand-text">
              <span className="vp-brand-name">AGMK LMS</span>
              <span className="vp-brand-sub">ENTERPRISE AI</span>
            </div>
          </Link>
          <div>
            <Link className="vp-btn vp-btn-dark" to="/">
              <ArrowLeft size={14} /> Bosh sahifa
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="vp-container">
        <div className="vp-content-wrapper">

          {/* Header Title Block */}
          <div className="vp-header-block">
            <div className="vp-status-pill">
              <Shield size={12} /> {t('verify.statusPill')}
            </div>
            <h1 className="vp-title">{t('verify.title')}</h1>
            <p className="vp-subtitle">
              {t('verify.subtitle')}
            </p>
          </div>

          {/* Search Card */}
          <div className="vp-search-card">
            <form onSubmit={handleSearchSubmit}>
              <div className="vp-search-bar">
                <div className="vp-input-container">
                  <Search size={16} className="vp-input-icon" />
                  <input
                    type="text"
                    value={inputId}
                    onChange={(e) => setInputId(e.target.value)}
                    placeholder={t('verify.placeholder')}
                    className="vp-input"
                  />
                </div>
                <button type="submit" className="vp-btn vp-btn-primary" disabled={loading}>
                  {loading ? <RefreshCw size={14} style={{ animation: 'vp-spin-fast 1s linear infinite' }} /> : t('verify.btnVerify')}
                </button>
              </div>
            </form>
          </div>

          {/* Status Results */}
          {loading && (
            <div className="vp-loading-block">
              <RefreshCw size={32} className="vp-spinner" />
              <div className="vp-loading-title">{t('verify.loadingTitle')}</div>
              <div className="vp-loading-sub">{t('verify.loadingSub')}</div>
            </div>
          )}

          {error && !loading && (
            <div className="vp-error-card">
              <div className="vp-error-icon-box">
                <AlertCircle size={20} />
              </div>
              <div>
                <div className="vp-error-title">{t('verify.errorTitle')}</div>
                <p className="vp-error-text">{error}</p>
              </div>
            </div>
          )}

          {certData && !loading && (
            <div className={certData.valid ? 'vp-verified-card' : 'vp-error-card'} style={certData.valid ? {} : { padding: 28, display: 'flex', flexDirection: 'column', gap: 16, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.04)' }}>
              {certData.valid && <div className="vp-glow-spot" />}

              {!certData.valid && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertCircle size={26} color="#ef4444" />
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#ef4444' }}>
                      {t('certifications.verification.invalid', { defaultValue: isRu ? '✗ НЕДЕЙСТВИТЕЛЕН' : '✗ HAQIQIY EMAS' })}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--vp-muted, #9ca3af)', marginTop: 4 }}>
                      {t('certifications.verification.status', {
                        status: certData.status,
                        defaultValue: isRu ? `Статус: ${certData.status}` : `Holat: ${certData.status}`,
                      })}
                    </div>
                  </div>
                </div>
              )}
              {certData.revokeReason && (
                <div style={{ fontSize: 12, color: '#ef4444', padding: '10px 14px', background: 'rgba(239,68,68,0.06)', borderRadius: 10 }}>
                  {t('certifications.verification.revokeReason', {
                    reason: certData.revokeReason,
                    defaultValue: `${isRu ? 'Причина отзыва' : 'Bekor qilish sababi'}: ${certData.revokeReason}`,
                  })}
                </div>
              )}

              {certData.valid && (
                <>
                  <div className="vp-vh">
                    <div className="vp-vh-logo-area">
                      <div className="vp-vh-icon-box">
                        <Award size={20} />
                      </div>
                      <div>
                        <div className="vp-vh-org-label">{t('verify.orgLabel')}</div>
                        <div className="vp-vh-org-name">AGMK LMS</div>
                      </div>
                    </div>
                    <div className="vp-badge-verified">
                      <div className="vp-badge-dot" />
                      <span>{t('verify.badgeVerified')}</span>
                    </div>
                  </div>

                  <div className="vp-info-group">
                    <div className="vp-info-label">{t('verify.holderLabel')}</div>
                    <div className="vp-info-value-name">{certData.holderName}</div>
                  </div>

                  <div className="vp-info-group">
                    <div className="vp-info-label">{t('verify.examLabel')}</div>
                    <div className="vp-info-value-title">{isRu ? (certData.examTitleRu || certData.examTitle) : certData.examTitle}</div>
                    <div className="vp-info-value-category">{t('verify.categoryLabel')}: {certData.examCategory}</div>
                  </div>

                  <div className="vp-stats-grid">
                    <div className="vp-stat-box">
                      <div className="vp-stat-lbl">{t('verify.scoreLabel')}</div>
                      <div className="vp-stat-val-green">{certData.score}%</div>
                    </div>
                    <div className="vp-stat-box">
                      <div className="vp-stat-lbl">{t('verify.dateLabel')}</div>
                      <div className="vp-stat-val">
                        {certData.submittedAt ? new Date(certData.submittedAt).toLocaleDateString() : '-'}
                      </div>
                    </div>
                    <div className="vp-stat-box">
                      <div className="vp-stat-lbl">{t('verify.statusLabel')}</div>
                      <div className="vp-stat-val-green" style={{ color: 'var(--vp-green)' }}>{t('verify.statusActive')}</div>
                    </div>
                  </div>

                  <div className="vp-card-footer">
                    <div className="vp-cert-id-box">
                      {t('verify.certIdLabel')}:
                      <span className="vp-cert-id-value">{certData.id}</span>
                    </div>
                    <button className="vp-btn vp-btn-primary" onClick={handlePrint} style={{ minHeight: 38, borderRadius: 10, fontSize: 12 }}>
                      <Download size={13} /> {t('verify.btnPrint')}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="vp-footer">
        <div className="vp-footer-inner">
          <span>{t('verify.rights')}</span>
          <span>{t('verify.subtext')}</span>
        </div>
      </footer>
    </div>
  );
}
