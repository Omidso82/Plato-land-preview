import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { formatIranDateTime, formatIranJalaliDateInput, formatIranClockInput, iranJalaliDateTimeToIso } from './iranDate';
import { CalendarClock, CheckCircle2, ClipboardList, FileText, Pencil, Plus, Save, Trash2 } from 'lucide-react';

type Note = { id:string; title:string; body:string; priority:'low'|'normal'|'high'; updated_at:string };
type Task = { id:string; title:string; description:string; due_at:string|null; status:'pending'|'in_progress'|'done'; priority:'low'|'normal'|'high'; updated_at:string };
const priorityLabel={low:'کم',normal:'معمولی',high:'زیاد'};
const statusLabel={pending:'در انتظار',in_progress:'در حال انجام',done:'انجام‌شده'};

export default function OwnerWorkspace(){
 const [notes,setNotes]=useState<Note[]>([]);
 const [tasks,setTasks]=useState<Task[]>([]);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [noteId,setNoteId]=useState('');
 const [noteTitle,setNoteTitle]=useState('');
 const [noteBody,setNoteBody]=useState('');
 const [notePriority,setNotePriority]=useState<Note['priority']>('normal');
 const [taskId,setTaskId]=useState('');
 const [taskTitle,setTaskTitle]=useState('');
 const [taskDescription,setTaskDescription]=useState('');
 const [taskPriority,setTaskPriority]=useState<Task['priority']>('normal');
 const [taskStatus,setTaskStatus]=useState<Task['status']>('pending');
 const [dueDate,setDueDate]=useState('');
 const [dueTime,setDueTime]=useState('');

 const load=useCallback(async()=>{
  if(!supabase){setLoading(false);setError('اتصال به پایگاه داده برقرار نیست.');return;}
  setLoading(true);setError('');
  try{
   const [n,t]=await Promise.all([
    supabase.from('owner_private_notes').select('id,title,body,priority,updated_at').order('updated_at',{ascending:false}),
    supabase.from('owner_admin_tasks').select('id,title,description,due_at,status,priority,updated_at').order('due_at',{ascending:true,nullsFirst:false}).order('updated_at',{ascending:false})
   ]);
   if(n.error)throw n.error;if(t.error)throw t.error;
   setNotes((n.data||[]) as Note[]);setTasks((t.data||[]) as Task[]);
  }catch(e:any){setError(e?.message||'بارگذاری یادداشت‌ها و وظایف ناموفق بود.');}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load();},[load]);

 function resetNote(){setNoteId('');setNoteTitle('');setNoteBody('');setNotePriority('normal');}
 function resetTask(){setTaskId('');setTaskTitle('');setTaskDescription('');setTaskPriority('normal');setTaskStatus('pending');setDueDate('');setDueTime('');}
 function editNote(n:Note){setNoteId(n.id);setNoteTitle(n.title);setNoteBody(n.body);setNotePriority(n.priority);}
 function editTask(t:Task){setTaskId(t.id);setTaskTitle(t.title);setTaskDescription(t.description);setTaskPriority(t.priority);setTaskStatus(t.status);setDueDate(t.due_at?formatIranJalaliDateInput(t.due_at):'');setDueTime(t.due_at?formatIranClockInput(t.due_at):'');}

 async function saveNote(e:React.FormEvent){
  e.preventDefault();if(!supabase)return;if(!noteTitle.trim()){setError('عنوان یادداشت الزامی است.');return;}
  setBusy(true);setError('');
  try{
   const {data:{user},error:authError}=await supabase.auth.getUser();if(authError)throw authError;if(!user)throw new Error('نشست مالک معتبر نیست.');
   const payload={title:noteTitle.trim(),body:noteBody.trim(),priority:notePriority,created_by:user.id,updated_at:new Date().toISOString()};
   const result=noteId?await supabase.from('owner_private_notes').update(payload).eq('id',noteId):await supabase.from('owner_private_notes').insert(payload);
   if(result.error)throw result.error;resetNote();await load();
  }catch(e:any){setError(e?.message||'ذخیره یادداشت ناموفق بود.');}finally{setBusy(false);}
 }
 async function saveTask(e:React.FormEvent){
  e.preventDefault();if(!supabase)return;if(!taskTitle.trim()){setError('عنوان وظیفه الزامی است.');return;}
  const hasDate=!!dueDate.trim(),hasTime=!!dueTime.trim();
  if(hasDate!==hasTime){setError('برای تعیین موعد، هم تاریخ شمسی و هم ساعت ایران را وارد کن.');return;}
  const dueAt=hasDate?iranJalaliDateTimeToIso(dueDate,dueTime):null;
  if(hasDate&&!dueAt){setError('تاریخ یا ساعت موعد معتبر نیست.');return;}
  setBusy(true);setError('');
  try{
   const {data:{user},error:authError}=await supabase.auth.getUser();if(authError)throw authError;if(!user)throw new Error('نشست مالک معتبر نیست.');
   const payload={title:taskTitle.trim(),description:taskDescription.trim(),priority:taskPriority,status:taskStatus,due_at:dueAt,completed_at:taskStatus==='done'?new Date().toISOString():null,created_by:user.id,updated_at:new Date().toISOString()};
   const result=taskId?await supabase.from('owner_admin_tasks').update(payload).eq('id',taskId):await supabase.from('owner_admin_tasks').insert(payload);
   if(result.error)throw result.error;resetTask();await load();
  }catch(e:any){setError(e?.message||'ذخیره وظیفه ناموفق بود.');}finally{setBusy(false);}
 }
 async function remove(table:'owner_private_notes'|'owner_admin_tasks',id:string,title:string){
  if(!supabase||!window.confirm('«'+title+'» حذف شود؟'))return;
  setBusy(true);setError('');
  try{const {error:deleteError}=await supabase.from(table).delete().eq('id',id);if(deleteError)throw deleteError;if(table==='owner_private_notes'&&noteId===id)resetNote();if(table==='owner_admin_tasks'&&taskId===id)resetTask();await load();}
  catch(e:any){setError(e?.message||'حذف مورد ناموفق بود.');}finally{setBusy(false);}
 }
 async function setTaskState(task:Task,status:Task['status']){
  if(!supabase)return;setBusy(true);setError('');
  try{const {error:updateError}=await supabase.from('owner_admin_tasks').update({status,completed_at:status==='done'?new Date().toISOString():null,updated_at:new Date().toISOString()}).eq('id',task.id);if(updateError)throw updateError;await load();}
  catch(e:any){setError(e?.message||'به‌روزرسانی وضعیت وظیفه ناموفق بود.');}finally{setBusy(false);}
 }

 return <section className="owner-workspace">
  <div className="owner-workspace-heading"><div><span className="section-kicker">ابزارهای خصوصی مالک</span><h2>یادداشت‌ها و وظایف مدیریتی</h2><p>این اطلاعات فقط برای مالک سایت قابل مشاهده است.</p></div><ClipboardList size={25}/></div>
  {error&&<p className="auth-inline-error" role="alert">{error}</p>}
  {loading?<div className="panel empty-state">در حال دریافت اطلاعات…</div>:<div className="owner-workspace-grid">
   <section className="panel owner-workspace-panel"><div className="section-heading"><div><span className="section-kicker">یادداشت خصوصی</span><h3>{noteId?'ویرایش یادداشت':'یادداشت جدید'}</h3></div><FileText size={20}/></div>
    <form className="form-panel" onSubmit={saveNote}><label>عنوان<input required maxLength={160} value={noteTitle} onChange={e=>setNoteTitle(e.target.value)}/></label><label>متن یادداشت<textarea rows={4} value={noteBody} onChange={e=>setNoteBody(e.target.value)}/></label><label>اولویت<select value={notePriority} onChange={e=>setNotePriority(e.target.value as Note['priority'])}><option value="low">کم</option><option value="normal">معمولی</option><option value="high">زیاد</option></select></label><button className="gold-button full-button" disabled={busy} type="submit">{busy?'در حال ذخیره…':<><Save size={15}/> ذخیره یادداشت</>}</button>{noteId&&<button className="outline-button full-button" type="button" onClick={resetNote}>لغو ویرایش</button>}</form>
    <div className="owner-workspace-list">{notes.length?notes.map(n=><article className="owner-workspace-item" key={n.id}><div><strong>{n.title}</strong><span className={'priority-'+n.priority}>اولویت {priorityLabel[n.priority]}</span>{n.body&&<p>{n.body}</p>}<small>آخرین ویرایش: {formatIranDateTime(n.updated_at)}</small></div><div className="owner-item-actions"><button type="button" className="outline-button" onClick={()=>editNote(n)} disabled={busy}><Pencil size={13}/> ویرایش</button><button type="button" className="reject-button" onClick={()=>void remove('owner_private_notes',n.id,n.title)} disabled={busy}><Trash2 size={13}/></button></div></article>):<p className="form-footnote">هنوز یادداشتی ثبت نشده است.</p>}</div>
   </section>
   <section className="panel owner-workspace-panel"><div className="section-heading"><div><span className="section-kicker">پیگیری کارها</span><h3>{taskId?'ویرایش وظیفه':'وظیفه جدید'}</h3></div><CalendarClock size={20}/></div>
    <form className="form-panel" onSubmit={saveTask}><label>عنوان وظیفه<input required maxLength={160} value={taskTitle} onChange={e=>setTaskTitle(e.target.value)}/></label><label>توضیحات<textarea rows={3} value={taskDescription} onChange={e=>setTaskDescription(e.target.value)}/></label><div className="form-grid"><label>موعد (تاریخ شمسی)<input dir="ltr" inputMode="numeric" placeholder="۱۴۰۵/۰۸/۱۵" value={dueDate} onChange={e=>setDueDate(e.target.value)}/></label><label>ساعت ایران<input type="time" dir="ltr" value={dueTime} onChange={e=>setDueTime(e.target.value)}/></label></div><div className="form-grid"><label>اولویت<select value={taskPriority} onChange={e=>setTaskPriority(e.target.value as Task['priority'])}><option value="low">کم</option><option value="normal">معمولی</option><option value="high">زیاد</option></select></label><label>وضعیت<select value={taskStatus} onChange={e=>setTaskStatus(e.target.value as Task['status'])}><option value="pending">در انتظار</option><option value="in_progress">در حال انجام</option><option value="done">انجام‌شده</option></select></label></div><button className="gold-button full-button" disabled={busy} type="submit">{busy?'در حال ذخیره…':<><Save size={15}/> ذخیره وظیفه</>}</button>{taskId&&<button className="outline-button full-button" type="button" onClick={resetTask}>لغو ویرایش</button>}</form>
    <div className="owner-workspace-list">{tasks.length?tasks.map(t=><article className={'owner-workspace-item task-item task-'+t.status} key={t.id}><div><strong>{t.title}</strong><span>{statusLabel[t.status]} · اولویت {priorityLabel[t.priority]}</span>{t.description&&<p>{t.description}</p>}{t.due_at&&<small>موعد: {formatIranDateTime(t.due_at)}</small>}</div><div className="owner-item-actions"><button type="button" className="outline-button" onClick={()=>editTask(t)} disabled={busy}><Pencil size={13}/> ویرایش</button>{t.status!=='done'&&<button type="button" className="outline-button" onClick={()=>void setTaskState(t,'done')} disabled={busy}><CheckCircle2 size={13}/> انجام شد</button>}<button type="button" className="reject-button" onClick={()=>void remove('owner_admin_tasks',t.id,t.title)} disabled={busy}><Trash2 size={13}/></button></div></article>):<p className="form-footnote">هنوز وظیفه‌ای ثبت نشده است.</p>}</div>
   </section>
  </div>}
 </section>;
}
