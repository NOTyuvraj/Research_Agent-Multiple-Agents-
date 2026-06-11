import Groq from "groq-sdk";
import { PLANNER_PROMPT } from "../prompts/prompt.planner.js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const callPlanner = async (messages, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
      });
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
};

export const runPlanner = async (userQuery) => {
  const messages = [
    { role: "system", content: PLANNER_PROMPT },
    { role: "user", content: userQuery },
  ];
  const response = await callPlanner(messages);
  const message = response.choices[0].message; 
  
  return JSON.parse(message.content);
};
