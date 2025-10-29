# GenerativeOS - AI Provider Configuration

## Overview
GenerativeOS now supports multiple AI providers for generating application schemas. You can choose between **Google Gemini** and **NVIDIA Llama** models.

## Supported Providers

### 1. Google Gemini (Default)
- **Model**: `gemini-2.0-flash`
- **Provider**: Google AI
- **Features**: Fast, reliable, JSON mode support
- **Best for**: General purpose app generation

### 2. NVIDIA Llama
- **Model**: `nvidia/llama-3.3-nemotron-super-49b-v1.5`
- **Provider**: NVIDIA AI
- **Features**: Powerful reasoning, large context window
- **Best for**: Complex applications, detailed requirements

## Configuration

### Environment Variables

Edit your `.env` file to configure the AI provider:

```env
# AI Provider Configuration
# Choose: 'gemini' or 'nvidia'
VITE_AI_PROVIDER=gemini

# Gemini API Key (Google AI)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# NVIDIA API Key (for Llama model)
VITE_NVIDIA_API_KEY=your_nvidia_api_key_here
```

### Switching Providers

To switch between providers, simply change the `VITE_AI_PROVIDER` value:

**Use Gemini:**
```env
VITE_AI_PROVIDER=gemini
```

**Use NVIDIA Llama:**
```env
VITE_AI_PROVIDER=nvidia
```

After changing the provider, restart your development server:
```bash
npm run dev
```

## Getting API Keys

### Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key"
4. Copy the API key
5. Add it to your `.env` file as `VITE_GEMINI_API_KEY`

### NVIDIA API Key

