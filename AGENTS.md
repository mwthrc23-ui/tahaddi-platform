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
