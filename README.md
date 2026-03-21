# Codex CLI + DashScope Proxy

Use OpenAI Codex CLI with Alibaba DashScope Coding Plan subscription.

## Features

- ✅ Basic chat conversations
- ✅ Tool calling (shell commands, file operations)
- ✅ Multi-turn conversations
- ✅ Image analysis (vision)
- ✅ SSE streaming
- ✅ All DashScope Coding Plan models

## Supported Models

| Model | Description |
|-------|-------------|
| `qwen3.5-plus` | Best overall (default) |
| `qwen3-coder-plus` | Optimized for code |
| `glm-5` | GLM model |
| `glm-4.7` | GLM model |
| `kimi-k2.5` | Kimi model |
| `MiniMax-M2.5` | MiniMax model |

## One-Line Install

```bash
git clone https://github.com/vicmuchina/codex-dashscope-proxy.git ~/Projects/codex-dashscope-proxy && cp ~/Projects/codex-dashscope-proxy/config.toml ~/.codex/config.toml
```

Then start the proxy:
```bash
cd ~/Projects/codex-dashscope-proxy && node proxy.cjs &
```

## Setup

### 1. Clone this repo

```bash
git clone https://github.com/YOUR_USERNAME/codex-dashscope-proxy.git ~/Projects/codex-dashscope-proxy
```

### 2. Copy the Codex config

```bash
mkdir -p ~/.codex
cp ~/Projects/codex-dashscope-proxy/config.toml ~/.codex/config.toml
```

### 3. Add your API key

Edit `~/.codex/config.toml` and replace the API key:

```toml
[model_providers.dashscope]
api_key = "YOUR_DASHSCOPE_API_KEY"
```

### 4. Start the proxy

```bash
cd ~/Projects/codex-dashscope-proxy
node proxy.cjs
```

### 5. Run Codex

```bash
codex
```

## Usage

### Interactive Mode

```bash
codex
```

### One-off Command

```bash
codex exec "your prompt"
```

### With Image

```bash
codex -i image.png "describe this image"
```

## Config File

The config file is located at `~/.codex/config.toml`:

```toml
model_provider = "dashscope"
model = "qwen3.5-plus"
sandbox_mode = "workspace-write"
approval_policy = "on-request"
web_search = "disabled"

[model_providers.dashscope]
name = "DashScope Coding Plan"
base_url = "http://localhost:8765/v1"
api_key = "YOUR_API_KEY"
requires_openai_auth = false
wire_api = "responses"

[features]
shell_tool = true
multi_agent = true
shell_snapshot = true
```

## How It Works

```
Codex CLI ──► Proxy (localhost:8765) ──► DashScope Anthropic API
              │
              └── Converts OpenAI Responses API ◄──► Anthropic Messages API
```

The proxy translates between:
- OpenAI Responses API format (Codex CLI)
- Anthropic Messages API format (DashScope)

## Troubleshooting

### No response from Codex

1. Ensure the proxy is running: `lsof -i :8765`
2. Check proxy logs in terminal
3. Verify API key in config

### 405 Error

Ensure `User-Agent: curl/8.5.0` header is sent (handled by proxy).

### Image not working

Make sure to use `-i` flag: `codex -i image.png "prompt"`

## Files

```
codex-dashscope-proxy/
├── proxy.cjs      # Main proxy server
├── config.toml    # Codex config example
├── start.sh       # Startup script
└── README.md      # This file
```

## API Key

Get your DashScope Coding Plan API key from:
https://dashscope.console.aliyun.com/

## License

MIT