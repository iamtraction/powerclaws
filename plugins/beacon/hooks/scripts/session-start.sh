#!/bin/bash
# beacon - SessionStart hook
# Registers the new session in sessions.json.
set -euo pipefail

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"

# read hook metadata from stdin
INPUT=$(cat -)
SESSION_ID=$(node -e "try{process.stdout.write(JSON.parse(process.argv[1]).session_id||'')}catch{}" -- "$INPUT")
[ -n "$SESSION_ID" ] || exit 0
CWD=$(node -e "try{process.stdout.write(JSON.parse(process.argv[1]).cwd||'')}catch{}" -- "$INPUT")

# session metadata
FOLDER=$(basename "$CWD")
BRANCH=$(cd "$CWD" && git branch --show-current 2>/dev/null || echo "")

# terminal PID discovery
TERMINAL_PID=0
OS=$(uname -s)

# Windows: PowerShell Get-Process .Name returns names without .exe
WINDOWS_TERMINALS="WindowsTerminal cmd powershell pwsh alacritty wezterm-gui mintty conhost Code code-server"
MACOS_TERMINALS="Terminal iTerm2 Alacritty WezTerm Hyper kitty Ghostty Code code-server"
LINUX_TERMINALS="gnome-terminal gnome-terminal-server konsole xterm alacritty wezterm kitty xfce4-terminal foot tilix terminator urxvt st rxvt mate-terminal code code-server"

get_ppid() {
  local pid="$1"
  case "$OS" in
    MINGW*|MSYS*|CYGWIN*)
      powershell.exe -NonInteractive -Command \
        "(Get-CimInstance Win32_Process -Filter 'ProcessId=$pid').ParentProcessId" 2>/dev/null | tr -d '\r\n '
      ;;
    *)
      ps -o ppid= -p "$pid" 2>/dev/null | tr -d ' '
      ;;
  esac
}

get_pname() {
  local pid="$1"
  case "$OS" in
    MINGW*|MSYS*|CYGWIN*)
      powershell.exe -NonInteractive -Command \
        "(Get-Process -Id $pid -ErrorAction SilentlyContinue).Name" 2>/dev/null | tr -d '\r\n'
      ;;
    *)
      # strip path prefix in case comm= returns full path (some distros/macOS versions)
      ps -o comm= -p "$pid" 2>/dev/null | sed 's|.*/||'
      ;;
  esac
}

is_terminal() {
  local pname="$1"
  local list
  case "$OS" in
    MINGW*|MSYS*|CYGWIN*) list="$WINDOWS_TERMINALS" ;;
    Darwin)               list="$MACOS_TERMINALS" ;;
    *)                    list="$LINUX_TERMINALS" ;;
  esac
  for t in $list; do
    [ "$pname" = "$t" ] && return 0
  done
  return 1
}

# on Windows (MSYS/Cygwin), $$ is a POSIX PID — get the real Windows PID
case "$OS" in
  MINGW*|MSYS*|CYGWIN*)
    win_pid=$(cat /proc/$$/winpid 2>/dev/null | tr -d '\r\n ')
    if [ -n "$win_pid" ] && [ "$win_pid" -gt 0 ] 2>/dev/null; then
      current_pid="$win_pid"
    else
      current_pid=$$
    fi
    ;;
  *)
    current_pid=$$
    ;;
esac

for i in $(seq 1 10); do
  ppid=$(get_ppid "$current_pid")
  if [ -z "$ppid" ] || [ "$ppid" = "0" ] || [ "$ppid" = "1" ]; then
    break
  fi
  pname=$(get_pname "$ppid")
  if is_terminal "$pname"; then
    TERMINAL_PID="$ppid"
    break
  fi
  current_pid="$ppid"
done

# register session
node "$PLUGIN_ROOT/beacon.js" register \
  --session-id "$SESSION_ID" \
  --folder "$FOLDER" \
  --path "$CWD" \
  --branch "$BRANCH" \
  --terminal-pid "$TERMINAL_PID"
