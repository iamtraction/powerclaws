---
name: test-cases
description: Quality bar for automated tests in any language or framework. Use whenever writing, changing, or reviewing tests — including regression tests for bug fixes and PR reviews that touch tests — and whenever asked to audit, prune, dedupe, or clean up an existing test suite or remove test-only hooks from production code.
---

# Test Cases

Every test costs maintenance. A test earns its place only by protecting observable behavior, catching a credible regression, or enforcing a contract nothing else enforces. Optimize for confidence in the suite, not test count in either direction.

Two modes share the rules below:

- **Authoring** — the default whenever you write or change tests. Apply the authoring gate silently; don't write out the questions and answers.
- **Auditing** — when asked to review, clean up, or prune existing tests, at any scope from one file to a whole subsystem. Follow the audit workflow at the end of this file. A request to clean up or prune starts the audit; it isn't approval to delete. Show the candidates and their evidence first, and edit only once the user agrees, because removing a test that guards something is the costly mistake here.

## Terms

- **Boundary**: the entry point where behavior becomes observable to its real users — a public function, API route, CLI command, UI interaction, or message handler.
- **Owner**: the boundary closest to where a behavior is implemented that can still observe it. Each contract should have one primary test there.
- **Seam**: anything that exists only so tests can reach in — an extra export, flag, global, wrapper, or injection hook that no production code needs.

## Learn the project first

The project's conventions override this skill. Before writing or judging tests, read any agent or contributor guidance (`AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, including scoped copies in subdirectories). Find out how to run one test file, how CI selects tests, where shared fixtures live, and how to lint and format changed files. If something is ambiguous, ask.

## Authoring gate

Before adding or changing a test, you should be able to answer all four. If one has no answer, don't add the test yet.

1. **What does it protect?** A specific behavior, invariant, or external contract.
2. **What breaks it?** A realistic regression that makes it fail.
3. **Why isn't it already covered?** If the owner already has a test, a second test at another layer needs a distinct risk the first can't reach, such as a transport, concurrency, or lifecycle failure. Prefer adding a case to an existing table-driven test or reusing a fixture over a near-duplicate.
4. **Does it need a seam?** If so, test through the real boundary instead.

Then check it against the junk patterns. A match fails the gate unless the keep-list explains what it independently guards.

Litmus test: if a behavior-preserving refactor (rename, extract function, reorder internals) would break it, it tests implementation, not behavior. Rewrite it at the owner.

**Bug regressions** must be seen failing on the pre-fix code, for the reason the bug describes, before passing with the fix: stash the fix, run the test, restore. A regression test never seen failing may only prove the mock works. Write one, at the owner; don't replay the same scenario at every layer it crosses.

**When reporting**, give one line per new test: what it protects and the regression it catches, plus confirmation that any bug regression was seen failing.

## Junk patterns

Grouped by why they're worthless. Each example is one instance of the category, not the whole of it.

**Proves nothing.** No meaningful assertion, or one that can't fail.
e.g. a test that calls a function and only checks it didn't throw; `expect(x).toEqual(x)`; a snapshot accepted without review.

**Mirrors the source.** The expected value is just a copy of the code.
e.g. a hand-maintained list of exported names; grepping a file for an exact import or string; computing the expected output with the same function under test.

**Duplicates coverage.** A contract already proven elsewhere.
e.g. five tests that differ only in an input from the same class; re-testing a shared helper inside every module that uses it; testing a private helper whose behavior the public boundary already covers.

**Wrong boundary.** Tied to internals or kept alive by a seam.
e.g. asserting a private method was called with certain arguments; a test whose only purpose is keeping a test-only export alive; production code whose only callers are tests.

**Tests its own setup.** The mocks or fixtures do the work being checked.
e.g. a mock that returns the sorted list when the test checks sorting; a fixture that pre-orders events the code was supposed to order; asserting a value was saved to a store the code never writes; mocking every collaborator so the test only checks wiring.

