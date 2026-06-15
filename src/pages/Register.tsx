import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Eye,
  EyeOff,
  Fingerprint,
  IdCard,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { motion, AnimatePresence, useInView } from 'framer-motion';

/* ─────────────────── TYPES ─────────────────── */

type FormState = {
  subdivision: string;
  departmentId: string;
  departmentName: string;
  position: string;
  fullName: string;
  employeeId: string;
  username: string;
  password: string;
  confirmPassword: string;
};

type PositionOption = {
  name: string;
  employees: string[];
};

type DepartmentOption = {
  id?: string;
  name: string;
  displayName?: string;
  organizationCode?: string;
  subdivision?: string;
  positions: PositionOption[];
};

type Mof3Options = {
  subdivisions: string[];
  departments: DepartmentOption[];
};

/* ─────────────────── CONSTANTS ─────────────────── */

const initialForm: FormState = {
  subdivision: 'MOF-3',
  departmentId: '',
  departmentName: '',
  position: '',
  fullName: '',
  employeeId: '',
  username: '',
  password: '',
  confirmPassword: '',
};

const fallbackOptions: Mof3Options = {
  subdivisions: ['MOF-3'],
  departments: [],
};

const getAuthPayload = (response: any) => response?.data || response;
const getDataPayload = (response: any) => response?.data || response;

/* ─────────────── FLOATING PARTICLES ─────────────── */

function FloatingParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2.5 + 0.8,
        dur: Math.random() * 14 + 8,
        delay: Math.random() * 6,
        opacity: Math.random() * 0.35 + 0.08,
      })),
    [],
  );

  return (
    <div className="rg-particles" aria-hidden="true">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="rg-particle"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{
            y: [0, -24, 0, 18, 0],
            x: [0, 12, -8, 4, 0],
            opacity: [p.opacity, p.opacity * 1.5, p.opacity, p.opacity * 0.5, p.opacity],
          }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

/* ─────────────── REVEAL WRAPPER ─────────────── */

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 36 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────── PREMIUM DROPDOWN ─────────────── */

function Dropdown({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className={`rg-dropdown ${disabled ? 'disabled' : ''}`} ref={ref}>
      <div
        className="rg-dropdown-trigger"
        onClick={() => !disabled && setOpen(!open)}
      >
        <span className={selected ? 'selected' : 'placeholder'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} className={`rg-dropdown-icon ${open ? 'open' : ''}`} />
      </div>
      <AnimatePresence>
        {open && !disabled && (
          <motion.div
            className="rg-dropdown-menu"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {options.length === 0 ? (
              <div className="rg-dropdown-empty">Ma'lumot yo'q</div>
            ) : (
              options.map((opt) => (
                <div
                  key={opt.value}
                  className={`rg-dropdown-item ${value === opt.value ? 'active' : ''}`}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                  {value === opt.value && <CheckCircle2 size={14} className="rg-dropdown-check" />}
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────── MAIN ─────────────────── */

export default function Register() {
  const navigate = useNavigate();
  const loginAction = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [options, setOptions] = useState<Mof3Options>(fallbackOptions);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [verified, setVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    let mounted = true;
    api
      .get('/auth/mof3-registration-options')
      .then((response: any) => {
        if (!mounted) return;
        const payload = getDataPayload(response) as Mof3Options;
        const subdivisions = payload.subdivisions?.length ? payload.subdivisions : ['MOF-3'];
        setOptions({
          subdivisions,
          departments: payload.departments || [],
        });
        setForm((cur) => (
          subdivisions.includes(cur.subdivision)
            ? cur
            : { ...cur, subdivision: subdivisions[0] || 'MOF-3' }
        ));
      })
      .catch((err: any) => {
        if (mounted) setError(err.message || "MOF-3 ma'lumotlarini yuklab bo'lmadi.");
      })
      .finally(() => {
        if (mounted) setLoadingOptions(false);
      });
    return () => { mounted = false; };
  }, []);

  const selectedDepartment = useMemo(
    () => options.departments.find((d) => (d.id && d.id === form.departmentId) || d.name === form.departmentName),
    [form.departmentId, form.departmentName, options.departments],
  );
  const visibleDepartments = useMemo(
    () => options.departments.filter((department) => {
      const source = department.organizationCode || department.subdivision;
      return !form.subdivision || !source || source === form.subdivision;
    }),
    [form.subdivision, options.departments],
  );
  const positionOptions = selectedDepartment?.positions || [];
  const selectedPosition = useMemo(
    () => positionOptions.find((p) => p.name === form.position),
    [form.position, positionOptions],
  );
  const employeeOptions = selectedPosition?.employees || [];
  const percent = step === 0 ? 50 : 100;

  const employeePayload = useMemo(
    () => ({
      organizationCode: selectedDepartment?.organizationCode || 'MOF-3',
      subdivision: form.subdivision,
      departmentId: selectedDepartment?.id || form.departmentId || undefined,
      departmentName: form.departmentName,
      position: form.position,
      fullName: form.fullName,
      employeeId: form.employeeId.trim(),
    }),
    [form, selectedDepartment],
  );

  const selectDepartment = (value: string) => {
    const department = options.departments.find((item) => item.id === value || item.name === value);
    setForm((cur) => ({
      ...cur,
      subdivision: department?.organizationCode || department?.subdivision || cur.subdivision,
      departmentId: department?.id || '',
      departmentName: department?.name || value,
      position: '',
      fullName: '',
      employeeId: '',
    }));
    setVerified(false);
    setError('');
  };

  const selectSubdivision = (value: string) => {
    setForm((cur) => ({
      ...cur,
      subdivision: value,
      departmentId: '',
      departmentName: '',
      position: '',
      fullName: '',
      employeeId: '',
    }));
    setVerified(false);
    setError('');
  };

  const updateEmployee = (key: keyof FormState, value: string) => {
    setForm((cur) => {
      const next = { ...cur, [key]: value };
      if (key === 'departmentName') { next.position = ''; next.fullName = ''; next.employeeId = ''; }
      if (key === 'position') { next.fullName = ''; next.employeeId = ''; }
      if (key === 'fullName') { next.employeeId = ''; }
      return next;
    });
    setVerified(false);
    setError('');
  };

  const updateAccount = (key: keyof FormState, value: string) => {
    setForm((cur) => ({ ...cur, [key]: value }));
    setError('');
  };

  const verifyEmployee = async () => {
    if (!form.departmentName || !form.position || !form.fullName || !form.employeeId.trim()) {
      setError("Bo'lim, soha, F.I.O. va tabel raqamini to'ldiring.");
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/mof3-verify-employee', employeePayload);
      setVerified(true);
      setStep(1);
      setError('');
    } catch (err: any) {
      setVerified(false);
      setError(err.message || "Tabel raqami tanlangan xodim ma'lumotlariga mos kelmadi.");
    } finally {
      setLoading(false);
    }
  };

  const register = async () => {
    if (!form.username.trim() || !form.password || !form.confirmPassword) {
      setError("Username, parol va parol tasdig'ini kiriting.");
      return;
    }
    if (form.password.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Parollar bir-biriga mos kelmadi.');
      return;
    }
    setLoading(true);
    try {
      const response: any = await api.post('/auth/register', {
        ...employeePayload,
        department: form.departmentName,
        username: form.username.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      const auth = getAuthPayload(response);
      loginAction(auth.user, auth.accessToken, auth.refreshToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || "Ro'yxatdan o'tishda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 0) { verifyEmployee(); return; }
    register();
  };

  /* ─── Password strength ─── */
  const pwStrength = useMemo(() => {
    const pw = form.password;
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return Math.min(score, 5);
  }, [form.password]);

  const pwLabel = ['', 'Juda zaif', 'Zaif', "O'rtacha", 'Yaxshi', 'Kuchli'][pwStrength];
  const pwColor = ['', '#fb7185', '#fb923c', '#fbbf24', '#34d399', '#06b6d4'][pwStrength];

  return (
    <main className="rg">
      <style>{`
        /* ═══════════════════════════════════════════════════════
           AGMK LMS — PREMIUM REGISTER PAGE
           ═══════════════════════════════════════════════════════ */

        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800;14..32,900&display=swap');

        .rg {
          --bg: #030508;
          --bg-2: #060a0f;
          --surface: rgba(255,255,255,0.04);
          --surface-hover: rgba(255,255,255,0.07);
          --glass: rgba(255,255,255,0.055);
          --glass-border: rgba(255,255,255,0.1);
          --glass-strong: rgba(255,255,255,0.14);
          --line: rgba(255,255,255,0.08);
          --text: #f0f4f9;
          --text-2: #94a3b8;
          --text-3: #64748b;
          --accent: #06b6d4;
          --accent-2: #22d3ee;
          --emerald: #34d399;
          --violet: #a78bfa;
          --amber: #fbbf24;
          --coral: #fb7185;
          min-height: 100vh;
          color: var(--text);
          background: var(--bg);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }
        .rg * { box-sizing: border-box; }
        .rg a { text-decoration: none; color: inherit; }

        /* Particles */
        .rg-particles { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
        .rg-particle { position: absolute; border-radius: 50%; background: var(--accent-2); }

        /* Grid background */
        .rg-grid {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 72px 72px;
          mask-image: radial-gradient(ellipse 70% 50% at 50% 30%, black 20%, transparent 70%);
        }

        /* ─── Layout shell ─── */
        .rg-shell {
          position: relative;
          z-index: 2;
          width: min(1280px, calc(100% - 48px));
          min-height: 100vh;
          margin: 0 auto;
          padding: 36px 0;
          display: grid;
          grid-template-columns: 1fr minmax(480px, 560px);
          gap: 56px;
          align-items: center;
        }

        /* ─── LEFT SIDE ─── */
        .rg-hero { position: relative; }
        .rg-brand {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 56px;
        }
        .rg-logo-row { display: flex; align-items: center; gap: 12px; cursor: pointer; }
        .rg-logo-icon {
          width: 42px; height: 42px; border-radius: 12px;
          display: grid; place-items: center;
          font-weight: 900; font-size: 16px; color: var(--bg);
          background: linear-gradient(135deg, #06b6d4, #34d399);
          box-shadow: 0 0 0 1px rgba(6,182,212,0.3), 0 8px 32px rgba(6,182,212,0.25);
          transition: box-shadow 0.3s ease;
        }
        .rg-logo-row:hover .rg-logo-icon {
          box-shadow: 0 0 0 1px rgba(6,182,212,0.5), 0 12px 48px rgba(6,182,212,0.35);
        }
        .rg-logo-name { font-size: 15px; font-weight: 800; letter-spacing: -0.01em; }
        .rg-logo-sub { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; color: var(--accent-2); margin-top: 1px; }

        .rg-login-link {
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          min-height: 42px;
          display: inline-flex; align-items: center; gap: 8px;
          padding: 0 16px;
          background: var(--glass);
          color: #fff;
          font-size: 13px; font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
        }
        .rg-login-link:hover {
          background: var(--surface-hover);
          border-color: var(--glass-strong);
          transform: translateY(-1px);
        }

        .rg-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 36px;
          padding: 0 16px;
          border: 1px solid rgba(6,182,212,0.25);
          border-radius: 100px;
          background: rgba(6,182,212,0.08);
          color: var(--accent-2);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .rg-title {
          margin: 28px 0 20px;
          max-width: 640px;
          font-size: clamp(36px, 4.2vw, 56px);
          line-height: 0.98;
          letter-spacing: -0.03em;
          font-weight: 900;
          background: linear-gradient(135deg, #fff 0%, #e2e8f0 40%, #06b6d4 85%, #34d399 100%);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .rg-lead {
          max-width: 540px;
          margin: 0;
          color: var(--text-2);
          font-size: 16px;
          line-height: 1.75;
          font-weight: 450;
        }

        /* Signal cards */
        .rg-signals {
          margin-top: 36px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .rg-signal {
          min-height: 130px;
          border: 1px solid var(--line);
          border-radius: 16px;
          background: var(--glass);
          padding: 18px 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.35s ease;
          cursor: default;
        }
        .rg-signal:hover {
          background: var(--surface-hover);
          border-color: rgba(6,182,212,0.2);
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(6,182,212,0.06);
        }
        .rg-signal-icon {
          width: 40px; height: 40px; border-radius: 12px;
          display: grid; place-items: center;
          background: rgba(6,182,212,0.1);
          border: 1px solid rgba(6,182,212,0.15);
          color: var(--accent-2);
        }
        .rg-signal strong { font-size: 14px; font-weight: 800; letter-spacing: -0.01em; }
        .rg-signal span { margin-top: 4px; color: var(--text-3); font-size: 11.5px; line-height: 1.45; font-weight: 500; display: block; }

        /* Dashboard preview */
        .rg-visual {
          margin-top: 20px;
          min-height: 200px;
          border: 1px solid var(--glass-border);
          border-radius: 20px;
          overflow: hidden;
          position: relative;
          background:
            linear-gradient(135deg, rgba(6,182,212,0.06), transparent 50%),
            linear-gradient(315deg, rgba(251,191,36,0.04), transparent 50%),
            rgba(10,16,24,0.8);
          box-shadow: 0 24px 64px rgba(0,0,0,0.3);
        }
        .rg-visual::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 20px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(6,182,212,0.25), transparent 50%, rgba(52,211,153,0.15));
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          -webkit-mask-composite: xor;
          pointer-events: none;
        }
        .rg-visual-inner {
          padding: 18px;
          display: grid;
          grid-template-columns: 0.85fr 1.15fr;
          gap: 12px;
          min-height: 200px;
        }
        .rg-mini-screen {
          border-radius: 12px;
          border: 1px solid var(--line);
          background: rgba(3,5,8,0.6);
          padding: 16px;
          display: grid;
          gap: 10px;
          align-content: start;
        }
        .rg-sline {
          height: 10px;
          border-radius: 100px;
          background: rgba(255,255,255,0.08);
        }
        .rg-sline.active { background: rgba(52,211,153,0.3); }
        .rg-bars {
          display: flex;
          align-items: flex-end;
          gap: 6px;
          min-height: 100%;
        }
        .rg-bars span {
          flex: 1;
          border-radius: 4px 4px 0 0;
          background: linear-gradient(180deg, var(--accent-2), rgba(34,211,238,0.1));
        }

        /* ─── RIGHT SIDE — FORM CARD ─── */
        .rg-card {
          position: relative;
          border: 1px solid var(--glass-border);
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
        .rg-card::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 24px;
          padding: 1px;
          background: linear-gradient(180deg, rgba(6,182,212,0.2), transparent 40%, rgba(52,211,153,0.1));
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          -webkit-mask-composite: xor;
          pointer-events: none;
        }
        /* Glow orb behind card */
        .rg-card::after {
          content: '';
          position: absolute;
          top: -60%;
          left: 50%;
          transform: translateX(-50%);
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(6,182,212,0.1), transparent 70%);
          pointer-events: none;
          z-index: -1;
        }

        /* Card header */
        .rg-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 6px;
        }
        .rg-progress-info .rg-label {
          color: var(--text-3);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.03em;
        }
        .rg-progress-info .rg-pct {
          margin-top: 4px;
          font-size: 30px;
          font-weight: 900;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #fff, var(--accent-2));
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .rg-status-pill {
          min-height: 36px;
          border-radius: 100px;
          padding: 0 14px;
          border: 1px solid rgba(52,211,153,0.25);
          background: rgba(52,211,153,0.08);
          color: #a7f3d0;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 700;
        }

        /* Progress bar */
        .rg-progress-bar {
          height: 6px;
          margin: 16px 0 20px;
          border-radius: 100px;
          background: rgba(255,255,255,0.06);
          overflow: hidden;
        }
        .rg-progress-fill {
          height: 100%;
          border-radius: 100px;
          background: linear-gradient(90deg, var(--accent), var(--emerald), var(--amber));
          box-shadow: 0 0 16px rgba(6,182,212,0.4);
          transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }

        /* Step indicators */
        .rg-steps {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 24px;
        }
        .rg-step {
          min-height: 52px;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: var(--surface);
          color: var(--text-3);
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
          font-size: 13px;
          font-weight: 700;
          transition: all 0.3s ease;
        }
        .rg-step.active {
          background: #fff;
          color: var(--bg);
          border-color: #fff;
          box-shadow: 0 4px 16px rgba(255,255,255,0.1);
        }
        .rg-step.done {
          background: rgba(52,211,153,0.08);
          border-color: rgba(52,211,153,0.25);
          color: #a7f3d0;
        }
        .rg-step-num {
          width: 26px; height: 26px;
          border-radius: 8px;
          display: grid; place-items: center;
          background: rgba(255,255,255,0.08);
          font-size: 12px;
          font-weight: 900;
          flex-shrink: 0;
        }
        .rg-step.active .rg-step-num {
          background: var(--bg);
          color: #fff;
        }
        .rg-step.done .rg-step-num {
          background: rgba(52,211,153,0.15);
        }

        /* Form sections */
        .rg-form-section {
          border: 1px solid var(--line);
          border-radius: 16px;
          background: var(--surface);
          padding: 22px 20px;
        }
        .rg-form-section h2 {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .rg-form-section > p {
          margin: 8px 0 20px;
          color: var(--text-2);
          font-size: 13.5px;
          line-height: 1.6;
          font-weight: 450;
        }

        /* Form grid */
        .rg-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .rg-field.full { grid-column: span 2; }
        .rg-field label {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 8px;
          color: var(--text-2);
          font-size: 12px;
          font-weight: 700;
        }
        .rg-field label svg { color: var(--text-3); }

        .rg-input {
          width: 100%;
          min-height: 48px;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: rgba(3,5,8,0.6);
          color: #fff;
          outline: none;
          padding: 0 14px;
          font-size: 14px;
          font-weight: 500;
          font-family: inherit;
          transition: all 0.25s ease;
        }
        .rg-input:disabled {
          opacity: 1;
          cursor: not-allowed;
          color: var(--text-3);
          background: rgba(255,255,255,0.03);
          border-color: rgba(255,255,255,0.05);
        }
        .rg-input:focus {
          border-color: rgba(6,182,212,0.5);
          box-shadow: 0 0 0 3px rgba(6,182,212,0.08);
        }
        .rg-input::placeholder { color: var(--text-3); font-weight: 500; }

        /* Premium Dropdown */
        .rg-dropdown {
          position: relative;
          width: 100%;
        }
        .rg-dropdown.disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .rg-dropdown-trigger {
          width: 100%;
          min-height: 48px;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: rgba(3,5,8,0.6);
          color: #fff;
          padding: 0 14px;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.25s ease;
          user-select: none;
        }
        .rg-dropdown-trigger:hover {
          background: rgba(255,255,255,0.04);
        }
        .rg-dropdown:not(.disabled) .rg-dropdown-trigger:active {
          transform: scale(0.99);
        }
        .rg-dropdown-trigger .placeholder {
          color: var(--text-3);
        }
        .rg-dropdown-icon {
          color: var(--text-3);
          transition: transform 0.3s ease;
        }
        .rg-dropdown-icon.open {
          transform: rotate(180deg);
          color: var(--accent);
        }
        .rg-dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          width: 100%;
          max-height: 240px;
          overflow-y: auto;
          background: rgba(10,16,24,0.95);
          backdrop-filter: blur(24px);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 6px;
          z-index: 50;
          box-shadow: 0 12px 40px rgba(0,0,0,0.5);
        }
        /* Custom scrollbar for dropdown */
        .rg-dropdown-menu::-webkit-scrollbar {
          width: 6px;
        }
        .rg-dropdown-menu::-webkit-scrollbar-track {
          background: transparent;
        }
        .rg-dropdown-menu::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 100px;
        }
        .rg-dropdown-menu::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
        .rg-dropdown-item {
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 500;
          color: var(--text-2);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .rg-dropdown-item:hover {
          background: rgba(255,255,255,0.06);
          color: #fff;
        }
        .rg-dropdown-item.active {
          background: rgba(6,182,212,0.1);
          color: var(--accent-2);
          font-weight: 600;
        }
        .rg-dropdown-empty {
          padding: 12px;
          text-align: center;
          color: var(--text-3);
          font-size: 13px;
        }

        /* Password field */
        .rg-pw-wrap {
          display: flex;
          align-items: center;
          padding-right: 6px;
          gap: 4px;
        }
        .rg-pw-wrap input {
          flex: 1;
          min-width: 0;
          border: 0;
          outline: none;
          background: transparent;
          color: #fff;
          font: inherit;
          padding: 0;
        }
        .rg-pw-wrap input::placeholder { color: var(--text-3); }
        .rg-eye-btn {
          width: 34px; height: 34px;
          border: 0;
          border-radius: 8px;
          background: rgba(255,255,255,0.06);
          color: var(--text-3);
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .rg-eye-btn:hover {
          background: rgba(255,255,255,0.12);
          color: var(--text-2);
        }

        /* Password strength */
        .rg-pw-strength {
          margin-top: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .rg-pw-bars {
          display: flex;
          gap: 4px;
          flex: 1;
        }
        .rg-pw-bar {
          height: 4px;
          flex: 1;
          border-radius: 100px;
          background: rgba(255,255,255,0.08);
          transition: background 0.3s ease;
        }
        .rg-pw-label {
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
        }

        /* Alerts */
        .rg-alert {
          margin-top: 14px;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.5;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .rg-alert.error {
          border: 1px solid rgba(251,113,133,0.25);
          background: rgba(251,113,133,0.06);
          color: #fda4af;
        }
        .rg-alert.success {
          border: 1px solid rgba(52,211,153,0.25);
          background: rgba(52,211,153,0.06);
          color: #a7f3d0;
        }

        /* Action buttons */
        .rg-actions {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 22px;
        }
        .rg-btn {
          border: 0;
          border-radius: 12px;
          min-height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 20px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          font-family: inherit;
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          position: relative;
          overflow: hidden;
        }
        .rg-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .rg-btn:hover::before { opacity: 1; }
        .rg-btn:hover { transform: translateY(-2px); }
        .rg-btn:active { transform: translateY(0); }
        .rg-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
        .rg-btn:disabled::before { display: none; }

        .rg-btn.primary {
          background: linear-gradient(135deg, #06b6d4, #34d399);
          color: var(--bg);
          box-shadow: 0 0 0 1px rgba(6,182,212,0.3), 0 8px 32px rgba(6,182,212,0.2);
        }
        .rg-btn.primary:hover {
          box-shadow: 0 0 0 1px rgba(6,182,212,0.5), 0 16px 56px rgba(6,182,212,0.3);
        }
        .rg-btn.ghost {
          border: 1px solid var(--glass-border);
          background: var(--glass);
          color: #fff;
        }
        .rg-btn.ghost:hover {
          background: var(--surface-hover);
          border-color: var(--glass-strong);
        }

        /* Bottom link */
        .rg-switch {
          margin-top: 16px;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: var(--surface);
          min-height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 16px;
        }
        .rg-switch span {
          color: var(--text-3);
          font-size: 13px;
          font-weight: 600;
        }

        /* Spinner */
        .rg-spin { animation: rg-rotate 0.7s linear infinite; }
        @keyframes rg-rotate { to { transform: rotate(360deg); } }

        /* ─── Orbs ─── */
        .rg-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
          z-index: 0;
        }
        .rg-orb-1 {
          width: 700px; height: 700px;
          top: -200px; right: -150px;
          background: radial-gradient(circle, rgba(6,182,212,0.12), transparent 70%);
        }
        .rg-orb-2 {
          width: 500px; height: 500px;
          bottom: -150px; left: -100px;
          background: radial-gradient(circle, rgba(167,139,250,0.1), transparent 70%);
        }
        .rg-orb-3 {
          width: 400px; height: 400px;
          top: 40%; left: 35%;
          background: radial-gradient(circle, rgba(52,211,153,0.07), transparent 70%);
        }

        /* ─── RESPONSIVE ─── */
        @media (max-width: 1080px) {
          .rg-shell {
            grid-template-columns: 1fr;
            max-width: 620px;
          }
          .rg-hero { order: 1; }
          .rg-card-wrapper { order: 2; }
          .rg-signals { grid-template-columns: repeat(3, 1fr); }
          .rg-brand { margin-bottom: 36px; }
        }
        @media (max-width: 700px) {
          .rg-shell {
            width: min(100% - 28px, 100%);
            padding: 20px 0;
            gap: 32px;
          }
          .rg-title { font-size: clamp(30px, 10vw, 40px); }
          .rg-signals, .rg-visual-inner, .rg-form-grid {
            grid-template-columns: 1fr;
          }
          .rg-field.full { grid-column: auto; }
          .rg-card { padding: 20px 16px; border-radius: 20px; }
          .rg-card-header, .rg-actions, .rg-switch {
            flex-direction: column;
            align-items: stretch;
          }
          .rg-btn, .rg-login-link { width: 100%; justify-content: center; }
        }
      `}</style>

      {/* Background elements */}
      <div className="rg-grid" />
      <motion.div
        className="rg-orb rg-orb-1"
        animate={{ x: [0, 30, -15, 0], y: [0, -20, 15, 0], scale: [1, 1.08, 0.96, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="rg-orb rg-orb-2"
        animate={{ x: [0, -20, 15, 0], y: [0, 25, -12, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="rg-orb rg-orb-3"
        animate={{ x: [0, 18, -10, 0], y: [0, -15, 22, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <FloatingParticles />

      <div className="rg-shell">
        {/* ═══════════ LEFT HERO ═══════════ */}
        <section className="rg-hero">
          <motion.div
            className="rg-brand"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="rg-logo-row" onClick={() => navigate('/')}>
              <div className="rg-logo-icon">A</div>
              <div>
                <div className="rg-logo-name">AGMK LMS</div>
                <div className="rg-logo-sub">MOF-3 ACCESS</div>
              </div>
            </div>
            <button className="rg-login-link" type="button" onClick={() => navigate('/auth/login')}>
              Kirish <ArrowRight size={14} />
            </button>
          </motion.div>

          <Reveal>
            <div className="rg-eyebrow">
              <Sparkles size={14} />
              SaaS darajasidagi xavfsiz ro'yxatdan o'tish
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="rg-title">MOF-3 xodimlari uchun premium LMS akkaunt</h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="rg-lead">
              Avval xodim ma'lumotlari MOF-3 bazasi bilan solishtiriladi. Bo'lim tanlanganda faqat o'sha
              bo'lim sohalari, soha tanlanganda esa faqat o'sha sohaga tegishli xodimlar ko'rinadi.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="rg-signals">
              {[
                { icon: ShieldCheck, title: 'Bazadan tekshiruv', desc: "Tabel raqami tanlangan F.I.O. bilan mos bo'lishi shart." },
                { icon: Fingerprint, title: 'Shaxsiy kirish', desc: 'Username va parol faqat tasdiqdan keyin yaratiladi.' },
                { icon: BadgeCheck, title: 'Lavozimga mos LMS', desc: "Keyingi kurslar xodim sohasi bilan bog'lanadi." },
              ].map((sig) => (
                <motion.div
                  className="rg-signal"
                  key={sig.title}
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <div className="rg-signal-icon"><sig.icon size={20} /></div>
                  <div>
                    <strong>{sig.title}</strong>
                    <span>{sig.desc}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.4}>
            <div className="rg-visual" aria-label="Ro'yxatdan o'tish vizual paneli">
              <div className="rg-visual-inner">
                <div className="rg-mini-screen">
                  {[78, 92, 64, 86, 52].map((w, i) => (
                    <motion.div
                      key={i}
                      className={`rg-sline ${i % 2 === 0 ? 'active' : ''}`}
                      style={{ width: `${w}%` }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${w}%` }}
                      transition={{ delay: 0.2 + i * 0.08, duration: 0.6 }}
                      viewport={{ once: true }}
                    />
                  ))}
                </div>
                <div className="rg-bars">
                  {[52, 78, 64, 92, 70, 100, 83, 96].map((h, i) => (
                    <motion.span
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      transition={{ delay: 0.3 + i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      viewport={{ once: true }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ═══════════ RIGHT CARD ═══════════ */}
        <section className="rg-card-wrapper">
          <motion.form
            className="rg-card"
            onSubmit={submit}
            initial={{ opacity: 0, x: 50, rotateY: 6 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className="rg-card-header">
              <div className="rg-progress-info">
                <div className="rg-label">Jarayon</div>
                <div className="rg-pct">{percent}%</div>
              </div>
              <motion.div
                className="rg-status-pill"
                key={step}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <CheckCircle2 size={14} />
                {step === 0 ? 'Xodim tekshiruvi' : 'Akkaunt yaratish'}
              </motion.div>
            </div>

            {/* Progress bar */}
            <div className="rg-progress-bar">
              <motion.div
                className="rg-progress-fill"
                initial={{ width: '0%' }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>

            {/* Steps */}
            <div className="rg-steps">
              {['Xodimni tanlash', 'Login va parol'].map((label, i) => (
                <motion.div
                  key={label}
                  className={`rg-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <div className="rg-step-num">
                    {i < step ? <CheckCircle2 size={14} /> : i + 1}
                  </div>
                  {label}
                </motion.div>
              ))}
            </div>

            {/* Form content — animated swap */}
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="step-0"
                  className="rg-form-section"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h2>Xodim ma'lumotlarini tanlang</h2>
                  <p>
                    Ro'yxatlar bir-biriga bog'langan: avval bo'lim, keyin soha, keyin shu sohadagi xodim tanlanadi.
                  </p>
                  <div className="rg-form-grid">
                    <Field label="Podrazdeleniya" icon={<Building2 size={15} />}>
                      <Dropdown
                        value={form.subdivision}
                        onChange={selectSubdivision}
                        options={options.subdivisions.map((s) => ({ value: s, label: s }))}
                        placeholder="Podrazdeleniyani tanlang"
                      />
                    </Field>

                    <Field label="Bo'lim" icon={<UsersRound size={15} />}>
                      <Dropdown
                        value={form.departmentId || form.departmentName}
                        onChange={selectDepartment}
                        options={visibleDepartments.map((d) => ({ value: d.id || d.name, label: d.displayName || d.name }))}
                        placeholder={loadingOptions ? 'Yuklanmoqda...' : "Bo'limni tanlang"}
                        disabled={loadingOptions}
                      />
                    </Field>

                    <Field label="Doljnost / sohasi" icon={<BadgeCheck size={15} />}>
                      <Dropdown
                        value={form.position}
                        onChange={(val) => updateEmployee('position', val)}
                        options={positionOptions.map((p) => ({ value: p.name, label: p.name }))}
                        placeholder={form.departmentName ? 'Sohani tanlang' : "Avval bo'lim tanlang"}
                        disabled={!form.departmentName || loadingOptions}
                      />
                    </Field>

                    <Field label="Ism familiya otchestva" icon={<UserRound size={15} />}>
                      <Dropdown
                        value={form.fullName}
                        onChange={(val) => updateEmployee('fullName', val)}
                        options={employeeOptions.map((emp) => ({ value: emp, label: emp }))}
                        placeholder={form.position ? 'Xodimni tanlang' : 'Avval sohani tanlang'}
                        disabled={!form.position || loadingOptions}
                      />
                    </Field>

                    <Field label="Tabel raqami" icon={<IdCard size={15} />} full>
                      <input
                        className="rg-input"
                        value={form.employeeId}
                        onChange={(e) => updateEmployee('employeeId', e.target.value)}
                        placeholder="Masalan: 125"
                        inputMode="numeric"
                      />
                    </Field>
                  </div>

                  <AnimatePresence>
                    {verified && (
                      <motion.div
                        className="rg-alert success"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <CheckCircle2 size={16} />
                        Tabel raqami mos keldi. Endi username va parol yarating.
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="step-1"
                  className="rg-form-section"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h2>Akkaunt ma'lumotlarini yarating</h2>
                  <p>{form.fullName} uchun shaxsiy LMS akkaunt ochiladi.</p>

                  <div className="rg-form-grid">
                    <Field label="Username" icon={<UserRound size={15} />} full>
                      <input
                        className="rg-input"
                        value={form.username}
                        onChange={(e) => updateAccount('username', e.target.value)}
                        placeholder="masalan: ali_valiyev"
                        autoFocus
                      />
                    </Field>

                    <Field label="Password" icon={<LockKeyhole size={15} />}>
                      <div className="rg-input rg-pw-wrap">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={form.password}
                          onChange={(e) => updateAccount('password', e.target.value)}
                          placeholder="••••••••"
                        />
                        <button type="button" className="rg-eye-btn" onClick={() => setShowPassword((v) => !v)}>
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </Field>

                    <Field label="Passwordni takrorlang" icon={<LockKeyhole size={15} />}>
                      <div className="rg-input rg-pw-wrap">
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          value={form.confirmPassword}
                          onChange={(e) => updateAccount('confirmPassword', e.target.value)}
                          placeholder="••••••••"
                        />
                        <button type="button" className="rg-eye-btn" onClick={() => setShowConfirm((v) => !v)}>
                          {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </Field>
                  </div>

                  {/* Password strength indicator */}
                  {form.password && (
                    <motion.div
                      className="rg-pw-strength"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="rg-pw-bars">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className="rg-pw-bar"
                            style={{ background: pwStrength >= level ? pwColor : undefined }}
                          />
                        ))}
                      </div>
                      <span className="rg-pw-label" style={{ color: pwColor }}>{pwLabel}</span>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="rg-alert error"
                  initial={{ opacity: 0, y: 8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="rg-actions">
              <motion.button
                type="button"
                className="rg-btn ghost"
                onClick={() => { setStep(0); setError(''); }}
                disabled={step === 0 || loading}
                whileHover={{ scale: step === 0 ? 1 : 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <ChevronLeft size={16} />
                Orqaga
              </motion.button>
              <motion.button
                type="submit"
                className="rg-btn primary"
                disabled={loading || loadingOptions}
                whileHover={{ scale: loading ? 1 : 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {loading && <Loader2 size={15} className="rg-spin" />}
                {loading ? 'Tekshirilmoqda...' : step === 0 ? 'Tabelni tekshirish' : "Ro'yxatdan o'tish"}
                <ArrowRight size={16} />
              </motion.button>
            </div>

            {/* Bottom switch */}
            <div className="rg-switch">
              <span>Allaqachon akkauntingiz bormi?</span>
              <motion.button
                type="button"
                className="rg-btn ghost"
                onClick={() => navigate('/auth/login')}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{ minHeight: 40 }}
              >
                Tizimga kirish
                <ArrowRight size={15} />
              </motion.button>
            </div>
          </motion.form>
        </section>
      </div>
    </main>
  );
}

/* ─────────────── Field component ─────────────── */

function Field({
  label,
  icon,
  children,
  full = false,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={`rg-field ${full ? 'full' : ''}`}>
      <label>
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}
