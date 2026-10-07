# powerclaws

A collection of useful Claude Code plugins by [@iamtraction](https://github.com/iamtraction).

## Add this marketplace

```
/plugin marketplace add iamtraction/powerclaws
```

## Plugins

| Plugin | Description |
|--------|-------------|
| [sonar](./plugins/sonar/) | Plays a sound when Claude Code is idle and waiting for input, needs your approval, or hits an error |
| [beacon](./plugins/beacon/) | Tracks Claude Code session state in sessions.json — build any tool on top of it |
| [improvements](./plugins/improvements/) | A read-only code advisor — audits your codebase, ranks what's worth doing, and writes handoff plans any agent can execute |

## Install a plugin

```
/plugin install <plugin-name>@powerclaws
```

Example:

```
/plugin install sonar@powerclaws
```
