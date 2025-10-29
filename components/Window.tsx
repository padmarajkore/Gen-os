import React, { useState, useRef, useCallback, MouseEvent, useEffect } from 'react';
import type { GeneratedApp, Action, AppSchema, UIComponent, TabContainerProps, SplitViewProps } from '../types';
import DynamicRenderer from './DynamicRenderer';
import { generateAppSchema } from '../services/geminiService';
import { dbService } from '../services/databaseService';
import { enhancedDbService } from '../services/enhancedDatabaseService';
import { hardwareService } from '../services/hardwareService';

const transformComponentTree = (
  components: UIComponent[],
  transform: (component: UIComponent) => UIComponent
): UIComponent[] => {
  return components.map(component => transformComponentNode(component, transform));
};

const transformComponentNode = (
  component: UIComponent,
  transform: (component: UIComponent) => UIComponent
): UIComponent => {
  let processedComponent = component;

  if (component.type === 'tab-container') {
    const props = component.props as TabContainerProps;
    const updatedTabs = (props.tabs ?? []).map(tab => ({
      ...tab,
      components: transformComponentTree(tab.components ?? [], transform)
    }));
    processedComponent = {
      ...component,
      props: {
        ...props,
        tabs: updatedTabs
      }
    };
  } else if (component.type === 'split-view') {
    const props = component.props as SplitViewProps;
    processedComponent = {
      ...component,
      props: {
        ...props,
        leftComponents: transformComponentTree(props.leftComponents ?? [], transform),
        rightComponents: transformComponentTree(props.rightComponents ?? [], transform)
      }
    };
  }

  return transform(processedComponent);
};

const activateTabInComponents = (components: UIComponent[], tabId: string): UIComponent[] => {
  return transformComponentTree(components, component => {
    if (component.type === 'tab-container') {
      const props = component.props as TabContainerProps;
      if ((props.tabs ?? []).some(tab => tab.id === tabId)) {
        return {
          ...component,
          props: {
            ...props,
            activeTab: tabId
          }
        };
      }
    }
    return component;
  });
};

const closeTabInComponents = (components: UIComponent[], tabId: string): UIComponent[] => {
  return transformComponentTree(components, component => {
    if (component.type === 'tab-container') {
      const props = component.props as TabContainerProps;
      if (!(props.tabs ?? []).some(tab => tab.id === tabId)) {
        return component;
      }

      const filteredTabs = (props.tabs ?? []).filter(tab => tab.id !== tabId);
      const nextActive = props.activeTab === tabId ? filteredTabs[0]?.id : props.activeTab;

      return {
        ...component,
        props: {
          ...props,
          tabs: filteredTabs,
          activeTab: nextActive
        }
      };
    }

    return component;
  });
};

interface WindowProps {
  initialApp: GeneratedApp;
  onClose: (id: number) => void;
  onFocus: (id: number) => void;
  onUpdate: (id: number, updates: Partial<GeneratedApp>) => void;
  onNewWindow: (schema: AppSchema) => Promise<void>;
}

