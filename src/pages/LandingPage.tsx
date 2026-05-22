import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, 
  ChevronRight, 
  Layers, 
  LineChart, 
  Shield, 
  Smartphone, 
  Award, 
  Play, 
  CheckCircle, 
  Send, 
  MessageSquare, 
  Video, 
  Sparkles,
  Menu,
  X
} from 'lucide-react';

// Multilingual translations defined locally for the landing page to keep it self-contained
const translations = {
  uz: {
    nav: {
      features: "Imkoniyatlar",
      aiShowcase: "AI Texnologiyalari",
      dashboard: "Tizim Paneli",
      benefits: "Afzalliklar",
      login: "Tizimga kirish",
      requestDemo: "Demo so'rash"
    },
    hero: {
      badge: "Sun'iy intellekt asosidagi yangi avlod LMS platformasi",
      titlePre: "Korxonangiz uchun",
      titleHighlight: "AI-Powered",
      titlePost: "O'quv Tizimi",
      subtitle: "Ishlab chiqarish va yirik korxonalar uchun moslashtirilgan, sun'iy intellekt yordamida o'qitish jarayonini avtomatlashtiruvchi va chuqur tahliliy hisobotlar taqdim etuvchi premium LMS platformasi.",
      ctaPrimary: "Demoni sinab ko'rish",
      ctaSecondary: "Tizimga kirish",
      usersOnline: "5,000+ faol xodimlar ayni damda ta'lim olmoqda",
    },
    stats: {
      completionRate: "O'quv dasturlarini muvaffaqiyatli yakunlash darajasi",
      timeSaved: "HR departamentlari vaqtini tejash ko'rsatkichi",
      certifiedUsers: "Sertifikatlangan mutaxassislar soni",
      studyHours: "Jami o'quv soatlari ko'rsatkichi"
    },
    features: {
      title: "Intellektual Imkoniyatlar",
      subtitle: "Katta korporatsiyalar uchun zarur bo'lgan barcha zamonaviy asbob-uskunalar bir joyda",
      aiAssistant: "AI O'quv Yordamchisi",
      aiAssistantDesc: "Har bir xodim uchun individual o'quv rejalari va savollariga 24/7 rejimda javob beruvchi sun'iy intellekt.",
      analytics: "Real-vaqt Tahlili",
      analyticsDesc: "Bo'limlar va alohida xodimlar o'zlashtirish ko'rsatkichlarining dinamik grafik ko'rinishidagi tahlillari.",
      exams: "Onlayn Imtihonlar",
      examsDesc: "Nazorat va nohalikning oldini oluvchi aqlli imtihon tizimi va avtomatlashtirilgan baholash.",
      webinars: "Vebinarlar va Jonli Darslar",
      webinarsDesc: "O'quv xonalari bilan integratsiyalashgan video konferensiya va interaktiv prezentatsiya tizimi.",
      certificates: "Aqlli Sertifikatlar",
      certificatesDesc: "Kursni tugatganda avtomatik ravishda tasdiqlanadigan va yuklab olinadigan QR-kodli sertifikatlar.",
      security: "Korporativ Xavfsizlik",
      securityDesc: "Enterprise darajasidagi ma'lumotlar himoyasi, rollarni boshqarish va xavfsiz cloud infratuzilma."
    },
    aiShowcase: {
      title: "Sun'iy Intellekt Amalda",
      subtitle: "AI siz uchun testlar va qisqacha ma'lumotnomalar yaratib beradi. Vaqtingizni eng muhim ishlarga tejang.",
      inputLabel: "AI ga topshiriq bering:",
      placeholder: "Xavfsizlik texnikasi bo'yicha 5 ta savoldan iborat test yarating...",
      generateBtn: "Generatsiya qilish",
      generating: "AI o'ylamoqda...",
      responseHeader: "Yaratilgan test savollari:",
      testTitle: "Sanoat Xavfsizligi bo'yicha Ekspress Test",
      q1: "1. Balandlikda ishlayotganda qaysi himoya vositasi majburiy hisoblanadi?",
      q1_a: "A) Maxsus kiyim",
      q1_b: "B) Himoya kamari (straxovka)",
      q1_c: "C) Himoya ko'zoynagi",
      feedback: "Test muvaffaqiyatli yaratildi va tizim bazasiga qo'shildi!"
    },
    dashboardShowcase: {
      title: "Mukammal Interfeys Dizayni",
      subtitle: "Chiroyli, tezkor va funksional dashboard orqali butun tizimni nazorat qiling.",
      tabAdmin: "Admin paneli",
      tabStudent: "Xodim profili",
      tabAnalytics: "Tahlil markazi",
      totalStudents: "Jami xodimlar",
      activeCourses: "Faol kurslar",
      passingRate: "O'rtacha o'zlashtirish",
      recentCourses: "So'nggi kurslar",
      course1: "Sanoat texnologiyasi asoslari",
      course2: "Mehnatni muhofaza qilish normalari",
      course3: "Ishlab chiqarish gigiyenasi"
    },
    responsive: {
      title: "Istalgan Qurilmada Qulay",
      subtitle: "Kompyuter, planshet va mobil telefonlar uchun to'liq moslashtirilgan interfeys.",
      desktop: "Kompyuter versiyasi",
      tablet: "Planshetlar",
      mobile: "Mobil telefonda o'qish"
    },
    benefits: {
      title: "Nima uchun bizning platforma?",
      subtitle: "Eski uslubdagi LMS tizimlarini zamonaviy, tez va samarali platformaga almashtiring.",
      featuresList: [
        { title: "Maksimal tezlik", desc: "Vite + React texnologiyalari tufayli platforma soniyalarda yuklanadi." },
        { title: "Xarajatlarni kamaytirish", desc: "Oflayn o'qitish va murabbiylar uchun ketadigan xarajatlarni 60% gacha tejash." },
        { title: "Oson integratsiya", desc: "Active Directory, SAP va HR tizimlari bilan API orqali bog'lanish imkoniyati." },
        { title: "Barcha tillarda", desc: "O'zbek, Rus va Ingliz tillarida to'liq qo'llab-quvvatlash va mahalliylashtirish." }
      ]
    },
    testimonials: {
      title: "Rahbarlar va HR Mutaxassislar Fikri",
      subtitle: "O'zbekistonning yirik sanoat korxonalari bizga ishonishadi.",
      quote1: "AGMK LMS tizimi orqali biz 10,000 dan ortiq muhandis xodimlarimizning malakasini masofaviy va tezkor ravishda oshirishga muvaffaq bo'ldik. AI imtihon tizimi biz kutgandan ham a'lo darajada ishladi.",
      author1: "Azizbek Karimov",
      role1: "HR direktori, Metallurgiya kombinati",
      quote2: "Tahlillar va real vaqtdagi hisobotlar bizga har bir sex va bo'limning o'zlashtirish holatini chuqur ko'rish imkonini berdi. Platforma dizayni esa xodimlarimizga juda yoqdi.",
      author2: "Yelena Smirnova",
      role2: "Ta'lim departamenti boshlig'i"
    },
    cta: {
      title: "Kelajak ta'limini bugundan boshlang",
      subtitle: "Tizimni korxonangizga joriy etish yoki bepul demo versiyadan foydalanish uchun so'rov qoldiring.",
      inputPlaceholder: "Telefon raqamingiz yoki elektron pochtangiz",
      btn: "Demo versiyani yuborish",
      success: "Rahmat! Mutaxassislarimiz tez orada siz bilan bog'lanishadi."
    },
    footer: {
      rights: "Barcha huquqlar himoyalangan.",
      company: "AGMK LMS Enterprise Ecosystem"
    }
  },
  ru: {
    nav: {
      features: "Возможности",
      aiShowcase: "Технологии ИИ",
      dashboard: "Панель управления",
      benefits: "Преимущества",
      login: "Войти в систему",
      requestDemo: "Запросить демо"
    },
    hero: {
      badge: "Новое поколение LMS на базе искусственного интеллекта",
      titlePre: "Для вашего предприятия",
      titleHighlight: "AI-Powered",
      titlePost: "Система Обучения",
      subtitle: "Премиальная LMS-платформа, адаптированная под требования крупных промышленных предприятий. Автоматизация обучения с помощью ИИ и глубокая аналитика.",
      ctaPrimary: "Попробовать демо-версию",
      ctaSecondary: "Войти в систему",
      usersOnline: "Более 5,000+ сотрудников обучаются прямо сейчас",
    },
    stats: {
      completionRate: "Успешное завершение учебных программ",
      timeSaved: "Сэкономленное время HR-департаментов",
      certifiedUsers: "Сертифицированных специалистов",
      studyHours: "Всего часов корпоративного обучения"
    },
    features: {
      title: "Интеллектуальные Возможности",
      subtitle: "Все современные инструменты для корпоративного обучения в одной платформе",
      aiAssistant: "ИИ-Ассистент Обучения",
      aiAssistantDesc: "Индивидуальные траектории обучения для каждого сотрудника и поддержка ИИ в режиме 24/7.",
      analytics: "Аналитика в реальном времени",
      analyticsDesc: "Динамические графики и отчеты по успеваемости отделов и конкретных специалистов.",
      exams: "Онлайн Экзамены",
      examsDesc: "Умная система тестирования с защитой от списывания и автоматической оценкой результатов.",
      webinars: "Вебинары и Лекции",
      webinarsDesc: "Встроенные инструменты для видеоконференций, опросов и интерактивных презентаций.",
      certificates: "Умные Сертификаты",
      certificatesDesc: "Автоматическая генерация именных сертификатов с защищенным QR-кодом для проверки.",
      security: "Корпоративная Безопасность",
      securityDesc: "Защита данных уровня Enterprise, управление правами доступа и защищенная инфраструктура."
    },
    aiShowcase: {
      title: "Искусственный Интеллект в действии",
      subtitle: "ИИ мгновенно генерирует тесты и конспекты, экономя время ваших инструкторов.",
      inputLabel: "Задание для ИИ:",
      placeholder: "Создай тест из 5 вопросов по технике безопасности при работе на высоте...",
      generateBtn: "Сгенерировать",
      generating: "ИИ генерирует вопросы...",
      responseHeader: "Созданные тестовые вопросы:",
      testTitle: "Экспресс-тест по промышленной безопасности",
      q1: "1. Какое средство защиты является обязательным при работе на высоте?",
      q1_a: "А) Спецодежда",
      q1_b: "B) Предохранительный пояс (страховка)",
      q1_c: "C) Защитные очки",
      feedback: "Тест успешно создан и добавлен в базу данных системы!"
    },
    dashboardShowcase: {
      title: "Превосходный дизайн интерфейса",
      subtitle: "Управляйте всей системой обучения через красивый, быстрый и удобный дашборд.",
      tabAdmin: "Панель администратора",
      tabStudent: "Профиль сотрудника",
      tabAnalytics: "Центр аналитики",
      totalStudents: "Всего сотрудников",
      activeCourses: "Активные курсы",
      passingRate: "Средняя успеваемость",
      recentCourses: "Последние курсы",
      course1: "Основы промышленной технологии",
      course2: "Нормы охраны труда и техники безопасности",
      course3: "Производственная санитария и гигиена"
    },
    responsive: {
      title: "Удобно на любом устройстве",
      subtitle: "Полностью адаптированный интерфейс под компьютеры, планшеты и смартфоны.",
      desktop: "Версия для ПК",
      tablet: "Планшеты",
      mobile: "Обучение на смартфоне"
    },
    benefits: {
      title: "Почему выбирают нас?",
      subtitle: "Замените устаревшие системы обучения на современную, быструю и эффективную платформу.",
      featuresList: [
        { title: "Максимальная скорость", desc: "Платформа работает мгновенно благодаря технологиям React + Vite." },
        { title: "Снижение затрат", desc: "Экономия до 60% бюджета на очное обучение и выездных инструкторов." },
        { title: "Простая интеграция", desc: "Интеграция с Active Directory, SAP и HR-системами по защищенным API." },
        { title: "Мультиязычность", desc: "Полная локализация и поддержка интерфейса на узбекском, русском и английском." }
      ]
    },
    testimonials: {
      title: "Отзывы руководителей и HR-экспертов",
      subtitle: "Нам доверяют крупнейшие промышленные предприятия Узбекистана.",
      quote1: "Благодаря системе AGMK LMS мы смогли быстро и дистанционно повысить квалификацию более 10 000 наших инженеров. Экзаменационная система ИИ сработала превосходно.",
      author1: "Азизбек Каримов",
      role1: "Директор по персоналу, Металлургический комбинат",
      quote2: "Аналитика в реальном времени позволила нам увидеть реальную картину успеваемости по каждому цеху. Дизайн платформы очень понравился сотрудникам.",
      author2: "Елена Смирнова",
      role2: "Руководитель департамента обучения"
    },
    cta: {
      title: "Начните обучение будущего уже сегодня",
      subtitle: "Оставьте заявку на бесплатную демонстрацию системы для вашего предприятия.",
      inputPlaceholder: "Ваш номер телефона или e-mail",
      btn: "Получить демо-доступ",
      success: "Спасибо! Наши специалисты свяжутся с вами в ближайшее время."
    },
    footer: {
      rights: "Все права защищены.",
      company: "AGMK LMS Enterprise Ecosystem"
    }
  }
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  
  const currentLang = (i18n.language === 'ru' ? 'ru' : 'uz') as 'uz' | 'ru';
  const t = translations[currentLang];

  const handleLanguageChange = (lang: 'uz' | 'ru') => {
    i18n.changeLanguage(lang);
  };

  // States for interactive components
  const [activeTab, setActiveTab] = useState<'admin' | 'student' | 'analytics'>('admin');
  
  // AI Generator simulation state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0); // 0: empty, 1: generating, 2: completed

  // Contact form submission
  const [contactInput, setContactInput] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const startAiGeneration = () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setGenerationStep(1);
    
    setTimeout(() => {
      setIsGenerating(false);
      setGenerationStep(2);
    }, 2500);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactInput) return;
    setIsSubmitted(true);
    setContactInput('');
    setTimeout(() => setIsSubmitted(false), 5000);
  };

  return (
    <div className="min-h-screen bg-[#080b12] text-slate-100 font-sans overflow-x-hidden relative selection:bg-blue-600 selection:text-white">
      
      {/* ── CINEMATIC GLOWING BACKGROUNDS ── */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[150px] -z-10 pointer-events-none" />
      <div className="absolute top-[1200px] right-10 w-[700px] h-[700px] rounded-full bg-violet-600/5 blur-[180px] -z-10 pointer-events-none" />
      <div className="absolute top-[2800px] left-10 w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[140px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[800px] h-[800px] rounded-full bg-blue-600/5 blur-[200px] -z-10 pointer-events-none" />

      {/* Futuristic Background grid overlay */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none -z-20 opacity-70"
        style={{ maskImage: 'radial-gradient(ellipse at 50% 30%, black, transparent 80%)', WebkitMaskImage: 'radial-gradient(ellipse at 50% 30%, black, transparent 80%)' }}
      />

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-[#080b12]/80 backdrop-blur-md border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-violet-600 rounded-xl flex items-center justify-center font-extrabold text-white shadow-lg shadow-blue-500/20">
              A
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                AGMK LMS
                <span className="text-[10px] font-semibold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">ENTERPRISE</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono tracking-wider">AI ECOSYSTEM 2026</div>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">{t.nav.features}</a>
            <a href="#ai-showcase" className="hover:text-white transition-colors">{t.nav.aiShowcase}</a>
            <a href="#dashboard-showcase" className="hover:text-white transition-colors">{t.nav.dashboard}</a>
            <a href="#benefits" className="hover:text-white transition-colors">{t.nav.benefits}</a>
          </nav>

          {/* Actions & Language Swapper */}
          <div className="hidden lg:flex items-center gap-4">
            
            {/* Lang switcher */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
              <button 
                onClick={() => handleLanguageChange('uz')} 
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${currentLang === 'uz' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                UZB
              </button>
              <button 
                onClick={() => handleLanguageChange('ru')} 
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${currentLang === 'ru' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                РУС
              </button>
            </div>

            <button 
              onClick={() => navigate('/auth/login')}
              className="text-sm font-semibold hover:text-white transition-colors text-slate-300 px-4 py-2"
            >
              {t.nav.login}
            </button>
            
            <a 
              href="#contact"
              className="bg-white text-slate-950 hover:bg-slate-200 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-white/5 hover:translate-y-[-1px]"
            >
              {t.nav.requestDemo}
            </a>
          </div>

          {/* Mobile Menu Icon */}
          <div className="flex items-center gap-3 lg:hidden">
            
            {/* Quick Lang Switcher for mobile */}
            <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5 mr-2">
              <button onClick={() => handleLanguageChange('uz')} className={`px-2 py-0.5 rounded text-[10px] font-bold ${currentLang === 'uz' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>UZ</button>
              <button onClick={() => handleLanguageChange('ru')} className={`px-2 py-0.5 rounded text-[10px] font-bold ${currentLang === 'ru' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>RU</button>
            </div>

            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden absolute top-20 left-0 right-0 bg-[#0b0e17] border-b border-white/10 z-40 overflow-hidden"
          >
            <div className="px-6 py-8 flex flex-col gap-6 font-medium text-slate-300">
              <a href="#features" onClick={() => setMenuOpen(false)} className="hover:text-white transition-colors py-2 border-b border-white/5">{t.nav.features}</a>
              <a href="#ai-showcase" onClick={() => setMenuOpen(false)} className="hover:text-white transition-colors py-2 border-b border-white/5">{t.nav.aiShowcase}</a>
              <a href="#dashboard-showcase" onClick={() => setMenuOpen(false)} className="hover:text-white transition-colors py-2 border-b border-white/5">{t.nav.dashboard}</a>
              <a href="#benefits" onClick={() => setMenuOpen(false)} className="hover:text-white transition-colors py-2 border-b border-white/5">{t.nav.benefits}</a>
              
              <div className="flex flex-col gap-3 mt-4">
                <button 
                  onClick={() => { navigate('/auth/login'); setMenuOpen(false); }}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-white py-3 rounded-xl font-bold transition-all text-center"
                >
                  {t.nav.login}
                </button>
                <a 
                  href="#contact"
                  onClick={() => setMenuOpen(false)}
                  className="bg-blue-600 text-white hover:bg-blue-500 py-3 rounded-xl font-bold transition-all text-center"
                >
                  {t.nav.requestDemo}
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 1. HERO SECTION ── */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          
          {/* Animated Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/25 px-4 py-1.5 rounded-full text-xs font-semibold text-blue-400 mb-8"
          >
            <Sparkles size={14} className="animate-pulse" />
            <span>{t.hero.badge}</span>
          </motion.div>

          {/* Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]"
          >
            {t.hero.titlePre} <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-violet-500 bg-clip-text text-transparent">
              {t.hero.titleHighlight}
            </span> {t.hero.titlePost}
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="max-w-3xl mx-auto text-slate-400 text-lg sm:text-xl mb-10 leading-relaxed font-light"
          >
            {t.hero.subtitle}
          </motion.p>

          {/* Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <a 
              href="#contact"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl text-base font-bold transition-all hover:translate-y-[-2px] shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              {t.hero.ctaPrimary}
              <ChevronRight size={18} />
            </a>
            
            <button 
              onClick={() => navigate('/auth/login')}
              className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-4 rounded-xl text-base font-bold transition-all hover:translate-y-[-2px]"
            >
              {t.hero.ctaSecondary}
            </button>
          </motion.div>

          {/* Platform Mockup Preview (3D & Glassmorphic) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative max-w-5xl mx-auto mt-10"
          >
            {/* Ambient Backglow */}
            <div className="absolute inset-x-10 -top-12 h-64 bg-gradient-to-r from-blue-600/20 via-violet-600/20 to-cyan-600/20 rounded-full blur-[100px] pointer-events-none -z-10" />

            {/* Glass Container */}
            <div className="relative bg-[#0d1322]/80 border border-white/10 rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.6)] p-3 md:p-4 overflow-hidden backdrop-blur-xl">
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent pointer-events-none" />
              
              {/* Window controls */}
              <div className="flex items-center gap-1.5 pb-3 border-b border-white/5 mb-3 px-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <div className="text-[11px] font-mono text-slate-500 ml-4">AGMK-LMS-ENTERPRISE-v3.0.0</div>
              </div>

              {/* Inside Layout Mockup */}
              <div className="grid grid-cols-12 gap-3 text-left">
                
                {/* Mockup Sidebar */}
                <div className="hidden md:block col-span-3 bg-white/[0.02] border border-white/5 rounded-xl p-3 h-[420px] flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="h-6 w-24 bg-white/10 rounded-md animate-pulse" />
                    <div className="space-y-2 mt-6">
                      <div className="h-8 bg-blue-500/20 border border-blue-500/20 rounded-lg flex items-center px-2.5 gap-2">
                        <div className="w-3 h-3 rounded bg-blue-400" />
                        <div className="h-3 w-16 bg-blue-300/30 rounded" />
                      </div>
                      <div className="h-8 hover:bg-white/5 rounded-lg flex items-center px-2.5 gap-2 transition-colors">
                        <div className="w-3 h-3 rounded bg-slate-600" />
                        <div className="h-3 w-20 bg-slate-500/30 rounded" />
                      </div>
                      <div className="h-8 hover:bg-white/5 rounded-lg flex items-center px-2.5 gap-2 transition-colors">
                        <div className="w-3 h-3 rounded bg-slate-600" />
                        <div className="h-3 w-14 bg-slate-500/30 rounded" />
                      </div>
                      <div className="h-8 hover:bg-white/5 rounded-lg flex items-center px-2.5 gap-2 transition-colors">
                        <div className="w-3 h-3 rounded bg-slate-600" />
                        <div className="h-3 w-16 bg-slate-500/30 rounded" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-lg p-2.5 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-violet-500 flex items-center justify-center text-[10px] font-bold text-white">UK</div>
                    <div className="space-y-1">
                      <div className="h-2 w-16 bg-white/20 rounded" />
                      <div className="h-1.5 w-10 bg-slate-500/50 rounded" />
                    </div>
                  </div>
                </div>

                {/* Mockup Content area */}
                <div className="col-span-12 md:col-span-9 space-y-4">
                  
                  {/* Top Bar Mock */}
                  <div className="flex items-center justify-between bg-white/[0.01] border border-white/5 rounded-xl p-3">
                    <div className="h-4 w-28 bg-white/10 rounded animate-pulse" />
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-20 bg-blue-500/15 border border-blue-500/20 text-[10px] text-blue-400 flex items-center justify-center font-bold rounded-lg">
                        AI Active
                      </div>
                      <div className="h-6 w-6 rounded-lg bg-white/5" />
                    </div>
                  </div>

                  {/* Grid widgets */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 space-y-2">
                      <div className="text-[10px] text-slate-400 font-medium">Jami xodimlar</div>
                      <div className="text-xl font-bold text-white">12,450</div>
                      <div className="text-[9px] text-green-400 flex items-center gap-1">
                        <span>↑ 12%</span> <span className="text-slate-500">o'tgan oyga nisbatan</span>
                      </div>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 space-y-2">
                      <div className="text-[10px] text-slate-400 font-medium">Faoliyat darajasi</div>
                      <div className="text-xl font-bold text-white">94.8%</div>
                      <div className="text-[9px] text-green-400 flex items-center gap-1">
                        <span>↑ 4.2%</span> <span className="text-slate-500">o'tgan haftaga nisbatan</span>
                      </div>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 space-y-2">
                      <div className="text-[10px] text-slate-400 font-medium">AI tahlili</div>
                      <div className="text-xl font-bold text-blue-400">Optimal</div>
                      <div className="text-[9px] text-blue-300 flex items-center gap-1">
                        <Sparkles size={8} /> <span>15 dars yangilandi</span>
                      </div>
                    </div>
                  </div>

                  {/* Big Chart Mock */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 h-[200px] relative overflow-hidden flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                      <div className="h-3 w-32 bg-white/10 rounded" />
                      <div className="flex gap-2">
                        <div className="h-2 w-8 bg-blue-500 rounded" />
                        <div className="h-2 w-8 bg-violet-500 rounded" />
                      </div>
                    </div>
                    
                    {/* Simulated vector chart */}
                    <div className="w-full h-24 flex items-end gap-1.5 mt-2">
                      {[30, 45, 35, 60, 50, 75, 90, 85, 100, 95, 110, 120].map((h, i) => (
                        <div key={i} className="flex-1 bg-gradient-to-t from-blue-600/50 to-blue-400 rounded-t" style={{ height: `${h * 0.7}%` }} />
                      ))}
                    </div>
                    
                    <div className="flex justify-between text-[9px] text-slate-500 pt-2 border-t border-white/5">
                      <span>Yan</span><span>Fev</span><span>Mar</span><span>Apr</span><span>May</span><span>Iyun</span><span>Iyul</span><span>Avg</span>
                    </div>
                  </div>

                </div>

              </div>

            </div>

            {/* Decorative floaters */}
            <div className="absolute -top-6 -right-6 bg-white/[0.02] border border-white/10 backdrop-blur p-4 rounded-2xl shadow-xl hidden md:flex items-center gap-3 animate-bounce" style={{ animationDuration: '6s' }}>
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400">
                <Award size={20} />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white">QR Sertifikatlash</div>
                <div className="text-[10px] text-slate-400">Avtomatik rasmiylashtirildi</div>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-6 bg-white/[0.02] border border-white/10 backdrop-blur p-4 rounded-2xl shadow-xl hidden md:flex items-center gap-3 animate-bounce" style={{ animationDuration: '8s' }}>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                <MessageSquare size={20} />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white">AI Kognitiv Baholash</div>
                <div className="text-[10px] text-slate-400">Tahlil hisoboti tayyor</div>
              </div>
            </div>

          </motion.div>

          <p className="mt-8 text-xs text-slate-500 tracking-wider flex items-center justify-center gap-2 font-mono uppercase">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
            {t.hero.usersOnline}
          </p>

        </div>
      </section>

      {/* ── 2. TRUST / STATISTICS SECTION ── */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true, margin: "-50px" }} 
        transition={{ duration: 0.6 }} 
        className="py-16 border-y border-white/5 bg-white/[0.01] relative z-10"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            
            <div className="text-center md:text-left space-y-2">
              <div className="text-3xl md:text-5xl font-extrabold text-white bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                98%
              </div>
              <div className="text-xs md:text-sm text-slate-400 font-medium">
                {t.stats.completionRate}
              </div>
            </div>

            <div className="text-center md:text-left space-y-2">
              <div className="text-3xl md:text-5xl font-extrabold text-white bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                45%
              </div>
              <div className="text-xs md:text-sm text-slate-400 font-medium">
                {t.stats.timeSaved}
              </div>
            </div>

            <div className="text-center md:text-left space-y-2">
              <div className="text-3xl md:text-5xl font-extrabold text-white bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                150K+
              </div>
              <div className="text-xs md:text-sm text-slate-400 font-medium">
                {t.stats.certifiedUsers}
              </div>
            </div>

            <div className="text-center md:text-left space-y-2">
              <div className="text-3xl md:text-5xl font-extrabold text-white bg-gradient-to-r from-violet-400 to-pink-500 bg-clip-text text-transparent">
                10M+
              </div>
              <div className="text-xs md:text-sm text-slate-400 font-medium">
                {t.stats.studyHours}
              </div>
            </div>

          </div>
        </div>
      </motion.section>

      {/* ── 3. FEATURES SECTION ── */}
      <motion.section 
        id="features" 
        initial={{ opacity: 0, y: 40 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true, margin: "-50px" }} 
        transition={{ duration: 0.7 }} 
        className="py-24 px-6 relative z-10"
      >
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              {t.features.title}
            </h2>
            <p className="max-w-2xl mx-auto text-slate-400 text-sm md:text-base font-light">
              {t.features.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-blue-500/30 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between h-[240px]">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                  <Cpu size={22} />
                </div>
                <h3 className="text-lg font-bold text-white">{t.features.aiAssistant}</h3>
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed">{t.features.aiAssistantDesc}</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-violet-500/30 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between h-[240px]">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
                  <LineChart size={22} />
                </div>
                <h3 className="text-lg font-bold text-white">{t.features.analytics}</h3>
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed">{t.features.analyticsDesc}</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-cyan-500/30 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between h-[240px]">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <CheckCircle size={22} />
                </div>
                <h3 className="text-lg font-bold text-white">{t.features.exams}</h3>
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed">{t.features.examsDesc}</p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-rose-500/30 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between h-[240px]">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                  <Video size={22} />
                </div>
                <h3 className="text-lg font-bold text-white">{t.features.webinars}</h3>
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed">{t.features.webinarsDesc}</p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-amber-500/30 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between h-[240px]">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <Award size={22} />
                </div>
                <h3 className="text-lg font-bold text-white">{t.features.certificates}</h3>
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed">{t.features.certificatesDesc}</p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-emerald-500/30 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between h-[240px]">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <Shield size={22} />
                </div>
                <h3 className="text-lg font-bold text-white">{t.features.security}</h3>
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed">{t.features.securityDesc}</p>
              </div>
            </div>

          </div>

        </div>
      </motion.section>

      {/* ── 4. AI COPLAY / SHOWCASE SECTION ── */}
      <motion.section 
        id="ai-showcase" 
        initial={{ opacity: 0, y: 40 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true, margin: "-50px" }} 
        transition={{ duration: 0.7 }} 
        className="py-24 px-6 bg-gradient-to-b from-[#080b12] to-[#0d1220] relative z-10"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Description Text */}
            <div className="lg:col-span-5 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/25 px-4 py-1.5 rounded-full text-xs font-semibold text-violet-400">
                <Cpu size={14} />
                <span>AI CO-PILOT ENGINE</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                {t.aiShowcase.title}
              </h2>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed font-light">
                {t.aiShowcase.subtitle}
              </p>
              <ul className="space-y-3.5 text-slate-300 text-sm font-medium">
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">✓</div>
                  <span>AI generator yordamida daqiqalarda testlar yaratish</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">✓</div>
                  <span>Hujjatlar va videolardan qisqartirilgan konspekt yaratish</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">✓</div>
                  <span>Avtomatik savol-javob darslari (AI Tutor)</span>
                </li>
              </ul>
            </div>

            {/* Interactive Widget Simulator */}
            <div className="lg:col-span-7">
              <div className="bg-[#0b0f19] border border-white/10 rounded-2xl p-4 md:p-6 shadow-2xl relative">
                
                {/* Simulated Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-blue-600 flex items-center justify-center text-white">
                      <Sparkles size={16} />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white">AI Content Generator</div>
                      <div className="text-[10px] text-slate-500 font-mono">v1.2 // stable</div>
                    </div>
                  </div>
                  <div className="text-[10px] bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded border border-violet-500/20 font-bold uppercase tracking-wider">
                    Ready
                  </div>
                </div>

                {/* Simulated Chat & Generator Form */}
                <div className="space-y-4 text-left">
                  
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                      {t.aiShowcase.inputLabel}
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder={t.aiShowcase.placeholder}
                        disabled={isGenerating || generationStep === 2}
                        className="flex-1 bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-xs md:text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500 transition-colors"
                      />
                      <button 
                        onClick={startAiGeneration}
                        disabled={isGenerating || !aiPrompt.trim()}
                        className="bg-violet-600 hover:bg-violet-500 disabled:bg-violet-900/40 disabled:text-slate-500 text-white px-5 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 whitespace-nowrap"
                      >
                        {isGenerating ? t.aiShowcase.generating : t.aiShowcase.generateBtn}
                        <Send size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Simulator Output Box */}
                  <div className="min-h-[160px] bg-white/[0.01] border border-white/5 rounded-xl p-4 flex flex-col justify-center relative overflow-hidden">
                    
                    {generationStep === 0 && (
                      <div className="text-center text-slate-500 space-y-2">
                        <Cpu size={32} className="mx-auto text-slate-600 animate-pulse" />
                        <p className="text-xs md:text-sm font-light">Kuting, sun'iy intellekt topshiriqni qabul qilishga tayyor.</p>
                      </div>
                    )}

                    {generationStep === 1 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-violet-400 font-bold text-xs">
                          <span className="w-2 h-2 bg-violet-400 rounded-full animate-ping" />
                          {t.aiShowcase.generating}
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 w-3/4 bg-white/5 rounded animate-pulse" />
                          <div className="h-3 w-1/2 bg-white/5 rounded animate-pulse" />
                          <div className="h-3 w-5/6 bg-white/5 rounded animate-pulse" />
                        </div>
                      </div>
                    )}

                    {generationStep === 2 && (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="space-y-3 text-left"
                      >
                        <div className="text-xs font-bold text-green-400 flex items-center gap-1.5 mb-1">
                          <CheckCircle size={14} />
                          {t.aiShowcase.feedback}
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 space-y-2.5">
                          <div className="text-xs font-bold text-white border-b border-white/5 pb-1.5">{t.aiShowcase.testTitle}</div>
                          <div className="text-[11px] text-slate-300 font-medium">{t.aiShowcase.q1}</div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[10px] text-slate-400 pl-3">
                            <div>{t.aiShowcase.q1_a}</div>
                            <div className="text-blue-400 font-semibold">{t.aiShowcase.q1_b} (To'g'ri javob)</div>
                            <div>{t.aiShowcase.q1_c}</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => { setAiPrompt(''); setGenerationStep(0); }}
                          className="text-[10px] text-slate-500 hover:text-white font-mono underline"
                        >
                          Qayta yozib ko'rish
                        </button>
                      </motion.div>
                    )}

                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>
      </motion.section>

      {/* ── 5. INTERACTIVE DASHBOARD SHOWCASE ── */}
      <motion.section 
        id="dashboard-showcase" 
        initial={{ opacity: 0, y: 40 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true, margin: "-50px" }} 
        transition={{ duration: 0.7 }} 
        className="py-24 px-6 bg-[#080b12] relative z-10"
      >
        <div className="max-w-7xl mx-auto text-center space-y-12">
          
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              {t.dashboardShowcase.title}
            </h2>
            <p className="max-w-2xl mx-auto text-slate-400 text-sm md:text-base font-light">
              {t.dashboardShowcase.subtitle}
            </p>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="inline-flex bg-white/5 border border-white/10 rounded-2xl p-1.5 max-w-lg mx-auto w-full">
            <button 
              onClick={() => setActiveTab('admin')} 
              className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-xl transition-all ${activeTab === 'admin' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10' : 'text-slate-400 hover:text-white'}`}
            >
              {t.dashboardShowcase.tabAdmin}
            </button>
            <button 
              onClick={() => setActiveTab('student')} 
              className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-xl transition-all ${activeTab === 'student' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10' : 'text-slate-400 hover:text-white'}`}
            >
              {t.dashboardShowcase.tabStudent}
            </button>
            <button 
              onClick={() => setActiveTab('analytics')} 
              className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-xl transition-all ${activeTab === 'analytics' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10' : 'text-slate-400 hover:text-white'}`}
            >
              {t.dashboardShowcase.tabAnalytics}
            </button>
          </div>

          {/* Tab Render View */}
          <div className="bg-[#0b0f19] border border-white/5 rounded-2xl p-6 md:p-8 min-h-[380px] shadow-2xl relative text-left">
            
            <AnimatePresence mode="wait">
              {activeTab === 'admin' && (
                <motion.div 
                  key="admin"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-2">
                    <div className="text-xs text-slate-400">{t.dashboardShowcase.totalStudents}</div>
                    <div className="text-3xl font-extrabold text-white">12,450 ta</div>
                    <div className="text-[10px] text-green-400 font-semibold">1,230 ta yangi xodim qo'shildi</div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-2">
                    <div className="text-xs text-slate-400">{t.dashboardShowcase.activeCourses}</div>
                    <div className="text-3xl font-extrabold text-blue-400">142 ta</div>
                    <div className="text-[10px] text-slate-500">12 ta ishlab chiqish jarayonida</div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-2">
                    <div className="text-xs text-slate-400">{t.dashboardShowcase.passingRate}</div>
                    <div className="text-3xl font-extrabold text-white">88.5%</div>
                    <div className="text-[10px] text-green-400 font-semibold">↑ 2.1% o'tgan oydan</div>
                  </div>

                  <div className="md:col-span-3 bg-white/[0.01] border border-white/5 rounded-xl p-5 space-y-4">
                    <div className="text-sm font-bold text-white">{t.dashboardShowcase.recentCourses}</div>
                    <div className="space-y-2">
                      {[t.dashboardShowcase.course1, t.dashboardShowcase.course2, t.dashboardShowcase.course3].map((title, i) => (
                        <div key={i} className="flex justify-between items-center bg-white/[0.02] border border-white/5 rounded-lg p-3 text-xs md:text-sm">
                          <div className="font-semibold text-slate-200">{title}</div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-500 font-mono">ID: LMS-0{i+1}</span>
                            <span className="text-[11px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-medium">Faol</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'student' && (
                <motion.div 
                  key="student"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="bg-gradient-to-r from-blue-900/20 to-violet-900/10 border border-blue-500/20 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="text-lg font-bold text-white">Salom, Husan Rustamov!</div>
                      <div className="text-xs text-slate-400">Hozirda sizda 2 ta yakunlanmagan dars mavjud.</div>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5">
                      <Play size={12} fill="currentColor" />
                      Darslarni davom ettirish
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-3">
                      <div className="text-xs font-bold text-slate-400">MENING PROGRESSIM</div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-300">
                          <span>Sanoat xavfsizligi</span>
                          <span>78%</span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: '78%' }} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-300">
                          <span>Mehnat normalari</span>
                          <span>40%</span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-500 rounded-full" style={{ width: '40%' }} />
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-3 flex flex-col justify-between">
                      <div className="text-xs font-bold text-slate-400">YUKLAB OLINGAN SERTIFIKATLAR</div>
                      <div className="flex items-center gap-3 bg-white/5 rounded-lg p-2.5 border border-white/5">
                        <div className="w-9 h-9 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <Award size={18} />
                        </div>
                        <div className="flex-1 text-xs">
                          <div className="font-bold text-white">LMS Professional Expert</div>
                          <div className="text-[10px] text-slate-400">Avtomatik QR tekshiruvli</div>
                        </div>
                        <button className="text-xs text-blue-400 font-semibold hover:underline">Yuklash</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'analytics' && (
                <motion.div 
                  key="analytics"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                >
                  <div className="lg:col-span-5 bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-4">
                    <div className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider">Bo'limlar tahlili</div>
                    <div className="space-y-3.5">
                      {[
                        { name: "Texnologiya bo'limi", progress: 92, status: "Yuqori" },
                        { name: "Avtomatlashtirish", progress: 85, status: "Yuqori" },
                        { name: "Konchilik ishlari", progress: 68, status: "O'rtacha" },
                        { name: "Transport bo'limi", progress: 54, status: "Minimal" }
                      ].map((dept, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-slate-300">{dept.name}</span>
                            <span className="text-slate-400 font-bold">{dept.progress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${dept.progress >= 85 ? 'bg-green-500' : dept.progress >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                              style={{ width: `${dept.progress}%` }} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-7 bg-white/[0.02] border border-white/5 rounded-xl p-5 flex flex-col justify-between min-h-[220px]">
                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                      <div className="text-xs font-bold text-slate-400 font-mono">TIZIM SAMARADORLIGI (KPI)</div>
                      <div className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                        98.2 KPI
                      </div>
                    </div>
                    <div className="h-28 flex items-end justify-between gap-2.5 pt-4">
                      {[30, 50, 40, 65, 80, 55, 90, 85, 100, 110].map((val, idx) => (
                        <div key={idx} className="flex-1 space-y-1 flex flex-col items-center">
                          <div className="w-full bg-gradient-to-t from-blue-600/50 to-violet-500 rounded-t-sm" style={{ height: `${val * 0.7}px` }} />
                          <span className="text-[8px] text-slate-600 font-mono">{idx + 1}o</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500 text-center font-light pt-2">
                      Xodimlar malaka oshirish jarayoni bo'yicha tizimning real vaqtdagi integrallashgan dinamika grafigi.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>
      </motion.section>

      {/* ── 6. RESPONSIVE EXPERIENCE SECTION ── */}
      <motion.section 
        initial={{ opacity: 0, y: 40 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true, margin: "-50px" }} 
        transition={{ duration: 0.7 }} 
        className="py-24 px-6 border-t border-white/5 bg-[#0d1220]/50 relative overflow-hidden z-10"
      >
        
        {/* Animated Glow Grid in background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto text-center space-y-16">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              {t.responsive.title}
            </h2>
            <p className="max-w-2xl mx-auto text-slate-400 text-sm md:text-base font-light">
              {t.responsive.subtitle}
            </p>
          </div>

          {/* Showcase of mockups */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Desktop Mockup Card */}
            <div className="md:col-span-7 bg-[#0b0e17] border border-white/10 rounded-2xl shadow-xl overflow-hidden p-2">
              <div className="bg-white/5 border border-white/5 rounded-xl h-[280px] p-3 flex flex-col justify-between text-left">
                <div className="flex items-center gap-1.5 pb-2 border-b border-white/5 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <div className="text-[10px] text-slate-500 font-mono ml-3">{t.responsive.desktop}</div>
                </div>
                <div className="flex-1 flex flex-col justify-center items-center text-center space-y-3">
                  <Smartphone className="text-blue-500/20" size={48} />
                  <p className="text-xs text-slate-400 max-w-sm">Maksimal ekran kengligi, tahliliy hisobotlarni tahrirlash va yangi o'quv kurslarini joylashtirish uchun optimal interfeys.</p>
                </div>
              </div>
            </div>

            {/* Mobile / Tablet Mockup Card */}
            <div className="md:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#0b0e17] border border-white/10 rounded-2xl p-4 text-left space-y-4">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <Layers size={16} />
                </div>
                <h3 className="text-sm font-bold text-white">{t.responsive.tablet}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">Darslarni o'qish, video ma'ruzalarni tomosha qilish va planshet formatidagi interaktiv testlar.</p>
              </div>

              <div className="bg-[#0b0e17] border border-white/10 rounded-2xl p-4 text-left space-y-4">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Smartphone size={16} />
                </div>
                <h3 className="text-sm font-bold text-white">{t.responsive.mobile}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{t.responsive.mobile}. Tezkor push bildirishnomalar va istalgan joyda mobil imtihon topshirish.</p>
              </div>
            </div>

          </div>
        </div>
      </motion.section>

      {/* ── 7. ENTERPRISE BENEFITS ── */}
      <motion.section 
        id="benefits" 
        initial={{ opacity: 0, y: 40 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true, margin: "-50px" }} 
        transition={{ duration: 0.7 }} 
        className="py-24 px-6 relative z-10"
      >
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              {t.benefits.title}
            </h2>
            <p className="max-w-2xl mx-auto text-slate-400 text-sm md:text-base font-light">
              {t.benefits.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {t.benefits.featuresList.map((benefit, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4 flex flex-col justify-between hover:border-blue-500/25 transition-all">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold">
                  0{i+1}
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">{benefit.title}</h3>
                  <p className="text-slate-400 text-xs md:text-sm leading-relaxed">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </motion.section>

      {/* ── 8. TESTIMONIALS SECTION ── */}
      <motion.section 
        initial={{ opacity: 0, y: 40 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true, margin: "-50px" }} 
        transition={{ duration: 0.7 }} 
        className="py-24 px-6 border-t border-white/5 bg-white/[0.01] relative z-10"
      >
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              {t.testimonials.title}
            </h2>
            <p className="max-w-2xl mx-auto text-slate-400 text-sm md:text-base font-light">
              {t.testimonials.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8 space-y-6 flex flex-col justify-between">
              <p className="text-slate-300 text-xs md:text-sm md:text-base italic leading-relaxed">
                "{t.testimonials.quote1}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center font-bold text-white text-xs">
                  AK
                </div>
                <div>
                  <div className="text-xs md:text-sm font-bold text-white">{t.testimonials.author1}</div>
                  <div className="text-[10px] md:text-xs text-slate-500">{t.testimonials.role1}</div>
                </div>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8 space-y-6 flex flex-col justify-between">
              <p className="text-slate-300 text-xs md:text-sm md:text-base italic leading-relaxed">
                "{t.testimonials.quote2}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-500 to-pink-500 flex items-center justify-center font-bold text-white text-xs">
                  YS
                </div>
                <div>
                  <div className="text-xs md:text-sm font-bold text-white">{t.testimonials.author2}</div>
                  <div className="text-[10px] md:text-xs text-slate-500">{t.testimonials.role2}</div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </motion.section>

      {/* ── 9. FINAL CTA SECTION ── */}
      <motion.section 
        id="contact" 
        initial={{ opacity: 0, scale: 0.95 }} 
        whileInView={{ opacity: 1, scale: 1 }} 
        viewport={{ once: true, margin: "-50px" }} 
        transition={{ duration: 0.7 }} 
        className="py-24 px-6 relative overflow-hidden z-10"
      >
        <div className="max-w-4xl mx-auto text-center relative z-10 bg-gradient-to-tr from-blue-900/40 via-slate-900/60 to-violet-900/40 border border-blue-500/30 rounded-3xl p-8 md:p-14 shadow-[0_0_80px_rgba(59,130,246,0.2)] backdrop-blur-md">
          
          <div className="absolute inset-0 bg-[#0d1322]/80 -z-10 rounded-3xl" />
          
          <div className="space-y-4 mb-10">
            <h2 className="text-2xl md:text-4xl font-extrabold text-white">
              {t.cta.title}
            </h2>
            <p className="max-w-xl mx-auto text-slate-400 text-xs md:text-sm font-light">
              {t.cta.subtitle}
            </p>
          </div>

          <form onSubmit={handleContactSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                required
                value={contactInput}
                onChange={(e) => setContactInput(e.target.value)}
                placeholder={t.cta.inputPlaceholder}
                disabled={isSubmitted}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs md:text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
              />
              <button 
                type="submit"
                disabled={isSubmitted}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white px-6 py-3 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap"
              >
                {t.cta.btn}
              </button>
            </div>

            {isSubmitted && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-green-400 font-semibold mt-4"
              >
                {t.cta.success}
              </motion.div>
            )}
          </form>

        </div>
      </motion.section>

      {/* ── 10. FOOTER ── */}
      <footer className="border-t border-white/5 bg-[#06080f] py-12 px-6 text-slate-500 text-xs md:text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-xs">
              A
            </div>
            <div className="text-left">
              <div className="font-bold text-white text-xs tracking-tight">{t.footer.company}</div>
              <div className="text-[10px] text-slate-500 font-mono">v3.0 // ENTERPRISE</div>
            </div>
          </div>

          <div className="flex gap-6">
            <a href="#features" className="hover:text-white transition-colors">{t.nav.features}</a>
            <a href="#ai-showcase" className="hover:text-white transition-colors">{t.nav.aiShowcase}</a>
            <a href="#dashboard-showcase" className="hover:text-white transition-colors">{t.nav.dashboard}</a>
          </div>

          <div>
            © {new Date().getFullYear()} {t.footer.company}. {t.footer.rights}
          </div>

        </div>
      </footer>

    </div>
  );
}
