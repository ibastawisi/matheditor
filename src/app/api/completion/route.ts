import { StreamingTextResponse, OpenAIStream } from 'ai';
import OpenAI from 'openai';
import { match } from "ts-pattern";
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions.mjs';

export const runtime = "edge";

const LLM_WORKER_URL = process.env.LLM_WORKER_URL;

const llama = new OpenAI({
  apiKey: 'llama',
  baseURL: process.env.OPENAI_BASE_URL,
});

export async function POST(req: Request) {

  const { prompt, option, command } = await req.json();

  const messages = match(option)
    .with("continue", () => [
      {
        role: "system",
        content: "You are an AI writing assistant.",
      },
      {
        role: "user",
        content: `Continue writing\n${prompt}`,
      },
    ])
    .with("improve", () => [
      {
        role: "system",
        content: "You are an AI writing assistant.",
      },
      {
        role: "user",
        content: `Rewrite in another way\n${prompt}`,
      },
    ])
    .with("shorter", () => [
      {
        role: "system",
        content: "You are an AI writing assistant.",
      },
      {
        role: "user",
        content: `Rewrite this shorter\n${prompt}`,
      },
    ])
    .with("longer", () => [
      {
        role: "system",
        content: "You are an AI writing assistant.",
      },
      {
        role: "user",
        content: `Rewrite this longer\n${prompt}`,
      },
    ])
    .with("fix", () => [
      {
        role: "system",
        content: "You are an AI writing assistant.",
      },
      {
        role: "user",
        content: `Fix spelling and grammar\n${prompt}`,
      },
    ])
    .with("zap", () => [
      {
        role: "system",
        content: "You area an AI writing assistant."
      },
      {
        role: "user",
        content: `${command}${prompt ? `\n${prompt}` : ""}`,
      },
    ])
    .run() as ChatCompletionMessageParam[];

  if (LLM_WORKER_URL) {
    return fetch(LLM_WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
  }

  const response = await llama.chat.completions.create({
    model: "gpt-3.5-turbo",
    stream: true,
    messages,
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    n: 1,
  });

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);

  // Respond with the stream
  return new StreamingTextResponse(stream);
}