const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === "/api/health" && request.method === "GET") {
      return Response.json(
        { ok: true, service: "nova.ai-api", status: "starter" },
        { headers: corsHeaders }
      );
    }

    return Response.json(
      { error: "Route not configured yet. AI integration will be added in a later phase." },
      { status: 404, headers: corsHeaders }
    );
  },
};