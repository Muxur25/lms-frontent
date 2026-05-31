import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  BarChart3,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  Globe2,
  GraduationCap,
  LockKeyhole,
  Menu,
  MonitorSmartphone,
  Play,
  ShieldCheck,
  Sparkles,
  TabletSmartphone,
  Video,
  X,
} from 'lucide-react';

type Lang = 'uz' | 'ru';

const i18n = {
  uz: {
    nav: ['Platforma', 'AI', 'Analytics', 'Natijalar'],
    login: 'Tizimga kirish',
    demo: 'Ro‘yxatdan o‘tish',
    eyebrow: 'Enterprise AI LMS 2026',
    heroTitle: 'Korporativ ta’limni AI bilan boshqaradigan premium LMS',
    heroText:
      'Yirik sanoat korxonalari uchun o‘qitish, imtihon, sertifikat, vebinar va HR analytics jarayonlarini bitta xavfsiz ekotizimga birlashtiring.',
    watch: 'Interfeysni ko‘rish',
    live: 'Real-vaqt monitoring',
    aiPanelTitle: 'AI o‘quv yordamchisi',
    aiPanelText: 'Har bir xodim uchun individual reja, test va tavsiyalar.',
    trustTitle: 'Rahbarlar ko‘radigan aniq ko‘rsatkichlar',
    featuresTitle: 'Enterprise LMS uchun kerakli hamma narsa',
    aiTitle: 'AI kurs materiallarini ishga tayyor bilimga aylantiradi',
    dashboardTitle: 'Executive dashboard. Tez qaror. Toza signal.',
    responsiveTitle: 'Har bir qurilmada premium tajriba',
    benefitsTitle: 'Korporativ transformatsiya uchun real foyda',
    quote:
      'Platforma ta’lim jarayonini tarqoq Excel va qo‘lda nazoratdan yagona, ko‘rinadigan va o‘lchanadigan tizimga olib chiqdi.',
    ctaTitle: 'Korxonangiz LMS tizimini yeni darajaga olib chiqing',
    ctaText: 'Hozir ro‘yxatdan o‘ting va AGMK LMS platformasining imkoniyatlaridan to‘liq foydalaning.',
    footer: 'Uzbek va Russian interfeys, enterprise xavfsizlik va AI analytics.',
  },
  ru: {
    nav: ['Платформа', 'ИИ', 'Аналитика', 'Результаты'],
    login: 'Войти',
    demo: 'Регистрация',
    eyebrow: 'Enterprise AI LMS 2026',
    heroTitle: 'Премиальная LMS для управления корпоративным обучением с ИИ',
    heroText:
      'Объедините обучение, экзамены, сертификаты, вебинары и HR-аналитику крупного промышленного предприятия в одной защищенной экосистеме.',
    watch: 'Посмотреть интерфейс',
    live: 'Мониторинг в реальном времени',
    aiPanelTitle: 'ИИ-ассистент обучения',
    aiPanelText: 'Персональные планы, тесты и рекомендации для каждого сотрудника.',
    trustTitle: 'Метрики, которые важны руководителям',
    featuresTitle: 'Все, что нужно для enterprise LMS',
    aiTitle: 'ИИ превращает материалы курса в готовые знания',
    dashboardTitle: 'Executive dashboard. Быстрые решения. Чистый сигнал.',
    responsiveTitle: 'Премиальный опыт на любом устройстве',
    benefitsTitle: 'Реальная польза для корпоративной трансформации',
    quote:
      'Платформа перевела обучение из разрозненных Excel-файлов и ручного контроля в единую, прозрачную и измеримую систему.',
    ctaTitle: 'Выведите LMS предприятия на новый уровень',
    ctaText: 'Зарегистрируйтесь сейчас и используйте все возможности платформы AGMK LMS.',
    footer: 'Интерфейс на узбекском и русском, enterprise-безопасность и AI-аналитика.',
  },
};

const stats = [
  ['98%', 'Course completion'],
  ['42%', 'HR time saved'],
  ['24k+', 'Certificates issued'],
  ['1.8M', 'Learning hours'],
];

