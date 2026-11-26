import { useEffect, useState } from 'react';
import PublicTournamentArchive, { type ArchiveMatch } from './PublicTournamentArchive';
import { supabase } from './supabase';

// Series 1 Offline Staging v0.38, owner-confirmed ranking and official prize rows.
const podium = [
  { rank: 'قهرمان', name: 'رامش', id: '95m', prize: 40000 },
  { rank: 'نایب‌قهرمان', name: 'هانا', id: 'HANA1272', prize: 25000 },
  { rank: 'مقام سوم', name: 'سعید', id: '_34EED', prize: 15000 },
];
export default function Series1PublicArchive() {
  const [matches, setMatches] = useState<ArchiveMatch[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await supabase?.rpc('plato_temp_public_series1_archive');
        if (!response || response.error || !Array.isArray(response.data)) throw new Error('Archive unavailable');
        if (active) setMatches(response.data as ArchiveMatch[]);
      } catch {
        if (active) setFailed(true);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  return <main><PublicTournamentArchive title="آرشیو سری اول تخته‌نرد" prefix="series1" matches={matches} podium={podium} failed={failed} /></main>;
}
