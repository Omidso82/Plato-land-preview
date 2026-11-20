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
type Fixture = { id:string; group:string; round:number; match_no:number; player_a:{plato_id:string}; player_b:{plato_id:string}; time:string };
type FixtureSnapshot = { group_stage:{days:Array<{round:number;persian_date:string;time:string;matches:Fixture[]}>} };
type PredictionQuestion = { id:string; label:string; type?:string; options?:string[]; match?:{matchId?:string;stage?:string;roundNo?:number;matchDate?:string}|null };
type PredictionCampaign = { id:string; title:string; description:string|null; campaign_type:string; status:string; is_open:boolean; opens_at:string|null; closes_at:string|null; questions:PredictionQuestion[]; prize_rules:Record<string,unknown>|null };
type PredictionEntry = { id:string; voter_plato_id:string; response:Record<string,unknown>|null; result_status:string|null };
type MatchResult = { match_id:string; result_status:string; score_a:number|null; score_b:number|null; player_a_plato_id:string; player_b_plato_id:string };
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
function formatTehranDate(value: string|null): string {
  if (!value) return '';
  const date=new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',dateStyle:'long',timeStyle:'short'}).format(date)+' به وقت تهران';
}
function buildPredictionMessage(campaign: PredictionCampaign): Message {
  if (campaign.status!=='published') throw new Error('فقط پیش‌بینی‌های منتشرشده قابل انتشار در تلگرام هستند.');
  const lines:string[]=[];
  if (campaign.description?.trim()) lines.push(escapeHtml(campaign.description.trim()));
  lines.push('<b>وضعیت شرکت:</b> '+(campaign.is_open?'دریافت پیش‌بینی باز است':'دریافت پیش‌بینی بسته است'));
  if (campaign.opens_at) lines.push('<b>شروع:</b> '+escapeHtml(formatTehranDate(campaign.opens_at)));
  if (campaign.closes_at) lines.push('<b>پایان:</b> '+escapeHtml(formatTehranDate(campaign.closes_at)));
  const prize=campaign.prize_rules?.description;
  if (typeof prize==='string' && prize.trim()) lines.push('<b>جایزه:</b> '+escapeHtml(prize.trim()));
  let optionCount=0;
  for (const question of campaign.questions||[]) {
    lines.push('', '<b>'+escapeHtml(question.label||'گزینه‌های پیش‌بینی')+'</b>');
    const options=Array.isArray(question.options)?question.options:[];
    if (options.length) { optionCount+=options.length; lines.push(...options.map((option,index)=>fa(index+1)+'. '+code(option))); }
    else if (question.type==='text') lines.push('پاسخ متنی');
    else if (question.type==='number') lines.push('پاسخ عددی');
  }
  lines.push('', '<b>ثبت پیش‌بینی:</b> https://platoland.org/predictions');
  return makeMessage('prediction:'+campaign.id,campaign.title,'پیش‌بینی قهرمان · سری سوم',lines,optionCount||campaign.questions.length);
}
function buildVoterReportMessages(campaign: PredictionCampaign, entries: PredictionEntry[], results: MatchResult[]): Message[] {
  if (campaign.status !== "published") throw new Error("کمپین انتخاب‌شده منتشرشده نیست.");
  const resultById = new Map(results.map(item => [item.match_id, item]));
  const questions = campaign.questions || [];
  return entries.map(entry => {
    const response = entry.response && typeof entry.response === "object" ? entry.response : {};
    const lines: string[] = [];
    if (campaign.campaign_type === "champion") {
      const picked = response.champion;
      lines.push("<b>نوع پیش‌بینی:</b> قهرمان سری سوم");
      lines.push("<b>انتخاب ثبت‌شده:</b> " + code(typeof picked === "string" ? picked : "ثبت نشده"));
      lines.push("<b>نتیجه ارزیابی:</b> در انتظار نتیجه");
      lines.push("<i>نتیجه رسمی قهرمان هنوز در منبع قطعی ثبت نشده است.</i>");
    } else if (campaign.campaign_type === "match_predictions") {
      let correct = 0, incorrect = 0, pending = 0, unknown = 0;
      for (const question of questions) {
        const matchId = question.match?.matchId;
        const picked = response[question.id];
        const match = typeof matchId === "string" ? resultById.get(matchId) : undefined;
        let status = "نامشخص", winner = "";
        if (!match) { unknown++; }
        else if (match.result_status === "pending" || match.score_a === null || match.score_b === null || match.score_a === match.score_b) {
          status = "در انتظار نتیجه"; pending++;
        } else if (Number.isFinite(match.score_a) && Number.isFinite(match.score_b)) {
          winner = match.score_a! > match.score_b! ? match.player_a_plato_id : match.player_b_plato_id;
          if (typeof picked !== "string" || !picked) { status = "بدون پاسخ"; unknown++; }
          else if (picked.toLowerCase() === winner.toLowerCase()) { status = "درست"; correct++; }
          else { status = "نادرست"; incorrect++; }
        } else { unknown++; }
        lines.push("<b>" + escapeHtml(question.label || matchId || question.id) + "</b>");
        lines.push("پیش‌بینی: " + code(typeof picked === "string" ? picked : "ثبت نشده"));
        lines.push("برنده واقعی: " + code(winner || (status === "در انتظار نتیجه" ? "هنوز ثبت نشده" : "نامشخص")));
        lines.push("ارزیابی: <b>" + escapeHtml(status) + "</b>");
      }
      lines.unshift("<b>خلاصه:</b> درست " + fa(correct) + " · نادرست " + fa(incorrect) + " · در انتظار " + fa(pending) + " · نامشخص " + fa(unknown));
    } else throw new Error("نوع کمپین برای گزارش نتیجه پشتیبانی نمی‌شود.");
    return makeMessage("prediction-report:" + campaign.id + ":" + entry.id, "گزارش نتیجه پیش‌بینی · " + entry.voter_plato_id, campaign.title, lines, campaign.campaign_type === "match_predictions" ? questions.length : 1);
  });
}

