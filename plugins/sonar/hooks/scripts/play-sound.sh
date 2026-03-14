#!/bin/bash
# sonar - cross-platform notification sound player
# Usage: play-sound.sh <done|error|prompt>

SOUND="$1"
SOUND_FILE="$CLAUDE_PLUGIN_ROOT/sounds/${SOUND}.wav"

if [ ! -f "$SOUND_FILE" ]; then
  exit 0
fi

case "$(uname -s)" in
  Darwin)
    afplay "$SOUND_FILE" &
    ;;
  Linux)
    if command -v aplay &>/dev/null; then
      aplay -q "$SOUND_FILE" &
    elif command -v paplay &>/dev/null; then
      paplay "$SOUND_FILE" &
    fi
    ;;
  MINGW*|MSYS*|CYGWIN*)
    # Convert /c/path/... to C:/path/... for PowerShell
    WIN_PATH=$(echo "$SOUND_FILE" | sed 's|^/\([a-zA-Z]\)/|\1:/|')
    powershell.exe -WindowStyle Hidden -NonInteractive -Command "\$p = New-Object System.Media.SoundPlayer '$WIN_PATH'; \$p.PlaySync()" &
    ;;
esac

exit 0
