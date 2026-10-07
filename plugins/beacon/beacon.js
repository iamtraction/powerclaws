#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { execFileSync } = require("node:child_process");

function stateDir() {
    return path.join(os.homedir(), ".claude", "beacon");
}

function statePath() {
    return path.join(stateDir(), "sessions.json");
}

function lockPath() {
    return path.join(stateDir(), "sessions.lock");
}

// synchronous sleep using atomics (works on Node.js main thread)
function sleep(ms) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

// holders keep the lock for milliseconds; an older one was left by a killed process
const STALE_LOCK_MS = 5000;

// mkdir spin-lock: 10 retries x 100ms
function acquireLock() {
    const lock = lockPath();
    for (let i = 0; i < 10; i++) {
        try {
            fs.mkdirSync(lock);
            return () => { try { fs.rmdirSync(lock); } catch { } };
        } catch {
            try {
                if (Date.now() - fs.statSync(lock).mtimeMs > STALE_LOCK_MS) {
                    fs.rmdirSync(lock);
                    continue;
                }
            } catch { }
            if (i < 9) sleep(100);
        }
    }
    throw new Error("beacon: could not acquire lock after 10 retries");
}

// any other read error (e.g. a reader holding the file on Windows) must not
// look like an empty file, or the next write would drop every other session
function readState() {
    try {
        return JSON.parse(fs.readFileSync(statePath(), "utf8"));
    } catch (e) {
        if (e.code === "ENOENT" || e instanceof SyntaxError) return {};
        throw e;
    }
}

// atomic write via tmp + rename
function writeState(state) {
    const tmp = statePath() + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2), "utf8");
    fs.renameSync(tmp, statePath());
}

function withLock(fn) {
    fs.mkdirSync(stateDir(), { recursive: true });
    const release = acquireLock();
    try {
        fn();
    } finally {
        release();
    }
}

// cross-platform process liveness check via signal 0
function isAlive(pid) {
    if (!pid || pid <= 0) return false;
    try {
        process.kill(pid, 0);
        return true;
    } catch (e) {
        return e.code === "EPERM";
    }
}

const TERMINALS = {
    win32: ["WindowsTerminal", "cmd", "powershell", "pwsh", "alacritty", "wezterm-gui", "mintty", "conhost", "Code", "code-server"],
    darwin: ["Terminal", "iTerm2", "Alacritty", "WezTerm", "Hyper", "kitty", "Ghostty", "Code", "code-server"],
    linux: ["gnome-terminal", "gnome-terminal-server", "konsole", "xterm", "alacritty", "wezterm", "kitty", "xfce4-terminal", "foot", "tilix", "terminator", "urxvt", "st", "rxvt", "mate-terminal", "code", "code-server"],
};

// pid -> { ppid, name } for every process, from one OS query
function processTable() {
    const table = new Map();
    if (process.platform === "win32") {
        const out = execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command",
            "Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name | ConvertTo-Json -Compress"],
            { encoding: "utf8", timeout: 8000, windowsHide: true });
        for (const p of JSON.parse(out)) {
            table.set(p.ProcessId, { ppid: p.ParentProcessId, name: String(p.Name).replace(/\.exe$/i, "") });
        }
    } else {
        const out = execFileSync("ps", ["-A", "-o", "pid=,ppid=,comm="], { encoding: "utf8", timeout: 5000 });
        for (const line of out.split("\n")) {
            const m = line.match(/^\s*(\d+)\s+(\d+)\s+(.+)$/);
            if (m) table.set(Number(m[1]), { ppid: Number(m[2]), name: path.basename(m[3].trim()) });
        }
    }
    return table;
}

// nearest ancestor that is a known terminal; 0 when none is found or the lookup fails
function findTerminalPid() {
    try {
        const table = processTable();
        const names = TERMINALS[process.platform] || TERMINALS.linux;
        let pid = process.pid;
        for (let i = 0; i < 12; i++) {
            const ppid = table.get(pid)?.ppid;
            if (!ppid || ppid <= 1) break;
            if (names.includes(table.get(ppid)?.name)) return ppid;
            pid = ppid;
        }
    } catch { }
    return 0;
}

function gitBranch(cwd) {
    try {
        return execFileSync("git", ["branch", "--show-current"], { cwd, encoding: "utf8", timeout: 3000, stdio: ["ignore", "pipe", "ignore"], windowsHide: true }).trim();
    } catch {
        return "";
    }
}

function parseArgs(argv) {
    const result = {};
    for (let i = 0; i < argv.length; i++) {
        if (argv[i].startsWith("--") && i + 1 < argv.length) {
            result[argv[i].slice(2)] = argv[i + 1];
            i++;
        }
    }
    return result;
}

// read and parse stdin JSON (Claude Code hook context).
// returns {} if stdin is a terminal or unparseable.
function readStdin() {
    if (process.stdin.isTTY) return {};
    try {
        return JSON.parse(fs.readFileSync(0, "utf8"));
    } catch {
        return {};
    }
}

const [, , cmd, ...rest] = process.argv;
const args = parseArgs(rest);
const stdin = readStdin();

// resolve session ID from CLI arg or stdin
const sessionId = args["session-id"] || stdin.session_id || "";

switch (cmd) {
    case "register": {
        if (!sessionId) process.exit(0); // no session to register
        const cwd = args.path || stdin.cwd || "";
        // gathered before taking the lock: the process query takes ~0.5s on Windows
        const branch = args.branch ?? (cwd ? gitBranch(cwd) : "");
        const terminalPid = args["terminal-pid"] !== undefined ? parseInt(args["terminal-pid"]) || 0 : findTerminalPid();
        // hooks run in exec form, so the parent is the Claude Code process itself
        const claudePid = process.ppid;
        withLock(() => {
            const state = readState();
            // prune sessions whose Claude Code process (or, for entries from older
            // versions, terminal) is known and confirmed dead
            for (const [id, sess] of Object.entries(state)) {
                const pid = sess.claudePid > 0 ? sess.claudePid : sess.terminalPid;
                if (pid > 0 && !isAlive(pid)) delete state[id];
            }
            state[sessionId] = {
                id: sessionId,
                folder: args.folder || path.basename(cwd) || "",
                path: cwd,
                branch,
                status: "active",
                terminalPid,
                claudePid,
                updatedAt: new Date().toISOString(),
            };
            writeState(state);
        });
        break;
    }

    case "status": {
        const status = rest[0];
        if (!sessionId || !status) process.exit(0);
        withLock(() => {
            const state = readState();
            if (state[sessionId]) {
                state[sessionId].status = status;
                state[sessionId].updatedAt = new Date().toISOString();
                writeState(state);
            }
        });
        break;
    }

    case "remove": {
        if (!sessionId) process.exit(0);
        withLock(() => {
            const state = readState();
            delete state[sessionId];
            writeState(state);
        });
        break;
    }

    default:
        process.stderr.write("Usage: beacon.js <register|status|remove> [flags]\n");
        process.exit(1);
}
