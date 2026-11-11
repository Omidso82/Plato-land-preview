import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';

type UploadRow = {
  id: string;
  operator_id: string;
  storage_path: string;
  file_name: string;
  content_type: string;
  file_size: number;
  created_at: string;
};

const BUCKET = 'plato-id-scans';
const MAX_BYTES = 15 * 1024 * 1024;
const ACCEPTED = new Set(['image/jpeg', 'image/png', 'image/webp']);

async function validateImage(file: File): Promise<void> {
  if (!ACCEPTED.has(file.type)) throw new Error('فقط JPG، PNG و WEBP مجاز هستند.');
  if (!file.size || file.size > MAX_BYTES) throw new Error('حجم هر تصویر باید حداکثر ۱۵ مگابایت باشد.');
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const png = bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v);
  const jpg = bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp = bytes.length >= 12 && String.fromCharCode(...bytes.slice(0,4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8,12)) === 'WEBP';
  const actual = png ? 'image/png' : jpg ? 'image/jpeg' : webp ? 'image/webp' : '';
  if (actual !== file.type) throw new Error('ساختار فایل با فرمت اعلام‌شده مطابقت ندارد.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve,reject) => {
      image.onload = () => image.naturalWidth && image.naturalHeight ? resolve() : reject(new Error('ابعاد تصویر معتبر نیست.'));
      image.onerror = () => reject(new Error('فایل تصویر قابل خواندن نیست.'));
      image.src = url;
    });
  } finally { URL.revokeObjectURL(url); }
}

