"use node";

export function envVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name} (set it in .env.local and your Convex deployment)`);
  }
  return value;
}

export function maybeEnv(name: string): string | undefined {
  return process.env[name];
}

export const AGENTMAIL_INBOX = "opeyemi-8915@agentmail.to";
export const AGENTMAIL_INBOX_ID = AGENTMAIL_INBOX;

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function openAIJSON(system: string, user: string): Promise<any> {
  const key = envVar("OPENAI_API_KEY");
  const model = maybeEnv("OPENAI_MODEL") ?? "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ] satisfies ChatMessage[],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI request failed (${res.status}): ${body.slice(0, 500)}`);
  }
  const data: any = await res.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content);
  } catch (err) {
    throw new Error(`OpenAI returned invalid JSON: ${content.slice(0, 300)}`);
  }
}

export function truncate(text: string, max = 12000): string {
  return text.length > max ? text.slice(0, max) : text;
}
