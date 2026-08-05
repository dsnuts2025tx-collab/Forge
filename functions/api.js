export async function onRequestPost(context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  try {
    const { request, env } = context;
    const { provider = "openrouter", prompt } = await request.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Missing prompt" }),
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
        JSON.stringify({ error: "Unsupported provider" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://forgeii.pages.dev",
          "X-Title": "Forge AI"
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1:free",
          max_tokens: 4000,
          temperature: 0.7,
          messages: [
            {
              role: "system",
              content: `You are Forge AI.

Return ONLY valid JSON in this format:

{
  "projectName": "",
  "description": "",
  "files": [
    {
      "path": "",
      "content": ""
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

    const text = await response.text();
        if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: "OpenRouter Error",
          details: text
        }),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    }

    return new Response(text, {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });

  } catch (err) {

    return new Response(
      JSON.stringify({
        error: err.message,
        stack: err.stack
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

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
