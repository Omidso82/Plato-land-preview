# PLATO LAND — Implementation Register v1.4
تاریخ: ۳ نوامبر ۲۰۲۶

## ۱. تغییرات مستندسازی این Snapshot
سه سند جدید وضعیت جاری اضافه شد:
- `docs/PROJECT_STATUS_AND_DECISIONS_2026-11-03.md` — مرجع تجمیعی تصمیم‌ها، وضعیت و موارد باز.
- `docs/SERIES2_REGISTRATION_LIVE_DATABASE_SNAPSHOT_2026-11-03.md` — گزارش Query تازه دیتابیس.
- `docs/CLOUDFLARE_PAGES_PREVIEW_SETUP_STATUS_2026-11-03.md` — نقطه توقف راه‌اندازی Preview.

دو سند کنترلی/انتقالی جدید:
- `docs/TECHNICAL_HANDOVER_v3.2_2026-11-03.md`
- `docs/QA_MASTER_CHECKLIST_v1.8_2026-11-03.md`

## ۲. شواهد تازه
- Query فقط‌خواندنی Supabase اصلی: ۲۰ درخواست، ۲۰ شناسه یکتا، ۲۰ پذیرش قوانین.
- آخرین ثبت در ۳ نوامبر ۲۰۲۶ ساعت ۱۱:۲۵:۳۴ UTC / ۱۲:۲۵:۳۴ CET.
- تصویر Cloudflare فقط صفحه راهنما را نشان می‌دهد؛ داشبورد، اتصال GitHub و Deploy اثبات نشده‌اند.
- در این مرحله کد اجرایی، دیتابیس، DNS، Storage، Auth و تنظیمات انتشار تغییر نکردند.

## ۳. وضعیت پیاده‌سازی
این نسخه ثبت مستندات و شواهد است، نه انتشار قابلیت جدید سایت. هیچ ادعایی درباره تکمیل Cloudflare Preview یا QA مرورگر ندارد.

## ۴. اقدامات بعدی
1. دریافت تصویر داشبورد Workers & Pages.
2. بررسی هزینه/محدودیت پلن رایگان.
3. راه‌اندازی Preview مستقل و ایمن روی شاخه جدا.
4. آزمون مسیرهای واقعی و موبایل.
5. تکمیل موارد باز QA در نسخه بعدی.


## الحاقیه ثبت پیاده‌سازی — Cloudflare Preview
- شاخه: `cloudflare-preview` (مجزا از `main`).
- فایل‌های جدید: `src/PreviewApp.tsx`، `src/preview.css`، `.github/workflows/cloudflare-preview-check.yml`.
- فایل به‌روزشده: `src/index.tsx` برای انتخاب Preview با `VITE_PLATO_PREVIEW=true` و بارگذاری پویا/جداگانه مسیرهای عملیاتی.
- هدف: mock UI مستقل؛ بدون Supabase/Auth/ثبت‌نام/پنل Owner/Admin/داده خصوصی.
- Workflow فقط نصب، TypeScript، Build و بررسی bundle انجام می‌دهد؛ deploy نمی‌کند.
- commitهای کد: `ce8ff872b57ca6f8ebf921efc83cc8e80ec8d435`، `e995a308f38df892f9c89fadb8f05d2bd1347c97`، `90cb21bea59e411ff5b660eaa50ff31d4a5e923a`.
- commit Workflow: `c84817f238a289e2eed3e4729c416e84bf83ba2f`.
- Build/CI، Cloudflare config، Deploy، مشاهده زنده و QA مرورگر هنوز تأیید نشده‌اند.


## اصلاحیه شواهد اجرای CI — ۳ نوامبر ۲۰۲۶
- Workflow نهایی: https://github.com/Omidso82/Plato-land-preview/actions/runs/41656110849 ، commit ad75eb736ad581873fd56abf4a581d6eef27be79.
- نتیجه: Success برای setup، نصب dependencies، typecheck، build و بررسی artifact.
- Workflow به‌علت نبود lockfile از npm ci به npm install تغییر کرد؛ اجرای نهایی موفق است.
- CI بررسی کرد dist/index.html موجود باشد و رشته‌های مشخص Supabase project / registration endpoint / prediction admin در assets نباشند.
- محدودیت: این بررسی تضمین امنیت جامع نیست و جایگزین مرور artifact یا QA دستی نمی‌شود.
- وضعیت: CODE COMMITTED = YES؛ CI/BUILD = PASS؛ CLOUDFLARE CONFIG = NOT VERIFIED؛ DEPLOY = NOT DONE/NOT VERIFIED؛ LIVE QA = NOT RUN.


