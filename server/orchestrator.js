import { runWriter } from "./agents/agent.writer.js";
import { runPlanner } from "./agents/agent.planner.js";
import { runResearcher } from "./agents/agent.researcher.js";

export const runOrchestrator = async (userQuery , emit) => {
  const subTopics = await runPlanner(userQuery);
  emit({type:"topics" , topics:subTopics});

  const results = []
  for (let i = 0; i < subTopics.length; i += 2) {
    const batch = subTopics.slice(i, i + 2);
    const batchResults = await Promise.all(batch.map((e) => runResearcher(e)));
    results.push(...batchResults);
  }
  const report = await runWriter(results);
  emit({type:"final" , text:report});
};
