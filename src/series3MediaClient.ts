import { supabase } from './supabase';

export const series3MediaUrl = (asset: string) => '/api/series3-media?asset=' + encodeURIComponent(asset);

async function uploadAndVerify(asset: string, file: File): Promise<void> {
  if (!supabase) throw new Error('اتصال به حساب مدیریت در دسترس نیست.');
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error('نشست معتبر مالک پیدا نشد.');

  const form = new FormData();
  form.set('file', file, file.name);
  const response = await fetch(series3MediaUrl(asset), {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token },
    body: form,
    credentials: 'same-origin',
    cache: 'no-store',
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'ذخیره فایل در R2 ناموفق بود.');
  if (result.size !== file.size) {
    throw new Error('حجم ثبت‌شده در R2 با فایل انتخاب‌شده مطابقت ندارد؛ ذخیره نهایی تأیید نشد.');
  }

  // A successful PUT response alone is not acceptance: independently read
  // the same allowlisted slot back from R2 before the panel reports success.
  const verification = await fetch(series3MediaUrl(asset), {
    method: 'HEAD',
    headers: { Authorization: 'Bearer ' + token },
    credentials: 'same-origin',
    cache: 'no-store',
  });
  if (!verification.ok) {
    throw new Error('فایل ارسال شد، اما بررسی مجدد آن در R2 موفق نبود؛ ذخیره نهایی تأیید نشد.');
  }
  const storedSize = Number(verification.headers.get('Content-Length') || '0');
  const storedType = (verification.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
  if (storedSize !== file.size || storedType !== file.type.toLowerCase()) {
    throw new Error('مشخصات فایل ذخیره‌شده در R2 با فایل انتخاب‌شده مطابقت ندارد؛ ذخیره نهایی تأیید نشد.');
  }
}

export async function uploadSeries3Media(asset: string, file: File): Promise<void> {
  return uploadAndVerify(asset, file);
}

export async function uploadTemporaryMedia(asset: string, file: File): Promise<void> {
  return uploadAndVerify(asset, file);
}
