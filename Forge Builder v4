<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Forge AI Builder</title>
<style>
body{margin:0;background:#0b1020;color:#fff;font-family:Arial,sans-serif}
.container{max-width:1000px;margin:auto;padding:40px}
input,textarea,select{width:100%;padding:14px;margin:12px 0;border:none;border-radius:10px;box-sizing:border-box;font-size:16px}
button{padding:14px 22px;border:none;border-radius:10px;background:#2563eb;color:#fff;font-size:18px;cursor:pointer}
button:hover{background:#1d4ed8}
#status,#result{display:none;margin-top:20px;background:#111827;padding:20px;border-radius:10px}
pre{white-space:pre-wrap;word-break:break-word}
</style>
</head>
<body>
<div class="container">
<h1>🔥 Forge AI Builder</h1>
<p>Describe the application you want Forge to build.</p>

<label>AI Provider</label>
<select id="provider">
<option value="openai">OpenAI</option>
<option value="claude">Claude</option>
<option value="gemini">Gemini</option>
<option value="grok">Grok</option>
<option value="openrouter">OpenRouter</option>
</select>

<input id="project" placeholder="Project Name">
<textarea id="description" rows="10" placeholder="Describe your application..."></textarea>

<button onclick="createProject()">🚀 Build with AI</button>

<div id="status">Forge AI is thinking...</div>
<div id="result">
<h2>Result</h2>
<pre id="output"></pre>
</div>
</div>

<script>
window.onload=function(){
 const p=localStorage.getItem("forge_provider")||"openai";
 document.getElementById("provider").value=p;
}

async function createProject(){
 const provider=document.getElementById("provider").value;
 localStorage.setItem("forge_provider",provider);

 const project=document.getElementById("project").value.trim();
 const description=document.getElementById("description").value.trim();

 if(!project||!description){
   alert("Please complete both fields.");
   return;
 }

 const status=document.getElementById("status");
 const result=document.getElementById("result");
 const output=document.getElementById("output");

 status.style.display="block";
 result.style.display="none";
 status.textContent="Forge AI is thinking...";

 try{
   const response=await fetch("/api",{
     method:"POST",
     headers:{"Content-Type":"application/json"},
     body:JSON.stringify({
       provider:provider,
       prompt:`Project: ${project}\n\n${description}`
     })
   });

   const text=await response.text();
   let data;
   try{ data=JSON.parse(text);}catch{ data=text; }

   status.style.display="none";
   result.style.display="block";
   output.textContent=typeof data==="string" ? data : JSON.stringify(data,null,2);

 }catch(err){
   status.style.display="none";
   result.style.display="block";
   output.textContent="Error: "+err.message;
 }
}
</script>
</body>
</html>
