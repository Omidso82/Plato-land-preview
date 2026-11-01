# پلتفرم تورنمنت PLATO LAND
## سند جامع سوابق پروژه، تصمیم‌های تأییدشده، ساختار فنی و گزارش تغییرات

**نسخه سند:** ۱.۱  
**تاریخ آخرین به‌روزرسانی:** ۱ نوامبر ۲۰۲۶  
**وضعیت:** ساختار جدید پنل مدیریت توسط مالک بررسی و صریحاً تأیید شده است.  
**مخزن اصلی کد:** `Omidso82/Plato-land-preview` — شاخه `main`  
**آخرین Commit کدِ تأییدشده:** `36a8bbc3e78a69c97ff54cef36c05b5c128eff45`  
**دامنه سایت:** `https://platoland.org`  
**شناسه پروژه Supabase مورد استفاده در بررسی‌های فنی:** `dfrppbapaaydbjeflozw`

> این سند وضعیت و تصمیم‌هایی را ثبت می‌کند که تا تاریخ بالا در سوابق پروژه قابل تأیید بوده‌اند. بین «تغییر انجام‌شده»، «آزمایش واقعاً اجراشده» و «موردی که هنوز نیازمند بررسی است» تفاوت گذاشته شده است. موفقیت Build به‌تنهایی به معنی آزمایش کامل تمام سناریوهای عملیاتی نیست.

---

## ۱. هدف پروژه و اصول حاکم

PLATO LAND یک پلتفرم چندبازی برای مدیریت مسابقات کاربران Plato است. سایت محدود به تخته‌نرد نیست و باید بتواند مسابقات بازی‌های مختلف را با قوانین، ظرفیت، شیوه ثبت‌نام و ساختار مستقل مدیریت کند.

### هویت بصری و محصولی تأییدشده
- نام و عنوان برند: **PLATO LAND**
- شعار منتخب: **«بازی، رقابت، قهرمانی»**
- سبک طراحی: حرفه‌ای و لوکس، پس‌زمینه تیره، ترکیب مشکی و طلایی، المان تاج و تایپوگرافی خوانا.
- زبان رابط: فارسی ایران و راست‌چین (RTL).
- هدف محصول: پشتیبانی از چند بازی و چند تورنمنت مستقل در یک پلتفرم واحد.

### اصول قطعی مدیریت پروژه
۱. هر سری و هر تورنمنت مستقل است. اطلاعات سری اول و سری دوم، از جمله قوانین، بازیکنان، شناسه‌ها، گروه‌ها، قرعه‌کشی، برنامه و نتایج نباید با یکدیگر مخلوط شوند.  
۲. اطلاعات نامشخص یا تأییدنشده باید با عبارت **«در انتظار تأیید»** مشخص شود. نام، Plato ID، نتیجه، رتبه، قانون و تاریخ نباید حدس زده شود.  
۳. اطلاعات و ساختار فعلی دیتابیس باید حفظ شود. تغییر یک قابلیت نباید باعث پاک شدن یا بازنویسی ناخواسته داده‌های بخش‌های دیگر شود.  
۴. سری اول تا زمانی که مالک اطلاعات کامل آن را ارائه و تأیید نکرده، نباید عمومی یا منتشر شود.  
۵. پیش‌نمایش، داده محلی مرورگر یا Build موفق، به‌تنهایی اثبات نمی‌کند که یک فرآیند در محیط واقعی و از ابتدا تا انتها درست کار می‌کند.  
۶. از هزینه‌های غیرضروری، خرید توکن یا انتشار زودهنگام پرهیز شود. مالک نباید مجبور به برنامه‌نویسی یا اجرای دستی دستورهای فنی پیچیده شود.

---

## ۲. مرزبندی سری‌ها و محتوای مسابقات

### سری اول
- سری اول عمداً از فهرست عمومی مسابقات پنهان نگه داشته شده است.
- رکوردی که در بررسی دیتابیس شناسایی شد:
  - شناسه: `98a54687-bbb7-4b45-8a51-273ce0143159`
  - عنوان: «لیگ جدید»
  - نام سری: «سری اول»
- وضعیت این رکورد به `status='draft'` و `registration_open=false` تغییر داده شد.
- این تغییر صرفاً برای جلوگیری از نمایش عمومی و ثبت‌نام ناخواسته بود؛ به معنی تأیید محتوای عمومی سری اول نیست.
- تا زمان دریافت و تأیید اطلاعات کامل توسط مالک، همین وضعیت پیش‌نویس و بسته حفظ شود.

### سری دوم — مسابقات تخته‌نرد
- سری دوم پروژه‌ای مستقل است و نباید اطلاعات ثبت‌نام، شناسه‌ها، گروه‌ها، نتایج یا برنامه سری اول را به ارث ببرد.
- نسخه نهایی قوانین سری دوم دقیقاً **۱۷ بند** دارد، نه ۱۵ بند.
- نسخه قدیمی ۱۵‌بندی یا خلاصه قوانین، نسخه نهایی محسوب نمی‌شود.
- متن کامل و دقیق ۱۷ قانون باید از مرجع رسمی و تأییدشده پروژه دریافت شود. بازسازی آن از حافظه یا جایگزینی با خلاصه مجاز نیست.
- در تغییرات فنی ثبت‌شده در این سند، متن ساختگی یا حدسی برای قوانین سری دوم در دیتابیس درج نشده است.

---

## ۳. مدل تنظیمات مستقل هر تورنمنت

فرم ساخت تورنمنت برای تنظیم جداگانه هر مسابقه طراحی شده است.

### نوع مشارکت
- انفرادی
- تیمی
- انفرادی یا تیمی، در صورتی که برای همان تورنمنت فعال شده باشد.
- ثبت‌نام تیمی فعلی از نوع «تیم آماده» است: سرگروه نام تیم و اطلاعات اعضای موردنیاز را ثبت می‌کند.
- روش جایگزینِ ثبت‌نام انفرادی و تیم‌بندی بعدی توسط مدیر، فعلاً غیرفعال است. فرم نباید درخواست ناقص این روش را بپذیرد.

### ظرفیت
- ظرفیت برای هر تورنمنت جداگانه تعیین می‌شود و یک سقف سراسری برای کل سایت نیست.
- ظرفیت می‌تواند یک عدد مثبت یا خالی (نامحدود) باشد.
- واحد ظرفیت قابل انتخاب است: **بازیکن** یا **تیم**.
- اگر واحد ظرفیت «تیم» باشد، هر تیم کامل یک جایگاه مصرف می‌کند؛ اعضای تیم به‌عنوان اعضای همان تیم ذخیره می‌شوند و چند تیم جداگانه محسوب نمی‌شوند.
- مقدار `slot_count=1` برای ثبت‌نام تیمی استفاده می‌شود تا یک تیم یک جایگاه تیمی اشغال کند.

### صف ذخیره (رزرو)
- فعال یا غیرفعال بودن صف ذخیره برای هر تورنمنت مستقل تنظیم می‌شود.
- وقتی ظرفیت اصلی تکمیل شده و صف ذخیره فعال باشد، درخواست‌های واجد شرایط بعدی می‌توانند در صف ذخیره قرار گیرند.
- مهلت پایان ثبت‌نام ذخیره با تنظیم `platform_settings.reserve_close_days_before` تعیین می‌شود؛ در صورت نبود تنظیم، مقدار پیش‌فرض یک روز قبل از شروع است.
- مقدار صفر یعنی بسته‌شدن مهلت در زمان شروع مسابقه؛ مقدار یک یعنی یک روز پیش از شروع؛ مقادیر بزرگ‌تر یعنی همان تعداد روز قبل از شروع.
- موقعیت صف ذخیره در دیتابیس ثبت و در داشبورد مدیر نمایش داده می‌شود.
- طبق منطق تابع دیتابیس، رد کردن یک ثبت‌نام اصلیِ در انتظار بررسی باعث ارتقای نفر بعدی صف ذخیره می‌شود. رد کردن یک درخواست ذخیره به‌تنهایی ارتقای دیگری ایجاد نمی‌کند.
- درخواست ذخیره، جایگاه تأییدشده در ظرفیت اصلی محسوب نمی‌شود.

### ساختار مراحل و نمایش عمومی
فرم تورنمنت تنظیمات زیر را در اختیار مالک قرار می‌دهد:
- مرحله گروهی و سپس حذفی
- فقط گروهی
- فقط حذفی
- تعداد صعودکنندگان از هر گروه، در صورت ارتباط با فرمت
- معیار و ترتیب سیدبندی و معیارهای رفع تساوی
- نمایش عمومی سیدبندی و سبدها
- نمایش قرعه‌کشی و گروه‌بندی
- نمایش جدول و نتایج گروهی
- نمایش نمودار مرحله حذفی
- وضعیت، انتشار، تاریخ شروع، توضیحات، قوانین و جوایز

وجود تنظیمات در فرم به‌تنهایی به معنی تکمیل موتور اجرایی قرعه‌کشی، جدول نتایج یا نمودار حذفی نیست؛ داده‌های واقعی و آزمون‌های عملیاتی مربوط به خود را لازم دارند.

---

## ۴. فرآیند ثبت‌نام و نگهداری مدارک

### مسیر بازیکن
۱. بازیکن با Supabase Auth حساب می‌سازد یا وارد حساب خود می‌شود.  
۲. تورنمنت منتشرشده‌ای را باز می‌کند که ثبت‌نام آن باز است.  
۳. قوانین همان تورنمنت را می‌خواند و باید پذیرش آن‌ها را پیش از ارسال درخواست ثبت کند.  
۴. نام نمایشی و Plato ID دریافت می‌شود.  
۵. بارگذاری تصویر کامل پروفایل Plato الزامی است. تصویر برای بررسی اطلاعات پروفایل، از جمله تعداد بردها و سطح بازیکن، استفاده می‌شود.  
۶. در مسابقه تیمی، در صورت انتخاب حالت تیم آماده، نام تیم و اطلاعات اعضای لازم نیز دریافت می‌شود.  
۷. درخواست از طریق تابع امن دیتابیس ارسال و با وضعیت بررسی ذخیره می‌شود.

### الزامات و حریم خصوصی مدرک
- تصویر مدرک در زمان ثبت‌نام اجباری است.
- حداکثر حجم فایل در رابط کاربری ۸ مگابایت است.
- مسیر ذخیره‌سازی تصویر به کاربر و تورنمنت مربوط می‌شود.
- باکت Storage با نام `registration-evidence` خصوصی است و مقدار `public=false` برای آن تأیید شده است.
- تصویر نباید به‌صورت عمومی قابل مرور باشد. لینک امضاشده و زمان‌دار فقط برای کاربر مجاز و بازبین صادر می‌شود؛ اعتبار لینک در داشبورد مدیر ۱۵ دقیقه تنظیم شده است.
- OCR یا بررسی خودکار محتوای تصویر پیاده‌سازی نشده است. مالک یا مدیر مجاز، تصویر را به‌صورت انسانی بررسی می‌کند.
- Plato ID بازیکن اصلی باید با Plato ID پروفایل حساب واردشده تطبیق داشته باشد.

