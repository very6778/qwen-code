# Using ZAI OpenRouter with Qwen Code

ZAI OpenRouter support allows you to use the GLM-4.6 model through the ZAI API gateway. This provides an alternative AI model option specifically configured for coding tasks.

## Setup

1. **Get a ZAI API Key**
   - Contact ZAI to get access to their API
   - Obtain your API key from their dashboard

2. **Set Environment Variables**
   ```bash
   export ZAI_API_KEY="your-zai-api-key-here"
   export ZAI_BASE_URL="https://api.z.ai/api/coding/paas/v4"
   ```

   Or add them to your `.env` file:
   ```
   ZAI_API_KEY=your-zai-api-key-here
   ZAI_BASE_URL=https://api.z.ai/api/coding/paas/v4
   ```

   Note: `ZAI_BASE_URL` will default to `https://api.z.ai/api/coding/paas/v4` if not specified.

## Usage

### Interactive Mode

1. Start Qwen Code:
   ```bash
   qwen
   ```

2. When prompted for authentication method, select **"ZAI OpenRouter (GLM-4.6)"**

3. The CLI will automatically use your ZAI API key and the GLM-4.6 model

### Non-Interactive Mode

ZAI OpenRouter will be used automatically if you have the API key set:
```bash
echo "Write a Python function to sort a list" | qwen
```

## Model Configuration

- **Model**: GLM-4.6 (fixed)
- **Temperature**: 0.6 (default)
- **Top P**: 0.9 (default)
- **Max Tokens**: User configurable (no default limit)

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
- `X-Model`: glm-4.6

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
GLM-4.6 is the only supported model for ZAI OpenRouter. If you encounter model-related errors, contact ZAI support.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ZAI_API_KEY` | Yes | - | Your ZAI API key |
| `ZAI_BASE_URL` | No | `https://api.z.ai/api/coding/paas/v4` | ZAI API endpoint |

## Example .env file

```env
# ZAI OpenRouter Configuration
ZAI_API_KEY=your-zai-api-key-here
ZAI_BASE_URL=https://api.z.ai/api/coding/paas/v4

# Other configurations...
# QWEN_DEFAULT_AUTH_TYPE=zai-openrouter
```