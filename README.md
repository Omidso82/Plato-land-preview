# PLATO LAND — Tournament Platform

وب‌سایت رسمی پلتفرم مسابقات PLATO LAND.

## دامنه و انتشار

- دامنه عمومی: https://platoland.org
- کد منبع: شاخه `main` همین مخزن.
- انتشار سایت از طریق GitHub Actions و GitHub Pages انجام می‌شود.
- فایل `CNAME` دامنه `platoland.org` را برای GitHub Pages مشخص می‌کند.
- هر push یا merge به `main` گردش انتشار را اجرا می‌کند؛ اجرای انتشار فقط از شاخه `main` مجاز است.
- پیش از انتشار، نصب وابستگی‌ها، TypeScript و Build باید موفق باشند.

## اتصال پایگاه داده

- این نسخه به تنها پروژه اصلی Supabase با شناسه `dfrppbapaaydbjeflozw` متصل است.
- هیچ دیتابیس جداگانه Preview/Test ایجاد یا استفاده نمی‌شود.
- تنظیم اتصال کلاینت در `src/supabase.ts` انجام شده است.
- کلید مورد استفاده در مرورگر از نوع publishable است. هرگز کلید `service_role` یا secret را در کد فرانت‌اند، GitHub یا فایل‌های عمومی قرار ندهید.
- داده‌های عملیاتی باید در Supabase ذخیره شوند؛ `localStorage` و `sessionStorage` برای داده‌های عملیاتی مجاز نیستند.
- مدارک ثبت‌نام در Storage خصوصی نگهداری می‌شوند و دسترسی باید از مسیر مجاز و signed URL باشد.

## قواعد انتشار و ایمنی

- تغییرات ابتدا در شاخه کاری و Pull Request بررسی می‌شوند.
- Build موفق به‌تنهایی تأیید QA یا انتشار نیست.
- انتشار فقط پس از بررسی کامل PR، آزمون‌های لازم و تأیید مالک انجام می‌شود.
- اطلاعات و داده‌های عملیاتی موجود نباید برای آزمایش حذف یا بازنویسی شوند.
- هیچ سرویس پولی یا دیتابیس دیگری بدون تأیید صریح اضافه نشود.
- تاریخ‌های سایت باید شمسی و ساعت‌ها بر مبنای `Asia/Tehran` باشند.
- سری اول تا زمان تأیید مالک نباید عمومی شود.
- قوانین نهایی ۱۷گانه سری دوم نباید با نسخه ۱۵‌قانونی یا خلاصه جایگزین شوند.

## اجرای محلی برای توسعه‌دهندگان

برای اجرای محلی، Node.js 20 یا بالاتر لازم است:

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

این دستورات فقط برای بررسی کد هستند و به‌تنهایی سایت زنده را منتشر نمی‌کنند.

## مستندات مرجع (وضعیت ثبت‌شده تا ۴ نوامبر ۲۰۲۶)

- `docs/PROJECT_STATUS_AND_DECISIONS_2026-11-03.md` — مرجع واحد وضعیت و تصمیم‌های جاری.
- `docs/IMPLEMENTATION_REGISTER_v1.4_2026-11-03.md` (الحاقیه جاری v1.10) — ثبت تغییرات و شواهد.
- `docs/TECHNICAL_HANDOVER_v3.2_2026-11-03.md` (الحاقیه جاری v3.9) — بسته انتقال فنی جاری.
- `docs/QA_MASTER_CHECKLIST_v1.8_2026-11-03.md` (الحاقیه جاری v1.13) — چک‌لیست QA جاری.
- `docs/SERIES2_REGISTRATION_LIVE_DATABASE_SNAPSHOT_2026-11-03.md` — آمار تازه دیتابیس ثبت‌نام.
- `docs/CLOUDFLARE_PAGES_PREVIEW_SETUP_STATUS_2026-11-03.md` — وضعیت آماده‌سازی Preview.
- `docs/PLATO_LAND_HANDOVER_PROTOCOL_v1.0_2026-11-02.md` — پروتکل انتقال.
- اسناد نسخه‌های قبلی تاریخچه‌اند و حذف یا جایگزین مخرب نشده‌اند.
- `supabase/migrations/README.md`


