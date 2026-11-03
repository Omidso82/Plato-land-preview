import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';

const BUCKET = 'series2-slides';
const LOGO_PATH = 'slides/branding-logo';
const MAX_BYTES = 10 * 1024 * 1024;

export default function SiteLogoManager() {
  const [checking, setChecking] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [owner, setOwner] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [version, setVersion] = useState('');

  const logoUrl = supabase
    ? supabase.storage.from(BUCKET).getPublicUrl(LOGO_PATH).data.publicUrl
    : '';

  async function verifyOwner() {
    if (!supabase) {
      setMessage('اتصال به سرویس ذخیره‌سازی آماده نیست.');
      setChecking(false);
      return;
    }
    setChecking(true);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      setSignedIn(false);
      setOwner(false);
      setChecking(false);
      return;
    }
    setSignedIn(true);
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
    const allowed = !error && data?.role === 'owner';
    setOwner(allowed);
    setChecking(false);
    if (!allowed) setMessage('این بخش فقط برای حساب مالک کل فعال است.');
  }

  useEffect(() => { void verifyOwner(); }, []);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setMessage('ورود ناموفق بود: ' + error.message);
    else {
      setPassword('');
      await verifyOwner();
    }
    setBusy(false);
  }

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function uploadLogo() {
    if (!supabase || !file || !owner || busy) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setMessage('فرمت مجاز لوگو JPG، PNG یا WEBP است.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setMessage('حجم تصویر باید حداکثر ۱۰ مگابایت باشد. تصویر اصلی را بدون کوچک‌سازی انتخاب کن.');
      return;
    }
    setBusy(true);
    setMessage('در حال بارگذاری تصویر اصلی لوگو…');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('نشست مالک معتبر نیست؛ دوباره وارد شو.');
      const { error } = await supabase.storage.from(BUCKET).upload(LOGO_PATH, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: '0',
      });
      if (error) throw error;
      setVersion(String(Date.now()));
      setFile(null);
      const input = document.getElementById('site-logo-file') as HTMLInputElement | null;
      if (input) input.value = '';
      setMessage('لوگوی اصلی ذخیره شد. برای مشاهدهٔ نسخهٔ تازه، صفحهٔ اصلی را یک‌بار تازه‌سازی کن.');
    } catch (error) {
      setMessage('بارگذاری لوگو انجام نشد: ' + (error instanceof Error ? error.message : 'خطای ناشناخته'));
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await supabase?.auth.signOut();
    setSignedIn(false);
    setOwner(false);
    setFile(null);
  }

  const shell: React.CSSProperties = { minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%,#292216 0,#111214 48%,#090a0c 100%)', color: '#f4f0e8', padding: '28px 16px', fontFamily: 'inherit' };
  const panel: React.CSSProperties = { maxWidth: 760, margin: '30px auto', padding: 24, border: '1px solid #705b31', borderRadius: 16, background: '#171819', boxShadow: '0 20px 70px #0008' };
  const field: React.CSSProperties = { display: 'block', width: '100%', marginTop: 7, background: '#101113', border: '1px solid #6a5a37', borderRadius: 8, color: '#fff', padding: 12 };
  const muted: React.CSSProperties = { color: '#c9c4b8', fontSize: 13, lineHeight: 1.9 };
  const primary: React.CSSProperties = { background: 'linear-gradient(120deg,#a98239,#e4c77e)', border: '1px solid #e3c77d', borderRadius: 9, color: '#17130b', padding: '12px 18px', fontWeight: 700, cursor: 'pointer' };

  if (checking) return <main dir="rtl" style={shell}><section style={panel}>در حال بررسی دسترسی مالک…</section></main>;
  if (!signedIn) return <main dir="rtl" style={shell}><section style={panel}>
    <h1 style={{ color: '#f6e8c5', fontSize: 24, margin: '0 0 8px' }}>مدیریت لوگوی اصلی سایت</h1>
    <p style={muted}>ورود امن مالک برای بارگذاری لوگوی صفحهٔ اصلی.</p>
    <form onSubmit={login} style={{ display: 'grid', gap: 12 }}>
      <label style={muted}>ایمیل حساب مالک<input style={field} type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label style={muted}>رمز عبور<input style={field} type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
      <button style={primary} disabled={busy}>{busy ? 'در حال ورود…' : 'ورود امن'}</button>
    </form>
    {message && <p role="alert" style={muted}>{message}</p>}
  </section></main>;
  if (!owner) return <main dir="rtl" style={shell}><section style={panel}><h1>دسترسی غیرمجاز</h1><p style={muted}>این ابزار فقط در اختیار مالک کل است.</p><button style={primary} onClick={signOut}>خروج</button></section></main>;

  return <main dir="rtl" style={shell}><section style={panel}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <div><h1 style={{ color: '#f6e8c5', fontSize: 24, margin: '0 0 8px' }}>مدیریت لوگوی اصلی PLATO LAND</h1><p style={muted}>این تصویر مستقل از اسلایدهاست و در جایگاه لوگوی صفحهٔ اول سایت نمایش داده می‌شود.</p></div>
      <button style={{ ...primary, background: '#252525', color: '#ddd', borderColor: '#555' }} onClick={signOut}>خروج از پنل</button>
    </div>
    <div style={{ marginTop: 20, padding: 16, border: '1px solid #51452d', borderRadius: 12, background: '#101113' }}>
      <div style={{ color: '#d9b65d', fontWeight: 700, marginBottom: 10 }}>پیش‌نمایش لوگوی فعلی</div>
      <img key={version} src={logoUrl + (version ? '?v=' + version : '')} alt="لوگوی فعلی PLATO LAND" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} style={{ display: 'block', width: 'min(100%,360px)', maxHeight: 360, objectFit: 'contain', margin: 'auto', background: '#090a0c', borderRadius: 8 }} />
      <p style={muted}>تصویر با وضوح اصلی ذخیره می‌شود؛ هیچ کوچک‌سازی یا فشرده‌سازی خودکاری انجام نمی‌شود.</p>
    </div>
    <label style={{ ...muted, display: 'block', marginTop: 18 }}>انتخاب فایل لوگوی اصلی (JPG، PNG یا WEBP)
      <input id="site-logo-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setFile(e.target.files?.[0] || null)} style={field} />
    </label>
    {file && <p style={muted}>فایل انتخاب‌شده: {file.name} · {(file.size / 1024 / 1024).toFixed(2)} مگابایت</p>}
    <button style={{ ...primary, width: '100%', marginTop: 10 }} disabled={!file || busy} onClick={() => void uploadLogo()}>{busy ? 'در حال بارگذاری…' : 'ذخیره و جایگزینی لوگوی سایت'}</button>
    <p role="status" style={{ ...muted, marginTop: 14 }}>{message || 'حداکثر حجم فایل: ۱۰ مگابایت. فایل جدید جایگزین لوگوی قبلی می‌شود.'}</p>
  </section></main>;
}