export default function PlatoIdImageUpload() {
  const [userId,setUserId] = useState('');
  const [isOwner,setIsOwner] = useState(false);
  const [deleting,setDeleting] = useState('');
  const [rows,setRows] = useState<UploadRow[]>([]);
  const [files,setFiles] = useState<File[]>([]);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState('در حال بارگذاری سوابق تصاویر…');

  const refresh = useCallback(async () => {
    if (!supabase) { setMessage('اتصال به دیتابیس برقرار نیست.'); return; }
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) { setMessage('نشست مالک معتبر نیست؛ دوباره وارد پنل شو.'); return; }
    const { data: role, error: roleError } = await supabase.rpc('current_user_role');
    const owner = !roleError && (role === 'owner' || role === 'مالک کل');
    if (!owner) {
      const {data:access,error:accessError}=await supabase.from('plato_id_scanner_access').select('status').eq('user_id',auth.user.id).maybeSingle();
      if (accessError || access?.status !== 'approved') { setMessage('دسترسی اپراتور تأیید نشده یا غیرفعال است.'); return; }
    }
    setIsOwner(owner);
    setUserId(auth.user.id);
    const { data, error } = await supabase.from('plato_id_scanner_uploads')
      .select('id,operator_id,storage_path,file_name,content_type,file_size,created_at')
      .order('created_at',{ascending:false}).limit(200);
    if (error) { setMessage('خواندن فهرست تصاویر ناموفق بود: '+error.message); return; }
    setRows((data || []) as UploadRow[]);
    setMessage((data || []).length ? 'تصاویر قبلی از دیتابیس بارگذاری شدند.' : 'هنوز تصویری بارگذاری نشده است.');
  },[]);

  useEffect(() => { void refresh(); },[refresh]);

  async function choose(list: FileList | null) {
    setFiles([]);
    if (!list?.length) return;
    setBusy(true); setMessage('در حال بررسی تصاویر انتخاب‌شده…');
    const valid: File[] = [], errors: string[] = [];
    for (const file of Array.from(list)) {
      try { await validateImage(file); valid.push(file); }
      catch (e) { errors.push(file.name+': '+(e instanceof Error ? e.message : 'فایل نامعتبر')); }
    }
    setFiles(valid);
    setMessage((valid.length ? valid.length+' تصویر آماده ذخیره است. ' : '') + errors.join(' | '));
    setBusy(false);
  }

  async function removeImage(row:UploadRow) {
    if(!supabase||busy||deleting)return;
    if(!window.confirm('تصویر «'+row.file_name+'» برای همیشه حذف شود؟'))return;
    setDeleting(row.id);setMessage('در حال حذف تصویر…');
    try {
      const stored=await supabase.storage.from(BUCKET).remove([row.storage_path]);
      if(stored.error)throw stored.error;
      const removed=await supabase.from('plato_id_scanner_uploads').delete().eq('id',row.id);
      if(removed.error)throw removed.error;
      setRows(old=>old.filter(item=>item.id!==row.id));
      setMessage('تصویر از فضای ذخیره‌سازی و فهرست دیتابیس حذف شد.');
    } catch(e) { setMessage('حذف کامل نشد: '+(e instanceof Error?e.message:'خطای ناشناخته')); }
    finally {setDeleting('');}
  }

  async function upload() {
    if (!supabase || !userId || !files.length || busy) return;
    setBusy(true); setMessage('در حال ذخیره تصاویر…');
    const succeeded: UploadRow[] = [], failures: string[] = [];
    for (const file of files) {
      const id = crypto.randomUUID();
      const base = (file.name.replace(/[^A-Za-z0-9_-]/g,'_').replace(/_+/g,'_').replace(/^_+|_+$/g,'').slice(0,100) || 'image');
      const ext = file.type === 'image/jpeg' ? '.jpg' : file.type === 'image/png' ? '.png' : '.webp';
      const path = userId+'/'+id+'/'+base+ext;
      try {
        const stored = await supabase.storage.from(BUCKET).upload(path,file,{upsert:false,contentType:file.type});
        if (stored.error) throw stored.error;
        const saved = await supabase.from('plato_id_scanner_uploads').insert({
          id, operator_id:userId, storage_path:path, file_name:file.name,
          content_type:file.type, file_size:file.size, status:'uploaded'
        }).select('id,operator_id,storage_path,file_name,content_type,file_size,created_at').single();
        if (saved.error) {
          await supabase.storage.from(BUCKET).remove([path]);
          throw saved.error;
        }
        succeeded.push(saved.data as UploadRow);
      } catch (e) {
        failures.push(file.name+': '+(e instanceof Error ? e.message : 'خطای ذخیره‌سازی'));
      }
    }
    setFiles([]);
    const input = document.getElementById('plato-active-id-images') as HTMLInputElement | null;
    if (input) input.value = '';
    await refresh();
    setMessage((succeeded.length ? succeeded.length+' تصویر با موفقیت ذخیره شد. ' : '') +
      (failures.length ? 'موارد ناموفق: '+failures.join(' | ') : ''));
    setBusy(false);
  }

  return <section dir="rtl" style={{marginTop:20,padding:16,border:'1px solid #b18b45',borderRadius:14,background:'linear-gradient(145deg,#211b12,#111214)'}}>
    <h2 style={{color:'#f6e8c5',fontSize:19,margin:'0 0 8px'}}>تصاویر Plato IDهای فعال</h2>
    <p style={{color:'#a9a08e',fontSize:11}}>منطقه زمانی دسته‌بندی: ایران · {isOwner?'نمایش تصاویر همه اپراتورها':'نمایش تصاویر حساب خودت'}</p>
    <p style={{color:'#c9c4b8',fontSize:13,lineHeight:1.9}}>چند تصویر را انتخاب و ذخیره کن. هر تصویر جداگانه ثبت می‌شود؛ بارگذاری‌های بعدی تصاویر قبلی را جایگزین نمی‌کنند.</p>
    <label style={{display:'block',color:'#c9c4b8',fontSize:13,marginTop:12}}>انتخاب تصاویر (JPG، PNG یا WEBP)
      <input id="plato-active-id-images" type="file" multiple accept="image/jpeg,image/png,image/webp"
        onChange={e=>void choose(e.target.files)} style={{display:'block',width:'100%',marginTop:8,color:'#eee'}}/>
    </label>
    {files.length>0 && <ul style={{color:'#ddd',fontSize:12,lineHeight:2}}>{files.map((f,i)=><li key={f.name+'-'+i}>{f.name} · {(f.size/1024/1024).toFixed(2)} MB</li>)}</ul>}
    <button type="button" disabled={!files.length||busy} onClick={()=>void upload()}
      style={{width:'100%',marginTop:10,background:'linear-gradient(120deg,#a98239,#e4c77e)',border:'1px solid #e3c77d',borderRadius:9,color:'#17130b',padding:'12px 18px',fontWeight:700}}>
      {busy?'لطفاً صبر کن…':'ذخیره تصاویر انتخاب‌شده'}
    </button>
    <p role="status" style={{color:'#d8c99f',fontSize:12,marginTop:10}}>{message}</p>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(145px,1fr))',gap:12,marginTop:14}}>
      {groupUploadsByIranianDay(rows).map(group=><React.Fragment key={group.key}><div style={{gridColumn:'1 / -1',color:'#e4c77e',fontWeight:700,fontSize:13,padding:'8px 2px 2px',borderBottom:'1px solid #51452d'}}>{group.label} · {group.rows.length.toLocaleString('fa-IR')} تصویر</div>{group.rows.map(row=><SavedImage key={row.id} row={row} canDelete={isOwner||row.operator_id===userId} deleting={deleting===row.id} onDelete={()=>void removeImage(row)}/>)}</React.Fragment>)}
    </div>
  </section>;
}

