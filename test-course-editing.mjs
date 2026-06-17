import { chromium } from 'playwright';

(async () => {
  console.log('E2E Test: Kurslarni tahrirlash (Course Editing) boshlandi...');
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Tizimga kirish
    console.log('1. Tizimga kirish (1608 / muxur2573)...');
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="text"]', '1608');
    await page.fill('input[type="password"]', 'muxur2573');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard');
    console.log('Dashboardga muvaffaqiyatli kirildi.');

    // 2. Kurslar sahifasiga o'tish
    console.log('2. Kurslar sahifasiga o\'tish...');
    await page.goto('http://localhost:5173/courses');
    await page.waitForLoadState('networkidle');

    // 3. Birinchi kursni tanlash
    console.log('3. Birinchi kursni tanlash...');
    const courseCards = page.locator('.course-card');
    if (await courseCards.count() === 0) {
      console.log('Kurslar topilmadi, test to\'xtatildi.');
      await browser.close();
      return;
    }
    await courseCards.first().click();

    // Sahifa yuklanishini kutish
    await page.waitForSelector('text=Tahrirlash', { timeout: 10000 });

    // 4. Tahrirlash rejimiga o'tish
    console.log('4. Tahrirlash tugmasi bosilmoqda...');
    await page.click('text=Tahrirlash');

    // Darslar (Modules) tabiga o'tish
    console.log('Darslar tabiga o\'tish...');
    await page.click('text=Darslar');

    // 5. Yangi modul qo'shish
    console.log('5. Yangi modul qo\'shish...');
    await page.click('text=+ Yangi bo\'lim qo\'shish');
    const moduleInput = page.locator('input[placeholder="Yangi bo\'lim nomi"]');
    await moduleInput.fill('E2E Test Modul ' + Date.now());
    await page.keyboard.press('Enter');

    // 6. Modulga yangi dars qo'shish
    console.log('6. Yangi dars qo\'shish...');
    const addLessonBtn = page.locator('text=+ Yangi dars').last();
    await addLessonBtn.click();

    // Dars nomini O'zbek va Rus tillarida kiritish
    console.log('7. Dars nomlarini O\'zbek va Rus tillarida yozish...');
    const uzInput = page.locator('input[placeholder="Dars nomi (O\'zbek)..."]').last();
    const ruInput = page.locator('input[placeholder="Название урока (Русский)..."]').last();

    await uzInput.fill('E2E Test O\'zbekcha Dars');
    await ruInput.fill('E2E Test Русский Урок');

    // 8. O'zgarishlarni saqlash
    console.log('8. O\'zgarishlarni saqlash...');
    await page.click('button:has-text("Saqlash")');

    // Saqlash yakunlanishini kutish (editMode tugaydi)
    await page.waitForSelector('text=Tahrirlash', { state: 'visible' });
    console.log('O\'zgarishlar muvaffaqiyatli saqlandi!');

    // 9. UUID bugni tekshirish uchun qayta tahrirlashga kirish
    console.log('9. Saqlanganini tekshirish uchun qayta tahrirlashga kirish...');
    await page.click('text=Tahrirlash');
    await page.click('text=Darslar');

    const checkUz = await page.locator('input[placeholder="Dars nomi (O\'zbek)..."]').last().inputValue();
    const checkRu = await page.locator('input[placeholder="Название урока (Русский)..."]').last().inputValue();

    if (checkUz === 'E2E Test O\'zbekcha Dars' && checkRu === 'E2E Test Русский Урок') {
      console.log('✅ TEST MUVAFFAQIYATLI: UUID saqlanib qoldi va Ma\'lumotlar to\'g\'ri yozildi!');
    } else {
      console.error('❌ TEST XATOSI: Saqlangan dars topilmadi. UUID bugi mavjud!');
    }

    // 10. Yaratilgan E2E test modulni tozalash
    console.log('10. Yaratilgan test modulini tozalash (Delete)...');
    const deleteBtn = page.locator('button[title="Bo\'limni o\'chirish"]').last();
    await deleteBtn.click();
    await page.click('button:has-text("Saqlash")');
    await page.waitForSelector('text=Tahrirlash', { state: 'visible' });

    console.log('Test to\'liq va muvaffaqiyatli yakunlandi.');
  } catch (error) {
    console.error('Test davomida xatolik yuz berdi:', error);
  } finally {
    await browser.close();
  }
})();
