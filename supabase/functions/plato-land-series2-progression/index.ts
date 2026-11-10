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

import { syncGroupSlots, syncBracketSources, hasRecordedBracketConflict, prepareBracketForResult } from "./_shared/series2-bracket.ts";
const escapeTelegramHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const telegramId = (value: unknown) => "<code>" + escapeTelegramHtml(String(value ?? "—")) + "</code>";
const telegramMatchBlock = (match: any, index: number) => [
  "<b>مسابقه " + (index + 1) + " · " + escapeTelegramHtml(String(match.id ?? "")) + "</b>",
  telegramId(match.player1) + "  مقابل  " + telegramId(match.player2),
  match.winner && Number.isInteger(match.score1) && Number.isInteger(match.score2)
    ? "🏆 برنده: " + telegramId(match.winner) + "  |  نتیجه: <b>" + match.score1 + "–" + match.score2 + "</b>"
    : "⏳ در انتظار نتیجه",
].join("\n");
const telegramAnnouncementHeader = (title: string, subtitle?: string) => [
  "<b>♛ PLATO LAND</b>",
  "<b>" + escapeTelegramHtml(title) + "</b>",
  subtitle ? "<i>" + escapeTelegramHtml(subtitle) + "</i>" : "",
  "━━━━━━━━━━━━━━",
].filter(Boolean).join("\n");

async function queueAndSendTelegramResult(adminClient: ReturnType<typeof createClient>, event: {
  event_key: string; match_id: string; stage: string; group_name?: string | null;
  player1: string; player2: string; score1: number; score2: number; winner: string;
  change_type: "recorded" | "corrected"; recorded_at: string;
}) {
  try {
    const { data: queued, error: queueError } = await adminClient.from("plato_land_telegram_outbox")
      .insert({ ...event, tournament_key: "series2", delivery_status: "pending" }).select("id").maybeSingle();
    if (queueError) { if (queueError.code !== "23505") console.error("Telegram outbox insert failed:", queueError.message); return; }
    if (!queued?.id) return;
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const testChatId = Deno.env.get("TELEGRAM_TEST_CHAT_ID");
    if (!botToken || !testChatId) return;
    await adminClient.from("plato_land_telegram_outbox").update({ delivery_status: "sending", attempts: 1, last_error: null }).eq("id", queued.id);
    const stageNames: Record<string, string> = { group: "مرحله گروهی", round16: "یک‌هشتم نهایی", quarter: "یک‌چهارم نهایی", semi: "نیمه‌نهایی", final: "فینال", third_place: "رده‌بندی" };
    const changeLabel = event.change_type === "corrected" ? "✏️ اصلاح نتیجه مسابقه" : "🏁 نتیجه مسابقه";
    const groupLine = event.group_name ? "\nگروه: <b>" + escapeTelegramHtml(event.group_name) + "</b>" : "";
    const message = [
      "<b>PLATO LAND | سری دوم لیگ تخته‌نرد</b>", "", changeLabel,
      "مرحله: <b>" + (stageNames[event.stage] ?? event.stage) + "</b>" + groupLine, "",
      "⚪ " + escapeTelegramHtml(event.player1) + "  <b>" + event.score1 + "</b>",
      "⚫ " + escapeTelegramHtml(event.player2) + "  <b>" + event.score2 + "</b>", "",
      "🏆 برنده: <b>" + escapeTelegramHtml(event.winner) + "</b>", "", "<i>بازی، رقابت، قهرمانی</i>",
    ].join("\n");
    const telegramResponse = await fetch("https://api.telegram.org/bot" + botToken + "/sendMessage", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: testChatId, text: message, parse_mode: "HTML", disable_web_page_preview: true }),
    });
    const telegramResult = await telegramResponse.json().catch(() => null);
    if (!telegramResponse.ok || !telegramResult?.ok) {
      const errorText = String(telegramResult?.description ?? ("Telegram HTTP " + telegramResponse.status)).slice(0, 1000);
      await adminClient.from("plato_land_telegram_outbox").update({ delivery_status: "failed", last_error: errorText }).eq("id", queued.id);
      console.error("Telegram send failed:", errorText); return;
    }
    await adminClient.from("plato_land_telegram_outbox").update({ delivery_status: "sent", telegram_message_id: telegramResult.result?.message_id ?? null, sent_at: new Date().toISOString(), last_error: null }).eq("id", queued.id);
  } catch (error) { console.error("Telegram result notification failed:", error); }
}


