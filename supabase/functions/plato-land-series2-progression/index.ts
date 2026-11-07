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
      const nextProgression = { ...currentProgression, group_fixtures: nextFixtures };

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
