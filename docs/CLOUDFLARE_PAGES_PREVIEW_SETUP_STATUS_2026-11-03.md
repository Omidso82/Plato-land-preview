# Cloudflare Pages — وضعیت آماده‌سازی Preview
تاریخ: ۳ نوامبر ۲۰۲۶

## هدف
ایجاد محیط مستقل برای ادامه طراحی و QA سایت PLATO LAND، بدون اثرگذاری روی GitHub Pages تولید و دامنه `platoland.org`.

## تصمیم‌های ایمنی
- GitHub Pages و دامنه Production بدون تغییر باقی بمانند.
- ابتدا از URL پیش‌فرض `*.pages.dev` استفاده شود؛ DNS و custom domain در مرحله اول تغییر نکند.
- شاخه کاری Preview از `main` جدا باشد و هرگز با انتشار Production اشتباه گرفته نشود.
- Preview از Fixture/mock data یا داده عمومی فقط‌خواندنی استفاده کند.
- دسترسی Owner، اطلاعات خصوصی ثبت‌نام، مدارک و قابلیت نوشتن روی Supabase اصلی در Preview فعال نشود.
- هیچ پلن پولی یا هزینه‌ای بدون تأیید صریح مالک فعال نشود.

## وضعیت واقعی تا زمان ثبت
- مالک تصویر صفحه مستندات `developers.cloudflare.com` را فرستاده است.
- تصویر راهنمای Pages را نشان می‌دهد و دکمه **Go to Workers & Pages** دارد.
- تصویر، داشبورد حساب، مجوز GitHub integration، ساخت پروژه یا Deploy را اثبات نمی‌کند.
- هیچ پروژه Cloudflare Pages ساخته نشده و هیچ اتصال GitHub/DNS انجام نشده است.
- اتصال مستقیم/ابزار مدیریت Cloudflare در محیط فعلی در دسترس نیست؛ ادامه کار بر اساس تصویرهای صفحه‌به‌صفحه انجام می‌شود.

## اقدام بعدی مالک
روی **Go to Workers & Pages** کلیک کند و تصویر صفحه مقصد را ارسال کند. از ارسال رمز عبور، API token، recovery code یا کلیدهای حساب خودداری شود.

## گام‌های بعدی پس از مشاهده داشبورد
1. تأیید اینکه حساب و بخش Workers & Pages واقعاً باز است.
2. بررسی گزینه Create application / Pages و انتخاب Git integration.
3. قبل از اتصال GitHub، پلن، محدودیت Build و هزینه احتمالی از مستند رسمی روز بررسی شود.
4. پس از تأیید، اتصال فقط به شاخه Preview؛ نه تنظیمات Production.
5. تعیین Build command/output directory از روی package و workflow واقعی مخزن.
6. حذف/جلوگیری از هر Secret مربوط به دیتابیس اصلی؛ استفاده از داده mock/read-only.
7. Deploy آزمایشی و آزمون URL pages.dev، بدون custom domain.
8. ثبت شواهد Build/Deploy و آزمون موبایل؛ سپس تصمیم جداگانه درباره DNS یا ارتقا.

## نکته معماری
ساخت مسیر `/preview` در همان artifact سایت GitHub Pages، محیط Preview مستقل نیست: کد آزمایشی همراه Production منتشر می‌شود و مبدأ/تنظیمات اجرایی مشترک می‌ماند. برای توسعه مستقل، پروژه Pages جداگانه و شاخه جدا لازم است.

**وضعیت:** WAITING_FOR_DASHBOARD_SCREENSHOT — هیچ تغییر زیرساختی انجام نشده است.


## الحاقیه ۳ نوامبر ۲۰۲۶ — جداسازی ایمن کد Preview
- شاخه هدف: `cloudflare-preview`؛ هیچ commit این مرحله به `main` ارسال نشده است.
- `src/PreviewApp.tsx` و `src/preview.css` اضافه شدند: صفحه نمایشی مستقل RTL، موبایل‌پذیر و هم‌راستا با ساختار تأییدشده صفحه اصلی؛ داده‌ها mock و ثابت‌اند.
- `src/index.tsx` بازنویسی شد تا در صورت `VITE_PLATO_PREVIEW=true` فقط PreviewApp را import کند. ماژول‌های عملیاتی و Supabase فقط در شاخه اجرای غیر Preview به‌صورت dynamic import بارگذاری می‌شوند.
- Workflow بررسی `.github/workflows/cloudflare-preview-check.yml` اضافه شد: `npm ci`، `npm run typecheck`، `npm run build` با env Preview و بررسی نبود شناسه پروژه Supabase/مسیر ثبت‌نام/پنل مدیریت در bundle. این Workflow deploy نمی‌کند.

### مقادیر لازم در فرم Cloudflare
- Branch: `cloudflare-preview`
- Framework: React (Vite) یا `None`
- Build command: `npm run build`
- Output directory: `dist`
- Root directory: خالی
- Environment variable در هر دو scope یعنی Production و Preview: `VITE_PLATO_PREVIEW=true`
- فعلاً فقط `*.pages.dev`؛ هیچ DNS یا Custom Domain تغییر نکند.

### شواهد و وضعیت
- کد و Workflow commit شده‌اند؛ شناسه آخرین commit در این مرحله پس از اجرای workflow ثبت می‌شود.
- هنوز اجرای موفق Workflow، تنظیم Environment Variable در داشبورد، ساخت Pages project، Deploy و آزمون زنده تأیید نشده‌اند.
- تا زمان تأیید env و Build موفق، دکمه Save and Deploy را نزنید.


## اصلاحیه نتیجه Build/CI — ۳ نوامبر ۲۰۲۶
- اجرای موفق نهایی: https://github.com/Omidso82/Plato-land-preview/actions/runs/41656110849 ، commit ad75eb736ad581873fd56abf4a581d6eef27be79.
- نتیجه تمام مراحل: Setup Node موفق، Install dependencies موفق، TypeScript verification موفق، Build ایزوله موفق، Verify Preview artifact موفق.
- Workflow نهایی به‌جای npm ci از npm install استفاده می‌کند، چون مخزن فایل lock قابل استفاده برای cache/npm ci ندارد. تلاش‌های اولیه شکست خوردند و پس از اصلاح، اجرای نهایی موفق شد.
- آزمون artifact وجود dist/index.html و نبود چند رشته شناخته‌شده مربوط به Supabase/ثبت‌نام/پنل را تأیید کرده است؛ این کنترل محدود است و ادعای ممیزی کامل امنیتی نیست.
- وضعیت جدید: کد و CI آماده Build هستند؛ هنوز Cloudflare Environment Variables، ساخت Pages project، اتصال GitHub، Deploy و تست زنده انجام/تأیید نشده‌اند.
- اقدام بعدی: در داشبورد Cloudflare، پیش از Save and Deploy، مقدار VITE_PLATO_PREVIEW=true را در هر دو scope Production و Preview تنظیم و تصویر تنظیمات را برای بازبینی ارائه کنید.
