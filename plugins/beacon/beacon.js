#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

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

// mkdir spin-lock: 10 retries x 100ms
function acquireLock() {
    const lock = lockPath();
    for (let i = 0; i < 10; i++) {
        try {
            fs.mkdirSync(lock);
            return () => { try { fs.rmdirSync(lock); } catch { } };
        } catch {
            if (i < 9) sleep(100);
        }
    }
    throw new Error("beacon: could not acquire lock after 10 retries");
}

function readState() {
    try {
        return JSON.parse(fs.readFileSync(statePath(), "utf8"));
    } catch {
        return {};
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
        withLock(() => {
            const state = readState();
            // prune sessions whose terminal PID is known and confirmed dead
            for (const [id, sess] of Object.entries(state)) {
                if (sess.terminalPid > 0 && !isAlive(sess.terminalPid)) delete state[id];
            }
            state[sessionId] = {
                id: sessionId,
                folder: args.folder || path.basename(cwd) || "",
                path: cwd,
                branch: args.branch || "",
                status: "active",
                terminalPid: parseInt(args["terminal-pid"]) || 0,
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
