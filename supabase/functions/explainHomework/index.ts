import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUBJECT_LABEL: Record<string, string> = {
  math: "คณิตศาสตร์",
  sci: "วิทยาศาสตร์",
  eng: "ภาษาอังกฤษ",
};

const SYSTEM_INSTRUCTION = `คุณคือ "ครูติว AI" ครูสอนพิเศษที่ใจดีและอดทน สำหรับนักเรียนไทยชั้นประถมศึกษาปีที่ 4 ถึงมัธยมศึกษาปีที่ 3

กฎที่ต้องทำตามอย่างเคร่งครัด:
1. ห้ามเฉลยคำตอบสุดท้ายเด็ดขาด ให้คำใบ้และคำถามชวนคิด เพื่อให้เด็กคิดและลงมือทำเองแบบวิธีโสเครติส (Socratic method)
2. อธิบายเป็นภาษาไทย แบ่งเป็น 3 ถึง 5 ขั้นตอนสั้น ๆ แต่ละขั้นไม่เกิน 2 ประโยค ใส่อีโมจิได้บ้างเล็กน้อย
3. จบด้วยประโยคให้กำลังใจ 1 ประโยค
4. ถ้าภาพที่ได้รับไม่ใช่การบ้าน ให้ตอบอย่างสุภาพว่า ช่วยได้เฉพาะการบ้านเท่านั้น

รูปแบบคำตอบ: ตอบเป็น JSON เท่านั้น ห้ามมีข้อความอื่นนอก JSON
{"steps": ["ขั้นที่ 1 ...", "ขั้นที่ 2 ...", "ขั้นที่ 3 ..."], "hint": "ประโยคให้กำลังใจปิดท้าย"}`;

const FRIENDLY_ERRORS: Record<number, string> = {
  400: "key ไม่ถูกต้อง",
  401: "key ไม่ถูกต้อง",
  402: "เครดิตของแอปหมดแล้ว",
  403: "API ยังไม่เปิดใช้งาน",
  429: "ใช้งานถี่เกินไป กรุณารอสักครู่แล้วลองใหม่",
};

const DIRECT_MODEL_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const GATEWAY_URL =
  "https://app-g0jmiqre3jlt-api-VaOwP8E7dJqa.gateway.appmedo.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type Explanation = { steps: string[]; hint: string };

type Payload = {
  action?: string;
  apiKey?: string;
  imageBase64?: string;
  mimeType?: string;
  subject?: string;
  imageUrl?: string;
};

type CallResult = { ok: boolean; status: number; text: string; detail: string };

async function readUpstreamError(res: Response): Promise<string> {
  try {
    const raw = await res.text();
    if (!raw) return "";
    try {
      const body = JSON.parse(raw);
      const message = body?.error?.message ?? body?.message ?? body?.error;
      if (typeof message === "string") return message.slice(0, 300);
    } catch {
      // not JSON — fall through to the raw body
    }
    return raw.slice(0, 300);
  } catch {
    return "";
  }
}

function collectText(data: unknown): string {
  const parts = (data as { candidates?: { content?: { parts?: { text?: string }[] } }[] })
    ?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts.map((part) => part?.text ?? "").join("");
}

async function callDirect(apiKey: string, body: unknown): Promise<CallResult> {
  const res = await fetch(`${DIRECT_MODEL_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(90_000),
  });

  if (!res.ok) {
    return { ok: false, status: res.status, text: "", detail: await readUpstreamError(res) };
  }

  return { ok: true, status: 200, text: collectText(await res.json()), detail: "" };
}

async function callGateway(body: unknown): Promise<CallResult> {
  const gatewayKey = Deno.env.get("INTEGRATIONS_API_KEY") ?? "";
  if (!gatewayKey) {
    return { ok: false, status: 500, text: "", detail: "INTEGRATIONS_API_KEY is not configured" };
  }

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Gateway-Authorization": `Bearer ${gatewayKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    return { ok: false, status: res.status, text: "", detail: await readUpstreamError(res) };
  }
  if (!res.body) {
    return { ok: false, status: 502, text: "", detail: "empty stream" };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const dataStr = line.slice(5).trim();
      if (!dataStr || dataStr === "[DONE]") continue;
      try {
        fullText += collectText(JSON.parse(dataStr));
      } catch {
        // incomplete frame — skip
      }
    }
  }

  return { ok: true, status: 200, text: fullText, detail: "" };
}

