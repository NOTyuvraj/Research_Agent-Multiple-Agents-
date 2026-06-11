import Groq from "groq-sdk";
import { WRITER_PROMPT } from "../prompts/prompt.writer.js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const callWriter = async (messages, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await groq.chat.completions.create({
        model: "qwen/qwen3-32b",
        messages,
      });
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
};

export const runWriter = async (results) => {
  const combinedResults = results.join("\n\n---\n\n");
  const messages = [
    { role: "system", content: WRITER_PROMPT },
    { role: "user", content: combinedResults },
  ];
  const response = await callWriter(messages);
  const message = response.choices[0].message;
  console.log("writer raw response:", message.content);
  const content = message.content;
  return content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
};
