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


---

# الحاقیه v3.5 — یکپارچه‌سازی مستندات و استقرار Cloudflare Preview (۳ نوامبر ۲۰۲۶)

## مرجع واحد
- بررسی GitHub نشان داد cloudflare-preview نسبت به main نوزده کامیت جلوتر و صفر کامیت عقب‌تر است.
- تغییرات مستنداتی و README به‌صورت انتخابی در main یکپارچه شدند.
- کد PreviewApp، CSS و workflow اختصاصی Preview در این انتقال وارد main نشدند.
- main مرجع واحد مستندات و تصمیم‌های پروژه است؛ cloudflare-preview فقط شاخه محیط آزمایشی است.

## Cloudflare
- پروژه plato-land-preview به مخزن Omidso82/Plato-land-preview متصل شد.
- شاخه تنظیم‌شده در Cloudflare: cloudflare-preview.
- Build command: npm run build؛ output directory: dist.
- متغیر VITE_PLATO_PREVIEW=true در فرم تنظیمات مشاهده شد.
- Save and Deploy اجرا شد و https://plato-land-preview.pages.dev در مرورگر موبایل باز شد.
- این Deploy صرفاً محیط نمایشی است؛ Production اصلی همچنان GitHub Pages و دامنه https://platoland.org است.
- DNS و Custom Domain تغییر نکردند.
- QA کامل و تطبیق نهایی با سایت اصلی هنوز انجام نشده است.

## آخرین Snapshot ثبت‌نام
- Snapshot قبلی ۲۰ درخواست، تاریخچه یک Query قدیمی‌تر است.
- Query جدیدتر در ۳ نوامبر، ۲۵ درخواست و ۲۵ Plato ID یکتا نشان داد؛ فقط‌خواندنی.
- تعداد درخواست‌ها به‌تنهایی نشان‌دهنده تأیید مدیر یا فهرست نهایی نیست.

## نقطه ادامه
بازبینی اختلاف‌های Preview با Production را به‌عنوان کار QA/طراحی ادامه دهید؛ هیچ انتقال خودکار UI یا انتشار Production بدون مقایسه با سند UI/UX v10.7 و تأیید مالک انجام نشود.


---

# الحاقیه v3.6 — معماری چرخه توسعه امن و وضعیت فعلی (۳ نوامبر ۲۰۲۶)

## شاخه‌ها و محیط‌ها — بررسی مجدد GitHub
- `main` HEAD هنگام بررسی: `1ba638207299b6c12dbb8659846958427a5cdf28`.
- `cloudflare-preview` HEAD هنگام بررسی: `cbbe46bbbcb16ebbab1e9432a2a520da42426646`.
- Cloudflare Preview روی شاخه `cloudflare-preview` اجرا می‌شود و برنامه نمایشی `PreviewApp` را با داده mock ارائه می‌کند.
- دو اجرای CI اخیر Preview با شناسه‌های `41727267304` و `41727277808` موفق گزارش شده‌اند؛ این نتیجه، فقط Build ایزوله Preview را پوشش می‌دهد.
- Preview فعلی برای تست Auth، ثبت‌نام واقعی، پنل عملیاتی، دیتابیس یا Storage واقعی طراحی نشده است.
- Supabase Staging مستقل هنوز ایجاد/تأیید نشده است.
- Production همچنان `main`، GitHub Pages و Supabase اصلی `dfrppbapaaydbjeflozw` است.

## تصمیم Staging برای مرحله بعد
برنامه مصوب: پس از نهایی‌شدن طراحی، قابلیت‌های واقعی در Staging مستقل با Supabase جداگانه و داده‌های ساختگی تست شوند. این محیط باید Auth، Storage، Edge Functions، RLS و secrets مستقل داشته باشد. هیچ اتصال نوشتنی به Supabase اصلی مجاز نیست. ساخت منابع جدید منوط به بررسی هزینه و تأیید صریح مالک است.

