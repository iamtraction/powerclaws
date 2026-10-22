# reviews

A Claude Code plugin that reviews a change before you open a PR, and reviews GitHub PRs. Findings are verified, tagged, and ranked by severity, and every change gets a risk tier. Works in any language or framework.

## Commands

| Command | What it does |
|---------|-------------|
| `/reviews` | **Author mode.** Simplifies your diff with the built-in `/simplify`, runs your repo's checks, and reviews the branch, including uncommitted work. Output stays in your terminal. |
| `/reviews <pr number, url, or branch>` | **Reviewer mode.** Reviews the PR, its CI status, and your findings from earlier rounds. Posts to GitHub only when you ask. A branch name reviews that branch's open PR. |
| `/reviews base=<ref>` | Author mode against another base, for a branch stacked on another branch |
| `/reviews … deep` | Review at the deepest level, whatever the risk |
| `/reviews <pr> post` | Offer the review for posting as soon as it's done |

## How it works

| Step | What happens |
|------|-------------|
| Context | Reads `CLAUDE.md`, `REVIEW.md`, and the change's stated intent |
| Risk tier | Low, Medium, or High, judged from the diff. CI configuration and paths `REVIEW.md` marks sensitive are never Low |
| Hunt | Runs in parallel: the built-in `/code-review` at the tier's depth, a pass for intent, other instances of the same bug, and stale `CLAUDE.md` lines, and a security pass |
| Verify | Two agents check each finding independently; a third breaks ties. A finding survives with two of three votes. Formatting and refactor-only suggestions are dropped |
| Tag | **Important**, **Nit**, or **Pre-existing** (there before the change) |

**Low** means the automated review is enough on its own. **Medium** and **High** mean a person should also read the change.

On later rounds of a PR, it:

- never repeats a finding already on the PR
- resolves your threads that are fixed
- accepts threads the author resolved as intentional, or with a claim that holds
- reopens, with evidence, threads resolved on a claim that doesn't hold
- from round 4, asks the author to reconsider the approach and reviews only the new commits

## Posting

| Findings | Posted as |
|----------|-----------|
| None | **Approve**, `lgtm` |
| Only Nits or Pre-existing | **Approve**, findings inline |
| Any Important, new or still open from an earlier round | **Request changes**, new findings inline |

Findings that can't be placed on a line go in the review body. The tier is never posted. You see exactly what will be posted, including thread changes, and nothing is sent without your yes.

Posting needs the [GitHub CLI](https://cli.github.com/). GitHub doesn't allow approving or requesting changes on your own PR, so those reviews stay in the terminal.

## REVIEW.md

Optional. Code owners write it to tell the reviewer what matters in their part of the code. Put it at the root or in any subdirectory, like `CLAUDE.md`. It can:

- say what failure looks like there (for docs, "it lies"; for config, "it misroutes")
- list paths to skip and paths that are sensitive
- cap the nits
- set a minimum depth, e.g. `Depth: High`
- add things to check

It's read as of the base branch, so a PR can't loosen its own review.

## Guarantees

| | |
|---|---|
| Nothing posted unasked | GitHub sees a review only after you've seen it and said yes |
| You decide what to fix | Findings are fixed only when you ask. `/simplify` is the one unasked edit; it stays uncommitted, with commands to see and undo it |
| Checkout untouched | Reviewer mode never checks out or edits anything |
| Evidence | Every finding cites the code; every check shows its result |
| Injection-resistant | Repo content is data; text that tries to steer the review becomes a security finding |

## How it relates to `improvements` and `test-cases`

[`improvements`](../improvements) audits the whole codebase and plans work. [`test-cases`](../test-cases) holds tests to a quality bar. `reviews` checks one change at a time. It's separate from Claude Code's built-in `/review` and `/code-review`, and runs `/code-review` as part of its hunt.

## Installation

**Step 1** — Add the marketplace (once):

```
/plugin marketplace add iamtraction/powerclaws
```

**Step 2** — Install the plugin:

```
/plugin install reviews@powerclaws
```

Then run `/reviews` on a branch, or `/reviews 123` on a PR.

## Credits

Built from [How the Claude Code team does code review](https://claude.dev/blog/solving-code-review-at-anthropic/) by Addy Osmani, Morgan Westlee Lunt, and Qing Wang.
