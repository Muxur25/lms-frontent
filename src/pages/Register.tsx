import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BadgeCheck,
  Bot,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  FileCheck2,
  IdCard,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';

type Lang = 'uz' | 'ru';

type FormState = {
  fullName: string;
  employeeId: string;
  jshshir: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
};

const steps = ['personal', 'security'] as const;
const getAuthPayload = (response: any) => response?.data || response;



const initialForm: FormState = {
  fullName: '',
  employeeId: '',
  jshshir: '',
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
};

export default function Register() {
  const navigate = useNavigate();
  const loginAction = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { t, i18n } = useTranslation();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const [lang, setLang] = useState<Lang>((i18n.language as Lang) || 'uz');
  const handleLangChange = (l: Lang) => { setLang(l); i18n.changeLanguage(l); };
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const percent = Math.round((step / (steps.length - 1)) * 100);



  const update = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError('');
  };

  const validateStep = () => {
    if (step === 0) {
      if (!form.fullName.trim() || !form.employeeId.trim() || !form.jshshir.trim()) {
        setError(t('register.errorsRequired'));
        return false;
      }
      if (form.jshshir.trim().length !== 14 || !/^\d+$/.test(form.jshshir.trim())) {
        setError(t('register.errorsJshshir'));
        return false;
      }
      if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        setError(lang === 'uz' ? 'Noto‘g‘ri email formati.' : 'Неверный формат email.');
        return false;
      }
    }
    if (step === 1) {
      if (!form.username.trim() || !form.password || !form.confirmPassword) {
        setError(t('register.errorsRequired'));
        return false;
      }
      if (form.password.length < 6) {
        setError(t('register.errorsPassword'));
        return false;
      }
      if (form.password !== form.confirmPassword) {
        setError(t('register.errorsPassword'));
        return false;
      }
    }
    return true;
  };

  const next = async () => {
    if (!validateStep()) return;
    if (step === 0) {
      setStep(1);
    } else if (step === 1) {
      setLoading(true);
      try {
        const response: any = await api.post('/auth/register', {
          fullName: form.fullName.trim(),
          employeeId: form.employeeId.trim(),
          jshshir: form.jshshir.trim(),
          email: form.email.trim() || undefined,
          username: form.username.trim(),
          password: form.password,
          confirmPassword: form.confirmPassword,
        });
        const authPayload = getAuthPayload(response);
        loginAction(authPayload.user, authPayload.accessToken, authPayload.refreshToken);
        navigate('/dashboard');
      } catch (requestError: any) {
        setError(requestError.message || t('register.errorsRequired'));
      } finally {
        setLoading(false);
      }
    }
  };

  const back = () => {
    setError('');
    setStep((current) => Math.max(current - 1, 0));
  };

  const complete = (event: React.FormEvent) => {
    event.preventDefault();
    next();
  };

  return (
    <main className="onboard-page">
      <style>{`
        .onboard-page {
          --ob-bg: #050711;
          --ob-card: rgba(255,255,255,.07);
          --ob-card-2: rgba(255,255,255,.11);
          --ob-border: rgba(255,255,255,.13);
          --ob-text: #f8fbff;
          --ob-muted: #a8b3c7;
          --ob-soft: #748097;
          --ob-cyan: #7cf5ff;
          --ob-violet: #aa83ff;
          --ob-green: #83f7bd;
          min-height: 100vh;
          color: var(--ob-text);
          background:
            radial-gradient(circle at 12% 12%, rgba(124,245,255,.19), transparent 30rem),
            radial-gradient(circle at 84% 18%, rgba(170,131,255,.23), transparent 34rem),
            radial-gradient(circle at 45% 90%, rgba(131,247,189,.1), transparent 34rem),
            linear-gradient(180deg, #060917, #04060d 58%, #070a14);
          overflow: hidden;
          position: relative;
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .onboard-page * { box-sizing: border-box; }
        .ob-grid {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px);
          background-size: 74px 74px;
          mask-image: linear-gradient(to bottom, rgba(0,0,0,.9), transparent 80%);
        }
        .ob-shell {
          width: min(1220px, calc(100% - 48px));
          min-height: 100vh;
          margin: 0 auto;
          padding: 30px 0;
          display: grid;
          grid-template-columns: minmax(0, .9fr) minmax(520px, 1.1fr);
          gap: 46px;
          align-items: center;
          position: relative;
          z-index: 2;
        }
        .ob-brand {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 64px;
        }
        .ob-logo-row { display: flex; align-items: center; gap: 13px; }
        .ob-logo {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: #fff;
          color: #07111f;
          font-weight: 950;
          box-shadow: 0 0 44px rgba(124,245,255,.22);
        }
        .ob-brand-title { font-weight: 950; letter-spacing: -.02em; }
        .ob-brand-sub { margin-top: 2px; color: var(--ob-cyan); font-size: 10px; font-weight: 900; letter-spacing: .34em; }
        .ob-lang {
          display: flex;
          padding: 4px;
          border-radius: 999px;
          border: 1px solid var(--ob-border);
          background: rgba(255,255,255,.06);
        }
        .ob-lang button {
          border: 0;
          border-radius: 999px;
          min-width: 40px;
          height: 32px;
          background: transparent;
          color: var(--ob-soft);
          font-size: 11px;
          font-weight: 950;
          cursor: pointer;
        }
        .ob-lang button.active { background: white; color: #07111f; }
        .ob-eyebrow {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 11px;
          border-radius: 999px;
          border: 1px solid rgba(124,245,255,.24);
          background: rgba(124,245,255,.09);
          color: var(--ob-cyan);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: .22em;
          text-transform: uppercase;
        }
        .ob-title {
          margin: 22px 0 0;
          font-size: clamp(3rem, 4.8vw, 5.25rem);
          line-height: .94;
          letter-spacing: -.065em;
          font-weight: 950;
          text-wrap: balance;
        }
        .ob-title span {
          background: linear-gradient(120deg, #fff 8%, var(--ob-cyan) 45%, var(--ob-violet) 85%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .ob-lead {
          margin: 24px 0 0;
          color: var(--ob-muted);
          font-size: 18px;
          line-height: 1.72;
          max-width: 620px;
        }
        .ob-preview {
          margin-top: 42px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .ob-visual-card,
        .ob-card,
        .ob-step-card,
        .ob-mini {
          border: 1px solid var(--ob-border);
          background: var(--ob-card);
          backdrop-filter: blur(24px);
          box-shadow: 0 34px 100px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.11);
        }
        .ob-visual-card {
          grid-column: span 2;
          border-radius: 28px;
          padding: 22px;
        }
        .ob-visual-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
        .ob-chip {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 10px;
          border-radius: 999px;
          color: var(--ob-green);
          background: rgba(131,247,189,.1);
          border: 1px solid rgba(131,247,189,.18);
          font-size: 11px;
          font-weight: 950;
        }
        .ob-bars { height: 132px; display: flex; align-items: end; gap: 9px; margin-top: 28px; }
        .ob-bars i {
          flex: 1;
          border-radius: 10px 10px 3px 3px;
          background: linear-gradient(180deg, #d778ff, #5d8eff 48%, #00c2d7);
        }
        .ob-mini { border-radius: 22px; padding: 20px; min-height: 150px; }
        .ob-mini svg { color: var(--ob-cyan); margin-bottom: 22px; }
        .ob-mini strong { display: block; }
        .ob-mini span { display: block; margin-top: 8px; color: var(--ob-muted); font-size: 13px; line-height: 1.55; }
        .ob-card-wrap { position: relative; }
        .ob-card-wrap::before {
          content: "";
          position: absolute;
          inset: -1px;
          border-radius: 34px;
          background: linear-gradient(145deg, rgba(124,245,255,.34), rgba(170,131,255,.25), transparent 56%);
          filter: blur(16px);
          opacity: .78;
        }
        .ob-card {
          position: relative;
          border-radius: 32px;
          padding: 28px;
          min-height: 520px;
          background: linear-gradient(180deg, rgba(255,255,255,.105), rgba(255,255,255,.045)), rgba(7,12,25,.72);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .ob-progress-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          margin-bottom: 24px;
        }
        .ob-progress-label { color: var(--ob-muted); font-size: 12px; font-weight: 950; text-transform: uppercase; letter-spacing: .16em; }
        .ob-percent { color: var(--ob-cyan); font-weight: 950; }
        .ob-progress {
          height: 8px;
          border-radius: 999px;
          overflow: hidden;
          background: rgba(255,255,255,.08);
          margin-bottom: 22px;
        }
        .ob-progress i {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, var(--ob-cyan), var(--ob-violet));
          transition: width .35s ease;
        }
        .ob-steps {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-bottom: 28px;
        }
        .ob-step-dot {
          height: 44px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          color: var(--ob-soft);
          background: rgba(255,255,255,.055);
          border: 1px solid var(--ob-border);
          font-size: 12px;
          font-weight: 950;
        }
        .ob-step-dot.active { color: #07111f; background: white; }
        .ob-step-dot.done { color: var(--ob-green); border-color: rgba(131,247,189,.22); background: rgba(131,247,189,.08); }
        .ob-step-card {
          border-radius: 24px;
          padding: 24px;
          min-height: 290px;
          background: rgba(255,255,255,.045);
        }
        .ob-step-card h2 { margin: 0; font-size: 30px; line-height: 1.08; letter-spacing: -.045em; }
        .ob-step-card p { margin: 10px 0 0; color: var(--ob-muted); line-height: 1.6; }
        .ob-form-grid { margin-top: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .ob-field { grid-column: span 1; }
        .ob-field.full { grid-column: span 2; }
        .ob-field label { display: block; margin-bottom: 8px; color: var(--ob-muted); font-size: 12px; font-weight: 900; }
        .ob-input {
          min-height: 52px;
          width: 100%;
          border-radius: 16px;
          border: 1px solid var(--ob-border);
          background: rgba(255,255,255,.062);
          color: var(--ob-text);
          outline: none;
          padding: 0 14px;
          font-size: 14px;
          font-weight: 750;
        }
        .ob-input:focus { border-color: rgba(124,245,255,.45); box-shadow: 0 0 0 4px rgba(124,245,255,.08); }
        .ob-password { display: flex; align-items: center; gap: 8px; padding-right: 8px; }
        .ob-password input { border: 0; background: transparent; outline: 0; color: inherit; width: 100%; min-height: 50px; font-weight: 750; }
        .ob-icon-btn { border: 0; background: transparent; color: var(--ob-cyan); width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; cursor: pointer; }
        .ob-icon-btn:hover { background: rgba(255,255,255,.08); }
        .ob-role-preview {
          margin-top: 18px;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: center;
          padding: 16px;
          border-radius: 20px;
          background: rgba(124,245,255,.08);
          border: 1px solid rgba(124,245,255,.18);
        }
        .ob-avatar {
          width: 62px;
          height: 62px;
          display: grid;
          place-items: center;
          border-radius: 20px;
          background: white;
          color: #07111f;
          font-weight: 950;
          font-size: 18px;
        }
        .ob-error {
          margin-top: 16px;
          padding: 12px 14px;
          border-radius: 14px;
          background: rgba(248,113,113,.1);
          border: 1px solid rgba(248,113,113,.28);
          color: #fecaca;
          font-size: 13px;
          font-weight: 800;
        }
        .ob-actions {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 22px;
        }
        .ob-btn {
          border: 0;
          min-height: 50px;
          border-radius: 16px;
          padding: 0 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          font-size: 14px;
          font-weight: 950;
          cursor: pointer;
        }
        .ob-btn.primary { background: linear-gradient(135deg, #fff, #bff7ff); color: #07111f; box-shadow: 0 18px 48px rgba(124,245,255,.2); }
        .ob-btn.ghost { background: rgba(255,255,255,.06); color: var(--ob-text); border: 1px solid var(--ob-border); }
        .ob-btn:disabled { opacity: .65; cursor: wait; }
        .ob-switch {
          margin-top: 16px;
          padding: 14px;
          border-radius: 18px;
          border: 1px solid var(--ob-border);
          background: rgba(255,255,255,.045);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .ob-switch span {
          color: var(--ob-muted);
          font-size: 13px;
          font-weight: 750;
        }
        .ob-switch .ob-btn {
          min-height: 40px;
          padding: 0 14px;
          border-radius: 13px;
          white-space: nowrap;
        }
        @media (max-width: 1080px) {
          .ob-shell { grid-template-columns: 1fr; max-width: 820px; }
          .ob-brand { margin-bottom: 42px; }
        }
        @media (max-width: 680px) {
          .ob-shell { width: min(100% - 24px, 100%); padding: 20px 0; }
          .ob-title { font-size: clamp(2.35rem, 13vw, 3.6rem); }
          .ob-lead { font-size: 15px; }
          .ob-preview, .ob-form-grid { grid-template-columns: 1fr; }
          .ob-visual-card { grid-column: span 1; }
          .ob-card { padding: 18px; min-height: auto; border-radius: 24px; }
          .ob-step-card { padding: 18px; }
          .ob-actions { flex-direction: column-reverse; }
          .ob-switch { align-items: stretch; flex-direction: column; }
          .ob-btn { width: 100%; }
        }
      `}</style>

      <div className="ob-grid" />

      <div className="ob-shell">
        <section>
          <div className="ob-brand">
            <div className="ob-logo-row">
              <div className="ob-logo">A</div>
              <div>
                <div className="ob-brand-title">AGMK LMS</div>
                <div className="ob-brand-sub">ENTERPRISE AI</div>
              </div>
            </div>
            <div className="ob-lang" aria-label={t('register.lang')}>
              {(['uz', 'ru'] as const).map((item) => (
                <button key={item} className={lang === item ? 'active' : ''} onClick={() => handleLangChange(item)}>
                  {item.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="ob-eyebrow">
            <Sparkles size={15} />
            {t('register.eyebrow')}
          </div>
          <h1 className="ob-title">
            {t('register.title').split('AI')[0]}
            <span>AI</span>
            {t('register.title').split('AI').slice(1).join('AI')}
          </h1>
          <p className="ob-lead">{t('register.subtitle')}</p>

          <div className="ob-preview">
            <div className="ob-visual-card">
              <div className="ob-visual-head">
                <div>
                  <div className="ob-chip">
                    <ShieldCheck size={14} />
                    {lang === 'uz' ? 'Xavfsiz ulanish' : 'Безопасное соединение'}
                  </div>
                  <h2 style={{ margin: '16px 0 0', letterSpacing: '-.04em' }}>Learning readiness</h2>
                </div>
                <Bot color="var(--ob-cyan)" size={28} />
              </div>
              <div className="ob-bars">
                {[44, 82, 58, 106, 76, 124, 90, 132].map((height, index) => (
                  <i key={index} style={{ height }} />
                ))}
              </div>
            </div>
            <div className="ob-mini">
              <FileCheck2 size={24} />
              <strong>Smart verification</strong>
              <span>Tabel raqami, JShShIR va hisob ma'lumotlari avtomatik tekshiriladi.</span>
            </div>
            <div className="ob-mini">
              <BadgeCheck size={24} />
              <strong>Role-aware LMS</strong>
              <span>Kurslar va sertifikatlash yo'nalishlari xodimning lavozimiga qarab moslashtiriladi.</span>
            </div>
          </div>
        </section>

        <section className="ob-card-wrap">
          <form className="ob-card" onSubmit={complete}>
            <div>
              <div className="ob-progress-top">
                <div>
                  <div className="ob-progress-label">{t('register.progress')}</div>
                  <div className="ob-percent">{percent}%</div>
                </div>
                <button type="button" className="ob-btn ghost" onClick={() => navigate('/auth/login')}>
                  {t('register.backLogin')}
                </button>
              </div>

              <div className="ob-progress">
                <i style={{ width: `${percent}%` }} />
              </div>

              <div className="ob-steps">
                {steps.map((_, index) => (
                  <div key={index} className={`ob-step-dot ${index === step ? 'active' : ''} ${index < step ? 'done' : ''}`}>
                    {index + 1}
                  </div>
                ))}
              </div>

              {step === 0 && (
                <div className="ob-step-card">
                  <h2>{t('register.personalTitle')}</h2>
                  <p>{t('register.personalText')}</p>
                  <div className="ob-form-grid">
                    <Field label={t('register.fullName')} icon={<UserRound size={16} />}>
                      <input className="ob-input" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="Rustamov Husan" />
                    </Field>
                    <Field label={t('register.employeeId')} icon={<IdCard size={16} />}>
                      <input className="ob-input" value={form.employeeId} onChange={(e) => update('employeeId', e.target.value)} placeholder="AGMK-0004" />
                    </Field>
                    <Field label={t('register.jshshir')} icon={<ShieldCheck size={16} />}>
                      <input className="ob-input" value={form.jshshir} onChange={(e) => update('jshshir', e.target.value)} placeholder="31212951234567" maxLength={14} />
                    </Field>
                    <Field label={t('register.email')} icon={<Mail size={16} />}>
                      <input className="ob-input" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="name@agmk.uz" />
                    </Field>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="ob-step-card">
                  <h2>{t('register.securityTitle')}</h2>
                  <p>{t('register.securityText')}</p>
                  <div className="ob-form-grid">
                    <Field label={t('register.username')} icon={<UserRound size={16} />}>
                      <input className="ob-input" value={form.username} onChange={(e) => update('username', e.target.value)} placeholder="husan_rustamov" />
                    </Field>
                    <Field label={t('register.password')} icon={<LockKeyhole size={16} />}>
                      <div className="ob-input ob-password">
                        <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="••••••••" />
                        <button type="button" className="ob-icon-btn" onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                      </div>
                    </Field>
                    <Field label={t('register.confirmPassword')} icon={<LockKeyhole size={16} />}>
                      <div className="ob-input ob-password">
                        <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} placeholder="••••••••" />
                        <button type="button" className="ob-icon-btn" onClick={() => setShowConfirm((value) => !value)}>{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                      </div>
                    </Field>
                  </div>
                </div>
              )}

              {error && <div className="ob-error">{error}</div>}
            </div>

            <div className="ob-actions">
              <button type="button" className="ob-btn ghost" onClick={back} disabled={step === 0}>
                <ChevronLeft size={17} />
                {t('register.back')}
              </button>
              <button type={step === 1 ? 'submit' : 'button'} className="ob-btn primary" onClick={step === 1 ? undefined : next} disabled={loading}>
                {loading ? '...' : step === 1 ? t('register.finish') : t('register.next')}
                <ChevronRight size={17} />
              </button>
            </div>

            <div className="ob-switch">
              <span>{t('auth.hasAccount')}</span>
              <button type="button" className="ob-btn ghost" onClick={() => navigate('/auth/login')}>
                {t('auth.loginBtn')}
                <ChevronRight size={17} />
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="ob-field">
      <label>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          {icon}
          {label}
        </span>
      </label>
      {children}
    </div>
  );
}
