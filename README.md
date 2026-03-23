# Codex CLI + DashScope Proxy

Use OpenAI Codex CLI with Alibaba DashScope Coding Plan subscription via Anthropic-compatible API.

## ⚠️ Important: Do NOT Login with OpenAI Account

When you first run `codex`, it will ask you to login with OpenAI. **SKIP THIS STEP** by pressing `Ctrl+C` or selecting "Skip" if available. The proxy handles authentication via your DashScope API key configured in `~/.codex/config.toml`.

## What This Project Does

This proxy enables you to use OpenAI's Codex CLI (an AI coding assistant) with Alibaba's DashScope Coding Plan subscription instead of OpenAI's API. It translates between:
- **OpenAI Responses API** (what Codex CLI uses)
- **Anthropic Messages API** (what DashScope supports)

### Architecture

```
┌─────────────┐     OpenAI      ┌──────────────┐     Anthropic      ┌──────────────┐
│  Codex CLI  │ ◄──────────────► │ Proxy:8765   │ ◄───────────────► │  DashScope   │
│             │   Responses API  │ (this repo)  │   Messages API    │   Coding Plan │
└─────────────┘                  └──────────────┘                   └──────────────┘
```

## Features

- ✅ **Basic chat** - Conversations with AI
- ✅ **Streaming responses** - Real-time text display
- ✅ **Tool calling** - Shell commands, file operations
- ✅ **Parallel tool calls** - Multiple tools at once
- ✅ **Multi-turn conversations** - Contextual dialogue
- ✅ **Code generation** - Write and edit code
- ✅ **Image analysis** - Vision support via `-i` flag and `view_image` tool
- ✅ **All DashScope Coding Plan models** - qwen3.5-plus, qwen3-coder-plus, glm-5, glm-4.7, kimi-k2.5, MiniMax-M2.5

## Quick Start (One-Line Install)

```bash
# 1. Clone and setup
git clone https://github.com/vicmuchina/codex-alibaba-coding-plan-dashscope-proxy.git ~/Projects/codex-alibaba-coding-plan-dashscope-proxy

# 2. Create config directory and copy files
mkdir -p ~/.codex
cp ~/Projects/codex-alibaba-coding-plan-dashscope-proxy/config.toml ~/.codex/config.toml
cp ~/Projects/codex-alibaba-coding-plan-dashscope-proxy/models.json ~/.codex/models.json

# 3. Edit config with your API key (see below)
nano ~/.codex/config.toml

# 4. Start the proxy
cd ~/Projects/codex-alibaba-coding-plan-dashscope-proxy && node proxy.cjs &

# 5. Run Codex (SKIP OpenAI login!)
codex
```

## Detailed Setup

### Prerequisites

- **Node.js** (v18 or higher) - `node --version`
- **Codex CLI** - `npm install -g @openai/codex`
- **DashScope Coding Plan API Key** - Get from https://dashscope.console.aliyun.com/

### Step 1: Get Your API Key

1. Go to https://dashscope.console.aliyun.com/
2. Create an account or login
3. Subscribe to "Coding Plan" (required for Anthropic API access)
4. Generate an API key
5. Copy the key (starts with `sk-`)

### Step 2: Clone This Repository

```bash
git clone https://github.com/vicmuchina/codex-alibaba-coding-plan-dashscope-proxy.git ~/Projects/codex-alibaba-coding-plan-dashscope-proxy
cd ~/Projects/codex-alibaba-coding-plan-dashscope-proxy
```

### Step 3: Configure Codex CLI

Create the config directory and copy the provided config:

```bash
mkdir -p ~/.codex
cp ~/Projects/codex-alibaba-coding-plan-dashscope-proxy/config.toml ~/.codex/config.toml
cp ~/Projects/codex-alibaba-coding-plan-dashscope-proxy/models.json ~/.codex/models.json
```

**Edit the config file and add your API key:**

```bash
nano ~/.codex/config.toml
```

Find this section and replace `YOUR_DASHSCOPE_API_KEY` with your actual key:

```toml
[model_providers.dashscope]
base_url = "http://localhost:8765/v1"
api_key = "sk-your-actual-api-key-here"  # <-- REPLACE THIS
```

### Step 4: Start the Proxy

The proxy translates API calls between Codex CLI and DashScope:

```bash
cd ~/Projects/codex-alibaba-coding-plan-dashscope-proxy
node proxy.cjs &
```

**To verify it's running:**
```bash
lsof -i :8765
```

**To stop the proxy:**
```bash
pkill -f "node proxy.cjs"
```

### Step 5: Run Codex CLI

```bash
codex
```

**⚠️ IMPORTANT:** When Codex asks you to login with OpenAI, **SKIP IT** by pressing `Ctrl+C` or selecting "Continue without login" if available. The proxy uses your DashScope API key instead.

## Usage Examples

### Interactive Mode

```bash
codex
```

Then type your prompts:
```
› hello
• Hello! How can I help you today?

› what is 2+2?
• 2 + 2 = 4

› list files in /tmp
• (shows directory listing)
```

### One-off Commands (Exec Mode)

```bash
# Simple question
codex exec "what is the capital of France?"

# With tool calling
codex exec --skip-git-repo-check "list files in /tmp"

# Create a file
codex exec --skip-git-repo-check "create a hello.py file that prints Hello World"
```

### With Images

