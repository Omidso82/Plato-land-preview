import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
});
const START_AT = new Date("2026-11-07T00:00:00+01:00");
const normalize = (value: string) => value.trim().toLowerCase();

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return json({ error: "Service configuration unavailable." }, 500);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    const { data: progressionRow, error: progressionError } = await admin
      .from("plato_land_series2_tournament_progression")
      .select("progression,updated_at")
      .eq("tournament_key", "series2")
      .maybeSingle();
    if (progressionError) throw progressionError;
    const progression = progressionRow?.progression;
    if (!progression || !Array.isArray(progression.groups)) {
      return json({ error: "فهرست گروه‌های سری دوم در دسترس نیست." }, 503);
    }

    const roster = progression.groups.flatMap((group: any) =>
      (Array.isArray(group.players) ? group.players : []).map((player: any) => ({
        group: String(group.name),
        plato_id: String(player.plato_id),
        seed: Number(player.seed),
      }))
    );
    if (roster.length !== 32 || new Set(roster.map((p: any) => normalize(p.plato_id))).size !== 32) {
      return json({ error: "فهرست ۳۲ بازیکن معتبر نیست؛ ثبت رأی موقتاً متوقف شد." }, 503);
    }

    const fixtures = Array.isArray(progression.group_fixtures) ? progression.group_fixtures : [];
    const completedFixtures = fixtures.filter((fixture: any) =>
      typeof fixture.winner === "string" && fixture.winner.trim().length > 0
    ).length;
    const groupStageComplete = fixtures.length === 48 && completedFixtures === 48;
    const now = new Date();
    const isOpen = false; // Series 2 champion prediction permanently closed by owner after the voting period.

    if (req.method === "GET") {
      if (new URL(req.url).searchParams.get("action") === "report") {
        const authorization = req.headers.get("Authorization");
        if (!authorization) return json({ error: "Unauthorized." }, 401);
        const token = authorization.replace(/^Bearer\s+/i, "").trim();
        const auth = createClient(url, anonKey, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: userData, error: authError } = await auth.auth.getUser();
        if (authError || !userData.user) return json({ error: "Unauthorized." }, 401);
        const { data: role, error: roleError } = await admin
          .from("user_roles").select("role").eq("user_id", userData.user.id).maybeSingle();
        if (roleError || role?.role !== "owner") return json({ error: "Forbidden." }, 403);
        const { data: votes, error: votesError } = await admin
          .from("plato_land_series2_prediction_votes")
          .select("voter_plato_id,selected_plato_id,created_at")
          .order("created_at", { ascending: true });
        if (votesError) throw votesError;
        const counts = new Map<string, number>();
        for (const vote of votes ?? []) {
          const key = normalize(vote.selected_plato_id);
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        return json({
          total_votes: votes?.length ?? 0,
          counts: roster.map((player: any) => ({
            ...player,
            votes: counts.get(normalize(player.plato_id)) ?? 0,
          })),
          votes: votes ?? [],
          is_open: isOpen,
          group_stage_complete: groupStageComplete,
        });
      }
      return json({
        groups: progression.groups,
        roster,
        total_players: roster.length,
        updated_at: progressionRow.updated_at,
        starts_at: START_AT.toISOString(),
        is_open: isOpen,
        group_stage_complete: groupStageComplete,
        fixtures_total: fixtures.length,
        fixtures_completed: completedFixtures,
      });
    }

    if (!isOpen) {
      return json({
        error: groupStageComplete ? "مهلت پیش‌بینی با پایان مسابقات گروهی به پایان رسیده است." : "مهلت ثبت پیش‌بینی هنوز آغاز نشده یا بسته است.",
        group_stage_complete: groupStageComplete,
      }, 409);
    }

    const body = await req.json().catch(() => null);
    const voter = typeof body?.plato_id === "string" ? body.plato_id.trim() : "";
    const selected = typeof body?.selected_plato_id === "string" ? body.selected_plato_id.trim() : "";
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(voter)) return json({ error: "Plato ID واردشده معتبر نیست." }, 400);
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(selected)) return json({ error: "انتخاب بازیکن معتبر نیست." }, 400);
    const selectedPlayer = roster.find((player: any) => normalize(player.plato_id) === normalize(selected));
    if (!selectedPlayer) return json({ error: "بازیکن انتخاب‌شده در فهرست رسمی سری دوم نیست." }, 400);

    const { error: insertError } = await admin.from("plato_land_series2_prediction_votes").insert({
      voter_plato_id: voter,
      selected_plato_id: selectedPlayer.plato_id,
    });
    if (insertError?.code === "23505") {
      return json({ error: "این Plato ID قبلاً رأی خود را ثبت کرده است؛ امکان رأی مجدد یا تغییر رأی وجود ندارد." }, 409);
    }
    if (insertError) throw insertError;
    return json({ saved: true, message: "پیش‌بینی تو با موفقیت ثبت شد و قابل تغییر نیست." }, 201);
  } catch (error) {
    console.error("Series 2 prediction error:", error);
    return json({ error: "در پردازش رأی مشکلی پیش آمد. لطفاً کمی بعد دوباره تلاش کن." }, 500);
  }
});