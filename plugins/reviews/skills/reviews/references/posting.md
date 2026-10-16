# Posting a review

`{owner}/{repo}` is always the PR's repo, written out.

## History

```
gh api user -q .login
gh api repos/{owner}/{repo}/pulls/{n}/reviews --paginate     # body, state, user.login, commit_id
gh api repos/{owner}/{repo}/issues/{n}/comments --paginate   # PR comments
gh api graphql --paginate ...                                 # review threads, below
```

```
gh api graphql --paginate -F owner={owner} -F repo={repo} -F n={n} -f query='
  query($owner: String!, $repo: String!, $n: Int!, $endCursor: String) {
    repository(owner: $owner, name: $repo) { pullRequest(number: $n) {
      reviewThreads(first: 100, after: $endCursor) {
        pageInfo { hasNextPage endCursor }
        nodes { id isResolved isOutdated path line originalLine
          comments(first: 50) { nodes { databaseId author { login } body } } } } } } }'
```

- **Round**: one more than this user's reviews with `state` `APPROVED`, `CHANGES_REQUESTED`, or `DISMISSED`. `COMMENTED` reviews and drafts (`PENDING`) don't count. The latest counted review's `commit_id` is the last reviewed commit.
- **Repeats**: a finding repeats when a thread, review body, or PR comment from anyone already names the same defect at the same place, in any wording. Don't post it again.

## Earlier findings

This user's earlier findings are their threads (first comment by this user) and the findings in their earlier review bodies. Only these affect the verdict; other people's threads only suppress repeats.

Check each against the head. A thread on an outdated line (`isOutdated`, `line` null) is located by `path` and `originalLine` and judged on whether the defect still exists. The author's reason is the PR author's last comment in the thread.

| Earlier finding | Plan |
|-----------------|------|
| Open thread, fixed at the head | Resolve it. |
| Open thread, still applies | Leave it; still open. |
| Resolved, reason is a judgement (intentional, accepted risk, won't fix, out of scope) | Accept it. |
| Resolved, reason is a factual claim ("fixed in abc123", "can't be null because …") that holds at the head | Accept it. |
| Resolved, the claim is false, or there's no reason and it still applies | Reopen it and reply with the evidence, or ask for a fix or a reason. Still open. |
| In an earlier review body, still applies | Still open. |

## The review

A finding blocks when it's tagged Important, new or earlier and still open.

| Findings | `event` | Inline comments | `body` |
|----------|---------|-----------------|--------|
| none, and no earlier finding still open | `APPROVE` | none | `lgtm` |
| only Nit or Pre-existing | `APPROVE` | one per anchorable finding | the findings that can't be anchored, else `lgtm` |
| any blocking, but none new | `REQUEST_CHANGES` | none | `N earlier findings still apply.` |
| any blocking, some new | `REQUEST_CHANGES` | one per anchorable finding | the findings that can't be anchored, else omitted |

From round 4, the body starts with the request to reconsider the approach. Never use `COMMENT` as the verdict. If the PR author is the current user, don't post: GitHub rejects both events on your own PR. If this user already has a `PENDING` review on the PR, say so and stop; GitHub allows only one.

Each comment is the tag in bold, then the change needed, with the failure in a clause if the change doesn't make it obvious. No greeting, summary, praise, or emoji.

```
**Important** Clamp `page_size` to `MAX_PAGE_SIZE`; unbounded, `?page_size=10000000` loads the whole table into memory.
```

In the body, one finding per line, each prefixed with its tag and `file:line`.

## Anchoring

A finding anchors inline only when its line is on the head side of a diff hunk (an added or context line) in `gh api repos/{owner}/{repo}/pulls/{n}/files --paginate`, under the file's `filename` (its new path when renamed). A range's `start_line` and `line` must be in the same hunk. Files without a `patch` (binary or too large) can't be anchored. Everything else goes in the body.

## Sending

1. Re-read `headRefOid`. If it moved since the review ran, say so and ask whether to re-review the new head; don't post findings about the old one.
2. Show the user the event, each inline comment with its anchor, the body, and every thread you plan to resolve, reopen, or reply to. Send only after a yes.
3. Write the payload to a temp file outside the repo and send it as one review:

   ```
   gh api repos/{owner}/{repo}/pulls/{n}/reviews --method POST --input <file>
   ```

   ```json
   {
     "commit_id": "<headRefOid>",
     "event": "REQUEST_CHANGES",
     "comments": [
       { "path": "api/export.py", "line": 42, "side": "RIGHT", "body": "**Important** ..." },
       { "path": "api/serializers.py", "start_line": 10, "line": 14, "start_side": "RIGHT", "side": "RIGHT", "body": "**Nit** ..." }
     ]
   }
   ```

   If GitHub rejects it, show the error, then:
   - **An anchor** (HTTP 422 about a line or position): re-check every anchor against the hunks, move the bad ones to the body, show the changed review, and send after another yes.
   - **Anything else**: stop, without switching to another event or touching any thread.
4. Once the review is posted, apply the thread plan:

   ```
   gh api graphql -f query='mutation($id: ID!) { resolveReviewThread(input: {threadId: $id}) { thread { id } } }' -F id=<thread id>
   gh api graphql -f query='mutation($id: ID!) { unresolveReviewThread(input: {threadId: $id}) { thread { id } } }' -F id=<thread id>
   gh api repos/{owner}/{repo}/pulls/{n}/comments/<first comment databaseId>/replies --method POST -f body='<reply>'
   ```
