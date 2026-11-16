import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigin = "https://platoland.org";
const cors = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Vary": "Origin",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: cors });

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (origin && origin !== allowedOrigin) return reply({ error: "Origin not allowed." }, 403);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "Method not allowed." }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return reply({ error: "Service configuration unavailable." }, 500);
    const body = await req.json().catch(() => null);
    const campaignId = typeof body?.campaign_id === "string" ? body.campaign_id : "";
    const voter = typeof body?.plato_id === "string" ? body.plato_id.trim() : "";
    const response = body?.response;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(campaignId)) {
      return reply({ error: "شناسه پیش‌بینی معتبر نیست." }, 400);
    }
    if (!/^[A-Za-z0-9_-]{2,80}$/.test(voter)) return reply({ error: "Plato ID معتبر نیست." }, 400);
    if (!response || typeof response !== "object" || Array.isArray(response) || JSON.stringify(response).length > 12000) {
      return reply({ error: "پاسخ پیش‌بینی معتبر نیست." }, 400);
    }

    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: campaign, error: campaignError } = await admin
      .from("plato_land_prediction_campaigns")
      .select("id,status,is_open,opens_at,closes_at,questions")
      .eq("id", campaignId).maybeSingle();
    if (campaignError) throw campaignError;
    if (!campaign || campaign.status !== "published") return reply({ error: "این پیش‌بینی در دسترس نیست." }, 404);

    const now = Date.now();
    if (!campaign.is_open || (campaign.opens_at && now < Date.parse(campaign.opens_at)) ||
        (campaign.closes_at && now >= Date.parse(campaign.closes_at))) {
      return reply({ error: "مهلت ثبت پیش‌بینی باز نیست یا به پایان رسیده است." }, 409);
    }

    const questions = Array.isArray(campaign.questions) ? campaign.questions : [];
    const questionIds = questions.map((q: any) => typeof q?.id === "string" ? q.id : "").filter(Boolean);
    if (questionIds.length !== questions.length || new Set(questionIds).size !== questionIds.length) {
      return reply({ error: "تعریف سؤال‌های این پیش‌بینی معتبر نیست؛ لطفاً با مدیریت تماس بگیرید." }, 503);
    }
    const submittedKeys = Object.keys(response);
    if (submittedKeys.length !== questionIds.length || questionIds.some((id: string) => !(id in response)) ||
        submittedKeys.some((key: string) => !questionIds.includes(key))) {
      return reply({ error: "لطفاً به همه سؤال‌های پیش‌بینی پاسخ بدهید." }, 400);
    }
    for (const q of questions) {
      const value = response[q.id];
      if (typeof value !== "string" && typeof value !== "number") return reply({ error: "یکی از پاسخ‌ها قالب نامعتبر دارد." }, 400);
      const normalized = String(value).trim();
      if (!normalized || normalized.length > 500) return reply({ error: "همه پاسخ‌ها باید کامل و حداکثر ۵۰۰ نویسه باشند." }, 400);
      if (q.type === "select" && (!Array.isArray(q.options) || !q.options.includes(normalized))) {
        return reply({ error: "یکی از گزینه‌های انتخابی معتبر نیست." }, 400);
      }
    }

    const { error: insertError } = await admin.from("plato_land_prediction_entries").insert({
      campaign_id: campaignId,
      voter_plato_id: voter,
      voter_plato_id_normalized: voter.toLowerCase(),
      response,
    });
    if (insertError?.code === "23505") return reply({ error: "این Plato ID قبلاً در این پیش‌بینی شرکت کرده است." }, 409);
    if (insertError) throw insertError;
    return reply({ saved: true, message: "پیش‌بینی شما با موفقیت ثبت شد." }, 201);
  } catch (error) {
    console.error("plato-land-predictions-submit", error);
    return reply({ error: "ثبت پیش‌بینی انجام نشد. لطفاً کمی بعد دوباره تلاش کنید." }, 500);
  }
});