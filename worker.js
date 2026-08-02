export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (request.method === "GET") {
      return new Response(
        JSON.stringify({
          status: "ok",
          message: "Forge AI backend is running",
        }),
        {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "POST required" }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    try {
      const body = await request.text();

      if (!body) {
        return new Response(
          JSON.stringify({ error: "Empty request body" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }

      const { prompt } = JSON.parse(body);

      const openai = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          input: prompt,
        }),
      });

      const result = await openai.json();

      return new Response(JSON.stringify(result), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });

    } catch (err) {
      return new Response(
        JSON.stringify({
          error: err.message,
          stack: err.stack,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
  },
};