## الحاقیه v1.5 — یکپارچه‌سازی مستندات و Preview (۳ نوامبر ۲۰۲۶)
- اختلاف مستندات شاخه cloudflare-preview با main شناسایی شد: ۱۹ کامیت جلوتر در زمان بررسی اولیه.
- فایل‌های مستنداتی و README تکمیلی به main منتقل شدند؛ کد Preview و workflow اختصاصی آن در این انتقال کپی نشدند.
- Cloudflare Pages project با نام plato-land-preview روی شاخه cloudflare-preview ساخته و Deploy اولیه مشاهده شد.
- URL آزمایشی: https://plato-land-preview.pages.dev.
- هیچ ادعایی درباره برابری کامل Preview با سایت اصلی یا تکمیل QA ثبت نمی‌شود.
- وضعیت انتشار Production و دیتابیس اصلی در این اقدام تغییر داده نشد.


---

## الحاقیه v1.6 — تصمیم Staging و ثبت وضعیت واقعی Preview (۳ نوامبر ۲۰۲۶)

### بررسی منابع جاری
- GitHub `main`: `1ba638207299b6c12dbb8659846958427a5cdf28`.
- GitHub `cloudflare-preview`: `cbbe46bbbcb16ebbab1e9432a2a520da42426646`.
- Cloudflare Preview URL: `https://plato-land-preview.pages.dev`.
- دو اجرای CI اخیر Preview با شناسه‌های `41727267304` و `41727277808` موفق گزارش شده‌اند.
- این اجراها فقط Build برنامه نمایشی Preview را بررسی می‌کنند و تست قابلیت‌های عملیاتی نیستند.

### تغییرات تصمیم/مستندات در این نوبت
- سه محیط Preview / Staging / Production به‌صورت رسمی تفکیک شدند.
- تأیید شد Preview فعلی برای نهایی‌کردن ظاهر است و نه تست امکانات واقعی.
- Staging آینده باید برنامه واقعی با Supabase مستقل، داده‌های ساختگی و Storage/Auth/Functions مستقل داشته باشد.
- Production و Supabase اصلی نباید محیط آزمایش باشند.
- ایجاد Staging هنوز انجام نشده؛ هزینه/پلن و تأیید مالک پیش‌نیاز است.
- سند جدید: `docs/STAGING_AND_QUALITY_ASSURANCE_PLAN_v1.0_2026-11-03.md`.
- QA Master Checklist با دروازه‌های Staging و انتشار تکمیل شد.
- Project Status و Technical Handover با وضعیت فعلی و نقطه ادامه تکمیل شدند.

### وضعیت لوگو و قابلیت بارگذاری
- نیاز طراحی برای گزینه مستقل «لوگوی سایت» ثبت شد.
- قابلیت واقعی upload هنوز قابل اعلام به‌عنوان آماده/فعال نیست؛ CI Preview آن را تست نکرده است.
- بررسی bucket و policyها و پیاده‌سازی/آزمون upload باید در مرحله Staging انجام شود.

### تفکیک وضعیت
- مستندسازی برنامه QA/Staging: ثبت شد.
- ایجاد Supabase Staging: انجام نشده.
- انتقال schema/migrations: انجام نشده.
- تست Auth/roles/registration/storage واقعی در Staging: انجام نشده.
- انتشار Production: در این اقدام انجام نشده.


---

## الحاقیه v1.7 — تصمیمات و توافق‌های مالک، ۴ نوامبر ۲۰۲۶
### مستندات افزوده‌شده
- `docs/PROJECT_DECISION_ADDENDUM_2026-11-04.md`: مرجع جامع توافق‌های تثبیت‌شده، پنل محتوای موقت و وضعیت‌های باز.

