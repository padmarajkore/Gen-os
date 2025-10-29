// This file now delegates to aiService.ts for multi-provider support
// Kept for backward compatibility with existing imports
export { generateAppSchema } from './aiService';
export type { AppSchema } from '../types';

// Legacy code below is kept for reference but not used
// The actual implementation is now in aiService.ts which supports both Gemini and NVIDIA

/*
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
13. { "type": "live-camera", "props": { "width": number, "height": number, "facingMode": "user" | "environment" } }
14. { "type": "audio-recorder", "props": { "maxDuration": number | null } }
15. { "type": "file-upload", "props": { "accept": string, "multiple": boolean } }
16. { "type": "location-display", "props": { "showMap": boolean } }
17. { "type": "system-info", "props": { "fields": Array<string> } }
18. { "type": "chart", "props": { "type": "pie" | "bar" | "line" | "scatter", "data": Array<{ "label": string, "value": number, "color"?: string }>, "title": string, "width"?: number, "height"?: number } }
19. { "type": "drawing-canvas", "props": { "width"?: number, "height"?: number, "backgroundColor"?: string } }
20. { "type": "calculator", "props": { "mode"?: "basic" | "scientific" } }
21. { "type": "text-editor", "props": { "placeholder"?: string, "initialContent"?: string, "features"?: Array<"bold" | "italic" | "underline" | "lists" | "links"> } }
22. { "type": "code-editor", "props": { "language"?: string, "theme"?: "dark" | "light", "initialCode"?: string } }
23. { "type": "gallery", "props": { "autoLoad"?: boolean, "columns"?: number } }
24. { "type": "video-player", "props": { "autoLoad"?: boolean, "controls"?: boolean } }
25. { "type": "enhanced-music-player", "props": { "autoLoad"?: boolean, "showPlaylist"?: boolean } }
26. { "type": "settings", "props": { "category"?: "general" | "paths" | "privacy" | "about" } }

Action types:
1. { "type": "generate", "prompt": string, "target": "self" | "new_window" }
   - Use placeholders like '{input-id}' in the prompt string. The application will substitute this with the value from the text input with the matching 'id'.
2. { "type": "capture_photo", "filename": string }
3. { "type": "start_recording", "filename": string }
4. { "type": "stop_recording" }
5. { "type": "select_files", "options": { "multiple": boolean, "accept": string } }
6. { "type": "get_location" }
7. { "type": "show_notification", "title": string, "body": string }
8. { "type": "save_to_system", "dataType": "email" | "contact" | "note" | "event", "data": any }

Stateful Applications with 'dataKey', 'contextData', and 'appData':
- If a user request implies state (e.g., "my calendar"), assign a 'dataKey'.
- When the user interacts, the app re-invokes you with the user's action prompt AND a 'contextData' object containing the current state from the database.
- You MUST use 'contextData' as the source of truth. The user's prompt is a modification to this data.
- Your response MUST include the complete, NEW state in the top-level 'appData' field. The UI you generate in 'components' must also reflect this new state. The application saves 'appData' to the database.

For data visualization requests, create chart components with sample data that demonstrates the requested visualization type. Use realistic sample data that matches the user's request context.

IMPORTANT: Use FUNCTIONAL components for real app functionality:

FOR DRAWING/PAINT APPS: Use "drawing-canvas" component - provides real drawing functionality with tools, colors, brush sizes
{ "type": "drawing-canvas", "props": { "width": 800, "height": 600, "backgroundColor": "#ffffff" } }

FOR CALCULATOR APPS: Use "calculator" component - provides real calculation functionality with number pad
{ "type": "calculator", "props": { "mode": "basic" } }

FOR TEXT EDITOR APPS: Use "text-editor" component - provides real text editing with formatting tools
{ "type": "text-editor", "props": { "placeholder": "Start writing...", "features": ["bold", "italic", "underline", "lists"] } }

FOR CODE EDITOR APPS: Use "code-editor" component - provides real code editing with syntax highlighting
{ "type": "code-editor", "props": { "language": "javascript", "theme": "dark", "initialCode": "// Start coding...\n" } }

FOR DATA VISUALIZATION: Use "chart" component with sample data
{ "type": "chart", "props": { "type": "pie", "data": [{"label": "Category A", "value": 30}, {"label": "Category B", "value": 25}, {"label": "Category C", "value": 45}], "title": "Sample Data Visualization" } }

FOR PHOTO GALLERY APPS: Use "gallery" component - provides real file system access to browse and view images
{ "type": "gallery", "props": { "autoLoad": true, "columns": 3 } }
The gallery will automatically prompt user to access their default photos folder on load

FOR MUSIC PLAYER APPS: Use "enhanced-music-player" component - provides real audio playback from local files
{ "type": "enhanced-music-player", "props": { "autoLoad": false, "showPlaylist": true } }

FOR VIDEO PLAYER APPS: Use "video-player" component - provides real video playback from local files
{ "type": "video-player", "props": { "autoLoad": false, "controls": true } }

FOR SETTINGS APPS: Use "settings" component - provides configuration interface for file paths and preferences
{ "type": "settings", "props": { "category": "general" } }

CRITICAL: All interactive elements MUST be functional and update the current app interface:
- When user clicks buttons (like "Add", "Calculate", "Save", etc.), generate a NEW complete app interface that shows the result
- When user clicks list items (emails, contacts, files, etc.), show detailed view of that item
- ALWAYS use "target": "self" for all actions to update the current app, NOT "new_window"
- Include the updated data/state in the new interface
- Show results, confirmations, or next steps in the updated interface
- Make every interactive element actually work and provide feedback

IMPORTANT: Make list items clickable with actions:
- Email items: action to "Show full email content for email with subject '{subject}'"
- Contact items: action to "Show contact details for {name}"
- File items: action to "Open file {filename}"
- Calendar events: action to "Show event details for {title}"
- Todo items: action to "Show task details for '{task}'" or "Mark '{task}' as complete"
- Any list item should have a click action to show more details

Example for clickable file list:
{ "type": "file-explorer", "props": { "files": [
  { "name": "document.pdf", "type": "file", "size": 2048, "action": { "type": "generate", "prompt": "Open and show contents of document.pdf", "target": "self" } },
  { "name": "photo.jpg", "type": "image", "url": "/images/photo.jpg", "action": { "type": "generate", "prompt": "Show full size view of photo.jpg", "target": "self" } }
]}}

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

---

Example: User clicks on email with subject "Project Update"
- Show full email content with sender, date, body
- Add Reply/Forward buttons
- Add "Back to Inbox" button to return to email list
- Keep the same email data but update the interface to show details

Generate the updated JSON schema for this app modification:`;
  }
  
  // Original format for new apps
  return `
Context Data (current state for this app, use this as the source of truth):
${contextData ? JSON.stringify(contextData, null, 2) : 'null'}

---

Example for a NEW "to-do list" request (no contextData):
{
  "appName": "To-Do List",
  "icon": "<svg>...</svg>",
  "layout": "list-view",
  "dataKey": "todo-list-items",
  "appData": ["Finish presentation", "Call mom", "Buy groceries"],
  "components": [
    { "type": "header", "props": { "title": "My To-Dos", "subtitle": "3 items" } },
    { "type": "paragraph", "props": { "text": "Finish presentation" } },
    { "type": "paragraph", "props": { "text": "Call mom" } },
    { "type": "paragraph", "props": { "text": "Buy groceries" } },
    { "type": "text-input", "props": { "id": "new-todo", "label": "New To-Do", "placeholder": "What needs to be done?" } },
    { "type": "button-group", "props": { "buttons": [
      { "label": "Add Item", "variant": "primary", "action": { "type": "generate", "prompt": "Add '{new-todo}' to my to-do list", "target": "self" } }
    ] } }
  ]
}

Example for adding a calendar event (WITH contextData):
- User Action Prompt: "Add 'Team meeting at 2pm on July 15 2024' to my calendar"
- contextData: [{ "date": "2024-07-10", "items": [{ "id": "1", "time": "10:00", "title": "Doctor's Appointment" }] }]
- Your response JSON:
{
  "appName": "Calendar",
  "icon": "<svg>...</svg>",
  "layout": "single-view",
  "dataKey": "calendar-events",
  "appData": [
    { "date": "2024-07-10", "items": [{ "id": "1", "time": "10:00", "title": "Doctor's Appointment" }] },
    { "date": "2024-07-15", "items": [{ "id": "2", "time": "14:00", "title": "Team meeting" }] }
  ],
  "components": [
    { "type": "header", "props": { "title": "Calendar", "subtitle": "July 2024" } },
    { "type": "calendar-view", "props": {
        "year": 2024, "month": 7,
        "events": [
            { "date": "2024-07-10", "items": [{ "id": "1", "time": "10:00", "title": "Doctor's Appointment" }] },
            { "date": "2024-07-15", "items": [{ "id": "2", "time": "14:00", "title": "Team meeting" }] }
        ]
    }},
    { "type": "header", "props": { "title": "Add New Event", "subtitle": null } },
    { "type": "text-input", "props": { "id": "event-title", "label": "Event Title", "placeholder": "e.g., Dentist appointment" } },
    { "type": "date-input", "props": { "id": "event-date", "label": "Date" } },
    { "type": "text-input", "props": { "id": "event-time", "label": "Time", "placeholder": "e.g., 3pm or 15:00" } },
    { "type": "button-group", "props": { "buttons": [
        { "label": "Add Event", "variant": "primary", "action": { "type": "generate", "prompt": "Add '{event-title}' at {event-time} on {event-date} to my calendar", "target": "self" } }
    ]}}
  ]
}

Example for clickable email list:
- Initial email list view should have clickable email items:
{
  "appName": "Inbox",
  "components": [
    { "type": "header", "props": { "title": "Inbox", "subtitle": "3 unread messages" } },
    { "type": "email-item", "props": { "id": 1, "from": "John Doe", "subject": "Project Update", "preview": "The quarterly report is ready...", "timestamp": "2 hours ago", "read": false, "action": { "type": "generate", "prompt": "Show full email content for email with subject 'Project Update'", "target": "self" } } },
    { "type": "email-item", "props": { "id": 2, "from": "Sarah Wilson", "subject": "Meeting Tomorrow", "preview": "Don't forget about our meeting...", "timestamp": "4 hours ago", "read": true, "action": { "type": "generate", "prompt": "Show full email content for email with subject 'Meeting Tomorrow'", "target": "self" } } }
  ]
}

- When user clicks on "Project Update" email, show detailed view:
{
  "appName": "Inbox",
  "components": [
    { "type": "header", "props": { "title": "Project Update", "subtitle": "From: John Doe" } },
    { "type": "paragraph", "props": { "text": "From: john.doe@company.com" } },
    { "type": "paragraph", "props": { "text": "To: me@company.com" } },
    { "type": "paragraph", "props": { "text": "Date: Today, 2:30 PM" } },
    { "type": "paragraph", "props": { "text": "Subject: Project Update" } },
    { "type": "paragraph", "props": { "text": "Hi there,\n\nThe quarterly report is ready for your review. I've attached the latest version with all the updated metrics and analysis.\n\nPlease let me know if you have any questions or need any changes.\n\nBest regards,\nJohn" } },
    { "type": "button-group", "props": { "buttons": [
      { "label": "Reply", "variant": "primary", "action": { "type": "generate", "prompt": "Compose reply to John Doe's email about Project Update", "target": "self" } },
      { "label": "Back to Inbox", "variant": "secondary", "action": { "type": "generate", "prompt": "Show my email inbox", "target": "self" } }
    ]}}
  ]
}

---

Now, generate the JSON for a user who wants to create an app for: "${userInput}"
`;
};

*/