# LifePilot AI — Prompt Caching & Provider Capabilities Analysis

## 1. What Prompt Caching Means

In modern LLM systems, **Prompt Caching** refers to the server-side persistence of Key-Value (KV) cache states for common, immutable prompt prefixes (such as system instructions and tool definitions). When subsequent requests share an identical token prefix:
1. The model provider bypasses transformer attention re-computation for the cached tokens.
2. Time-to-first-token (TTFT) latency drops dramatically.
3. Cost is reduced (typically 50% to 90% discount on cached input tokens with supporting providers).

---

## 2. Provider & Model Verification for LifePilot AI

### Environment Configuration:
- **Provider**: Groq Cloud API (`https://api.groq.com/openai/v1`)
- **Model**: `openai/gpt-oss-20b` (open-source reasoning model running on Groq LPU inference engines)
- **SDK**: `openai` JavaScript SDK (`^7.33.0`)

### Verification Methodology & Empirical Findings:
To verify whether Groq's API and the configured model support explicit or reported prompt caching, we ran automated diagnostics sending sequential identical prompts (687 tokens) through the official endpoint:

```json
{
  "queue_time": 0.34642961,
  "prompt_tokens": 687,
  "prompt_time": 0.035444797,
  "completion_tokens": 5,
  "completion_time": 0.007118561,
  "total_tokens": 692,
  "total_time": 0.042563358,
  "completion_tokens_details": {
    "reasoning_tokens": 3
  }
}
```

### Key Technical Findings:
1. **No Explicit Cache Control Parameters**: Groq's OpenAI-compatible endpoint does not accept explicit cache control headers or cache TTL parameters (unlike Anthropic's `cache_control: { type: "ephemeral" }`).
2. **Usage Reporting**: Groq returns `prompt_tokens`, `prompt_time`, `completion_tokens`, `completion_time`, `total_tokens`, and `completion_tokens_details.reasoning_tokens`. It does **not** expose `prompt_tokens_details.cached_tokens`.
3. **Implicit LPU Prefill Speed**: Because Groq runs inference on specialized LPUs (Language Processing Units), prefill latency is already sub-35ms for 700 tokens without user-managed cache identifiers.

---

## 3. Implemented Architecture for Cache Optimization

To ensure our application is strictly optimized for providers that support automatic prefix caching (or if Groq activates cached token reporting):

### A. Deterministic Prompt-Prefix Consistency
In [agent.js](file:///c:/Users/leno/OneDrive/Desktop/Alexplus/agent.js):
- The system prompt (`systemInstruction`) is completely deterministic and static.
- It is placed **at index 0 of the messages array on every request**.
- Dynamic conversation history and user queries are strictly appended *after* the stable prefix.
- This ensures maximum prefix overlap across requests, enabling automatic prefix caching whenever available on the inference backend.

### B. Adaptive Metrics Telemetry
In [utils/logging.js](file:///c:/Users/leno/OneDrive/Desktop/Alexplus/utils/logging.js):
- `TokenMetricsTracker` inspects both `usage.prompt_tokens_details?.cached_tokens` and `usage.cached_prompt_tokens`.
- If the provider reports cached tokens, they are tracked and displayed.
- If not reported, it explicitly notes: `0 (Provider does not report cache/unsupported)`.
- **Zero Fabrication**: LifePilot never fabricates cached token counts.

---

## 4. Provider-Side Caching vs Application-Level Memoization

It is critical for engineering integrity to distinguish between these two layers:

| Layer | Implementation | Purpose | Where Implemented |
| :--- | :--- | :--- | :--- |
| **Provider-Side Prompt Caching** | KV-cache reuse on GPU/LPU hardware | Reduces LLM computation on identical prompt prefixes | Handled automatically by provider when prefixes align |
| **Application-Level Memoization** | In-memory key-value cache of read-only tool responses | Prevents redundant MCP tool calls and duplicate DB queries within an agent turn | Implemented in `askLifePilot()` in `agent.js` |

LifePilot implements application-level memoization for read-only tools (`list_tasks`, `get_today_tasks`, `get_overdue_tasks`), preventing redundant MCP network calls and token waste when the LLM repeats identical queries.
