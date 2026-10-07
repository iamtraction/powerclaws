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
| Prompt submitted | Sets status → `active` |
| Permission needed | Sets status → `waiting` |
| Tool use starts / fails or denied | Sets status → `active` |
| Turn complete or failed on an API error | Sets status → `done` |
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
    "claudePid": 67890,
    "updatedAt": "2026-03-15T05:00:00.000Z"
  }
}
```

`terminalPid` is the nearest terminal (or editor) process above Claude Code, or `0` if none was found. `claudePid` is the Claude Code process; a session whose `claudePid` is dead gets pruned at the next registration.

## Requirements

Node.js on your `PATH`. The native Claude Code installer doesn't provide it.
