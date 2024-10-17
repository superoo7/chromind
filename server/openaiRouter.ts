import OpenAI from "https://deno.land/x/openai@v4.67.3/mod.ts";
import { Router } from "npm:express";
import { addLog } from "./chromia.ts";

const router = Router();

router.post("/chat/completions", async (req, res) => {
  const authorization = req.headers["authorization"];
  if (!authorization) {
    res.status(401).send("Unauthorized");
    return;
  }
  const baseURL =
    req.headers["x-openai-base-url"] || "https://api.openai.com/v1";
console.log("baseURL", baseURL);

  const openai = new OpenAI({
    apiKey: authorization.replace("Bearer ", ""),
    baseURL,
  });

  try {
    const requestBody = req.body;
    const response = await openai.chat.completions.create(requestBody);

    await addLog({
      chat_id: response.id,
      base_url: baseURL,
      request_model: requestBody.model,
      request_messages: JSON.stringify(requestBody.messages),
      user_question: requestBody.messages[0].content,
      request_raw: JSON.stringify(requestBody),
      response_object: response.object,
      response_created: response.created || Date.now(),
      response_model: response.model,
      response_system_fingerprint: response.system_fingerprint || "",
      response_provider: (response as any).provider || "",
      response_usage_prompt_tokens: response.usage?.prompt_tokens || 0,
      response_usage_completion_tokens: response.usage?.completion_tokens || 0,
      response_usage_total_tokens: response.usage?.total_tokens || 0,
      assistant_reply: response.choices[0].message.content || "",
      finish_reason: response.choices[0].finish_reason,
      response_raw: JSON.stringify(response),
    })

    res.json(response);
  } catch (error) {
    console.error("Error forwarding request to OpenAI API:", error);
    res.status(500).send("Internal Server Error");
  }
});

export const openaiRouter = router;