async function queueAndSendTelegramAnnouncement(adminClient: ReturnType<typeof createClient>, event: {
  event_key: string; announcement_type: "today_schedule" | "round16_bracket" | "bracket_update";
  payload: Record<string, unknown>; message: string;
}) {
  const { data: queued, error } = await adminClient.from("plato_land_telegram_announcements")
    .insert({
      event_key: event.event_key, announcement_type: event.announcement_type,
      payload: event.payload, message_text: event.message, tournament_key: "series2",
      delivery_status: "pending",
    }).select("id").maybeSingle();
  if (error) {
    if (error.code === "23505") return { sent: false, duplicate: true };
    throw error;
  }
  if (!queued?.id) throw new Error("Announcement could not be queued.");
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const testChatId = Deno.env.get("TELEGRAM_TEST_CHAT_ID");
  if (!botToken || !testChatId) {
    await adminClient.from("plato_land_telegram_announcements")
      .update({ delivery_status: "failed", last_error: "Telegram test destination is not configured." }).eq("id", queued.id);
    throw new Error("Telegram test destination is not configured.");
  }
  await adminClient.from("plato_land_telegram_announcements").update({ delivery_status: "sending", attempts: 1 }).eq("id", queued.id);
  const response = await fetch("https://api.telegram.org/bot" + botToken + "/sendMessage", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: testChatId, text: event.message, parse_mode: "HTML", disable_web_page_preview: true }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.ok) {
    const reason = String(result?.description ?? ("Telegram HTTP " + response.status)).slice(0, 1000);
    await adminClient.from("plato_land_telegram_announcements").update({ delivery_status: "failed", last_error: reason }).eq("id", queued.id);
    throw new Error(reason);
  }
  await adminClient.from("plato_land_telegram_announcements").update({
    delivery_status: "sent", telegram_message_id: result.result?.message_id ?? null,
    sent_at: new Date().toISOString(), last_error: null,
  }).eq("id", queued.id);
  return { sent: true, duplicate: false, telegram_message_id: result.result?.message_id ?? null };
}