## قاعده تفکیک تست‌ها
- Preview = Visual/UI review.
- Staging = Functional, integration, permission, security and regression tests.
- Production = Real users and real operational data; no destructive testing.

## وضعیت لوگو
طرح گزینه جداگانه «لوگوی سایت» برای مدیریت از پنل به‌عنوان نیاز طراحی ثبت شده است. نسخه بارگذاری واقعی هنوز تأیید/آزمایش نشده؛ اجرای واقعی آن باید در Staging و پس از بررسی Storage bucket و policies انجام شود. CI موفق Preview اثبات‌کننده این قابلیت نیست.

## گام بعد
ادامه بازبینی چک‌لیست UI/UX v10.7 از ابتدا، موردبه‌مورد. برای هر بخش تأییدشده، رفتار مورد انتظار و معیار پذیرش ثبت شود. پس از پایان طراحی، Staging طبق سند `docs/STAGING_AND_QUALITY_ASSURANCE_PLAN_v1.0_2026-11-03.md` آماده شود.


---

## یادداشت تکمیلی — پنل محتوای موقت و توافق ۴ نوامبر ۲۰۲۶

این یادداشت برای حفظ سابقه پنل اسلاید اضافه شده است و شماره نسخه مستقل ندارد؛ شماره‌گذاری رسمی الحاقیه‌های این سند از v3.6 مورخ ۳ نوامبر به v3.7 ادامه پیدا می‌کند.
### پنل اسلایدها
- Route ثبت‌شده: `/series2-slides-manager`.
- Storage bucket ثبت‌شده: `series2-slides`.
- ساختار فعلی گزارش‌شده: ۱۸ slot مستقل؛ کلیدهای canonical از `slides/01` تا `slides/18`.
- پنل فقط برای Owner است و نباید در navigation عمومی، Header، Footer یا صفحه ثبت‌نام لینک شود.
- جایگزینی تصویر باید به slot مشخص محدود باشد؛ ترتیب انتخاب دسته‌جمعی فایل‌ها نباید تعیین‌کننده ترتیب نمایش باشد.
- Bucket مدارک خصوصی ثبت‌نام `registration-evidence` جداست و باید private باقی بماند.

### توافق تازه مالک
- پنل پس از پایان رویداد سری دوم حفظ شود و به‌عنوان قابلیت قابل بازیابی برای صفحات/رویدادهای موقت آینده در نظر گرفته شود.
- نیاز محصول برای آینده: پنل مدیریت محتوای موقت چندمنظوره. این یک نیازمندی تأییدشده است، نه ادعای پیاده‌سازی فعلی.
- قبل از توسعه عمومی، معماری چندمحتوایی، مدل مجوز، mapping رویداد/صفحه به slotها، Storage pathها، نگهداری/آرشیو و جلوگیری از دسترسی بین رویدادها طراحی و در Staging آزمون شود.

### کنترل دسترسی و وضعیت اثبات
- پنهان‌کردن لینک از UI کافی نیست؛ route و عملیات Storage باید با Auth/role و policy سمت سرور محدود شوند.
- مسیر زنده و موفقیت upload/replace در دامنه در این Snapshot تأیید نشده است.
- آزمون‌های الزامی: Owner و کاربر عادی، دسترسی مستقیم به URL، آپلود، جایگزینی تک‌اسلاید، حفظ ۱۷ slot دیگر، refresh، خطای شبکه و بررسی Storage object/path.
- این الحاقیه به‌تنهایی هیچ تغییر کد، DB، bucket، policy یا deploy را انجام نمی‌دهد.

### چرخه عمر صفحه موقت
هر صفحه موقت باید هدف، مالک، مسیر، تاریخ/شرط پایان، منابع داده، نقش‌ها و روش بازگردانی سایت اصلی را داشته باشد. پایان صفحه عمومی مجوز حذف پنل یا داده‌های پشت‌صحنه نیست.


---

