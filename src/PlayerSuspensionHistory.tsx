import {useEffect, useState} from 'react';
import {supabase} from './supabase';

type Suspension = {
 id: string;
 plato_id: string;
 reason: string;
 created_at: string;
 source_name: string | null;
 status: string;
 issued_targets: string[];
 current_targets: string[];
 events: {id: string; type: string; reason: string; occurred_at: string}[];
};

const statusLabels: Record<string, string> = {
 active: 'فعال',
 completed: 'پایان‌یافته',
 lifted: 'رفع‌شده',
};
const eventLabels: Record<string, string> = {
 lifted: 'رفع محرومیت',
 created: 'ثبت محرومیت',
};
const formatDate = (value: string) => new Date(value).toLocaleString('fa-IR');

export default function PlayerSuspensionHistory({playerId, revision}: {playerId: string; revision: number}) {
 const [cases, setCases] = useState<Suspension[] | null>(null);
 const [error, setError] = useState(false);
 const [attempt, setAttempt] = useState(0);

 useEffect(() => {
  let active = true;
  setError(false);
  setCases(null);
  const load = async () => {
   try {
    if (!supabase) throw new Error('Supabase is not configured');
    const result = await supabase.rpc('plato_land_temp_player_suspension_history', {p_player_id: playerId});
    if (result.error || !Array.isArray(result.data)) throw new Error('Could not load suspension history');
    if (active) setCases(result.data as Suspension[]);
   } catch {
    if (active) setError(true);
   }
  };
  void load();
  return () => { active = false; };
 }, [playerId, revision, attempt]);

 return (
  <section aria-label="سوابق محرومیت" style={{marginTop: 14, color: '#d4cabb', overflowWrap: 'anywhere'}}>
   <h3 style={{color: '#e4c77e', margin: '0 0 8px'}}>سوابق محرومیت</h3>
   {error ? <div role="alert">
    دریافت سوابق محرومیت ممکن نشد.{' '}
    <button type="button" onClick={() => setAttempt(value => value + 1)}>تلاش دوباره</button>
   </div> : cases === null ? <p role="status">در حال دریافت سوابق محرومیت…</p>
    : cases.length === 0 ? <p>سابقه محرومیتی ثبت نشده است.</p>
    : cases.map(record => (
     <article key={record.id} style={{border: '1px solid #51452d', borderRadius: 10, padding: 12, marginBottom: 8}}>
      <strong style={{color: '#e4c77e'}}>{statusLabels[record.status] ?? record.status}</strong>
      {record.source_name && <span> · {record.source_name}</span>}
      <p>{record.reason}</p>
      <p>شناسه ثبت‌شده <bdi>{record.plato_id}</bdi> · {formatDate(record.created_at)}</p>
      {record.issued_targets.length > 0 && <p>سری‌های زمان صدور · {record.issued_targets.join('، ')}</p>}
      {record.current_targets.length > 0 && <p>
       {record.status === 'completed' ? 'سری‌های سپری‌شده' : 'سری‌های مشمول'} · {record.current_targets.join('، ')}
      </p>}
      {record.events.map(event => <p key={event.id}>
       {eventLabels[event.type] ?? event.type} · {formatDate(event.occurred_at)}{event.reason && ' · ' + event.reason}
      </p>)}
     </article>
    ))}
  </section>
 );
}