const Window: React.FC<WindowProps> = ({ initialApp, onClose, onFocus, onUpdate, onNewWindow }) => {
  const [currentApp, setCurrentApp] = useState(initialApp);
  const [position, setPosition] = useState(initialApp.position);
  const [size, setSize] = useState({ width: 420, height: 600 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const windowContentRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  const dragRef = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const resizeRef = useRef({ startX: 0, startY: 0, startWidth: 0, startHeight: 0 });
  const isResizing = useRef(false);

  // Add entrance animation
  useEffect(() => {
    if (windowRef.current) {
      windowRef.current.classList.add('window-enter');
    }
  }, []);

  const handleMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (isMaximized) return; // Don't allow dragging when maximized
    
    onFocus(initialApp.id);
    setIsFocused(true);
    isDragging.current = true;
    dragRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    
    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
        if (isDragging.current) {
            const newPos = {
              x: moveEvent.clientX - dragRef.current.x,
              y: moveEvent.clientY - dragRef.current.y,
            };
            setPosition(newPos);
            onUpdate(initialApp.id, { position: newPos });
        }
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [position, onFocus, initialApp.id, onUpdate, isMaximized]);

  const handleResize = useCallback((e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (isMaximized) return;
    
    isResizing.current = true;
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: size.width,
      startHeight: size.height,
    };

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
      if (isResizing.current) {
        const deltaX = moveEvent.clientX - resizeRef.current.startX;
        const deltaY = moveEvent.clientY - resizeRef.current.startY;
        
        const newWidth = Math.max(320, resizeRef.current.startWidth + deltaX);
        const newHeight = Math.max(200, resizeRef.current.startHeight + deltaY);
        
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [size, isMaximized]);

  const handleMinimize = useCallback(() => {
    if (windowRef.current) {
      windowRef.current.classList.add('window-minimize');
      setTimeout(() => {
        setIsMinimized(true);
      }, 400);
    }
  }, []);

  const handleMaximize = useCallback(() => {
    setIsMaximized(!isMaximized);
  }, [isMaximized]);

  const handleClose = useCallback(() => {
    if (windowRef.current) {
      windowRef.current.classList.add('window-minimize');
      setTimeout(() => {
        onClose(initialApp.id);
      }, 300);
    }
  }, [initialApp.id, onClose]);

  const handleFocus = useCallback(() => {
    onFocus(initialApp.id);
    setIsFocused(true);
  }, [initialApp.id, onFocus]);

  const handleExecuteAction = useCallback(async (action: Action, payload?: any) => {
    console.log('handleExecuteAction called with action:', action);
    switch (action.type) {
      case 'generate':
        let prompt = action.prompt;
        console.log('Original prompt:', prompt);
        
        const inputs = windowContentRef.current?.querySelectorAll('input, textarea');
        inputs?.forEach((input) => {
          const element = input as HTMLInputElement | HTMLTextAreaElement;
          if (element.id) {
            const placeholder = `{${element.id}}`;
            prompt = prompt.replace(new RegExp(placeholder, 'g'), element.value);
          }
        });
        
        console.log('Final prompt after input substitution:', prompt);
        console.log('Setting isUpdating to true...');
        setIsUpdating(true);
        try {
          console.log('Getting context data for dataKey:', currentApp.dataKey);
          let contextData = null;
          if (currentApp.dataKey) {
            try {
              // Add timeout to prevent hanging
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database timeout')), 3000)
              );
              
              contextData = await Promise.race([
                dbService.get(currentApp.dataKey),
                timeoutPromise
              ]);
              console.log('Retrieved context data:', contextData);
            } catch (dbError) {
              console.error('Error getting context data (using app data instead):', dbError);
              // Use current app data as fallback
              contextData = currentApp.appData;
            }
          }
          console.log('Final context data:', contextData);

          console.log('Building full context...');
          // Pass complete current app state to AI for context-aware updates
          const fullContext = {
            currentApp: {
              appName: currentApp.appName,
              components: currentApp.components,
              appData: currentApp.appData,
              dataKey: currentApp.dataKey
            },
            storedData: contextData,
            userAction: prompt
          };

          console.log('Sending full context to AI:', fullContext);
          console.log('About to call generateAppSchema...');
          const schema = await generateAppSchema(prompt, fullContext);
          console.log('Received schema from AI:', schema);

          if (schema.dataKey && schema.appData) {
            console.log('Saving app data to database...');
            try {
              await Promise.race([
                dbService.set(schema.dataKey, schema.appData),
                new Promise((_, reject) => setTimeout(() => reject(new Error('DB save timeout')), 2000))
              ]);
              console.log('Database save completed');
            } catch (dbSaveError) {
              console.error('Database save failed (continuing anyway):', dbSaveError);
            }
            
            try {
              await Promise.race([
                enhancedDbService.setAppData(schema.dataKey, `app_${initialApp.id}`, schema.appData),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Enhanced DB timeout')), 2000))
              ]);
              console.log('Enhanced database save completed');
            } catch (enhancedDbError) {
              console.error('Enhanced database save failed (continuing anyway):', enhancedDbError);
            }
          }

          if (action.target === 'new_window') {
            console.log('Creating new window...');
            await onNewWindow(schema);
          } else {
            console.log('Updating current app...');
            setCurrentApp({ ...currentApp, ...schema });
            onUpdate(initialApp.id, schema);
          }
          console.log('Action completed successfully');
        } catch (error) {
          console.error('Failed to generate app:', error);
          console.error('Error details:', error);
        } finally {
          console.log('Setting isUpdating to false...');
          setIsUpdating(false);
        }
        break;
      case 'capture_photo':
        if (payload && payload.blob) {
          const filename = action.filename.replace('${Date.Now()}', Date.now().toString());
          await dbService.set(filename, payload.blob);
          await enhancedDbService.addFile({
            name: filename,
            type: 'image/jpeg',
            size: payload.blob.size,
            blob: payload.blob,
            tags: ['camera', 'photo'],
            folder: 'photos'
          });
          const confirmationPrompt = `Show a confirmation that photo '${filename}' was saved. Also include a button to 'view all files'.`;
          await handleExecuteAction({ type: 'generate', prompt: confirmationPrompt, target: 'self' });
        }
        break;
      case 'start_recording':
        try {
          const success = await hardwareService.startAudioRecording();
          if (success) {
            const confirmationPrompt = 'Show recording started confirmation with a stop button.';
            await handleExecuteAction({ type: 'generate', prompt: confirmationPrompt, target: 'self' });
          }
        } catch (error) {
          console.error('Failed to start recording:', error);
        }
        break;
      case 'stop_recording':
        try {
          const recording = await hardwareService.stopAudioRecording(action.filename);
          if (recording) {
            await enhancedDbService.addFile({
              name: recording.filename,
              type: 'audio/webm',
              size: recording.blob.size,
              blob: recording.blob,
              tags: ['audio', 'recording'],
              folder: 'recordings'
            });
            const confirmationPrompt = `Show confirmation that recording '${recording.filename}' was saved (${recording.duration}ms duration).`;
            await handleExecuteAction({ type: 'generate', prompt: confirmationPrompt, target: 'self' });
          }
        } catch (error) {
          console.error('Failed to stop recording:', error);
        }
        break;
      case 'capture_video':
        if (payload && payload.blob) {
          const blob: Blob = payload.blob;
          const filename = (payload.filename || action.filename).replace('${Date.Now()}', Date.now().toString());
          const mimeType = payload.mimeType || 'video/webm';

          try {
            await enhancedDbService.addFile({
              name: filename,
              type: mimeType,
              size: blob.size,
              blob,
              tags: ['video', 'recording'],
              folder: 'videos'
            });

            const confirmationPrompt = `Show a confirmation that video '${filename}' was saved successfully.`;
            await handleExecuteAction({ type: 'generate', prompt: confirmationPrompt, target: 'self' });
          } catch (videoSaveError) {
            console.error('Failed to save video recording:', videoSaveError);
          }
        }
        break;
      case 'select_files':
        try {
          const files = await hardwareService.selectFiles(action.options);
          for (const file of files) {
            await enhancedDbService.addFile({
              name: file.name,
              type: file.type,
              size: file.size,
              blob: new Blob([file.content]),
              tags: ['uploaded'],
              folder: 'uploads'
            });
          }
          const confirmationPrompt = `Show confirmation that ${files.length} file(s) were uploaded successfully.`;
          await handleExecuteAction({ type: 'generate', prompt: confirmationPrompt, target: 'self' });
        } catch (error) {
          console.error('Failed to select files:', error);
        }
        break;
      case 'get_location':
        try {
          const location = await hardwareService.getCurrentLocation();
          if (location) {
            const confirmationPrompt = `Show current location: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)} (±${location.accuracy}m accuracy)`;
            await handleExecuteAction({ type: 'generate', prompt: confirmationPrompt, target: 'self' });
          }
        } catch (error) {
          console.error('Failed to get location:', error);
        }
        break;
      case 'show_notification':
        try {
          await hardwareService.showNotification(action.title, { body: action.body });
        } catch (error) {
          console.error('Failed to show notification:', error);
        }
        break;
      case 'save_to_system':
        try {
          switch (action.dataType) {
            case 'email':
              await enhancedDbService.addEmail(action.data);
              break;
            case 'contact':
              await enhancedDbService.addContact(action.data);
              break;
            case 'note':
              await enhancedDbService.addNote(action.data);
              break;
            case 'event':
              await enhancedDbService.addCalendarEvent(action.data);
              break;
          }
          const confirmationPrompt = `Show confirmation that ${action.dataType} was saved to the system.`;
          await handleExecuteAction({ type: 'generate', prompt: confirmationPrompt, target: 'self' });
        } catch (error) {
          console.error('Failed to save to system:', error);
        }
        break;
      case 'navigate_url':
        try {
          if (action.url && action.target === '_blank') {
            window.open(action.url, action.target);
          } else {
            console.debug('navigate_url handled internally for', action.url);
          }
        } catch (error) {
          console.error('Failed to navigate to URL:', error);
        }
        break;
      case 'open_tab':
        if (action.tabId) {
          const updatedComponents = activateTabInComponents(currentApp.components, action.tabId);
          setCurrentApp(prev => ({ ...prev, components: updatedComponents }));
          onUpdate(initialApp.id, { components: updatedComponents });
        }
        break;
      case 'close_tab':
        if (action.tabId) {
          const updatedComponents = closeTabInComponents(currentApp.components, action.tabId);
          setCurrentApp(prev => ({ ...prev, components: updatedComponents }));
          onUpdate(initialApp.id, { components: updatedComponents });
        }
        break;
      case 'download_file':
        try {
          const response = await fetch(action.url);
          const blob = await response.blob();
          await hardwareService.downloadFile(blob, action.filename);
        } catch (error) {
          console.error('Failed to download file:', error);
        }
        break;
      case 'execute_command':
        console.warn('execute_command action is not supported in browser environment:', action.command);
        break;
    }
  }, [currentApp, initialApp.id, onUpdate, onNewWindow]);

  if (isMinimized) return null;

  const windowStyle = isMaximized
    ? {
        left: '0px',
        top: '64px', // Below the top bar (16px * 4 = 64px)
        width: '100vw',
        height: 'calc(100vh - 64px - 96px)', // Subtract top bar and dock space
        borderRadius: '0px',
      }
    : {
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
      };

  return (
    <div
      ref={windowRef}
      className={`absolute flex flex-col glass-dark text-white overflow-hidden transition-smooth ${
        isFocused ? 'window-shadow-focus' : 'window-shadow'
      } ${isMaximized ? 'window-maximized' : 'rounded-xl'}`}
      style={{
        ...windowStyle,
        zIndex: isMaximized ? 100 : initialApp.zIndex, // Higher z-index when maximized
        transform: isUpdating ? 'scale(1.01)' : 'scale(1)',
      }}
      onMouseDown={handleFocus}
    >
      {/* Title Bar */}
      <div
        className="window-titlebar no-select flex items-center justify-between h-12 px-4"
        onMouseDown={handleMouseDown}
      >
        {/* Traffic Lights (macOS style) */}
        <div
          className="traffic-lights"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="traffic-light close"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            role="button"
            aria-label="Close window"
            title="Close"
          ></div>
          <div
            className="traffic-light minimize"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              handleMinimize();
            }}
            role="button"
            aria-label="Minimize window"
            title="Minimize"
          ></div>
          <div
            className="traffic-light maximize"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              handleMaximize();
            }}
            role="button"
            aria-label="Toggle maximize"
            title={isMaximized ? 'Restore' : 'Maximize'}
          ></div>
        </div>

        {/* Window Title */}
        <div className="flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
          <span className="w-5 h-5 text-gray-300" dangerouslySetInnerHTML={{ __html: currentApp.icon }} />
          <span className="text-sm font-semibold text-gray-200">{currentApp.appName}</span>
        </div>

        {/* Spacer for symmetry */}
        <div className="w-16"></div>
      </div>

      {/* Window Content */}
      <div className="flex-grow overflow-y-auto custom-scrollbar relative bg-gradient-to-b from-transparent to-black/10" ref={windowContentRef}>
        {isUpdating && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full spinner"></div>
              <p className="text-sm text-gray-300">Updating...</p>
            </div>
          </div>
        )}
        {currentApp.components.map((component, index) => (
          <DynamicRenderer key={`${currentApp.id}-${index}`} component={component} onExecuteAction={handleExecuteAction} />
        ))}
      </div>

      {/* Resize Handle */}
      {!isMaximized && (
        <div className="resize-handle" onMouseDown={handleResize}></div>
      )}
    </div>
  );
};

export default Window;