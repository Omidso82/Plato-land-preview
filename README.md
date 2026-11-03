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

## مستندات مرجع (به‌روز تا ۳ نوامبر ۲۰۲۶)

- `docs/PROJECT_STATUS_AND_DECISIONS_2026-11-03.md` — مرجع وضعیت و تصمیم‌های جاری.
- `docs/IMPLEMENTATION_REGISTER_v1.4_2026-11-03.md` — ثبت تغییرات و شواهد.
- `docs/TECHNICAL_HANDOVER_v3.2_2026-11-03.md (الحاقیه جاری v3.5)` — بسته انتقال فنی جاری.
- `docs/QA_MASTER_CHECKLIST_v1.8_2026-11-03.md (الحاقیه جاری v1.9)` — چک‌لیست QA جاری.
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
- تا زمان تأیید Build، تنظیم env، و مشاهده امن URL pages.dev هیچ Deploy یا QA زنده‌ای ادعا نشود.


### آخرین نتیجه CI — ۳ نوامبر ۲۰۲۶
- اجرای موفق کنترل Preview: https://github.com/Omidso82/Plato-land-preview/actions/runs/41656110849.
- TypeScript، Build ایزوله و بررسی محدود artifact موفق شده‌اند.
- Cloudflare هنوز Deploy نشده است؛ پیش از Deploy مقدار VITE_PLATO_PREVIEW=true باید در هر دو scope محیطی تنظیم شود.


## وضعیت یکپارچه‌سازی مستندات — ۳ نوامبر ۲۰۲۶
- مرجع اصلی مستندات و تصمیم‌ها: همین شاخه `main`.
- شاخه `cloudflare-preview` فقط محیط مستقل آزمایشی است؛ مستندات تکمیلی آن به main منتقل شده‌اند، اما کد اختصاصی Preview در این انتقال وارد main نشده است.
- Technical Handover: الحاقیه v3.5؛ Project History: الحاقیه v1.4؛ QA: v1.9؛ Implementation Register: v1.5.
- محیط نمایشی Cloudflare در `https://plato-land-preview.pages.dev` ساخته و مشاهده شده است؛ این محیط، سایت Production نیست.