## الحاقیه v3.7 — نقطه تحویل پس از پذیرش بخش A در Preview (۴ نوامبر ۲۰۲۶)

### وضعیت پذیرفته‌شده
- بخش A از چک‌لیست طراحی، پس از مشاهده Preview، صریحاً توسط مالک تأیید شد: `OWNER ACCEPTED`.
- Preview URL: `https://plato-land-preview.pages.dev`.
- Preview branch: `cloudflare-preview`.
- HEAD تأییدشده با Git compare: `dee0b08b8b4f0cac429ea286aa9095d97f7f9742`.
- Commitهای بخش A: `9e6bfe2802dfb9ad75597ff166d3a6b4083bc8ee` و `dee0b08b8b4f0cac429ea286aa9095d97f7f9742`.

### محدوده تأیید و محدودیت‌ها
- تأیید فقط برای طراحی بخش A در Preview است؛ نه برای Production، عملکرد دیتابیس، Auth، پنل‌ها، Staging یا QA جامع.
- هیچ merge یا deploy به Production، تغییر main، Supabase، Storage یا DNS انجام نشده است.
- پذیرش مالک ثبت شده؛ آزمون رسمی ماتریسی دستگاه/مرورگر و E2E همچنان فقط در صورت انجام مستقل قابل PASS شدن است.

### ادامه کار
- بخش B (منوی اصلی) هنوز باز است.
- گزینه‌های پایه: صفحه اصلی، مسابقات، اخبار و اطلاعیه‌ها، راهنما.
- تصمیم افزودن «درباره ما» به Header نامشخص و منتظر پاسخ مالک است؛ تا آن زمان کدنویسی منو متوقف بماند.
- پس از پاسخ، متن/معیارهای بخش B از سند UI/UX استخراج و برای تأیید ارائه شود؛ سپس پیاده‌سازی فقط روی Preview.


---

## الحاقیه v3.8 — پذیرش مالک بخش B در Preview (۴ نوامبر ۲۰۲۶)

### وضعیت طراحی و تصمیم‌های قطعی
- بخش A: OWNER ACCEPTED.
- بخش B: OWNER ACCEPTED پس از بررسی مالک در Preview و اعلام صریح نبود ایراد.
- Header: «خانه»، «مسابقات»، «اخبار و اطلاعیه‌ها»، «راهنما»، «ورود / ثبت‌نام».
- «درباره ما» فقط در Footer؛ «بازی‌ها» منوی مستقل نیست؛ برچسب «راهنما» در Header/Footer یکسان است.
- منوی موبایل مستقیم و بدون Hamburger؛ اسکرول افقی در صورت کمبود عرض؛ کل هدر sticky؛ منو ساده و متنی، بدون قاب.
- صفحه اصلی در این مرحله Hero/هویت برند؛ صفحات مستقل عمومی و مقصد نمایشی ورود/ثبت‌نام در Preview.

### شواهد
- PRهای بخش B: #42، #43، #45 و #46؛ PR #44 بسته شد و مسیر نهایی نیست.
- commit اصلاح برچسب راهنما: 71dc5d55ac3099e8b9e67d36fb9bcfaeca83d2ad؛ diff از GitHub بازیابی شد و تغییر «آموزش» به «راهنما» در src/PreviewApp.tsx را نشان داد.
- URL بررسی مالک: https://plato-land-preview.pages.dev.

### حدود پذیرش
- این پذیرش تأیید مالک برای موارد مشاهده‌شده در Preview است؛ نه QA ماتریسی مستقل، E2E، تست امنیتی/دسترس‌پذیری یا تأیید Production.
- هیچ تغییری در main، GitHub Pages، platoland.org، Supabase اصلی، Storage، DNS یا تنظیمات Production در این اقدام انجام نشده است.
- هیچ Deploy جدیدی در این نوبت انجام یا تأیید نشده؛ این اقدام ثبت مستند پذیرش مالک است.

