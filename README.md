# Multi-Agent Research Assistant

A multi-agent AI research system that decomposes a user query into
focused sub-topics, researches those topics in parallel using web search
and web scraping, and synthesizes the findings into a final report.

The project is built around a simple agent architecture rather than a
heavyweight orchestration framework, making the individual LLM,
tool-calling, parallel execution, and streaming steps explicit.

## Architecture

``` text
                         User Query
                              |
                              v
                    +-------------------+
                    |      Planner      |
                    |   Llama 3.3 70B   |
                    +---------+---------+
                              |
                         Sub-topics
                              |
               +--------------+--------------+
               |                             |
               v                             v
      +----------------+            +----------------+
      |   Researcher   |            |   Researcher   |
      |    Qwen 3 32B  |            |    Qwen 3 32B  |
      +-------+--------+            +-------+--------+
              |                             |
        +-----+------+                +-----+------+
        |            |                |            |
        v            v                v            v
   Web Search     Scraper        Web Search     Scraper
        |            |                |            |
        +-----+------+                +-----+------+
              |                             |
              +--------------+--------------+
                             |
                             v
                    +-------------------+
                    |      Writer       |
                    |    Qwen 3 32B     |
                    +---------+---------+
                              |
                              v
                       Final Research
                           Report
                              |
                              v
                       SSE -> React UI
```

## How It Works

### 1. Query Planning

The planner receives the user's research question and breaks it into
multiple focused sub-topics.

``` text
User:
"How does RAG work in production AI systems?"

Planner:
- Retrieval architecture
- Embedding and vector databases
- Retrieval quality and ranking
- Production evaluation and monitoring
```

The planner uses **Llama 3.3 70B** through the Groq API and returns the
sub-topics as structured JSON.

### 2. Parallel Research

Each sub-topic is assigned to a researcher agent.

Researchers use **Qwen 3 32B** with function/tool calling.

Available tools:

-   `web_search` --- searches the web using SerpApi
-   `scrape_url` --- retrieves and extracts readable text from web pages

Researchers can decide when to use the tools and then use their results
to formulate findings.

The orchestrator processes researchers in batches of two and runs each
batch concurrently using `Promise.all()`.

``` text
Topic 1 ─┐
         ├── Promise.all()
Topic 2 ─┘

Topic 3 ─┐
         ├── Promise.all()
Topic 4 ─┘
```

This provides parallelism while avoiding an unlimited number of
concurrent model/tool requests.

### 3. Report Generation

Once all researchers finish, their findings are passed to the writer
agent.

The writer uses **Qwen 3 32B** to synthesize the individual research
outputs into a coherent final report.

The final response is streamed back to the React frontend using
**Server-Sent Events (SSE)**.

------------------------------------------------------------------------

## Tech Stack

### Frontend

-   React
-   Vite
-   JavaScript
-   Server-Sent Events (SSE)

### Backend

-   Node.js
-   Express
-   JavaScript
-   Axios
-   Cheerio

### AI

-   Groq API
-   Llama 3.3 70B --- planning
-   Qwen 3 32B --- research and writing
-   LLM tool/function calling

### Search & Web Research

-   SerpApi --- web search
-   Axios --- HTTP requests
-   Cheerio --- HTML parsing and text extraction

------------------------------------------------------------------------

## Project Structure

``` text
.
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── AgentStream.jsx
│   └── ...
│
├── backend/
│   ├── agents/
│   │   ├── agent.planner.js
│   │   ├── agent.researcher.js
│   │   └── agent.writer.js
│   │
│   ├── prompts/
│   │   ├── prompt.planner.js
│   │   ├── prompt.researcher.js
│   │   └── prompt.writer.js
│   │
│   ├── tools/
│   │   ├── search.js
│   │   └── scrapper.js
│   │
│   ├── orchestrator.js
│   └── index.js
│
└── README.md
```

------------------------------------------------------------------------