function SavedImage({row,canDelete,deleting,onDelete}:{row:UploadRow;canDelete:boolean;deleting:boolean;onDelete:()=>void}) {
  const [url,setUrl] = useState('');
  useEffect(()=>{
    let alive = true;
    if (!supabase) return;
    supabase.storage.from(BUCKET).createSignedUrl(row.storage_path,3600)
      .then(({data,error})=>{if(alive&&!error)setUrl(data?.signedUrl||'');});
    return ()=>{alive=false;};
  },[row.storage_path]);
  return <article style={{background:'#101113',border:'1px solid #51452d',borderRadius:10,padding:8,minWidth:0}}>
    {url ? <a href={url} target="_blank" rel="noreferrer"><img src={url} alt={row.file_name} style={{width:'100%',height:130,objectFit:'contain',background:'#08090a',borderRadius:6}}/></a>
      : <div style={{height:130,display:'grid',placeItems:'center',color:'#aaa',fontSize:12}}>در حال آماده‌سازی تصویر…</div>}
    <strong style={{display:'block',color:'#eee',fontSize:11,overflowWrap:'anywhere',marginTop:7}}>{row.file_name}</strong>
    <small style={{color:'#aaa',fontSize:10,display:'block'}}>{new Intl.DateTimeFormat('fa-IR-u-ca-persian',{timeZone:'Asia/Tehran',dateStyle:'full',timeStyle:'short'}).format(new Date(row.created_at))}</small>
    {canDelete&&<button type="button" disabled={deleting} onClick={onDelete} style={{width:'100%',marginTop:8,padding:'7px 9px',borderRadius:7,border:'1px solid #8a3f36',background:'#321b19',color:'#ffd8d2',fontSize:11}}>{deleting?'در حال حذف…':'حذف تصویر'}</button>}
  </article>;
}


function groupUploadsByIranianDay(rows:UploadRow[]) {
  const groups = new Map<string,{key:string;label:string;rows:UploadRow[]}>();
  for (const row of rows) {
    const date = new Date(row.created_at);
    const parts = new Intl.DateTimeFormat('en-US-u-ca-persian',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
    const part = (type:string) => parts.find(item=>item.type===type)?.value || '';
    const key = part('year')+'-'+part('month')+'-'+part('day');
    const label = new Intl.DateTimeFormat('fa-IR-u-ca-persian',{timeZone:'Asia/Tehran',dateStyle:'full'}).format(date);
    if(!groups.has(key))groups.set(key,{key,label,rows:[]});
    groups.get(key)!.rows.push(row);
  }
  return Array.from(groups.values()).sort((a,b)=>b.key.localeCompare(a.key));
}
