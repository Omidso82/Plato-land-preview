import { useEffect, useState } from 'react';
import { resolveSeries4Matches } from './series4Knockout';
import { supabase } from './supabase';
import PublicTournamentArchive, { podiumFromMatches, type ArchiveMatch } from './PublicTournamentArchive';

type GroupMatch = {
  match_id: string;
  group_name: string;
  player_a: string;
  player_b: string;
  result_status: 'completed' | 'double_no_show';
  score_a: number | null;
  score_b: number | null;
};
type Archive = {
  bracket: Parameters<typeof resolveSeries4Matches>[0];
  scores: Parameters<typeof resolveSeries4Matches>[1];
  groups: GroupMatch[];
};
const stages: Record<string, string> = {
  R32: 'round32', R16: 'round16', R8: 'quarter', R4: 'semi', R2: 'final', THIRD: 'third_place',
};

function archiveMatches(archive: Archive): ArchiveMatch[] {
  const { players, byId } = resolveSeries4Matches(archive.bracket, archive.scores);
  const rounds = [archive.bracket.firstRound, ...archive.bracket.laterRounds, [archive.bracket.thirdPlace]];
  return [
    ...archive.groups.map(match => ({
      stage: 'group', group: match.group_name, a: match.player_a, b: match.player_b,
      score_a: match.score_a, score_b: match.score_b, status: match.result_status,
    })),
    ...rounds.flatMap(round => round.map(match => {
      const [a, b] = players.get(match.id) ?? [];
      const result = byId.get(match.id);
      return {
        stage: stages[match.id.split('-')[0]], group: null, a: a ?? null, b: b ?? null,
        score_a: result?.score_a ?? null, score_b: result?.score_b ?? null,
        status: result ? 'completed' as const : 'pending' as const,
      };
    })),
  ];
}

export default function Series4PublicArchive() {
  const [archive, setArchive] = useState<Archive | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    let request = 0;
    async function load() {
      const seq = ++request;
      try {
        const response = await supabase?.rpc('plato_temp_public_series4_archive');
        if (!active || seq !== request) return;
        if (!response || response.error) throw new Error('Archive unavailable');
        setArchive(response.data as Archive | null);
        setFailed(false);
      } catch {
        if (active && seq === request) {
          setArchive(null);
          setFailed(true);
        }
      }
    }
    void load();
    window.addEventListener('focus', load);
    return () => {
      active = false;
      window.removeEventListener('focus', load);
    };
  }, []);

  const matches = archive ? archiveMatches(archive) : archive === undefined ? null : [];
  return <main><PublicTournamentArchive title="آرشیو سری چهارم تخته‌نرد" prefix="series4"
    matches={matches} failed={failed} podium={matches ? podiumFromMatches(matches) : []} /></main>;
}
