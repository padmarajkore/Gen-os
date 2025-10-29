import React from 'react';
import type { UIComponent, Action } from '../types';
import { Header, EmailItem, WeatherCard, MusicPlayer, Paragraph, ButtonGroup, CameraView, TextInput, FileExplorer, CalendarView, EventItem as EventItemComponent, DateInput, Chart } from './AppUI';
// Hardware components will be imported individually when needed
import { DrawingCanvas, Calculator, TextEditor, CodeEditor, Gallery, EnhancedMusicPlayer, VideoPlayer, Settings } from './FunctionalComponents';
import { WebBrowser, IframeView, UrlInput, Terminal, MarkdownViewer, PdfViewer, TabContainer, SplitView } from './AdvancedComponents';

const componentMap: Record<string, React.FC<any>> = {
  'header': Header,
  'email-item': EmailItem,
  'weather-card': WeatherCard,
  'music-player': MusicPlayer,
  'paragraph': Paragraph,
  'button-group': ButtonGroup,
  'camera-view': CameraView,
  'text-input': TextInput,
  'date-input': DateInput,
  'file-explorer': FileExplorer,
  'calendar-view': CalendarView,
  'event-item': EventItemComponent,
  // Hardware components temporarily disabled
  // 'live-camera': LiveCamera,
  // 'audio-recorder': AudioRecorder,
  // 'file-upload': FileUpload,
  // 'location-display': LocationDisplay,
  // 'system-info': SystemInfo,
  'chart': Chart,
  'drawing-canvas': DrawingCanvas,
  'calculator': Calculator,
  'text-editor': TextEditor,
  'code-editor': CodeEditor,
  'gallery': Gallery,
  'enhanced-music-player': EnhancedMusicPlayer,
  'video-player': VideoPlayer,
  'settings': Settings,
  'web-browser': WebBrowser,
  'iframe-view': IframeView,
  'url-input': UrlInput,
  'tab-container': TabContainer,
  'terminal': Terminal,
  'markdown-viewer': MarkdownViewer,
  'pdf-viewer': PdfViewer,
  'split-view': SplitView,
};

interface DynamicRendererProps {
    component: UIComponent;
    onExecuteAction: (action: Action, payload?: any) => void;
}

const DynamicRenderer: React.FC<DynamicRendererProps> = ({ component, onExecuteAction }) => {
  const ComponentToRender = componentMap[component.type];
  if (!ComponentToRender) {
    return (
      <div className="p-4 text-yellow-400 bg-yellow-900/50">
        Unknown component type: {component.type}
      </div>
    );
  }
  const extraProps = {} as Record<string, any>;

  if (component.type === 'tab-container' || component.type === 'split-view') {
    extraProps.renderComponent = (childComponent: UIComponent, index: number) => (
      <DynamicRenderer key={`${component.type}-${index}`} component={childComponent} onExecuteAction={onExecuteAction} />
    );
  }

  return <ComponentToRender {...component.props} onExecuteAction={onExecuteAction} {...extraProps} />;
};

export default DynamicRenderer;