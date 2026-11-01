import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const allowedOrigin="https://platoland.org";
const cors={"Access-Control-Allow-Origin":allowedOrigin,"Vary":"Origin","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json; charset=utf-8"};
const first:Record<string,string>={ramesh:"رامش",saeed:"سعید"};
const second:Record<string,string>={hana:"هانا",lavin:"لاوین"};
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("Origin");
 if(origin&&origin!==allowedOrigin)return new Response(JSON.stringify({error:"Origin not allowed"}),{status:403,headers:cors});
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 const respond=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
 if(req.method!=="POST")return respond({error:"درخواست نامعتبر است."},405);
 try{
  const body=await req.json();
  const voter=String(body.voterPlatoId??"").trim();
  const firstKey=String(body.semifinalOneWinnerKey??"");
  const secondKey=String(body.semifinalTwoWinnerKey??"");
  if(!/^[A-Za-z0-9_]{2,30}$/.test(voter)||!first[firstKey]||!second[secondKey])return respond({error:"Plato ID یا انتخاب برنده مسابقات معتبر نیست."},400);
  const url=Deno.env.get("SUPABASE_URL"),serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!serviceKey)throw new Error("Server configuration unavailable");
  const db=createClient(url,serviceKey,{auth:{persistSession:false}});
  const {error}=await db.from("plato_land_semifinal_prediction_votes").insert({voter_plato_id:voter,semifinal_one_winner_key:firstKey,semifinal_two_winner_key:secondKey});
  if(error?.code==="23505")return respond({error:"با این Plato ID قبلاً پیش‌بینی ثبت شده است."},409);
  if(error)throw error;
  return respond({success:true,message:"پیش‌بینی شما با موفقیت ثبت شد."});
 }catch(error){console.error("semifinal prediction insert failed",error);return respond({error:"ثبت پیش‌بینی انجام نشد. لطفاً دوباره تلاش کنید."},500);}
});
