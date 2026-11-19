/**
 * Public-media URL resolver for PLATO LAND – Temporary Projects.
 *
 * R2 bucket: plato-land-media
 * Public delivery host (approved): media.platoland.org
 * Object-key root (approved): plato-land/
 *
 * This helper deliberately does not list objects, upload files, sign URLs,
 * or fall back to Supabase Storage. Callers must supply a verified object key.
 */
export const R2_MEDIA_BASE_URL = 'https://media.platoland.org';
export const R2_MEDIA_KEY_ROOT = 'plato-land/';

const SAFE_SEGMENT = /^[a-z0-9][a-z0-9._-]*$/;

export function r2PublicMediaUrl(objectKey: string): string {
  const key = objectKey.trim();

  if (!key.startsWith(R2_MEDIA_KEY_ROOT)) {
    throw new Error('R2 media key must start with the approved plato-land/ root.');
  }

  const segments = key.split('/');
  if (
    segments.length < 3 ||
    segments.some((segment, index) =>
      index === 0
        ? segment !== 'plato-land'
        : !segment || segment === '.' || segment === '..' || !SAFE_SEGMENT.test(segment)
    )
  ) {
    throw new Error('R2 media key contains an invalid path segment.');
  }

  return `${R2_MEDIA_BASE_URL}/${segments.map(encodeURIComponent).join('/')}`;
}