```bash
# Via command line
codex -i image.png "describe this image"

# In interactive mode
› view the image at /path/to/image.png and describe it
```

### Change Models

```bash
# Use a different model
codex exec --model glm-5 "your prompt"
```

## File Descriptions

```
codex-alibaba-coding-plan-dashscope-proxy/
├── proxy.cjs              # Main proxy server - translates APIs
├── config.toml            # Codex CLI configuration template
├── models.json            # Model catalog (eliminates "metadata not found" warning)
├── start.sh               # Simple startup script
├── LICENSE                # MIT License
└── README.md              # This file
```

### proxy.cjs

The heart of this project. It runs an HTTP server on port 8765 that:
- Receives OpenAI Responses API calls from Codex CLI
- Translates them to Anthropic Messages API format
- Sends to DashScope's Coding Plan endpoint
- Translates responses back to OpenAI format
- Handles streaming SSE events
- Supports tool calling with proper argument accumulation

### config.toml

Codex CLI configuration file. Key settings:
- `model_provider = "dashscope"` - Use DashScope instead of OpenAI
- `base_url = "http://localhost:8765/v1"` - Point to this proxy
- `api_key = "..."` - Your DashScope API key
- `wire_api = "responses"` - Use Responses API format
- Various MCP server configurations (optional)

### models.json

Model catalog that tells Codex about available DashScope models. Prevents the "Model metadata not found" warning.

## Configuration Reference

### Complete config.toml Structure

```toml
# Codex CLI Configuration for DashScope Coding Plan

model_provider = "dashscope"                    # Use DashScope
model = "qwen3.5-plus"                          # Default model
model_catalog_json = "~/.codex/models.json"     # Model definitions
sandbox_mode = "workspace-write"                # Allow file operations
approval_policy = "on-request"                  # Ask before running commands
web_search = "disabled"                         # Disable web search (not supported)

[model_providers.dashscope]
name = "DashScope Coding Plan (Anthropic)"
base_url = "http://localhost:8765/v1"           # Proxy address
api_key = "YOUR_DASHSCOPE_API_KEY_HERE"         # ⚠️ REPLACE THIS
requires_openai_auth = false                    # Skip OpenAI login
wire_api = "responses"                          # API format

[features]
shell_tool = true                               # Enable shell commands
multi_agent = true
shell_snapshot = true

# Optional: MCP Servers (for extended capabilities)
[mcp_servers.example]
command = "node"
args = ["/path/to/server.js"]
enabled = false
```

### Supported Models

| Model | Description | Best For |
|-------|-------------|----------|
| `qwen3.5-plus` | Best overall | General use (default) |
| `qwen3-coder-plus` | Code optimized | Programming tasks |
| `glm-5` | GLM model | Chinese language |
| `glm-4.7` | GLM model | Chinese language |
| `kimi-k2.5` | Moonshot model | Long context |
| `MiniMax-M2.5` | MiniMax model | General use |

## Troubleshooting

### "Port already in use" Error

```bash
# Kill existing proxy
pkill -f "node proxy.cjs"

# Or use a different port
PROXY_PORT=8766 node proxy.cjs
```

### "Request body format invalid" Error

Usually means:
1. Wrong API key - verify in config.toml
2. Not subscribed to Coding Plan - check DashScope console
3. User-Agent issue - proxy handles this automatically

### No Response from Codex

1. Check proxy is running: `lsof -i :8765`
2. Check proxy logs: Look for errors in the terminal
3. Verify API key: Should start with `sk-` and be valid
4. Test proxy directly: `curl http://localhost:8765/health`

### "Model metadata not found" Warning

Copy `models.json` to `~/.codex/models.json`:
```bash
cp ~/Projects/codex-alibaba-coding-plan-dashscope-proxy/models.json ~/.codex/models.json
```

### Codex Asks for OpenAI Login

**SKIP IT!** Press `Ctrl+C` or select "Skip". The proxy uses DashScope authentication, not OpenAI.

### Tool Calling Not Working

Ensure:
1. Proxy is running with latest version
2. Config has `shell_tool = true` in `[features]` section
3. Using `--skip-git-repo-check` flag if in a git repo

### Images Not Working

Images work via:
1. `-i` flag: `codex -i image.png "describe this"`
2. Interactive: `view the image at /path/to/image.png`

Ensure you're using a model that supports vision (all listed models do).

## Development

### Running the Proxy in Debug Mode

```bash
# With logging
cd ~/Projects/codex-alibaba-coding-plan-dashscope-proxy
node proxy.cjs 2>&1 | tee proxy.log
```

### Testing the Proxy

```bash
# Test with curl
curl -sN http://localhost:8765/v1/responses \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen3.5-plus","input":[{"role":"user","content":"hi"}],"stream":true}'

# Health check
curl http://localhost:8765/health
```

### Contributing

This is an open-source project. Contributions welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - See [LICENSE](LICENSE) file

## Credits

- Original proxy by vicmuchina
- Uses OpenAI Codex CLI
- Powered by Alibaba DashScope Coding Plan
- Anthropic Messages API compatibility

## Support

- **Issues:** https://github.com/vicmuchina/codex-alibaba-coding-plan-dashscope-proxy/issues
- **DashScope:** https://dashscope.console.aliyun.com/
- **Codex CLI:** https://github.com/openai/codex

---

**Happy Coding! 🚀**
