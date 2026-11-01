import { createClient } from "npm:@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"https://platoland.org","Vary":"Origin","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"GET, OPTIONS","Content-Type":"application/json; charset=utf-8"};
const first:Record<string,string>={ramesh:"رامش",saeed:"سعید"};
const second:Record<string,string>={hana:"هانا",lavin:"لاوین"};
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 const respond=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
 if(req.method!=="GET")return respond({error:"Method not allowed"},405);
 try{
  const auth=req.headers.get("Authorization");
  if(!auth?.startsWith("Bearer "))return respond({error:"برای مشاهده گزارش ابتدا وارد حساب مالک شوید."},401);
  const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!key)throw new Error("Server configuration unavailable");
  const db=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
  const {data:{user},error:userError}=await db.auth.getUser(auth.slice(7));
  if(userError||!user)return respond({error:"نشست کاربری معتبر نیست."},401);
  const {data:role,error:roleError}=await db.from("user_roles").select("role").eq("user_id",user.id).maybeSingle();
  if(roleError)throw roleError;
  if(!role||!["owner","مالک کل"].includes(role.role))return respond({error:"فقط Owner سایت اجازه مشاهده فهرست پیش‌بینی‌ها را دارد."},403);
  const {data,error}=await db.from("plato_land_semifinal_prediction_votes").select("id,voter_plato_id,semifinal_one_winner_key,semifinal_two_winner_key,created_at").order("created_at",{ascending:false});
  if(error)throw error;
  const predictions=(data||[]).map(row=>({...row,semifinal_one_winner_name:first[row.semifinal_one_winner_key]||"نامشخص",semifinal_two_winner_name:second[row.semifinal_two_winner_key]||"نامشخص"}));
  return respond({predictions,count:predictions.length});
 }catch(error){console.error("semifinal-prediction-owner-votes",error);return respond({error:"دریافت فهرست پیش‌بینی‌ها ناموفق بود."},500);}
});