## Agent Responsibilities

  -----------------------------------------------------------------------
  Component               Responsibility          Model
  ----------------------- ----------------------- -----------------------
  Planner                 Decomposes the query    Llama 3.3 70B
                          into research topics    

  Researcher              Investigates individual Qwen 3 32B
                          topics and uses tools   

  Web Search              Finds relevant web      SerpApi
                          sources                 

  Scraper                 Extracts readable page  Axios + Cheerio
                          content                 

  Writer                  Synthesizes research    Qwen 3 32B
                          into a final report     

  Orchestrator            Coordinates the         Node.js
                          complete workflow       
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## Tool Calling Loop

Researchers follow a tool-calling loop:

``` text
Research Topic
      |
      v
   LLM Call
      |
      v
Tool requested?
   /       \
 yes       no
  |         |
  v         v
Execute    Return
Tool       Answer
  |
  v
Add Tool Result
to conversation
  |
  v
LLM Call Again
```

This allows the researcher to use multiple tools before producing its
final findings.

The first researcher call requires a tool call, while subsequent calls
allow the model to decide whether another tool is necessary.

------------------------------------------------------------------------

## Server-Sent Events

The backend exposes:

``` http
POST /query
```

Request:

``` json
{
  "query": "How does RAG work in production AI systems?"
}
```

The endpoint returns an SSE stream.

Current event types include:

``` json
{
  "type": "topics",
  "topics": [
    "Retrieval architecture",
    "Vector databases",
    "Ranking",
    "Production evaluation"
  ]
}
```

and:

``` json
{
  "type": "final",
  "text": "..."
}
```

Errors are emitted as:

``` json
{
  "type": "error",
  "text": "..."
}
```

SSE allows the frontend to receive research results as the backend
workflow progresses rather than waiting for a single traditional HTTP
response.

------------------------------------------------------------------------

## Getting Started

### Prerequisites

Install:

-   Node.js 18+
-   npm
-   A Groq API key
-   A SerpApi API key

### Clone

``` bash
git clone <your-repository-url>
cd <project-directory>
```

### Backend Setup

``` bash
cd backend
npm install
```

Create a `.env` file:

``` env
GROQ_API_KEY=your_groq_api_key
SERP_API_KEY=your_serpapi_key
PORT=5000
```

Start the backend:

``` bash
npm start
```

or, depending on the configured scripts:

``` bash
node index.js
```

### Frontend Setup

``` bash
cd frontend
npm install
```

Create a `.env` file:

``` env
VITE_API_URL=http://localhost:5000
```

Start Vite:

``` bash
npm run dev
```

Open the local URL shown by Vite.

------------------------------------------------------------------------

## Environment Variables

### Backend

  Variable         Description
  ---------------- ------------------------------
  `GROQ_API_KEY`   API key for Groq-hosted LLMs
  `SERP_API_KEY`   API key for SerpApi
  `PORT`           Backend server port

### Frontend

  Variable         Description
  ---------------- ------------------------
  `VITE_API_URL`   URL of the backend API

Never commit API keys or `.env` files to Git.

------------------------------------------------------------------------

## Error Handling

The LLM calls include retry logic to handle transient failures.

For Groq rate-limit responses (`429`), the researcher increases the
retry delay before attempting another request.

The scraper also handles failed requests and returns a message
indicating that the URL could not be processed instead of terminating
the complete research workflow.

------------------------------------------------------------------------

## Current Limitations

This is an evolving project. The current implementation intentionally
keeps the architecture relatively simple.

Current limitations include:

-   Researcher results are primarily returned as text rather than fully
    structured evidence objects.
-   Source metadata is not yet persisted independently from researcher
    output.
-   The frontend exposes only a limited view of the internal agent
    execution.
-   SSE parsing on the frontend should be made robust against events
    split across network chunks.
-   There is no persistent research history or user authentication.
-   There is no automated evaluation/regression framework yet.
-   Web pages with heavy JavaScript rendering may not be fully
    extractable by the current Cheerio-based scraper.
-   Search and scraping are subject to third-party API limits and
    website availability.

------------------------------------------------------------------------

## Planned Improvements

### Agent Observability

Expose detailed execution events such as:

``` text
planner_started
planner_completed
researcher_started
tool_started
tool_completed
researcher_completed
writer_started
writer_completed
```

