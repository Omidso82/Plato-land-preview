# PLATO LAND — Technical Handover v3.2
تاریخ: ۳ نوامبر ۲۰۲۶  
مخزن: `Omidso82/Plato-land-preview` / `main`  
دامنه: `https://platoland.org`  
Supabase اصلی: `dfrppbapaaydbjeflozw`

## وضعیت معماری
React + TypeScript + Vite؛ Supabase PostgreSQL/Auth/Storage/Edge Functions؛ GitHub Pages برای Production. شاخه main منبع انتشار فعلی است. Workflow با نام `deploy-preview.yml` در واقع Production را منتشر می‌کند و نباید Preview مستقل فرض شود.

## ثبت‌نام سری دوم — داده تازه
Query مستقیم و فقط‌خواندنی در ۳ نوامبر ۲۰۲۶:
- ۲۰ درخواست؛ ۲۰ Plato ID یکتا؛ ۲۰ پذیرش قوانین.
- بازه زمانی UTC: ۲ نوامبر ۲۲:۰۶:۳۵ تا ۳ نوامبر ۱۱:۲۵:۳۴.
- آخرین زمان دانمارک: ۳ نوامبر ۱۲:۲۵:۳۴ CET.
- هیچ داده‌ای تغییر نکرد.
- جدول درخواست‌ها وضعیت تأیید نهایی مدیر را نشان نمی‌دهد.
جزئیات: `docs/SERIES2_REGISTRATION_LIVE_DATABASE_SNAPSHOT_2026-11-03.md`.

## اسلایدها و امنیت
گزارش ۲ نوامبر وجود ۱۸ کلید `slides/01` تا `slides/18` را در Bucket `series2-slides` تأیید کرده است؛ تطبیق بصری و آزمون جایگزینی هنوز باز است. مدارک ثبت‌نام باید در Bucket خصوصی مستقل باقی بمانند. هیچ secret یا service_role نباید به مرورگر یا مخزن عمومی راه یابد.

## Cloudflare Preview
در ۳ نوامبر فقط تصویر صفحه راهنمای developers.cloudflare.com دریافت شد. ورود به داشبورد، ساخت پروژه، اتصال GitHub، Deploy یا تغییر DNS تأیید نشده است. اقدام بعدی: مالک روی Go to Workers & Pages بزند و تصویر داشبورد واقعی را بفرستد. قبل از اتصال GitHub، شرایط رایگان/هزینه و محدودیت‌ها بررسی شود. Preview مستقل باید روی شاخه جدا و URL pages.dev باشد، بدون دسترسی خصوصی/نوشتنی به Supabase اصلی.

## محدودیت‌ها و ممنوعیت‌ها
- Production، DNS، GitHub Pages و Supabase بدون مجوز/برنامه جداگانه تغییر نکنند.
- دیتابیس Preview/Test ساخته نشود.
- از داده عملیاتی برای آزمون مخرب استفاده نشود.
- Migrationهای مفقود را حدس نزنید یا replay نکنید.
- موفقیت Build یا Deploy را معادل مشاهده زنده و QA ندانید.
- قوانین سری دوم نسخه نهایی ۱۷گانه است.
- تاریخ‌های UI شمسی؛ رابط RTL و موبایل‌محور؛ طراحی تیره/طلایی حفظ شود.

## موارد باز
1. مشاهده داشبورد واقعی Cloudflare و بررسی پلن.
2. راه‌اندازی Preview مستقل، جدا از main/Production.
3. آزمون واقعی سایت در مرورگر و موبایل.
4. تأیید نقش‌ها و گردش ثبت‌نام/تأیید مدیر.
5. تطبیق بصری ۱۸ اسلاید.
6. بررسی و ثبت SQL دقیق دو migration مفقود، بدون اجرای مجدد.
7. بازبینی یافته‌های امنیتی قبلی با شواهد تازه و بدون تغییر فوری policyها.

## نقطه ادامه
در انتظار اسکرین‌شات صفحه Workers & Pages. تا آن زمان هیچ زیرساخت، DNS، مخزن یا دیتابیسی تغییر نکند.


---

# الحاقیه v3.3 — Cloudflare Preview مستقل

- نقطه ورود اکنون از `VITE_PLATO_PREVIEW` استفاده می‌کند. مقدار دقیق رشته‌ای `true`، برنامه Preview مستقل را انتخاب می‌کند.
- PreviewApp فقط داده نمایشی ثابت دارد؛ فرم/عملیات ثبت‌نام، ورود، Auth، Supabase، Owner و Admin ندارد.
- importهای برنامه عملیاتی به dynamic import منتقل شدند تا در build Preview فراخوانی/بارگذاری نشوند.
- Workflow شاخه `cloudflare-preview` با `npm ci`، typecheck، build و کنترل bundle اضافه شد؛ این workflow صرفاً CI است، نه Deploy.
- Cloudflare Pages باید Build command=`npm run build`، output=`dist` و `VITE_PLATO_PREVIEW=true` را در scopeهای Production و Preview داشته باشد.
- شاخه `main` و تنظیمات Production تغییر نکرده‌اند.
- آخرین وضعیت CI/Cloudflare باید پس از اجرای Workflow و دریافت تصویر داشبورد بررسی شود؛ هنوز Deploy یا آزمون زنده تأیید نشده است.


---

# الحاقیه v3.4 — نتیجه CI و وضعیت دقیق تحویل (۳ نوامبر ۲۰۲۶)
- اجرای نهایی Workflow: https://github.com/Omidso82/Plato-land-preview/actions/runs/41656110849 ، commit ad75eb736ad581873fd56abf4a581d6eef27be79، نتیجه Success.
- نصب وابستگی‌ها، TypeScript verification، Build ایزوله و Verify artifact همگی موفق شدند.
- به‌علت نبود lockfile، Workflow نهایی npm install دارد؛ تلاش اولیه با cache/npm ci ناموفق بود و اصلاح شد.
- آزمون artifact فقط کنترل‌های صریح workflow را پوشش می‌دهد؛ ممیزی جامع امنیتی نیست.
- Cloudflare Pages project، متغیر VITE_PLATO_PREVIEW=true در هر دو scope، Deploy، URL زنده و QA مرورگر هنوز تأیید نشده‌اند.
- اقدام بعدی: بررسی تنظیمات Cloudflare توسط کاربر؛ قبل از Save and Deploy باید env دقیقاً تنظیم شود. هیچ تغییر DNS یا Custom Domain انجام نشود.
