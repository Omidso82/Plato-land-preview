const MEDIA_API = 'https://plato-land-media-pages.pages.dev/api/series3-media';

export async function deleteR2Media(
  asset: 'series2-poster' | 'poster' | 'teaser' | 'rules',
  accessToken: string,
  key?: string,
): Promise<{ key: string; alreadyMissing?: boolean }> {
  if (!accessToken) throw new Error('نشست معتبر مالک پیدا نشد.');
  if ((asset === 'teaser' || asset === 'rules') && !key) throw new Error('کلید دقیق فایل تیزر مشخص نیست.');
  const url = new URL(MEDIA_API);
  url.searchParams.set('asset', asset);
  if (key) url.searchParams.set('key', key);
  const response = await fetch(url.toString(), {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + accessToken },
    credentials: 'omit',
    mode: 'cors',
    cache: 'no-store',
  });
  const result = await response.json().catch(() => ({}));
  if (response.status === 404) {
    return { key: typeof result.key === 'string' ? result.key : key || '', alreadyMissing: true };
  }
  if (!response.ok || result.ok !== true || result.deleted !== true || typeof result.key !== 'string') {
    throw new Error(result.error || 'حذف فایل از Cloudflare R2 تأیید نشد.');
  }
  return { key: result.key };
}