This will allow the UI to visualize the actual agent workflow in real
time.

### Structured Research Results

Move from raw strings toward structured researcher outputs:

``` json
{
  "topic": "RAG evaluation",
  "answer": "...",
  "sources": [
    {
      "title": "...",
      "url": "..."
    }
  ],
  "toolsUsed": [
    "web_search",
    "scrape_url"
  ]
}
```

### Source-Grounded Reports

Preserve source metadata through the entire pipeline and generate
reports with explicit citations.

### Evaluation Framework

Build a golden dataset and evaluate:

-   Answer relevance
-   Faithfulness
-   Citation correctness
-   Citation completeness
-   Source relevance
-   Research completeness
-   Latency
-   Failure rate

### Authentication & Persistence

Add OAuth and persistent user research sessions:

``` text
User
 |
 v
OAuth
 |
 v
Research Session
 |
 +-- Query
 +-- Agent Execution
 +-- Sources
 +-- Final Report
 +-- Evaluation
```

### Automation

Use n8n to trigger research workflows automatically, for example:

``` text
Scheduled Trigger
      |
      v
     n8n
      |
      v
Research API
      |
      v
Multi-Agent Research
      |
      v
Evaluation
      |
      v
Save / Notify
```

------------------------------------------------------------------------

## Design Goals

The project focuses on making the underlying agent mechanics explicit
rather than hiding everything behind an orchestration framework.

Key goals:

-   **Modular agents** --- each agent has a focused responsibility.
-   **Tool use** --- researchers can search and inspect external
    sources.
-   **Parallel execution** --- independent research tasks run
    concurrently.
-   **Streaming** --- users can observe progress without waiting for the
    entire run.
-   **Fault tolerance** --- transient API failures are retried.
-   **Extensibility** --- evaluation, authentication, persistence,
    citations, and automation can be added without replacing the core
    architecture.

------------------------------------------------------------------------

## Example Workflow

For a query such as:

``` text
"Compare modern RAG architectures for production AI applications."
```

the system can execute:

``` text
1. Planner
   |
   +-- Retrieval architecture
   +-- Vector databases
   +-- Hybrid search
   +-- Reranking
   +-- Evaluation
        |
        v
2. Researchers
   |
   +-- Search the web
   +-- Select relevant pages
   +-- Scrape page content
   +-- Analyze findings
        |
        v
3. Writer
   |
   +-- Combine research
   +-- Identify common findings
   +-- Resolve conflicting information
   +-- Produce final report
        |
        v
4. React UI
   |
   +-- Display research progress
   +-- Display final report
```

------------------------------------------------------------------------

## Why Multi-Agent?

A single LLM call can answer many research questions, but complex
research benefits from separating responsibilities.

The architecture assigns different cognitive tasks to different stages:

``` text
Planning
   ↓
Focused research
   ↓
Evidence gathering
   ↓
Synthesis
```

This makes the workflow easier to inspect, debug, evaluate, and extend.

------------------------------------------------------------------------

## Future Architecture

The intended direction is:

``` text
                         User
                           |
                       OAuth Login
                           |
                           v
                    Research Dashboard
                           |
                           v
                    Query Orchestrator
                           |
          +----------------+----------------+
          |                                 |
          v                                 v
       Planner                        Research Queue
          |                                 |
          |                    +------------+------------+
          |                    |            |            |
          |                    v            v            v
          |               Researcher   Researcher   Researcher
          |                    |            |            |
          |                 Search       Search       Search
          |                 Scrape       Scrape       Scrape
          |                    |            |            |
          +--------------------+------------+------------+
                               |
                               v
                            Writer
                               |
                               v
                     Citation Validation
                               |
                               v
                          Evaluation
                               |
                    +----------+----------+
                    |                     |
                    v                     v
                 Report               Metrics
                    |                     |
                    +----------+----------+
                               |
                               v
                       Persistent Storage
```

The goal is to evolve the current MVP into a reliable, observable,
source-grounded research system with measurable quality rather than
simply adding more agents.

------------------------------------------------------------------------

## License

Add your preferred license here.
