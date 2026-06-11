import Groq from "groq-sdk";
import { webSearch } from "../tools/search.js";
import { scrapeUrl } from "../tools/scraper.js";
import { RESEARCHER_PROMPT } from "../prompts/prompt.researcher.js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const tools = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for information on sub-topics",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search sub-topic" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "scrape_url",
      description: "Retrieve information from Websites",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL to scrape" },
        },
        required: ["url"],
      },
    },
  },
];

const executeTool = async (name, args) => {
  if (name === "web_search") return await webSearch(args.query);
  if (name === "scrape_url") return await scrapeUrl(args.url);
};

const callResearcher = async (messages, tools, toolChoice = "auto" , retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log("Calling Groq with key:", process.env.GROQ_API_KEY?.slice(0, 7));
      return await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
        tools,
        tool_choice: toolChoice,
      });
    } catch (err) {
      console.error("Groq error:", err.status, err.message);
      if (i === retries - 1) throw err;
      const wait = err.status === 429 ? 10000 * (i + 1) : 3000 * (i + 1);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
};

export const runResearcher = async (subTopic) => {
  const messages = [
    { role: "system", content: RESEARCHER_PROMPT },
    { role: "user", content: subTopic },
  ];
  let isFirstCall = true;
  while (true) {
    const response = await callResearcher(messages, tools , isFirstCall ? "required" : "auto");
    isFirstCall = false;
    const message = response.choices[0].message;
    const hasTools = message.tool_calls && message.tool_calls.length > 0;

    if (!hasTools) {
      return message.content;
    }

    messages.push(message);
    for (const toolCall of message.tool_calls) {
      const name = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);
      const result = await executeTool(name, args);
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }
  }
};
