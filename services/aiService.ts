import { GoogleGenAI } from "@google/genai";
import type { AppSchema } from '../types';
import apiConfig from './apiConfig';

// AI Provider Configuration
const AI_PROVIDER = import.meta.env.VITE_AI_PROVIDER || 'gemini';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
const NVIDIA_API_KEY = import.meta.env.VITE_NVIDIA_API_KEY;
const LM_STUDIO_API_BASE = import.meta.env.VITE_LM_STUDIO_API_BASE || 'http://localhost:1234';

console.log('AI Provider:', AI_PROVIDER);
console.log('Gemini API Key:', GEMINI_API_KEY ? 'Present' : 'Missing');
console.log('NVIDIA API Key:', NVIDIA_API_KEY ? 'Present' : 'Missing');
console.log('LM Studio API Base:', LM_STUDIO_API_BASE);

// Initialize Gemini
let geminiAI: GoogleGenAI | null = null;
if (GEMINI_API_KEY) {
  geminiAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

// System instruction for AI (same for both providers)
const systemInstruction = `You are an AI assistant that designs application UIs for a generative operating system. Your response must be a single, valid JSON object that conforms to the specified schema.

The JSON root structure:
{
  "appName": string,
  "icon": string, // An SVG string for the app icon. Use "currentColor" for fill/stroke.
  "layout": "single-view" | "list-view" | "grid-view",
  "components": Array<ComponentObject>,
  "dataKey": string | null, // A unique, kebab-case key if the app needs to persist data (e.g., 'calendar-events').
  "appData": any | null, // If the app is stateful, this field MUST contain the complete, updated data model.
  "hardwareAccess": Array<string> | null, // Hardware capabilities needed: ["camera", "microphone", "geolocation", "files", "notifications"]
  "systemIntegration": boolean // Whether this app integrates with system-wide data
}

ComponentObject types:
1. { "type": "header", "props": { "title": string, "subtitle": string | null } }
2. { "type": "email-item", "props": { ... } }
3. { "type": "weather-card", "props": { ... } }
4. { "type": "music-player", "props": { ... } }
5. { "type": "paragraph", "props": { "text": string } }
6. { "type": "button-group", "props": { "buttons": Array<{ "label": string, "variant": "primary" | "secondary", "action": Action | null }> } }
7. { "type": "camera-view", "props": { "prompt": string | null } }
8. { "type": "text-input", "props": { "id": string, "label": string, "placeholder": string | null } }
9. { "type": "date-input", "props": { "id": string, "label": string } }
10. { "type": "file-explorer", "props": { "files": Array<{ "name": string, "type": "image" | "file", "url": string | null }> } }
11. { "type": "event-item", "props": { "id": string, "time": string, "title": string } }
12. { "type": "calendar-view", "props": { "year": number, "month": number, "events": Array<{ "date": "YYYY-MM-DD", "items": Array<EventItemProps> }> } }
13. { "type": "audio-recorder", "props": { "maxDuration": number | null } }
14. { "type": "location-display", "props": { "showMap": boolean } }
15. { "type": "system-info", "props": { "fields": Array<string> } }
16. { "type": "chart", "props": { "type": "pie" | "bar" | "line" | "scatter", "data": Array<{ "label": string, "value": number, "color"?: string }>, "title": string, "width"?: number, "height"?: number } }
19. { "type": "drawing-canvas", "props": { "width"?: number, "height"?: number, "backgroundColor"?: string } }
20. { "type": "calculator", "props": { "mode"?: "basic" | "scientific" } }
21. { "type": "text-editor", "props": { "placeholder"?: string, "initialContent"?: string, "features"?: Array<"bold" | "italic" | "underline" | "lists" | "links"> } }
22. { "type": "code-editor", "props": { "language"?: string, "theme"?: "dark" | "light", "initialCode"?: string } }
23. { "type": "gallery", "props": { "autoLoad"?: boolean, "columns"?: number } }
24. { "type": "video-player", "props": { "autoLoad"?: boolean, "controls"?: boolean } }
25. { "type": "enhanced-music-player", "props": { "autoLoad"?: boolean, "showPlaylist"?: boolean } }
26. { "type": "settings", "props": { "category"?: "general" | "paths" | "privacy" | "about" } }
27. { "type": "web-browser", "props": { 
     "defaultUrl"?: string,
     "showAddressBar": boolean,
     "showControls": boolean,
     "allowNavigation": boolean,
     "sandboxed"?: boolean
   }}

28. { "type": "iframe-view", "props": {
     "url": string,
     "title"?: string,
     "width"?: number | string,
     "height"?: number | string,
     "sandbox"?: string // e.g., "allow-same-origin allow-scripts"
   }}

29. { "type": "url-input", "props": {
     "id": string,
     "label": string,
     "placeholder"?: string,
     "defaultValue"?: string
   }}

30. { "type": "tab-container", "props": {
     "tabs": Array<{
       "id": string,
       "label": string,
       "icon"?: string,
       "components": Array<ComponentObject>
     }>,
     "activeTab"?: string
   }}

31. { "type": "terminal", "props": {
     "readOnly"?: boolean,
     "theme"?: "dark" | "light",
     "prompt"?: string
   }}

32. { "type": "markdown-viewer", "props": {
     "content": string,
     "enableHtml"?: boolean
   }}

33. { "type": "pdf-viewer", "props": {
     "url"?: string,
     "autoLoad"?: boolean
   }}

34. { "type": "split-view", "props": {
     "orientation": "horizontal" | "vertical",
     "leftComponents": Array<ComponentObject>,
     "rightComponents": Array<ComponentObject>,
     "defaultSplit"?: number // percentage
   }}


Action types:
1. { "type": "generate", "prompt": string, "target": "self" | "new_window" }
   - Use placeholders like '{input-id}' in the prompt string. The application will substitute this with the value from the text input with the matching 'id'.
2. { "type": "capture_photo", "filename": string }
3. { "type": "capture_video", "filename": string, "mimeType"?: string }
4. { "type": "select_files", "options": { "multiple": boolean, "accept": string } }
5. { "type": "get_location" }
6. { "type": "show_notification", "title": string, "body": string }
7. { "type": "save_to_system", "dataType": "email" | "contact" | "note" | "event", "data": any }
8. { "type": "navigate_url", "url": string }
9. { "type": "open_tab", "url": string }
10. { "type": "close_tab", "tabId": string }
11. { "type": "download_file", "url": string, "filename": string }
12. { "type": "execute_command", "command": string }

For camera functionality always use "camera-view". Do NOT use "live-camera".
For video capture, trigger the "capture_video" action. Do NOT use "start_recording" or "stop_recording".
For file uploads, render buttons (e.g. in "button-group") that trigger the "select_files" action instead of using a "file-upload" component.


CRITICAL: All interactive elements MUST be functional and update the current app interface:
- When user clicks buttons, generate a NEW complete app interface that shows the result
- When user clicks list items (emails, contacts, files, etc.), show detailed view of that item
- ALWAYS use "target": "self" for all actions to update the current app, NOT "new_window"
- Include the updated data/state in the new interface
- Show results, confirmations, or next steps in the updated interface
- Make every interactive element actually work and provide feedback

IMPORTANT: Use FUNCTIONAL components for real app functionality:
- FOR DRAWING/PAINT APPS: Use "drawing-canvas" component
- FOR CALCULATOR APPS: Use "calculator" component
- FOR TEXT EDITOR APPS: Use "text-editor" component
- FOR CODE EDITOR APPS: Use "code-editor" component
- FOR PHOTO GALLERY APPS: Use "gallery" component
- FOR MUSIC PLAYER APPS: Use "enhanced-music-player" component
- FOR VIDEO PLAYER APPS: Use "video-player" component
- FOR SETTINGS APPS: Use "settings" component

EXPANDED CAPABILITIES:
- Create ANY desktop application type: browsers, terminals, document viewers, media editors, etc.
- Support real web content through iframe-view and web-browser components
- Enable multi-tab interfaces for complex applications
- Support split-view layouts for productivity apps
- Include terminal emulation for command-line interfaces

FOR WEB BROWSER APPS:
- Use "web-browser" component for full browser functionality
- Include navigation controls (back, forward, refresh, home)
- Use "url-input" for address bar functionality
- Support bookmarks and history as part of appData
- Use "tab-container" for multi-tab browsing
- Set proper sandbox attributes for security
`;

const generateAppPrompt = (userInput: string, contextData?: any) => {
  // Handle enhanced context with current app state
  if (contextData && contextData.currentApp) {
    return `
CURRENT APP STATE (use this as the foundation for updates):
App Name: ${contextData.currentApp.appName}
Current Components: ${JSON.stringify(contextData.currentApp.components, null, 2)}
Current Data: ${JSON.stringify(contextData.currentApp.appData, null, 2)}
Data Key: ${contextData.currentApp.dataKey || 'null'}

STORED DATA (from database):
${contextData.storedData ? JSON.stringify(contextData.storedData, null, 2) : 'null'}

USER ACTION: ${contextData.userAction}

INSTRUCTIONS: 
- You are UPDATING an existing app, not creating a new one
- Keep the same appName unless specifically requested to change it
- Maintain existing data and add/modify based on the user action
- If user clicked on a list item (email, contact, file, etc.), show detailed view of that specific item
- Include navigation back to the main view (like "Back to Inbox" button)
- Preserve the app's core functionality while showing the requested detail/action

Generate the updated JSON schema for this app modification:`;
  }
  
  // Original format for new apps
  return `
Context Data (current state for this app, use this as the source of truth):
${contextData ? JSON.stringify(contextData, null, 2) : 'null'}

Now, generate the JSON for a user who wants to create an app for: "${userInput}"

IMPORTANT: Respond with ONLY valid JSON, no markdown, no code blocks, no explanations.`;
};

// NVIDIA Llama API call using OpenAI SDK
async function callNvidiaAPI(prompt: string, systemInstr: string): Promise<string> {
  if (!NVIDIA_API_KEY) {
    throw new Error('NVIDIA API key not configured');
  }

  const requestBody = {
    // model: 'nvidia/llama-3.3-nemotron-super-49b-v1.5',
    model: 'qwen/qwen3-next-80b-a3b-instruct',
    messages: [
      { role: 'system', content: systemInstr },
      { role: 'user', content: prompt }
    ],
    temperature: 0.6,
    top_p: 0.95,
    max_tokens: 65536,
    frequency_penalty: 0,
    presence_penalty: 0,
    stream: false,
  };

  const tryRequest = async (url: string, headers: Record<string, string>) => {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NVIDIA API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(`NVIDIA proxy error: ${data.error}`);
    }

    const content = data.choices[0]?.message?.content || '';
    
    // Clean up the response - remove markdown code blocks if present
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    return cleanContent;
  };

  try {
    // First try proxy (handles CORS in dev)
    const proxyUrl = apiConfig.NVIDIA_PROXY?.trim();
    if (proxyUrl) {
      return await tryRequest(proxyUrl, {
        'Content-Type': 'application/json',
      });
    }

    // Fallback to direct call if proxy is not configured
    return await tryRequest('https://integrate.api.nvidia.com/v1/chat/completions', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
    });
  } catch (error) {
    console.error('NVIDIA API call failed:', error);

    // If proxy failed and we haven't tried direct call yet, attempt direct call as fallback
    if (apiConfig.NVIDIA_PROXY && typeof window !== 'undefined') {
      try {
        console.warn('Retrying NVIDIA request without proxy...');
        return await tryRequest('https://integrate.api.nvidia.com/v1/chat/completions', {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${NVIDIA_API_KEY}`,
        });
      } catch (fallbackError) {
        console.error('Direct NVIDIA call also failed:', fallbackError);
        throw fallbackError;
      }
    }

    throw error;
  }
}

// LM Studio API call
async function callLMStudioAPI(prompt: string, systemInstr: string): Promise<string> {
  try {
    const url = `${LM_STUDIO_API_BASE}/v1/chat/completions`;
    const requestBody = {
      model: import.meta.env.VITE_LM_STUDIO_MODEL || 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: systemInstr },
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,
      max_tokens: 8192,
      stream: false
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LM Studio API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    return cleanContent;
  } catch (error) {
    console.error('LM Studio API call failed:', error);
    throw error;
  }
}

// Gemini API call
async function callGeminiAPI(prompt: string, systemInstr: string): Promise<string> {
  if (!geminiAI || !GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  try {
    const response = await geminiAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstr,
        responseMimeType: "application/json",
      },
    });

    return response.text;
  } catch (error) {
    console.error('Gemini API call failed:', error);
    throw error;
  }
}

// Main function to generate app schema
export const generateAppSchema = async (userInput: string, contextData?: any): Promise<AppSchema> => {
  const provider = AI_PROVIDER.toLowerCase();
  
  // Check if any API key is available
  if (!GEMINI_API_KEY && !NVIDIA_API_KEY) {
    console.warn('No API keys configured. Returning mock data.');
    return getMockSchema();
  }

  let text: string;
  try {
    console.log(`Calling ${provider.toUpperCase()} API with prompt:`, userInput);
    const prompt = generateAppPrompt(userInput, contextData);
    
    // Call the appropriate API based on provider
    if (provider === 'nvidia' && NVIDIA_API_KEY) {
      text = await callNvidiaAPI(prompt, systemInstruction);
    } else if (provider === 'gemini' && GEMINI_API_KEY) {
      text = await callGeminiAPI(prompt, systemInstruction);
    } else if (provider === 'lmstudio') {
      text = await callLMStudioAPI(prompt, systemInstruction);
    } else {
      // Fallback: try Gemini first, then NVIDIA
      if (GEMINI_API_KEY) {
        console.log('Configured provider not available, falling back to Gemini');
        text = await callGeminiAPI(prompt, systemInstruction);
      } else if (NVIDIA_API_KEY) {
        console.log('Configured provider not available, falling back to NVIDIA');
        text = await callNvidiaAPI(prompt, systemInstruction);
      } else if (provider === 'lmstudio') {
        text = await callLMStudioAPI(prompt, systemInstruction);
      } else {
        throw new Error('No API provider available');
      }
    }

    console.log('AI API response received, length:', text?.length || 0);
    const schema = JSON.parse(text);
    console.log('Successfully parsed schema:', schema.appName);
    return schema as AppSchema;
  } catch (error) {
    console.error("Error generating app schema:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      provider: provider,
    });
    
    if (error instanceof SyntaxError) {
      console.error("Invalid JSON response from AI:", text!);
      throw new Error("Failed to parse the AI's response. The response was not valid JSON.");
    }
    
    throw new Error(`An error occurred while communicating with ${provider.toUpperCase()}. Please check the console for details.`);
  }
};

// Mock schema for when no API key is available
function getMockSchema(): AppSchema {
  return {
    appName: "Mock Inbox",
    icon: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z'></path><polyline points='22,6 12,13 2,6'></polyline></svg>`,
    layout: "list-view",
    components: [
      { type: "header", props: { title: "Mock Inbox (No API Key)", subtitle: "This is mock data." } },
      { type: "email-item", props: { id: 1, from: "System", subject: "API Key Missing", preview: "Please provide a valid API key to generate live UIs.", timestamp: "Now", read: false } },
    ]
  };
}
