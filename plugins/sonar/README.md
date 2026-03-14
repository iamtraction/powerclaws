# sonar

A Claude Code plugin that plays a sound when something happens so you can minimize your terminal and come back when you hear it.

## Sounds

| Event | Sound | When |
|-------|-------|------|
| `done.wav` | Done | Claude finishes a task and is ready for your next input |
| `error.wav` | Error | A tool call fails mid-execution |
| `prompt.wav` | Prompt | Claude needs your approval before continuing |

## Installation

**Step 1** — Add the marketplace (once):

```
/plugin marketplace add iamtraction/powerclaws
```

**Step 2** — Install the plugin:

```
/plugin install sonar@powerclaws
```

That's it. The sounds will play automatically from your next session.

## Requirements

| Platform | Requirement |
|----------|-------------|
| macOS | None — uses `afplay` (built-in) |
| Linux | `aplay` (ALSA) or `paplay` (PulseAudio) — install via `apt install alsa-utils` or `apt install pulseaudio-utils` |
| Windows | None — uses PowerShell `SoundPlayer` (built-in) |

## Customizing Sounds

Replace any of the `.wav` files in the `sounds/` directory with your own. Files must be named `done.wav`, `error.wav`, and `prompt.wav` and must be in WAV format.
