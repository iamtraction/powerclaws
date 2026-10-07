# test-cases

A Claude Code plugin that holds your tests to one bar: a test earns its place only if it protects real behavior, catches a realistic regression, or guards a contract nothing else does. Works in any language, framework, or repo.

The point: agents write a lot of tests, and many of them only prove that a mock returns what it was told to. This keeps that out at write time and clears out what's already there.

## What it does

It's a skill, so there's nothing to run. Claude picks it up on its own whenever you write, change, review, or clean up tests.

| Mode | When | What happens |
|------|------|--------------|
| Authoring | Writing or changing tests, including regression tests for bug fixes | Every new test passes a silent four-question gate. Bug regressions must be seen failing before the fix. |
| Auditing | "Clean up the tests in X", "are these tests any good?", PR reviews | Read-only discovery, evidence for every candidate, your sign-off, then small owner-grouped changes. |

## What it rejects

| Category | Example |
|----------|---------|
| Proves nothing | Only checks the function didn't throw; snapshots nobody reviewed |
| Mirrors the source | Hand-maintained export lists; grepping a file for a string |
| Duplicates coverage | Five tests with inputs from the same class |
| Wrong boundary | Asserting a private method was called; test-only exports |
| Tests its own setup | A mock that returns the answer the test checks for |
| Misleading or fragile | Negative tests rejected by the wrong guard; `sleep`-based timing |

Contract tests for public APIs, wire formats, config, migrations, security, and architecture rules are kept even when they look implementation-shaped.

## Guarantees

| | |
|---|---|
| Your conventions first | Reads `AGENTS.md` / `CLAUDE.md` / `CONTRIBUTING.md` and uses your repo's own test, lint, and CI commands |
| Evidence before deletion | Nothing is removed without a record of what it guards and what still covers it |
| You decide | Shows candidates before editing, and only commits or opens PRs when you say so |

## How it relates to `improvements`

[`improvements`](../improvements) is read-only and spans the whole codebase; `/improvements tests` tells you *where* your test suite is weak and writes plans. `test-cases` is the hands-on rulebook for writing and pruning tests themselves. Use them together or separately.

## Installation

**Step 1** — Add the marketplace (once):

```
/plugin marketplace add iamtraction/powerclaws
```

**Step 2** — Install the plugin:

```
/plugin install test-cases@powerclaws
```

That's it. It kicks in the next time you work on tests.

## Credits

Adapted from the [`test-audit` skill](https://github.com/openclaw/openclaw/tree/main/.agents/skills/test-audit) in OpenClaw.
