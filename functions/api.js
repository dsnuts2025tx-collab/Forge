export async function onRequestPost(context) {

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {

    const { request, env } = context;

    const body = await request.json();

    const provider = body.provider || "openai";
    const prompt = body.prompt;

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

    let response;

    switch(provider){

      case "openai":

        response = await fetch(
          "https://api.openai.com/v1/responses",
          {

            method:"POST",

            headers:{

              Authorization:`Bearer ${env.OPENAI_API_KEY}`,

              "Content-Type":"application/json"

            },

            body:JSON.stringify({

              model:"gpt-4.1-mini",

              input:`

You are Forge AI.

You are an expert software engineer.

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
}

Generate every required file.

User Request:

${prompt}

`

            })

          }

        );

        break;
            case "gemini":

        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: prompt
                    }
                  ]
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

    const data = await response.json();

    return new Response(
      JSON.stringify(data),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );

  } catch(err) {

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

  return new Response(null,{
    status:204,
    headers:{
      "Access-Control-Allow-Origin":"*",
      "Access-Control-Allow-Methods":"POST, OPTIONS",
      "Access-Control-Allow-Headers":"Content-Type"
    }
  });

}