### نقطه ادامه
بخش C سند UI/UX v10.7 جداگانه استخراج و برای بررسی/تأیید ارائه شود. بخش A و B بدون دستور صریح مالک تغییر نکنند.

---

## الحاقیه v3.9 — وضعیت جاری پس از پذیرش مالک بخش B در Preview (۴ نوامبر ۲۰۲۶)

### وضعیت معتبر طراحی
- بخش A: `OWNER ACCEPTED`.
- بخش B: `OWNER ACCEPTED` پس از بررسی سایت توسط مالک و اعلام نبود ایراد.
- Header نهایی: خانه، مسابقات، اخبار و اطلاعیه‌ها، راهنما، ورود / ثبت‌نام.
- «درباره ما» فقط در Footer قرار می‌گیرد؛ «بازی‌ها» منوی مستقل نیست.
- الحاقیه v3.7 و هر متن قبلی که B را باز یا منتظر تصمیم معرفی می‌کند، Snapshot تاریخی قبل از پذیرش مالک است؛ v3.8 و این v3.9 وضعیت جاری را تعیین می‌کنند.
- بخش C هنوز بررسی/تأیید نشده و باید پیش از پیاده‌سازی از UI/UX v10.7 استخراج و به مالک ارائه شود.

### آزمون و محدودیت
پذیرش A/B فقط پذیرش مالک در Preview است. QA ماتریسی، E2E، دسترس‌پذیری، Auth/DB عملیاتی، Staging و Production approval همچنان مستقل و باز هستند تا با شواهد واقعی انجام شوند. این الحاقیه مستنداتی است و هیچ تغییر اجرایی/انتشاری انجام نمی‌دهد.


---

## الحاقیه فنی v4.0 — تنظیمات امنیت حساب در Preview (۵ نوامبر ۲۰۲۶)

### مرجع تغییر
- PR #53: https://github.com/Omidso82/Plato-land-preview/pull/53
- Merge commit: `622a404ba83645438dd8958d6c4d866e57102e64`
- Source branch: `feat/account-security-settings`; target: `cloudflare-preview`.
- Cloudflare Pages project: `plato-land-preview`; deployment commit: `622a404ba83645438dd8958d6c4d866e57102e64`; URL: https://94deeab5.plato-land-preview.pages.dev/ .

### رفتارهای اضافه‌شده
1. تغییر رمز: بررسی رمز فعلی از طریق Auth پیش از update؛ حداقل طول رمز جدید در رابط ۸ نویسه.
2. بازیابی رمز: درخواست reset email برای ایمیل حساب؛ redirect به `/account/settings?mode=recovery` روی origin جاری.
3. تکمیل بازیابی: فرم تعیین رمز جدید پس از بازگشت از لینک.
4. خروج سراسری: `signOut({scope:'global'})` با تأیید؛ پس از موفقیت انتقال به صفحه ورود.
5. خروج عادی: `signOut({scope:'local'})` برای نشست مرورگر فعلی.
6. هشدار ورود جدید به‌عنوان پیکربندی‌نشده نمایش داده می‌شود؛ این PR آن را فعال نمی‌کند.

### وابستگی‌ها و ریسک‌های باز
- URL بازیابی باید در Supabase Auth URL Configuration پروژه Staging مجاز باشد؛ هنوز تأیید نشده است.
- مرورگر در بررسی خودکار به Cloudflare Access gate رسید؛ تست عملی فرم‌ها و callback انجام نشد.
- انقضای access token ممکن است به این معنی باشد که خروج سراسری فوراً همه access tokenهای صادرشده را بی‌اعتبار نکند؛ متن UI این محدودیت را توضیح می‌دهد.
- فهرست نشست‌ها/دستگاه‌ها و هشدار ورود جدید در این PR پیاده‌سازی نشده‌اند.

### حفاظت محیط
این PR فقط شاخه Preview را تغییر داده است. بدون migration، SQL، schema، secrets جدید، تغییر main، Production، دامنه اصلی، Supabase Production، Storage یا DNS.
