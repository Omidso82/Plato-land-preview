import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,"Content-Type":"application/json"}});
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
 if(req.method!=="POST")return json({error:"Method not allowed"},405);
 const supabaseUrl=Deno.env.get("SUPABASE_URL"),anonKey=Deno.env.get("SUPABASE_ANON_KEY"),serviceRoleKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),authorization=req.headers.get("Authorization");
 if(!supabaseUrl||!anonKey||!serviceRoleKey||!authorization)return json({error:"Service configuration or authentication is unavailable."},500);
 try{
  const token=authorization.toLowerCase().startsWith("bearer ")?authorization.slice(7).trim():authorization.trim();
  const authClient=createClient(supabaseUrl,anonKey,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
  const {data:authData,error:authError}=await authClient.auth.getUser();
  if(authError||!authData.user)return json({error:"Unauthorized"},401);
  const adminClient=createClient(supabaseUrl,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:roleRow,error:roleError}=await adminClient.from("user_roles").select("role").eq("user_id",authData.user.id).maybeSingle();
  if(roleError||roleRow?.role!=="owner")return json({error:"Forbidden"},403);
  const body=await req.json().catch(()=>({}));
  if(body?.action==="save_stats"){
   const requestId=typeof body.requestId==="string"?body.requestId:"",gamesPlayed=Number(body.gamesPlayed),gamesWon=Number(body.gamesWon);
   if(!requestId||!Number.isSafeInteger(gamesPlayed)||!Number.isSafeInteger(gamesWon)||gamesPlayed<0||gamesWon<0||gamesWon>gamesPlayed)return json({error:"تعداد بازی و برد باید عدد صحیح نامنفی باشد و تعداد برد از تعداد بازی بیشتر نباشد."},400);
   const {data,error}=await adminClient.from("plato_land_series2_player_stats").upsert({request_id:requestId,games_played:gamesPlayed,games_won:gamesWon,updated_at:new Date().toISOString()},{onConflict:"request_id"}).select("request_id,games_played,games_won,updated_at").single();
   if(error)throw error;return json({saved:data});
  }
  const {data:requests,error:requestError}=await adminClient.from("plato_land_series2_registration_requests").select("id,plato_id,created_at").order("created_at",{ascending:true});
  if(requestError)throw requestError;
  const ids=(requests||[]).map((row:any)=>row.id);let stats:any[]=[];
  if(ids.length){const {data,error}=await adminClient.from("plato_land_series2_player_stats").select("request_id,games_played,games_won,updated_at").in("request_id",ids);if(error)throw error;stats=data||[];}
  const byId=new Map(stats.map((row:any)=>[row.request_id,row]));
  const result=(requests||[]).map((row:any)=>{const stat:any=byId.get(row.id);return {...row,games_played:stat?.games_played??null,games_won:stat?.games_won??null,stats_updated_at:stat?.updated_at??null};});
  return json({requests:result});
 }catch(error){console.error("Series 2 registration report failed:",error);return json({error:"Unable to process the registration report."},500);}
});