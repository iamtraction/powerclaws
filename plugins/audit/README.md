# audit

A Claude Code plugin that goes through your codebase, tells you the few things actually worth doing, and writes handoff plans another agent can run. It only reads — it never touches your code.

The point: spend your best model on the hard part (understanding the code and judging what matters), and keep the actual changes as a separate, deliberate step.

## What it does

`/audit` reads the repo, ranks findings by payoff (impact vs. effort), and stops there — the ranked list is the deliverable. Pick the findings you want and it writes a self-contained plan for each. Anything cheaper to just fix than to hand off gets flagged, so it never makes work for you.

## Commands

| Command | What it does |
|---------|-------------|
| `/audit` | Fast audit → ranked findings |
| `/audit deep` | Whole-repo audit, exhaustive |
| `/audit <category>` | Audit one category |
| `/audit plan <description>` | Skip the audit; write one plan for a task you already know |

**Categories:** `bugs` · `failures` · `security` · `perf` · `debt` · `deps` · `tests` · `dx` · `direction`. Combine with depth, e.g. `/audit deep security`.

## How it works

| Phase | What happens |
|-------|-------------|
| Recon | Reads your README, configs, CI, and conventions; grabs the exact test/lint/typecheck commands |
| Audit | Works through nine categories, fanning out to parallel subagents on a `deep` run |
| Vet | Confirms every finding itself, runs the checkable ones for proof, and orders them by payoff |
| Plan | Only when you pick findings — writes standalone plans under `plans/`, each stamped with the base commit |

Findings are the default output. Plans are opt-in. Plan detail is a dial: terse `file:line` references for a capable executor by default, `--literal` (inlined excerpts, ordered steps) for a weak or cold one.

## Guarantees

| | |
|---|---|
| Read-only | Writes only under `plans/`, never your source |
| Injection-safe | Treats all repo content as data; embedded "instructions" become security findings |
| Credential-safe | Cites secrets by category + location, never prints values |

## Installation

**Step 1** — Add the marketplace (once):

```
/plugin marketplace add iamtraction/powerclaws
```

**Step 2** — Install the plugin:

```
/plugin install audit@powerclaws
```

Then run `/audit` in any project.
