import { supabase } from './supabase';

export const series3MediaUrl = (asset: string) => '/api/series3-media?asset=' + encodeURIComponent(asset);

export async function uploadSeries3Media(asset: string, file: File): Promise<void> {
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
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'ذخیره فایل در R2 ناموفق بود.');
}

export async function uploadTemporaryMedia(asset: string, file: File): Promise<void> {
  if (!supabase) throw new Error('اتصال به حساب مدیریت در دسترس نیست.');
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error('نشست معتبر مالک پیدا نشد.');
  const form = new FormData();
  form.set('file', file, file.name);
  const response = await fetch('/api/series3-media?asset=' + encodeURIComponent(asset), {
    method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: form, credentials: 'same-origin',
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'ذخیره فایل در R2 ناموفق بود.');
}
