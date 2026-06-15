import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Building2,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Fingerprint,
  Globe2,
  IdCard,
  KeyRound,
  Laptop,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/auth.store';
import { DeviceLimitModal } from '../components/auth/DeviceLimitModal';
import { motion, AnimatePresence } from 'framer-motion';

/* ─────────────────── TYPES ─────────────────── */

type Lang = 'uz' | 'ru';
type LoginMode = 'username' | 'employee';

const getAuthPayload = (response: any) => response?.data || response;

/* ─────────────── FLOATING PARTICLES ─────────────── */

function Particles() {
  const dots = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        s: Math.random() * 2.2 + 0.8,
        dur: Math.random() * 14 + 9,
        dl: Math.random() * 5,
        op: Math.random() * 0.3 + 0.08,
      })),
    [],
  );
  return (
    <div className="lg-particles" aria-hidden="true">
      {dots.map((p) => (
        <motion.div
          key={p.id}
          className="lg-particle"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s }}
          animate={{
            y: [0, -20, 0, 16, 0],
            x: [0, 10, -8, 4, 0],
            opacity: [p.op, p.op * 1.6, p.op, p.op * 0.5, p.op],
          }}
          transition={{ duration: p.dur, delay: p.dl, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

/* ─────────────────── MAIN ─────────────────── */

export default function Login() {
  const navigate = useNavigate();
  const loginAction = useAuthStore((s) => s.login);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const maxDevicesReached = useAuthStore((s) => s.maxDevicesReached);
  const pendingDevices = useAuthStore((s) => s.pendingDevices);
  const setMaxDevices = useAuthStore((s) => s.setMaxDevices);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  const { t, i18n } = useTranslation();
  const [lang, setLang] = useState<Lang>((i18n.language as Lang) || 'uz');
  const [mode, setMode] = useState<LoginMode>('username');
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLangChange = (l: Lang) => { setLang(l); i18n.changeLanguage(l); };

  const credentialPlaceholder = useMemo(
    () => (mode === 'username' ? t('login.username') : t('login.employee')),
    [mode, t],
  );

  const handleLogin = async (e?: React.FormEvent, removeSessionId?: string) => {
    if (e) e.preventDefault();
    setError('');
    if (!credential.trim()) { setError(t('login.validationCredential')); return; }
    if (password.trim().length < 4) { setError(t('login.validationPassword')); return; }

    setLoading(true);
    try {
      const response: any = await api
        .post('/auth/login', { credential: credential.trim(), password, remember, loginMode: mode, removeSessionId })
        .catch((err) => { throw err; });

      const auth = getAuthPayload(response);

      if (auth?.maxDevicesReached || response.maxDevicesReached) {
        setMaxDevices(true, auth?.devices || response.devices || []);
        return;
      }
      if (auth?.user && auth?.accessToken && auth?.refreshToken) {
        loginAction(auth.user, auth.accessToken, auth.refreshToken);
        navigate('/dashboard');
        return;
      }
      setError(t('login.error'));
    } catch {
      setError(t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  /* Chart bar data */
  const bars = [42, 78, 58, 96, 72, 112, 86, 124];

  return (
    <main className="lg">
      <style>{`
        /* ═══════════════════════════════════════════════════════
           AGMK LMS — PREMIUM LOGIN PAGE
           ═══════════════════════════════════════════════════════ */

        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800;14..32,900&display=swap');

        .lg {
          --bg: #030508;
          --bg-2: #060a0f;
          --surface: rgba(255,255,255,0.04);
          --surface-h: rgba(255,255,255,0.07);
          --glass: rgba(255,255,255,0.055);
          --glass-b: rgba(255,255,255,0.1);
          --glass-s: rgba(255,255,255,0.14);
          --line: rgba(255,255,255,0.08);
          --tx: #f0f4f9;
          --tx2: #94a3b8;
          --tx3: #64748b;
          --ac: #06b6d4;
          --ac2: #22d3ee;
          --em: #34d399;
          --vi: #a78bfa;
          --am: #fbbf24;
          --co: #fb7185;
          min-height: 100vh;
          color: var(--tx);
          background: var(--bg);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
          position: relative;
        }
        .lg * { box-sizing: border-box; }
        .lg a { text-decoration: none; color: inherit; }

        /* BG elements */
        .lg-particles { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
        .lg-particle { position: absolute; border-radius: 50%; background: var(--ac2); }
        .lg-grid-bg {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 72px 72px;
          mask-image: radial-gradient(ellipse 70% 55% at 50% 35%, black 15%, transparent 70%);
        }
        .lg-orb {
          position: fixed; border-radius: 50%; filter: blur(100px);
          pointer-events: none; z-index: 0;
        }
        .lg-orb-1 {
          width: 700px; height: 700px; top: -220px; right: -100px;
          background: radial-gradient(circle, rgba(6,182,212,0.12), transparent 70%);
        }
        .lg-orb-2 {
          width: 550px; height: 550px; bottom: -180px; left: -120px;
          background: radial-gradient(circle, rgba(167,139,250,0.1), transparent 70%);
        }
        .lg-orb-3 {
          width: 450px; height: 450px; top: 35%; left: 30%;
          background: radial-gradient(circle, rgba(52,211,153,0.06), transparent 70%);
        }

        /* Shell */
        .lg-shell {
          position: relative; z-index: 2;
          width: min(1240px, calc(100% - 48px));
          min-height: 100vh;
          margin: 0 auto;
          padding: 36px 0;
          display: grid;
          grid-template-columns: 1.08fr 0.92fr;
          gap: 56px;
          align-items: center;
        }

        /* ─── LEFT HERO ─── */
        .lg-hero { position: relative; }
        .lg-brand {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 60px; cursor: pointer;
        }
        .lg-brand-icon {
          width: 42px; height: 42px; border-radius: 12px;
          display: grid; place-items: center;
          font-weight: 900; font-size: 16px; color: var(--bg);
          background: linear-gradient(135deg, #06b6d4, #34d399);
          box-shadow: 0 0 0 1px rgba(6,182,212,0.3), 0 8px 32px rgba(6,182,212,0.25);
          transition: box-shadow 0.3s ease;
        }
        .lg-brand:hover .lg-brand-icon {
          box-shadow: 0 0 0 1px rgba(6,182,212,0.5), 0 12px 48px rgba(6,182,212,0.35);
        }
        .lg-brand-name { font-size: 15px; font-weight: 800; letter-spacing: -0.01em; }
        .lg-brand-sub { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; color: var(--ac2); margin-top: 1px; }

        .lg-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          min-height: 36px; padding: 0 16px;
          border: 1px solid rgba(6,182,212,0.25); border-radius: 100px;
          background: rgba(6,182,212,0.08);
          color: var(--ac2); font-size: 12px; font-weight: 700; letter-spacing: 0.04em;
        }
        .lg-title {
          margin: 28px 0 20px; max-width: 680px;
          font-size: clamp(38px, 4.5vw, 60px);
          line-height: 0.96; letter-spacing: -0.03em; font-weight: 900;
        }
        .lg-title-grad {
          background: linear-gradient(135deg, #fff 0%, #e2e8f0 35%, #06b6d4 70%, #a78bfa 100%);
          background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .lg-lead {
          max-width: 560px; margin: 0;
          color: var(--tx2); font-size: 16px; line-height: 1.75; font-weight: 450;
        }

        /* Visual cards */
        .lg-visual {
          margin-top: 40px;
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 14px;
        }
        .lg-panel {
          position: relative;
          min-height: 290px;
          border: 1px solid var(--glass-b);
          border-radius: 20px;
          background: var(--glass);
          backdrop-filter: blur(20px);
          padding: 22px;
          overflow: hidden;
          transition: all 0.4s ease;
        }
        .lg-panel::before {
          content: '';
          position: absolute; inset: -1px;
          border-radius: 20px; padding: 1px;
          background: linear-gradient(135deg, rgba(6,182,212,0.2), transparent 50%);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude; -webkit-mask-composite: xor;
          pointer-events: none;
        }
        .lg-panel::after {
          content: ''; position: absolute;
          width: 250px; height: 250px; right: -70px; top: -80px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(6,182,212,0.15), transparent 65%);
          pointer-events: none;
        }
        .lg-panel:hover { border-color: rgba(6,182,212,0.2); transform: translateY(-2px); }
        .lg-panel-top {
          position: relative; z-index: 1;
          display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;
        }
        .lg-chip {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 7px 12px; border-radius: 100px;
          background: rgba(52,211,153,0.08);
          border: 1px solid rgba(52,211,153,0.2);
          color: #a7f3d0; font-size: 11px; font-weight: 700;
        }
        .lg-panel h2 {
          margin: 14px 0 0; font-size: 22px; font-weight: 800;
          letter-spacing: -0.02em; position: relative; z-index: 1;
        }
        .lg-panel p {
          color: var(--tx2); line-height: 1.6; margin: 10px 0 0;
          max-width: 320px; font-size: 13.5px; position: relative; z-index: 1;
        }
        .lg-bars {
          height: 110px; display: flex; gap: 7px; align-items: flex-end;
          margin-top: 22px; position: relative; z-index: 1;
        }
        .lg-bars span {
          flex: 1; min-width: 0;
          border-radius: 6px 6px 2px 2px;
          background: linear-gradient(180deg, #a78bfa, #06b6d4 55%, #34d399);
          box-shadow: 0 0 12px rgba(6,182,212,0.15);
        }

        .lg-mini-stack { display: grid; gap: 14px; }
        .lg-mini {
          border: 1px solid var(--glass-b);
          border-radius: 20px;
          background: var(--glass);
          backdrop-filter: blur(16px);
          padding: 20px 18px;
          min-height: 136px;
          transition: all 0.35s ease;
        }
        .lg-mini::before {
          content: ''; display: block;
          width: 38px; height: 38px; border-radius: 11px;
          background: rgba(6,182,212,0.1);
          border: 1px solid rgba(6,182,212,0.15);
          margin-bottom: 14px;
        }
        .lg-mini:hover {
          border-color: rgba(6,182,212,0.2);
          background: var(--surface-h);
          transform: translateY(-2px);
        }
        .lg-mini svg {
          color: var(--ac2);
          margin-top: -52px; margin-left: 8px; margin-bottom: 14px;
          position: relative;
        }
        .lg-mini strong { display: block; font-size: 15px; font-weight: 800; }
        .lg-mini span {
          display: block; margin-top: 6px;
          color: var(--tx3); font-size: 12px; line-height: 1.5; font-weight: 500;
        }

        /* ─── RIGHT CARD ─── */
        .lg-card {
          position: relative;
          border: 1px solid var(--glass-b);
          border-radius: 24px;
          background: rgba(10,16,24,0.85);
          backdrop-filter: blur(32px) saturate(1.6);
          -webkit-backdrop-filter: blur(32px) saturate(1.6);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.04),
            0 40px 100px rgba(0,0,0,0.5),
            0 12px 36px rgba(0,0,0,0.3);
          padding: 32px;
          overflow: hidden;
        }
        .lg-card::before {
          content: '';
          position: absolute; inset: -1px;
          border-radius: 24px; padding: 1px;
          background: linear-gradient(180deg, rgba(6,182,212,0.2), transparent 40%, rgba(167,139,250,0.12));
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude; -webkit-mask-composite: xor;
          pointer-events: none;
        }
        .lg-card::after {
          content: '';
          position: absolute; top: -50%; left: 50%; transform: translateX(-50%);
          width: 380px; height: 380px; border-radius: 50%;
          background: radial-gradient(circle, rgba(6,182,212,0.08), transparent 70%);
          pointer-events: none; z-index: -1;
        }

        /* Toolbar */
        .lg-toolbar {
          display: flex; justify-content: space-between; align-items: center;
          gap: 14px; margin-bottom: 24px;
        }
        .lg-lang, .lg-theme-sw {
          display: flex; padding: 3px;
          border-radius: 12px;
          background: var(--surface);
          border: 1px solid var(--line);
        }
        .lg-lang button, .lg-theme-sw button {
          border: 0; border-radius: 9px;
          min-width: 38px; height: 30px;
          display: inline-flex; align-items: center; justify-content: center; gap: 5px;
          background: transparent;
          color: var(--tx3); font-weight: 800; font-size: 11px;
          cursor: pointer; transition: all 0.2s ease;
          font-family: inherit;
        }
        .lg-lang button.active, .lg-theme-sw button.active {
          background: #fff; color: var(--bg);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }

        /* Card head */
        .lg-card-head { margin-bottom: 24px; }
        .lg-card-head h1 {
          margin: 0; font-size: 28px; font-weight: 900;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #fff, var(--ac2));
          background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .lg-card-head p {
          margin: 8px 0 0; color: var(--tx2);
          font-size: 14px; line-height: 1.6; font-weight: 450;
        }

        /* Mode toggle */
        .lg-mode {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 6px; padding: 5px;
          border-radius: 14px;
          background: var(--surface);
          border: 1px solid var(--line);
          margin-bottom: 22px;
        }
        .lg-mode button {
          border: 0; min-height: 44px; border-radius: 10px;
          color: var(--tx3); background: transparent;
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          font-size: 13px; font-weight: 700;
          cursor: pointer; transition: all 0.25s ease;
          font-family: inherit;
        }
        .lg-mode button.active {
          background: var(--glass-s);
          color: var(--tx);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        /* Form */
        .lg-form { display: grid; gap: 18px; }
        .lg-field label {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; margin-bottom: 8px;
          color: var(--tx2); font-size: 12px; font-weight: 700;
        }
        .lg-input-wrap {
          min-height: 52px;
          display: flex; align-items: center; gap: 10px;
          padding: 0 14px;
          border-radius: 14px;
          background: rgba(3,5,8,0.6);
          border: 1px solid var(--line);
          transition: all 0.25s ease;
        }
        .lg-input-wrap:focus-within {
          border-color: rgba(6,182,212,0.45);
          box-shadow: 0 0 0 3px rgba(6,182,212,0.08);
        }
        .lg-input-wrap svg { color: var(--ac2); flex: 0 0 auto; }
        .lg-input-wrap input {
          width: 100%; min-width: 0;
          border: 0; outline: 0;
          background: transparent; color: var(--tx);
          font-size: 14px; font-weight: 500; font-family: inherit;
        }
        .lg-input-wrap input::placeholder { color: var(--tx3); }
        .lg-eye {
          border: 0; width: 34px; height: 34px;
          border-radius: 8px;
          display: grid; place-items: center;
          background: rgba(255,255,255,0.06);
          color: var(--tx3); cursor: pointer;
          transition: all 0.2s ease; flex-shrink: 0;
        }
        .lg-eye:hover { background: rgba(255,255,255,0.12); color: var(--tx2); }

        .lg-forgot {
          color: var(--ac2); font-size: 12px; font-weight: 700;
          transition: color 0.2s ease;
        }
        .lg-forgot:hover { color: #67e8f9; }

        .lg-row {
          display: flex; align-items: center;
          justify-content: space-between; gap: 12px;
        }
        .lg-check {
          display: inline-flex; align-items: center; gap: 10px;
          color: var(--tx2); font-size: 13px; font-weight: 600;
          cursor: pointer;
        }
        .lg-check input[type="checkbox"] {
          width: 18px; height: 18px;
          accent-color: var(--ac);
          border-radius: 4px;
        }

        /* Error */
        .lg-error {
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid rgba(251,113,133,0.25);
          background: rgba(251,113,133,0.06);
          color: #fda4af;
          font-size: 13px; font-weight: 600; line-height: 1.5;
          display: flex; align-items: center; gap: 10px;
        }

        /* Submit */
        .lg-submit {
          width: 100%; min-height: 54px;
          border: 0; border-radius: 14px;
          display: inline-flex; align-items: center; justify-content: center; gap: 10px;
          background: linear-gradient(135deg, #06b6d4, #34d399);
          color: var(--bg); font-size: 14px; font-weight: 800;
          cursor: pointer; font-family: inherit;
          box-shadow: 0 0 0 1px rgba(6,182,212,0.3), 0 8px 32px rgba(6,182,212,0.2);
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          position: relative; overflow: hidden;
        }
        .lg-submit::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent);
          opacity: 0; transition: opacity 0.3s ease;
        }
        .lg-submit:hover::before { opacity: 1; }
        .lg-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 0 1px rgba(6,182,212,0.5), 0 16px 56px rgba(6,182,212,0.3);
        }
        .lg-submit:active { transform: translateY(0); }
        .lg-submit:disabled { opacity: 0.6; cursor: wait; transform: none; }
        .lg-submit:disabled::before { display: none; }

        /* Divider */
        .lg-divider {
          display: grid; grid-template-columns: 1fr auto 1fr;
          gap: 14px; align-items: center;
          color: var(--tx3); font-size: 11px; font-weight: 800;
          letter-spacing: 0.12em; text-transform: uppercase;
          margin: 4px 0;
        }
        .lg-divider::before, .lg-divider::after {
          content: ''; height: 1px; background: var(--line);
        }

        /* SSO */
        .lg-sso button {
          width: 100%; min-height: 48px;
          border-radius: 14px;
          border: 1px solid var(--glass-b);
          background: var(--glass);
          color: var(--tx);
          display: inline-flex; align-items: center; justify-content: center; gap: 10px;
          font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: inherit;
          transition: all 0.3s ease;
        }
        .lg-sso button:hover {
          background: var(--surface-h);
          border-color: var(--glass-s);
          transform: translateY(-1px);
        }

        /* Switch */
        .lg-switch {
          margin-top: 16px;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: var(--surface);
          min-height: 58px;
          display: flex; align-items: center;
          justify-content: space-between; gap: 12px;
          padding: 10px 14px;
        }
        .lg-switch span { color: var(--tx3); font-size: 13px; font-weight: 600; }
        .lg-switch-btn {
          min-height: 40px; border-radius: 10px;
          border: 1px solid var(--glass-b);
          background: var(--glass);
          color: var(--tx);
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 0 14px;
          font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: inherit;
          transition: all 0.3s ease; white-space: nowrap;
        }
        .lg-switch-btn:hover {
          background: var(--surface-h);
          border-color: rgba(6,182,212,0.25);
          transform: translateY(-1px);
        }

        /* Security items */
        .lg-security {
          margin-top: 18px;
          display: grid; gap: 8px;
        }
        .lg-sec-item {
          display: flex; align-items: center; gap: 10px;
          color: var(--tx3); font-size: 12px; font-weight: 600;
        }
        .lg-sec-item svg { color: var(--em); flex-shrink: 0; }

        /* Spinner */
        .lg-spin { animation: lg-rotate 0.7s linear infinite; }
        @keyframes lg-rotate { to { transform: rotate(360deg); } }

        /* ─── RESPONSIVE ─── */
        @media (max-width: 1080px) {
          .lg-shell {
            grid-template-columns: 1fr;
            max-width: 560px;
          }
          .lg-hero { order: 2; }
          .lg-card-wrap { order: 1; }
          .lg-brand { margin-bottom: 36px; }
        }
        @media (max-width: 700px) {
          .lg-shell {
            width: min(100% - 28px, 100%);
            padding: 24px 0; gap: 32px;
          }
          .lg-title { font-size: clamp(30px, 10vw, 40px); }
          .lg-visual { grid-template-columns: 1fr; }
          .lg-card { padding: 22px 18px; border-radius: 20px; }
          .lg-toolbar { flex-direction: column; align-items: stretch; }
          .lg-lang, .lg-theme-sw { width: 100%; }
          .lg-lang button, .lg-theme-sw button { flex: 1; }
          .lg-row { flex-direction: column; align-items: flex-start; }
          .lg-switch { flex-direction: column; align-items: stretch; }
          .lg-switch-btn { width: 100%; justify-content: center; }
        }
      `}</style>

      {/* ─── Background ─── */}
      <div className="lg-grid-bg" />
      <motion.div className="lg-orb lg-orb-1"
        animate={{ x: [0, 25, -12, 0], y: [0, -18, 12, 0], scale: [1, 1.06, 0.97, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div className="lg-orb lg-orb-2"
        animate={{ x: [0, -18, 12, 0], y: [0, 22, -10, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div className="lg-orb lg-orb-3"
        animate={{ x: [0, 14, -8, 0], y: [0, -12, 18, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <Particles />

      <div className="lg-shell">
        {/* ═══════════ LEFT HERO ═══════════ */}
        <section className="lg-hero">
          <motion.div
            className="lg-brand"
            onClick={() => navigate('/')}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="lg-brand-icon">A</div>
            <div>
              <div className="lg-brand-name">AGMK LMS</div>
              <div className="lg-brand-sub">ENTERPRISE AI</div>
            </div>
          </motion.div>

          <motion.div
            className="lg-eyebrow"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Sparkles size={14} />
            {t('login.eyebrow')}
          </motion.div>

          <motion.h1
            className="lg-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="lg-title-grad">
              {t('login.headline')}
            </span>
          </motion.h1>

          <motion.p
            className="lg-lead"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            {t('login.subline')}
          </motion.p>

          <motion.div
            className="lg-visual"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
          >
            <div className="lg-panel">
              <div className="lg-panel-top">
                <div>
                  <div className="lg-chip">
                    <ShieldCheck size={13} />
                    {t('login.secure')}
                  </div>
                  <h2>{t('login.panelTitle')}</h2>
                  <p>{t('login.panelText')}</p>
                </div>
                <Bot color="var(--ac2)" size={26} />
              </div>
              <div className="lg-bars">
                {bars.map((h, i) => (
                  <motion.span
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: h }}
                    transition={{ delay: 0.6 + i * 0.07, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  />
                ))}
              </div>
            </div>

            <div className="lg-mini-stack">
              {[
                { icon: Laptop, title: t('login.device'), desc: 'Windows 11 • Tashkent • Protected browser' },
                { icon: BadgeCheck, title: 'Compliance ready', desc: t('login.quote') },
              ].map((item) => (
                <motion.div
                  className="lg-mini"
                  key={item.title}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <item.icon size={20} />
                  <strong>{item.title}</strong>
                  <span>{item.desc}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ═══════════ RIGHT CARD ═══════════ */}
        <section className="lg-card-wrap">
          <motion.div
            className="lg-card"
            initial={{ opacity: 0, x: 50, rotateY: 5 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Toolbar */}
            <div className="lg-toolbar">
              <div className="lg-lang" aria-label="Language switcher">
                {(['uz', 'ru'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    className={lang === l ? 'active' : ''}
                    onClick={() => handleLangChange(l)}
                  >
                    <Globe2 size={12} />
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Head */}
            <div className="lg-card-head">
              <h1>{t('login.submit')}</h1>
              <p>{t('login.subline')}</p>
            </div>

            {/* Mode toggle */}
            <div className="lg-mode" role="tablist" aria-label="Login method">
              <motion.button
                type="button"
                className={mode === 'username' ? 'active' : ''}
                onClick={() => setMode('username')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <UserRound size={15} />
                {t('login.username')}
              </motion.button>
              <motion.button
                type="button"
                className={mode === 'employee' ? 'active' : ''}
                onClick={() => setMode('employee')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <IdCard size={15} />
                {t('login.employee')}
              </motion.button>
            </div>

            {/* Form */}
            <form className="lg-form" onSubmit={handleLogin}>
              <div className="lg-field">
                <label htmlFor="credential">
                  {mode === 'username' ? t('login.usernameLabel') : t('login.employeeLabel')}
                </label>
                <div className="lg-input-wrap">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={mode}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                      style={{ display: 'flex', alignItems: 'center' }}
                    >
                      {mode === 'username' ? <UserRound size={17} /> : <IdCard size={17} />}
                    </motion.div>
                  </AnimatePresence>
                  <input
                    id="credential"
                    type="text"
                    value={credential}
                    onChange={(e) => setCredential(e.target.value)}
                    placeholder={credentialPlaceholder}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="lg-field">
                <label htmlFor="password">
                  {t('login.password')}
                  <a className="lg-forgot" href="/auth/forgot-password">
                    {t('login.forgot')}
                  </a>
                </label>
                <div className="lg-input-wrap">
                  <LockKeyhole size={17} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    className="lg-eye"
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="lg-row">
                <label className="lg-check">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  {t('login.remember')}
                </label>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    className="lg-error"
                    initial={{ opacity: 0, height: 0, y: 8 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                className="lg-submit"
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <>
                    <Loader2 size={17} className="lg-spin" />
                    {t('login.loading')}
                  </>
                ) : (
                  <>
                    {t('login.submit')}
                    <ArrowRight size={17} />
                  </>
                )}
              </motion.button>

              <div className="lg-divider">SSO</div>

              <div className="lg-sso">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Building2 size={16} />
                  {t('login.sso')}
                  <ChevronRight size={15} />
                </motion.button>
              </div>

              <div className="lg-switch">
                <span>{t('auth.noAccount')}</span>
                <motion.button
                  type="button"
                  className="lg-switch-btn"
                  onClick={() => navigate('/auth/register')}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {t('auth.registerBtn')}
                  <ArrowRight size={15} />
                </motion.button>
              </div>
            </form>

            <div className="lg-security">
              {[
                { icon: CheckCircle2, text: t('login.activeDirectory') },
                { icon: Fingerprint, text: t('login.biometric') },
                { icon: KeyRound, text: t('login.secure') },
              ].map((sec) => (
                <div className="lg-sec-item" key={sec.text}>
                  <sec.icon size={14} />
                  {sec.text}
                </div>
              ))}
            </div>
          </motion.div>
        </section>
      </div>

      <DeviceLimitModal
        isOpen={maxDevicesReached}
        devices={pendingDevices}
        onDeviceRemoved={(sessionId) => {
          setMaxDevices(false);
          handleLogin(undefined, sessionId);
        }}
        onCancel={() => setMaxDevices(false)}
      />
    </main>
  );
}
