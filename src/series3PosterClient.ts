import { supabase } from './supabase';

const MEDIA_API = 'https://plato-land-media-pages.pages.dev/api/series3-media?asset=poster';
export const SERIES3_POSTER_KEY = 'plato-land/backgammon/series-3/public-media/poster/main-poster';

export function isSeries3PosterKey(key: string): boolean {
  return key === SERIES3_POSTER_KEY;
}

export function series3PosterUrl(): string {
  return MEDIA_API;
}

export async function uploadSeries3Poster(file: File): Promise<string> {
  if (!supabase) throw new Error('اتصال به حساب مدیریت در دسترس نیست.');
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size <= 0 || file.size > 10 * 1024 * 1024) {
    throw new Error('فرمت پوستر باید JPG، PNG یا WEBP و حجم آن حداکثر ۱۰ مگابایت باشد.');
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
  if (!uploaded.ok) throw new Error(result.error || 'ذخیره پوستر در Cloudflare R2 ناموفق بود.');
  if (result.asset !== 'poster' || result.size !== file.size || result.key !== SERIES3_POSTER_KEY) {
    throw new Error('پاسخ ذخیره‌سازی R2 با کلید ثابت و مجاز پوستر سری سوم مطابقت ندارد.');
  }

  const checked = await fetch(MEDIA_API, {
    method: 'HEAD',
    credentials: 'omit',
    mode: 'cors',
    cache: 'no-store',
  });
  if (!checked.ok) throw new Error('آپلود انجام شد، اما بررسی مجدد پوستر در R2 ناموفق بود.');
  const storedSize = Number(checked.headers.get('Content-Length') || '0');
  const storedType = (checked.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
  if (storedSize !== file.size || !['image/jpeg', 'image/png', 'image/webp'].includes(storedType)) {
    throw new Error('تأیید نهایی حجم یا نوع فایل پوستر در R2 ناموفق بود.');
  }
  return result.key;
}
