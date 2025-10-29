
# GenerativeOS

https://github.com/user-attachments/assets/97645c72-e329-4624-afd1-328f10677ecb

A revolutionary operating system concept where applications are generated on-demand by AI based on user needs. No pre-installed apps - everything is created dynamically as you need it.

## 🌟 Key Features

### Core Functionality
- **Dynamic Application Generation**: AI creates apps in real-time based on natural language requests
- **Persistent Data Storage**: Enhanced IndexedDB schema for structured data (emails, contacts, notes, files, etc.)
- **Window Management**: Multi-window interface with drag-and-drop, focus management, and z-indexing
- **Context-Aware Regeneration**: Apps can reference and modify existing data

### Hardware Integration
- **Camera Access**: Take photos, live camera feeds with different facing modes
- **Audio Recording**: Record audio with duration controls and automatic saving
- **File System**: Upload, download, and manage files with drag-and-drop support
- **Geolocation**: Get current location with accuracy information
- **Notifications**: System-wide notification support
- **System Information**: Access device and browser capabilities

### Advanced Features
- **System-Wide Search**: Search across all your data (apps, emails, notes, contacts, files)
- **App Registry**: Track all generated applications with usage analytics
- **Data Relationships**: Apps can share and reference data from other apps
- **Hardware Permissions**: Smart permission management for device features

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- A Google Gemini API key

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd generative-os
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   # Create .env file
   echo "API_KEY=your_gemini_api_key_here" > .env
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173`

## 💡 How to Use

### Basic Usage
1. **Start with examples**: When you first open GenerativeOS, you'll see categorized example prompts
2. **Type your request**: Use natural language to describe what you want (e.g., "Create a todo list with priorities")
3. **Interact with generated apps**: Each app is fully functional with its own UI and data
4. **Search your data**: Use the search bar (appears after creating apps) to find anything across your system

### Desktop (Electron) Build
1. **Install dependencies** (only needed once):
   ```bash
   npm install
   ```
2. **Run the desktop preview** (launches Vite + Electron together):
   ```bash
   npm run dev:desktop
   ```
3. **Create a macOS `.app` / `.dmg` build**:
   ```bash
   npm run build:desktop
   ```
   The packaged artifacts will be available inside the `out/` directory.
4. **Need a raw package without DMG?**
   ```bash
   npm run package:desktop
   ```
   This produces the unpackaged Electron bundle for manual distribution or signing.

### Example Prompts

**Communication:**
- "Create an email composer with rich text editing"
- "Show my inbox with unread messages"
- "Create a contact manager with search"

**Productivity:**
- "Create a calendar with today's events"
- "Build a to-do list with drag-and-drop"
- "Create a note-taking app with tags"

**Media & Hardware:**
- "Open camera to take photos"
- "Create an audio recorder with playback"
- "Build a file manager with upload"
- "Show my current location on a map"

**Advanced:**
- "Create a dashboard showing my app usage stats"
- "Build a data visualization of my notes by tags"
- "Create a photo gallery from my camera captures"

## 🏗️ Architecture

### Core Components

```
src/
├── App.tsx                 # Main OS interface with window management
├── types.ts               # TypeScript definitions for all components
├── services/
│   ├── geminiService.ts      # AI-powered app schema generation
│   ├── databaseService.ts    # Legacy key-value storage (backward compatibility)
│   ├── enhancedDatabaseService.ts  # Structured data storage with schemas
│   └── hardwareService.ts    # Hardware access layer
├── components/
│   ├── Window.tsx           # Windowed app container with action handling
│   ├── Dock.tsx            # Bottom dock with input and controls
│   ├── AppUI.tsx           # Dynamic UI component renderers
│   ├── DynamicRenderer.tsx  # Component mapping and rendering
│   ├── HardwareComponents.tsx  # Camera, audio, file, location components
│   ├── SystemSearch.tsx     # System-wide search interface
│   └── ExamplePrompts.tsx   # Categorized example prompts
```

### Data Flow

1. **User Input** → Natural language prompt
2. **AI Processing** → Gemini generates AppSchema with components and data
3. **App Creation** → Schema converted to React components
4. **Data Storage** → App data stored in structured IndexedDB
5. **Hardware Integration** → Components can access device capabilities
6. **Context Awareness** → Future apps can reference existing data

### Database Schema

The enhanced database includes structured storage for:
- **App Registry**: Metadata about all generated applications
- **Emails**: Full email data with folders, attachments, read status
- **Calendar Events**: Events with recurrence, reminders, attendees
- **Notes**: Rich notes with tags, folders, pinning
- **Contacts**: Contact information with search indexing
- **Files**: File storage with metadata, tags, thumbnails
- **System Settings**: OS-level configuration
- **App Data**: Generic storage for app-specific data

## 🔧 Technical Details

### Tech Stack
- **Frontend**: React 19 + TypeScript + Vite
- **AI**: Google Gemini 2.5 Flash
- **Database**: IndexedDB via `idb` library
- **Styling**: Tailwind CSS (via classes)
- **Hardware**: Web APIs (Camera, Microphone, Geolocation, File System)

### Component System
The OS uses a dynamic component system where the AI generates JSON schemas that map to React components:

```typescript
interface AppSchema {
  appName: string;
  icon: string; // SVG string
  layout: 'single-view' | 'list-view' | 'grid-view';
  components: UIComponent[];
  dataKey?: string; // For persistent data
  appData?: any; // Initial data
  hardwareAccess?: string[]; // Required permissions
  systemIntegration?: boolean; // System data access
}
```

### Hardware Integration
Hardware access is managed through a unified service:

```typescript
// Camera
const photo = await hardwareService.capturePhoto();
const stream = await hardwareService.startCamera();

