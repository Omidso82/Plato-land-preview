import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Server configuration is incomplete");
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const [{ data: registrations, error: registrationError }, { data: stats, error: statsError }] =
      await Promise.all([
        admin.from("plato_land_series2_registration_requests")
          .select("id,plato_id"),
        admin.from("plato_land_series2_player_stats")
          .select("request_id,games_played,games_won"),
      ]);

    if (registrationError) throw registrationError;
    if (statsError) throw statsError;

    const statsByRequest = new Map(
      (stats || []).map((row) => [row.request_id, row]),
    );

    const players = (registrations || []).map((registration) => {
      const stat = statsByRequest.get(registration.id);
      const played = stat?.games_played == null ? null : Number(stat.games_played);
      const won = stat?.games_won == null ? null : Number(stat.games_won);
      const valid = played !== null && won !== null &&
        Number.isSafeInteger(played) && Number.isSafeInteger(won) &&
        played > 0 && won >= 0 && won <= played;

      return {
        plato_id: registration.plato_id,
        games_played: played,
        games_won: won,
        win_rate: valid ? (won! / played!) * 100 : null,
      };
    });

    players.sort((a, b) => {
      if (a.win_rate !== null && b.win_rate === null) return -1;
      if (a.win_rate === null && b.win_rate !== null) return 1;
      if (a.win_rate !== null && b.win_rate !== null && a.win_rate !== b.win_rate) {
        return b.win_rate - a.win_rate;
      }
      if (a.games_played !== null && b.games_played !== null &&
          a.games_played !== b.games_played) {
        return a.games_played - b.games_played;
      }
      if (a.games_won !== null && b.games_won !== null &&
          a.games_won !== b.games_won) {
        return b.games_won - a.games_won;
      }
      return a.plato_id.localeCompare(b.plato_id, "en", { sensitivity: "base" });
    });

    return new Response(JSON.stringify({ players }), {
      status: 200,
      headers: { ...corsHeaders, "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Public Series 2 leaderboard error:", error);
    return new Response(JSON.stringify({ error: "Unable to load leaderboard" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
