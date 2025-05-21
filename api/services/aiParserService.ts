import { Order } from "../types.ts";

interface OpenAIMessage {
  role: string;
  content: string;
}

interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
      refusal: null;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  system_fingerprint: string;
}

const SYSTEM_PROMPT = `You are an expert in parsing and formatting text into a JSON object compatible with the backend system's defined types. The goal is to create a structured object that matches the backend \`Order\` and \`OrderItem\` interfaces.

IMPORTANT: Your response must be ONLY a valid JSON object with no additional text or explanation. The JSON object must include:

1. A 'recipient' field. If the recipient is missing, default it to 'unknown'.
2. An array of \`items\` where each item includes:
   - \`product_name\` (you should make sure the product name is correct, if's it's some kind of abbreviation, you should make it full or modify it to be correctt e.g., '冲' to '葱').
   - \`quantity\` as a number.
   - \`unit\` consistent with the original message (e.g., '箱', 'boxes', 'skids').
3. The \`original_message\` field must include the raw input text for reference.

DO NOT include any explanations, markdown formatting, or additional text. Return ONLY the JSON object.`;

export async function parseTextWithAI(text: string): Promise<Order> {
  const openaiRequest: OpenAIRequest = {
    model: "gpt-4",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Parse this text: "${text}"` }
    ],
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0
  };

  // Debug environment variables
  console.log("\n=== Debug Environment Variables ===");
  console.log("OPENAI_API_KEY:", Deno.env.get("OPENAI_API_KEY"));
  console.log("OPENAI_ORG_ID:", Deno.env.get("OPENAI_ORG_ID"));
  console.log("OPENAI_PROJECT_ID:", Deno.env.get("OPENAI_PROJECT_ID"));
  console.log("===============================\n");

  const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      "OpenAI-Organization": Deno.env.get("OPENAI_ORG_ID") || "",
      "OpenAI-Project": Deno.env.get("OPENAI_PROJECT_ID") || ""
    },
    body: JSON.stringify(openaiRequest)
  });

  if (!openaiResponse.ok) {
    const errorData = await openaiResponse.json();
    throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
  }

  const aiResponse: OpenAIResponse = await openaiResponse.json();
  const content = aiResponse.choices[0].message.content;

  // Extract the JSON object from the response
  // The response might contain markdown code blocks, so we need to clean it
  const jsonStr = content.replace(/```json\n|```/g, "").trim();

  try {
    const parsedData = JSON.parse(jsonStr);
    return parsedData;
  } catch (parseError) {
    console.error("JSON Parse error:", parseError);
    throw new Error(`Failed to parse OpenAI response into JSON. Raw content: ${content}`);
  }
} 