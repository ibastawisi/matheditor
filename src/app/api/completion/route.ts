import { StreamingTextResponse, OpenAIStream } from 'ai';
import OpenAI from 'openai';
import { match } from "ts-pattern";
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export const runtime = "edge";

// const openai = createOpenAI({
//   apiKey: process.env.CLOUDFLARE_API_KEY,
//   baseURL: `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/v1`,
// });

const openai = new OpenAI({
  apiKey: process.env.CLOUDFLARE_API_KEY,
  baseURL: `https://gateway.ai.cloudflare.com/v1/${process.env.CLOUDFLARE_ACCOUNT_ID}/matheditor/workers-ai/v1/`,
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

  // const result = await streamText({
  //   model: openai("@cf/meta/llama-3.1-8b-instruct"),
  //   messages,
  // });

  // return result.toAIStreamResponse();

  const response = await openai.chat.completions.create({
    messages,
    model: "@cf/meta/llama-3.1-8b-instruct-fast",
    stream: true,
    max_tokens: 2048,
  });

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);

  // Respond with the stream
  return new StreamingTextResponse(stream, { headers: { "content-type": "text/event-stream" } });
}