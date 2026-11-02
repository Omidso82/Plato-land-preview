# PLATO LAND — QA Master Checklist v1.7

تاریخ: ۲ نوامبر ۲۰۲۶  
نسخه قبلی: `docs/QA_MASTER_CHECKLIST_v1.6.md`  
دامنه این افزوده: صفحه موقت Series 2، جایگاه‌های مستقل ۱۸ اسلاید، Storage اصلی و انتشار GitHub Pages.

> تاریخچه نسخه‌های قبلی حفظ می‌شود. این سند فقط شواهد و وضعیت آزمون‌های مرحله ۲ نوامبر را ثبت می‌کند.

## 1. شناسنامه اجرای بررسی

- Repository: `Omidso82/Plato-land-preview`
- Branch: `main`
- HEAD: `38a7e20cc6ce20c0cdb9202394036bdf1637d8f8`
- Supabase project: `dfrppbapaaydbjeflozw`
- Supabase status: `ACTIVE_HEALTHY`
- Domain: `https://platoland.org`

## 2. مسیرهای صفحه

- [x] کد `src/index.tsx` مسیر `/` را به `Series2Registration` متصل می‌کند.
- [x] مسیر `/series2-registration` صفحه ثبت‌نام موقت را باز می‌کند.
- [x] مسیر `/series2-slides-manager` پنل مستقل مدیریت اسلایدها را باز می‌کند.
- [x] مسیر پنل اسلایدها در منوی عمومی صفحه ثبت‌نام لینک نشده است.
- [x] پنل پیش از نمایش ابزار آپلود، ورود Auth و نقش `owner` را بررسی می‌کند.
- [x] مسیر `/home` برای دسترسی به صفحه اصلی قبلی در برنامه اصلی حفظ شده است.
- [ ] مشاهده مستقل دامنه زنده در مرورگر و تأیید مسیر ریشه؛ DNS در محیط این بررسی resolve نشد.

## 3. جایگاه‌های مستقل اسلاید

- [x] پنل در کد دقیقاً ۱۸ جایگاه مستقل دارد.
- [x] هر جایگاه انتخاب فایل، پیش‌نمایش و دکمه ذخیره/جایگزینی مستقل دارد.
- [x] شماره‌گذاری از نام فایل یا ترتیب انتخاب گروهی تأثیر نمی‌گیرد.
- [x] کلید ذخیره‌سازی ثابت `slides/01` تا `slides/18` است.
- [x] جایگزینی فایل فقط همان کلید را به‌روزرسانی می‌کند.
- [x] فرمت JPG/PNG/WEBP و سقف ۱۰ مگابایت در کد کنترل می‌شود.
- [x] صفحه عمومی کلیدهای canonical را به شماره اسلاید نگاشت می‌کند.
- [x] اسلاید ۱۸ آخرین پیام است و قانون ۱۷ در جایگاه ۱۷ باقی می‌ماند.
- [ ] آزمون عملی جایگزینی یک تصویر با حساب مالک انجام نشده است.
- [ ] تطبیق بصری ۱۸ تصویر Storage با فایل‌های اصلی مالک انجام نشده است.
- [ ] آزمون موبایل/دسکتاپ برای نبود crop و حفظ نسبت تصویر انجام نشده است.

## 4. شواهد Storage در دیتابیس اصلی

- [x] Bucket `series2-slides` در Supabase اصلی وجود دارد.
- [x] Bucket برای خواندن تصاویر قوانین عمومی است.
- [x] Policy خواندن برای anon/authenticated محدود به همین Bucket است.
- [x] Policyهای INSERT/UPDATE/DELETE برای نقش owner تعریف شده‌اند.
- [x] Query مستقیم Storage تعداد ۱۸ object را برگرداند.
- [x] هر ۱۸ object دارای کلید canonical دقیقاً از `slides/01` تا `slides/18` هستند.
- [x] تعداد کلیدهای تکراری/غیرمنتظره صفر است.
- [x] هر ۱۸ object دارای MIME برابر `image/png` و اندازه غیرصفر حدود ۲٫۰ تا ۲٫۳۴ مگابایت هستند.
- [ ] دریافت و مشاهده پیکسلی فایل‌ها در این محیط ممکن نشد؛ بنابراین صحت محتوای هر تصویر تأیید نشده است.

## 5. ثبت‌نام و حفاظت داده

- [x] جدول `public.plato_land_series2_registration_requests` در دیتابیس اصلی وجود دارد.
- [x] Edge Function `plato-land-series2-registration` فعال است.
- [x] جدول ثبت‌نام RLS فعال دارد و policy عمومی مستقیم ندارد.
- [x] تعداد درخواست‌های ثبت‌شده در زمان بررسی صفر است.
- [x] در اجرای QA هیچ ثبت‌نام آزمایشی درج نشد.
- [x] Bucket مدارک ثبت‌نام `registration-evidence` خصوصی باقی مانده است.
- [x] هیچ دیتابیس دوم یا Preview/Test Database ساخته نشده است.
- [x] در این بررسی هیچ داده یا رکورد عملیاتی تغییر نکرد.
- [ ] آزمون واقعی End-to-End ثبت‌نام با حساب/شناسه مجاز انجام نشده است.

## 6. Build و انتشار

- [x] Commit نهایی بررسی‌شده: `38a7e20cc6ce20c0cdb9202394036bdf1637d8f8`.
- [x] GitHub Actions Build and typecheck run `41493940385` با conclusion=success.
- [x] npm install موفق.
- [x] TypeScript verification موفق.
- [x] Vite production build موفق.
- [x] GitHub Pages output verification موفق.
- [x] `dist/CNAME` برای `platoland.org` ساخته شد.
- [x] `dist/404.html` از `dist/index.html` ساخته شد.
- [x] Upload Pages artifact موفق.
- [x] Deploy workflow run `41493940357` با conclusion=success.
- [ ] پاسخ HTTP و نمایش واقعی دامنه در مرورگر مستقل تأیید نشده است؛ DNS در محیط این بررسی قابل resolve نبود.

## 7. اختلاف migration و مخزن

- [x] Ledger دیتابیس اصلی شامل migration `20261102150429_create_plato_land_series2_registration_requests` است.
- [x] Ledger دیتابیس اصلی شامل migration `20261102172531_series2_private_owner_slide_upload` است.
- [ ] فایل‌های SQL متناظر در `supabase/migrations/` شاخه main پیدا نشدند.
- [ ] بازیابی/ثبت دقیق SQL migrationها برای ممیزی و بازسازی آینده باقی است.
- [x] در این QA هیچ migration اجرا یا replay نشد.
- [x] به علت migration baselineهای مفقود، اجرای `supabase db push` انجام نشد.

## 8. جمع‌بندی

**وضعیت:** کد ۱۸ جایگاه مستقل در main وجود دارد؛ ۱۸ فایل شماره‌گذاری‌شده در Storage اصلی تأیید شدند؛ Build و Deploy برای HEAD جاری GitHub موفق هستند.

**تأییدنشده:** مشاهده زنده دامنه، ورود واقعی مالک/رد حساب غیرمجاز، آزمون واقعی جایگزینی تصویر و تطبیق بصری هر ۱۸ فایل با منابع اصلی.

موارد تأییدنشده عمداً تیک نخورده‌اند. موفقیت CI و Deploy به‌تنهایی جایگزین تست مرورگر واقعی نیست.
