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