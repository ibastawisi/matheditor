import { CoreMessage, streamText } from 'ai';
import { createOllama } from 'ollama-ai-provider';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { google } from '@ai-sdk/google';
import { match } from "ts-pattern";

export const runtime = "edge";

const cloudflare = createOpenAICompatible({
  name: "cloudflare-workers-ai",
  baseURL: `https://gateway.ai.cloudflare.com/v1/${process.env.CLOUDFLARE_ACCOUNT_ID}/matheditor/workers-ai/v1/`,
  headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_KEY}` },
});

const ollama = createOllama({ baseURL: process.env.OLLAMA_API_URL });

export async function POST(req: Request) {

  const { prompt, option, command, ...body } = await req.json();

  const messages = match(option)
    .with("continue", () => [
      {
        role: "system",
        content:
          "You are an AI writing assistant for the text editor application 'Math Editor'. " +
          "You are asked to continue writing more text following user's " +
          "Use Markdown for text formatting when appropriate. " +
          "Write any math formulas in Latex surrounded by $ delimiters. " +
          "Limit your response to no more than 200 characters, but make sure to construct complete sentences." +
          "Respond directly without any conversation starters.",
      },
      {
        role: "user",
        content: prompt,
      },
    ])
    .with("improve", () => [
      {
        role: "system",
        content:
          "You are an AI writing assistant for the text editor application 'Math Editor'. " +
          "You are asked to rewrite what user writes in another way. " +
          "Use Markdown for text formatting when appropriate. " +
          "Write any math formulas in Latex surrounded by $ delimiters. " +
          "Limit your response to no more than 200 characters, but make sure to construct complete sentences." +
          "Respond directly without any conversation starters.",
      },
      {
        role: "user",
        content: prompt,
      },
    ])
    .with("shorter", () => [
      {
        role: "system",
        content:
          "You are an AI writing assistant for the text editor application 'Math Editor'. " +
          "You are asked to rewrite what user writes in a shorter form. " +
          "Use Markdown for text formatting when appropriate. " +
          "Write any math formulas in Latex surrounded by $ delimiters. " +
          "Respond directly without any conversation starters.",
      },
      {
        role: "user",
        content: prompt,
      },
    ])
    .with("longer", () => [
      {
        role: "system",
        content:
          "You are an AI writing assistant for the text editor application 'Math Editor'. " +
          "You are asked to rewrite what user writes in a longer form. " +
          "Use Markdown for text formatting when appropriate. " +
          "Write any math formulas in Latex surrounded by $ delimiters. " +
          "Respond directly without any conversation starters.",
      },
      {
        role: "user",
        content: prompt,
      },
    ])
    .with("zap", () => [
      {
        role: "system",
        content:
          "You are an AI writing assistant for the text editor application 'Math Editor'. " +
          "You are asked to help the user with his document. " +
          "Use Markdown for text formatting when appropriate. " +
          "Write any math formulas in Latex surrounded by $ delimiters. " +
          "Respond directly without any conversation starters.",
      },
      {
        role: "user",
        content: `${command}${prompt ? `\n${prompt}` : ""}`,
      },
    ])
    .run() as CoreMessage[];

  const model = match(body.provider)
    .with("ollama", () => ollama(body.model || "llama3.2"))
    .with("cloudflare", () => cloudflare(body.model || "@cf/meta/llama-3.1-8b-instruct-fast"))
    .with("google", () => google(body.model || "gemini-2.0-flash-exp"))
    .run();


  const result = streamText({ model, messages, maxTokens: 2048, });

  return result.toDataStreamResponse({
    status: 200,
    headers: {
      "Content-Type": "text/x-unknown",
      "content-encoding": "identity",
      "transfer-encoding": "chunked",
    },
  });
}