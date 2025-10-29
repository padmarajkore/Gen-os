# Quick Setup: Multi-AI Provider Support

## What's New?

GenerativeOS now supports **two AI providers**:
1. **Google Gemini** (default) - Fast and reliable
2. **NVIDIA Llama** - Powerful reasoning model

## Quick Start

### 1. Update Your `.env` File

Your `.env` now has these new variables:

```env
# Choose your provider: 'gemini' or 'nvidia'
VITE_AI_PROVIDER=gemini

# Gemini API Key
VITE_GEMINI_API_KEY=AIzaSyAvOsExE9lmiA6CbH5DThFPR3UR_NDJ2SQ

# NVIDIA API Key  
VITE_NVIDIA_API_KEY=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
```

### 2. Switch Providers Anytime

**To use Gemini:**
```env
VITE_AI_PROVIDER=gemini
```

**To use NVIDIA Llama:**
```env
VITE_AI_PROVIDER=nvidia
```

Then restart your dev server:
```bash
npm run dev
```

### 3. That's It!

No code changes needed. The system automatically uses your chosen provider.

## How It Works

```
User Input → aiService.ts → [Gemini OR NVIDIA] → App Schema → UI Rendered
```

### Files Changed

1. **New**: `services/aiService.ts` - Multi-provider support
2. **Updated**: `services/geminiService.ts` - Now delegates to aiService
3. **Updated**: `.env` - New provider configuration

### Backward Compatible

Your existing code still works:
```typescript
import { generateAppSchema } from './services/geminiService';
// ✅ Still works! Now supports both providers
```

## Provider Comparison

| Feature | Gemini | NVIDIA |
|---------|--------|--------|
| Speed | ⚡⚡⚡ | ⚡⚡ |
| Quality | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| JSON Support | Native | Cleaned |
| Context | Large | Huge (65K) |

## Testing

### Test Gemini
```bash
# In .env
VITE_AI_PROVIDER=gemini

# Restart and create an app
npm run dev
```

### Test NVIDIA
```bash
# In .env
VITE_AI_PROVIDER=nvidia

# Restart and create an app
npm run dev
```

Check the console - you'll see which provider is being used:
```
AI Provider: gemini
Calling GEMINI API with prompt: ...
```

## Fallback System

Smart fallback if your chosen provider fails:
1. Try configured provider
2. Fall back to Gemini (if available)
3. Fall back to NVIDIA (if available)
4. Show mock data (if no keys)

## Get API Keys

### Gemini (Free)
1. Go to: https://makersuite.google.com/app/apikey
2. Get your free API key
3. Add to `.env` as `VITE_GEMINI_API_KEY`

### NVIDIA
1. Go to: https://build.nvidia.com/
2. Sign up and get API key
3. Add to `.env` as `VITE_NVIDIA_API_KEY`

## Recommendations

**For Development:**
- Use Gemini (faster, free tier)

**For Production:**
- Use NVIDIA (better quality, more reliable)

**Best Practice:**
- Configure both keys for automatic fallback

## Console Output

You'll see helpful logs:
```
AI Provider: gemini
Gemini API Key: Present
NVIDIA API Key: Present
Calling GEMINI API with prompt: Create a todo list
AI API response received, length: 1234
Successfully parsed schema: To-Do List
```

## Troubleshooting

**Provider not working?**
1. Check API key is correct in `.env`
2. Restart dev server after changing `.env`
3. Check console for error messages

**Want to test without API keys?**
- Remove all API keys from `.env`
- System will show mock data

## Summary

✅ **Two AI providers** supported
✅ **Easy switching** via environment variable
✅ **Automatic fallback** if provider fails
✅ **No code changes** required
✅ **Backward compatible** with existing code
✅ **Production ready** architecture

Enjoy the flexibility of choosing the best AI provider for your needs! 🚀
