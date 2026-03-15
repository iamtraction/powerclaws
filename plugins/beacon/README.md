# beacon

Tracks Claude Code session state in `~/.claude/beacon/sessions.json`. Build any tool on top of it.

## Install

```
/plugin install beacon@powerclaws
```

## How it works

Beacon hooks into Claude Code events and writes session state to `~/.claude/beacon/sessions.json`. The file is yours — build a tray app, a dashboard, a notifier, or just watch it with `tail -f`.

| Event | What happens |
|-------|-------------|
| Session starts | Registers the session (folder, branch, terminal PID) |
| Permission needed | Sets status → `waiting` |
| Tool use starts / fails or denied | Sets status → `active` |
| Turn complete | Sets status → `done` |
| Session ends | Removes the session |

## sessions.json schema

```json
{
  "<session-id>": {
    "id": "string",
    "folder": "string",
    "path": "string",
    "branch": "string",
    "status": "active | waiting | done",
    "terminalPid": 12345,
    "updatedAt": "2026-03-15T05:00:00.000Z"
  }
}
```

## Requirements

Node.js (guaranteed available — Claude Code runs on Node.js).
