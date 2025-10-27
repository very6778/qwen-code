# Using ZAI OpenRouter with Qwen Code

ZAI OpenRouter support lets you run either the MiniMax M2 (via OpenRouter) or the native GLM-4.6 model through the ZAI gateway. MiniMax is now the default for new sessions, while GLM-4.6 remains available as an alternative tuned for coding tasks.

## Setup

1. **Get API Keys**
   - **ZAI**: Contact ZAI to get access to their API and obtain your API key from their dashboard
   - **MiniMax**: Get your OpenRouter API key for MiniMax M2 model

2. **Set Environment Variables**
   ```bash
   # For ZAI OpenRouter (GLM-4.6)
   export ZAI_API_KEY="your-zai-api-key-here"
   export ZAI_BASE_URL="https://api.z.ai/api/coding/paas/v4"

   # For MiniMax M2 (OpenRouter)
   export MINIMAX_API_KEY="your-minimax-api-key-here"
   export MINIMAX_BASE_URL="https://openrouter.ai/api/v1"
   ```

   Or add them to your `.env` file:
   ```
   # ZAI OpenRouter Configuration
   ZAI_API_KEY=your-zai-api-key-here
   ZAI_BASE_URL=https://api.z.ai/api/coding/paas/v4

   # MiniMax Configuration
   MINIMAX_API_KEY=your-minimax-api-key-here
   MINIMAX_BASE_URL=https://openrouter.ai/api/v1
   ```

   Note: `ZAI_BASE_URL` defaults to `https://api.z.ai/api/coding/paas/v4` and `MINIMAX_BASE_URL` defaults to `https://openrouter.ai/api/v1` if not specified.

## Usage

### Interactive Mode

1. Start Qwen Code:
   ```bash
   qwen
   ```

2. When prompted for authentication method, select **"ZAI OpenRouter"**

3. Use `/model` command to switch between available models:
   - **GLM-4.6**: Original ZAI model
   - **MiniMax M2 (Free)**: Alternative model via OpenRouter

4. The CLI will automatically use the appropriate API endpoint and settings based on your selection

### Non-Interactive Mode

ZAI OpenRouter will be used automatically if you have the API key set:
```bash
echo "Write a Python function to sort a list" | qwen
```

## Model Configuration

### GLM-4.6 (ZAI)
- **Model**: GLM-4.6
- **Temperature**: 0.3
- **Top P**: 0.9
- **Endpoint**: https://api.z.ai/api/coding/paas/v4

### MiniMax M2 (OpenRouter)
- **Model**: minimax/minimax-m2:free
- **Temperature**: 0.7
- **Top P**: 0.9
- **Endpoint**: https://openrouter.ai/api/v1

Both models support:
- Max Tokens: User configurable (no default limit)

## Features

- ✅ Text generation
- ✅ Streaming responses
- ✅ Function calling
- ✅ JSON mode
- ✅ Coding task optimization
- ❌ Embeddings (not supported)

## API Configuration

The ZAI OpenRouter provider includes special headers for identification:
- `HTTP-Referer`: https://github.com/QwenLM/qwen-code.git
- `X-Title`: Qwen Code
- `X-Model`: Resolves to `minimax/minimax-m2:free` when MiniMax is active, otherwise `glm-4.6`

## Troubleshooting

### "ZAI_API_KEY not found" error
Make sure you've set the environment variable correctly:
```bash
echo $ZAI_API_KEY
```

### Connection issues
Verify the base URL is accessible:
```bash
curl -H "Authorization: Bearer $ZAI_API_KEY" \
     "$ZAI_BASE_URL/models"
```

### Model not available
Both MiniMax M2 and GLM-4.6 are supported. If you encounter model-related errors, verify that the desired model appears under `/model` and that the relevant API key is set.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ZAI_API_KEY` | Yes | - | Your ZAI API key |
| `ZAI_BASE_URL` | No | `https://api.z.ai/api/coding/paas/v4` | ZAI API endpoint |
| `MINIMAX_API_KEY` | No | - | Your MiniMax/OpenRouter API key |
| `MINIMAX_BASE_URL` | No | `https://openrouter.ai/api/v1` | MiniMax API endpoint |

## Example .env file

```env
# ZAI OpenRouter Configuration
ZAI_API_KEY=your-zai-api-key-here
ZAI_BASE_URL=https://api.z.ai/api/coding/paas/v4

# MiniMax Configuration (alternative model)
MINIMAX_API_KEY=your-minimax-api-key-here
MINIMAX_BASE_URL=https://openrouter.ai/api/v1

# Other configurations...
# QWEN_DEFAULT_AUTH_TYPE=zai-openrouter
```
