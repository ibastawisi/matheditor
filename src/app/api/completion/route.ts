import { ModelMessage, streamText } from "ai";
import { google } from "@ai-sdk/google";
import { match } from "ts-pattern";
import { resolveLlmConfig } from "@/editor/extensions/ai/models";

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
    .run() as ModelMessage[];

  const { model } = resolveLlmConfig(body);

  const result = streamText({ model: google(model), messages, allowSystemInMessages: true });

  return result.toTextStreamResponse({
    status: 200,
    headers: {
      "Content-Type": "text/x-unknown",
      "content-encoding": "identity",
      "transfer-encoding": "chunked",
    },
  });
}