function buildMessages(selected: string[], ranking: Player[], pots: Player[][], groups: Array<{name:string;players:Player[]}>, bracket: Bracket, fixtures: FixtureSnapshot|undefined, predictions: PredictionCampaign[]): Message[] {
  const result: Message[] = [];
  const groupNames = "ABCDEFGHIJKL".split("");
  const fixtureIds = [1,2,3].flatMap(day => ["fixtures:day:"+day+":ALL", ...groupNames.map(g=>"fixtures:day:"+day+":"+g)]);
  const predictionIds=new Set(predictions.map(c=>'prediction:'+c.id));
  const allowed = new Set(["ranking", ...[1,2,3,4].map(n=>"pot:"+n), ...groupNames.map(g=>"group:"+g), ...Object.keys(roundConfig).map(k=>"bracket:"+k), ...fixtureIds, ...predictionIds]);
  if (selected.length < 1 || selected.length > 80 || selected.some(id => !allowed.has(id))) throw new Error("فهرست انتخاب‌ها معتبر نیست؛ صفحه را تازه‌سازی کن.");
  for (const id of selected) {
    if (id.startsWith('prediction:')) {
      const campaign=predictions.find(c=>'prediction:'+c.id===id);
      if (!campaign) throw new Error('پیش‌بینی انتخاب‌شده دیگر منتشرشده نیست؛ فهرست را تازه‌سازی کن.');
      result.push(buildPredictionMessage(campaign));
      continue;
    }
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
    if (id.startsWith("fixtures:day:")) {
      if (!fixtures?.group_stage?.days) throw new Error("برنامه مسابقات گروهی در دیتابیس ثبت نشده است.");
      const parts = id.split(":");
      const dayNo = Number(parts[2]);
      const groupFilter = parts[3];
      const day = fixtures.group_stage.days.find(d=>d.round===dayNo);
      if (!day) throw new Error("روز انتخاب‌شده در برنامه مسابقات پیدا نشد.");
      const matches = day.matches.filter(m=>groupFilter==="ALL" || m.group===groupFilter);
      const expected = groupFilter==="ALL"?24:2;
      if (matches.length!==expected) throw new Error("تعداد مسابقات برنامه با ساختار مصوب مطابقت ندارد.");
      const lines = matches.map(m=>[
        "<b>گروه "+escapeHtml(m.group)+" · بازی "+fa(m.match_no)+"</b>",
        code(m.player_a.plato_id)+"  <b>مقابل</b>  "+code(m.player_b.plato_id)+"  ·  "+escapeHtml(m.time)
      ].join("\n"));
      const scopeTitle = groupFilter==="ALL" ? "همه گروه‌ها" : "گروه "+groupFilter;
      result.push(makeMessage(id,"برنامه روز "+fa(dayNo)+" · "+scopeTitle,day.persian_date+" · ساعت ۲۱:۰۰ تهران",lines,matches.length));
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
    const reportCampaignId = typeof body.report_campaign_id === "string" ? body.report_campaign_id : "";
    const reportVoterIds = Array.isArray(body.report_voter_ids) ? [...new Set(body.report_voter_ids.map((x:unknown)=>String(x)))] : [];
    const reportMode = Boolean(reportCampaignId || reportVoterIds.length);
    if (reportMode && (!/^[-a-f0-9]{36}$/i.test(reportCampaignId) || reportVoterIds.length < 1 || reportVoterIds.length > 100)) return json({error:"کمپین یا فهرست رأی‌دهندگان برای گزارش معتبر نیست."},400);

    const wantsFixtures = selected.some((id:string)=>id.startsWith("fixtures:day:"));
    const wantsBracket = selected.some((id:string)=>id.startsWith("bracket:"));
    const wantsSeeding = selected.some((id:string)=>id==="ranking"||id.startsWith("pot:")||id.startsWith("group:")||id.startsWith("fixtures:day:"));
    const predictionIds=selected.filter((id:string)=>id.startsWith('prediction:')).map((id:string)=>id.slice('prediction:'.length));
    if (predictionIds.some((id:string)=>!/^[-a-f0-9]{36}$/i.test(id))) return json({error:'شناسه پیش‌بینی معتبر نیست.'},400);
    const [seedingResult, knockoutResult, fixturesResult, predictionsResult, reportCampaignResult, reportEntriesResult, reportMatchesResult] = await Promise.all([
      wantsSeeding
        ? admin.from("plato_land_series3_seeding_draws").select("ranking_snapshot,pots_snapshot,groups_snapshot").eq("event_key","series3").maybeSingle()
        : Promise.resolve({data:null,error:null}),
      wantsBracket
        ? admin.from("plato_land_series3_knockout_draws").select("bracket_snapshot").eq("event_key","series3").maybeSingle()
        : Promise.resolve({data:null,error:null}),
      wantsFixtures
        ? admin.from("plato_land_series3_group_fixtures").select("schedule_snapshot").eq("event_key","series3").maybeSingle()
        : Promise.resolve({data:null,error:null}),
      predictionIds.length
        ? admin.from('plato_land_prediction_campaigns').select('id,title,description,campaign_type,status,is_open,opens_at,closes_at,questions,prize_rules').eq('event_key','series3').eq('status','published').in('id',predictionIds)
        : Promise.resolve({data:[],error:null}),
      reportMode
        ? admin.from('plato_land_prediction_campaigns').select('id,title,description,campaign_type,status,questions,prize_rules').eq('event_key','series3').eq('id',reportCampaignId).eq('status','published').maybeSingle()
        : Promise.resolve({data:null,error:null}),
      reportMode
        ? admin.from('plato_land_prediction_entries').select('id,voter_plato_id,response,result_status').eq('campaign_id',reportCampaignId).in('id',reportVoterIds)
        : Promise.resolve({data:[],error:null}),
      reportMode
        ? admin.from('plato_land_series3_group_match_results').select('match_id,result_status,score_a,score_b,player_a_plato_id,player_b_plato_id').eq('event_key','series3')
        : Promise.resolve({data:[],error:null}),
    ]);
    if (seedingResult.error) throw seedingResult.error;
    if (fixturesResult.error) throw fixturesResult.error;
    if (knockoutResult.error) throw knockoutResult.error;
    if (predictionsResult.error) throw predictionsResult.error;
    if (reportCampaignResult.error) throw reportCampaignResult.error;
    if (reportEntriesResult.error) throw reportEntriesResult.error;
    if (reportMatchesResult.error) throw reportMatchesResult.error;
    const predictions=(predictionsResult.data||[]) as PredictionCampaign[];
    if (predictions.length!==predictionIds.length) return json({error:'یکی از پیش‌بینی‌های انتخاب‌شده منتشرشده نیست یا تغییر کرده است؛ فهرست را تازه‌سازی کن.'},409);
    const seeding = seedingResult.data;
    const knockout = knockoutResult.data;
    if (wantsSeeding && !seeding) return json({ error: "قرعه گروهی سری سوم هنوز در دیتابیس ثبت نشده است." }, 409);
    if (wantsBracket && !knockout) return json({ error: "براکت حذفی سری سوم هنوز در دیتابیس ثبت نشده است." }, 409);

    const ranking = Array.isArray(seeding?.ranking_snapshot) ? seeding.ranking_snapshot as Player[] : [];
    const pots = Array.isArray(seeding?.pots_snapshot) ? seeding.pots_snapshot as Player[][] : [];
    const groups = Array.isArray(seeding?.groups_snapshot) ? seeding.groups_snapshot as Array<{name:string;players:Player[]}> : [];
    const bracket = (knockout?.bracket_snapshot ?? {}) as Bracket;
    const fixtures = (fixturesResult.data?.schedule_snapshot ?? undefined) as FixtureSnapshot | undefined;
    if (wantsFixtures && !fixtures) return json({ error: "برنامه مسابقات سری سوم هنوز در دیتابیس ثبت نشده است." }, 409);
    if (wantsSeeding && (groups.length !== 12 || groups.some(g=>!Array.isArray(g.players)||g.players.length!==4))) return json({ error: "Snapshot گروه‌های سری سوم کامل نیست." }, 409);

    let messages: Message[];
    if (reportMode) {
      const reportCampaign = reportCampaignResult.data as PredictionCampaign | null;
      if (!reportCampaign || !["champion","match_predictions"].includes(reportCampaign.campaign_type)) return json({error:"کمپین گزارش پیدا نشد یا نوع آن پشتیبانی نمی‌شود."},404);
      const reportEntries = (reportEntriesResult.data || []) as PredictionEntry[];
      if (reportEntries.length !== reportVoterIds.length) return json({error:"فهرست رأی‌دهندگان با داده‌های کمپین مطابقت ندارد؛ فهرست را تازه‌سازی کن."},409);
      messages = buildVoterReportMessages(reportCampaign, reportEntries, (reportMatchesResult.data || []) as MatchResult[]);
      if (messages.length > 100) return json({error:"تعداد پیام‌های گزارش از سقف مجاز بیشتر است."},400);
    } else {
      messages = buildMessages(selected,ranking,pots,groups,bracket,fixtures,predictions);
    }
    if (reportMode && action === "send") return json({error:"گزارش‌های شخصی به دلیل محرمانگی به گروه یا کانال عمومی ارسال نمی‌شوند؛ ابتدا باید مقصد خصوصی معتبر برای هر رأی‌دهنده تعریف شود."},409);

    const allowedDestinations = new Set(["test_group", "main_channel"]);
    const requestedDestinations: string[] = Array.isArray(body.destinations)
      ? [...new Set((body.destinations as unknown[]).map((value) => String(value)))]
      : [];
    if (requestedDestinations.length < 1 || requestedDestinations.length > 2 ||
        requestedDestinations.some((value: string) => !allowedDestinations.has(value))) {
      return json({ error: "حداقل یک مقصد معتبر انتخاب کن؛ مقصدهای مجاز فقط گروه آزمایشی و کانال اصلی هستند." }, 400);
    }
    const destinationLabels: Record<string,string> = {
      test_group: "گروه آزمایشی PLATO LAND",
      main_channel: "کانال اصلی PLATO LAND",
    };
    if (action === "preview") {
      return json({ ok: true, destinations: requestedDestinations.map((id:string)=>({id,label:destinationLabels[id]})), messages });
    }

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
    if (!botToken) return json({ error: "توکن ربات در سمت سرور تنظیم نشده است؛ هیچ پیامی ارسال نشد." }, 500);
    const chatIds: Record<string,string> = {
      test_group: Deno.env.get("TELEGRAM_TEST_CHAT_ID") ?? "",
      main_channel: Deno.env.get("TELEGRAM_MAIN_CHANNEL_ID") ?? "",
    };
    let attemptHistorySaved = true;
    const destinationResults: Array<{
      destination:string; label:string; status:"sent"|"partial"|"failed";
      sent_count:number; total_count:number; failed_section:string|null;
      error:string|null; results:Array<{section_id:string;message_id:number}>
    }> = [];

    for (const destination of requestedDestinations) {
      const results: Array<{section_id:string;message_id:number}> = [];
      let failure: string|null = chatIds[destination]
        ? null
        : "شناسه این مقصد در Secretهای سمت سرور تنظیم نشده است.";
      let failedSection: string|null = failure ? "configuration" : null;
      for (const [index, message] of messages.entries()) {
        if (failure) break;
        if (index > 0) await new Promise(resolve => setTimeout(resolve, 3100));
        try {
          const response = await fetch("https://api.telegram.org/bot"+botToken+"/sendMessage", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatIds[destination], text: message.text, parse_mode: "HTML", disable_web_page_preview: true }),
          });
          const sent = await response.json().catch(()=>null);
          if (!response.ok || !sent?.ok) {
            failure = String(sent?.description ?? "Telegram send failed.");
            failedSection = message.section_id;
            break;
          }
          results.push({ section_id: message.section_id, message_id: Number(sent.result?.message_id ?? 0) });
        } catch (sendError) {
          failure = sendError instanceof Error ? sendError.message : "ارتباط با تلگرام برقرار نشد.";
          failedSection = message.section_id;
          break;
        }
      }
      const status: "sent" | "partial" | "failed" = failure
        ? (results.length ? "partial" : "failed")
        : "sent";
      const attempt = {
        destination, label:destinationLabels[destination], status,
        sent_count:results.length, total_count:messages.length,
        failed_section:failedSection, error:failure, results,
      };
      destinationResults.push(attempt);
      const { error:historyError } = await admin.from("plato_land_series3_telegram_delivery_history").insert({
        destination, status, total_count:messages.length, sent_count:results.length,
        failed_section:failedSection, error_message:failure,
        telegram_results:results, sent_by:authData.user.id,
      });
      if (historyError) {
        console.error("Series 3 Telegram history insert failed:", historyError.message);
        attemptHistorySaved = false;
      }
    }

    const allSent = destinationResults.every(item=>item.status==="sent");
    const anySent = destinationResults.some(item=>item.sent_count>0);
    return json({
      sent:allSent, partial:anySent&&!allSent, destination_results:destinationResults,
      sent_count:destinationResults.reduce((sum,item)=>sum+item.sent_count,0),
      total_count:messages.length*destinationResults.length,
      history_saved: attemptHistorySaved,
    }, allSent?200:502);
  } catch (error) {
    console.error("Series 3 Telegram publishing failed:", error);
    return json({ error: error instanceof Error ? error.message : "Unable to process Telegram request." }, 500);
  }
});