**Misleading or fragile.**
e.g. a negative test that passes because a different guard rejected the input; a name promising more than it asserts; correctness depending on `sleep`/wall-clock timing instead of controlled time or explicit synchronization.

## Keep-list

Keep a test, even one that looks implementation-shaped, when it's the independent guard for:

- public API, SDK, CLI, or protocol behavior; wire formats and serialized output;
- config and defaults, data migrations, storage formats;
- security, permissions, input validation;
- platform-specific behavior, packaging, release artifacts;
- architectural rules the team deliberately enforces (e.g. "module A must not import B");
- call ordering, when the order is observable;
- a regression with a credible failure mode;
- source inspection, when it's the cheapest guard that fails on a user-facing change (a key, path, or byte) and survives a pure rename.

Slow or static is not by itself a reason to remove a test.

## Audit workflow

The process for reviewing, cleaning up, or pruning existing tests. The rules above still apply.

### Scope

Agree on a scope with the user: a file, a directory, a pattern (e.g. "tests that grep source"), or a whole module or subsystem. If the scope is bigger than one reviewable change, you'll work through it in batches (see Landing).

### Discovery (read-only)

Make no edits during discovery. For a large codebase, split it into lanes and run them in parallel if you can: core library, plugins/extensions, apps/UI/scripts, and one cross-cutting pattern sweep. Prefer a few high-confidence candidates over a long speculative list.

### Judging a candidate

Before judging, read: the whole test; the production code it targets, with its callers and callees; sibling implementations; overlapping tests; how CI runs it; and the git history of both (`git log -p`, `git blame`). If the test claims to verify a dependency's behavior, check the dependency's source or types directly.

If a test you'd keep fails on the current baseline, treat it as a possible product bug: reproduce it and fix the code rather than deleting the test.

### Evidence

Record evidence before editing.

**Clear-cut cases** (no assertion, exact duplicate, tautology): one line — test path and name, junk category, and the test or reason that makes it safe to remove.

**Everything else** needs the full record. A blank field means it isn't ready to remove.

| Field | Answer |
|---|---|
| Test (name + path) | |
| What failure it can actually detect | |
| Non-test callers of the code or seam it covers | |
| Stronger remaining coverage (or why none is needed) | |
| History: why the test or seam exists | |
| Code its removal unlocks (seams, helpers, dead paths) | |
| Risk + focused validation command | |

Show the evidence to the user and get agreement before editing, unless they've told you to proceed.

### Editing

- One coherent batch per change, grouped by the owner of the behavior.
- When a removed test was keeping a seam alive, remove the seam too; don't leave a compatibility alias.
- Move valuable regression tests to their owner instead of deleting them.
- Collapse repeated per-package assertions into one shared contract test.
- Prefer changes that shrink production code. Never add a replacement test that restates the same implementation, and never turn an uncertain candidate into "cleanup" to raise the count.

### Validation

Don't edit files while a watch-mode test runner is running against the checkout.

1. Run the owner's tests and its siblings.
2. If you removed a test that grepped config, scripts, or plans, run the real script or a dry run that owns that contract.
3. For each removed export, seam, or helper, search the codebase (including non-test code, configs, and docs) to confirm nothing still references it.
4. Run the formatter, linter, and type checker on changed files, and `git diff --check`.
5. Run whatever broader gate the project requires for changed paths.
6. Check `git diff --numstat` and separate production/tooling lines from test lines.

### Landing

Commit, push, or open a PR only when the user authorizes it, following the project's conventions. One coherent change at a time. For a larger scope, loop: after each change lands, update from the main branch and re-run discovery for the next batch until the scope is done or the user stops.

### Handoff report

- **Removed:** categories of low-value tests and the root cause, not just a list.
- **Production simplifications:** seams, exports, or dead paths removed.
- **Kept on purpose:** candidates that looked like junk but stay, and what each guards.
- **Proof:** exact commands run and their results.
- **Size:** production vs. test lines added/removed.
- **State:** branch / PR / merge status.
- **Follow-ups:** next batches or open questions.
