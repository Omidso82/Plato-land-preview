import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
});
const fa = (value: number) => value.toLocaleString("fa-IR");
const escapeHtml = (value: unknown) => String(value ?? "—")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const code = (value: unknown) => "<code>" + escapeHtml(value) + "</code>";
const header = (title: string, subtitle: string) => [
  "<b>♛ PLATO LAND</b>", "<b>لیگ تخته‌نرد · سری سوم</b>",
  "<b>" + escapeHtml(title) + "</b>", subtitle ? "<i>" + escapeHtml(subtitle) + "</i>" : "",
  "━━━━━━━━━━━━━━━━━━",
].filter(Boolean).join("\n");
const footer = "<i>بازی، رقابت، قهرمانی</i>";
const plain = (html: string) => html
  .replace(/<\/?(?:b|i|code|pre)>/g, "")
  .replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"');

type Player = { id?: string; plato_id: string; games_won?: number | null; games_played?: number | null; registration_status?: string };
type MatchToken = { id?: string; label?: string; source?: string; group?: string };
type BracketMatch = { id: string; a: MatchToken; b: MatchToken };
type Bracket = { round32?: BracketMatch[]; round16?: BracketMatch[]; quarterfinals?: BracketMatch[]; semifinals?: BracketMatch[]; final?: BracketMatch[] };
type Message = { section_id: string; title: string; text: string; plain_text: string; item_count: number };

const roundConfig: Record<string, { title: string; subtitle: string }> = {
  round32: { title: "قرعه مرحله ۳۲ نفره", subtitle: "۱۶ مسابقه · مسیر ورود به جمع ۱۶ بازیکن" },
  round16: { title: "قرعه مرحله ۱۶ نفره", subtitle: "۸ مسابقه · مسیر صعود به یک‌چهارم نهایی" },
  quarterfinals: { title: "برنامه یک‌چهارم نهایی", subtitle: "۴ مسابقه · رقابت برای صعود به نیمه‌نهایی" },
  semifinals: { title: "برنامه نیمه‌نهایی", subtitle: "۲ مسابقه · گام پایانی تا فینال" },
  final: { title: "مسابقه فینال", subtitle: "رقابت نهایی برای قهرمانی سری سوم" },
};

