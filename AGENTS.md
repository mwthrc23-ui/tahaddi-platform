# Codex project instructions

## Context discipline

- Keep context focused and minimize token usage.
- Read only files relevant to the current task.
- Never modify unrelated files.
- Run targeted tests before the full suite.
- Keep reports concise.

## Git permissions

- Git staging, commit, and push are allowed for completed tasks.
- Stage only files directly related to the current task.
- Before committing, verify:
  - `git diff --check`
  - `git diff --cached --name-status`
  - `git diff --cached --stat`
  - `git status --short`
- Run the relevant tests, lint, and build before committing when applicable.
- Use a clear Conventional Commit message.
- A normal push to the current tracked branch is allowed after verification.
- Never use `git add -A`, `git add .`, or `git commit -a`.
- Never use `--force` or `--force-with-lease`.
- Never push tags, backup branches, or unrelated branches.
- Never commit secrets, `.env` files, databases, generated local tools, or unrelated untracked files.
- Abort if the remote branch changed or if the push is not a normal fast-forward update.
- Report the commit hash, included files, test results, and push result.

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes_tool` or `query_graph_tool` instead of Grep
- **Understanding impact**: `get_impact_radius_tool` instead of manually tracing imports
- **Code review**: `detect_changes_tool` + `get_review_context_tool` instead of reading entire files
- **Finding relationships**: `query_graph_tool` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview_tool` + `list_communities_tool`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
| ------ | ---------- |
| `detect_changes_tool` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context_tool` | Need source snippets for review — token-efficient |
| `get_impact_radius_tool` | Understanding blast radius of a change |
| `get_affected_flows_tool` | Finding which execution paths are impacted |
| `query_graph_tool` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes_tool` | Finding functions/classes by name or keyword |
| `get_architecture_overview_tool` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes_tool` for code review.
3. Use `get_affected_flows_tool` to understand impact.
4. Use `query_graph_tool` pattern="tests_for" to check coverage.
