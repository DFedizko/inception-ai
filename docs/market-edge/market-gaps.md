# Market Edge — Gaps We Can Own

> Where the conversational-analytics / AI-platform market is weak today (early 2026), and how **Chat** can turn each weakness into a differentiator. This is a strategy note, not a spec — it feeds domain modeling, not the other way around.

## Context: the category is already crowded at the entrance

Conversational analytics is a hot, growing category (~US$14.3B in 2025 → ~US$41.39B projected by 2030). The table-stakes capability — *natural language → SQL → chart/dashboard, with follow-ups and summaries* — is **commoditized**. Players already doing it well: Hex, Databricks AI/BI, Google Looker (Conversational Analytics), BlazeSQL, and Livedocs (launched Jan 2026: connect CSV/DB, a copilot generates charts and plain-English insights).

The money is flowing to **Vertical AI** (Harvey in legal, Glean in enterprise search): depth in a domain beats the generalist. Lesson for us: don't be "yet another conversational BI" — win on depth where everyone else is shallow.

## The gaps (our whitespace)

### 1. Trust / hallucination in text-to-SQL
The #1 reported problem. Without a **semantic layer** (governed definitions like "revenue = X"), the model writes SQL from scratch and the same question yields different numbers across queries. Users lose confidence fast. Even with a semantic layer, sophisticated questions exceed what it can express natively ("semantic leakage") and the system falls back to hallucination-prone SQL.

### 2. No real memory / no personalization
Platforms treat each question as isolated. They don't learn *your* way of seeing data, your nicknames for metrics, what you check every Monday. **This is the biggest open lane** — and it aligns directly with our "100% data-driven + deep personalization" thesis.

### 3. Dashboards are disposable, not living
A chart is generated in the chat and dies there. Few bridge "conversation → a persistent, versioned artifact that keeps evolving."

### 4. The conversation is not a first-class citizen
In these BI tools the conversation is an ephemeral means to reach a chart. **In our product the Conversation is already the aggregate root** — an architectural advantage. We can treat data exploration as a *versionable, branchable, auditable conversation*, which classic BI has no DNA for.

## Our differentiator (synthesis)

Be the platform where **the conversation with data is a rich domain object**:
- **User memory** — a *personal*, learned semantic layer.
- **Versioning / branching** — "git for conversations" and "git for AI agents": see branches, diff versions, compare.
- **Living artifacts** — dashboards/views are born from a conversation and stay alive.

This also justifies real data-intensive engineering (memory + semantic layer + branching = genuine event volume), applying *Designing Data-Intensive Applications* (Martin Kleppmann, O'Reilly) to real pains rather than for its own sake.

## Sources

- [AI-Driven Conversational Analytics Platforms 2026 — OvalEdge](https://www.ovaledge.com/blog/ai-driven-conversational-analytics-platforms/)
- [Hex — AI Analytics Platform](https://hex.tech/)
- [Databricks AI/BI](https://www.databricks.com/product/business-intelligence)
- [85 Hottest AI Startups 2026 — Wellows](https://wellows.com/blog/ai-startups/) (Livedocs, Vertical AI)
- [Building Trust in Conversational BI: Semantic Layers — AtScale](https://www.atscale.com/blog/build-trust-conversational-bi-semantic-layer/)
- [Reducing Hallucinations in Text-to-SQL — WrenAI](https://www.getwren.ai/post/reducing-hallucinations-in-text-to-sql-building-trust-and-accuracy-in-data-access)
- [Best BI Tools with Semantic Layers — Holistics](https://www.holistics.io/bi-tools/semantic-layer/)
- [Text to SQL Tools Comparison 2026 — Promethium](https://promethium.ai/guides/text-to-sql-comparison-2026-enterprise-solutions/)