const telegramHash = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("");
};

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
      const storedProgression = data?.progression ?? null;
      if (!storedProgression) return json({ progression: null, updated_at: data?.updated_at ?? null });

      // Resolve qualified group places and downstream winner/loser slots for every
      // read-only consumer (owner panel and public tournament page) without
      // writing projected values back to the canonical tournament record.
      const projectedProgression = syncBracketSources(syncGroupSlots(storedProgression));
      if (hasRecordedBracketConflict(storedProgression, projectedProgression)) {
        // Never display a projected bracket that would invalidate a recorded result.
        return json({
          progression: storedProgression,
          updated_at: data?.updated_at ?? null,
          bracket_resolution_blocked: true,
        });
      }
      return json({ progression: projectedProgression, updated_at: data?.updated_at ?? null });
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


    if (body.action === "publish_today_schedule" || body.action === "publish_round16_bracket") {
      const { data: current, error: readError } = await adminClient.from("plato_land_series2_tournament_progression")
        .select("progression,updated_at").eq("tournament_key", "series2").maybeSingle();
      if (readError) throw readError;
      if (!current?.progression) return json({ error: "Series 2 progression was not found." }, 404);
      const p = current.progression as Record<string, any>;
      if (body.action === "publish_today_schedule") {
        const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Copenhagen", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
        const fixtures = Array.isArray(p.group_fixtures) ? p.group_fixtures as Array<Record<string, any>> : [];
        const todays = fixtures.filter(item => item.scheduled_date === today || item.date === today);
        if (todays.length === 0) return json({ error: "برای امروز تاریخ دقیق مسابقه‌ای در دیتابیس ثبت نشده است؛ برای جلوگیری از انتشار برنامه اشتباه، پیام ارسال نشد.", today }, 409);
        const sortedTodays = [...todays].sort((a, b) => String(a.id ?? "").localeCompare(String(b.id ?? ""), "en"));
        const lines = sortedTodays.map((match, index) => telegramMatchBlock(match, index));
        const message = [
          telegramAnnouncementHeader("برنامه بازی‌های امروز", today),
          "",
          ...lines,
          "",
          "🕘 بازی‌ها معمولاً از ساعت ۲۱ برگزار می‌شوند، اما ممکن است زودتر آغاز شوند؛ لطفاً بازیکنان از قبل آماده باشند.",
          "",
          "<i>بازی، رقابت، قهرمانی</i>",
        ].join("\n\n");
        const result = await queueAndSendTelegramAnnouncement(adminClient, { event_key: "series2:today_schedule:" + today, announcement_type: "today_schedule", payload: { date: today, match_count: todays.length }, message });
        return json({ ok: true, ...result, date: today, match_count: todays.length });
      }
      const projected = syncBracketSources(syncGroupSlots(p));
      if (hasRecordedBracketConflict(p, projected)) return json({ error: "براکت با نتیجه ثبت‌شده تعارض دارد؛ ابتدا باید تعارض بررسی شود." }, 409);
      const matches = Array.isArray(projected.brackets?.round16) ? projected.brackets.round16 : [];
      if (matches.length !== 8 || matches.some((match: any) => !match.player1 || !match.player2 || /^(برنده|بازنده|نفر اول گروه|نفر دوم گروه)\s*/.test(String(match.player1)) || /^(برنده|بازنده|نفر اول گروه|نفر دوم گروه)\s*/.test(String(match.player2)))) {
        return json({ error: "جدول یک‌هشتم کامل و قابل انتشار نیست؛ هیچ پیامی ارسال نشد." }, 409);
      }
      const orderedMatches = [...matches].sort((a: any, b: any) => String(a.id ?? "").localeCompare(String(b.id ?? ""), "en"));
      const lines = orderedMatches.map((match: any, index: number) => telegramMatchBlock(match, index));
      const message = [
        telegramAnnouncementHeader("جدول یک‌هشتم نهایی", "مسیر حذفی تا قهرمانی"),
        "",
        ...lines,
        "",
        "🕘 بازی‌ها معمولاً از ساعت ۲۱ برگزار می‌شوند، اما ممکن است زودتر آغاز شوند؛ لطفاً بازیکنان از قبل آماده باشند.",
        "",
        "<i>بازی، رقابت، قهرمانی</i>",
      ].join("\n\n");
      const fingerprint = await telegramHash(JSON.stringify(matches));
      const result = await queueAndSendTelegramAnnouncement(adminClient, { event_key: "series2:round16_bracket:" + fingerprint, announcement_type: "round16_bracket", payload: { progression_updated_at: current.updated_at, match_count: matches.length }, message });
      return json({ ok: true, ...result, match_count: matches.length });
    }

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
      if (hasRecordedBracketConflict(currentProgression as Record<string,any>, nextProgression)) {
        return json({ error: "A recorded knockout match would have different participants after this group-result correction. Correct the dependent knockout result first." }, 409);
      }

      const { data: saved, error: saveError } = await adminClient
        .from("plato_land_series2_tournament_progression")
        .update({ progression: nextProgression, updated_by: authData.user.id, updated_at: recordedAt })
        .eq("tournament_key", "series2")
        .eq("updated_at", current.updated_at)
        .select("progression,updated_at")
        .maybeSingle();
      if (saveError) throw saveError;
      if (!saved) return json({ error: "Tournament data changed during save. Refresh and try again." }, 409);

      await queueAndSendTelegramResult(adminClient, {
        event_key: "series2:group:" + matchId + ":" + recordedAt,
        match_id: matchId, stage: "group",
        group_name: typeof fixture.group === "string" ? fixture.group : null,
        player1, player2, score1, score2, winner,
        change_type: history[history.length - 1]?.action === "corrected" ? "corrected" : "recorded",
        recorded_at: recordedAt,
      });
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
      const prepared = prepareBracketForResult(current.progression as Record<string,any>);
      if (prepared.blocked) return json({error:"A recorded knockout result conflicts with the current group qualification or bracket participants. Resolve the dependent result first."},409);
      const p=prepared.progression as Record<string,any>;
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
      await queueAndSendTelegramResult(adminClient, {
        event_key: "series2:" + round + ":" + matchId + ":" + updatedAt,
        match_id: matchId, stage: round, player1: match.player1, player2: match.player2,
        score1, score2, winner,
        change_type: history[history.length - 1]?.action === "corrected" ? "corrected" : "recorded",
        recorded_at: updatedAt,
      });
      const bracketSnapshot = next.brackets as Record<string, any[]>;
      const roundTitles: Record<string, string> = { round16: "یک‌هشتم نهایی", quarter: "یک‌چهارم نهایی", semi: "نیمه‌نهایی", final: "فینال", third_place: "رده‌بندی" };
      const nextFixtures = Object.entries(bracketSnapshot).flatMap(([nextRound, rows]) =>
        (Array.isArray(rows) ? rows : []).flatMap((item: any) => {
          const side = item.player1_source === "winner:" + matchId ? "player1"
            : item.player2_source === "winner:" + matchId ? "player2"
            : item.player1_source === "loser:" + matchId ? "player1"
            : item.player2_source === "loser:" + matchId ? "player2" : null;
          return side ? [{ round: nextRound, item, side, sourceKind: item[side + "_source"].split(":")[0] }] : [];
        })
      );
      const currentRoundTitle = roundTitles[round] ?? round;
      let bracketMessage: string;
      if (nextFixtures.length) {
        const upcoming = nextFixtures[0];
        const opponent = upcoming.item[upcoming.side === "player1" ? "player2" : "player1"];
        const advancingPlayer = upcoming.sourceKind === "winner" ? winner : (winner === match.player1 ? match.player2 : match.player1);
        bracketMessage = [
          telegramAnnouncementHeader("به‌روزرسانی مسیر قهرمانی", currentRoundTitle),
          "",
          "✅ نتیجه مسابقه <b>" + escapeTelegramHtml(matchId) + "</b> ثبت شد.",
          "🏆 صعودکننده: " + telegramId(advancingPlayer),
          "",
          "<b>مرحله بعد · " + escapeTelegramHtml(roundTitles[upcoming.round] ?? upcoming.round) + "</b>",
          telegramId(upcoming.item.id),
          telegramId(advancingPlayer) + "  مقابل  " + telegramId(opponent),
          "",
          "<i>بازی، رقابت، قهرمانی</i>",
        ].join("\n\n");
      } else if (round === "final" || round === "third_place") {
        bracketMessage = [
          telegramAnnouncementHeader(round === "final" ? "قهرمان سری دوم مشخص شد" : "نتیجه مسابقه رده‌بندی", currentRoundTitle),
          "",
          "🏆 برنده: " + telegramId(winner),
          "نتیجه: <b>" + score1 + "–" + score2 + "</b>",
          "",
          "<i>بازی، رقابت، قهرمانی</i>",
        ].join("\n\n");
      } else {
        bracketMessage = "";
      }
      if (bracketMessage) {
        try {
          const eventKey = await telegramHash(round + ":" + matchId + ":" + updatedAt);
          await queueAndSendTelegramAnnouncement(adminClient, {
            event_key: "series2:bracket_update:" + eventKey, announcement_type: "bracket_update",
            payload: { round, match_id: matchId, progression_updated_at: updatedAt }, message: bracketMessage,
          });
        } catch (announcementError) {
          console.error("Bracket announcement failed after result was saved:", announcementError);
        }
      }

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