### ذخیره‌سازی و وضعیت بررسی
- درخواست‌ها در Supabase ذخیره می‌شوند و صرفاً متکی به حافظه محلی مرورگر نیستند.
- وضعیت‌های بررسی شامل در انتظار بررسی، تأییدشده و ردشده است.
- مسیر قدیمی بررسی ثبت‌نام مبتنی بر localStorage از جریان اصلی بررسی حذف شده است.
- داشبورد بررسی، درخواست‌ها را از دیتابیس مشترک می‌خواند و تأیید یا رد را از طریق RPC انجام می‌دهد.
- رکوردهای موجود و باکت خصوصی مدارک حفظ شده‌اند.

---

## ۵. ساختار دیتابیس و مرزهای امنیتی

### جدول‌های استفاده‌شده یا اضافه‌شده
- `public.tournaments`
- `public.registrations`
- `public.registration_evidence`
- `public.profiles`
- `public.user_admin_permissions`
- `public.tournament_manager_access`
- `public.registration_members` — برای نگهداری اعضای تیم مرتبط با هر ثبت‌نام اضافه شده است.
- `public.player_bans` — برای ثبت محرومیت بازیکنان؛ ساختار واقعی جدول موجود هنگام اجرا بررسی و حفظ شد.

مدل ثبت‌نام شامل فیلدهایی مانند `tournament_id`، `player_id`، `status`، `rules_accepted_at`، `evidence_path`، `registration_type`، `is_reserve`، `display_name`، `plato_id`، `team_name`، `reserve_position` و `slot_count` است.

### مدل نقش‌ها
- **مالک (`owner` / عنوان رابط «مالک کل»):** دسترسی کامل مدیریتی در سطح سایت.
- **مدیر مسابقات (`tournament_admin`):** دسترسی محدود به تورنمنت‌هایی که صریحاً به او واگذار شده‌اند.
- **بازیکن عادی:** بدون کنترل‌های مدیریت سایت یا مسابقات.

### قابلیت‌های مخصوص مالک
- ایجاد، ویرایش، حذف و انتشار تورنمنت
- مدیریت حساب‌های کاربران سایت
- تعیین مدیر اختصاصی برای هر تورنمنت
- مدیریت ویدیوی اطلاع‌رسانی صفحه اصلی
- مدیریت فهرست محرومیت بازیکنان
- انتقال اطلاعات قدیمی مسابقات
- تنظیمات سراسری سایت

دکمه سپر و ورودی پنل مدیریت فقط برای حساب دارای نقش مالک نمایش داده می‌شود. مدیر مسابقه و بازیکن عادی نباید این دکمه را ببینند.

### محدوده دسترسی مدیر مسابقه
- مدیر فقط تورنمنت‌هایی را می‌بیند که به او تخصیص داده شده‌اند.
- داشبورد مدیر بر اساس جدول `tournament_manager_access` محدود می‌شود.
- مدیر می‌تواند درخواست‌ها و مدارک تورنمنت‌های تخصیص‌یافته را بررسی کند.
- مدیر اجازه مدیریت سراسری سایت، مدیریت کاربران، ساخت/ویرایش/حذف تورنمنت یا تغییر تنظیمات سایت را ندارد.
- تخصیص مدیر فقط توسط مالک انجام می‌شود.
- در زمان بررسی دیتابیس، هیچ تخصیص مدیریتی فعالی ثبت نشده بود.

### RLS و فضای ذخیره‌سازی خصوصی
موارد زیر در پیاده‌سازی امنیتی لحاظ شده‌اند:
- تابع کمکی `private.can_manage_tournament(p_tournament_id)` برای تشخیص مالک یا مدیر مجاز همان تورنمنت.
- خواندن عمومی تورنمنت‌ها به موارد منتشرشده محدود است؛ تورنمنت منتشرنشده فقط برای مالک یا مدیر تخصیص‌یافته قابل مشاهده است.
- خواندن ثبت‌نام‌ها به صاحب درخواست، مالک یا مدیر تخصیص‌یافته محدود است.
- تغییر وضعیت و بررسی ثبت‌نام فقط برای مالک یا مدیر مجاز همان تورنمنت است.
- خواندن مدارک به بازیکن مربوط، مالک یا مدیر تخصیص‌یافته محدود است.
- سیاست‌های Storage دسترسی به مدارک خصوصی را محدود می‌کنند.
- سیاست‌های `player_bans` برای خواندن، درج، ویرایش و حذف فقط به مالک اجازه می‌دهند.

**نکته امنیتی:** پنهان کردن یک دکمه در رابط کاربری، مرز امنیتی محسوب نمی‌شود. RLS و بررسی مجوز در دیتابیس باید دسترسی واقعی را کنترل کنند.

### محرومیت بازیکنان
- فهرست محرومیت در جدول `public.player_bans` به‌صورت پایدار ذخیره می‌شود.
- Plato ID برای مقایسه نرمال‌سازی می‌شود: حذف فاصله‌های ابتدا/انتها و تبدیل حروف به حالت کوچک.
- تابع ثبت‌نام، شناسه بازیکن اصلی و تمام شناسه‌های اعضای تیم را با محرومیت‌های فعال سراسری یا محرومیت همان تورنمنت بررسی می‌کند.
- محرومیت می‌تواند برای تمام مسابقات یا فقط یک تورنمنت مشخص اعمال شود.
- افزودن و لغو محرومیت در دیتابیس انجام می‌شود و فقط در حافظه مرورگر باقی نمی‌ماند.

---

## ۶. توابع دیتابیس و رفتار تراکنشی

### `public.submit_tournament_registration(...)`
نسخه کامل تابع ثبت‌نام، شناسه تورنمنت، قوانین ارسال‌شده، مسیر مدرک و اطلاعات بازیکن/تیم را دریافت می‌کند. منطق آن شامل موارد زیر است:
- احراز هویت و بررسی پروفایل کاربر
- اعتبارسنجی Plato ID
- تطبیق دقیق قوانین پذیرفته‌شده با قوانین فعلی تورنمنت
- بررسی انتشار تورنمنت، باز بودن ثبت‌نام و تاریخ‌ها
- بررسی اینکه مسیر مدرک متعلق به همان کاربر و تورنمنت باشد و فایل در باکت خصوصی واقعاً وجود داشته باشد
- اعتبارسنجی ثبت‌نام انفرادی یا تیم آماده
- بررسی نام تیم و شناسه اعضا و جلوگیری از شناسه‌های تکراری
- محاسبه ظرفیت بر اساس ظرفیت و واحد ظرفیت همان تورنمنت
- مدیریت صف ذخیره در صورت فعال بودن
- ذخیره تراکنشی ثبت‌نام، اعضای تیم و مدرک
- بررسی محرومیت فعال برای تمام شناسه‌های ارسال‌شده

نسخه قدیمی و ضعیف سه‌پارامتری `submit_tournament_registration(uuid,text,jsonb)` از نقش‌های `public`، `anon` و `authenticated` سلب دسترسی شده است تا کلاینت نتواند از امضای قدیمی و کم‌اعتبار استفاده کند.

### `public.review_tournament_registration(uuid,boolean)`
- احراز هویت را الزامی می‌کند.
- ردیف ثبت‌نام در انتظار بررسی را با `FOR UPDATE` قفل می‌کند.
- مجوز مالک یا مدیر تخصیص‌یافته همان تورنمنت را بررسی می‌کند.
- وضعیت ثبت‌نام و مدرک را به‌صورت تراکنشی تغییر می‌دهد.
- در صورت رد ثبت‌نام اصلی، نفر بعدی صف ذخیره را ارتقا می‌دهد.
- رد یک درخواست ذخیره باعث ارتقای درخواست ذخیره دیگری نمی‌شود.

### `public.withdraw_tournament_registration(uuid)`
- انصراف را با بررسی مالکیت درخواست و احراز هویت انجام می‌دهد.
- در صورت آزاد شدن جایگاه اصلی، منطق ارتقای صف ذخیره را اجرا می‌کند.

### توابع نقش و مدیریت
- `current_user_role` نقش کاربر جاری را برای کنترل رابط کاربری می‌خواند.
- `admin_list_site_users` فقط برای مالک مجاز است.
- مجوز اجرای توابع مرتبط به نقش‌های لازم محدود شده است؛ بررسی مجوز داخل بدنه توابع نیز برقرار است.

---

## ۷. ساختار جدید پنل مدیریت — تأیید مالک در ۳۱ اکتبر ۲۰۲۶

### وضعیت قبلی
ابزارهای مختلف مدیریت در یک صفحه طولانی و پشت سر هم قرار گرفته بودند. پیدا کردن ابزار مشخص دشوار بود و کاربر برای رسیدن به بخش موردنظر باید صفحه را زیاد بالا و پایین می‌کرد.

### تغییر انجام‌شده
پنل مدیریت به منوی ناوبری فارسی، راست‌چین و واکنش‌گرا تبدیل شد. در هر لحظه فقط بخش انتخاب‌شده نمایش داده می‌شود.

شش بخش منو:

۱. **درخواست‌ها** — بررسی درخواست‌های ثبت‌نام و وضعیت‌های آن‌ها. مالک و مدیر مجاز، فقط در محدوده دسترسی خود این بخش را می‌بینند.  
۲. **مسابقات** — ساخت، ویرایش، انتشار و مشاهده فهرست مسابقات؛ فقط برای مالک.  
۳. **مدیران مسابقه** — تخصیص مدیر به تورنمنت‌های مشخص؛ فقط برای مالک.  
۴. **کاربران سایت** — مشاهده فهرست حساب‌ها و مدیریت کاربران؛ فقط برای مالک.  
۵. **محتوای صفحه اصلی** — تنظیم ویدیوی اطلاع‌رسانی صفحه اول؛ فقط برای مالک.  
۶. **انتقال اطلاعات** — انتقال مسابقات قدیمی از داده‌های محلی مرورگر؛ فقط برای مالک.

### رفتار و سطح دسترسی
- بخش درخواست‌ها برای مالک و مدیران مجاز، با رعایت محدوده دسترسی دیتابیس، در دسترس است.
- پنج بخش دیگر فقط به مالک نمایش داده می‌شوند.
- کلیک روی گزینه منو فقط بخش نمایشی انتخاب‌شده را عوض می‌کند و به‌خودی‌خود رکورد دیتابیس را تغییر نمی‌دهد.
- توابع عملیاتی، فراخوانی‌های Supabase و کنترل‌های نقش موجود حفظ شدند؛ این تغییر، سازمان‌دهی رابط پنل بود، نه بازنویسی فرآیندهای اصلی.
- منو دارای حالت انتخاب‌شده واضح، رنگ طلایی و نقاط شکست واکنش‌گرا برای موبایل و صفحه بزرگ است.
- فایل مستقل `src/admin-dashboard.css` برای استایل منوی جدید اضافه شد.
- فایل `src/App.tsx` این استایل را وارد می‌کند و وضعیت بخش انتخاب‌شده را نگه می‌دارد.