function makeMessage(sectionId: string, title: string, subtitle: string, lines: string[], count: number): Message {
  const text = [header(title, subtitle), "", ...lines, "", footer].join("\n");
  if (text.length > 3900) throw new Error("طول پیام «" + title + "» از حد امن تلگرام بیشتر است.");
  return { section_id: sectionId, title, text, plain_text: plain(text), item_count: count };
}
function playerWinRate(player: Player): string {
  const played = Number(player.games_played ?? 0);
  const won = Number(player.games_won ?? 0);
  return played > 0
    ? (won / played * 100).toLocaleString("fa-IR", { maximumFractionDigits: 2 }) + "٪"
    : "—";
}
function playerStats(player: Player): string {
  const played = Number(player.games_played ?? 0);
  const won = Number(player.games_won ?? 0);
  return fa(won) + " برد از " + fa(played) + " بازی · " + playerWinRate(player);
}
function playerName(player: Player): string { return code(player.plato_id); }
function buildMessages(selected: string[], ranking: Player[], pots: Player[][], groups: Array<{name:string;players:Player[]}>, bracket: Bracket): Message[] {
  const result: Message[] = [];
  const allowed = new Set(["ranking", ...[1,2,3,4].map(n=>"pot:"+n), ..."ABCDEFGHIJKL".split("").map(g=>"group:"+g), ...Object.keys(roundConfig).map(k=>"bracket:"+k)]);
  if (selected.length < 1 || selected.length > 24 || selected.some(id => !allowed.has(id))) throw new Error("فهرست انتخاب‌ها معتبر نیست؛ صفحه را تازه‌سازی کن.");
  for (const id of selected) {
    if (id === "ranking") {
      if (ranking.length !== 48) throw new Error("Snapshot رتبه‌بندی ۴۸ بازیکن کامل نیست.");
      const rankHeading = "ردیف";
      const idHeading = "Plato ID";
      const winsHeading = "تعداد برد";
      const rateHeading = "میانگین برد";
      const rankWidth = Math.max(rankHeading.length, fa(ranking.length).length);
      const idWidth = Math.max(idHeading.length, ...ranking.map(p => String(p.plato_id ?? "").length));
      const winsWidth = Math.max(winsHeading.length, ...ranking.map(p => fa(Number(p.games_won ?? 0)).length));
      const rateWidth = rateHeading.length;
      // Force a left-to-right base direction inside Telegram's preformatted block
      // so all four headings stay above their matching values in RTL chats.
      const lrm = "\u200E";
      const rows = [
        lrm + rankHeading.padStart(rankWidth) + "  " + idHeading.padEnd(idWidth) + "  " + winsHeading.padStart(winsWidth) + "  " + rateHeading + lrm,
        ...ranking.map((p, i) =>
          lrm + fa(i + 1).padStart(rankWidth) + "  " + String(p.plato_id ?? "—").padEnd(idWidth) + "  " + fa(Number(p.games_won ?? 0)).padStart(winsWidth) + "  " + playerWinRate(p).padStart(rateWidth) + lrm
        ),
      ];
      const lines = ["<pre>" + escapeHtml(rows.join("\n")) + "</pre>"];
      result.push(makeMessage(id,"جدول رتبه‌بندی ۴۸ بازیکن","ردیف ۱ تا ۴۸ · Plato ID · تعداد برد · میانگین برد",lines,ranking.length));
      continue;
    }
    if (id.startsWith("pot:")) {
      const index = Number(id.split(":")[1])-1;
      const pot = pots[index];
      if (!Array.isArray(pot) || pot.length !== 12) throw new Error("اطلاعات سید انتخاب‌شده کامل نیست.");
      const lines = pot.map((p,i)=>(fa(index*12+i+1)+". "+playerName(p)));
      result.push(makeMessage(id,"سید "+fa(index+1),"۱۲ بازیکن بر اساس رتبه ثبت‌شده",lines,pot.length));
      continue;
    }
    if (id.startsWith("group:")) {
      const name = id.split(":")[1];
      const group = groups.find(g=>g.name===name);
      if (!group || group.players.length !== 4) throw new Error("اطلاعات گروه "+name+" کامل نیست.");
      const lines = group.players.map((p,i)=>(fa(i+1)+". "+playerName(p)+"  ·  سید "+fa(i+1)));
      result.push(makeMessage(id,"معرفی گروه "+name,"ترکیب چهار نفره گروه",lines,group.players.length));
      continue;
    }
    if (id.startsWith("bracket:")) {
      const key = id.slice("bracket:".length);
      const config = roundConfig[key];
      const matches = bracket[key as keyof Bracket];
      if (!config || !Array.isArray(matches)) throw new Error("اطلاعات مرحله حذفی انتخاب‌شده پیدا نشد.");
      const expected = key==="round32"?16:key==="round16"?8:key==="quarterfinals"?4:key==="semifinals"?2:1;
      if (matches.length !== expected) throw new Error("تعداد مسابقه‌های "+config.title+" با براکت ثبت‌شده مطابقت ندارد.");
      const lines = matches.map((match,i)=>[
        "<b>مسابقه "+fa(i+1)+"</b>  ·  "+code(match.id),
        playerToken(match.a)+"  <b>مقابل</b>  "+playerToken(match.b),
      ].join("\n"));
      result.push(makeMessage(id,config.title,config.subtitle,lines,matches.length));
    }
  }
  return result;
}
function playerToken(token: MatchToken): string {
  return code(token?.label || token?.id || "جایگاه مشخص‌نشده");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST required." }, 405);
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !anonKey || !serviceKey) return json({ error: "Service configuration unavailable." }, 500);
  const authorization = req.headers.get("Authorization") ?? "";
  const token = authorization.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : "";
  if (!token) return json({ error: "Unauthorized." }, 401);

  const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: "Bearer " + token } }, auth: { persistSession: false, autoRefreshToken: false } });
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    const { data: authData, error: authError } = await authClient.auth.getUser();
    if (authError || !authData.user) return json({ error: "نشست معتبر نیست؛ دوباره وارد پنل شو." }, 401);
    const { data: role, error: roleError } = await admin.from("user_roles").select("role").eq("user_id", authData.user.id).maybeSingle();
    if (roleError || role?.role !== "owner") return json({ error: "این قابلیت فقط در اختیار مالک است." }, 403);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "درخواست معتبر نیست." }, 400);
    const action = body.action;
    if (action !== "preview" && action !== "send") return json({ error: "عملیات درخواست معتبر نیست." }, 400);
    const selected = Array.isArray(body.sections) ? body.sections.map((x: unknown)=>String(x)) : [];

    const wantsBracket = selected.some((id:string)=>id.startsWith("bracket:"));
    const wantsSeeding = selected.some((id:string)=>!id.startsWith("bracket:"));
    const [seedingResult, knockoutResult] = await Promise.all([
      wantsSeeding
        ? admin.from("plato_land_series3_seeding_draws").select("ranking_snapshot,pots_snapshot,groups_snapshot").eq("event_key","series3").maybeSingle()
        : Promise.resolve({data:null,error:null}),
      wantsBracket
        ? admin.from("plato_land_series3_knockout_draws").select("bracket_snapshot").eq("event_key","series3").maybeSingle()
        : Promise.resolve({data:null,error:null}),
    ]);
    if (seedingResult.error) throw seedingResult.error;
    if (knockoutResult.error) throw knockoutResult.error;
    const seeding = seedingResult.data;
    const knockout = knockoutResult.data;
    if (wantsSeeding && !seeding) return json({ error: "قرعه گروهی سری سوم هنوز در دیتابیس ثبت نشده است." }, 409);
    if (wantsBracket && !knockout) return json({ error: "براکت حذفی سری سوم هنوز در دیتابیس ثبت نشده است." }, 409);

    const ranking = Array.isArray(seeding?.ranking_snapshot) ? seeding.ranking_snapshot as Player[] : [];
    const pots = Array.isArray(seeding?.pots_snapshot) ? seeding.pots_snapshot as Player[][] : [];
    const groups = Array.isArray(seeding?.groups_snapshot) ? seeding.groups_snapshot as Array<{name:string;players:Player[]}> : [];
    const bracket = (knockout?.bracket_snapshot ?? {}) as Bracket;
    if (wantsSeeding && (groups.length !== 12 || groups.some(g=>!Array.isArray(g.players)||g.players.length!==4))) return json({ error: "Snapshot گروه‌های سری سوم کامل نیست." }, 409);

    const messages = buildMessages(selected,ranking,pots,groups,bracket);
    if (action === "preview") return json({ ok: true, destination: "test_group", messages });

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
    const chatId = Deno.env.get("TELEGRAM_TEST_CHAT_ID") ?? "";
    if (!botToken || !chatId) return json({ error: "تنظیمات ربات یا گروه آزمایشی در سمت سرور موجود نیست." }, 500);
    const results: Array<{section_id:string;message_id:number}> = [];
    for (const [index, message] of messages.entries()) {
      // Telegram group rate limit: keep the batch below 20 messages per minute.
      if (index > 0) await new Promise(resolve => setTimeout(resolve, 3100));
      const response = await fetch("https://api.telegram.org/bot"+botToken+"/sendMessage", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message.text, parse_mode: "HTML", disable_web_page_preview: true }),
      });
      const sent = await response.json().catch(()=>null);
      if (!response.ok || !sent?.ok) {
        return json({ sent: false, sent_count: results.length, failed_section: message.section_id, results, error: String(sent?.description ?? "Telegram send failed.") }, 502);
      }
      results.push({ section_id: message.section_id, message_id: Number(sent.result?.message_id ?? 0) });
    }
    return json({ sent: true, sent_count: results.length, destination: "test_group", results });
  } catch (error) {
    console.error("Series 3 Telegram publishing failed:", error);
    return json({ error: error instanceof Error ? error.message : "Unable to process Telegram request." }, 500);
  }
});