const features = [
  [Bot, 'AI Assistant', 'Personal learning paths, course Q&A and exam preparation.'],
  [BarChart3, 'Realtime Analytics', 'KPI, progress and certification health by department.'],
  [FileCheck2, 'Online Exams', 'Secure assessments, question banks and automatic scoring.'],
  [Video, 'Webinars', 'Live sessions, recordings and attendance intelligence.'],
  [Award, 'Certificates', 'QR-verifiable certificates with automated workflows.'],
  [ShieldCheck, 'Enterprise Security', 'Role access, protected data and governance controls.'],
];

const benefits = ['Scalability', 'AI automation', 'Productivity', 'HR optimization'];

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>('uz');
  const [menuOpen, setMenuOpen] = useState(false);
  const t = i18n[lang];

  return (
    <main className="premium-landing">
      <style>{`
        .premium-landing {
          --pl-bg: #050711;
          --pl-panel: rgba(255,255,255,.055);
          --pl-panel-2: rgba(255,255,255,.085);
          --pl-border: rgba(255,255,255,.12);
          --pl-text: #f8fbff;
          --pl-muted: #a8b3c7;
          --pl-soft: #6f7c95;
          --pl-cyan: #79f2ff;
          --pl-blue: #5b8cff;
          --pl-violet: #a985ff;
          --pl-green: #7df7bd;
          min-height: 100vh;
          color: var(--pl-text);
          background:
            radial-gradient(circle at 18% 18%, rgba(16,185,219,.20), transparent 30rem),
            radial-gradient(circle at 78% 10%, rgba(142,92,255,.22), transparent 32rem),
            radial-gradient(circle at 50% 88%, rgba(65,255,177,.10), transparent 34rem),
            linear-gradient(180deg, #060917 0%, #04060d 48%, #070a14 100%);
          overflow: hidden;
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .premium-landing * { box-sizing: border-box; }
        .pl-shell {
          width: min(1180px, calc(100% - 48px));
          margin: 0 auto;
        }
        .pl-bg-grid {
          position: fixed;
          inset: 0;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px);
          background-size: 72px 72px;
          mask-image: linear-gradient(to bottom, rgba(0,0,0,.9), transparent 78%);
        }
        .pl-nav {
          position: fixed;
          z-index: 50;
          top: 0;
          left: 0;
          right: 0;
          border-bottom: 1px solid rgba(255,255,255,.1);
          background: rgba(5,7,17,.78);
          backdrop-filter: blur(24px);
        }
        .pl-nav-inner {
          width: min(1280px, calc(100% - 48px));
          height: 72px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }
        .pl-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          color: inherit;
          text-decoration: none;
        }
        .pl-brand-mark {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: #fff;
          color: #060917;
          font-weight: 950;
          box-shadow: 0 0 38px rgba(121,242,255,.18);
        }
        .pl-brand-name { font-size: 15px; font-weight: 900; letter-spacing: -.02em; }
        .pl-brand-sub { font-size: 10px; font-weight: 800; letter-spacing: .34em; color: var(--pl-cyan); opacity: .82; }
        .pl-nav-links {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .pl-nav-link {
          border: 0;
          background: transparent;
          color: #c9d2e3;
          font-size: 13px;
          font-weight: 800;
          padding: 10px 13px;
          border-radius: 10px;
          cursor: pointer;
        }
        .pl-nav-link:hover { background: rgba(255,255,255,.07); color: white; }
        .pl-nav-actions { display: flex; align-items: center; gap: 10px; }
        .pl-lang {
          display: flex;
          padding: 3px;
          border-radius: 999px;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.11);
        }
        .pl-lang button {
          min-width: 38px;
          border: 0;
          border-radius: 999px;
          padding: 7px 10px;
          background: transparent;
          color: #9aa6ba;
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
        }
        .pl-lang button.active { background: white; color: #050711; }
        .pl-login {
          color: white;
          text-decoration: none;
          font-weight: 900;
          font-size: 13px;
          padding: 10px 12px;
          border-radius: 10px;
        }
        .pl-login:hover { background: rgba(255,255,255,.07); }
        .pl-btn {
          border: 0;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border-radius: 14px;
          padding: 0 18px;
          font-size: 13px;
          font-weight: 950;
          cursor: pointer;
          text-decoration: none;
          transition: transform .2s ease, box-shadow .2s ease, background .2s ease;
          white-space: nowrap;
        }
        .pl-btn:hover { transform: translateY(-1px); }
        .pl-btn-primary {
          background: linear-gradient(135deg, #ffffff, #bff7ff);
          color: #06101d;
          box-shadow: 0 18px 46px rgba(121,242,255,.20);
        }
        .pl-btn-dark {
          color: white;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.065);
          backdrop-filter: blur(14px);
        }
        .pl-menu-btn { display: none; }
        .pl-hero {
          position: relative;
          z-index: 2;
          padding-top: 72px;
        }
        .pl-hero-grid {
          min-height: 860px;
          display: grid;
          grid-template-columns: minmax(0, .92fr) minmax(520px, 1.08fr);
          gap: 72px;
          align-items: center;
          padding: 80px 0 96px;
        }
        .pl-copy { max-width: 610px; }
        .pl-eyebrow {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 11px;
          border-radius: 999px;
          border: 1px solid rgba(121,242,255,.25);
          background: rgba(121,242,255,.09);
          color: #c7fbff;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: .22em;
          text-transform: uppercase;
        }
        .pl-title {
          margin: 22px 0 0;
          font-size: clamp(3.3rem, 5vw, 5.55rem);
          line-height: .93;
          letter-spacing: -.065em;
          font-weight: 950;
          text-wrap: balance;
        }
        .pl-title span {
          background: linear-gradient(120deg, #fff 10%, #aaf7ff 45%, #cdb9ff 80%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .pl-lead {
          margin: 26px 0 0;
          max-width: 560px;
          color: #c4cee0;
          font-size: 19px;
          line-height: 1.72;
          font-weight: 500;
        }
        .pl-hero-actions {
          margin-top: 34px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .pl-proof {
          margin-top: 30px;
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
          color: #9aa7bd;
          font-size: 13px;
          font-weight: 750;
        }
        .pl-proof span {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .pl-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: var(--pl-green);
          box-shadow: 0 0 22px rgba(125,247,189,.75);
        }
        .pl-visual {
          position: relative;
          min-width: 0;
        }
        .pl-orbit {
          position: absolute;
          inset: -38px -24px;
          border: 1px solid rgba(121,242,255,.11);
          border-radius: 34px;
          transform: rotate(-2deg);
          background: linear-gradient(120deg, rgba(121,242,255,.055), rgba(169,133,255,.045));
          filter: blur(.2px);
        }
        .pl-dashboard {
          position: relative;
          overflow: hidden;
          border-radius: 28px;
          border: 1px solid rgba(255,255,255,.14);
          background:
            linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03)),
            rgba(8,14,28,.82);
          box-shadow: 0 40px 120px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.13);
          backdrop-filter: blur(24px);
        }
        .pl-dash-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          border-bottom: 1px solid rgba(255,255,255,.1);
        }
        .pl-window-dots { display: flex; gap: 7px; }
        .pl-window-dots i {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255,255,255,.22);
        }
        .pl-live {
          padding: 7px 10px;
          border-radius: 999px;
          color: #a8ffd6;
          background: rgba(125,247,189,.11);
          font-size: 11px;
          font-weight: 950;
          border: 1px solid rgba(125,247,189,.18);
        }
        .pl-dash-body { padding: 22px; }
        .pl-dash-heading {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: flex-start;
          margin-bottom: 20px;
        }
        .pl-dash-kicker {
          color: var(--pl-cyan);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: .24em;
          text-transform: uppercase;
        }
        .pl-dash-title {
          margin-top: 6px;
          font-size: 28px;
          font-weight: 950;
          letter-spacing: -.045em;
        }
        .pl-ai-chip {
          width: 210px;
          padding: 12px;
          border-radius: 16px;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.12);
          color: #c9d2e3;
          font-size: 12px;
          line-height: 1.5;
        }
        .pl-ai-chip b { display: flex; gap: 7px; align-items: center; color: #fff; margin-bottom: 3px; }
        .pl-metric-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .pl-metric {
          border-radius: 18px;
          padding: 16px;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.11);
        }
        .pl-metric strong {
          display: block;
          font-size: 28px;
          line-height: 1;
          letter-spacing: -.04em;
        }
        .pl-metric span {
          display: block;
          margin-top: 8px;
          color: #8f9bb1;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: .17em;
          text-transform: uppercase;
        }
        .pl-chart {
          margin-top: 16px;
          padding: 18px;
          border-radius: 20px;
          background: rgba(1,7,18,.46);
          border: 1px solid rgba(255,255,255,.1);
        }
        .pl-chart-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          font-weight: 950;
          margin-bottom: 18px;
        }
        .pl-bars {
          height: 150px;
          display: flex;
          align-items: end;
          gap: 10px;
        }
        .pl-bar {
          flex: 1;
          min-width: 16px;
          border-radius: 10px 10px 3px 3px;
          background: linear-gradient(180deg, #d778ff 0%, #5d8eff 52%, #00c2d7 100%);
          box-shadow: 0 0 24px rgba(93,142,255,.18);
        }
        .pl-widget-row {
          margin-top: 14px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .pl-widget {
          min-height: 118px;
          padding: 16px;
          border-radius: 18px;
          background: rgba(255,255,255,.055);
          border: 1px solid rgba(255,255,255,.11);
        }
        .pl-widget svg { color: var(--pl-cyan); margin-bottom: 12px; }
        .pl-widget b { display: block; font-size: 15px; }
        .pl-widget p { margin: 7px 0 0; color: #a8b3c7; font-size: 13px; line-height: 1.55; }
        .pl-float-card {
          position: absolute;
          left: -34px;
          bottom: -34px;
          width: 220px;
          padding: 18px;
          border-radius: 20px;
          border: 1px solid rgba(125,247,189,.22);
          background: rgba(19,65,53,.72);
          backdrop-filter: blur(18px);
          box-shadow: 0 24px 70px rgba(0,0,0,.38);
        }
        .pl-float-card strong { display: block; color: #b7ffdd; font-size: 34px; line-height: 1; }
        .pl-float-card span { color: #d6ffe9; opacity: .75; font-size: 11px; letter-spacing: .18em; font-weight: 950; text-transform: uppercase; }
        .pl-section {
          position: relative;
          z-index: 2;
          padding: 96px 0;
          border-top: 1px solid rgba(255,255,255,.08);
        }
        .pl-section-head {
          max-width: 760px;
          margin-bottom: 40px;
        }
        .pl-label {
          color: var(--pl-cyan);
          font-size: 12px;
          font-weight: 950;
          letter-spacing: .22em;
          text-transform: uppercase;
        }
        .pl-h2 {
          margin: 12px 0 0;
          font-size: clamp(2.2rem, 3.5vw, 4rem);
          line-height: 1;
          letter-spacing: -.05em;
          font-weight: 950;
          text-wrap: balance;
        }
        .pl-muted {
          color: var(--pl-muted);
          font-size: 17px;
          line-height: 1.75;
        }
        .pl-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        .pl-stat, .pl-feature, .pl-benefit, .pl-device, .pl-quote {
          border: 1px solid rgba(255,255,255,.11);
          background: rgba(255,255,255,.045);
          border-radius: 22px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.08);
        }
        .pl-stat {
          padding: 24px;
        }
        .pl-stat strong {
          display: block;
          font-size: 42px;
          letter-spacing: -.05em;
          line-height: 1;
        }
        .pl-stat span {
          display: block;
          margin-top: 12px;
          color: var(--pl-muted);
          font-size: 13px;
          font-weight: 800;
        }
        .pl-feature-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .pl-feature {
          padding: 24px;
          transition: transform .2s ease, border-color .2s ease, background .2s ease;
        }
        .pl-feature:hover {
          transform: translateY(-4px);
          border-color: rgba(121,242,255,.28);
          background: rgba(255,255,255,.065);
        }
        .pl-feature-icon {
          width: 46px;
          height: 46px;
          display: grid;
          place-items: center;
          border-radius: 15px;
          color: var(--pl-cyan);
          border: 1px solid rgba(121,242,255,.2);
          background: rgba(121,242,255,.09);
          margin-bottom: 24px;
        }
        .pl-feature h3 { margin: 0; font-size: 18px; letter-spacing: -.02em; }
        .pl-feature p { margin: 10px 0 0; color: var(--pl-muted); line-height: 1.65; font-size: 14px; }
        .pl-split {
          display: grid;
          grid-template-columns: .9fr 1.1fr;
          gap: 40px;
          align-items: center;
        }
        .pl-ai-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .pl-ai-item {
          min-height: 170px;
          padding: 24px;
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,.11);
          background: linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.035));
        }
        .pl-ai-item svg { color: var(--pl-violet); margin-bottom: 26px; }
        .pl-ai-item strong { display: block; font-size: 18px; }
        .pl-ai-item span { display: block; margin-top: 10px; color: var(--pl-muted); line-height: 1.6; font-size: 14px; }
        .pl-device-grid, .pl-benefit-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .pl-device, .pl-benefit {
          padding: 24px;
          min-height: 170px;
        }
        .pl-device svg, .pl-benefit svg { color: var(--pl-cyan); margin-bottom: 28px; }
        .pl-device strong, .pl-benefit strong { display: block; font-size: 18px; }
        .pl-device span, .pl-benefit span { display: block; margin-top: 10px; color: var(--pl-muted); line-height: 1.6; font-size: 14px; }
        .pl-quote {
          padding: 34px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 24px;
          align-items: end;
        }
        .pl-quote blockquote {
          margin: 0;
          color: #edf4ff;
          font-size: clamp(1.35rem, 2.2vw, 2.35rem);
          line-height: 1.32;
          letter-spacing: -.035em;
          font-weight: 850;
        }
        .pl-avatar {
          width: 64px;
          height: 64px;
          display: grid;
          place-items: center;
          border-radius: 18px;
          background: white;
          color: #050711;
          font-weight: 950;
        }
        .pl-cta {
          padding: 44px;
          border-radius: 32px;
          border: 1px solid rgba(121,242,255,.22);
          background:
            radial-gradient(circle at 20% 0%, rgba(121,242,255,.18), transparent 24rem),
            radial-gradient(circle at 85% 20%, rgba(169,133,255,.18), transparent 24rem),
            rgba(255,255,255,.055);
          box-shadow: 0 35px 120px rgba(0,0,0,.38), inset 0 1px 0 rgba(255,255,255,.11);
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 30px;
          align-items: center;
        }
        .pl-cta h2 {
          margin: 0;
          font-size: clamp(2rem, 3.2vw, 3.8rem);
          line-height: 1;
          letter-spacing: -.055em;
          font-weight: 950;
        }
        .pl-cta p {
          margin: 16px 0 0;
          color: var(--pl-muted);
          font-size: 17px;
          line-height: 1.7;
          max-width: 650px;
        }
        .pl-footer {
          position: relative;
          z-index: 2;
          border-top: 1px solid rgba(255,255,255,.09);
          padding: 34px 0;
          color: var(--pl-soft);
        }
        .pl-footer-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }
        @media (max-width: 1080px) {
          .pl-nav-links, .pl-nav-actions { display: none; }
          .pl-menu-btn {
            display: grid;
            place-items: center;
            width: 42px;
            height: 42px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,.12);
            background: rgba(255,255,255,.06);
            color: white;
          }
          .pl-mobile-menu {
            display: grid;
            gap: 8px;
            padding: 14px 24px 18px;
            border-top: 1px solid rgba(255,255,255,.1);
            background: rgba(5,7,17,.96);
          }
          .pl-hero-grid, .pl-split {
            grid-template-columns: 1fr;
          }
          .pl-hero-grid {
            min-height: auto;
            padding: 64px 0 86px;
          }
          .pl-copy { max-width: 840px; }
          .pl-visual { max-width: 760px; margin: 0 auto; }
          .pl-stat-grid, .pl-device-grid, .pl-benefit-grid { grid-template-columns: repeat(2, 1fr); }
          .pl-feature-grid { grid-template-columns: repeat(2, 1fr); }
          .pl-cta { grid-template-columns: 1fr; }
        }
        @media (max-width: 680px) {
          .pl-shell, .pl-nav-inner { width: min(100% - 24px, 100%); }
          .pl-title { font-size: clamp(2.65rem, 15vw, 4rem); }
          .pl-lead { font-size: 16px; }
          .pl-hero-grid { gap: 34px; padding-top: 42px; }
          .pl-dash-heading, .pl-quote, .pl-footer-inner { grid-template-columns: 1fr; flex-direction: column; align-items: flex-start; }
          .pl-ai-chip { width: 100%; }
          .pl-metric-grid, .pl-widget-row, .pl-stat-grid, .pl-feature-grid, .pl-ai-list, .pl-device-grid, .pl-benefit-grid { grid-template-columns: 1fr; }
          .pl-dashboard { border-radius: 22px; }
          .pl-dash-body { padding: 16px; }
          .pl-bars { height: 116px; gap: 7px; }
          .pl-float-card { position: relative; left: 0; bottom: 0; margin-top: 14px; width: 100%; }
          .pl-section { padding: 72px 0; }
          .pl-cta { padding: 28px; border-radius: 24px; }
        }
      `}</style>

      <div className="pl-bg-grid" />

      <header className="pl-nav">
        <div className="pl-nav-inner">
          <button className="pl-brand" onClick={() => scrollToSection('top')}>
            <span className="pl-brand-mark">A</span>
            <span>
              <span className="pl-brand-name">AGMK LMS</span>
              <span className="pl-brand-sub">ENTERPRISE AI</span>
            </span>
          </button>

          <nav className="pl-nav-links">
            {['platform', 'ai', 'analytics', 'results'].map((id, index) => (
              <button key={id} className="pl-nav-link" onClick={() => scrollToSection(id)}>
                {t.nav[index]}
              </button>
            ))}
          </nav>

          <div className="pl-nav-actions">
            <div className="pl-lang">
              {(['uz', 'ru'] as const).map((item) => (
                <button key={item} className={lang === item ? 'active' : ''} onClick={() => setLang(item)}>
                  {item.toUpperCase()}
                </button>
              ))}
            </div>
            <Link className="pl-login" to="/auth/login">
              {t.login}
            </Link>
            <Link className="pl-btn pl-btn-primary" to="/auth/register">
              {t.demo}
              <ArrowRight size={16} />
            </Link>
          </div>

          <button className="pl-menu-btn" onClick={() => setMenuOpen((value) => !value)} aria-label="Menu">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {menuOpen && (
          <div className="pl-mobile-menu">
            {['platform', 'ai', 'analytics', 'results'].map((id, index) => (
              <button
                key={id}
                className="pl-nav-link"
                onClick={() => {
                  setMenuOpen(false);
                  scrollToSection(id);
                }}
              >
                {t.nav[index]}
              </button>
            ))}
          </div>
        )}
      </header>

      <section id="top" className="pl-hero">
        <div className="pl-shell pl-hero-grid">
          <div className="pl-copy">
            <div className="pl-eyebrow">
              <Sparkles size={15} />
              {t.eyebrow}
            </div>
            <h1 className="pl-title">
              {t.heroTitle.split('AI')[0]}
              <span>AI</span>
              {t.heroTitle.split('AI').slice(1).join('AI')}
            </h1>
            <p className="pl-lead">{t.heroText}</p>
            <div className="pl-hero-actions">
              <Link className="pl-btn pl-btn-primary" to="/auth/register">
                {t.demo}
                <ChevronRight size={17} />
              </Link>
              <button className="pl-btn pl-btn-dark" onClick={() => scrollToSection('analytics')}>
                <Play size={16} />
                {t.watch}
              </button>
            </div>
            <div className="pl-proof">
              <span>
                <i className="pl-dot" />
                5 240 active learners
              </span>
              <span>
                <LockKeyhole size={16} color="var(--pl-cyan)" />
                Enterprise security layer
              </span>
            </div>
          </div>

          <div className="pl-visual">
            <div className="pl-orbit" />
            <div className="pl-dashboard">
              <div className="pl-dash-top">
                <div className="pl-window-dots">
                  <i />
                  <i />
                  <i />
                </div>
                <div className="pl-live">{t.live}</div>
              </div>
              <div className="pl-dash-body">
                <div className="pl-dash-heading">
                  <div>
                    <div className="pl-dash-kicker">Command Center</div>
                    <div className="pl-dash-title">Learning Intelligence</div>
                  </div>
                  <div className="pl-ai-chip">
                    <b>
                      <Bot size={15} /> {t.aiPanelTitle}
                    </b>
                    {t.aiPanelText}
                  </div>
                </div>

                <div className="pl-metric-grid">
                  {[
                    ['92%', 'progress'],
                    ['18k', 'learners'],
                    ['4.8', 'rating'],
                  ].map(([value, label]) => (
                    <div className="pl-metric" key={label}>
                      <strong>{value}</strong>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>

                <div className="pl-chart">
                  <div className="pl-chart-head">
                    <span>Department performance</span>
                    <BarChart3 size={18} color="var(--pl-cyan)" />
                  </div>
                  <div className="pl-bars">
                    {[45, 76, 58, 92, 66, 86, 78, 104, 82, 118, 96, 132].map((height, index) => (
                      <i className="pl-bar" key={index} style={{ height }} />
                    ))}
                  </div>
                </div>

                <div className="pl-widget-row">
                  <div className="pl-widget">
                    <GraduationCap size={22} />
                    <b>Certification flow</b>
                    <p>Auto exam, approval and QR certificate delivery.</p>
                  </div>
                  <div className="pl-widget">
                    <Video size={22} />
                    <b>Webinar intelligence</b>
                    <p>Attendance, replay and course impact in one view.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="pl-float-card">
              <strong>+31%</strong>
              <span>Engagement lift</span>
            </div>
          </div>
        </div>
      </section>

      <section id="results" className="pl-section">
        <div className="pl-shell">
          <div className="pl-section-head">
            <div className="pl-label">Enterprise trust</div>
            <h2 className="pl-h2">{t.trustTitle}</h2>
          </div>
          <div className="pl-stat-grid">
            {stats.map(([value, label]) => (
              <div className="pl-stat" key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="platform" className="pl-section">
        <div className="pl-shell">
          <div className="pl-section-head">
            <div className="pl-label">Platform</div>
            <h2 className="pl-h2">{t.featuresTitle}</h2>
            <p className="pl-muted">Designed for HR, training centers, administrators, employees and executive teams.</p>
          </div>
          <div className="pl-feature-grid">
            {features.map(([Icon, title, text]) => (
              <div className="pl-feature" key={title as string}>
                <div className="pl-feature-icon">
                  <Icon size={22} />
                </div>
                <h3>{title as string}</h3>
                <p>{text as string}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="ai" className="pl-section">
        <div className="pl-shell pl-split">
          <div>
            <div className="pl-label">AI showcase</div>
            <h2 className="pl-h2">{t.aiTitle}</h2>
            <p className="pl-muted">
              Generate quizzes, summarize regulations, recommend next modules and surface risk signals before employees fail exams.
            </p>
          </div>
          <div className="pl-ai-list">
            {[
              [BrainCircuit, 'AI-generated quizzes', 'Question banks from course materials in seconds.'],
              [Sparkles, 'AI summaries', 'Long regulations converted into executive briefs.'],
              [CheckCircle2, 'Recommendations', 'Next lessons matched to skill gaps.'],
              [Globe2, 'Multilingual intelligence', 'Uzbek Latin and Russian Cyrillic layouts.'],
            ].map(([Icon, title, text]) => (
              <div className="pl-ai-item" key={title as string}>
                <Icon size={26} />
                <strong>{title as string}</strong>
                <span>{text as string}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="analytics" className="pl-section">
        <div className="pl-shell">
          <div className="pl-section-head">
            <div className="pl-label">Dashboard</div>
            <h2 className="pl-h2">{t.dashboardTitle}</h2>
          </div>
          <div className="pl-device-grid">
            {[
              [MonitorSmartphone, 'Desktop cockpit', 'Deep analytics, course operations and department monitoring.'],
              [TabletSmartphone, 'Tablet workflows', 'Training center reviews, webinars and instructor controls.'],
              [Award, 'Certificate center', 'QR certificates, renewals and compliance status.'],
              [ShieldCheck, 'Admin governance', 'Role permissions, audit-friendly access and secure data.'],
            ].map(([Icon, title, text]) => (
              <div className="pl-device" key={title as string}>
                <Icon size={28} />
                <strong>{title as string}</strong>
                <span>{text as string}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pl-section">
        <div className="pl-shell">
          <div className="pl-section-head">
            <div className="pl-label">Benefits</div>
            <h2 className="pl-h2">{t.benefitsTitle}</h2>
          </div>
          <div className="pl-benefit-grid">
            {benefits.map((title, index) => (
              <div className="pl-benefit" key={title}>
                <Sparkles size={25} />
                <strong>{title}</strong>
                <span>{['10k+ employees without operational clutter.', 'Less manual work for HR and instructors.', 'Less searching, more measurable learning.', 'One view for onboarding and compliance.'][index]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pl-section">
        <div className="pl-shell">
          <div className="pl-quote">
            <blockquote>“{t.quote}”</blockquote>
            <div className="pl-avatar">HR</div>
          </div>
        </div>
      </section>

      <section className="pl-section">
        <div className="pl-shell">
          <div className="pl-cta" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.06))', border: '1px solid rgba(59,130,246,0.2)' }}>
            <div>
              <h2>{lang === 'uz' ? 'Sertifikatlarni tekshirish' : 'Проверка сертификатов'}</h2>
              <p>
                {lang === 'uz' 
                  ? 'Platformamiz tomonidan berilgan har bir rasmiy sertifikat o‘zining unikal identifikatoriga ega. Sertifikatning haqiqiyligini tekshirish uchun uning ID raqamini kiriting.' 
                  : 'Каждый официальный сертификат, выданный нашей платформой, имеет свой уникальный идентификатор. Введите ID сертификата, чтобы проверить его подлинность.'}
              </p>
            </div>
            <Link className="pl-btn pl-btn-dark" to="/verify-certificate" style={{ borderColor: 'rgba(59,130,246,0.3)', textDecoration: 'none' }}>
              <FileCheck2 size={16} />
              <span>{lang === 'uz' ? 'Sertifikatni tekshirish' : 'Проверить сертификат'}</span>
              <ChevronRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      <section id="contact" className="pl-section">
        <div className="pl-shell">
          <div className="pl-cta">
            <div>
              <h2>{t.ctaTitle}</h2>
              <p>{t.ctaText}</p>
            </div>
            <Link className="pl-btn pl-btn-primary" to="/auth/register">
              {t.demo}
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="pl-footer">
        <div className="pl-shell pl-footer-inner">
          <div className="pl-brand">
            <span className="pl-brand-mark">A</span>
            <span>
              <span className="pl-brand-name">AGMK LMS</span>
              <span className="pl-brand-sub">ENTERPRISE AI</span>
            </span>
          </div>
          <span>{t.footer}</span>
        </div>
      </footer>
    </main>
  );
}
