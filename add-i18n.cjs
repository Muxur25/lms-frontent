const fs = require('fs');

const uzPaths = ['./src/i18n/uz.json', './public/locales/uz/translation.json'];
const newUz = {
  thisExam: "Ushbu imtihon",
  aiMonitoringActive: "AI monitoring faol",
  activeProtect: "Faol himoya",
  errAttempts: "Urinishlar tugagan",
  errGeneral: "Xatolik yuz berdi",
  errAttemptsText: "Ushbu imtihon uchun belgilangan barcha urinishlar sonidan foydalanib bo'lgansiz.",
  officialBadge: "Rasmiy sertifikatlash imtihoni",
  min: "min",
  ta: "ta",
  passing: "o'tish",
  chi: "-chi",
  examWillStartAt: "Imtihon quyidagi vaqtda boshlanadi:",
  sessionSecurity: "Sessiya xavfsizligi",
  aiCamera: "AI kamera monitoring",
  focusTracking: "Fokus kuzatish",
  suspiciousActivity: "Shubhali faollik deteksiya",
  retry: "Qayta urinish",
  thisMonth: "bu oy",
  successRate: "muvaffaqiyat",
  good: "Yaxshi",
  unsatisfactory: "Qoniqarsiz",
  overallResult: "umumiy natija",
  successful: "muvaffaqiyatli",
  nextExam: "keyingi imtihon",
  days: "kun",
  dailyStudy: "kunlik o'qish",
  ready: "tayyor",
  view: "Ko'rish",
  roadmapPlaceholder: "Sertifikatlash yo'nalishi imtihonlar yaratilgandan keyin ko'rinadi.",
  onlyVerifiedResult: "faqat server tasdiqlagan natija uchun chiqariladi.",
  defaultTitle: "Imtihon",
  certLabel: "SERTIFIKAT",
  certSub: "KVALIFIKATSIYANI TASDIQLASH",
  awardTo: "Ushbu sertifikat egasi",
  certBody: "<strong>\"{{title}}\"</strong> yo‘nalishi bo‘yicha imtihondan muvaffaqiyatli o‘tib, <strong>{{score}}%</strong> natija ko‘rsatgani uchun ushbu sertifikat bilan taqdirlanadi.",
  dateIssued: "Berilgan sana",
  directorSign: "Tasdiqlovchi / Direktor",
  organization: "Tashkilot",
  verify: "TEKSHIRISH",
  congratulations: "🎉 Tabriklaymiz!",
  tryAgain: "Yana harakat qiling",
  earnedCert: "Sertifikat olishga haqli bo'ldingiz!",
  needMoreForPassing: "O'tish uchun {{passing}}% kerak",
  correct: "To'g'ri",
  wrong: "Noto'g'ri",
  skipped: "O'tkazildi",
  topicBreakdown: "Mavzu bo'yicha tahlil",
  downloadCert: "Sertifikatni yuklab olish"
};

uzPaths.forEach(p => {
  if (fs.existsSync(p)) {
    let data = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (!data.exam) data.exam = {};
    Object.assign(data.exam, newUz);
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
  }
});

const ruPaths = ['./src/i18n/ru.json', './public/locales/ru/translation.json'];
const newRu = {
  thisExam: "Этот экзамен",
  aiMonitoringActive: "AI мониторинг активен",
  activeProtect: "Активная защита",
  errAttempts: "Попытки исчерпаны",
  errGeneral: "Произошла ошибка",
  errAttemptsText: "Вы использовали все доступные попытки для этого экзамена.",
  officialBadge: "Официальный сертификационный экзамен",
  min: "мин",
  ta: "шт",
  passing: "проходной",
  chi: "-я",
  examWillStartAt: "Экзамен начнется в:",
  sessionSecurity: "Безопасность сеанса",
  aiCamera: "AI мониторинг камеры",
  focusTracking: "Отслеживание фокуса",
  suspiciousActivity: "Обнаружение подозрительной активности",
  retry: "Повторить попытку",
  thisMonth: "в этом месяце",
  successRate: "успешность",
  good: "Хорошо",
  unsatisfactory: "Неудовлетворительно",
  overallResult: "общий результат",
  successful: "успешно",
  nextExam: "следующий экзамен",
  days: "дней",
  dailyStudy: "ежедневное обучение",
  ready: "готов",
  view: "Смотреть",
  roadmapPlaceholder: "Направление сертификации будет видно после создания экзаменов.",
  onlyVerifiedResult: "выдается только для подтвержденных сервером результатов.",
  defaultTitle: "Экзамен",
  certLabel: "СЕРТИФИКАТ",
  certSub: "ПОДТВЕРЖДЕНИЕ КВАЛИФИКАЦИИ",
  awardTo: "Настоящим подтверждается, что",
  certBody: "успешно прошел(ла) программу оценки знаний по курсу <strong>\"{{title}}\"</strong> с результатом <strong>{{score}}%</strong>.",
  dateIssued: "Дата выдачи",
  directorSign: "Директор / Утвердил",
  organization: "Организация",
  verify: "ПРОВЕРИТЬ",
  congratulations: "🎉 Поздравляем!",
  tryAgain: "Попробуйте еще раз",
  earnedCert: "Вы получили сертификат!",
  needMoreForPassing: "Для сдачи нужно {{passing}}%",
  correct: "Верно",
  wrong: "Неверно",
  skipped: "Пропущено",
  topicBreakdown: "Анализ по темам",
  downloadCert: "Скачать сертификат"
};

ruPaths.forEach(p => {
  if (fs.existsSync(p)) {
    let data = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (!data.exam) data.exam = {};
    Object.assign(data.exam, newRu);
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
  }
});
