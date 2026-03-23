# Codex CLI Modes Explained

## Two Different Ways to Run Codex

### 1. CLI Mode (What You're Using)

**How you run it:**
```bash
codex                    # Interactive mode
codex exec "prompt"      # One-off command
```

**What it is:**
- Runs directly on your local machine
- Terminal UI (TUI) interface
- Single user, single session
- **This is what you've been using**

**Available tools:**
- ✅ `exec_command` / `shell_command` - Run shell commands
- ✅ `apply_patch` - Edit files
- ✅ `write_stdin` - Interactive command input
- ✅ `request_user_input` - Ask questions
- ✅ `view_image` - View images
- ❌ `fs/readFile` - NOT available
- ❌ `fs/writeFile` - NOT available
- ❌ `fs/*` - NOT available

**File operations:**
- Must use `exec_command` with `cat`, `echo`, `sed`, etc.
- Example: `cat file.txt` instead of `fs/readFile`

---

### 2. App-Server Mode

**How you run it:**
```bash
codex app-server         # Start server
codex app-server --listen ws://localhost:8080  # WebSocket mode
```

**What it is:**
- Runs as a background server/daemon
- Other applications connect to it
- Used by IDE extensions (VS Code, etc.)
- Multiple clients can connect
- Different architecture than CLI mode

**Available tools:**
- ✅ `exec_command` - Run shell commands
- ✅ `apply_patch` - Edit files
- ✅ **ALL `fs/*` tools** - Direct file system access
  - `fs/readFile` - Read files directly
  - `fs/writeFile` - Write files directly
  - `fs/createDirectory` - Create directories
  - `fs/remove` - Delete files
  - `fs/copy` - Copy files
  - `fs/getMetadata` - File metadata

**Why different tools?**
- IDE extensions need direct file access
- App-server is designed for programmatic access
- CLI is designed for shell-based workflows

---

## Key Difference

| Feature | CLI Mode | App-Server Mode |
|---------|----------|-----------------|
| **Interface** | Terminal TUI | Background server |
| **Usage** | Direct user interaction | IDE extensions, other apps |
| **File ops** | Shell commands (`cat`, `echo`) | Direct `fs/*` tools |
| **fs/readFile** | ❌ Not available | ✅ Available |
| **fs/writeFile** | ❌ Not available | ✅ Available |
| **Connection** | Local only | Can accept remote connections |

---

## What This Means for You

**You're using CLI mode**, which means:
- You CANNOT use `fs/readFile`, `fs/writeFile`
- Models MUST use shell commands for file operations
- This is normal and expected
- This is how Codex CLI is designed to work

**The model complaining about missing fs/* tools** is incorrect - it should use shell commands in CLI mode.

**Example of correct CLI mode file operations:**
```bash
# Reading a file (CLI mode)
exec_command: cat /path/to/file.txt

# Writing a file (CLI mode)
exec_command: echo "content" > /path/to/file.txt

# NOT available in CLI mode (app-server only)
fs/readFile: /path/to/file.txt  ❌
fs/writeFile: /path/to/file.txt  ❌
```

---

## Why Two Different Modes?

**CLI Mode:**
- Designed for terminal users
- Shell-based workflow (Unix philosophy)
- Simpler, more direct
- Single user

**App-Server Mode:**
- Designed for IDE integrations
- Programmatic access needed
- Direct file system access for extensions
- Can handle multiple clients

---

## Summary

**NOT related to OpenAI login or connection!**

Both modes work with your DashScope proxy:
- CLI mode → Uses shell commands for files (what you're using)
- App-server mode → Uses fs/* tools (for IDEs, not typical usage)

The missing fs/* tools in your interaction is **expected behavior for CLI mode**, not a bug or limitation of the proxy.
