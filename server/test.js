import "./config.js"
import { runPlanner } from "./agents/agent.planner.js"
import { runResearcher } from "./agents/agent.researcher.js"
import { orchestrator } from "./orchestrator.js"

// const subtopics = await runPlanner("explain quantum computing and it's real world examples");
// console.log(subtopics);

// const result = await runResearcher("What is quantum computing");
// console.log(result);

const report = await orchestrator("what is area of square ?");
console.log(report);