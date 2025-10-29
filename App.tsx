import React, { useState, useCallback, useEffect } from 'react';
import type { GeneratedApp, AppSchema, FileItemProps } from './types';
import { generateAppSchema } from './services/geminiService';
import { dbService } from './services/databaseService';
import { enhancedDbService } from './services/enhancedDatabaseService';
import { hardwareService } from './services/hardwareService';
import Window from './components/Window';
import Dock from './components/Dock';
import ExamplePrompts from './components/ExamplePrompts';

const APP_STORAGE_KEY = 'generative-os-apps';

const App: React.FC = () => {
  const [apps, setApps] = useState<GeneratedApp[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [zIndexCounter, setZIndexCounter] = useState<number>(10);
  const [showExamples, setShowExamples] = useState<boolean>(true);

  useEffect(() => {
    try {
      const storedApps = localStorage.getItem(APP_STORAGE_KEY);
      if (storedApps) {
        const parsedApps: GeneratedApp[] = JSON.parse(storedApps);
        setApps(parsedApps);
        const maxZ = Math.max(...parsedApps.map(a => a.zIndex), 0);
        setZIndexCounter(maxZ + 1);
      }
    } catch (e) {
      console.error("Failed to load apps from storage", e);
      setApps([]);
    }
  }, []);

  useEffect(() => {
    try {
        localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(apps));
    } catch (e) {
        console.error("Failed to save apps to storage", e);
    }
  }, [apps]);

  const createNewApp = useCallback(async (schema: AppSchema) => {
      try {
        console.log('createNewApp called with schema:', schema.appName);
        const newZ = zIndexCounter + 1;
        setZIndexCounter(newZ);

        const appId = `app_${Date.now()}`;
        const newApp: GeneratedApp = {
          ...schema,
          id: Date.now(),
          position: { x: Math.random() * 300 + 50, y: Math.random() * 100 + 50 },
          zIndex: newZ,
        };
        
        console.log('New app object created:', newApp);

        // Add app to state first (so it appears immediately)
        setApps(prevApps => [...prevApps, newApp]);
        console.log('App added to state successfully');
        
        // Register the app in the enhanced database (non-blocking)
        enhancedDbService.registerApp(
          appId,
          schema.appName,
          schema,
          schema.dataKey ? [schema.dataKey] : [],
          ['user-generated']
        ).then(() => {
          console.log('App registered successfully in database');
          
          // If the app has data, store it
          if (schema.dataKey && schema.appData) {
            return enhancedDbService.setAppData(schema.dataKey, appId, schema.appData);
          }
        }).then(() => {
          console.log('App data stored successfully');
        }).catch(error => {
          console.error('Failed to register app in database:', error);
          // App will still work without database
        });
      } catch (error) {
        console.error('Error in createNewApp:', error);
        throw error;
      }
  }, [zIndexCounter]);

  const handleGenerateApp = useCallback(async () => {
    console.log('handleGenerateApp called with input:', userInput);
    if (!userInput.trim()) {
      console.log('No input provided, returning');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
        let contextData = null;
        let schema: AppSchema;

        const lowerCaseInput = userInput.toLowerCase();

        // Special handling for file explorer
        if (lowerCaseInput.includes('files') || lowerCaseInput.includes('explorer')) {
            const allKeys = await dbService.keys();
            const imageKeys = allKeys.filter(k => k.endsWith('.jpeg'));
            const files: FileItemProps[] = await Promise.all(
                imageKeys.map(async key => {
                    const blob = await dbService.get<Blob>(key);
                    return {
                        name: key,
                        type: 'image',
                        url: blob ? URL.createObjectURL(blob) : undefined
                    };
                })
            );
             schema = {
                appName: "File Explorer",
                icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
                layout: "grid-view",
                components: [
                    { type: 'header', props: { title: 'My Files', subtitle: `${files.length} items` } },
                    { type: 'file-explorer', props: { files } }
                ]
            };
        } else {
            // New dynamic context-finding logic
            let matchedDataKey: string | null = null;
            
            // Iterate through all previously generated apps (from localStorage state)
            // to find a potential match based on appName.
            for (const app of apps) {
                if (app.dataKey) {
                    const appNameLower = app.appName.toLowerCase();
                    // A simple but effective heuristic: if the user's prompt includes the name of a stateful app
                    // they've created before, we assume they want to interact with that app's data.
                    if (lowerCaseInput.includes(appNameLower)) {
                        matchedDataKey = app.dataKey;
                        break; // Found a good match, no need to search further.
                    }
                }
            }
            
            if (matchedDataKey) {
                contextData = await dbService.get(matchedDataKey);
            }
            
            schema = await generateAppSchema(userInput, contextData);
        }

      console.log('Generated schema:', schema);
      console.log('About to create new app...');
      await createNewApp(schema);
      console.log('App created successfully');
      setUserInput('');
      setShowExamples(false);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unknown error occurred.');
      }
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoading(false);
    }
  }, [userInput, apps, createNewApp]);

  const handleCloseApp = useCallback((id: number) => {
    setApps(prevApps => prevApps.filter(app => app.id !== id));
  }, []);

  const handleBringToFront = useCallback((id: number) => {
    const app = apps.find(a => a.id === id);
    // Only update if it's not already the top-most window
    if (app && app.zIndex < zIndexCounter) {
        const newZ = zIndexCounter + 1;
        setZIndexCounter(newZ);
        setApps(prevApps =>
            prevApps.map(a => (a.id === id ? { ...a, zIndex: newZ } : a))
        );
    }
  }, [apps, zIndexCounter]);

  const handleUpdateApp = useCallback((id: number, updates: Partial<GeneratedApp>) => {
      setApps(prevApps => prevApps.map(app => app.id === id ? { ...app, ...updates } : app));
  }, []);

  const handlePromptSelect = useCallback((prompt: string) => {
    setUserInput(prompt);
    setShowExamples(false);
  }, []);


  return (
    <main className="h-screen w-screen overflow-hidden bg-gray-900 text-white relative">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 via-black to-purple-900/50"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20800%20800%22%3E%3Cg%20fill%3D%22none%22%20stroke%3D%22%23ffffff10%22%20stroke-width%3D%221%22%3E%3Cpath%20d%3D%22M-200%2C0%20L800%2C1000%22%2F%3E%3Cpath%20d%3D%22M-100%2C0%20L900%2C1000%22%2F%3E%3Cpath%20d%3D%22M0%2C0%20L1000%2C1000%22%2F%3E%3Cpath%20d%3D%22M100%2C0%20L1100%2C1000%22%2F%3E%3Cpath%20d%3D%22M200%2C0%20L1200%2C1000%22%2F%3E%3Cpath%20d%3D%22M300%2C0%20L1300%2C1000%22%2F%3E%3Cpath%20d%3D%22M400%2C0%20L1400%2C1000%22%2F%3E%3Cpath%20d%3D%22M500%2C0%20L1500%2C1000%22%2F%3E%3Cpath%20d%3D%22M600%2C0%20L1600%2C1000%22%2F%3E%3Cpath%20d%3D%22M700%2C0%20L1700%2C1000%22%2F%3E%3Cpath%20d%3D%22M800%2C0%20L1800%2C1000%22%2F%3E%3Cpath%20d%3D%22M900%2C0%20L1900%2C1000%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')]"></div>
      
      {/* Top Bar with Logo */}
      <div className="absolute top-0 left-0 right-0 h-16 glass flex items-center justify-between px-6 z-[200] border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">G</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-gradient">GenerativeOS</h1>
            <p className="text-xs text-gray-400">AI-Powered Desktop</p>
          </div>
        </div>
        <button
          onClick={() => setShowExamples(!showExamples)}
          className="px-4 py-2 text-xs font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/10"
        >
          {showExamples ? '✕ Hide Examples' : '✨ Show Examples'}
        </button>
      </div>

      {/* Example Prompts */}
      {showExamples && apps.length === 0 && (
        <div className="absolute inset-x-8 top-24 bottom-32 overflow-y-auto z-[50] fade-in">
          <ExamplePrompts onSelectPrompt={handlePromptSelect} />
        </div>
      )}
      
      {console.log('About to render apps. Count:', apps.length)}
      {apps.map(app => {
        console.log('Rendering app window:', app.appName, 'ID:', app.id);
        return (
          <Window
            key={app.id}
            initialApp={app}
            onClose={handleCloseApp}
            onFocus={handleBringToFront}
            onUpdate={handleUpdateApp}
            onNewWindow={createNewApp}
          />
        );
      })}

      <Dock
        userInput={userInput}
        setUserInput={setUserInput}
        onGenerate={handleGenerateApp}
        isLoading={isLoading}
        error={error}
      />

      {/* Cleanup handler */}
      {typeof window !== 'undefined' && (
        <div className="hidden">
          {window.addEventListener('beforeunload', () => {
            hardwareService.cleanup();
          })}
        </div>
      )}
    </main>
  );
};

export default App;