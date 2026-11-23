import {createClient} from "npm:@supabase/supabase-js@2.57.0";

const cors={
  "Access-Control-Allow-Origin":"https://platoland.org",
  "Access-Control-Allow-Methods":"POST, OPTIONS",
  "Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info",
  "Cache-Control":"no-store",
  "Vary":"Origin",
};
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:cors});

Deno.serve(async request=>{
  const origin=request.headers.get("Origin");
  if(origin&&origin!=="https://platoland.org")return reply({error:"Origin not allowed."},403);
  if(request.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
  if(request.method!=="POST")return reply({error:"POST required."},405);
  const url=Deno.env.get("SUPABASE_URL");
  const anon=Deno.env.get("SUPABASE_ANON_KEY");
  const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const bot=Deno.env.get("TELEGRAM_BOT_TOKEN");
  if(!url||!anon||!service||!bot)return reply({error:"Telegram service is not configured."},503);
  const authorization=request.headers.get("Authorization")??"";
  if(!authorization.startsWith("Bearer "))return reply({error:"Unauthorized."},401);
  const auth=createClient(url,anon,{global:{headers:{Authorization:authorization}},auth:{persistSession:false}});
  const {data:user,error:userError}=await auth.auth.getUser();
  if(userError||!user.user)return reply({error:"Unauthorized."},401);
  const {data:role,error:roleError}=await auth.rpc("current_user_role");
  if(roleError||(role!=="owner"&&role!=="مالک کل"))return reply({error:"Owner access required."},403);
  const body=await request.json().catch(()=>null);
  if(!body || !/^[0-9a-f-]{36}$/i.test(body.request_id??"") || typeof body.message!=="string" ||
      !body.message.startsWith("PLATO LAND | سری چهارم تخته‌نرد\n") || body.message.length>4096 ||
      !Array.isArray(body.destinations)||!body.destinations.length||body.destinations.length>2||
      body.destinations.some((destination:unknown)=>destination!=="test_group"&&destination!=="main_channel")) {
    return reply({error:"Invalid Series 4 report."},400);
  }
  const destinations=[...new Set<string>(body.destinations)];
  const keys:Record<string,string>={
    test_group:"TELEGRAM_TEST_CHAT_ID",
    main_channel:"TELEGRAM_MAIN_CHANNEL_ID",
  };
  const admin=createClient(url,service,{auth:{persistSession:false}});
  const history=admin.from("plato_land_series4_telegram_delivery_history");
  const results=[];
  for(const destination of destinations){
    const chat=Deno.env.get(keys[destination]);
    if(!chat){results.push({destination,status:"unconfigured"});continue;}
    const {error:claimError}=await history.insert({
      request_id:body.request_id,destination,sent_by:user.user.id,status:"sending",
    });
    if(claimError){
      const {data:existing}=await history.select("status,message_id")
        .eq("request_id",body.request_id).eq("destination",destination).maybeSingle();
      results.push({destination,status:existing?.status??"failed",message_id:existing?.message_id??null});
      continue;
    }
    let status="uncertain";
    let messageId=null;
    try{
      const response=await fetch("https://api.telegram.org/bot"+bot+"/sendMessage",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({chat_id:chat,text:body.message}),
        signal:AbortSignal.timeout(12000),
      });
      const result=await response.json().catch(()=>null);
      if(response.ok&&result?.ok&&Number.isSafeInteger(result.result?.message_id)){
        status="sent";messageId=result.result.message_id;
      }else if(result?.ok===false){status="failed";}
    }catch{/* Uncertain delivery is kept in history to prevent duplicate retries. */}
    const {error:historyError}=await history.update({status,message_id:messageId})
      .eq("request_id",body.request_id).eq("destination",destination);
    results.push({destination,status:historyError?"uncertain":status,message_id:messageId});
  }
  return reply({results});
});