### تغییرات این نوبت
- ثبت نیازمندی حفظ پنل `/series2-slides-manager` و قابلیت استفاده مجدد آن پس از اتمام سری دوم.
- ثبت هدف آینده برای تبدیل/توسعه قابلیت به پنل مدیریت محتوای موقت چندمنظوره.
- تثبیت قواعد پنل: Owner-only، بدون لینک عمومی، ۱۸ جایگاه مستقل، جایگزینی در همان slot، عدم اتکا به ترتیب انتخاب گروهی فایل‌ها.
- تفکیک Bucket عمومی اسلایدها `series2-slides` از مدارک خصوصی ثبت‌نام `registration-evidence`.
- ثبت چرخه عمر صفحه موقت: شروع/پایان روشن، مسیر بازگشت به سایت اصلی، حفظ داده‌ها و عدم حذف خودکار بدون سیاست/مجوز.
- ثبت وضعیت‌های راستی‌آزمایی‌نشده: دسترسی زنده پنل، کنترل نقش Owner، آزمون جایگزینی تک‌اسلاید، تطبیق بصری ۱۸ تصویر.
- این الحاقیه مستندسازی است؛ هیچ کد، DB، Storage، DNS یا Production تغییر نکرده است.


## الحاقیه v1.8 — پذیرش مالک بخش A در Preview، ۴ نوامبر ۲۰۲۶
- وضعیت بخش A: `OWNER ACCEPTED` بر اساس تأیید صریح مالک پس از مشاهده Preview.
- محیط: `https://plato-land-preview.pages.dev`، شاخه `cloudflare-preview`.
- Commitهای کد: `9e6bfe2802dfb9ad75597ff166d3a6b4083bc8ee` و `dee0b08b8b4f0cac429ea286aa9095d97f7f9742`.
- Compare تأییدشده: شاخه Preview با commit دوم یکسان است؛ صفر commit اختلاف.
- تغییرات مستندشده: حذف عبارت اضافه Hero و اصلاح سلسله‌مراتب برند/چیدمان موبایل.
- پذیرش مالک به معنی QA کامل یا تأیید Production نیست.
- بخش B باز است؛ تصمیم درباره «درباره ما» در Header هنوز دریافت نشده و هیچ پیاده‌سازی آن مجاز/ثبت نشده است.
- هیچ تغییر Production، main، Supabase، Storage یا DNS انجام نشد.


---

## الحاقیه v1.9 — تکمیل پیاده‌سازی و پذیرش مالک بخش B در Preview (۴ نوامبر ۲۰۲۶)

- محدوده پیاده‌سازی: Header مشترک، navigation صفحه اصلی/صفحات داخلی، صفحات عمومی مستقل، Footer و مقصد نمایشی ورود/ثبت‌نام در PreviewApp.
- اصلاحات پس از بازبینی مالک: حذف Hamburger موبایل، sticky شدن کل هدر، ساده‌سازی منو بدون قاب/پس‌زمینه دکمه‌ای، خلوت‌سازی صفحه اصلی و یکسان‌سازی عنوان «راهنما».
- فایل‌های اجرایی مرتبط طبق سوابق: src/PreviewApp.tsx و src/preview.css.
- PRهای مرتبط: #42، #43، #45 و #46؛ PR #44 بسته شد و مبنای نهایی نیست.
- commit بازیابی و بررسی‌شده برای یکسان‌سازی «راهنما»: 71dc5d55ac3099e8b9e67d36fb9bcfaeca83d2ad.
- مالک در ۴ نوامبر بررسی سایت را انجام داد، ایرادی نیافت و بخش B را تأیید کرد: OWNER ACCEPTED در Preview.
- پذیرش مالک، QA مستقل کامل مرورگر/دستگاه، دسترس‌پذیری، E2E یا تأیید Production نیست.
- این الحاقیه صرفاً مستندسازی است؛ کد اجرایی، main، GitHub Pages Production، platoland.org، Supabase اصلی، Storage، DNS و Cloudflare تنظیم نشده‌اند. Deploy جدیدی در این نوبت اجرا یا ادعا نشده است.
- بخش A و B از نظر پذیرش مالک بسته‌اند؛ بخش C هنوز شروع نشده و باید جداگانه از سند UI/UX استخراج شود.