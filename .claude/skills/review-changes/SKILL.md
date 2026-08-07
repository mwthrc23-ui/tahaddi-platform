---
name: review-changes
description: Perform a structured code review using change detection and impact
---

## Review Changes

Perform a thorough, risk-aware code review using the knowledge graph.

### Steps

1. Run `detect_changes_tool` to get risk-scored change analysis.
2. Run `get_affected_flows_tool` to find impacted execution paths.
3. For each high-risk function, run `query_graph_tool` with pattern="tests_for" to check test coverage.
4. Run `get_impact_radius_tool` to understand the blast radius.
5. For any untested changes, suggest specific test cases.

### Output Format

Provide findings grouped by risk level (high/medium/low) with:
- What changed and why it matters
- Test coverage status
- Suggested improvements
- Overall merge recommendation

## Tahaddi Review Priorities

- Treat shared contract drift as high risk: changes spanning `apps/web`, `apps/realtime`, `packages/contracts`, and `packages/domain` need extra scrutiny.
- Treat server-authority logic as high risk: timers, scoring, accepted answers, session transitions, and reconnect behavior must remain server-owned.
- For UI work, check Arabic RTL correctness, token usage, accessibility states, and consistency with `design.md` and `docs/design-system.md`.
- For data changes, verify Prisma constraints, migration safety, and env alignment with PostgreSQL/Supabase expectations.
- Prefer targeted tests around live flows, auth boundaries, and scoring instead of generic coverage suggestions.

## Token Efficiency Rules
- ALWAYS start with `get_minimal_context(task="<your task>")` before any other graph tool.
- Use `detail_level="minimal"` on all calls. Only escalate to "standard" when minimal is insufficient.
- Target: complete any review/debug/refactor task in ≤5 tool calls and ≤800 total output tokens.
