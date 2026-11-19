import { supabase } from './supabase';

// Set this only to the verified hostname of the dedicated media-only Pages project.
// Do not point it at platoland.org until that domain actually serves the Pages Function.
const MEDIA_API_BASE = (import.meta.env.VITE_PLATO_MEDIA_API_BASE || '').replace(/\/$/, '');
export const series3RulesVideoUrl = () => {
  if (!MEDIA_API_BASE) throw new Error('مسیر سرویس رسانه R2 هنوز در محیط انتشار تنظیم نشده است.');
  return MEDIA_API_BASE + '/api/series3-rules-video';
};

export async function uploadSeries3RulesVideo(file: File): Promise<void> {
  if (!supabase) throw new Error('اتصال به حساب مدیریت در دسترس نیست.');
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error('نشست معتبر مالک پیدا نشد.');
  const form = new FormData();
  form.set('file', file, file.name);
  const url = series3RulesVideoUrl();
  const uploaded = await fetch(url, {
    method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: form,
    credentials: 'omit', mode: 'cors', cache: 'no-store',
  });
  const result = await uploaded.json().catch(() => ({}));
  if (!uploaded.ok) throw new Error(result.error || 'ذخیره فایل در R2 ناموفق بود.');
  if (result.size !== file.size) throw new Error('حجم فایل ذخیره‌شده در R2 مطابقت ندارد.');
  const checked = await fetch(url, { method: 'HEAD', credentials: 'omit', mode: 'cors', cache: 'no-store' });
  if (!checked.ok) throw new Error('آپلود انجام شد، اما بررسی مجدد فایل در R2 ناموفق بود.');
  const storedSize = Number(checked.headers.get('Content-Length') || '0');
  const storedType = (checked.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
  if (storedSize !== file.size || storedType !== 'video/mp4') throw new Error('تأیید نهایی حجم یا نوع فایل در R2 ناموفق بود.');
}
