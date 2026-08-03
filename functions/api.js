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

    let response;

    switch (provider) {

      case "openrouter":

        response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://forgeii.pages.dev",
              "X-Title": "Forge AI"
            },
            body: JSON.stringify({
              model: "openai/gpt-4.1-mini",
              messages: [
                {
                  role: "system",
                  content: `You are Forge AI.

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

        break;

      default:

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

    const text = await response.text();

if (!response.ok) {
  throw new Error(text);
}

let data;
try {
  data = JSON.parse(text);
} catch {
  data = { response: text };
}

return new Response(
  JSON.stringify(data),
  {
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders
    }
  }
);
      JSON.stringify(data),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );

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