function parseExplanation(raw: string): Explanation | null {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return null;

  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as {
      steps?: unknown;
      hint?: unknown;
    };
    const steps = Array.isArray(parsed.steps)
      ? parsed.steps
          .filter((step): step is string => typeof step === "string")
          .map((step) => step.trim())
          .filter(Boolean)
      : [];
    if (steps.length === 0) return null;
    const hint = typeof parsed.hint === "string" ? parsed.hint.trim() : "";
    return { steps: steps.slice(0, 5), hint };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "คำขอไม่ถูกต้อง" }, 400);
  }

  const { action, apiKey: userKey, imageBase64, mimeType, subject, imageUrl } = payload ?? {};

  const authorization = req.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "กรุณาเข้าสู่ระบบก่อนใช้งาน", code: "AUTH_REQUIRED" }, 401);
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const admin = createClient(supabaseUrl, serviceKey);
  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData.user) return json({ error: "เซสชันหมดอายุ กรุณาเปิดแอปใหม่", code: "AUTH_REQUIRED" }, 401);

  const trimmedUserKey = typeof userKey === "string" ? userKey.trim() : "";

  if (action === "verify") {
    if (!trimmedUserKey) {
      return json({ error: "ยังไม่มีคีย์ให้ทดสอบ ใส่คีย์ก่อนนะ" }, 400);
    }
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${trimmedUserKey}`,
        { signal: AbortSignal.timeout(20_000) },
      );
      if (res.ok) return json({ ok: true });
      const detail = await readUpstreamError(res);
      console.error("verify failed", res.status, detail);
      return json({ error: FRIENDLY_ERRORS[res.status] ?? "คีย์ใช้งานไม่ได้", detail }, res.status);
    } catch {
      return json({ error: "เชื่อมต่อ Google ไม่ได้ ลองอีกครั้งนะ" }, 502);
    }
  }

  if (!imageBase64 || typeof imageBase64 !== "string") {
    return json({ error: "ไม่พบรูปการบ้าน กรุณาถ่ายรูปหรืออัปโหลดรูปก่อนนะ" }, 400);
  }
  if (!subject || !SUBJECT_LABEL[subject]) {
    return json({ error: "กรุณาเลือกวิชาก่อนนะ" }, 400);
  }

  const { data: quota, error: quotaError } = await admin.rpc("consume_ai_quota", { p_user_id: authData.user.id });
  if (quotaError) { console.error("quota check failed", quotaError.message); return json({ error: "ตรวจสอบโควตาไม่สำเร็จ ลองใหม่อีกครั้ง", code: "QUOTA_ERROR" }, 503); }
  const quotaResult = quota as { allowed?: boolean; login_required?: boolean; limit?: number } | null;
  if (!quotaResult?.allowed) {
    return json({ error: quotaResult?.login_required ? "ใช้ครบโควตาผู้ใช้ฟรีแล้ว" : "ใช้ครบโควตาวันนี้แล้ว กรุณากลับมาใหม่พรุ่งนี้", code: quotaResult?.login_required ? "LOGIN_REQUIRED" : "QUOTA_EXCEEDED", limit: quotaResult?.limit }, 429);
  }


  const requestBody = {
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents: [
      {
        role: "user",
        parts: [
          { text: `วิชา: ${SUBJECT_LABEL[subject]}\nช่วยดูการบ้านในภาพนี้ แล้วพาเด็กคิดทีละขั้น` },
          { inlineData: { mimeType: mimeType || "image/jpeg", data: imageBase64 } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.6,
      responseMimeType: "application/json",
    },
  };

  let result: CallResult;
  try {
    // A key saved on the device wins; otherwise use the app's platform gateway.
    result = trimmedUserKey
      ? await callDirect(trimmedUserKey, requestBody)
      : await callGateway(requestBody);
  } catch (err) {
    console.error("upstream threw", err instanceof Error ? err.message : "unknown");
    return json({ error: "เชื่อมต่อครู AI ไม่ได้ ลองอีกครั้งนะ" }, 502);
  }

  if (!result.ok) {
    console.error("model call failed", result.status, result.detail);
    const friendly = FRIENDLY_ERRORS[result.status] ?? "ครู AI ขัดข้องชั่วคราว ลองอีกครั้งนะ";
    return json({ error: friendly, detail: result.detail }, result.status);
  }

  const explanation = parseExplanation(result.text);
  if (!explanation) {
    console.error("unparsable model output", result.text.slice(0, 200));
    return json({ error: "ครู AI อ่านภาพนี้ไม่ชัด ลองถ่ายใหม่ให้ชัดขึ้นนะ" }, 502);
  }

  try {
    const { error } = await admin.from("homework_history").insert({
      device_id: authData.user.id,
      owner_id: authData.user.id,
      subject,
      image_url: imageUrl ?? null,
      steps: explanation.steps,
      hint: explanation.hint || null,
    });
    if (error) console.error("history insert failed", error.message);
  } catch (err) {
    console.error("history insert threw", err instanceof Error ? err.message : "unknown");
  }

  return json({ steps: explanation.steps, hint: explanation.hint });
});