## Cloudflare Preview مستقل
- شاخه آزمایشی: `cloudflare-preview`؛ هرگز معادل شاخه انتشار تولید `main` نیست.
- برای Build ایزوله Preview در Cloudflare، متغیر `VITE_PLATO_PREVIEW=true` را در هر دو scope (Production و Preview) تنظیم کنید.
- Build command: `npm run build`؛ output directory: `dist`؛ root directory خالی.
- Preview فعلی فقط UI نمایشی و داده mock دارد و نباید برای ثبت‌نام یا عملیات واقعی استفاده شود.
- Workflow `.github/workflows/cloudflare-preview-check.yml` صرفاً CI است و deploy نمی‌کند.
- Deploy اولیهٔ Preview انجام و URL pages.dev در مرورگر موبایل مشاهده شده است؛ QA کامل همچنان باز است.


### آخرین نتیجه CI — ۳ نوامبر ۲۰۲۶
- اجرای موفق کنترل Preview: https://github.com/Omidso82/Plato-land-preview/actions/runs/41656110849.
- TypeScript، Build ایزوله و بررسی محدود artifact موفق شده‌اند.
- پروژه Cloudflare Preview اکنون Deploy شده است؛ مقدار VITE_PLATO_PREVIEW=true در فرم تنظیمات پیش از Deploy مشاهده شد.


## وضعیت یکپارچه‌سازی مستندات — ۳ نوامبر ۲۰۲۶
- مرجع اصلی مستندات و تصمیم‌ها: همین شاخه `main`.
- شاخه `cloudflare-preview` فقط محیط مستقل آزمایشی است؛ مستندات تکمیلی آن به main منتقل شده‌اند، اما کد اختصاصی Preview در این انتقال وارد main نشده است.
- Technical Handover: الحاقیه v3.5؛ Project History: الحاقیه v1.4؛ QA: v1.9؛ Implementation Register: v1.5.
- محیط نمایشی Cloudflare در `https://plato-land-preview.pages.dev` ساخته و مشاهده شده است؛ این محیط، سایت Production نیست.


## قانون نگهداری مرجع
- مستندات وضعیت، تصمیم‌ها، QA و تحویل فنی فقط در شاخه `main` مرجع هستند.
- شاخه `cloudflare-preview` برای اجرای محیط آزمایشی است و نباید به‌عنوان مرجع دوم مستندات استفاده شود.


## چرخه رسمی طراحی، آزمایش و انتشار — الحاقیه ۳ نوامبر ۲۰۲۶
سه محیط پروژه باید از هم تفکیک شوند:
1. **Preview:** نمونه فعلی Cloudflare برای تأیید ظاهر و رفتار بصری با داده mock؛ نه برنامه عملیاتی و نه محیط تست Auth/DB.
2. **Staging:** محیط آینده برای تست امکانات واقعی با Supabase مستقل و داده ساختگی؛ هنوز ایجاد نشده و ایجاد آن منوط به بررسی هزینه و تأیید مالک است.
3. **Production:** سایت platoland.org و Supabase اصلی؛ محیط آزمایش نیست.

اصل انتشار: هیچ قابلیت صرفاً به‌دلیل تأیید ظاهری در Preview وارد Production نمی‌شود. ابتدا باید در Staging با تست‌های نقش، دیتابیس، ثبت‌نام، ظرفیت، فایل، امنیت، Regression و موبایل/دسکتاپ بررسی شود. انتشار نیازمند CI موفق، backup، migration کنترل‌شده و تأیید صریح مالک است.

مرجع جزئیات: `docs/STAGING_AND_QUALITY_ASSURANCE_PLAN_v1.0_2026-11-03.md`.
**وضعیت مهم:** Staging هنوز ساخته نشده؛ هیچ دیتابیس آزمایشی یا مهاجرتی در این به‌روزرسانی ایجاد نشده است.