### کلیدهای بخش‌ها در کد
- `requests`
- `tournaments`
- `managers`
- `users`
- `content`
- `transfer`

### فایل‌های تغییرکرده در این مرحله
- `src/App.tsx`
- `src/admin-dashboard.css` — فایل جدید

### سابقه ثبت تغییر
- Pull Request: [شماره ۱۰ — سازمان‌دهی پنل مدیریت](https://github.com/Omidso82/Plato-land-preview/pull/10)
- Commit ادغام‌شده: [`36a8bbc3e78a69c97ff54cef36c05b5c128eff45`](https://github.com/Omidso82/Plato-land-preview/commit/36a8bbc3e78a69c97ff54cef36c05b5c128eff45)
- مالک پروژه در تاریخ ۳۱ اکتبر ۲۰۲۶ صریحاً اعلام کرد که ساختار و ظاهر جدید درست است و آن را تأیید می‌کند.

---

## ۸. سایر قابلیت‌های پیاده‌سازی‌شده

### مدیریت کاربران سایت
- مالک می‌تواند فهرست حساب‌های سایت را جدا از ثبت‌نام مسابقات مشاهده کند.
- جست‌وجو بر اساس نام نمایشی، Plato ID و ایمیل انجام می‌شود.
- حذف حساب فقط برای مالک است و از Edge Function با نام `admin-delete-user` استفاده می‌کند.
- پیش از حذف دائمی، تأیید کاربر دریافت می‌شود.
- حذف حساب سایت با انصراف از ثبت‌نام یک مسابقه متفاوت است.

### ویدیوی اطلاع‌رسانی صفحه اصلی
- مالک می‌تواند عنوان ویدیو را تعیین کند، فایل را بارگذاری کند و نمایش آن را فعال/غیرفعال کند.
- حذف ویدیو از صفحه اصلی نیز در اختیار مالک است.
- فرمت‌های مجاز در رابط: MP4، WebM و MOV.
- حداکثر حجم در رابط: ۵۰ مگابایت.
- نمایش عمومی فقط وقتی انجام می‌شود که ویدیو فعال باشد و نشانی معتبر آن موجود باشد.

### احراز هویت و پروفایل
- ورود و ثبت‌نام از Supabase Auth استفاده می‌کند.
- پروفایل بازیکن شامل نام نمایشی، Plato ID و عکس شخصی اختیاری است.
- محدودیت حجم عکس پروفایل ۲ مگابایت است.
- بخش پروفایل، سابقه ثبت‌نام‌های بازیکن را بر اساس داده‌های موجود نشان می‌دهد.

### پیش‌نمایش از دید بازیکن
- مالک می‌تواند سایت را در حالت مشاهده از دید بازیکن ببیند و به پنل مدیریت بازگردد.
- این حالت پیش‌نمایش، مجوز دیتابیس یا سطح دسترسی جدید ایجاد نمی‌کند.

---

## ۹. آزمون‌های انجام‌شده و محدودیت‌های شناخته‌شده

### بررسی‌های کد و CI
- در شاخه تغییر پنل مدیریت، اجرای `npm install` موفق بود.
- اجرای `npm run typecheck` موفق بود.
- اجرای `npm run build` موفق بود.
- اجرای GitHub Actions برای این تغییر، پیش از ادغام، مراحل بررسی TypeScript و Build را با موفقیت گذراند.
- تغییرات در شاخه `main` ادغام شدند.
- پس از آن، مالک ظاهر و ساختار پنل را بررسی و تأیید کرد.

### بررسی‌های دیتابیس ثبت‌شده
- قبل از تغییرات، وضعیت داده‌های موجود بررسی شد.
- در زمان آن بررسی: یک تورنمنت، صفر ثبت‌نام، صفر مدرک و صفر تخصیص مدیر مسابقه وجود داشت.
- خصوصی بودن باکت `registration-evidence` با مقدار `public=false` تأیید شد.
- رکورد سری اول به‌عنوان پیش‌نویس و ثبت‌نام بسته تأیید شد.
- رفتار RLS مالک برای خواندن `player_bans` در یک تراکنش آزمایشی بررسی و در پایان Rollback شد.
- نرمال‌سازی Plato ID و تطبیق شناسه عضو تیم با محرومیت در تراکنش آزمایشی بررسی و Rollback شد.
- محاسبه تاریخ پایان صف ذخیره برای تنظیمات صفر، یک و هفت روز بررسی شد.
- برای آزمایش، ثبت‌نام واقعی تولیدی یا تخصیص مدیر دائمی در دیتابیس ایجاد نشد.

### مواردی که نباید «آزمون کامل‌شده» تلقی شوند
- آزمون End-to-End با حساب‌های واقعی و جداگانه مالک، مدیر تخصیص‌یافته، مدیر تخصیص‌نیافته و بازیکن عادی در سوابق این مرحله کامل نشده است.
- OCR و اعتبارسنجی خودکار محتوای تصویر مدرک پیاده‌سازی نشده است.
- متن دقیق و نهایی ۱۷ قانون سری دوم هنوز باید از مرجع رسمی تأییدشده وارد سایت شود.
- هشدار Supabase درباره غیرفعال بودن حفاظت در برابر رمزهای عبور افشاشده، در این مرحله برطرف نشده است؛ تنظیمات امنیتی حدس زده یا بدون ابزار معتبر تغییر داده نشده‌اند.
- برخی هشدارهای Supabase Advisor درباره توابع SECURITY DEFINER و پیشنهادهای کارایی/ایندکس باقی مانده‌اند. بدنه توابع بررسی مجوز دارد، اما این هشدارها باید در کار فنی جداگانه بررسی شوند.
- Build موفق، به‌تنهایی اثبات صحت تمام فرآیندهای محیط واقعی نیست.
- برای این تغییر، تست خودکار مرورگر روی دامنه به‌عنوان یک آزمون مستقل ثبت نشده است؛ با این حال مالک اعلام کرده ظاهر و ساختار جدید را بررسی کرده و درست می‌داند.

---

## ۱۰. فهرست کارهای فنی باقی‌مانده و محافظت‌ها

موارد زیر عمداً به‌عنوان کار انجام‌شده ثبت نشده‌اند:

۱. اجرای آزمون‌های کنترل‌شده End-to-End با حساب‌های مجزای مالک، مدیر تخصیص‌یافته، مدیر تخصیص‌نیافته و بازیکن عادی.  
۲. بررسی هشدارهای باقی‌مانده Supabase Security Advisor، به‌خصوص حفاظت رمزهای افشاشده و دسترسی توابع SECURITY DEFINER، بدون تضعیف مجوزهای فعلی.  
۳. بررسی هشدارهای Performance Advisor شامل Foreign Keyهای بدون ایندکس، هشدارهای RLS initplan و ایندکس‌های بلااستفاده یا تکراری؛ تغییر فقط پس از بررسی اثر واقعی انجام شود.  
۴. دریافت و درج عین متن تأییدشده ۱۷ قانون سری دوم.  
۵. آزمایش ثبت‌نام، بررسی مدرک، اعضای تیم، ارتقای صف ذخیره، انصراف و کنترل محرومیت در محیط غیرتولیدی/آزمایشی پیش از اتکا به آن‌ها در مسابقه زنده.  
۶. بررسی وضعیت Workflow انتشار برای تغییرات آینده؛ ادغام Commit نباید به‌تنهایی معادل تأیید انتشار روی دامنه تلقی شود.  
۷. حفظ سری اول در وضعیت منتشرنشده تا دریافت و تأیید اطلاعات کامل از مالک.

---

## ۱۱. تاریخچه تغییرات

| تاریخ | تغییر | نتیجه و محدوده |
|---|---|---|
| ۳۱ اکتبر ۲۰۲۶ | ثبت پایدار محرومیت و بررسی اعضای تیم | محرومیت‌ها در Supabase ذخیره شدند؛ بررسی Plato ID نرمال‌شده شامل شناسه تمام اعضای تیم شد؛ RLS فقط مالک را مجاز می‌کند. |
| ۳۱ اکتبر ۲۰۲۶ | تنظیم مهلت صف ذخیره | تابع ثبت‌نام از تنظیم مهلت مختص هر تورنمنت استفاده می‌کند و در نبود تنظیم، یک روز را پیش‌فرض می‌گیرد. |
| ۳۱ اکتبر ۲۰۲۶ | محافظت از سری اول | رکورد موجود سری اول پیش‌نویس و ثبت‌نام آن بسته شد؛ منتشر نشد. |
| ۳۱ اکتبر ۲۰۲۶ | تقویت امنیت ثبت‌نام | امضای قدیمی RPC لغو شد؛ مسیرهای بررسی، انصراف و دسترسی به مدرک با مجوز کنترل می‌شوند. |
| ۳۱ اکتبر ۲۰۲۶ | سازمان‌دهی پنل مدیریت | منوی واکنش‌گرای شش‌بخشی اضافه شد؛ توابع عملیاتی و مرزهای دسترسی حفظ شدند. |
| ۳۱ اکتبر ۲۰۲۶ | تأیید مالک | مالک ساختار و ظاهر جدید پنل را تأیید کرد. |

---

## ۱۲. مراجع اصلی

- مخزن کد: https://github.com/Omidso82/Plato-land-preview
- تغییر تأییدشده پنل مدیریت: https://github.com/Omidso82/Plato-land-preview/commit/36a8bbc3e78a69c97ff54cef36c05b5c128eff45
- Pull Request شماره ۱۰: https://github.com/Omidso82/Plato-land-preview/pull/10
- دامنه سایت: https://platoland.org

### قاعده نگهداری این سند
هر زمان کد، دیتابیس، امنیت یا تصمیم محصول تغییر کرد، این سند نیز باید به‌روزرسانی شود. برای هر تغییر، تاریخ، فایل‌ها یا اشیای دیتابیس تحت‌تأثیر، آزمون‌های انجام‌شده و وضعیت تأیید مالک ثبت شود. پیشنهادهای تأییدنشده باید از تصمیم‌های نهایی جدا بمانند.


---

## Change record — 31 October 2026 (final registration UX and manager removal)

This entry supplements the prior project history; it does not replace earlier decisions or project records.

### A. Per-tournament Plato profile screenshot requirement
- The tournament owner controls the setting **«بارگذاری تصویر پروفایل Plato برای این مسابقه الزامی باشد»** independently for each tournament.
- When `platform_settings.require_profile_screenshot=false`, the registration form must not render the upload input or its explanatory text at all.
- When true, the upload field is visible and required.
- `tournamentFromDb` now preserves explicit false and supports the stored snake_case setting, the compatibility camelCase setting, and corresponding root-level compatibility fields. Legacy tournaments without an explicit setting retain the safe default of required.
- Submission validates and uploads the file only when required. For optional tournaments the RPC receives `p_evidence_path=null`; no unnecessary private upload is performed.
- The database-side rule remains authoritative: null evidence is accepted only when the tournament explicitly sets screenshot requirement to false.

### B. Remove a player/team registration from the tournament
- `src/TournamentManagerDashboard.tsx` now provides **«حذف از مسابقه»** for registration rows, including pending and approved/registered entries and reserve entries. Approve/reject controls remain limited to pending entries.
- The manager sees a confirmation dialog identifying the player/team and explaining the effect on capacity/reserves.
- The new `public.remove_tournament_registration(uuid)` RPC is **SECURITY INVOKER**, requires an authenticated user, locks the target registration, and checks `private.can_manage_tournament(tournament_id)` inside the database. It does not rely on hiding UI controls as authorization.
- EXECUTE is granted to `authenticated` and `service_role`; privileges for `public` and `anon` are revoked.
- Deleting the registration cascades to its `registration_members` and `registration_evidence` rows. The RPC returns the private evidence storage path before deleting the parent row; the client then removes that object from the private `registration-evidence` bucket.
- The Storage DELETE policy `registration_evidence_delete_owner_or_admin` was updated so the file can be deleted by its submitter or an authorized manager of the associated tournament. The post-row-delete cleanup path is checked against the tournament UUID embedded in the stored object path and the same manager authorization helper.
- When an active non-reserve entry is removed, the earliest pending reserve is promoted to the freed slot. Removing a reserve or an inactive/rejected/withdrawn entry does not promote another reserve.

### C. Files, migrations and commits
- `src/App.tsx`: commit `1f18adb265949fb4374dbd4f8959571a9f267c22` — preserve explicit false screenshot setting and hide upload field unless required.
- `src/TournamentManagerDashboard.tsx`: commit `ced8c3e171bf3ff65dadcd63f6da1b543c5da8d6` — add manager-side registration removal.
- Migration: `supabase/migrations/20261031140000_add_manager_registration_removal_and_storage_cleanup.sql`.
- Migration file was initially committed as `22d7fc40ba2583dac8c572da963096d7799834c0`; final grant restriction commit is `7a88f2a77b7c08af09b9d95ceb8637ef09a3b93d`.
- The migration was applied to the production Supabase project `dfrppbapaaydbjeflozw`.
- Live DB inspection confirmed the new RPC is SECURITY INVOKER, has its manager authorization guard, and has EXECUTE grants only for authenticated/service_role (plus owner-level postgres); anon/public are not granted.

### D. CI, deployment and owner acceptance
- GitHub Actions **Build and typecheck** run `41198106226`: completed successfully for commit `7a88f2a77b7c08af09b9d95ceb8637ef09a3b93d`.
- GitHub Actions **Deploy mobile preview** run `41198106193`: completed successfully for the same commit.
- The site owner subsequently confirmed that the site had updated, the changes were correct, and both issues were resolved.
- Independent multi-role end-to-end testing (owner, assigned manager, unassigned manager, ordinary player), including private-file cleanup and reserve promotion, remains a separate QA item and is not inferred solely from successful CI/deployment.

### E. Scope guard
No changes were made to the approved 17 Series 2 rules, the hidden/unpublished Series 1 policy, or unrelated tournament features in this change set.


---

## 31 October 2026 — Fix approved entrants missing from knockout draw (League A)

### Root cause
The manager dashboard reads registration rows directly from Supabase and displays the database status values such as `approved`. The `CompetitionVisuals` draw component previously relied on the legacy `registrations` array passed from browser-local state and filtered for the Persian display string `تأیید شده`. The two surfaces therefore used different data sources and different status representations. A team could be approved in the manager panel but still be counted as zero in the draw.

### Production data checked
Tournament `00d89dd7-f1e8-49a7-a116-a0ce2ed6b7eb` (League A):
- `progression=knockout_only`
- `registration_open=false`
- `capacity=2`, `capacity_unit=teams`
- Two registration rows exist; both are `status=approved`, `registration_type=team`, `is_reserve=false`, `slot_count=1`, with two team members each.
- Registration IDs: `bcdf884d-14b8-4806-9844-15ab944af56d` and `56dd79b6-aded-459a-a531-2e5a4677ea7f`.
This is a read-only production data check; no registration rows were changed.

### Code correction
- `src/CompetitionVisuals.tsx` now queries `public.registrations` for the selected tournament from the shared Supabase project.
- It loads associated `registration_members` rows and maps a team registration to one draw entrant using the team name and captain Plato ID. Capacity unit remains one team per registration.
- Only non-reserve registrations with database status `approved` or `registered` are included. Pending, rejected, withdrawn and reserve entries are not included in the draw entrants.
- A fresh load occurs when the selected tournament changes. A Supabase Realtime subscription listens for changes to that tournament's registration rows, and a manual refresh control is also available.
- Existing knockout behavior is retained: once registration is closed and at least two confirmed entrants exist, the first-round draw and bracket are generated automatically.
- The existing limitation remains: draw/bracket state is stored in that browser's `localStorage`; this change does not migrate draw state to shared Supabase storage.

### Commit, CI and deployment
- Commit: `4d6375b50906e4bb56d491bd3eb27b5735469227`.
- Build and typecheck run `41199248932`: completed successfully.
- Deploy mobile preview run `41199248916`: completed successfully.
- Owner-facing live browser confirmation of the two entrants appearing in the draw was not yet received at the time this record was written; the production data and CI/deploy evidence are recorded separately from that visual confirmation.

### QA follow-up
Verify on the live site that League A shows two confirmed team entrants (Omid and Taj), that the draw creates the first knockout round after registration closure, and that a later approval is reflected through Realtime or the manual refresh control. Test Realtime independently; manual refresh remains the fallback.
---

## 31 October 2026 — PLATO LAND v10.7 implementation continuation (not deployed)

### Implemented in the production codebase branch
- Added explicit tournament lifecycle mapping between Supabase states (draft, published, ongoing, completed, cancelled) and Persian owner-facing status labels. Saving a tournament now preserves the selected lifecycle state while keeping registration-open as a separate flag.
- The public homepage's active-tournament section now includes only published tournaments whose database lifecycle is ongoing. When none exist, it displays the approved minimal empty state.
- The tournaments page now separates active competitions, future/open-registration competitions, and completed/cancelled archive entries, with search applied within each section.
- Updated the site footer to the approved 2026 PLATO LAND copyright line and removed the prototype label.
- Added live owner-dashboard counts for registrations and profiles using exact Supabase counts and Realtime refresh subscriptions; these figures no longer depend on unpopulated client-side arrays.
- Added owner-dashboard lifecycle metrics for ongoing and completed tournaments.
- Clarified that tournament-manager scope is enforced by database permissions and assignments, not merely simulated in the interface.
- Kept Persian/Jalali date display and Tehran-time boundary helpers from the existing v10.7 work.

### Validation
- GitHub Actions Build and typecheck run 41242029428: completed successfully for commit 6f1d1c186fe99ed87361fc3c7f6fe3470c5baf70.
- TypeScript typecheck and Vite production build both passed.
- No Supabase schema migration was applied and no production rows were modified in this implementation slice.

### Release state
- Branch: implementation/uiux-v10-7-owner-foundation.
- PR: #16 (https://github.com/Omidso82/Plato-land-preview/pull/16), still open as Draft.
- The changes have not been merged to main and have not been deployed to https://platoland.org.
- This is an incremental implementation slice, not completion of UI/UX checklist v10.7. Remaining approved requirements and full QA are still outstanding.
### Production database policy alignment
- Applied additive migration 20261031210747_public_tournament_lifecycle_read to the existing production Supabase project (dfrppbapaaydbjeflozw). No rows were modified.
- Anonymous users can now read only tournaments in public lifecycle states: published, ongoing, completed, and cancelled. Draft tournaments remain private.
- Authenticated users retain the same public lifecycle visibility plus the existing private.can_manage_tournament(id) access for their assigned management scope.
- Read-back of pg_policies confirmed the two intended SELECT policies. The security advisor showed no new findings from this migration; previously known SECURITY DEFINER and leaked-password warnings remain unchanged.
### Owner-managed news and public archive
- Added the additive Supabase table public.site_news with draft/published states, optional summary/body/image URL, featured flag and optional featured display window.
- Enabled RLS: anonymous visitors can select published rows only; authenticated non-owners can select published rows only; owner-only policies govern insert, update and delete.
- Added the public NewsCenter page with featured news, permanent published archive, empty states and manual refresh. Expired featured items remain in the archive.
- Added owner-side news creation, editing, draft/publish, featured toggle and deletion. Draft rows are visible only to the owner.
- Added responsive RTL news-card styling. News body is rendered as text, not interpreted as HTML.
- Applied migration 20261031210842_create_owner_managed_public_news and follow-up 20261031211014_optimize_site_news_owner_policy to the existing production Supabase project. The follow-up adds the creator foreign-key index and wraps owner/UID helpers in the insert policy.
- Read-back confirmed RLS is enabled and the intended five policies exist. No news rows were inserted and no existing records were changed.
- GitHub Actions Build and typecheck run 41242361746 completed successfully for the NewsCenter code commit 1bc8b8237fc6f0734a5e2edca98057a77ecf458d.
### Homepage featured-news integration
- Reused NewsCenter in featured-only mode on the public homepage immediately after the hero section.
- The homepage featured-news section stays hidden while content loads and remains hidden when there is no currently valid featured published item. Expired featured items continue to appear in the permanent news archive.
- Desktop layout emphasizes the first featured item; mobile cards stack vertically.
- GitHub Actions Build and typecheck run 41242490016 completed successfully for commit 11053eeafd2201507a4e10f9e92256ce8e275de2.
### Featured-news scheduling and public column permissions
- Added Persian/Jalali date text fields and Iran wall-clock time inputs for the featured display start/end window. Stored values are converted to UTC instants from Asia/Tehran wall-clock input; the public homepage only shows currently valid featured items.
- Applied additive migrations 20261031211355_limit_public_site_news_columns and 20261031211411_revoke_public_news_write_privileges. Anonymous users can select only the 12 public content/display columns; all anonymous write privileges are revoked.
- Read-back of information_schema.column_privileges confirmed anon has SELECT only (12 columns), with no INSERT/UPDATE/DELETE privileges. Security advisor reports no site_news-specific security findings.
### Shared Jalali conversion helper
- Centralized Jalali date parsing in src/iranDate.ts and switched the existing owner date input to use the same exported conversion helper used by featured-news scheduling.
- This reduces duplicate calendar conversion logic and keeps date input/storage consistent across the owner forms.
- GitHub Actions Build and typecheck run 41242711435 completed successfully for commit 2e8a4eccc8295eb8b4a52a1e46806fe12386a22a.
### Editable About and Guide pages
- Added public.site_pages with two allowed slugs (about, guide), JSONB section content, owner draft state, and separate published snapshot columns.
- Public visitors can read only the published snapshot; anonymous privileges are limited to the six public display columns and all anonymous write privileges are revoked.
- Owner can edit page title/introduction, add or remove sections, save as draft, publish, or delete saved content and return to the default page copy.
- Saving a draft preserves the last published snapshot; the public page continues to show the prior published version until the owner publishes the new content.
- The About and Guide public pages now load from Supabase with safe default content when no saved page exists. Owner admin navigation includes a dedicated Pages section for both editors.
- Applied migrations 20261031211556_create_owner_managed_site_pages and 20261031211717_preserve_published_site_page_versions. Read-back confirmed RLS policies and anonymous SELECT-only column grants.
- GitHub Actions Build and typecheck run 41242992252 completed successfully for commit c5f4169496a53f9196ffff72db3f609ccc02f17b.
### Public visitor access
- Corrected the no-session startup path: unauthenticated visitors now land on the public homepage instead of being redirected to the login-only screen.
- Login and signup remain explicit header actions; registration/profile actions still require authentication.
- This is necessary for the approved public Home, Tournaments, News, About and Guide pages to be accessible without an account.
- GitHub Actions Build and typecheck run 41243053625 completed successfully for commit 0e6db8e44872bd6279558e54aa0361016a51683e.
### Recent champions on the homepage
- Added tournaments.completed_at, populated automatically when the owner changes a tournament lifecycle to completed; existing completion time is preserved on later edits.
- Added the security-barrier view public.recent_tournament_champions. It exposes only the last three unambiguous champions (exactly one placement-1 result per completed tournament), with public player display name/Plato ID and tournament metadata. It does not expose auth user IDs or private avatar storage paths.
- Added the homepage RecentChampions component. It reads only the limited view and hides the section when there are no valid champion records; current production query returned no rows, so no invented champion cards are displayed.
- GitHub Actions Build and typecheck run 41243238941 completed successfully for commit 97ea2db53b4b4e02c998a94a3b28548fd41d38b7.
### Champions view privilege hardening
- Read-back of information_schema.role_table_grants showed broad default privileges on the new view; applied migration 20261031212302_limit_recent_champions_view_grants to revoke all privileges from anon/authenticated and restore SELECT only.
- Verification confirms both roles now have SELECT only on public.recent_tournament_champions.
### Recent champions RLS hardening
- Supabase Security Advisor flagged the initial champions view as SECURITY DEFINER. Replaced that behavior with migration 20261031212428_secure_public_champion_view_with_rls: the view is now SECURITY INVOKER, and anon policies expose only placement-1 result rows for completed tournaments plus only champion profile display_name/Plato ID.
- Anonymous column grants on profiles and tournament_results are limited to the exact join/display columns. Read-back confirmed only those six SELECT column grants and no additional site-specific security advisor finding; the view remains SELECT-only.
### Owner-managed game catalog
- Added public.site_games for curated game cards and the mixed-competition category, with name, slug, description, optional HTTPS image, enabled flag and display order.
- RLS is enabled. Anonymous users can read enabled game cards only and have SELECT-only access to the ten public display columns; owner-only policies manage create/update/delete. Disabling a catalog item does not delete tournament history.
- Added responsive GameCatalog cards to the public tournaments page; selecting a game filters its active, future/open-registration and archive competitions. Added an owner-only Games management section with create/edit/enable/disable/delete controls.
- Applied migration 20261031212532_create_owner_managed_game_catalog. Read-back confirmed the intended policies, limited anonymous SELECT grants and no site_games-specific security advisor findings.
- GitHub Actions Build and typecheck run 41243604293 completed successfully for commit 270acc8ef3ca79e64f88e7e9eeddec079265468e.
### Game catalog refinements
- Mixed competitions now use a dedicated selection key and filter independently from single-game categories.
- Tournament game mapping prefers explicit platform_settings.game metadata before the legacy game_type field, preventing older rows that stored a format label in game_type from being miscategorized when explicit game metadata exists.
- Added migration 20261031212832_index_site_games_creator to cover the game catalog creator foreign key.
### Tournament details and registration time windows
- Added a responsive tournament detail dialog accessible from public tournament cards, with overview, rules and schedule tabs, real capacity/prize/status data, and registration action only when registration is open.
- Added Jalali date and Asia/Tehran wall-clock fields for tournament start time and registration start/end windows. No default times are silently invented; incomplete date/time pairs are rejected before save.
- Registration window timestamps are stored as absolute UTC instants converted from Iran wall-clock input. Existing schedule metadata is preserved when editing a tournament.
- The public details dialog formats schedule timestamps in Iran time and shows an explicit empty state when schedule data has not been provided.
- GitHub Actions Build and typecheck run 41244094206 completed successfully for commit 23c80eea00307296514b515273f5af05e2635b18.
### Index coverage follow-up
- Applied migration 20261031213213_index_page_and_tournament_owners to add indexes for site_pages.updated_by and tournaments.created_by foreign keys.
- This removes the new site_pages creator/editor FK warning and addresses the existing tournaments.created_by FK warning without changing any rows.
- Latest code validation: GitHub Actions Build and typecheck run 41244147438 completed successfully for commit 4357550dff28eac6aade231e4ee6d3700ded5fd2.
### Public participants and completed results
- Applied migration 20261031213427_public_approved_participants_read. Anonymous users can read only approved/registered non-reserve registration rows and approved team-member display fields; evidence paths, pending/rejected requests and reserves remain private.
- Added the public Participants tab to tournament details, showing only approved non-reserve entries and team roster display fields. Tournament cards now show approved registration count against capacity and refresh the count through Realtime when available.
- Applied migration 20261031213708_public_completed_tournament_results_read. Public result access is restricted to completed tournaments; only result metrics and player display name/Plato ID columns are granted. Private profile fields remain unavailable.
- Added the Results tab for completed tournaments, with placement, player, Plato ID, wins, losses and points. It shows an empty state when no verified result rows exist.
### Mixed competitions and owner private workspace
- Added `site_games.included_game_slugs` with a database constraint: a mixed-competition catalog item must include at least two selected standalone games; standalone games cannot carry mixed-game members.
- Updated the owner game editor to choose constituent games for mixed competitions and show their labels in the public catalog. Removed destructive game deletion from the catalog UI; owners should disable a game to hide it while retaining tournament history.
- Anonymous catalog access was expanded only to the new public display column; owner write policies remain owner-only.
- Added `owner_private_notes` and `owner_admin_tasks` tables with RLS enabled and owner-and-creator scoped policies. No anonymous or tournament-manager access is granted.
- Added owner workspace UI for private notes (priority, edit/delete) and operational tasks (Iran/Jalali due date, Tehran time, priority, status, edit/delete, completion). All records persist in the existing production Supabase project.
- Applied migrations 20261031214025_configure_mixed_competition_game_members, 20261031214210_grant_public_mixed_game_catalog_column, and 20261031214550_create_owner_private_notes_and_tasks. Existing tournament and registration records were not modified.
### Owner exports and game-history preservation
- Added an owner-only CSV export workspace for profiles, tournaments, registrations and tournament results. Exports include Persian column headings and Tehran-local date/time formatting; private evidence paths and screenshot files are deliberately excluded.
- Added the OwnerExports section to the owner-only admin navigation. Data is queried from the existing Supabase database at export time; no duplicate data store or browser persistence is used.
- Removed the catalog delete action and dropped the `site_games_owner_delete` RLS policy. Games must be disabled to hide them; catalog rows and tournament history are retained.
- Applied migration 20261031215015_preserve_game_catalog_history_no_delete. The migration does not delete or alter any game or tournament record.
- GitHub Actions run 41251338812 passed both `npm run typecheck` and `npm run build` for the owner workspace, mixed-competition editor, game-history protection, and CSV export changes.
### Scheduled news publication and expiry
- Added `site_news.publish_at` and `site_news.expires_at`. Published articles become publicly visible only when the Tehran-scheduled publication instant has arrived and remain visible until their optional expiry instant.
- Updated anonymous and authenticated non-owner SELECT policies to enforce the publication window at the database layer; owners retain access to drafts and scheduled/expired content for management.
- Extended anonymous column grants only for the two public scheduling fields and added Jalali date/Tehran time inputs to the owner news editor. Featured display windows remain separate from article publication/expiry windows.
### Owner-controlled maintenance mode
- Added `site_maintenance` as a single-row setting with RLS. Anonymous visitors can read only the maintenance flag/message fields and cannot write; owner alone can change the setting.
- Added a global maintenance gate for public visitors and a dedicated owner admin panel to enable/disable maintenance, edit the message, and preview the maintenance screen without taking the live site offline.
- Owner is exempt from the public maintenance gate and can continue using the site and admin controls to disable maintenance.
- Applied migrations 20261031220010_add_owner_controlled_maintenance_mode and 20261031220540_grant_maintenance_singleton_read to the existing Supabase project.
### Scoped audit event stream
- Added an invoker-context audit trigger function that records only operation, entity type/ID, tournament ID where applicable, and before/after status. It deliberately excludes profile evidence, file paths, full row contents and other private payloads.
- Added change capture triggers for tournaments, registrations, results, news, About/Guide pages, game catalog and maintenance settings.
- Tightened `audit_logs` read policy: owner can review all events; tournament managers can see only events carrying a valid tournament ID for a tournament assigned to them. Insert policy requires the authenticated actor to match `actor_id` and applies the same scope.
- Added owner audit viewer with date/time in Tehran and filters by entity type. Applied migrations 20261031221020_add_scoped_audit_event_capture and 20261031221105_grant_scoped_audit_insert.
- Read-back verified the audit triggers are installed on tournaments, registrations, tournament_results, site_news, site_pages, site_games and site_maintenance. The trigger function records metadata/status only; it does not copy registration evidence or full rows.
- Supabase Security Advisor still reports three pre-existing SECURITY DEFINER RPC warnings (`admin_list_site_users`, `current_user_role`, `withdraw_tournament_registration`) and leaked-password protection disabled. Their definitions were inspected: each has an explicit authentication/role or ownership guard. These account-level findings remain in the final security checklist.
- GitHub Actions run 41251671271 completed `npm run typecheck` and `npm run build` successfully for the audit, maintenance, scheduled news, and owner export/workspace UI changes.
### Persistent player notifications
- Added `user_notifications` with per-user RLS: players can read and mark only their own notifications; inserts are limited to a manager assigned to the referenced tournament. Table grants are restricted to SELECT/INSERT/UPDATE.
- Registration triggers create notices for pending submissions, reserve placement, approval, rejection, withdrawal and promotion from reserve. Notification content contains only status/action messaging and tournament reference, not private evidence.
- Added the notification bell/dropdown to signed-in player navigation, unread count, mark-one-read and mark-all-read actions. Realtime publication is enabled only for this private table, with RLS still applied.
- Applied migrations 20261031222035_add_persistent_player_notifications, 20261031222310_restrict_notification_inserts_to_tournament_managers, 20261031222500_limit_player_notification_table_grants and 20261031222615_enable_realtime_player_notifications.
- GitHub Actions run 41251961258 passed TypeScript typecheck and production build for the player notification UI and all preceding owner modules.
### Database index review
- Added indexes for `audit_logs.actor_id`, `site_maintenance.updated_by`, `user_notifications.tournament_id`, and `tournament_results.player_id`; removed the duplicate audit timestamp index introduced during implementation.
- Re-ran Supabase Performance Advisor: the new FK warnings for those paths are resolved. Remaining warnings concern pre-existing tables/policies and unutilized indexes pending workload evidence; no existing indexes were removed without a proven duplicate.
- Added `site_maintenance` to Supabase Realtime and allowed anonymous reads of only its non-sensitive flag/message columns even while disabled, so already-open public sessions receive both activation and deactivation updates. Verified the table is in `supabase_realtime`.
- GitHub Actions run 41252170429 passed `npm run typecheck` and `npm run build` for the notification, mixed-game logo and maintenance realtime code.
- Extended the public news archive with full-text search over title/summary/body and a Persian-calendar year filter; filters operate on the published archive and do not expose drafts.
### Owner site health summary
- Added an owner-only health dashboard that runs live count/read checks against tournaments, registrations, profiles, news, game catalog and owner tasks, reports per-source errors, and timestamps the last check in Tehran time.
- Added a dedicated owner admin navigation entry. This is a read-only diagnostic surface; it does not alter operational records.
### Public profile photos for results and champions
- Added a separate `public-profile-avatars` storage bucket; the existing `avatars` and `registration-evidence` buckets remain private. Users can upload only into their own folder; public read applies only to the dedicated profile-photo bucket.
- Profile upload now writes a private account copy and a separate public display copy, updates both profile paths in one profile-row update, and cleans up previous objects after success. The UI explicitly tells users that the profile image can appear in public champion cards.
- Added `profiles.public_avatar_path`, exposed only as a public display column for champion-eligible profiles, and extended the security-invoker recent champions view. Recent champion cards and completed results now show the public avatar when available.
- Added authenticated read policies for completed tournament results and their participant profile display rows so signed-in visitors see the same completed results as anonymous visitors.
- GitHub Actions run 41252537783 passed TypeScript typecheck and production build for the public avatar and results integration.
### About and Guide content versioning
- Added owner-only `site_page_versions` history for About and Guide. Before each content/status/publication change or deletion, the previous page state is preserved with a monotonically increasing per-page version number.
- Owner can review the latest 20 prior versions and restore a selected version. Restoring is a normal page update, so the version being replaced is also preserved by the trigger.
- Version history is not exposed to public visitors or tournament managers.
### News content versioning
- Added owner-only `site_news_versions` history. Changes and deletions preserve the prior title, summary, body, image reference, publication state, featured window, scheduled publication and expiry values.
- While editing an existing news item, the owner can review the latest 20 versions and restore one. The restore is itself versioned, preserving the state being replaced.
### Player display-name protection and registration confirmation
- Changed the self-service profile form so display name is read-only; players can still update their Plato ID and profile image.
- Added a database trigger that rejects self-service display-name changes. The site owner retains the ability to correct a display name.
- Registration success now uses the exact approved Persian confirmation: «درخواست شما با موفقیت ثبت شد و در انتظار بررسی است».
- GitHub Actions run 41252810148 passed TypeScript typecheck and production build after adding public avatar handling, news/page version rollback, and profile display-name protection.
- GitHub Actions run 41252729515 passed `npm run typecheck` and `npm run build` for the news/page version-history changes.
- GitHub Actions run 41252810148 passed `npm run typecheck` and `npm run build` after the exact registration confirmation and owner-only display-name enforcement were added.
- Added a Jalali calendar-year filter to the public tournament archive; the existing tournament/game search continues to apply alongside the year filter.

## 1 November 2026 — Production privacy, RLS and migration-ledger reconciliation

### Series 1 privacy correction
- The primary database contained two Series 1 tournament records with `status='published'`. The prior anonymous lifecycle policy did not exclude Series 1, and the application public lists had no Series 1 filter.
- Applied production migration `20261101002024_hide_series_one_from_public_access_and_scope_tournament_managers`.
- Added `private.is_tournament_public(uuid)`, normalizing Persian/Arabic Yeh/Kaf and English Series 1 labels. Public and ordinary authenticated reads now exclude Series 1 from tournaments, approved registrations, registration members, completed results, public profile rows and the recent-champions view.
- Owner/assigned-manager access remains available through the scoped management policy. The two existing Series 1 rows were not edited, deleted or rewritten.
- The same migration changed match and result INSERT/UPDATE/SELECT policies from global `tournament_admin` role checks to `private.can_manage_tournament(tournament_id)`, preventing an unassigned tournament manager from writing another tournament's match/result rows.
- `src/App.tsx` now filters Series 1 from public homepage/archive/registration lists and requests only the safe public tournament columns.

### Safe public reads and least privilege
- Applied `20261101002100_grant_safe_public_tournament_read_columns`: anonymous users receive SELECT only on the tournament fields needed by public pages; internal ownership fields remain unavailable.
- Applied `20261101002231_reduce_anon_access_to_private_tables_and_invoker_role_rpc`: removed unnecessary anonymous SELECT grants from owner notes/tasks, registration evidence, manager permissions, notifications, version history, tournament settings and competition snapshots.
- Changed `public.current_user_role()` to SECURITY INVOKER. The existing own-role RLS policy is sufficient for the caller to read their own role.
- Supabase Security Advisor now reports two remaining SECURITY DEFINER RPC warnings (`admin_list_site_users` and `withdraw_tournament_registration`) plus leaked-password protection disabled. The two RPCs retain explicit owner/ownership guards; the Auth password setting still requires separate project Auth configuration and has not been changed here.

### Production verification performed
- Anonymous SQL-role simulation: zero tournament rows, zero Series 1 rows, and zero public registrations/members/results/champions are visible. The public tournament query now succeeds using the limited column grants.
- Ordinary authenticated-user simulation: zero Series 1 tournament rows visible.
- Owner SQL-role simulation: both existing Series 1 records remain visible to the owner.
- `public.current_user_role()` under the owner authenticated context returned `owner`.
- Anonymous table SELECT was confirmed unavailable on the private tables listed above.
- No operational tournament, registration, result, profile or evidence rows were modified by these migrations.

### Migration history reconciliation
- Primary Supabase project `dfrppbapaaydbjeflozw` now reports 80 applied migrations.
- 60 repository migration files now use the exact version IDs recorded in the primary migration ledger.
- Twenty earlier applied baseline migrations have no corresponding SQL source file in this repository. Two implementation files whose migration versions were not in the primary ledger were moved to `supabase/migrations_reviewed_not_applied/` after their target objects/policies were verified as already present.
- `supabase/migrations/README.md` records this state. Do not run `supabase db push` or replay historical migrations until the missing baseline source/history is reconciled. No migration was replayed as a duplicate.

### Release and QA status
- PR #16 remains Draft and unmerged. Latest implementation branch head at this record: `4c2677c2127da255bace0620a6f9e25b4feb3c3f`.
- The last confirmed GitHub Actions success available during this check was run `41256383944` on commit `27788b4889c521e224af29441124527e76be59c8`; it is not evidence for the later App.tsx and migration-ledger commits. A fresh run against the latest head is required.
- Authenticated owner/manager/player browser E2E, private-file access tests in a real browser, domain deployment and live-domain verification remain outstanding. No deployment or merge was performed.
- The full UI/UX v10.7 scope is not complete. See `docs/QA_MASTER_CHECKLIST_v1.1.md` for implemented, partial and pending requirements. In particular, granular manager section permissions and several owner modules from versions 7.3–10.5 remain open.


## 1 November 2026 — Consolidate public SELECT policies
- Applied production migration `20261101002449_consolidate_public_read_policies`.
- Consolidated authenticated profile reads into one policy and removed the redundant authenticated completed-results policy; consolidated `site_settings` reads so anonymous users see only the public invite setting and authenticated users use one combined policy.
- Supabase Performance Advisor no longer reports the previous three `multiple_permissive_policies` warnings on profiles, tournament_results and site_settings. Thirty-three unused-index INFO findings remain; no indexes were removed without workload evidence.
- Security Advisor remains at two guarded SECURITY DEFINER RPC warnings and leaked-password protection disabled.
- This migration changes policies only and does not modify operational rows.
- Source implementation commit: `1116cdfa01d3a66040a1f0b10aacca23d34b1e8c`; latest documentation commit at the time of this check: `1176e7dad278d22e97519bb227ce6a18a8319db2`. A fresh CI run against this HEAD is still required; the last confirmed successful run remains on the earlier commit recorded above.


## 1 November 2026 — Dedicated tournament-manager entry point
- Added a separate header entry for authenticated `tournament_admin` users: “پنل مدیر مسابقه”, using a non-shield icon. The existing shield entry remains visible only to the owner.
- The management page heading now distinguishes “پنل مالک” from “پنل مدیر مسابقه”; the manager view continues to show only the assigned-tournament request workflow and no owner-only sections.
- Static source inspection confirms the owner shield condition is still restricted to role `مالک کل`; the manager entry requires `مدیر مسابقات`.
- Real-browser verification with owner and assigned-manager accounts remains pending.
- Source change commit: `1116cdfa01d3a66040a1f0b10aacca23d34b1e8c`. Latest branch CI is still required before release.


## 1 November 2026 — Scoped tournament-manager permissions and scheduling/results

### Manager permission model
- Production migration `20261101003738_add_scoped_tournament_manager_section_permissions` introduced `permissions_configured` and `private.can_manage_tournament_section(uuid,text)`, then bound registration review/removal, evidence access, group snapshots, matches, results and tournament notifications to the corresponding section permission.
- Migration `20261101003840_allow_group_managers_confirmed_participant_reads` allows a groups-only manager to read only approved/registered non-reserve participants needed for the draw and adds an owner-only UPDATE policy for manager assignments.
- Migration `20261101003910_infer_tournament_admin_role_from_assignment` makes `current_user_role()` return `tournament_admin` for an account with a tournament assignment, without granting a global role or owner rights.
- The legacy `user_admin_permissions` table has a global `(user_id, permission_key)` primary key, so it was not reused for tournament-specific grants. Migration `20261101003936_use_dedicated_tournament_manager_section_permissions` created `public.tournament_manager_section_permissions` with scoped composite primary key and RLS; it also removed the unused extra column from the legacy table.
- Migration `20261101004110_allow_schedule_results_managers_confirmed_participant_reads` permits schedule/results managers to read only approved/registered non-reserve participants.
- Migration `20261101004212_index_tournament_manager_permission_foreign_keys` added FK indexes for the new permission table.
- Owner UI now supports up to two managers per tournament and four separate permission switches. Existing legacy manager assignments with `permissions_configured=false` retain their previous access until explicitly reviewed and saved by the owner.
- Manager UI now has a separate “پنل مدیر مسابقه” entry and shows only the sections assigned. The owner shield remains owner-only.

### Schedule and results tools
- Added `src/TournamentManagerOperations.tsx`.
- Schedule section creates/edits match records with Jalali date and Iran-local time.
- Results section records raw match scores/winner and permits manual standings fields (points, wins, losses, score for/against and placement). No default points formula is assumed.
- Team tournament result workflows and automatic standings calculation from each tournament's specific scoring rules remain open.

### Production SQL verification
- A temporary transaction used one non-owner profile and one tournament to assign only the groups permission.
- `current_user_role()` returned `tournament_admin`; `can_manage_tournament_section(...,'groups')` returned true; registrations, schedule and results returned false.
- The transaction was rolled back. No manager assignment or scoped permission row was left in production.
- At verification time, actual manager assignments and scoped permission rows were both zero.
- Existing operational data was not deleted or rewritten.

### Migration ledger
- Primary Supabase project `dfrppbapaaydbjeflozw`: 75 applied migrations.
- Repository: 60 SQL migration files, all 55 version/name pairs match the primary migration ledger.
- Twenty older applied baseline migrations remain without source SQL files in the repository. Do not run `supabase db push` or replay migrations until this history is recovered/reconstructed.
- Two non-ledger historical SQL files remain archived under `supabase/migrations_reviewed_not_applied/`.

### Build and release
- GitHub Actions run `41257846376` on code commit `2af6ac11e71bd7f783ee22f832955a8634e41c20` completed npm install, TypeScript and Build successfully.
- GitHub Actions run `41257994066` on commit `b9d9752e7469737e74755d18474345de38908fb0` completed npm install, TypeScript and Build successfully, including the manager-permission and schedule/results implementation.
- PR #16 remains Draft and unmerged. No production deploy was performed.
- Real-browser E2E, signed Storage access testing and independent live-domain verification remain outstanding.

### Security Advisor
- Two SECURITY DEFINER warnings remain for `admin_list_site_users()` and `withdraw_tournament_registration(uuid)`; both include explicit authorization checks but need practical negative tests.
- Leaked Password Protection remains disabled in Supabase Auth; the available tools did not expose the required Auth configuration change.
- Performance Advisor reports 35 unused-index INFO findings; the two new foreign-key index warnings are resolved. No index was removed without workload evidence.
- The two new unindexed-FK INFO findings on `tournament_manager_section_permissions` were fixed with migration `20261101004212`.

### New handover/checklist
- Added `docs/TECHNICAL_HANDOVER_v2.6_2026-11-01.md`.
- Added `docs/QA_MASTER_CHECKLIST_v1.2.md`.
- Updated `supabase/migrations/README.md` to 75 database migrations / 55 source files.


## 1 November 2026 — Final CI verification for implementation batch
- Latest verified branch commit: `b9d9752e7469737e74755d18474345de38908fb0`.
- GitHub Actions run `41257994066` completed `npm install`, `npm run typecheck`, and `npm run build` successfully.
- PR #16 remains Draft and Unmerged; the `main` branch and live domain were not changed.
- Latest Supabase migration ledger: 75 applied migrations; 55 source files matched exactly; 20 old baseline SQL files remain missing from the repository.
- Latest Security Advisor: two guarded SECURITY DEFINER RPC warnings and Leaked Password Protection disabled.
- Latest Performance Advisor: 35 unused-index INFO findings; no unindexed foreign-key finding remains after the two supporting indexes were added.
- The manager section-permission test was transaction-scoped and rolled back. There are no real manager assignments in production at this time.
- Browser E2E and independent live-domain checks remain pending because no authenticated browser automation capability was available in this session.
- Updated artifacts: `docs/QA_MASTER_CHECKLIST_v1.2.md`, `docs/TECHNICAL_HANDOVER_v2.6_2026-11-01.md`, and `supabase/migrations/README.md`.


## 1 November 2026 — Atomic manager permission save and final permission hardening
- Added `public.save_tournament_manager_access(uuid,jsonb)` in migration `20261101004447_save_tournament_manager_permissions_atomically`. It validates a maximum of two managers, unique account IDs and the four allowed section keys; replaces assignments and grants atomically.
- The RPC was changed to SECURITY INVOKER in migration `20261101004534_make_manager_permission_save_rpc_invoker`, avoiding an additional exposed SECURITY DEFINER warning. The current owner is checked through `private.has_role`; all writes are governed by owner-only RLS policies.
- Migration `20261101004548_grant_manager_access_update_for_owner_rpc` grants UPDATE privilege on `tournament_manager_access` to authenticated, while the RLS UPDATE policy remains owner-only.
- `src/App.tsx` now saves manager assignments through the single atomic RPC and excludes the site owner from manager candidates.
- `src/TournamentManagerOperations.tsx` now preserves a completed match's status when its schedule is edited and rejects missing score fields. `src/TournamentManagerDashboard.tsx` preserves private-file cleanup warnings after reloading registration data.
- A transaction-scoped test executed the owner RPC as authenticated owner, switched to a temporary non-owner account, verified `tournament_admin`, verified groups-only permission and denial of registrations/schedule/results, then rolled back. No real manager assignment was left in production.
- Primary database now reports 78 applied migrations; repository has 58 matching SQL migration files; 20 older applied baseline files remain missing from the source tree.
- Security Advisor remains at two existing SECURITY DEFINER RPC warnings plus leaked-password protection disabled; the new save RPC is SECURITY INVOKER.


## 1 November 2026 — Registration evidence cleanup and notification policy hardening
- Migration `20261101004817_restore_registration_evidence_cleanup_for_scoped_managers` restores the Storage object path fallback for evidence cleanup after registration deletion. The fallback remains restricted to the registrations section permission; the original own-upload delete policy is preserved.
- Migration `20261101004832_scope_notification_inserts_to_authorized_manager_sections` removes the broad legacy manager notification INSERT policy and consolidates INSERT into one policy: self-notifications are allowed; manager notifications for a participant require registrations, schedule or results permission on that participant's tournament.
- The final Storage evidence policies were inspected directly in `pg_policies`; the final user_notifications policies were inspected and show one SELECT-own, one UPDATE-own and one consolidated INSERT policy.
- Primary database: 80 applied migrations. Repository: 60 SQL migration files, all version/name pairs match; 20 baseline migrations remain without SQL source files.


## 1 November 2026 — Final verification after manager permissions and storage/notification hardening
- Current fully verified implementation/docs commit: `c72b92648fdd69585aa1214d2ca9f386d0981fd3`.
- GitHub Actions run `41258413750` completed npm install, `npm run typecheck`, and `npm run build` successfully.
- Production Supabase ledger: 80 migrations; repository: 60 SQL files, all version/name pairs matched; 20 older baseline migration sources remain missing.
- Storage evidence delete fallback was restored and is limited to registration-section managers after the registration metadata is removed.
- Notification INSERT policies were consolidated; only self-notifications or managers with registrations/schedule/results permission can create notifications for the relevant participant.
- Security Advisor remains at two existing SECURITY DEFINER warnings and Leaked Password Protection disabled. Performance Advisor reports 35 unused-index INFO findings.
- PR #16 remains Draft/unmerged; no domain deployment or merge occurred. Browser E2E and live-domain verification remain outstanding.


## 1 November 2026 — Documentation consolidation and current-state reconciliation
- Created `docs/IMPLEMENTATION_REGISTER_v1.0_2026-11-01.md` as the cumulative register of implemented feature groups, partial implementations, security controls, migration state, verification evidence and open work.
- Created `docs/TECHNICAL_HANDOVER_v2.7_2026-11-01.md` as the current technical handover. It supersedes v2.6 for current status; v2.6 is retained as a historical snapshot.
- Created `docs/QA_MASTER_CHECKLIST_v1.3.md`. Its dated addendum corrects stale earlier counts and explicitly distinguishes code/DB implementation from browser E2E and deployment.
- Reconciled the primary migration ledger: 80 applied migrations, 60 SQL migration files in the repository matching the ledger, and 20 older applied baseline migrations whose SQL source files are missing.
- Reconciled GitHub state: branch HEAD `c5bc7d89d9eb3fec265dacaa4b68a5437970ef23`; PR #16 remains open, Draft and Unmerged.
- GitHub Actions workflow `Build and typecheck` run `41258556282` completed successfully on the current HEAD.
- The current HEAD follows the previously code-verified commit `c72b92648fdd69585aa1214d2ca9f386d0981fd3`; this later commit is documentation-only. No new code, schema change, production data change, merge or deployment was performed as part of this documentation update.
- Outstanding gates remain: real-browser E2E with owner/manager/player/anonymous roles, private Storage signed-URL testing, full Jalali/Tehran browser QA, 20 missing baseline SQL sources, practical negative security tests, Auth leaked-password protection, and explicit release approval.


## تکمیل ثبت وضعیت پس از یکپارچه‌سازی مستندات — ۱ نوامبر ۲۰۲۶
- آخرین HEAD بررسی‌شده پیش از این اصلاح مستندات: `24ea7b91bf3c55ed29e9a2ac37280b42e9dce5df`؛ PR #16 به همین شاخه اشاره می‌کرد.
- روی آن HEAD، GitHub Actions run `41259613218` با وضعیت `in_progress` مشاهده شد؛ بنابراین نتیجه نهایی آن در این لحظه هنوز قابل اعلام نبود.
- آخرین CI تکمیل‌شده و موفقِ قابل استناد پیش از این اجرا: run `41258556282` روی commit `c5bc7d89d9eb3fec265dacaa4b68a5437970ef23`.
- تغییرات انجام‌شده پس از commit کدِ تأییدشده، فقط مستنداتی بوده‌اند؛ هیچ فایل کد، migration، داده عملیاتی، main یا دامنه در این مرحله تغییر نکرده است.
- وضعیت CI برای هر commit جدید باید از GitHub Actions همان commit خوانده شود؛ موفقیت یک commit را نباید به commit بعدی تعمیم داد.


## 1 November 2026 — تکمیل CI پس از ثبت مستندات
- GitHub Actions run `41259613218` با عنوان `Build and typecheck` برای commit `24ea7b91bf3c55ed29e9a2ac37280b42e9dce5df` با نتیجه نهایی `success` تکمیل شد.
- پس از آن، مستندات تکمیلی در شاخه ثبت شدند؛ HEAD فعلی هنگام این یادداشت `1d5ffed466282880bea1ed3f54497f4cdbd393b5` است.
- تغییرات بین commit آزموده‌شده و HEAD این یادداشت فقط مستنداتی هستند؛ کد برنامه، migrationها و داده‌های Supabase تغییر نکرده‌اند.
- این CI موفق، آزمون TypeScript/Build را تأیید می‌کند و به معنی اجرای E2E مرورگر، انتشار یا تأیید دامنه زنده نیست.


## 1 November 2026 — Owner help center and production release safeguards
- Added `src/OwnerHelpCenter.tsx` with searchable, collapsible Persian guidance for owner roles, tournaments, registrations/evidence, manager permissions, groups, schedules/results, content, exports, maintenance, security and Tehran/Jalali time.
- Added an owner-only navigation entry and rendering guard in `src/App.tsx`; ordinary users and tournament managers do not receive the owner help section.
- The help center explicitly states that no official support contact channel has been configured; it does not invent contact details. The contextual help beside every complex control remains future work.
- Updated `.github/workflows/deploy-preview.yml`: production build now runs `npm run typecheck` before `npm run build`; deployment job is guarded to run only on `refs/heads/main`, preventing manual dispatch from a working branch from deploying to the production domain.
- Renamed workflow/job labels to identify the PLATO LAND website deployment.
- Updated root `index.html` title and description to the approved brand/tagline. Removed obsolete duplicate `public/index.html` containing a stale Prototype title.
- Rewrote README and `.env.example` to describe the actual single-primary-Supabase architecture and GitHub Pages deployment; removed misleading instructions to create a separate preview DB.
- GitHub Actions run `41260894812` passed on code commit `da9ef025dec3e2632f308dc92d5d919fd7b5ace7`: npm install, TypeScript and production build all succeeded.
- Security negative tests: owner call to `admin_list_site_users()` returned 9 rows as a count; non-owner call was denied with 42501. A non-owner attempting to withdraw a different user's registration was denied with P0002. No operational data was changed.
- Supabase organization plan is Free; current Supabase documentation says leaked password protection is available on Pro and above. No plan upgrade or additional cost was made.
- Current main remains at `4dc4dd38f3f772218318b7caa599fb141c6912a8`; last successful Pages deploy is run `41232233687` on that commit. PR #16 remains Draft/Unmerged, so the just-added features are not yet live.


## 1 November 2026 — Owner bulk operations (UI/UX 8.7)

- Added owner-only `src/OwnerBulkOperations.tsx` and an owner-only navigation entry in `src/App.tsx`.
- Added multi-select lists for tournaments, news, games and profiles. A preview step shows selected/actionable/unchanged counts and target names before explicit confirmation.
- Implemented guarded bulk publish/hide for draft/published tournaments and news, and enable/disable for games. Tournament publish excludes drafts with registration already open; ongoing/completed/cancelled tournaments are not eligible. Future-scheduled news is excluded from immediate bulk publication.
- User multi-select is present, but bulk role/account-state changes are intentionally unavailable because the current schema/client path does not provide a dedicated account status field or a safe Auth-admin operation.
- Existing row-level audit triggers capture each changed row; an additional `bulk_operations` summary is inserted into `audit_logs` and shown in OwnerAuditLog.
- Verified the owner RLS policy accepts a `bulk_update` summary insert using a simulated owner JWT inside a transaction; the transaction was rolled back. No persistent operational data changed.
- No schema migration or DDL was applied.
- Updated the GitHub Pages workflow to run TypeScript/Build on pull requests to main while retaining the deploy guard for `refs/heads/main`.
- Current code remains in PR #16 Draft/Unmerged. Build status for the new HEAD and browser E2E are not yet verified; no merge or production deploy was performed.


## 1 November 2026 — CI trigger and current review state after bulk operations

- Added `pull_request: branches: [main]` to `.github/workflows/deploy-preview.yml` so the new branch changes can be verified by GitHub Actions before merge.
- The deployment job remains guarded by `github.ref == 'refs/heads/main'`; a pull-request build cannot publish to `platoland.org`.
- PR #16 head at the start of this check was `b342a881865cd75fa2a2a3efe435345880d13d60`; Build and typecheck run `41261452485` started and was still in progress when checked.
- QA v1.4, Implementation Register v1.1 and Technical Handover v2.8 now record bulk operations, user-operation limits, audit verification and the release gate.
- README now points to the current register/handover/QA documents.
- No merge, production deploy, DB schema change or persistent operational data change was performed.


## 1 November 2026 — Successful CI for owner bulk operations

- GitHub Actions run `41261452485` completed successfully on code commit `b342a881865cd75fa2a2a3efe435345880d13d60`.
- Steps passed: `npm install`, `npm run typecheck`, `npm run build`.
- Five commits after that tested code commit changed only README/documentation files; GitHub compare confirmed no code files changed after the successful build.
- The separate Pages workflow run `41261452472` was cancelled and did not deploy the working branch.
- PR #16 remains Draft/Unmerged pending the explicit release step; no live-domain update has yet occurred.


## 1 November 2026 — Production release trigger after PR #16 merge

- PR #16 merged into `main` at merge commit `5cec7a5cc3637742802372dc6e8aac5d3b839100`.
- The code in that merge passed TypeScript and production Build in GitHub Actions run `41261452485` on code commit `b342a881865cd75fa2a2a3efe435345880d13d60`; later PR commits were documentation-only.
- This documentation-only main commit ensures the existing push-to-main Pages workflow is invoked for the merged release.
- Production deployment status must be confirmed from the resulting GitHub Actions run and live-domain response; this note does not itself assert deployment success.


---

# ثبت رسمی تکمیل بخش اول سند UI/UX v10.7 — ۱ نوامبر ۲۰۲۶

## وضعیت نهایی
- بخش: **۱ — هویت بصری و چارچوب کلی برند**
- وضعیت: **پیاده‌سازی‌شده، منتشرشده و مورد تأیید مالک سایت**
- سند مبنا: `PLATO_LAND_UI_UX_Design_Checklist_v10.7_2026-10-31.docx`
- تأیید مالک: مالک پس از مشاهده نتیجه اعلام کرد بخش اول مطابق موارد توافق‌شده درست است و آن را تأیید کرد.
- اجرای بخش دوم یا بخش‌های بعدی در این تغییر انجام نشده است؛ ادامه کار منوط به بررسی و تأیید مرحله‌ای مالک است.

## آنچه در کد تغییر کرد
- تنها فایل کد تغییرکرده در PR این مرحله: `src/styles.css`.
- اندازه تغییر PR: ۱۳ خط افزوده و ۱ خط اصلاح‌شده؛ بدون تغییر کامپوننت‌ها یا منطق برنامه.
- توکن‌های یکپارچه برند اضافه/تثبیت شدند: مشکی برند، مشکی نرم، طلایی اصلی و روشن، طلایی ملایم، رنگ متن اصلی/ثانویه، سطوح، حاشیه، حداکثر عرض محتوا، شعاع کارت و سایه برند.
- پس‌زمینه و رنگ‌بندی ریشه با مشکی عمیق برند هماهنگ شد و `color-scheme: dark` تنظیم شد.
- جهت RTL برای `html`، `body` و `.app-shell` تثبیت شد.
- فونت فارسی Vazirmatn و وراثت فونت برای کنترل‌های فرم یکپارچه شد.
- رنگ انتخاب متن با هویت طلایی تنظیم شد.
- نمایش رسانه‌ها با `max-width:100%` محدود شد تا از سرریز معمول جلوگیری شود.
- حالت فوکوس قابل مشاهده برای لینک‌ها، دکمه‌ها، ورودی‌ها، انتخاب‌گرها و عناصر دارای tabindex اضافه/یکپارچه شد.
- نشان برند و متن کوچک زیر نام برند با رنگ و جلوه متناسب با هویت طلایی اصلاح شد.
- پشتیبانی از `prefers-reduced-motion` اضافه شد تا برای کاربرانی که کاهش حرکت را در سیستم‌عامل فعال کرده‌اند، حرکت و transition به حداقل برسد.

## مواردی که عمداً در این مرحله تغییر نکردند
- ساختار صفحات، چیدمان صفحه اصلی، متن‌ها و محتوای سایت.
- منطق React/TypeScript و رفتار فرم‌ها.
- ورود و ثبت‌نام، نقش‌ها و مجوزها.
- جداول، رکوردها، Viewها، Functionها، Policyهای RLS یا Schema دیتابیس.
- فایل‌های migration و تنظیمات Supabase.
- فایل‌های Storage و مدارک ثبت‌نام.
- داده‌های مسابقات، کاربران، نتایج و تنظیمات عملیاتی.
- `localStorage` و `sessionStorage`؛ هیچ کد ذخیره‌سازی مرورگری در این PR اضافه یا اصلاح نشد.

## پاسخ رسمی درباره دیتابیس و حافظه مرورگر
این مرحله **یک تغییر CSS/ظاهر است**؛ بنابراین خود بخش اول نه به دیتابیس متصل می‌شود و نه چیزی در حافظه مرورگر ذخیره می‌کند. هیچ درخواست دیتابیسی یا عملیات ذخیره‌سازی از طرف این تغییر انجام نشده است.

معماری موجود کل سایت مستقل از این مرحله است: فایل `src/supabase.ts` کلاینت را به تنها پروژه اصلی Supabase با شناسه `dfrppbapaaydbjeflozw` متصل می‌کند. تنظیم `auth.persistSession: true` برای ماندگاری نشست ورود Supabase Auth در مرورگر است؛ این موضوع با ذخیره‌کردن داده‌های عملیاتی مسابقات در حافظه مرورگر فرق دارد. داده عملیاتی پروژه باید در Supabase نگهداری شود و این مرحله هیچ تغییری در آن معماری ایجاد نکرده است. دیتابیس دوم یا preview/test در این مرحله ساخته یا استفاده نشده است.

## مسیر انتشار و شواهد
- Repository: `Omidso82/Plato-land-preview`
- شاخه پیاده‌سازی: `implementation/uiux-v10-7-section-01-visual-identity`
- Pull Request: [#18](https://github.com/Omidso82/Plato-land-preview/pull/18) — بسته و Merge شده.
- Merge commit روی `main`: `8ff37ce6f29fabfd8e549b5c07b1f107d07f7c05`.
- فایل‌های تغییرکرده در PR: ۱ فایل، `src/styles.css`.
- CI مربوط به PR: run [41263001222](https://github.com/Omidso82/Plato-land-preview/actions/runs/41263001222) — TypeScript و Build موفق.
- انتشار main: run [41263064811](https://github.com/Omidso82/Plato-land-preview/actions/runs/41263064811) — jobهای build و deploy هر دو با نتیجه success؛ TypeScript، ساخت نسخه production، بارگذاری Pages و Deploy به دامنه تکمیل شدند.
- دامنه: [https://platoland.org](https://platoland.org).

## سطح آزمون و پذیرش
- [x] محدود بودن تغییر کد به فایل CSS.
- [x] عدم تغییر دیتابیس، migration و داده عملیاتی در PR.
- [x] موفقیت TypeScript و Build در CI.
- [x] موفقیت job انتشار GitHub Pages.
- [x] مشاهده نتیجه توسط مالک و تأیید بخش اول.
- [ ] آزمون رسمی ماتریسی و ثبت‌شده روی چند مرورگر/اندازه صفحه و دستگاه؛ این مورد جدا از تأیید مالک است و نباید صرفاً از موفقیت Build نتیجه‌گیری شود.
- [ ] آزمون کامل E2E نقش‌ها و گردش‌های دیتابیس؛ خارج از دامنه بخش اول.

## قاعده ادامه
بخش اول بسته و تأییدشده است. بخش دوم تا زمانی که محتوای همان بخش از سند مرجع جداگانه ارائه و از سوی مالک بررسی/تأیید نشود، شروع نمی‌شود. PR قدیمی #17 همچنان Draft و جدا از این انتشار است و نباید به‌عنوان بخشی از این انتشار معرفی شود.
