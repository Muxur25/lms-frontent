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
  Moon,
  ShieldCheck,
  Sparkles,
  SunMedium,
  UserRound,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/auth.store';
import { DeviceLimitModal } from '../components/auth/DeviceLimitModal';


type Lang = 'uz' | 'ru';
type LoginMode = 'username' | 'employee';
type ThemeMode = 'dark' | 'light';

const getAuthPayload = (response: any) => response?.data || response;

export default function Login() {
  const navigate = useNavigate();
  const loginAction = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const maxDevicesReached = useAuthStore((state) => state.maxDevicesReached);
  const pendingDevices = useAuthStore((state) => state.pendingDevices);
  const setMaxDevices = useAuthStore((state) => state.setMaxDevices);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const { t, i18n } = useTranslation();
  const [lang, setLang] = useState<Lang>((i18n.language as Lang) || 'uz');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [mode, setMode] = useState<LoginMode>('username');
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLangChange = (l: Lang) => { setLang(l); i18n.changeLanguage(l); };

  const credentialPlaceholder = useMemo(
    () => (mode === 'username' ? 'muxurga1' : '1608'),
    [mode],
  );


  const handleLogin = async (e?: React.FormEvent, removeSessionId?: string) => {
    if (e) e.preventDefault();
    setError('');

    if (!credential.trim()) {
      setError(t('login.validationCredential'));
      return;
    }

    if (password.trim().length < 4) {
      setError(t('login.validationPassword'));
      return;
    }

    setLoading(true);

    try {
      const response: any = await api
        .post('/auth/login', {
          credential: credential.trim(),
          password,
          remember,
          loginMode: mode,
          removeSessionId,
        })
        .catch((requestError) => {
          throw requestError;
        });

      const authPayload = getAuthPayload(response);

      if (authPayload?.maxDevicesReached || response.maxDevicesReached) {
        setMaxDevices(true, authPayload?.devices || response.devices || []);
        return;
      }

      if (authPayload?.user && authPayload?.accessToken && authPayload?.refreshToken) {
        loginAction(authPayload.user, authPayload.accessToken, authPayload.refreshToken);
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

  return (
    <main className={`auth-premium auth-${theme}`}>
      <style>{`
        .auth-premium {
          --auth-bg: #050711;
          --auth-card: rgba(255,255,255,.07);
          --auth-card-strong: rgba(255,255,255,.11);
          --auth-border: rgba(255,255,255,.13);
          --auth-text: #f8fbff;
          --auth-muted: #a8b3c7;
          --auth-soft: #748097;
          --auth-cyan: #7cf5ff;
          --auth-blue: #5b8cff;
          --auth-violet: #aa83ff;
          --auth-green: #83f7bd;
          min-height: 100vh;
          color: var(--auth-text);
          background:
            radial-gradient(circle at 16% 14%, rgba(124,245,255,.18), transparent 30rem),
            radial-gradient(circle at 82% 18%, rgba(170,131,255,.20), transparent 34rem),
            radial-gradient(circle at 45% 88%, rgba(131,247,189,.10), transparent 32rem),
            linear-gradient(180deg, #060917, #04060d 55%, #070a14);
          position: relative;
          overflow: hidden;
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .auth-light {
          --auth-bg: #edf4fb;
          --auth-card: rgba(255,255,255,.72);
          --auth-card-strong: rgba(255,255,255,.9);
          --auth-border: rgba(23,35,61,.12);
          --auth-text: #07111f;
          --auth-muted: #536178;
          --auth-soft: #718096;
          background:
            radial-gradient(circle at 16% 14%, rgba(38,198,218,.28), transparent 30rem),
            radial-gradient(circle at 82% 18%, rgba(124,91,255,.18), transparent 34rem),
            linear-gradient(180deg, #f8fbff, #eaf1f8);
        }
        .auth-premium * { box-sizing: border-box; }
        .auth-grid-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px);
          background-size: 74px 74px;
          mask-image: linear-gradient(to bottom, rgba(0,0,0,.9), transparent 78%);
        }
        .auth-light .auth-grid-bg {
          background-image:
            linear-gradient(rgba(8,17,31,.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(8,17,31,.05) 1px, transparent 1px);
        }
        .auth-shell {
          width: min(1180px, calc(100% - 48px));
          min-height: 100vh;
          margin: 0 auto;
          padding: 32px 0;
          display: grid;
          grid-template-columns: minmax(0, 1.02fr) minmax(430px, .78fr);
          gap: 54px;
          align-items: center;
          position: relative;
          z-index: 2;
        }
        .auth-brand {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 72px;
        }
        .auth-logo {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: #fff;
          color: #07111f;
          font-weight: 950;
          box-shadow: 0 0 44px rgba(124,245,255,.22);
        }
        .auth-brand-title { font-weight: 950; letter-spacing: -.02em; }
        .auth-brand-sub {
          margin-top: 2px;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .34em;
          color: var(--auth-cyan);
        }
        .auth-copy { max-width: 680px; }
        .auth-eyebrow {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 11px;
          border: 1px solid rgba(124,245,255,.24);
          background: rgba(124,245,255,.09);
          border-radius: 999px;
          color: var(--auth-cyan);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: .22em;
          text-transform: uppercase;
        }
        .auth-title {
          margin: 22px 0 0;
          font-size: clamp(3.1rem, 5vw, 5.45rem);
          line-height: .94;
          letter-spacing: -.065em;
          font-weight: 950;
          text-wrap: balance;
        }
        .auth-title span {
          background: linear-gradient(120deg, var(--auth-text) 8%, var(--auth-cyan) 42%, var(--auth-violet) 82%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .auth-lead {
          margin: 26px 0 0;
          max-width: 610px;
          color: var(--auth-muted);
          font-size: 18px;
          line-height: 1.75;
          font-weight: 550;
        }
        .auth-visual {
          margin-top: 42px;
          display: grid;
          grid-template-columns: 1.2fr .8fr;
          gap: 14px;
        }
        .auth-panel,
        .auth-mini,
        .auth-card {
          border: 1px solid var(--auth-border);
          background: var(--auth-card);
          box-shadow: 0 34px 100px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.11);
          backdrop-filter: blur(24px);
        }
        .auth-panel {
          min-height: 310px;
          border-radius: 28px;
          padding: 22px;
          overflow: hidden;
          position: relative;
        }
        .auth-panel::after {
          content: "";
          position: absolute;
          width: 260px;
          height: 260px;
          right: -80px;
          top: -90px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(124,245,255,.2), transparent 68%);
        }
        .auth-panel-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
          position: relative;
          z-index: 1;
        }
        .auth-chip {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 10px;
          border-radius: 999px;
          background: rgba(131,247,189,.1);
          border: 1px solid rgba(131,247,189,.18);
          color: var(--auth-green);
          font-size: 11px;
          font-weight: 950;
        }
        .auth-panel h2 {
          margin: 16px 0 0;
          font-size: 27px;
          line-height: 1.05;
          letter-spacing: -.04em;
        }
        .auth-panel p {
          color: var(--auth-muted);
          line-height: 1.6;
          margin: 12px 0 0;
          max-width: 360px;
        }
        .auth-bars {
          height: 128px;
          display: flex;
          gap: 9px;
          align-items: end;
          margin-top: 28px;
          position: relative;
          z-index: 1;
        }
        .auth-bars i {
          flex: 1;
          min-width: 16px;
          border-radius: 10px 10px 3px 3px;
          background: linear-gradient(180deg, #d778ff, #5d8eff 48%, #00c2d7);
        }
        .auth-mini-stack {
          display: grid;
          gap: 14px;
        }
        .auth-mini {
          border-radius: 24px;
          padding: 20px;
          min-height: 148px;
        }
        .auth-mini svg { color: var(--auth-cyan); margin-bottom: 18px; }
        .auth-mini strong { display: block; font-size: 17px; }
        .auth-mini span {
          display: block;
          margin-top: 9px;
          color: var(--auth-muted);
          font-size: 13px;
          line-height: 1.55;
        }
        .auth-card-wrap {
          position: relative;
        }
        .auth-card-wrap::before {
          content: "";
          position: absolute;
          inset: -1px;
          border-radius: 32px;
          background: linear-gradient(145deg, rgba(124,245,255,.35), rgba(170,131,255,.22), transparent 55%);
          filter: blur(16px);
          opacity: .75;
        }
        .auth-card {
          position: relative;
          border-radius: 30px;
          padding: 28px;
          background:
            linear-gradient(180deg, rgba(255,255,255,.105), rgba(255,255,255,.045)),
            rgba(7,12,25,.72);
        }
        .auth-light .auth-card {
          background: rgba(255,255,255,.78);
        }
        .auth-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          margin-bottom: 28px;
        }
        .auth-lang,
        .auth-theme {
          display: flex;
          padding: 4px;
          border-radius: 999px;
          background: rgba(255,255,255,.065);
          border: 1px solid var(--auth-border);
        }
        .auth-light .auth-lang,
        .auth-light .auth-theme {
          background: rgba(7,17,31,.05);
        }
        .auth-lang button,
        .auth-theme button {
          border: 0;
          border-radius: 999px;
          min-width: 38px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: transparent;
          color: var(--auth-soft);
          font-weight: 950;
          font-size: 11px;
          cursor: pointer;
        }
        .auth-lang button.active,
        .auth-theme button.active {
          background: var(--auth-text);
          color: var(--auth-bg);
        }
        .auth-card-head { margin-bottom: 24px; }
        .auth-card-head h1 {
          margin: 0;
          font-size: 30px;
          line-height: 1.08;
          letter-spacing: -.045em;
          font-weight: 950;
        }
        .auth-card-head p {
          margin: 10px 0 0;
          color: var(--auth-muted);
          line-height: 1.6;
          font-size: 14px;
        }
        .auth-mode {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          padding: 6px;
          border-radius: 16px;
          background: rgba(255,255,255,.06);
          border: 1px solid var(--auth-border);
          margin-bottom: 20px;
        }
        .auth-light .auth-mode { background: rgba(7,17,31,.045); }
        .auth-mode button {
          border: 0;
          min-height: 42px;
          border-radius: 12px;
          color: var(--auth-muted);
          background: transparent;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 950;
          cursor: pointer;
        }
        .auth-mode button.active {
          background: var(--auth-card-strong);
          color: var(--auth-text);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.1);
        }
        .auth-form { display: grid; gap: 16px; }
        .auth-field label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 8px;
          color: var(--auth-muted);
          font-size: 12px;
          font-weight: 900;
        }
        .auth-input-wrap {
          min-height: 52px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
          border-radius: 16px;
          background: rgba(255,255,255,.062);
          border: 1px solid var(--auth-border);
          transition: border-color .2s ease, background .2s ease, box-shadow .2s ease;
        }
        .auth-light .auth-input-wrap { background: rgba(7,17,31,.045); }
        .auth-input-wrap:focus-within {
          border-color: rgba(124,245,255,.45);
          box-shadow: 0 0 0 4px rgba(124,245,255,.08);
        }
        .auth-input-wrap svg { color: var(--auth-cyan); flex: 0 0 auto; }
        .auth-input-wrap input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--auth-text);
          font-size: 14px;
          font-weight: 750;
        }
        .auth-input-wrap input::placeholder { color: var(--auth-soft); }
        .auth-icon-btn {
          border: 0;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: transparent;
          cursor: pointer;
        }
        .auth-icon-btn:hover { background: rgba(255,255,255,.08); }
        .auth-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 2px;
        }
        .auth-check {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          color: var(--auth-muted);
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }
        .auth-check input {
          width: 16px;
          height: 16px;
          accent-color: var(--auth-cyan);
        }
        .auth-link {
          color: var(--auth-cyan);
          font-size: 13px;
          font-weight: 950;
          text-decoration: none;
        }
        .auth-error {
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid rgba(248,113,113,.28);
          background: rgba(248,113,113,.10);
          color: #fecaca;
          font-size: 13px;
          font-weight: 750;
          line-height: 1.45;
        }
        .auth-light .auth-error { color: #991b1b; }
        .auth-submit {
          width: 100%;
          min-height: 54px;
          border: 0;
          border-radius: 17px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: linear-gradient(135deg, #ffffff, #bff7ff);
          color: #07111f;
          font-size: 14px;
          font-weight: 950;
          cursor: pointer;
          box-shadow: 0 18px 48px rgba(124,245,255,.2);
        }
        .auth-submit:disabled {
          opacity: .7;
          cursor: wait;
        }
        .auth-divider {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 12px;
          align-items: center;
          color: var(--auth-soft);
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .16em;
          margin: 4px 0;
        }
        .auth-divider::before,
        .auth-divider::after {
          content: "";
          height: 1px;
          background: var(--auth-border);
        }
        .auth-sso {
          display: grid;
          gap: 10px;
        }
        .auth-sso button {
          min-height: 46px;
          border-radius: 15px;
          border: 1px solid var(--auth-border);
          background: rgba(255,255,255,.055);
          color: var(--auth-text);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 950;
          cursor: pointer;
        }
        .auth-light .auth-sso button { background: rgba(7,17,31,.045); }
        .auth-switch {
          margin-top: 16px;
          padding: 14px;
          border-radius: 18px;
          border: 1px solid var(--auth-border);
          background: rgba(255,255,255,.045);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .auth-light .auth-switch { background: rgba(7,17,31,.045); }
        .auth-switch span {
          color: var(--auth-muted);
          font-size: 13px;
          font-weight: 750;
        }
        .auth-switch button {
          min-height: 40px;
          border-radius: 13px;
          border: 1px solid rgba(124,245,255,.34);
          background: rgba(124,245,255,.1);
          color: var(--auth-text);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 14px;
          font-size: 13px;
          font-weight: 950;
          cursor: pointer;
          white-space: nowrap;
        }
        .auth-light .auth-switch button {
          color: #07111f;
          background: rgba(7,17,31,.055);
        }
        .auth-security-list {
          margin-top: 20px;
          display: grid;
          gap: 9px;
        }
        .auth-demo-users {
          margin-top: 20px;
          border: 1px solid var(--auth-border);
          background: rgba(255,255,255,.045);
          border-radius: 18px;
          padding: 14px;
        }
        .auth-demo-title {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--auth-cyan);
          font-size: 12px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: .12em;
          margin-bottom: 10px;
        }
        .auth-demo-grid {
          display: grid;
          gap: 8px;
          max-height: 190px;
          overflow: auto;
          padding-right: 2px;
        }
        .auth-demo-user {
          border: 1px solid rgba(255,255,255,.09);
          background: rgba(255,255,255,.045);
          border-radius: 14px;
          padding: 10px 11px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
          align-items: center;
          text-align: left;
          color: var(--auth-text);
          cursor: pointer;
        }
        .auth-demo-user:hover {
          border-color: rgba(124,245,255,.28);
          background: rgba(124,245,255,.08);
        }
        .auth-demo-user strong {
          display: block;
          font-size: 12px;
        }
        .auth-demo-user span {
          display: block;
          margin-top: 3px;
          color: var(--auth-muted);
          font-size: 11px;
        }
        .auth-demo-pass {
          color: var(--auth-cyan);
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 900;
        }
        .auth-security-item {
          display: flex;
          align-items: center;
          gap: 9px;
          color: var(--auth-muted);
          font-size: 12px;
          font-weight: 800;
        }
        .auth-security-item svg { color: var(--auth-green); }
        @media (max-width: 1060px) {
          .auth-shell {
            grid-template-columns: 1fr;
            max-width: 760px;
          }
          .auth-brand { margin-bottom: 46px; }
          .auth-card-wrap { max-width: 520px; width: 100%; margin: 0 auto; }
        }
        @media (max-width: 680px) {
          .auth-shell {
            width: min(100% - 24px, 100%);
            padding: 20px 0;
          }
          .auth-brand { margin-bottom: 32px; }
          .auth-title { font-size: clamp(2.35rem, 13vw, 3.6rem); }
          .auth-lead { font-size: 15px; }
          .auth-visual { grid-template-columns: 1fr; }
          .auth-card { padding: 20px; border-radius: 24px; }
          .auth-toolbar, .auth-row { align-items: flex-start; flex-direction: column; }
          .auth-lang, .auth-theme, .auth-row .auth-link { width: 100%; }
          .auth-lang button, .auth-theme button { flex: 1; }
          .auth-switch { align-items: stretch; flex-direction: column; }
          .auth-switch button { width: 100%; }
        }
      `}</style>

      <div className="auth-grid-bg" />

      <div className="auth-shell">
        <section className="auth-copy" aria-label="AGMK LMS enterprise login overview">
          <div className="auth-brand">
            <div className="auth-logo">A</div>
            <div>
              <div className="auth-brand-title">AGMK LMS</div>
              <div className="auth-brand-sub">ENTERPRISE AI</div>
            </div>
          </div>

          <div className="auth-eyebrow">
            <Sparkles size={15} />
            {t('login.eyebrow')}
          </div>
          <h1 className="auth-title">
            {t('login.headline').split('AI')[0]}
            <span>AI</span>
            {t('login.headline').split('AI').slice(1).join('AI')}
          </h1>
          <p className="auth-lead">{t('login.subline')}</p>

          <div className="auth-visual">
            <div className="auth-panel">
              <div className="auth-panel-top">
                <div>
                  <div className="auth-chip">
                    <ShieldCheck size={14} />
                    {t('login.secure')}
                  </div>
                  <h2>{t('login.panelTitle')}</h2>
                  <p>{t('login.panelText')}</p>
                </div>
                <Bot color="var(--auth-cyan)" size={28} />
              </div>
              <div className="auth-bars">
                {[42, 78, 58, 96, 72, 112, 86, 124].map((height, index) => (
                  <i key={index} style={{ height }} />
                ))}
              </div>
            </div>

            <div className="auth-mini-stack">
              <div className="auth-mini">
                <Laptop size={24} />
                <strong>{t('login.device')}</strong>
                <span>Windows 11 • Tashkent • Protected browser</span>
              </div>
              <div className="auth-mini">
                <BadgeCheck size={24} />
                <strong>Compliance ready</strong>
                <span>{t('login.quote')}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="auth-card-wrap" aria-label="Login form">
          <div className="auth-card">
            <div className="auth-toolbar">
              <div className="auth-lang" aria-label="Language switcher">
                {(['uz', 'ru'] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={lang === item ? 'active' : ''}
                    onClick={() => handleLangChange(item)}
                  >
                    <Globe2 size={13} />
                    {item.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="auth-theme" aria-label="Theme switcher">
                <button
                  type="button"
                  className={theme === 'dark' ? 'active' : ''}
                  onClick={() => setTheme('dark')}
                  aria-label="Dark theme"
                >
                  <Moon size={14} />
                </button>
                <button
                  type="button"
                  className={theme === 'light' ? 'active' : ''}
                  onClick={() => setTheme('light')}
                  aria-label="Light theme"
                >
                  <SunMedium size={14} />
                </button>
              </div>
            </div>

            <div className="auth-card-head">
              <h1>{t('login.submit')}</h1>
              <p>{t('login.subline')}</p>
            </div>

            <div className="auth-mode" role="tablist" aria-label="Login method">
              <button
                type="button"
                className={mode === 'username' ? 'active' : ''}
                onClick={() => setMode('username')}
              >
                <UserRound size={15} />
                {t('login.username')}
              </button>
              <button
                type="button"
                className={mode === 'employee' ? 'active' : ''}
                onClick={() => setMode('employee')}
              >
                <IdCard size={15} />
                {t('login.employee')}
              </button>
            </div>

            <form className="auth-form" onSubmit={handleLogin}>
              <div className="auth-field">
                <label htmlFor="credential">{mode === 'username' ? t('login.usernameLabel') : t('login.employeeLabel')}</label>
                <div className="auth-input-wrap">
                  {mode === 'username' ? <UserRound size={18} /> : <IdCard size={18} />}
                  <input
                    id="credential"
                    type="text"
                    value={credential}
                    onChange={(event) => setCredential(event.target.value)}
                    placeholder={credentialPlaceholder}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="password">
                  {t('login.password')}
                  <a className="auth-link" href="/auth/forgot-password">
                    {t('login.forgot')}
                  </a>
                </label>
                <div className="auth-input-wrap">
                  <LockKeyhole size={18} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    className="auth-icon-btn"
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="auth-row">
                <label className="auth-check">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                  />
                  {t('login.remember')}
                </label>
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button className="auth-submit" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {t('login.loading')}
                  </>
                ) : (
                  <>
                    {t('login.submit')}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div className="auth-divider">SSO</div>

              <div className="auth-sso">
                <button type="button">
                  <Building2 size={17} />
                  {t('login.sso')}
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="auth-switch">
                <span>{t('auth.noAccount')}</span>
                <button type="button" onClick={() => navigate('/auth/register')}>
                  {t('auth.registerBtn')}
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>

            <div className="auth-security-list">
              <div className="auth-security-item">
                <CheckCircle2 size={15} />
                {t('login.activeDirectory')}
              </div>
              <div className="auth-security-item">
                <Fingerprint size={15} />
                {t('login.biometric')}
              </div>
              <div className="auth-security-item">
                <KeyRound size={15} />
                {t('login.secure')}
              </div>
            </div>


          </div>
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
