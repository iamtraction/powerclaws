# Plan template

A plan is a standalone handoff document. The executor may have **zero context** about this session — everything it needs lives in the file. No references to "the pattern above" or "as discussed." Three properties make a plan executable:

1. **Self-contained** — paths, conventions, and commands are all in the file.
2. **Objectively verifiable** — every step ends in a command with an expected result; the executor never *judges* success.
3. **Bounded** — explicit out-of-scope list and STOP conditions prevent improvisation.

Match verbosity to the executor (see the command's plan-tier dial). The skeleton below is the same at both tiers; the *default* tier points to code by `file:line` and says "re-read it," while the *literal* tier inlines excerpts and fully ordered steps.

---

```markdown
# <Title>

- **Slug:** <category>-<slug>   (matches the filename)
- **Category:** <bugs | failures | security | perf | ...>
- **Priority:** <n>   **Effort:** <S/M/L>   **Risk:** <low/med/high>
- **Depends on:** <slugs of other plans, or none>
- **Base commit:** <git short SHA — the repo state this plan was written against>
- **Issue:** <link, if published>

## Why this matters
<1–3 sentences: the concrete impact if this stays unfixed.>

## Current state
<What exists now. Default tier: cite `path:line` and instruct the executor to open and read it.
Literal tier: paste the relevant excerpt. Note the repo conventions this change must follow,
with a pointer to an existing example (`path:line`) to copy the style from.>

## Verification commands
| Command | Expected result |
|---------|-----------------|
| `<exact typecheck cmd>` | no new errors |
| `<exact test cmd>` | all pass |
| `<exact lint cmd>` | clean |

## Scope
- **In scope:** <files/symbols that may change>
- **Out of scope:** <files that must NOT change, and nearby-but-unrelated items to leave alone>

## Steps
1. <Small, independently verifiable step. Reference `path:line`. End with the command that proves it worked and the output to expect.>
2. ...

## Done when
- [ ] <machine-checkable condition — a command + result, not a judgment>
- [ ] <all verification commands pass>

## STOP and report if
- <semantic obstacle: "the function described here doesn't exist", "tests were already failing before you started", "the change would touch an out-of-scope file">
- Do NOT stop for cosmetic mismatches (a moved line, a renamed local) — re-read the file and continue.
```

---

## Index file — `plans/README.md`

Maintain an index across all plans:

| Plan | Category | Priority | Depends on | Status |
|------|----------|----------|------------|--------|
| `security-ssrf-redirects.md` | security | 1 | — | TODO |

Reference each plan by its filename slug. Statuses: `TODO`, `IN PROGRESS`, `DONE`, `BLOCKED`. This index owns the priority order and dependency graph — the filenames don't.

## Quality bar

Before finishing a plan, check: could a fresh agent execute this using only the file and the repo? Is every "done" condition objective? Are the STOP conditions specific to *this* plan, not generic boilerplate?
