import { useEffect, useMemo, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  ArrowRight,
  Award,
  BarChart3,
  Bot,
  BrainCircuit,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileCheck2,
  Fingerprint,
  Gauge,
  Globe2,
  GraduationCap,
  Layers3,
  LibraryBig,
  LockKeyhole,
  Menu,
  MonitorSmartphone,
  Play,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  Video,
  X,
  Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';

/* ───────────────────────────── TYPES ───────────────────────────── */

type Lang = 'uz' | 'ru';

type Feature = {
  icon: LucideIcon;
  title: string;
  text: string;
};

type Metric = {
  value: string;
  label: string;
};

type Copy = {
  nav: string[];
  login: string;
  request: string;
  menu: string;
  close: string;
  language: string;
  eyebrow: string;
  heroTitle: string;
  heroText: string;
  primaryCta: string;
  secondaryCta: string;
  trust: string;
  heroStats: Metric[];
  proof: string[];
  suiteKicker: string;
  suiteTitle: string;
  suiteText: string;
  suite: Feature[];
  aiKicker: string;
  aiTitle: string;
  aiText: string;
  aiBullets: string[];
  aiTiles: Feature[];
  commandKicker: string;
  commandTitle: string;
  commandText: string;
  commandPanelTitle: string;
  commandPanelText: string;
  metrics: Metric[];
  riskTitle: string;
  riskItems: string[];
  securityKicker: string;
  securityTitle: string;
  securityText: string;
  securityItems: string[];
  deviceKicker: string;
  deviceTitle: string;
  deviceText: string;
  timelineKicker: string;
  timelineTitle: string;
  timelineText: string;
  timeline: string[];
  finalTitle: string;
  finalText: string;
  finalCta: string;
  footer: string;
};

/* ───────────────────────────── COPY ───────────────────────────── */

const landingCopy: Record<Lang, Copy> = {
  uz: {
    nav: ['Platforma', 'AI', 'Tahlil', 'Xavfsizlik'],
    login: 'Kirish',
    request: "Ro'yxatdan o'tish",
    menu: 'Menyuni ochish',
    close: 'Menyuni yopish',
    language: 'Til',
    eyebrow: 'Enterprise AI LMS',
    heroTitle: "Korporativ ta'limni boshqarish uchun premium SaaS operatsion markaz",
    heroText:
      "AGMK LMS kurslar, testlar, sertifikatlar, vebinarlar, kutubxona va HR tahlilini bitta tezkor, xavfsiz va AI bilan kuchaytirilgan platformaga jamlaydi.",
    primaryCta: 'Platformaga kirish',
    secondaryCta: "Interfeysni ko'rish",
    trust: 'Sanoat korxonalari uchun ishlab chiqilgan',
    heroStats: [
      { value: '98%', label: "o'quv rejalari yakunlanadi" },
      { value: '24k+', label: 'QR sertifikat nazoratda' },
      { value: '42%', label: 'HR va trainer vaqti tejaladi' },
    ],
    proof: ['Korporativ HR', 'Xavfsiz testlar', "AI o'quvchi yordamchisi", 'Real vaqt KPI', 'UZ / RU'],
    suiteKicker: 'Platforma yadrosi',
    suiteTitle: "Learning operations uchun to'liq boshqaruv paneli",
    suiteText:
      "Har bir rol uchun aniq dashboard, har bir xodim uchun shaxsiy yo'l xaritasi, har bir rahbar uchun ishonchli signal.",
    suite: [
      {
        icon: GraduationCap,
        title: "O'quv yo'llari",
        text: "Bo'lim, lavozim va kompetensiyaga mos individual kurs oqimlari.",
      },
      {
        icon: FileCheck2,
        title: 'Test va imtihonlar',
        text: 'Savollar banki, avtomatik baholash va xavfsiz imtihon muhiti.',
      },
      {
        icon: Award,
        title: 'Sertifikatlar',
        text: 'QR orqali tekshiriladigan sertifikatlar va amal qilish muddatlari nazorati.',
      },
      {
        icon: Video,
        title: 'Vebinarlar',
        text: 'Jonli sessiyalar, yozuvlar va qatnashuv monitoringi.',
      },
      {
        icon: LibraryBig,
        title: 'Raqamli kutubxona',
        text: "Hujjatlar, qo'llanmalar va bilim bazasi bitta tartibli katalogda.",
      },
      {
        icon: Bot,
        title: 'AI Copilot',
        text: 'Dars kontekstidan javob, tushuntirish va keyingi qadam tavsiyasi.',
      },
    ],
    aiKicker: 'AI qatlam',
    aiTitle: "Kontentni amaliy bilimga aylantiradigan shaxsiy AI yordamchi",
    aiText:
      "Yordamchi kurs materialini tushunadi, savollarga kontekst bilan javob beradi, testga tayyorlaydi va xodimning rivojlanish trayektoriyasini moslaydi.",
    aiBullets: ['Kontekstli javoblar', 'Shaxsiy takrorlash rejasi', 'Testga tezkor tayyorgarlik'],
    aiTiles: [
      {
        icon: BrainCircuit,
        title: 'Bilim xaritasi',
        text: "Zaif mavzularni topadi va o'quvchini kerakli darsga qaytaradi.",
      },
      {
        icon: Target,
        title: 'Risk signali',
        text: 'Imtihondan oldin past tayyorgarlik zonalarini ajratadi.',
      },
      {
        icon: Zap,
        title: 'Tezkor javob',
        text: 'Dars, fayl va video kontekstida aniq tushuntirish beradi.',
      },
    ],
    commandKicker: 'Executive intelligence',
    commandTitle: 'Rahbariyat uchun toza signal, HR uchun tezkor qaror',
    commandText:
      "Bo'limlar, lavozimlar, sertifikat muddati, test natijalari va xavf zonalari bir ekranda boshqariladi.",
    commandPanelTitle: 'Learning operations markazi',
    commandPanelText: "Tayyorgarlik, sertifikat salomatligi va imtihon riski bo'yicha jonli nazorat.",
    metrics: [
      { value: '7', label: "faol bo'lim" },
      { value: '312', label: "ochiq o'quv rejasi" },
      { value: '89%', label: 'imtihonga tayyorgarlik' },
      { value: '18', label: 'risk ogohlantirishi' },
    ],
    riskTitle: 'Bugungi signal',
    riskItems: ['3 sertifikat 14 kunda tugaydi', '12 xodimga takrorlash kerak', '5 testda nazorat kuchaytirilgan'],
    securityKicker: 'Xavfsizlik qatlami',
    securityTitle: "Enterprise xavfsizlik boshidan o'ylangan",
    securityText:
      "Rollar bo'yicha ruxsat, sessiya nazorati, qurilma limiti, imtihon monitoringi va audit izi korporativ talablar uchun tayyor.",
    securityItems: ["Rollar bo'yicha kirish", 'Qurilma sessiyalari', 'Imtihon nazorati', 'Audit jurnali'],
    deviceKicker: 'Har bir ekran',
    deviceTitle: 'Desktop, planshet va mobil uchun bir xil premium tajriba',
    deviceText:
      "Xodimlar darsni istalgan joyda davom ettiradi, rahbarlar esa real vaqt holatini uzluksiz ko'radi.",
    timelineKicker: 'Ish jarayoni',
    timelineTitle: "Excel va chatdan boshqariladigan ta'limdan tizimli operatsiyaga o'tish",
    timelineText:
      "Platforma rejalashtirish, o'qitish, baholash va sertifikatlashni bitta yopiq siklga aylantiradi.",
    timeline: [
      "Xodim roli va bo'limi asosida avtomatik yo'l xaritasi oladi.",
      "AI Copilot dars davomida savol-javob va tushuntirish beradi.",
      "Test natijasi, sertifikat va risklar real vaqt paneliga tushadi.",
      "Rahbarlar KPI, muddat va compliance holatini bitta joyda ko'radi.",
    ],
    finalTitle: "Ta'lim jarayonini boshqariladigan, o'lchanadigan va chiroyli tizimga aylantiring",
    finalText:
      "AGMK LMS korporativ bilimni tarqoq fayllardan chiqarib, xodim rivoji va biznes nazoratiga bog'laydi.",
    finalCta: 'Boshlash',
    footer: 'Enterprise learning operations uchun AI platforma',
  },
  ru: {
    nav: ['Платформа', 'AI', 'Аналитика', 'Безопасность'],
    login: 'Войти',
    request: 'Регистрация',
    menu: 'Открыть меню',
    close: 'Закрыть меню',
    language: 'Язык',
    eyebrow: 'Enterprise AI LMS',
    heroTitle: 'Премиальный SaaS-центр управления корпоративным обучением',
    heroText:
      'AGMK LMS объединяет курсы, тесты, сертификаты, вебинары, библиотеку и HR-аналитику в одну быструю, безопасную и усиленную AI платформу.',
    primaryCta: 'Войти в платформу',
    secondaryCta: 'Посмотреть интерфейс',
    trust: 'Создано для промышленных предприятий',
    heroStats: [
      { value: '98%', label: 'учебных планов закрываются' },
      { value: '24k+', label: 'QR-сертификатов под контролем' },
      { value: '42%', label: 'экономии времени HR и тренеров' },
    ],
    proof: ['Корпоративный HR', 'Защищенные тесты', 'AI помощник обучения', 'KPI в реальном времени', 'UZ / RU'],
    suiteKicker: 'Ядро платформы',
    suiteTitle: 'Полный центр управления learning operations',
    suiteText:
      'Понятный dashboard для каждой роли, персональная траектория для каждого сотрудника и надежный сигнал для каждого руководителя.',
    suite: [
      {
        icon: GraduationCap,
        title: 'Учебные траектории',
        text: 'Индивидуальные потоки курсов по подразделению, должности и компетенциям.',
      },
      {
        icon: FileCheck2,
        title: 'Тесты и экзамены',
        text: 'Банк вопросов, автоматическая оценка и защищенная экзаменационная среда.',
      },
      {
        icon: Award,
        title: 'Сертификаты',
        text: 'Проверяемые по QR сертификаты и контроль сроков действия.',
      },
      {
        icon: Video,
        title: 'Вебинары',
        text: 'Живые сессии, записи и мониторинг посещаемости.',
      },
      {
        icon: LibraryBig,
        title: 'Цифровая библиотека',
        text: 'Документы, инструкции и база знаний в одном структурированном каталоге.',
      },
      {
        icon: Bot,
        title: 'AI Copilot',
        text: 'Ответы по контексту урока, объяснения и рекомендации следующего действия.',
      },
    ],
    aiKicker: 'AI слой',
    aiTitle: 'Персональный AI помощник, превращающий контент в практические знания',
    aiText:
      'Помощник понимает материалы курса, отвечает с учетом контекста, готовит к тестам и адаптирует траекторию развития сотрудника.',
    aiBullets: ['Контекстные ответы', 'Персональный план повторения', 'Быстрая подготовка к тесту'],
    aiTiles: [
      {
        icon: BrainCircuit,
        title: 'Карта знаний',
        text: 'Находит слабые темы и возвращает сотрудника к нужному уроку.',
      },
      {
        icon: Target,
        title: 'Сигнал риска',
        text: 'Выделяет зоны низкой готовности до экзамена.',
      },
      {
        icon: Zap,
        title: 'Быстрый ответ',
        text: 'Дает точное объяснение по контексту урока, файла и видео.',
      },
    ],
    commandKicker: 'Executive intelligence',
    commandTitle: 'Чистый сигнал для руководства, быстрые решения для HR',
    commandText:
      'Подразделения, должности, сроки сертификатов, результаты тестов и зоны риска управляются на одном экране.',
    commandPanelTitle: 'Центр learning operations',
    commandPanelText: 'Живой контроль готовности, состояния сертификатов и экзаменационных рисков.',
    metrics: [
      { value: '7', label: 'активных подразделений' },
      { value: '312', label: 'открытых учебных планов' },
      { value: '89%', label: 'готовность к экзаменам' },
      { value: '18', label: 'рисковых сигналов' },
    ],
    riskTitle: 'Сигнал дня',
    riskItems: ['3 сертификата истекают за 14 дней', '12 сотрудникам нужно повторение', '5 тестов под усиленным контролем'],
    securityKicker: 'Слой безопасности',
    securityTitle: 'Enterprise безопасность продумана с первого дня',
    securityText:
      'Ролевые права, контроль сессий, лимиты устройств, мониторинг экзаменов и аудит готовы для корпоративных требований.',
    securityItems: ['Ролевой доступ', 'Сессии устройств', 'Контроль экзаменов', 'Журнал аудита'],
    deviceKicker: 'Каждый экран',
    deviceTitle: 'Одинаково премиальный опыт на desktop, планшете и мобильном',
    deviceText:
      'Сотрудники продолжают обучение где угодно, а руководители непрерывно видят статус в реальном времени.',
    timelineKicker: 'Рабочий процесс',
    timelineTitle: 'Переход от обучения в Excel и чатах к системной операции',
    timelineText:
      'Платформа превращает планирование, обучение, оценку и сертификацию в один замкнутый цикл.',
    timeline: [
      'Сотрудник получает автоматическую траекторию по роли и подразделению.',
      'AI Copilot помогает с вопросами и объяснениями во время урока.',
      'Результаты тестов, сертификаты и риски попадают на live-панель.',
      'Руководители видят KPI, сроки и compliance в одном месте.',
    ],
    finalTitle: 'Превратите обучение в управляемую, измеримую и красивую систему',
    finalText:
      'AGMK LMS выводит корпоративные знания из разрозненных файлов и связывает развитие сотрудников с бизнес-контролем.',
    finalCta: 'Начать',
    footer: 'AI платформа для enterprise learning operations',
  },
};

/* ───────────────────────────── HELPERS ───────────────────────────── */

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function normalizeLang(value?: string): Lang {
  return value?.startsWith('ru') ? 'ru' : 'uz';
}

/* ───────────────── ANIMATED COUNTER ─────────────────── */

function AnimatedCounter({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!inView) return;
    const numericMatch = value.match(/^(\d+)/);
    if (!numericMatch) {
      setDisplay(value);
      return;
    }
    const target = parseInt(numericMatch[1], 10);
    const suffix = value.slice(numericMatch[1].length);
    const duration = 1600;
    const steps = 40;
    const stepTime = duration / steps;
    let current = 0;
    const increment = target / steps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      setDisplay(Math.round(current) + suffix);
    }, stepTime);

    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <span ref={ref} className={className}>
      {inView ? display : '0'}
    </span>
  );
}

