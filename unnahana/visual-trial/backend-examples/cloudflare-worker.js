// Unnahana Visual Trial backend example for Cloudflare Workers
// Purpose:
// - Receive the static intake form submission from /unnahana/visual-trial
// - Store the submission in Google Sheets through a Google Apps Script Web App
// - Generate a server-side AI creative direction without exposing API keys to the browser
// - Send an admin email through the Apps Script or an email provider API
//
// Required Worker environment variables / secrets:
// OPENAI_API_KEY
// GOOGLE_SCRIPT_WEB_APP_URL
// ALLOWED_ORIGIN=https://geyvak.com
//
// In production, keep all keys as Cloudflare Worker secrets.
// Never place API keys inside frontend JavaScript.

const DEFAULT_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = env.ALLOWED_ORIGIN || "https://geyvak.com";
    const corsHeaders = {
      ...DEFAULT_HEADERS,
      "Access-Control-Allow-Origin": origin === allowedOrigin ? allowedOrigin : allowedOrigin
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, corsHeaders);
    }

    try {
      const payload = await request.json();
      validatePayload(payload);

      const brief = await generateStyleBrief(payload, env.OPENAI_API_KEY);

      if (env.GOOGLE_SCRIPT_WEB_APP_URL) {
        await fetch(env.GOOGLE_SCRIPT_WEB_APP_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, brief })
        });
      }

      return json({ ok: true, brief }, 200, corsHeaders);
    } catch (error) {
      return json({ ok: false, error: safeError(error) }, 400, corsHeaders);
    }
  }
};

function validatePayload(payload) {
  const required = ["name", "email", "occasion", "budget", "projectType", "bodyComfort", "respectNotes"];
  for (const field of required) {
    if (!payload[field] || String(payload[field]).trim().length < 2) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  if (!payload.photoConsent || !payload.aiConsent) {
    throw new Error("Consent is required before processing references or AI-assisted direction.");
  }
}

async function generateStyleBrief(payload, apiKey) {
  if (!apiKey) {
    return fallbackBrief(payload);
  }

  const system = [
    "You are Unnahana Visual Trial, a careful custom styling intake assistant for Geyvak.com.",
    "Return creative direction only, not a final design or purchase instruction.",
    "Respect body comfort, cultural notes, budget, low-waste repair/restyle-first thinking, and human review.",
    "Do not diagnose bodies, make medical claims, or claim cultural authority.",
    "Output valid JSON with keys: title, intro, items. items must be an array of [label, text] pairs."
  ].join(" ");

  const user = {
    task: "Create a concise first style brief for Unnahana human review.",
    payload
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature: 0.5,
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(user) }
      ],
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    return fallbackBrief(payload);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return fallbackBrief(payload);

  try {
    const parsed = JSON.parse(content);
    if (!parsed.title || !parsed.intro || !Array.isArray(parsed.items)) return fallbackBrief(payload);
    return parsed;
  } catch {
    return fallbackBrief(payload);
  }
}

function fallbackBrief(payload) {
  return {
    title: `${payload.projectType} for ${payload.occasion}`,
    intro: `This is a first creative direction for ${payload.name}. It is for Unnahana human review only.`,
    items: [
      ["Pathway", `${payload.projectType}. Check repair, reuse, and restyle possibilities before buying new materials.`],
      ["Budget", `${payload.budget}. Keep sourcing and making decisions inside this range until the client approves a quote.`],
      ["Colours", `Loved: ${payload.coloursLoved || "to confirm"}. Avoid: ${payload.coloursAvoided || "to confirm"}.`],
      ["Comfort", payload.bodyComfort],
      ["Respect", payload.respectNotes],
      ["Next human step", "Review references, confirm measurements, prepare a small moodboard, and then decide whether to restyle, repair, source, or make."],
      ["Disclaimer", "Creative direction only. Final design requires human review."]
    ]
  };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers });
}

function safeError(error) {
  return error instanceof Error ? error.message : "Request could not be processed";
}
