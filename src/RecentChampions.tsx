import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { formatIranDate } from './iranDate';
import { Crown, Medal } from 'lucide-react';

type Champion = {
  tournament_id: string;
  tournament_title: string;
  game_type: string;
  series_name: string | null;
  prize_text: string;
  completed_at: string;
  display_name: string;
  plato_id: string;
  public_avatar_path: string | null;
};

export default function RecentChampions() {
  const [items, setItems] = useState<Champion[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let alive = true;
    supabase.from('recent_tournament_champions')
      .select('tournament_id,tournament_title,game_type,series_name,prize_text,completed_at,display_name,plato_id,public_avatar_path')
      .order('completed_at', { ascending: false })
      .limit(3)
      .then(({ data, error }) => {
        if (!alive) return;
        if (!error) setItems((data || []) as Champion[]);
        setLoading(false);
      });
    return () => { alive = false; };
  }, []);
  if (loading || items.length === 0) return null;
  return <section className="recent-champions-section">
    <div className="section-heading"><div><span className="section-kicker">افتخارآفرینان</span><h2>قهرمانان اخیر</h2><p>قهرمان سه مسابقهٔ اخیر PLATO LAND</p></div><Medal size={25}/></div>
    <div className="recent-champions-grid">{items.map(item => <article className="panel recent-champion-card" key={item.tournament_id}>
      <div className="champion-avatar">{item.public_avatar_path&&supabase?<img src={supabase.storage.from('public-profile-avatars').getPublicUrl(item.public_avatar_path).data.publicUrl} alt={item.display_name} loading="lazy"/>:<Crown size={25}/>}</div>
      <div className="champion-player"><h3>{item.display_name}</h3><span>Plato ID: {item.plato_id}</span></div>
      <div className="champion-tournament"><strong>{item.tournament_title}</strong><span>{item.game_type}{item.series_name ? ' · ' + item.series_name : ''}</span></div>
      {item.prize_text && <div className="champion-prize"><small>جایزه</small><strong>{item.prize_text}</strong></div>}
      <small className="champion-date">پایان مسابقه: {formatIranDate(item.completed_at)}</small>
    </article>)}</div>
  </section>;
}
