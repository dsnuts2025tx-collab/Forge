export async function onRequest(context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  if (context.request.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Method not allowed"
      }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }

  try {
    const { provider = "openrouter", prompt } =
      await context.request.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({
          error: "Missing prompt"
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    }

    if (provider !== "openrouter") {
      return new Response(
        JSON.stringify({
          error: "Unsupported provider"
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    }

    const ai = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${context.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://forgeii.pages.dev",
          "X-Title": "Forge AI"
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1:free",
          temperature: 0.7,
          max_tokens: 2000,
          messages: [
            {
              role: "system",
              content:
`You are Forge AI.

Return ONLY valid JSON.

{
  "projectName":"",
  "description":"",
  "files":[
    {
      "path":"",
      "content":""
    }
  ]
}`
            },
            {
              role: "user",
              content: prompt
            }
          ]
        })
      }
    );

    const text = await ai.text();

    return new Response(text, {
      status: ai.status,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });

  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err.message
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
}
