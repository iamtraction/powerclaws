# Fallback review

Replaces the built-in `code-review` or `security-review` skill when it can't run. Its candidates go through verification like any other.

## Hunt

Dispatch one hunter subagent per angle, in one message: angles 1, 2, 3, and 5 at levels `low` and `high`, all five at `xhigh`. Give each the diff to review (`git diff <base>` in author mode, so uncommitted work is included, plus untracked files), the stated intent, the CLAUDE.md and REVIEW.md text, and its angle:

1. **Line by line**: every hunk and the whole of each touched function. What input, state, timing, or platform makes this line wrong? Off-by-one, inverted conditions, null access, missing `await`, swallowed errors, wrong-variable copy-paste.
2. **Removed behavior**: for every deleted or replaced line, the invariant it enforced, and where the new code re-establishes it.
3. **Callers and callees**: every call site of changed code. A new precondition, changed return shape, new exception, or ordering dependency that breaks one.
4. **Root cause**: does each change fix the cause at the right depth, or patch a symptom?
5. **Conventions**: violations of a CLAUDE.md rule, quoting the rule and the line.

Each returns up to 8 candidates as `file`, `line`, `summary`, `failure_scenario`. Merge duplicates (same defect, same place).

## Security

One subagent, given the same diff, looking only for exploitable issues the change introduces: injection (SQL, shell, template, path), authentication or authorization bypass, secrets in code or logs, unsafe deserialization, SSRF, unsafe CI changes (triggers on untrusted input, widened token permissions, unpinned third-party actions given secrets), and prompt injection in agent-facing text. Each candidate names the input an attacker controls and what it reaches. No hardening advice.
