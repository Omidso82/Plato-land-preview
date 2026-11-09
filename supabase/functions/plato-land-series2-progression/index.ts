import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
});

type StandingRow = { plato_id: string; points: number; score_for: number; score_against: number; difference: number; wins: number };
function calculateGroupStandings(progression: Record<string, any>) {
  const all: Record<string, StandingRow[]> = {};
  const unresolved: Record<string, string[]> = {};
  for (const group of Array.isArray(progression.groups) ? progression.groups : []) {
    const rows: StandingRow[] = (group.players || []).map((p: any) => ({
      plato_id: p.plato_id, points: 0, score_for: 0, score_against: 0, difference: 0, wins: 0,
    }));
    const byId = new Map(rows.map(row => [row.plato_id, row]));
    for (const fixture of (progression.group_fixtures || []).filter((f: any) => f.group === group.name)) {
      if (fixture.result_status === "double_no_show" || !fixture.winner ||
          !Number.isInteger(fixture.score1) || !Number.isInteger(fixture.score2)) continue;
      const one = byId.get(fixture.player1), two = byId.get(fixture.player2);
      if (!one || !two) continue;
      one.score_for += fixture.score1; one.score_against += fixture.score2;
      two.score_for += fixture.score2; two.score_against += fixture.score1;
      const winner = fixture.winner === one.plato_id ? one : fixture.winner === two.plato_id ? two : null;
      if (winner) { winner.wins++; winner.points += 3; }
    }
    rows.forEach(row => row.difference = row.score_for - row.score_against);
    rows.sort((a,b) => b.points-a.points || b.difference-a.difference || b.score_for-a.score_for);
    for (let i=0;i<rows.length;) {
      let j=i+1;
      while(j<rows.length && rows[j].points===rows[i].points &&
        rows[j].difference===rows[i].difference && rows[j].score_for===rows[i].score_for) j++;
      if(j-i===2) {
        const a=rows[i], b=rows[i+1];
        const h2h=(progression.group_fixtures||[]).find((f:any)=>f.group===group.name &&
          f.result_status!=="double_no_show" && Number.isInteger(f.score1) && Number.isInteger(f.score2) && f.winner &&
          ((f.player1===a.plato_id&&f.player2===b.plato_id)||(f.player1===b.plato_id&&f.player2===a.plato_id)));
        if(h2h?.winner===b.plato_id) [rows[i],rows[i+1]]=[b,a];
        else if(h2h?.winner!==a.plato_id) unresolved[group.name]=rows.slice(i,j).map(row=>row.plato_id);
      } else if(j-i>2) unresolved[group.name]=rows.slice(i,j).map(row=>row.plato_id);
      i=j;
    }
    all[group.name]=rows;
  }
  return { standings: all, unresolved };
}
function syncGroupSlots(progression: Record<string, any>) {
  const {standings, unresolved}=calculateGroupStandings(progression);
  const brackets={...(progression.brackets||{})};
  const manualSlots: Record<string,string> = {
    "R16-3:player1":"_34EED",
    "R16-5:player1":"Mitra2024__",
    "R16-7:player1":"Meehrd4d",
    "R16-4:player1":"H7LEN_",
  };
  for(const round of ["round16","quarter","semi","final","third_place"]) {
    brackets[round]=(brackets[round]||[]).map((match:any)=>{
      const resolve=(side:"player1"|"player2")=>{
        const source=match[side+"_source"];
        if(typeof source!=="string" || !source.startsWith("group:")) return match[side];
        const [,group,placeText]=source.split(":");
        const place=Number(placeText);
        const manual=manualSlots[match.id+":"+side];
        if(manual) return manual;
        const groupFixtures=(progression.group_fixtures||[]).filter((fixture:any)=>fixture.group===group);
        const groupComplete=groupFixtures.length===6 && groupFixtures.every((fixture:any)=>
          fixture.result_status==="double_no_show" ||
          (!!fixture.winner && Number.isInteger(fixture.score1) && Number.isInteger(fixture.score2) &&
           [fixture.player1,fixture.player2].includes(fixture.winner)));
        if(!groupComplete || unresolved[group]) return place===1?"نفر اول گروه "+group:"نفر دوم گروه "+group;
        return standings[group]?.[place-1]?.plato_id || (place===1?"نفر اول گروه "+group:"نفر دوم گروه "+group);
      };
      return {...match,player1:resolve("player1"),player2:resolve("player2")};
    });
  }
  return {...progression,brackets};
}
function hasRecordedBracketConflict(before:Record<string,any>,after:Record<string,any>) {
  const rounds=["round16","quarter","semi","final","third_place"];
  for(const round of rounds) {
    const oldMatches=before.brackets?.[round]||[];
    const nextMatches=after.brackets?.[round]||[];
    for(const oldMatch of oldMatches) {
      if(!oldMatch.winner || !Number.isInteger(oldMatch.score1) || !Number.isInteger(oldMatch.score2)) continue;
      const nextMatch=nextMatches.find((m:any)=>m.id===oldMatch.id);
      if(nextMatch && (nextMatch.player1!==oldMatch.player1 || nextMatch.player2!==oldMatch.player2))
        return true;
    }
  }
  return false;
}
function syncBracketSources(progression: Record<string, any>) {
  const brackets={...(progression.brackets||{})};
  const rounds=["round16","quarter","semi","final","third_place"];
  const byId=new Map<string,any>();
  for(const round of rounds) for(const match of (brackets[round]||[])) byId.set(String(match.id),match);
  for(const round of rounds) {
    brackets[round]=(brackets[round]||[]).map((match:any)=>{
      const resolve=(side:"player1"|"player2")=>{
        const source=match[side+"_source"];
        if(typeof source!=="string") return match[side];
        const parts=source.split(":");
        if(parts[0]==="winner" || parts[0]==="loser") {
          const prior=byId.get(parts[1]);
          if(!prior?.winner) return match[side];
          if(parts[0]==="winner") return prior.winner;
          return prior.winner===prior.player1?prior.player2:prior.player1;
        }
        return match[side];
      };
      return {...match,player1:resolve("player1"),player2:resolve("player2")};
    });
  }
  return {...progression,brackets};
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "Service configuration unavailable." }, 500);

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    if (req.method === "GET") {
      const { data, error } = await adminClient
        .from("plato_land_series2_tournament_progression")
        .select("progression,updated_at")
        .eq("tournament_key", "series2")
        .maybeSingle();
      if (error) throw error;
      return json({ progression: data?.progression ?? null, updated_at: data?.updated_at ?? null });
    }

    const authorization = req.headers.get("Authorization");
    if (!authorization) return json({ error: "Unauthorized" }, 401);
    const token = authorization.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : authorization.trim();
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: "Bearer " + token } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser();
    if (authError || !authData.user) return json({ error: "Unauthorized" }, 401);

    const { data: roleRow, error: roleError } = await adminClient
      .from("user_roles").select("role").eq("user_id", authData.user.id).maybeSingle();
    if (roleError || roleRow?.role !== "owner") return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "Invalid request body." }, 400);

    if (body.action === "mark_double_no_show") {
      const matchId = typeof body.match_id === "string" ? body.match_id : "";
      const expectedUpdatedAt = body.expected_updated_at;
      if (!matchId || typeof expectedUpdatedAt !== "string" || !expectedUpdatedAt) return json({ error: "Match ID and expected data version are required." }, 400);
      const { data: current, error: readError } = await adminClient.from("plato_land_series2_tournament_progression")
        .select("progression,updated_at").eq("tournament_key", "series2").maybeSingle();
      if (readError) throw readError;
      if (!current?.progression) return json({ error: "Series 2 progression was not found." }, 404);
      if (current.updated_at !== expectedUpdatedAt) return json({ error: "Tournament data changed. Refresh and try again." }, 409);
      const currentProgression = current.progression as Record<string, unknown>;
      const fixtures = Array.isArray(currentProgression.group_fixtures) ? currentProgression.group_fixtures as Array<Record<string, unknown>> : [];
      const fixtureIndex = fixtures.findIndex(fixture => fixture.id === matchId);
      if (fixtureIndex < 0) return json({ error: "Group match was not found." }, 404);
      const fixture = fixtures[fixtureIndex];
      if (typeof fixture.player1 !== "string" || typeof fixture.player2 !== "string" || !fixture.player1 || !fixture.player2) return json({ error: "Match players are missing." }, 409);
      if (fixture.result_status === "double_no_show") return json({ saved: true, unchanged: true, progression: current.progression, updated_at: current.updated_at });
      if ((fixture.winner !== null && fixture.winner !== undefined) ||
          (fixture.score1 !== null && fixture.score1 !== undefined) ||
          (fixture.score2 !== null && fixture.score2 !== undefined)) return json({ error: "A scored result already exists for this match." }, 409);
      const recordedAt = new Date().toISOString();
      const history = Array.isArray(fixture.result_history) ? [...fixture.result_history as Array<Record<string, unknown>>] : [];
      history.push({ action: "double_no_show", previous_score1: null, previous_score2: null, previous_winner: null,
        score1: null, score2: null, winner: null, player1: fixture.player1, player2: fixture.player2, recorded_at: recordedAt });
      const updatedFixture = { ...fixture, score1: null, score2: null, winner: null, result_status: "double_no_show", result_history: history.slice(-1000) };
      const nextFixtures = fixtures.map((item, index) => index === fixtureIndex ? updatedFixture : item);
      const nextProgression = syncGroupSlots({ ...currentProgression, group_fixtures: nextFixtures });
      if(hasRecordedBracketConflict(currentProgression,nextProgression)) return json({error:"A recorded knockout match would have different participants after this group-result correction. Correct the dependent knockout result first."},409);
      const { data: saved, error: saveError } = await adminClient.from("plato_land_series2_tournament_progression")
        .update({ progression: nextProgression, updated_by: authData.user.id, updated_at: recordedAt })
        .eq("tournament_key", "series2").eq("updated_at", current.updated_at)
        .select("progression,updated_at").maybeSingle();
      if (saveError) throw saveError;
      if (!saved) return json({ error: "Tournament data changed during save. Refresh and try again." }, 409);
      return json({ saved: true, progression: saved.progression, updated_at: saved.updated_at });
    }

    if (body.action === "save_group_result") {
      const matchId = typeof body.match_id === "string" ? body.match_id : "";
      const score1 = body.score1;
      const score2 = body.score2;
      const expectedUpdatedAt = body.expected_updated_at;

      if (!matchId || typeof expectedUpdatedAt !== "string" || !expectedUpdatedAt) {
        return json({ error: "Match ID and expected data version are required." }, 400);
      }
      if (!Number.isInteger(score1) || !Number.isInteger(score2) ||
          !((score1 >= 5 && score1 <= 7 && score2 >= 0 && score2 <= 4) || (score2 >= 5 && score2 <= 7 && score1 >= 0 && score1 <= 4))) {
        return json({ error: "Invalid five-point match score." }, 400);
      }

      const { data: current, error: readError } = await adminClient
        .from("plato_land_series2_tournament_progression")
        .select("progression,updated_at")
        .eq("tournament_key", "series2")
        .maybeSingle();
      if (readError) throw readError;
      if (!current?.progression) return json({ error: "Series 2 progression was not found." }, 404);
      if (current.updated_at !== expectedUpdatedAt) return json({ error: "Tournament data changed. Refresh and try again." }, 409);

      const currentProgression = current.progression as Record<string, unknown>;
      const fixtures = Array.isArray(currentProgression.group_fixtures)
        ? currentProgression.group_fixtures as Array<Record<string, unknown>>
        : [];
      const fixtureIndex = fixtures.findIndex(fixture => fixture.id === matchId);
      if (fixtureIndex < 0) return json({ error: "Group match was not found." }, 404);

      const fixture = fixtures[fixtureIndex];
      const player1 = typeof fixture.player1 === "string" ? fixture.player1 : "";
      const player2 = typeof fixture.player2 === "string" ? fixture.player2 : "";
      if (!player1 || !player2) return json({ error: "Match players are missing." }, 409);

      const winner = score1 >= 5 ? player1 : player2;
      const previousScore1 = Number.isInteger(fixture.score1) ? fixture.score1 as number : null;
      const previousScore2 = Number.isInteger(fixture.score2) ? fixture.score2 as number : null;
      const previousWinner = typeof fixture.winner === "string" ? fixture.winner : null;
      if (previousScore1 === score1 && previousScore2 === score2 && previousWinner === winner) {
        return json({ saved: true, unchanged: true, progression: current.progression, updated_at: current.updated_at });
      }

      const recordedAt = new Date().toISOString();
      const history = Array.isArray(fixture.result_history)
        ? [...fixture.result_history as Array<Record<string, unknown>>]
        : [];
      history.push({
        action: previousWinner || previousScore1 !== null || previousScore2 !== null ? "corrected" : "recorded",
        previous_score1: previousScore1,
        previous_score2: previousScore2,
        previous_winner: previousWinner,
        score1, score2, winner, recorded_at: recordedAt,
      });
      const updatedFixture = { ...fixture, score1, score2, winner, result_history: history.slice(-1000) };
      const nextFixtures = fixtures.map((item, index) => index === fixtureIndex ? updatedFixture : item);
      const nextProgression = syncGroupSlots({ ...currentProgression, group_fixtures: nextFixtures });

      const { data: saved, error: saveError } = await adminClient
        .from("plato_land_series2_tournament_progression")
        .update({ progression: nextProgression, updated_by: authData.user.id, updated_at: recordedAt })
        .eq("tournament_key", "series2")
        .eq("updated_at", current.updated_at)
        .select("progression,updated_at")
        .maybeSingle();
      if (saveError) throw saveError;
      if (!saved) return json({ error: "Tournament data changed during save. Refresh and try again." }, 409);

      return json({ saved: true, progression: saved.progression, updated_at: saved.updated_at });
    }

    if (body.action === "save_bracket_result") {
      const matchId = typeof body.match_id === "string" ? body.match_id : "";
      const round = typeof body.round === "string" ? body.round : "";
      const score1 = body.score1, score2 = body.score2, expectedUpdatedAt = body.expected_updated_at;
      const allowedRounds = ["round16","quarter","semi","final","third_place"];
      if (!matchId || !allowedRounds.includes(round) || typeof expectedUpdatedAt !== "string" || !expectedUpdatedAt)
        return json({ error: "Match, round and expected data version are required." }, 400);
      if (!Number.isInteger(score1) || !Number.isInteger(score2) ||
          !((score1 >= 5 && score1 <= 7 && score2 >= 0 && score2 <= 4) || (score2 >= 5 && score2 <= 7 && score1 >= 0 && score1 <= 4)))
        return json({ error: "Invalid five-point match score." }, 400);
      const { data: current, error: readError } = await adminClient.from("plato_land_series2_tournament_progression")
        .select("progression,updated_at").eq("tournament_key","series2").maybeSingle();
      if (readError) throw readError;
      if (!current?.progression) return json({ error: "Series 2 progression was not found." }, 404);
      if (current.updated_at !== expectedUpdatedAt) return json({ error: "Tournament data changed. Refresh and try again." }, 409);
      const p=current.progression as Record<string,any>;
      const rounds={...(p.brackets||{})};
      const matches=Array.isArray(rounds[round])?[...rounds[round]]:[];
      const index=matches.findIndex((m:any)=>m.id===matchId);
      if(index<0) return json({error:"Bracket match was not found."},404);
      const match=matches[index];
      if(typeof match.player1!=="string" || typeof match.player2!=="string" || !match.player1 || !match.player2 ||
         /^(برنده|بازنده) /.test(match.player1) || /^(برنده|بازنده) /.test(match.player2))
        return json({error:"Both qualified players must be resolved before recording this match."},409);
      const winner=score1>=5?match.player1:match.player2;
      const history=Array.isArray(match.result_history)?[...match.result_history]:[];
      const prevScore1=Number.isInteger(match.score1)?match.score1:null;
      const prevScore2=Number.isInteger(match.score2)?match.score2:null;
      const prevWinner=typeof match.winner==="string"?match.winner:null;
      if(prevScore1===score1 && prevScore2===score2 && prevWinner===winner)
        return json({saved:true,unchanged:true,progression:p,updated_at:current.updated_at});
      const updatedAt=new Date().toISOString();
      history.push({action:prevWinner||prevScore1!==null||prevScore2!==null?"corrected":"recorded",
        previous_score1:prevScore1,previous_score2:prevScore2,previous_winner:prevWinner,
        score1,score2,winner,recorded_at:updatedAt});
      matches[index]={...match,score1,score2,winner,result_history:history.slice(-1000)};
      rounds[round]=matches;
      const next=syncBracketSources({...p,brackets:rounds});
      if(hasRecordedBracketConflict(p,next)) return json({error:"A later-round match already has a recorded result and its participants would change. Correct that dependent result first."},409);
      const {data:saved,error:saveError}=await adminClient.from("plato_land_series2_tournament_progression")
        .update({progression:next,updated_by:authData.user.id,updated_at:updatedAt})
        .eq("tournament_key","series2").eq("updated_at",current.updated_at)
        .select("progression,updated_at").maybeSingle();
      if(saveError) throw saveError;
      if(!saved) return json({error:"Tournament data changed during save. Refresh and try again."},409);
      return json({saved:true,progression:saved.progression,updated_at:saved.updated_at});
    }

    if (typeof body.progression !== "object" || body.progression === null || Array.isArray(body.progression)) {
      return json({ error: "Invalid progression payload." }, 400);
    }
    const { data, error } = await adminClient
      .from("plato_land_series2_tournament_progression")
      .upsert({
        tournament_key: "series2", progression: body.progression,
        updated_by: authData.user.id, updated_at: new Date().toISOString(),
      }, { onConflict: "tournament_key" })
      .select("progression,updated_at")
      .single();
    if (error) throw error;
    return json({ saved: true, progression: data.progression, updated_at: data.updated_at });
  } catch (error) {
    console.error("Series 2 progression error:", error);
    return json({ error: "Unable to process tournament progression." }, 500);
  }
});
