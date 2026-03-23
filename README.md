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

Codex CLI configuration file with:
- **Core settings**: `model_provider`, `api_key`, `base_url`
- **Features**: Enable shell commands (`shell_tool = true`)
- **MCP Servers**: Optional extensions (tavily, context7, chrome-devtools)
- **Security**: Project trust levels for automatic approvals

Key settings:
- `model_provider = "dashscope"` - Use DashScope instead of OpenAI
- `base_url = "http://localhost:8765/v1"` - Point to this proxy
- `api_key = "..."` - Your DashScope API key
- `wire_api = "responses"` - Use Responses API format

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

# ==========================================
# MCP SERVERS (Optional)
# ==========================================
# Uncomment and configure MCP servers to extend Codex capabilities
# 
# [mcp_servers.tavily]
# command = "npx"
# args = ["-y", "tavily-mcp@latest"]
# enabled = true
# [mcp_servers.tavily.env]
# TAVILY_API_KEY = "your-key-here"
# 
# [mcp_servers.context7]
# command = "npx"  
# args = ["-y", "@upstash/context7-mcp"]
# enabled = true
# [mcp_servers.context7.env]
# CONTEXT7_API_KEY = "your-key-here"
```

## MCP Servers (Optional)

MCP (Model Context Protocol) servers extend Codex with additional tools and capabilities. The config includes examples for popular MCP servers:

### Tavily MCP - Web Search

Enables AI to search the web for up-to-date information.

**Setup:**
1. Get API key: https://tavily.com
2. Uncomment `[mcp_servers.tavily]` section in config.toml
3. Add your API key
4. Set `enabled = true`

**Usage:**
```
› search for latest TypeScript features
```

### Context7 MCP - Documentation Search

Search documentation from popular libraries and frameworks.

**Setup:**
1. Get API key: https://context7.com
2. Uncomment `[mcp_servers.context7]` section in config.toml
3. Add your API key
4. Set `enabled = true`

**Usage:**
```
› look up React useEffect documentation
```

### Chrome DevTools MCP - Browser Automation

Control Chrome browser for testing and automation (requires Chrome running with remote debugging).

**Setup:**
1. Install: `npm install -g chrome-devtools-mcp`
2. Start Chrome with: `google-chrome --remote-debugging-port=9333`
3. Uncomment `[mcp_servers.chrome-devtools]` section
4. Update path to your chrome-devtools-mcp installation
5. Set `enabled = true`

**Usage:**
```
› take a screenshot of the current page
› navigate to example.com
```

### Other MCP Servers

You can add any MCP server:

```toml
[mcp_servers.server-name]
command = "npx"
args = ["-y", "mcp-server-package"]
enabled = true
```

Find more MCP servers at: https://github.com/modelcontextprotocol/servers

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

### Planning Mode / `request_user_input` Tool

**Known Limitation:** Planning mode and the `request_user_input` tool (used for interactive questions) are **partially supported**. 

DashScope's models (qwen3.5-plus, etc.) are not natively trained on Codex CLI's special tools. When the model attempts to use `request_user_input`, it may output XML-like text instead of proper interactive UI elements.

**Workarounds:**
- Use **default mode** instead of planning mode (press `Tab` to switch modes)
- Avoid prompts that ask the model to "ask clarifying questions"
- If the model outputs XML-like `<request_user_input>` tags, respond with your choice in natural language

**Example:**
```
› Plan a refactoring of my codebase
  (model may output XML text instead of interactive questions)

› Just proceed with option 1
  (respond naturally to continue)
```

This limitation exists because `request_user_input` is a Codex CLI-specific tool that OpenAI's models are trained on, but third-party models are not.

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