1. Visit [NVIDIA AI](https://build.nvidia.com/)
2. Sign up or log in
3. Navigate to your API keys section
4. Generate a new API key
5. Copy the API key (starts with `nvapi-`)
6. Add it to your `.env` file as `VITE_NVIDIA_API_KEY`

## API Provider Details

### Gemini Configuration

```typescript
Model: 'gemini-2.0-flash'
Response Format: JSON
System Instruction: Enabled
Temperature: Default
Max Tokens: Default
```

### NVIDIA Llama Configuration

```typescript
Model: 'nvidia/llama-3.3-nemotron-super-49b-v1.5'
Temperature: 0.6
Top P: 0.95
Max Tokens: 65536
Frequency Penalty: 0
Presence Penalty: 0
Stream: false
```

## Fallback Behavior

The system implements intelligent fallback:

1. **Primary**: Uses the provider specified in `VITE_AI_PROVIDER`
2. **Fallback 1**: If primary provider fails, tries Gemini (if key available)
3. **Fallback 2**: If Gemini unavailable, tries NVIDIA (if key available)
4. **Fallback 3**: If no providers available, returns mock data

## Code Architecture

### Files

- **`aiService.ts`**: Main AI service supporting multiple providers
- **`geminiService.ts`**: Backward compatibility wrapper (delegates to aiService)

### Key Functions

```typescript
// Main function - automatically selects provider
export const generateAppSchema = async (
  userInput: string, 
  contextData?: any
): Promise<AppSchema>

// Provider-specific functions (internal)
async function callGeminiAPI(prompt: string, systemInstr: string): Promise<string>
async function callNvidiaAPI(prompt: string, systemInstr: string): Promise<string>
```

## Usage Examples

### Basic Usage (No Code Changes Required)

The system automatically uses the configured provider:

```typescript
import { generateAppSchema } from './services/geminiService';

// This will use whichever provider is configured in .env
const schema = await generateAppSchema("Create a todo list app");
```

### Checking Current Provider

The console will log which provider is being used:

```
AI Provider: gemini
Gemini API Key: Present
NVIDIA API Key: Present
Calling GEMINI API with prompt: Create a todo list app
```

## Testing Different Providers

### Test with Gemini

1. Set `VITE_AI_PROVIDER=gemini` in `.env`
2. Restart dev server
3. Create an app: "Create a calculator"
4. Check console for "Calling GEMINI API"

### Test with NVIDIA

1. Set `VITE_AI_PROVIDER=nvidia` in `.env`
2. Restart dev server
3. Create an app: "Create a calculator"
4. Check console for "Calling NVIDIA API"

## Performance Comparison

| Feature | Gemini | NVIDIA Llama |
|---------|--------|--------------|
| Speed | ⚡⚡⚡ Fast | ⚡⚡ Moderate |
| Accuracy | ⭐⭐⭐⭐ High | ⭐⭐⭐⭐⭐ Very High |
| JSON Support | Native | Post-processing |
| Context Window | Large | Very Large (65K tokens) |
| Cost | Free tier available | Pay per use |
| Reasoning | Good | Excellent |

## Troubleshooting

### Provider Not Working

**Check API Key:**
```bash
# In your terminal
cat .env | grep VITE_AI_PROVIDER
cat .env | grep VITE_GEMINI_API_KEY
cat .env | grep VITE_NVIDIA_API_KEY
```

**Check Console Logs:**
- Look for "AI Provider: [provider name]"
- Look for "API Key: Present" or "Missing"
- Check for error messages

### Invalid JSON Response

**Gemini**: Usually returns valid JSON due to native JSON mode

**NVIDIA**: May occasionally include markdown formatting
- The service automatically cleans up markdown code blocks
- If issues persist, the system will fall back to Gemini

### Rate Limiting

**Gemini**: 
- Free tier: 60 requests per minute
- Paid tier: Higher limits

**NVIDIA**:
- Check your account limits
- Implement retry logic if needed

## Best Practices

### 1. Use Gemini for Development
- Faster responses
- Native JSON support
- Free tier available

### 2. Use NVIDIA for Production
- Better reasoning for complex apps
- More consistent results
- Larger context window

### 3. Keep Both Keys Configured
- Automatic fallback if one provider fails
- Easy switching between providers
- Testing and comparison

### 4. Monitor Console Logs
- Track which provider is being used
- Identify errors early
- Optimize based on performance

## Advanced Configuration

### Custom Provider Selection

You can programmatically override the provider by modifying `aiService.ts`:

```typescript
// Force a specific provider
const FORCE_PROVIDER = 'nvidia'; // or 'gemini'

// In generateAppSchema function
const provider = FORCE_PROVIDER || AI_PROVIDER.toLowerCase();
```

### Adding New Providers

To add support for additional AI providers:

1. Add API key to `.env`
2. Create a new `call[Provider]API` function in `aiService.ts`
3. Add provider case in `generateAppSchema` function
4. Update documentation

Example structure:
```typescript
async function callNewProviderAPI(prompt: string, systemInstr: string): Promise<string> {
  // Implementation
}

// In generateAppSchema
if (provider === 'newprovider' && NEW_PROVIDER_API_KEY) {
  text = await callNewProviderAPI(prompt, systemInstruction);
}
```

## Migration Guide

### From Old Gemini-Only Setup

No code changes required! The new system is backward compatible:

**Old code (still works):**
```typescript
import { generateAppSchema } from './services/geminiService';
```

**New code (same result):**
```typescript
import { generateAppSchema } from './services/aiService';
```

Both imports work identically. The `geminiService.ts` now delegates to `aiService.ts`.

## Security Notes

### API Key Safety

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate keys regularly** for production use
4. **Limit key permissions** where possible

### .env File

Add to `.gitignore`:
```
.env
.env.local
.env.*.local
```

### Production Deployment

For production, use secure environment variable management:
- Vercel: Environment Variables in dashboard
- Netlify: Site settings > Environment variables
- Docker: Use secrets management
- AWS: Use Parameter Store or Secrets Manager

## Future Enhancements

Planned features:
- [ ] Streaming responses for real-time UI generation
- [ ] Provider performance metrics
- [ ] Automatic provider selection based on request type
- [ ] Caching layer for common requests
- [ ] A/B testing between providers
- [ ] Cost tracking per provider
- [ ] Custom model selection per provider

## Support

### Issues with Gemini
- Check [Google AI Studio](https://makersuite.google.com/)
- Review [Gemini API docs](https://ai.google.dev/docs)

### Issues with NVIDIA
- Check [NVIDIA AI Platform](https://build.nvidia.com/)
- Review [NVIDIA API docs](https://docs.api.nvidia.com/)

### GenerativeOS Issues
- Check console logs
- Review this documentation
- Test with mock data (no API keys)

## Summary

GenerativeOS now supports multiple AI providers with:
- ✅ Easy configuration via environment variables
- ✅ Automatic fallback between providers
- ✅ Backward compatibility with existing code
- ✅ Provider-specific optimizations
- ✅ Comprehensive error handling
- ✅ Production-ready architecture

Choose the provider that best fits your needs, or keep both configured for maximum reliability!
