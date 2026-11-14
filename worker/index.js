const ALLOWED_ORIGIN = "https://nova-ai-platform-d0z.pages.dev";
const MODEL = "llama-3.3-70b-versatile";

function json(data, status = 200, origin = ALLOWED_ORIGIN) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const responseOrigin = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": responseOrigin,
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
          "Vary": "Origin",
        },
      });
    }

    const url = new URL(request.url);

    if (url.pathname === "/api/health" && request.method === "GET") {
      return json({ ok: true, service: "nova.ai-api", status: "ready" }, 200, responseOrigin);
    }

    if (url.pathname !== "/api/chat" || request.method !== "POST") {
      return json({ error: "Not found" }, 404, responseOrigin);
    }

    if (origin && origin !== ALLOWED_ORIGIN) {
      return json({ error: "Origin not allowed" }, 403);
    }

    if (!env.GROQ_API_KEY) {
      return json({ error: "Server is missing the GROQ_API_KEY secret." }, 500, responseOrigin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Please send a valid JSON request." }, 400, responseOrigin);
    }

    if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 20) {
      return json({ error: "Send between 1 and 20 chat messages." }, 400, responseOrigin);
    }

    const messages = [];
    for (const item of body.messages) {
      if (!item || !["user", "assistant"].includes(item.role) || typeof item.content !== "string") {
        return json({ error: "Each message must have a user or assistant role and text content." }, 400, responseOrigin);
      }
      const content = item.content.trim();
      if (!content || content.length > 8000) {
        return json({ error: "Messages must contain 1 to 8000 characters." }, 400, responseOrigin);
      }
      messages.push({ role: item.role, content });
    }

    try {
      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: "system",
              content: "You are nova.ai, a helpful, clear, thoughtful AI assistant. Answer accurately and naturally. Use readable Markdown for explanations, lists, and code. If uncertain, say so."
            },
            ...messages,
          ],
          temperature: 0.7,
          max_completion_tokens: 2048,
        }),
      });

      const data = await groqResponse.json();
      if (!groqResponse.ok) {
        const message = data?.error?.message || "The AI provider could not complete the request.";
        return json({ error: message }, groqResponse.status === 429 ? 429 : 502, responseOrigin);
      }

      const answer = data?.choices?.[0]?.message?.content;
      if (typeof answer !== "string" || !answer.trim()) {
        return json({ error: "The AI returned an empty response. Please try again." }, 502, responseOrigin);
      }

      return json({ answer, model: data.model || MODEL }, 200, responseOrigin);
    } catch {
      return json({ error: "Could not reach the AI provider. Please try again shortly." }, 502, responseOrigin);
    }
  },
};
