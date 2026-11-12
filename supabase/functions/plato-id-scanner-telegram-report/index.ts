import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TZ = "Asia/Tehran";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
});
const validDate = (v: unknown): v is string =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  (() => { const d = new Date(v + "T12:00:00Z"); return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === v; })();
function tehranOffset(date: Date): string {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: TZ, timeZoneName: "longOffset" }).formatToParts(date);
  return p.find(x => x.type === "timeZoneName")?.value?.replace("GMT", "") || "+03:30";
}
function tehranMidnightUtc(date: string): string {
  const probe = new Date(date + "T12:00:00Z");
  return new Date(date + "T00:00:00" + tehranOffset(probe)).toISOString();
}
function nextDate(value: string, days: number): string {
  const d = new Date(value + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0,10);
}
function escapeHtml(v: string) { return v.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"); }
function chunkLines(header: string, ids: string[], limit = 3500): string[] {
  const chunks: string[] = []; let current = header;
  for (let i=0;i<ids.length;i++) {
    const line = (current === header ? "" : "\n") + (i+1) + ". " + escapeHtml(ids[i]);
    if (current.length + line.length > limit && current !== header) { chunks.push(current); current = header + (i+1) + ". " + escapeHtml(ids[i]); }
    else if (current.length + line.length > limit) throw new Error("A Plato ID exceeds Telegram message limit.");
    else current += line;
  }
  if (current.length || !chunks.length) chunks.push(current);
  return chunks;
}
async function allRows(client: any, table: string, columns: string, filters: (q:any)=>any) {
  const rows:any[]=[]; const size=500;
  for(let offset=0;;offset+=size) {
    let q=client.from(table).select(columns); q=filters(q).range(offset,offset+size-1);
    const {data,error}=await q; if(error) throw error;
    rows.push(...(data||[])); if(!data || data.length<size) return rows;
  }
}
Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return reply({ error: "POST required." }, 405);
  const url=Deno.env.get("SUPABASE_URL"), anon=Deno.env.get("SUPABASE_ANON_KEY"), service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!anon||!service) return reply({error:"Scanner service configuration is incomplete."},500);
  const authorization=request.headers.get("Authorization");
  if(!authorization) return reply({error:"Unauthorized."},401);
  const token=authorization.replace(/^Bearer\s+/i,"").trim();
  const authClient=createClient(url,anon,{global:{headers:{Authorization:"Bearer "+token}},auth:{persistSession:false,autoRefreshToken:false}});
  const {data:auth,error:authError}=await authClient.auth.getUser();
  if(authError||!auth.user?.email_confirmed_at) return reply({error:"Confirmed sign-in required."},401);
  const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:role,error:roleError}=await admin.from("user_roles").select("role").eq("user_id",auth.user.id).maybeSingle();
  if(roleError) return reply({error:"Could not verify role."},500);
  const isOwner=role?.role==="owner";
  if(!isOwner) {
    const {data:access,error}=await admin.from("plato_id_scanner_access").select("status").eq("user_id",auth.user.id).maybeSingle();
    if(error) return reply({error:"Could not verify Scanner access."},500);
    if(access?.status!=="approved") return reply({error:"Approved Scanner access required."},403);
  }
  const body=await request.json().catch(()=>null);
  if(!body||!["preview","send","history"].includes(body.action)) return reply({error:"Invalid report request."},400);\n  if(body.action!=="history"&&!["today","yesterday","last7","custom"].includes(body.period)) return reply({error:"Invalid report period."},400);\n  if(body.action==="history"){\n    const {data:deliveries,error}=await admin.from("plato_id_scanner_telegram_deliveries").select("id,delivery_status,report_version_id,message_count,message_ids,created_at,sent_at,last_error").order("created_at",{ascending:false}).limit(20);\n    if(error) return reply({error:"Delivery history is not available. The Scanner delivery migration may not be applied."},503);\n    const versionIds=(deliveries||[]).map((x:any)=>x.report_version_id);\n    const {data:versions,error:versionsError}=versionIds.length?await admin.from("plato_id_scanner_report_versions").select("id,period_key,version,created_at").in("id",versionIds):{data:[],error:null};\n    if(versionsError) return reply({error:"Report version history could not be loaded."},500);\n    const byId=new Map((versions||[]).map((x:any)=>[x.id,x]));\n    return reply({history:(deliveries||[]).map((x:any)=>({id:x.id,status:x.delivery_status,message_count:x.message_count,message_ids:x.message_ids,created_at:x.created_at,sent_at:x.sent_at,last_error:x.last_error,report:byId.get(x.report_version_id)||null}))});\n  }
  const now=new Date();
  const todayParts=new Intl.DateTimeFormat("en-US",{timeZone:TZ,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now);
  const part=(k:string)=>todayParts.find(x=>x.type===k)?.value||"";
  const today=part("year")+"-"+part("month")+"-"+part("day");
  let start:string|undefined,end:string|undefined,from:string,to:string,periodKey:string,label:string;
  if(body.period==="last7"){
    from=new Date(now.getTime()-7*24*60*60*1000).toISOString();
    to=now.toISOString();
    periodKey=from+".."+to;
    label="هفت روز شناور اخیر تا "+new Intl.DateTimeFormat("fa-IR",{timeZone:TZ,dateStyle:"short",timeStyle:"short"}).format(now)+" (Asia/Tehran)";
  } else {
    if(body.period==="today"){start=today;end=nextDate(today,1);}
    else if(body.period==="yesterday"){start=nextDate(today,-1);end=today;}
    else {
      if(!validDate(body.start_date)||!validDate(body.end_date)||body.start_date>body.end_date) return reply({error:"Custom date range is invalid."},400);
      start=body.start_date;end=nextDate(body.end_date,1);
      const days=(Date.parse(end+"T00:00:00Z")-Date.parse(start+"T00:00:00Z"))/86400000;
      if(days>366) return reply({error:"Custom report range cannot exceed 366 days."},400);
    }
    from=tehranMidnightUtc(start!);to=tehranMidnightUtc(end!);
    periodKey=start!+".."+nextDate(end!,-1);
    label="بازه: "+start!+" تا "+nextDate(end!,-1)+" (Asia/Tehran)";
  }
  try {
    const scans=await allRows(admin,"plato_id_scanner_uploads","id,created_at,status",(q:any)=>q.gte("created_at",from).lt("created_at",to).order("created_at",{ascending:true}));
    const scanIds=scans.map(x=>x.id);
    const revisions=scanIds.length?await allRows(admin,"plato_id_scanner_review_revisions","scan_id,revision,status,canonical_ids",(q:any)=>q.in("scan_id",scanIds).eq("status","approved").order("revision",{ascending:true})): [];
    const latest=new Map<string,any>();
    for(const r of revisions){const old=latest.get(r.scan_id);if(!old||r.revision>old.revision)latest.set(r.scan_id,r);}
    const ordered=[...scans].sort((a,b)=>a.created_at.localeCompare(b.created_at)||a.id.localeCompare(b.id));
    const ids:string[]=[];const seen=new Map<string,string>();const duplicates:any[]=[];let reviewedImages=0;
    for(const scan of ordered){const rev=latest.get(scan.id);if(!rev)continue;reviewedImages++;if(!Array.isArray(rev.canonical_ids))continue;
      for(const id of rev.canonical_ids){if(typeof id!=="string"||id.length===0)continue;const first=seen.get(id);if(!first){seen.set(id,scan.id);ids.push(id);}else{duplicates.push({id,first_scan_id:first,duplicate_scan_id:scan.id});}}
    }
    const periodKey=start+".."+nextDate(end,-1);
    const label="بازه: "+start+" تا "+nextDate(end,-1)+" (Asia/Tehran)";
    const header="<b>♛ PLATO LAND | فهرست نهایی Plato ID</b>\n"+escapeHtml(label)+"\nتصاویر بازبینی و تأییدشده: "+reviewedImages+"\nتعداد ID یکتا: "+ids.length+"\n\n";
    const messages=chunkLines(header,ids);
    if(body.action==="preview") return reply({preview:true,period_key:periodKey,reviewed_images:reviewedImages,id_count:ids.length,duplicate_count:duplicates.length,duplicates,ids,messages});
    if(duplicates.length>0&&body.confirm_exact_duplicates!==true) return reply({error:"Exact duplicates require explicit human confirmation before sending.",duplicate_count:duplicates.length,duplicates,period_key:periodKey},409);
    if(typeof body.request_id!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.request_id)) return reply({error:"A unique request_id is required."},400);
    const botToken=Deno.env.get("TELEGRAM_BOT_TOKEN"),chatId=Deno.env.get("TELEGRAM_TEST_CHAT_ID");
    if(!botToken||!chatId) return reply({error:"The existing Telegram test-group configuration is unavailable."},503);
    const {data:existing}=await admin.from("plato_id_scanner_telegram_deliveries").select("id,delivery_status,message_ids,report_version_id").eq("request_id",body.request_id).maybeSingle();
    if(existing) return reply({sent:existing.delivery_status==="sent",duplicate_request:true,delivery_status:existing.delivery_status,report_version_id:existing.report_version_id,message_ids:existing.message_ids},200);
    const {data:versions,error:versionReadError}=await admin.from("plato_id_scanner_report_versions").select("version").eq("report_kind","telegram_ids").eq("period_key",periodKey).eq("created_by",auth.user.id).order("version",{ascending:false}).limit(1);
    if(versionReadError) throw versionReadError;
    const previous=versions?.[0]?.version??null;
    const {data:report,error:reportError}=await admin.from("plato_id_scanner_report_versions").insert({
      report_kind:"telegram_ids",period_key:periodKey,version:(previous??0)+1,previous_version:previous,
      payload:{period_key:periodKey,from,to,reviewed_images:reviewedImages,ids,duplicate_count:duplicates.length,duplicates,messages},
      created_by:auth.user.id,note:"Manual send to PLATO LAND test Telegram group",
    }).select("id,version").single();
    if(reportError) throw reportError;
    const {data:delivery,error:deliveryError}=await admin.from("plato_id_scanner_telegram_deliveries").insert({
      request_id:body.request_id,report_version_id:report.id,destination_key:"test_group",
      delivery_status:"sending",message_count:messages.length,attempts:1,created_by:auth.user.id,
    }).select("id").single();
    if(deliveryError) throw deliveryError;
    const messageIds:number[]=[];
    try {
      for(const message of messages){
        const response=await fetch("https://api.telegram.org/bot"+botToken+"/sendMessage",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id:chatId,text:message,parse_mode:"HTML",disable_web_page_preview:true})});
        const result=await response.json().catch(()=>null);
        if(!response.ok||!result?.ok) throw new Error(String(result?.description??("Telegram HTTP "+response.status)).slice(0,500));
        if(Number.isInteger(result.result?.message_id)) messageIds.push(result.result.message_id);
      }
      const {error:updateError}=await admin.from("plato_id_scanner_telegram_deliveries").update({delivery_status:"sent",message_ids:messageIds,sent_at:new Date().toISOString(),last_error:null}).eq("id",delivery.id);
      if(updateError) throw updateError;
      return reply({sent:true,period_key:periodKey,report_version:report.version,report_version_id:report.id,reviewed_images:reviewedImages,id_count:ids.length,message_count:messages.length,message_ids:messageIds},200);
    } catch(error) {
      await admin.from("plato_id_scanner_telegram_deliveries").update({delivery_status:"failed",message_ids:messageIds,last_error:String(error).slice(0,1000)}).eq("id",delivery.id);
      return reply({sent:false,partial:messageIds.length>0,report_version:report.version,report_version_id:report.id,message_ids:messageIds,error:"Telegram delivery failed; a versioned attempt was recorded."},502);
    }
  } catch(error) {
    console.error("Scanner Telegram report failed:",error);
    return reply({error:"Report could not be prepared or sent. No success is claimed."},500);
  }
});
