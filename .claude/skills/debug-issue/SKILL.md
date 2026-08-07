---
name: debug-issue
description: Systematically debug issues using graph-powered code navigation
---

## Debug Issue

Use the knowledge graph to systematically trace and debug issues.

### Steps

1. Use `semantic_search_nodes_tool` to find code related to the issue.
2. Use `query_graph_tool` with `callers_of` and `callees_of` to trace call chains.
3. Use `get_flow` to see full execution paths through suspected areas.
4. Run `detect_changes_tool` to check if recent changes caused the issue.
5. Use `get_impact_radius_tool` on suspected files to see what else is affected.

### Tips

- Check both callers and callees to understand the full context.
- Look at affected flows to find the entry point that triggers the bug.
- Recent changes are the most common source of new issues.

## Tahaddi Debug Checklist

- For build or lifecycle failures, inspect database env alignment first: `.env`, `.env.example`, `compose.yaml`, and `prisma.config.ts`.
- For realtime issues, trace the flow across `apps/web`, `packages/contracts`, `packages/domain`, and `apps/realtime` instead of debugging one layer in isolation.
- For host/join/play regressions, verify server-owned time, state versioning, and idempotent identifiers before suspecting the UI.
- For visual regressions, confirm RTL, token usage, and alignment with `design.md` before treating them as isolated CSS bugs.
- Use `debug-lifecycle-exit-code.md` and `docs/architecture.md` as project-specific context when the issue touches infra or runtime flow.

## Token Efficiency Rules
- ALWAYS start with `get_minimal_context(task="<your task>")` before any other graph tool.
- Use `detail_level="minimal"` on all calls. Only escalate to "standard" when minimal is insufficient.
- Target: complete any review/debug/refactor task in ≤5 tool calls and ≤800 total output tokens.
