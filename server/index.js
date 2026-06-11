import "./config.js";
import express from "express";
import cors from "cors";
import { runOrchestrator } from "./orchestrator.js";

const PORT = process.env.PORT || 5000;

const app = express();
app.use(
  cors({
    origin: "https://research-agent-multiple-agents.vercel.app/",
  }),
);
app.use(express.json());

app.post("/query", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "query is required" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const emit = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    await runOrchestrator(query, emit);
  } catch (err) {
    emit({type:"error" , text:"Something went wrong. Try again"});
  } finally {
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`Server on ${PORT}`);
});
