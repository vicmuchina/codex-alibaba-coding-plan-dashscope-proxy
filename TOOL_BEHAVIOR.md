# Codex CLI Tool Behavior - Not a Proxy Issue

## Important Note

The tool issues described below are **NOT caused by the DashScope proxy**. The proxy correctly translates API calls between OpenAI Responses API format and Anthropic Messages API format. These behaviors are inherent to how Codex CLI works with third-party models.

## What Tools Are Actually Available

### CLI Mode (Interactive Terminal)
When running `codex` or `codex exec`, the following tools are available:

| Tool | Purpose | Notes |
|------|---------|-------|
| `exec_command` / `shell_command` | Execute shell commands | Primary file manipulation method |
| `apply_patch` | Edit files using custom patch format | See format below |
| `write_stdin` | Write to running command stdin | For interactive commands |
| `update_plan` | Manage task plans | Planning mode only |
| `request_user_input` | Ask user questions with options | Requires feature flag |
| `web_search` | Search the web | Optional |
| `view_image` | View image files | Vision support |
| `spawn_agent`, etc. | Multi-agent collaboration | Advanced features |

### NOT Available in CLI Mode
The following tools are **only available in app-server mode** (for IDE integrations):

- ❌ `fs/readFile` - Read files directly
- ❌ `fs/writeFile` - Write files directly  
- ❌ `fs/createDirectory` - Create directories
- ❌ `fs/remove` - Delete files/directories
- ❌ `fs/copy` - Copy files/directories
- ❌ `fs/getMetadata` - Get file metadata
- ❌ `fs/readDirectory` - List directory contents

**Why:** Codex CLI is designed to use shell commands for file operations in CLI mode.

## The `apply_patch` Format Issue

### Problem
Models often take multiple attempts to get the `apply_patch` format correct.

### Root Cause
The `apply_patch` tool uses a **custom format** (not standard unified diff):

```
*** Begin Patch
*** Update File: /path/to/file
 context line with leading space
-removed line with leading minus
+added line with leading plus
 context line
*** End Patch
```

### Why Models Struggle
1. **Not standard diff** - Models trained on `diff -u` output
2. **Strict formatting** - Context lines MUST start with space
3. **Custom syntax** - Uses `***` delimiters instead of `---`/`+++`
4. **Training gap** - Third-party models not trained on this format

### Solutions
- **Retry** - Models typically succeed after 2-4 attempts
- **Manual edit** - Provide the correct format in your prompt
- **Use shell** - Ask model to use `sed` or `echo` instead

## Excessive Searching vs Reading

### Problem
Models often use `search` multiple times instead of just `read`ing files.

### Root Cause
1. **Unknown file sizes** - Model assumes files might be large
2. **Pattern matching habit** - Trained to grep for specific values
3. **Efficiency misconception** - Believes search is faster

### Impact
- Slower execution (multiple searches vs one read)
- More API calls
- More tokens used

### Solutions
You can add to your instructions:
```
"For config files and small files (< 100 lines), always use read_file 
instead of search. Config files are typically small."
```

## Plan Mode vs Default Mode

### Plan Mode
- Uses `request_user_input` tool for interactive questions
- Model asks clarifying questions with multiple-choice options
- Requires `request_user_input = true` in `[features]` section

### Default Mode  
- Direct execution without questions
- Faster for straightforward tasks
- Switch modes with `Tab` key in TUI

### Configuration
```toml
[features]
shell_tool = true
multi_agent = true
shell_snapshot = true
request_user_input = true  # Enable for plan mode questions
```

## Summary

| Issue | Cause | Solution |
|-------|-------|----------|
| No fs/* tools | CLI mode design | Use exec_command with cat/echo |
| apply_patch fails | Custom format | Retry or use shell commands |
| Excessive searching | Model defaults | Add instruction to use read |
| Plan mode questions | Feature flag | Set request_user_input = true |

## The Proxy's Role

The DashScope proxy:
- ✅ Correctly forwards tool definitions to the API
- ✅ Correctly translates tool calls between formats
- ✅ Handles all API communication properly

The proxy **does NOT**:
- ❌ Control which tools Codex CLI exposes
- ❌ Control how models format tool arguments
- ❌ Control model tool selection (search vs read)

These are **Codex CLI and model behavior**, not proxy bugs.

## References

- Codex CLI Architecture: https://github.com/openai/codex
- Apply Patch Format: Codex CLI source code
- Tool availability: CLI vs App-Server modes
