import { supabase } from './supabase';

export const SERIES3_RULES_VIDEO_KEY =
  'plato-land/backgammon/series-3/public-media/videos/important-rules.mp4';

// This hostname belongs to the existing, separately deployed media-only Pages project.
// The deployed function already allowlists the fixed "rules" asset and uses PLATO_MEDIA_BUCKET.
const MEDIA_API =
  'https://plato-land-media-endpoint.pages.dev/api/series3-media?asset=rules';

export const series3RulesVideoUrl = () => MEDIA_API;

export async function uploadSeries3RulesVideo(file: File): Promise<void> {
  if (!supabase) throw new Error('اتصال به حساب مدیریت در دسترس نیست.');
  if (file.type !== 'video/mp4' || file.size <= 0 || file.size > 100 * 1024 * 1024) {
    throw new Error('فقط فایل MP4 غیرخالی با حجم حداکثر ۱۰۰ مگابایت مجاز است.');
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error('نشست معتبر مالک پیدا نشد.');

  const form = new FormData();
  form.set('file', file, file.name);
  const url = series3RulesVideoUrl();
  const uploaded = await fetch(url, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token },
    body: form,
    credentials: 'omit',
    mode: 'cors',
    cache: 'no-store',
  });
  const result = await uploaded.json().catch(() => ({}));
  if (!uploaded.ok) throw new Error(result.error || 'ذخیره فایل در R2 ناموفق بود.');
  if (result.asset !== 'rules' || result.size !== file.size) {
    throw new Error('پاسخ ذخیره‌سازی R2 با فایل انتخاب‌شده مطابقت ندارد.');
  }

  const checked = await fetch(url, {
    method: 'HEAD',
    credentials: 'omit',
    mode: 'cors',
    cache: 'no-store',
  });
  if (!checked.ok) throw new Error('آپلود انجام شد، اما بررسی مجدد فایل در R2 ناموفق بود.');
  const storedSize = Number(checked.headers.get('Content-Length') || '0');
  const storedType = (checked.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
  if (storedSize !== file.size || storedType !== 'video/mp4') {
    throw new Error('تأیید نهایی حجم یا نوع فایل در R2 ناموفق بود.');
  }
}
