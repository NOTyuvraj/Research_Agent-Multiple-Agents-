import { runWriter } from "./agents/agent.writer.js";
import { runPlanner } from "./agents/agent.planner.js";
import { runResearcher } from "./agents/agent.researcher.js";

export const runOrchestrator = async (userQuery , emit) => {
  const subTopics = await runPlanner(userQuery);
  emit({type:"topics" , topics:subTopics});
  const results = await Promise.all(subTopics.map((e) => runResearcher(e)));
  const report = await runWriter(results);
  emit({type:"final" , text:report});
};