// Audio
await hardwareService.startAudioRecording();
const recording = await hardwareService.stopAudioRecording();

// Files
const files = await hardwareService.selectFiles({ multiple: true });

// Location
const location = await hardwareService.getCurrentLocation();

// Notifications
await hardwareService.showNotification(title, { body });
```

## 🎯 Advanced Usage

### Creating Stateful Applications
Apps can maintain state across sessions:

```
"Create a habit tracker that saves my daily progress"
```

This generates an app with:
- `dataKey`: "habit-tracker-data"
- `appData`: Initial habit structure
- Persistent storage in IndexedDB
- Context-aware updates

### Hardware-Enabled Applications
Request hardware features directly:

```
"Create a document scanner using the camera"
```

This generates an app with:
- `hardwareAccess`: ["camera"]
- Live camera component
- Photo capture functionality
- File saving integration

### Cross-App Data Sharing
Apps can reference data from other apps:

```
"Show a dashboard of all my notes and emails"
```

The AI will:
- Query existing data from structured storage
- Create visualizations
- Enable cross-referencing

## 🔒 Privacy & Security

- **Local-First**: All data stored locally in IndexedDB
- **Hardware Permissions**: Explicit permission requests for device access
- **API Key Security**: Gemini API key stored in environment variables
- **No Data Transmission**: Generated apps and user data never leave your device

## 🚧 Limitations & Future Improvements

### Current Limitations
- Requires internet connection for AI generation (first-time only)
- Limited to web platform capabilities
- Single-user system

### Planned Enhancements
- Offline AI model support
- Multi-user capabilities
- Plugin system for external integrations
- Advanced security sandbox
- Mobile app version
- Cloud sync options

## 🤝 Contributing

This is a proof-of-concept demonstrating the future of generative operating systems. Contributions welcome!

### Development Setup
```bash
npm install
npm run dev
```

### Key Areas for Contribution
- New UI components 


or the dynamic renderer
- Enhanced hardware integrations
- Performance optimizations
- Security improvements
- Mobile compatibility

## 📄 License

MIT License - See LICENSE file for details

---

**GenerativeOS** - *The OS that builds itself* 🚀