/* ───────────────── SECTION REVEAL WRAPPER ─────────────────── */

function Reveal({ children, className, delay = 0, ...props }: { children: React.ReactNode; className?: string; delay?: number; id?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 60 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ───────────────── FLOATING PARTICLES ─────────────────── */

function FloatingParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 12 + 8,
        delay: Math.random() * 5,
        opacity: Math.random() * 0.4 + 0.1,
      })),
    [],
  );

  return (
    <div className="landing-particles" aria-hidden="true">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="landing-particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -30, 0, 20, 0],
            x: [0, 15, -10, 5, 0],
            opacity: [p.opacity, p.opacity * 1.6, p.opacity, p.opacity * 0.6, p.opacity],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────── MAIN COMPONENT ─────────────────────── */

export default function LandingPage() {
  const { i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const lang = normalizeLang(i18n.language);
  const t = landingCopy[lang];
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroParallax = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const navTargets = useMemo(
    () => [
      ['platform', t.nav[0]],
      ['ai', t.nav[1]],
      ['analytics', t.nav[2]],
      ['security', t.nav[3]],
    ],
    [t.nav],
  );

  const setLang = (nextLang: Lang) => {
    i18n.changeLanguage(nextLang);
    setMenuOpen(false);
  };

  /* ─── chart bar heights ─── */
  const chartBars = [42, 68, 54, 78, 64, 92, 83, 96, 74, 88, 62, 95];
  const chartBars2 = [54, 72, 61, 84, 68, 92, 79, 96, 85, 70];

  return (
    <main className="lp">
      <style>{`
        /* ═══════════════════════════════════════════════════════════════
           AGMK LMS — PREMIUM LANDING PAGE
           ═══════════════════════════════════════════════════════════════ */

        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800;14..32,900&display=swap');

        .lp {
          --bg-0: #030508;
          --bg-1: #060a0f;
          --bg-2: #0a1018;
          --bg-3: #0e1620;
          --surface: rgba(255,255,255,0.04);
          --surface-hover: rgba(255,255,255,0.08);
          --glass: rgba(255,255,255,0.06);
          --glass-border: rgba(255,255,255,0.1);
          --glass-strong: rgba(255,255,255,0.12);
          --line: rgba(255,255,255,0.08);
          --line-strong: rgba(255,255,255,0.15);
          --text: #f0f4f9;
          --text-secondary: #94a3b8;
          --text-muted: #64748b;
          --accent-1: #06b6d4;
          --accent-2: #22d3ee;
          --accent-3: #34d399;
          --accent-4: #a78bfa;
          --accent-5: #f472b6;
          --glow-cyan: rgba(6,182,212,0.15);
          --glow-emerald: rgba(52,211,153,0.12);
          --glow-violet: rgba(167,139,250,0.12);
          --glow-amber: rgba(251,191,36,0.12);
          --amber: #fbbf24;
          --coral: #fb7185;
          min-height: 100vh;
          color: var(--text);
          background: var(--bg-0);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .lp * { box-sizing: border-box; }
        .lp a { text-decoration: none; color: inherit; }
        .lp-shell {
          width: min(1240px, calc(100% - 48px));
          margin: 0 auto;
        }

        /* ─── NAV ─── */
        .lp-nav {
          position: fixed;
          z-index: 100;
          inset: 0 0 auto;
          height: 72px;
          border-bottom: 1px solid var(--line);
          background: rgba(3,5,8,0.6);
          backdrop-filter: blur(24px) saturate(1.8);
          -webkit-backdrop-filter: blur(24px) saturate(1.8);
        }
        .lp-nav-inner {
          width: min(1320px, calc(100% - 48px));
          height: 100%;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .lp-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 172px;
        }
        .lp-brand-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          font-weight: 900;
          font-size: 16px;
          color: var(--bg-0);
          background: linear-gradient(135deg, #06b6d4, #34d399);
          box-shadow:
            0 0 0 1px rgba(6,182,212,0.3),
            0 8px 32px rgba(6,182,212,0.25),
            0 2px 8px rgba(6,182,212,0.15);
          transition: box-shadow 0.3s ease;
        }
        .lp-brand:hover .lp-brand-icon {
          box-shadow:
            0 0 0 1px rgba(6,182,212,0.5),
            0 12px 48px rgba(6,182,212,0.35),
            0 4px 12px rgba(6,182,212,0.2);
        }
        .lp-brand-name { font-size: 15px; font-weight: 800; letter-spacing: -0.01em; }
        .lp-brand-sub {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--accent-2);
          margin-top: 1px;
        }

        .lp-nav-links {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 4px;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: var(--surface);
        }
        .lp-nav-link {
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: var(--text-secondary);
          min-height: 36px;
          padding: 0 14px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .lp-nav-link:hover { color: #fff; background: var(--surface-hover); }

        .lp-nav-actions { display: flex; align-items: center; gap: 8px; }
        .lp-lang {
          display: flex;
          padding: 3px;
          border: 1px solid var(--line);
          border-radius: 10px;
          background: var(--surface);
        }
        .lp-lang button {
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: var(--text-muted);
          min-width: 36px;
          height: 28px;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .lp-lang button.active {
          background: #fff;
          color: var(--bg-0);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .lp-login {
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 700;
          padding: 8px 14px;
          border-radius: 10px;
          transition: all 0.2s ease;
        }
        .lp-login:hover { color: #fff; background: var(--surface-hover); }

        .lp-btn {
          border: 0;
          border-radius: 12px;
          min-height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 20px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          white-space: nowrap;
          font-family: inherit;
          position: relative;
          overflow: hidden;
        }
        .lp-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .lp-btn:hover::before { opacity: 1; }
        .lp-btn:hover { transform: translateY(-2px); }
        .lp-btn:active { transform: translateY(0); }

        .lp-btn-primary {
          background: linear-gradient(135deg, #06b6d4, #34d399);
          color: #030508;
          box-shadow:
            0 0 0 1px rgba(6,182,212,0.3),
            0 8px 32px rgba(6,182,212,0.2),
            0 2px 8px rgba(52,211,153,0.15);
        }
        .lp-btn-primary:hover {
          box-shadow:
            0 0 0 1px rgba(6,182,212,0.5),
            0 16px 56px rgba(6,182,212,0.3),
            0 4px 16px rgba(52,211,153,0.2);
        }
        .lp-btn-ghost {
          border: 1px solid var(--glass-border);
          background: var(--glass);
          color: #fff;
          backdrop-filter: blur(8px);
        }
        .lp-btn-ghost:hover {
          border-color: var(--glass-strong);
          background: var(--surface-hover);
        }
        .lp-btn-dark {
          background: #0e1620;
          color: #fff;
          border: 1px solid var(--line-strong);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }

        .lp-menu-btn { display: none; }

        /* ─── HERO ─── */
        .lp-hero {
          position: relative;
          min-height: 100vh;
          padding: 140px 0 80px;
          display: flex;
          align-items: center;
          overflow: hidden;
          isolation: isolate;
        }

        /* Animated gradient orbs */
        .lp-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
          will-change: transform;
        }
        .lp-orb-1 {
          width: 800px;
          height: 800px;
          top: -200px;
          right: -200px;
          background: radial-gradient(circle, rgba(6,182,212,0.18), transparent 70%);
        }
        .lp-orb-2 {
          width: 600px;
          height: 600px;
          bottom: -100px;
          left: -100px;
          background: radial-gradient(circle, rgba(167,139,250,0.14), transparent 70%);
        }
        .lp-orb-3 {
          width: 500px;
          height: 500px;
          top: 30%;
          left: 40%;
          background: radial-gradient(circle, rgba(52,211,153,0.1), transparent 70%);
        }

        /* Grid overlay */
        .lp-hero::after {
          content: '';
          position: absolute;
          inset: 0;
          z-index: -1;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 80px 80px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black 20%, transparent 70%);
        }

        /* Floating particles */
        .landing-particles {
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
        }
        .landing-particle {
          position: absolute;
          border-radius: 50%;
          background: var(--accent-2);
        }

        .lp-hero-layout {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 60px;
          align-items: center;
        }
        .lp-hero-copy { max-width: 720px; }

        .lp-eyebrow {
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

        .lp-hero-title {
          margin: 28px 0 20px;
          font-size: clamp(42px, 5.5vw, 72px);
          line-height: 0.95;
          letter-spacing: -0.03em;
          font-weight: 900;
          background: linear-gradient(135deg, #fff 0%, #e2e8f0 40%, #06b6d4 80%, #34d399 100%);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .lp-hero-text {
          max-width: 600px;
          margin: 0;
          color: var(--text-secondary);
          font-size: 17px;
          line-height: 1.75;
          font-weight: 450;
        }

        .lp-hero-actions {
          margin-top: 36px;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 14px;
        }

        .lp-trust {
          margin-top: 28px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 600;
        }
        .lp-trust-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent-3);
          box-shadow: 0 0 12px rgba(52,211,153,0.5);
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { box-shadow: 0 0 12px rgba(52,211,153,0.5); }
          50% { box-shadow: 0 0 24px rgba(52,211,153,0.8); }
        }

        .lp-hero-stats {
          margin-top: 48px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .lp-stat {
          min-height: 100px;
          border-radius: 16px;
          border: 1px solid var(--glass-border);
          background: var(--glass);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          padding: 20px;
          transition: all 0.3s ease;
        }
        .lp-stat:hover {
          border-color: rgba(6,182,212,0.3);
          background: rgba(6,182,212,0.06);
          transform: translateY(-2px);
        }
        .lp-stat-value {
          display: block;
          font-size: 32px;
          font-weight: 900;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #fff, var(--accent-2));
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .lp-stat-label {
          display: block;
          margin-top: 6px;
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 600;
          line-height: 1.4;
        }

        /* ─── Hero Preview Panel ─── */
        .lp-preview {
          position: relative;
          border: 1px solid var(--glass-border);
          border-radius: 20px;
          background:
            linear-gradient(135deg, rgba(6,182,212,0.08), transparent 50%),
            linear-gradient(315deg, rgba(251,191,36,0.06), transparent 50%),
            rgba(10,16,24,0.8);
          backdrop-filter: blur(20px);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.05),
            0 32px 80px rgba(0,0,0,0.5),
            0 8px 24px rgba(0,0,0,0.3);
          padding: 20px;
          overflow: hidden;
        }
        .lp-preview::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 20px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(6,182,212,0.3), transparent 40%, rgba(52,211,153,0.2));
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          -webkit-mask-composite: xor;
          pointer-events: none;
        }
        .lp-preview::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
          border-radius: 20px;
        }
        .lp-preview-top {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--line);
        }
        .lp-dots { display: flex; gap: 6px; }
        .lp-dots span {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .lp-dots span:nth-child(1) { background: #fb7185; box-shadow: 0 0 8px rgba(251,113,133,0.4); }
        .lp-dots span:nth-child(2) { background: #fbbf24; box-shadow: 0 0 8px rgba(251,191,36,0.4); }
        .lp-dots span:nth-child(3) { background: #34d399; box-shadow: 0 0 8px rgba(52,211,153,0.4); }
        .lp-preview-label {
          color: var(--text-muted);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .lp-preview-content {
          position: relative;
          z-index: 2;
          padding-top: 16px;
        }
        .lp-preview-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .lp-preview-tile {
          min-height: 110px;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: var(--surface);
          padding: 16px;
          transition: all 0.3s ease;
        }
        .lp-preview-tile:hover {
          background: var(--surface-hover);
          border-color: var(--glass-strong);
        }
        .lp-preview-tile.featured {
          grid-column: span 2;
          min-height: 130px;
          background:
            linear-gradient(135deg, rgba(6,182,212,0.1), var(--surface));
          border-color: rgba(6,182,212,0.2);
        }
        .lp-preview-tile strong {
          display: block;
          font-size: 26px;
          font-weight: 900;
          letter-spacing: -0.02em;
          margin-top: 10px;
        }
        .lp-preview-tile span {
          display: block;
          margin-top: 4px;
          color: var(--text-muted);
          font-size: 11px;
          font-weight: 600;
        }

        .lp-preview-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 10px;
          padding: 14px 16px;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: rgba(3,5,8,0.5);
        }
        .lp-preview-bar strong { font-size: 13px; font-weight: 800; }
        .lp-preview-bar span { color: var(--text-muted); font-size: 11px; margin-top: 2px; display: block; }

        .lp-mini-chart {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: flex-end;
          gap: 6px;
          margin-top: 10px;
          height: 90px;
          padding: 12px;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: var(--surface);
        }
        .lp-mini-chart span {
          flex: 1;
          min-width: 0;
          border-radius: 4px 4px 0 0;
          background: linear-gradient(180deg, var(--accent-3), rgba(52,211,153,0.15));
          transition: height 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .lp-floating-alert {
          position: absolute;
          z-index: 10;
          left: 16px;
          right: 16px;
          bottom: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid rgba(251,191,36,0.2);
          border-radius: 14px;
          background: rgba(251,191,36,0.06);
          backdrop-filter: blur(16px);
          padding: 14px 16px;
        }
        .lp-floating-alert strong { font-size: 13px; font-weight: 800; }
        .lp-floating-alert span { color: var(--text-secondary); font-size: 11px; margin-top: 2px; display: block; }

        /* Progress bar inside preview */
        .lp-progress {
          margin-top: 10px;
          height: 6px;
          border-radius: 100px;
          background: rgba(255,255,255,0.06);
          overflow: hidden;
        }
        .lp-progress-fill {
          display: block;
          height: 100%;
          border-radius: 100px;
          background: linear-gradient(90deg, var(--accent-1), var(--accent-3));
          box-shadow: 0 0 16px rgba(6,182,212,0.4);
        }

        /* ─── PROOF BAND ─── */
        .lp-band {
          border-top: 1px solid var(--line);
          border-bottom: 1px solid var(--line);
          background:
            linear-gradient(90deg, rgba(6,182,212,0.04), transparent 30%, rgba(52,211,153,0.04) 70%, transparent),
            var(--bg-1);
        }
        .lp-proof-row {
          min-height: 80px;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          align-items: center;
          gap: 12px;
        }
        .lp-proof-item {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 700;
        }
        .lp-proof-item svg { color: var(--accent-2); }

        /* ─── SECTIONS ─── */
        .lp-section {
          position: relative;
          padding: 120px 0;
          overflow: hidden;
        }
        .lp-section-dark { background: var(--bg-1); }
        .lp-section-alt {
          background: var(--bg-2);
        }

        .lp-section-head {
          max-width: 720px;
          margin-bottom: 48px;
        }
        .lp-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          color: var(--accent-2);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .lp-section h2 {
          margin: 0;
          font-size: clamp(32px, 3.5vw, 48px);
          line-height: 1.1;
          letter-spacing: -0.03em;
          font-weight: 900;
        }
        .lp-section p.lp-sub {
          margin: 16px 0 0;
          color: var(--text-secondary);
          font-size: 16px;
          line-height: 1.75;
          max-width: 640px;
        }

        /* ─── FEATURE GRID ─── */
        .lp-feature-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .lp-feature {
          position: relative;
          min-height: 260px;
          border: 1px solid var(--line);
          border-radius: 20px;
          background: var(--glass);
          padding: 28px 24px;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
          cursor: default;
        }
        .lp-feature::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 20px;
          background: radial-gradient(circle at 30% 0%, var(--glow-cyan), transparent 60%);
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        .lp-feature:hover::before { opacity: 1; }
        .lp-feature:hover {
          border-color: rgba(6,182,212,0.25);
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(6,182,212,0.08);
        }
        .lp-feature::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 24px;
          right: 24px;
          height: 2px;
          background: linear-gradient(90deg, var(--accent-1), var(--accent-3), var(--accent-4));
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        .lp-feature:hover::after { opacity: 1; }

        .lp-feature-icon {
          position: relative;
          z-index: 1;
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #06b6d4, #34d399);
          color: var(--bg-0);
          box-shadow: 0 8px 24px rgba(6,182,212,0.2);
          transition: all 0.3s ease;
        }
        .lp-feature:hover .lp-feature-icon {
          box-shadow: 0 12px 36px rgba(6,182,212,0.35);
          transform: scale(1.08);
        }
        .lp-feature h3 {
          position: relative;
          z-index: 1;
          margin: 20px 0 10px;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.01em;
        }
        .lp-feature p {
          position: relative;
          z-index: 1;
          margin: 0;
          color: var(--text-secondary);
          font-size: 14px;
          line-height: 1.7;
          font-weight: 450;
        }

        /* ─── AI SECTION ─── */
        .lp-showcase {
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          gap: 48px;
          align-items: center;
        }
        .lp-showcase.reverse { grid-template-columns: 1.1fr 0.9fr; }
        .lp-showcase-copy { max-width: 540px; }

        .lp-bullets {
          display: grid;
          gap: 10px;
          margin-top: 28px;
        }
        .lp-bullet {
          display: flex;
          align-items: center;
          gap: 12px;
          min-height: 48px;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: var(--glass);
          padding: 0 16px;
          color: var(--text);
          font-size: 13px;
          font-weight: 700;
          transition: all 0.3s ease;
        }
        .lp-bullet:hover {
          background: var(--surface-hover);
          border-color: rgba(52,211,153,0.3);
          transform: translateX(4px);
        }
        .lp-bullet svg { color: var(--accent-3); flex-shrink: 0; }

        .lp-ai-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        .lp-ai-tile {
          min-height: 260px;
          border: 1px solid var(--line);
          border-radius: 20px;
          padding: 24px 20px;
          overflow: hidden;
          position: relative;
          transition: all 0.4s ease;
        }
        .lp-ai-tile:hover {
          transform: translateY(-4px);
          border-color: rgba(6,182,212,0.25);
        }
        .lp-ai-tile:nth-child(1) {
          background:
            linear-gradient(180deg, rgba(6,182,212,0.08), transparent 60%),
            var(--glass);
        }
        .lp-ai-tile:nth-child(2) {
          background:
            linear-gradient(180deg, rgba(52,211,153,0.08), transparent 60%),
            var(--glass);
        }
        .lp-ai-tile:nth-child(3) {
          background:
            linear-gradient(180deg, rgba(167,139,250,0.08), transparent 60%),
            var(--glass);
        }
        .lp-ai-tile h3 {
          margin: 20px 0 8px;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.01em;
        }
        .lp-ai-tile p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 14px;
          line-height: 1.7;
        }

        /* ─── COMMAND / ANALYTICS ─── */
        .lp-panel {
          position: relative;
          border: 1px solid var(--glass-border);
          border-radius: 20px;
          background:
            linear-gradient(135deg, rgba(6,182,212,0.06), transparent 50%),
            linear-gradient(315deg, rgba(251,113,133,0.04), transparent 50%),
            rgba(10,16,24,0.9);
          padding: 20px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.3);
          overflow: hidden;
        }
        .lp-panel::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 20px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(6,182,212,0.2), transparent 50%, rgba(167,139,250,0.15));
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          -webkit-mask-composite: xor;
          pointer-events: none;
        }
        .lp-panel-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--line);
        }
        .lp-panel-label {
          color: var(--text-muted);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .lp-command-card {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 16px;
          margin-top: 16px;
          padding: 18px;
          border: 1px solid var(--line);
          border-radius: 16px;
          background: var(--surface);
          transition: all 0.3s ease;
        }
        .lp-command-card:hover {
          background: var(--surface-hover);
        }
        .lp-command-card strong { font-size: 17px; font-weight: 800; }
        .lp-command-card span {
          display: block;
          margin-top: 6px;
          color: var(--text-secondary);
          font-size: 13px;
          line-height: 1.5;
        }
        .lp-command-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: rgba(6,182,212,0.1);
          border: 1px solid rgba(6,182,212,0.2);
          color: var(--accent-2);
        }

        .lp-metric-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 12px;
        }
        .lp-metric {
          min-height: 100px;
          border-radius: 16px;
          border: 1px solid var(--line);
          background: var(--surface);
          padding: 18px;
          transition: all 0.3s ease;
        }
        .lp-metric:hover {
          background: var(--surface-hover);
          transform: translateY(-2px);
        }
        .lp-metric strong {
          display: block;
          font-size: 28px;
          font-weight: 900;
          letter-spacing: -0.02em;
        }
        .lp-metric span {
          display: block;
          margin-top: 6px;
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 600;
        }
        .lp-risk-box {
          margin-top: 12px;
          border: 1px solid rgba(251,191,36,0.15);
          border-radius: 16px;
          background: rgba(251,191,36,0.04);
          padding: 18px;
        }
        .lp-risk-box h3 {
          margin: 0 0 12px;
          font-size: 15px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .lp-risk-item {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 600;
          padding: 7px 0;
        }
        .lp-risk-item svg { color: var(--amber); flex-shrink: 0; }
        .lp-chart {
          min-height: 130px;
          margin-top: 12px;
          border: 1px solid var(--line);
          border-radius: 16px;
          background:
            linear-gradient(180deg, rgba(52,211,153,0.06), transparent),
            var(--surface);
          padding: 16px;
          display: flex;
          align-items: flex-end;
          gap: 8px;
        }
        .lp-chart span {
          flex: 1;
          min-width: 0;
          border-radius: 4px 4px 0 0;
          background: linear-gradient(180deg, var(--accent-3), rgba(52,211,153,0.12));
        }

        /* ─── SECURITY ─── */
        .lp-security-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-top: 32px;
        }
        .lp-security-item {
          min-height: 160px;
          border: 1px solid var(--line);
          border-radius: 20px;
          background: var(--glass);
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.4s ease;
          cursor: default;
        }
        .lp-security-item:hover {
          background: var(--surface-hover);
          border-color: rgba(251,191,36,0.2);
          transform: translateY(-4px);
          box-shadow: 0 16px 48px rgba(0,0,0,0.2);
        }
        .lp-security-item svg { color: var(--amber); }
        .lp-security-item span {
          color: var(--text);
          font-size: 14px;
          font-weight: 800;
          line-height: 1.4;
        }

        /* ─── DEVICE MOCKUP ─── */
        .lp-device {
          min-height: 480px;
          border: 1px solid var(--glass-border);
          border-radius: 20px;
          background:
            linear-gradient(135deg, rgba(6,182,212,0.08), transparent 50%),
            linear-gradient(315deg, rgba(251,191,36,0.04), transparent 50%),
            var(--bg-2);
          position: relative;
          overflow: hidden;
          padding: 28px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.25);
        }
        .lp-device::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 20px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(6,182,212,0.2), transparent 50%);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          -webkit-mask-composite: xor;
          pointer-events: none;
        }
        .lp-laptop {
          position: absolute;
          left: 8%;
          right: 8%;
          top: 60px;
          height: 280px;
          border: 1px solid var(--line-strong);
          border-radius: 12px;
          background: var(--bg-3);
          box-shadow: 0 32px 80px rgba(0,0,0,0.4);
          padding: 18px;
        }
        .lp-phone {
          position: absolute;
          right: 9%;
          bottom: 40px;
          width: 148px;
          height: 260px;
          border: 1px solid var(--line-strong);
          border-radius: 24px;
          background: var(--bg-2);
          box-shadow: 0 24px 64px rgba(0,0,0,0.45);
          padding: 14px;
        }
        .lp-screen-line, .lp-phone-line {
          height: 10px;
          border-radius: 100px;
          background: rgba(255,255,255,0.08);
          margin-bottom: 10px;
        }
        .lp-screen-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 12px;
          height: calc(100% - 28px);
        }
        .lp-screen-block {
          border-radius: 10px;
          background: rgba(255,255,255,0.05);
        }
        .lp-screen-block:first-child {
          background: linear-gradient(180deg, rgba(6,182,212,0.15), rgba(255,255,255,0.04));
        }
        .lp-phone-line:nth-child(2) { width: 72%; }
        .lp-phone-line:nth-child(3) { width: 52%; background: rgba(52,211,153,0.25); }

        /* ─── TIMELINE ─── */
        .lp-timeline-layout {
          display: grid;
          grid-template-columns: 0.85fr 1.15fr;
          gap: 40px;
          align-items: start;
        }
        .lp-timeline-list {
          display: grid;
          gap: 14px;
        }
        .lp-timeline-step {
          display: grid;
          grid-template-columns: 48px 1fr;
          gap: 16px;
          min-height: 96px;
          border: 1px solid var(--line);
          border-radius: 16px;
          background: var(--glass);
          padding: 18px;
          transition: all 0.3s ease;
        }
        .lp-timeline-step:hover {
          background: var(--surface-hover);
          border-color: var(--glass-strong);
          transform: translateX(4px);
        }
        .lp-timeline-num {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #06b6d4, #34d399);
          color: var(--bg-0);
          font-size: 14px;
          font-weight: 900;
          box-shadow: 0 6px 20px rgba(6,182,212,0.2);
        }
        .lp-timeline-step p {
          margin: 0;
          font-size: 14px;
          line-height: 1.7;
          font-weight: 500;
          align-self: center;
        }

        /* ─── CTA FINAL ─── */
        .lp-final {
          position: relative;
          padding: 120px 0;
          overflow: hidden;
        }
        .lp-final-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 50% at 30% 50%, rgba(6,182,212,0.1), transparent),
            radial-gradient(ellipse 60% 40% at 80% 60%, rgba(52,211,153,0.08), transparent),
            linear-gradient(180deg, var(--bg-1), #0c1a24);
        }
        .lp-final-inner {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 40px;
          align-items: center;
        }
        .lp-final h2 {
          margin: 0;
          max-width: 700px;
          font-size: clamp(32px, 3.5vw, 48px);
          line-height: 1.1;
          letter-spacing: -0.03em;
          font-weight: 900;
          background: linear-gradient(135deg, #fff, #e2e8f0 60%, var(--accent-2));
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .lp-final p {
          max-width: 600px;
          margin: 18px 0 0;
          color: var(--text-secondary);
          font-size: 16px;
          line-height: 1.75;
          -webkit-text-fill-color: var(--text-secondary);
        }

        /* ─── FOOTER ─── */
        .lp-footer {
          border-top: 1px solid var(--line);
          background: var(--bg-0);
        }
        .lp-footer-inner {
          min-height: 80px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          color: var(--text-muted);
          font-size: 13px;
          font-weight: 600;
        }

        /* ─── MOBILE MENU ─── */
        .lp-mobile-menu {
          position: fixed;
          z-index: 99;
          top: 80px;
          left: 16px;
          right: 16px;
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          background: rgba(3,5,8,0.95);
          backdrop-filter: blur(24px);
          padding: 16px;
          display: grid;
          gap: 8px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.5);
        }
        .lp-mobile-menu .lp-nav-link,
        .lp-mobile-menu .lp-login,
        .lp-mobile-menu .lp-btn {
          width: 100%;
          justify-content: center;
        }
        .lp-mobile-menu .lp-lang { justify-content: center; }

        /* ─── RESPONSIVE ─── */
        @media (max-width: 1100px) {
          .lp-nav-links, .lp-nav-actions { display: none; }
          .lp-menu-btn {
            display: inline-flex;
            width: 42px;
            height: 42px;
            border: 1px solid var(--line);
            border-radius: 12px;
            background: var(--glass);
            color: #fff;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }
          .lp-hero-layout,
          .lp-showcase,
          .lp-showcase.reverse,
          .lp-timeline-layout,
          .lp-final-inner {
            grid-template-columns: 1fr;
          }
          .lp-hero { padding-top: 120px; }
          .lp-preview { margin-top: 40px; }
          .lp-feature-grid,
          .lp-ai-grid,
          .lp-security-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .lp-proof-row { grid-template-columns: repeat(3, 1fr); }
        }

        @media (max-width: 700px) {
          .lp-shell, .lp-nav-inner {
            width: min(100% - 28px, 1240px);
          }
          .lp-nav { height: 64px; }
          .lp-brand { min-width: 0; }
          .lp-brand-sub { display: none; }
          .lp-hero {
            min-height: auto;
            padding: 110px 0 60px;
          }
          .lp-hero-actions .lp-btn { width: 100%; }
          .lp-hero-stats,
          .lp-feature-grid,
          .lp-ai-grid,
          .lp-metric-grid,
          .lp-security-grid,
          .lp-proof-row {
            grid-template-columns: 1fr;
          }
          .lp-preview-grid { grid-template-columns: 1fr; }
          .lp-preview-tile.featured { grid-column: auto; }
          .lp-section { padding: 80px 0; }
          .lp-device { min-height: 400px; }
          .lp-laptop {
            left: 16px;
            right: 16px;
            top: 40px;
            height: 220px;
          }
          .lp-phone {
            right: 24px;
            bottom: 24px;
            width: 120px;
            height: 210px;
          }
          .lp-footer-inner {
            flex-direction: column;
            align-items: flex-start;
            padding: 20px 0;
          }
        }
      `}</style>

      {/* ═══════════════ NAV ═══════════════ */}
      <motion.nav
        className="lp-nav"
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        aria-label="Primary navigation"
      >
        <div className="lp-nav-inner">
          <Link className="lp-brand" to="/">
            <div className="lp-brand-icon">A</div>
            <div>
              <div className="lp-brand-name">AGMK LMS</div>
              <div className="lp-brand-sub">AI LEARNING</div>
            </div>
          </Link>

          <div className="lp-nav-links">
            {navTargets.map(([id, label]) => (
              <button key={id} className="lp-nav-link" onClick={() => scrollToSection(id)}>
                {label}
              </button>
            ))}
          </div>

          <div className="lp-nav-actions">
            <div className="lp-lang" aria-label={t.language}>
              <button className={lang === 'uz' ? 'active' : ''} onClick={() => setLang('uz')}>
                UZ
              </button>
              <button className={lang === 'ru' ? 'active' : ''} onClick={() => setLang('ru')}>
                RU
              </button>
            </div>
            <Link className="lp-login" to="/auth/login">
              {t.login}
            </Link>
            <Link className="lp-btn lp-btn-primary" to="/auth/register">
              {t.request} <ArrowRight size={15} />
            </Link>
          </div>

          <button
            className="lp-menu-btn"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? t.close : t.menu}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="lp-mobile-menu"
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {navTargets.map(([id, label]) => (
              <button
                key={id}
                className="lp-nav-link"
                onClick={() => {
                  setMenuOpen(false);
                  scrollToSection(id);
                }}
              >
                {label}
              </button>
            ))}
            <div className="lp-lang" aria-label={t.language}>
              <button className={lang === 'uz' ? 'active' : ''} onClick={() => setLang('uz')}>
                UZ
              </button>
              <button className={lang === 'ru' ? 'active' : ''} onClick={() => setLang('ru')}>
                RU
              </button>
            </div>
            <Link className="lp-login" to="/auth/login">
              {t.login}
            </Link>
            <Link className="lp-btn lp-btn-primary" to="/auth/register">
              {t.request}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="lp-hero" ref={heroRef}>
        {/* Animated gradient orbs */}
        <motion.div
          className="lp-orb lp-orb-1"
          animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.1, 0.95, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="lp-orb lp-orb-2"
          animate={{ x: [0, -30, 20, 0], y: [0, 40, -20, 0], scale: [1, 0.9, 1.08, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="lp-orb lp-orb-3"
          animate={{ x: [0, 25, -15, 0], y: [0, -20, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />

        <FloatingParticles />

        <motion.div className="lp-shell lp-hero-layout" style={{ y: heroParallax, opacity: heroOpacity }}>
          <div className="lp-hero-copy">
            <motion.div
              className="lp-eyebrow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Sparkles size={14} /> {t.eyebrow}
            </motion.div>

            <motion.h1
              className="lp-hero-title"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {t.heroTitle}
            </motion.h1>

            <motion.p
              className="lp-hero-text"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 }}
            >
              {t.heroText}
            </motion.p>

            <motion.div
              className="lp-hero-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Link className="lp-btn lp-btn-primary" to="/auth/login">
                {t.primaryCta} <ArrowRight size={16} />
              </Link>
              <button className="lp-btn lp-btn-ghost" onClick={() => scrollToSection('platform')}>
                <Play size={15} /> {t.secondaryCta}
              </button>
            </motion.div>

            <motion.div
              className="lp-trust"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.75 }}
            >
              <span className="lp-trust-dot" /> {t.trust}
            </motion.div>

            <motion.div
              className="lp-hero-stats"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.85 }}
            >
              {t.heroStats.map((item) => (
                <div className="lp-stat" key={item.label}>
                  <AnimatedCounter value={item.value} className="lp-stat-value" />
                  <span className="lp-stat-label">{item.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Hero Preview Panel */}
          <motion.div
            className="lp-preview"
            initial={{ opacity: 0, x: 60, rotateY: 8 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="lp-preview-top">
              <div className="lp-dots">
                <span />
                <span />
                <span />
              </div>
              <div className="lp-preview-label">AGMK LMS</div>
            </div>
            <div className="lp-preview-content">
              <div className="lp-preview-grid">
                <motion.div
                  className="lp-preview-tile featured"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1, duration: 0.5 }}
                >
                  <Gauge size={22} color="var(--accent-2)" />
                  <strong>89%</strong>
                  <span>{t.metrics[2].label}</span>
                  <div className="lp-progress">
                    <motion.span
                      className="lp-progress-fill"
                      initial={{ width: '0%' }}
                      animate={{ width: '78%' }}
                      transition={{ delay: 1.3, duration: 1.2, ease: 'easeOut' }}
                    />
                  </div>
                </motion.div>
                {t.metrics.slice(0, 2).map((item, i) => (
                  <motion.div
                    className="lp-preview-tile"
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 + i * 0.15, duration: 0.5 }}
                  >
                    <Activity size={20} color="var(--accent-3)" />
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </motion.div>
                ))}
              </div>
              <motion.div
                className="lp-preview-bar"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4, duration: 0.5 }}
              >
                <div>
                  <strong>{t.commandPanelTitle}</strong>
                  <span>{t.commandPanelText}</span>
                </div>
                <Radar size={22} color="var(--accent-2)" />
              </motion.div>
              <motion.div
                className="lp-mini-chart"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                aria-hidden="true"
              >
                {chartBars.map((h, i) => (
                  <motion.span
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: 1.6 + i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  />
                ))}
              </motion.div>
            </div>
            <motion.div
              className="lp-floating-alert"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.2, duration: 0.6 }}
            >
              <ShieldCheck size={20} color="var(--amber)" />
              <div>
                <strong>{t.riskTitle}</strong>
                <span>{t.riskItems[0]}</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════ PROOF BAND ═══════════════ */}
      <Reveal className="lp-band">
        <div className="lp-shell lp-proof-row">
          {[Building2, ShieldCheck, BrainCircuit, BarChart3, Globe2].map((Icon, i) => (
            <motion.div
              className="lp-proof-item"
              key={t.proof[i]}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Icon size={16} /> {t.proof[i]}
            </motion.div>
          ))}
        </div>
      </Reveal>

      {/* ═══════════════ PLATFORM SUITE ═══════════════ */}
      <section className="lp-section lp-section-dark" id="platform">
        <div className="lp-shell">
          <Reveal>
            <div className="lp-section-head">
              <div className="lp-kicker">
                <Layers3 size={14} /> {t.suiteKicker}
              </div>
              <h2>{t.suiteTitle}</h2>
              <p className="lp-sub">{t.suiteText}</p>
            </div>
          </Reveal>
          <div className="lp-feature-grid">
            {t.suite.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 0.08}>
                <motion.article
                  className="lp-feature"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <div className="lp-feature-icon">
                    <Icon size={22} />
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </motion.article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ AI ═══════════════ */}
      <section className="lp-section lp-section-alt" id="ai">
        <div className="lp-shell lp-showcase">
          <Reveal>
            <div className="lp-showcase-copy">
              <div className="lp-kicker">
                <Bot size={14} /> {t.aiKicker}
              </div>
              <h2>{t.aiTitle}</h2>
              <p className="lp-sub">{t.aiText}</p>
              <div className="lp-bullets">
                {t.aiBullets.map((item, i) => (
                  <motion.div
                    className="lp-bullet"
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                    viewport={{ once: true }}
                  >
                    <CheckCircle2 size={16} /> {item}
                  </motion.div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="lp-ai-grid">
              {t.aiTiles.map(({ icon: Icon, title, text }, i) => (
                <motion.article
                  className="lp-ai-tile"
                  key={title}
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <div className="lp-feature-icon">
                    <Icon size={22} />
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  {i === 0 && (
                    <div className="lp-progress" style={{ marginTop: 20 }}>
                      <motion.span
                        className="lp-progress-fill"
                        initial={{ width: '0%' }}
                        whileInView={{ width: '76%' }}
                        transition={{ delay: 0.5, duration: 1 }}
                        viewport={{ once: true }}
                      />
                    </div>
                  )}
                </motion.article>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ ANALYTICS / COMMAND ═══════════════ */}
      <section className="lp-section lp-section-dark" id="analytics">
        <div className="lp-shell lp-showcase reverse">
          <Reveal>
            <div className="lp-panel">
              <div className="lp-panel-top">
                <div className="lp-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="lp-panel-label">{t.commandKicker}</div>
              </div>
              <div className="lp-command-card">
                <div>
                  <strong>{t.commandPanelTitle}</strong>
                  <span>{t.commandPanelText}</span>
                </div>
                <div className="lp-command-icon">
                  <Radar size={22} />
                </div>
              </div>
              <div className="lp-metric-grid">
                {t.metrics.map((item) => (
                  <div className="lp-metric" key={item.label}>
                    <strong>
                      <AnimatedCounter value={item.value} />
                    </strong>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
              <div className="lp-risk-box">
                <h3>{t.riskTitle}</h3>
                {t.riskItems.map((item) => (
                  <div className="lp-risk-item" key={item}>
                    <ChevronRight size={14} /> {item}
                  </div>
                ))}
              </div>
              <div className="lp-chart" aria-hidden="true">
                {chartBars2.map((h, i) => (
                  <motion.span
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    transition={{ delay: 0.2 + i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    viewport={{ once: true }}
                  />
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="lp-showcase-copy">
              <div className="lp-kicker">
                <BarChart3 size={14} /> {t.commandKicker}
              </div>
              <h2>{t.commandTitle}</h2>
              <p className="lp-sub">{t.commandText}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ SECURITY ═══════════════ */}
      <section className="lp-section lp-section-alt" id="security">
        <div className="lp-shell">
          <Reveal>
            <div className="lp-section-head">
              <div className="lp-kicker">
                <LockKeyhole size={14} /> {t.securityKicker}
              </div>
              <h2>{t.securityTitle}</h2>
              <p className="lp-sub">{t.securityText}</p>
            </div>
          </Reveal>
          <div className="lp-security-grid">
            {t.securityItems.map((item, i) => {
              const Icon = [Fingerprint, ShieldCheck, MonitorSmartphone, Clock3][i];
              return (
                <Reveal key={item} delay={i * 0.1}>
                  <motion.div
                    className="lp-security-item"
                    whileHover={{ scale: 1.04 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Icon size={28} />
                    <span>{item}</span>
                  </motion.div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════ DEVICE ═══════════════ */}
      <section className="lp-section lp-section-dark">
        <div className="lp-shell lp-showcase">
          <Reveal>
            <div className="lp-showcase-copy">
              <div className="lp-kicker">
                <MonitorSmartphone size={14} /> {t.deviceKicker}
              </div>
              <h2>{t.deviceTitle}</h2>
              <p className="lp-sub">{t.deviceText}</p>
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <motion.div
              className="lp-device"
              whileHover={{ scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              aria-label={t.deviceTitle}
            >
              <div className="lp-laptop">
                <div className="lp-screen-line" />
                <div className="lp-screen-grid">
                  <div className="lp-screen-block" />
                  <div className="lp-screen-block" />
                </div>
              </div>
              <motion.div
                className="lp-phone"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.7 }}
                viewport={{ once: true }}
              >
                <div className="lp-phone-line" />
                <div className="lp-phone-line" />
                <div className="lp-phone-line" />
                <div className="lp-phone-line" />
              </motion.div>
            </motion.div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ TIMELINE ═══════════════ */}
      <section className="lp-section lp-section-alt">
        <div className="lp-shell lp-timeline-layout">
          <Reveal>
            <div className="lp-showcase-copy">
              <div className="lp-kicker">
                <CalendarCheck2 size={14} /> {t.timelineKicker}
              </div>
              <h2>{t.timelineTitle}</h2>
              <p className="lp-sub">{t.timelineText}</p>
            </div>
          </Reveal>
          <div className="lp-timeline-list">
            {t.timeline.map((item, i) => (
              <Reveal key={item} delay={i * 0.12}>
                <motion.div
                  className="lp-timeline-step"
                  whileHover={{ x: 6, backgroundColor: 'rgba(255,255,255,0.08)' }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="lp-timeline-num">{String(i + 1).padStart(2, '0')}</div>
                  <p>{item}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="lp-final">
        <div className="lp-final-bg" />
        <Reveal className="lp-shell lp-final-inner">
          <div>
            <h2>{t.finalTitle}</h2>
            <p>{t.finalText}</p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <Link className="lp-btn lp-btn-primary" to="/auth/register" style={{ minHeight: 52, padding: '0 28px', fontSize: 15 }}>
              {t.finalCta} <ArrowRight size={18} />
            </Link>
          </motion.div>
        </Reveal>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="lp-footer">
        <div className="lp-shell lp-footer-inner">
          <span style={{ fontWeight: 800 }}>AGMK LMS</span>
          <span>{t.footer}</span>
        </div>
      </footer>
    </main>
  );
}
