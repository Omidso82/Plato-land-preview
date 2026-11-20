import { supabase } from './supabase';

const RULES_VIDEO_PREFIX =
  'plato-land/backgammon/series-3/public-media/videos/important-rules-';

const MEDIA_API =
  'https://plato-land-media-pages.pages.dev/api/series3-media?asset=rules';

export function isSeries3RulesVideoKey(key: string): boolean {
  return /^plato-land\/backgammon\/series-3\/public-media\/videos\/important-rules-\d{13}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.mp4$/.test(key);
}

export const series3RulesVideoUrl = (key: string) =>
  MEDIA_API + '&key=' + encodeURIComponent(key);

export async function uploadSeries3RulesVideo(file: File): Promise<string> {
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
  const uploaded = await fetch(MEDIA_API, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token },
    body: form,
    credentials: 'omit',
    mode: 'cors',
    cache: 'no-store',
  });
  const result = await uploaded.json().catch(() => ({}));
  if (!uploaded.ok) throw new Error(result.error || 'ذخیره فایل در R2 ناموفق بود.');
  if (
    result.asset !== 'rules' ||
    result.size !== file.size ||
    typeof result.key !== 'string' ||
    !isSeries3RulesVideoKey(result.key) ||
    !result.key.startsWith(RULES_VIDEO_PREFIX)
  ) {
    throw new Error('پاسخ ذخیره‌سازی R2 با قرارداد کلید نسخه‌دار مطابقت ندارد.');
  }

  const url = series3RulesVideoUrl(result.key);
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
  return result.key;
}