## یادداشت تاریخی پنل محتوای موقت — ۴ نوامبر ۲۰۲۶
- مرجع جامع و جاری توافق‌ها و تصمیم‌های مالک: `docs/PROJECT_DECISION_ADDENDUM_2026-11-04.md`.
- یادداشت فنی پنل اسلاید در Technical Handover، در نسخه اولیه با شماره v3.6 ثبت شده بود؛ این شماره با الحاقیه v3.6 مورخ ۳ نوامبر تداخل داشت و در بازبینی نهایی به‌عنوان یادداشت تکمیلیِ بدون شماره نسخه مشخص شده است.
- الحاقیه‌های جاری هنگام ثبت این PR: Technical Handover v3.9، QA Master Checklist v1.13 و Implementation Register v1.10.
- توافق مالک: پنل `/series2-slides-manager` و قابلیت آپلود آن پس از پایان سری دوم حفظ شود و در آینده برای صفحات/رویدادهای موقت دیگر قابل استفاده مجدد باشد. توسعه نسخه چندمنظوره هنوز انجام‌شده محسوب نمی‌شود.
- این اسناد در شاخه مستنداتی جدا آماده شده‌اند؛ تا Merge و تأیید مالک، main و Production تغییر نکرده‌اند.


## وضعیت طراحی Preview — وضعیت جاری تا ۴ نوامبر ۲۰۲۶
- بخش A: `OWNER ACCEPTED`؛ گزارش: `docs/UIUX_V10_7_SECTION_A_PREVIEW_OWNER_ACCEPTANCE_2026-11-04.md`.
- بخش B: `OWNER ACCEPTED`؛ گزارش: `docs/UIUX_V10_7_SECTION_B_PREVIEW_OWNER_ACCEPTANCE_2026-11-04.md`.
- تصمیم نهایی Header: خانه، مسابقات، اخبار و اطلاعیه‌ها، راهنما، ورود / ثبت‌نام.
- «درباره ما» فقط در Footer قرار می‌گیرد؛ صفحه مستقل دارد اما در Header نیست. «بازی‌ها» منوی مستقل نیست.
- وضعیت‌های قدیمیِ «B pending» در Snapshotهای قبلی تاریخی‌اند و با پذیرش مالک در ۴ نوامبر superseded شده‌اند.
- بخش C هنوز بررسی/تأیید نشده و باید پیش از پیاده‌سازی از سند UI/UX v10.7 استخراج و به مالک ارائه شود.
- پذیرش A/B فقط پذیرش مالک در Preview است؛ QA جامع، E2E، Staging، Auth/DB عملیاتی یا مجوز Production محسوب نمی‌شود.


## اصلاحیه مرجع جاری — ۴ نوامبر ۲۰۲۶
این README نقطه ورود اسناد است. وضعیت معتبر طراحی در حال حاضر A و B برابر `OWNER ACCEPTED` در Preview است؛ بخش C باز است. برای جزئیات و حدود پذیرش به دو گزارش مستقل A/B و الحاقیه‌های جاری Project Status، Implementation Register، Technical Handover و QA مراجعه شود. متن‌های قدیمی‌تر در همین README و Snapshotهای تاریخی، وضعیت زمان ثبت خود را توصیف می‌کنند و در صورت تعارض، این اصلاحیه جدیدتر مرجع است.


---

## وضعیت جاری مستندات — PLATO-DOC-SEAL، ۴ نوامبر ۲۰۲۶

این یادداشت، متن‌های تاریخی قدیمی‌تر README را درباره «عدم وجود Staging» یا «Preview صرفاً mock و بدون دیتابیس» به‌روزرسانی می‌کند:
- Staging Supabase مستقل `vgezfuztgzxbmvkmaoqn` بازسازی شده است.
- شاخه `cloudflare-preview` با commit `d4dde5f608a915505f82a3f1f3b2a8f875ba1aff` به Staging متصل و در Cloudflare با موفقیت Deploy شده است.
- URL اختصاصی Deploy: `https://b8205280.plato-land-preview.pages.dev`؛ alias مشاهده‌شده در موبایل: `https://plato-land-preview.pages.dev`.
- اسکرین‌شات مالک فقط بازشدن و رندر صفحه را تأیید می‌کند؛ browser-to-database request هنوز تست/تأیید نشده است.
- Staging برای QA کامل آماده نیست؛ پیش‌نیازهای Auth، synthetic users/roles، Edge Functions، security review و migration reconciliation باز هستند.
- `main` و Production همچنان به Supabase اصلی متصل‌اند و در این اقدام تغییر نکرده‌اند.
- مرجع تفصیلی: `docs/PLATO_DOC_SEAL_STAGING_PREVIEW_2026-11-04.md`.

متن‌های قدیمی پایین این README به‌عنوان Snapshot تاریخی حفظ شده‌اند و در صورت تعارض، این وضعیت جاری و سند PLATO DOC SEAL مرجع هستند.
