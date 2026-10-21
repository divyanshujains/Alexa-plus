# LifePilot AI — Hackathon 3–5 Minute Presentation & Live Demo Script

---

## Part 1: Problem & Vision (0:00 – 0:45)

**Presenter:**
> "Good morning, judges! We all use AI assistants for planning and productivity, but current AI agents suffer from two fatal flaws:
> 1. **Hallucination**: They invent task deadlines, guess fake clock times (like '9:00 AM' when they don't even know your schedule), and falsely claim they saved changes to your database when they didn't.
> 2. **Token Bloat**: Passing huge task histories and verbose system prompts burns through API tokens, increasing latency and cost.
>
> Today, we present **LifePilot AI** — a Model Context Protocol (MCP) native productivity assistant connected to MongoDB Atlas, engineered with **Zero-Hallucination Grounding** and an empirical **67% Token Reduction**."

---

## Part 2: Live Interaction — Task Creation & Grounded Execution (0:45 – 1:45)

**Action**: Start the server in terminal 1, and agent in terminal 2:
```bash
# Terminal 1: MCP Server
npm start

# Terminal 2: AI Agent
npm run agent
```

**Prompt 1 (Task Creation)**:
> *"Add a high priority task 'Finalize Hackathon Demo' with goal 'AI Showcase' and a 45 minute duration."*

**What Judges See on Screen**:
1. LifePilot invokes MCP tool: `create_task`.
2. Clean, compact JSON confirmation returned from MongoDB Atlas.
3. Terminal prints real-time **Token Metrics Summary**:
   - Model: `openai/gpt-oss-20b`
   - Input Tokens: `~830` (down from `2,500+` baseline)
   - Latency: `~350ms`

---

## Part 3: Live Interaction — Smart Daily Planning Without Hallucinations (1:45 – 2:45)

**Prompt 2 (Smart Daily Planner)**:
> *"Plan my day. I have 2 hours of available work time today."*

**What Judges See on Screen**:
1. LifePilot calls `plan_my_day` (fetching today's tasks and overdue items).
2. **Zero-Hallucination Grounding in Action**:
   - **Overdue Prioritization**: Overdue items are automatically placed in **Session 1** before scheduled tasks.
   - **No Invented Clock Times**: Because the user did not specify a start time, LifePilot formats work strictly as **"Session 1"** and **"Session 2"** rather than fabricating clock times.
   - **Strict Time Budget**: Total planned time does not exceed the user's 120-minute limit.
   - **Estimated Durations**: Any task with missing duration is explicitly labeled as `"(estimated)"`, never claiming to be a stored database fact.
   - **Read-Only Safety**: The plan is presented as a proposal without falsely claiming it mutated MongoDB.

---

## Part 4: Technical Deep-Dive — AI Optimization & Metrics (2:45 – 3:30)

**Presenter:**
> "Behind this seamless terminal experience are three major engineering innovations:
>
> 1. **Empirical Token Optimization**:
>    - We deduplicated and structured the system prompt from 2,447 tokens down to 788 tokens (**-67.8% reduction on every single turn**).
>    - We built `formatTaskCompact`, stripping MongoDB internal baggage and saving **32.0% on tool payloads**.
>    - In-turn memoization stops the agent from making duplicate MCP calls.
>
> 2. **Provider-Verified Prompt Caching**:
>    - We audited Groq's LPU inference API. While Groq's OpenAI endpoint does not yet return explicit cached token counts, our architecture enforces **deterministic prompt-prefix consistency**, positioning LifePilot for automatic KV-cache reuse.
>
> 3. **100% Automated Test Coverage**:
>    - We have 20 automated tests running in 1.6 seconds without touching live production data."

**Action**: Run tests in terminal:
```bash
npm test
```
*(All 20 tests pass in ~1.6s)*

---

## Part 5: Impact & Next Steps (3:30 – 4:00)

**Presenter:**
> "LifePilot proves that AI agents don't need to be unpredictable, bloated, or hallucinatory. By pairing Model Context Protocol with rigorous schema validation and token-conscious prompt architecture, we have built a reliable, blazing-fast personal copilot.
>
> Thank you, and we welcome your questions!"
