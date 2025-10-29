export interface HeaderProps {
  title: string;
  subtitle?: string;
}

export interface GenerateAction {
  type: 'generate';
  prompt: string;
  target: 'self' | 'new_window';
}

export interface CapturePhotoAction {
    type: 'capture_photo';
    filename: string;
}

export interface CaptureVideoAction {
    type: 'capture_video';
    filename: string;
    mimeType?: string;
}

export interface CaptureAudioAction {
    type: 'capture_audio';
    filename: string;
    mimeType?: string;
}

export interface StartRecordingAction {
    type: 'start_recording';
    filename: string;
}

export interface StopRecordingAction {
    type: 'stop_recording';
    filename?: string;
}

export interface SelectFilesAction {
    type: 'select_files';
    options: {
        multiple: boolean;
        accept: string;
    };
}

export interface GetLocationAction {
    type: 'get_location';
}

export interface ShowNotificationAction {
    type: 'show_notification';
    title: string;
    body: string;
}

export interface SaveToSystemAction {
    type: 'save_to_system';
    dataType: 'email' | 'contact' | 'note' | 'event';
    data: any;
}

export interface NavigateUrlAction {
    type: 'navigate_url';
    url: string;
    target?: '_self' | '_blank';
}

export interface OpenTabAction {
    type: 'open_tab';
    url: string;
    tabId?: string;
}

export interface CloseTabAction {
    type: 'close_tab';
    tabId: string;
}

export interface DownloadFileAction {
    type: 'download_file';
    url: string;
    filename: string;
}

export interface ExecuteCommandAction {
    type: 'execute_command';
    command: string;
    workingDirectory?: string;
}

export type Action =
    | GenerateAction
    | CapturePhotoAction
    | CaptureVideoAction
    | CaptureAudioAction
    | StartRecordingAction
    | StopRecordingAction
    | SelectFilesAction
    | GetLocationAction
    | ShowNotificationAction
    | SaveToSystemAction
    | NavigateUrlAction
    | OpenTabAction
    | CloseTabAction
    | DownloadFileAction
    | ExecuteCommandAction;

export interface EmailItemProps {
  id: number;
  from: string;
  subject: string;
  preview: string;
  timestamp: string;
  read: boolean;
  action?: Action;
}

export interface WeatherCardProps {
  location: string;
  temperature: number;
  condition: string;
  icon: 'sun' | 'cloud' | 'rain' | 'snow' | 'storm';
}

export interface MusicPlayerProps {
  trackName: string;
  artistName: string;
  albumArtUrl: string;
  isPlaying: boolean;
}

export interface ParagraphProps {
    text: string;
}

export interface ButtonProps {
    label: string;
    variant: 'primary' | 'secondary';
    action?: Action;
}

export interface ButtonGroupProps {
    buttons: ButtonProps[];
}

export interface CameraViewProps {
    prompt?: string;
}

export interface TextInputProps {
    id: string; // To be referenced by actions
    label: string;
    placeholder?: string;
}

export interface DateInputProps {
    id: string;
    label: string;
}

export interface FileItemProps {
    name: string;
    type: 'image' | 'file';
    url?: string; // For images
    size?: number;
    action?: Action;
}

export interface FileExplorerProps {
    files: FileItemProps[];
}

export interface EventItemProps {
    id: string;
    time: string;
    title: string;
    action?: Action;
}

export interface CalendarViewProps {
    year: number;
    month: number; // 1-12
    events: { date: string; // YYYY-MM-DD
              items: EventItemProps[] }[];
}

export interface LiveCameraProps {
    width: number;
    height: number;
    facingMode: 'user' | 'environment';
}

export interface AudioRecorderProps {
    maxDuration?: number;
}

export interface FileUploadProps {
    accept: string;
    multiple: boolean;
    label?: string;
    description?: string;
    action?: Action;
}

export interface LocationDisplayProps {
    showMap: boolean;
}

export interface SystemInfoProps {
  fields: string[];
}

export interface ChartProps {
  type: 'pie' | 'bar' | 'line' | 'scatter';
  data: Array<{ label: string; value: number; color?: string }>;
  title: string;
  width?: number;
  height?: number;
}

export interface DrawingCanvasProps {
  width?: number;
  height?: number;
  backgroundColor?: string;
}

export interface CalculatorProps {
  mode?: 'basic' | 'scientific';
}

export interface TextEditorProps {
  placeholder?: string;
  initialContent?: string;
  features?: Array<'bold' | 'italic' | 'underline' | 'lists' | 'links'>;
}

export interface CodeEditorProps {
  language?: string;
  theme?: 'dark' | 'light';
  initialCode?: string;
}

export interface GalleryProps {
  autoLoad?: boolean;
  columns?: number;
}

export interface VideoPlayerProps {
  autoLoad?: boolean;
  controls?: boolean;
}

export interface EnhancedMusicPlayerProps {
  autoLoad?: boolean;
  showPlaylist?: boolean;
}

export interface SettingsProps {
  category?: 'general' | 'paths' | 'privacy' | 'about';
}

export interface WebBrowserProps {
  defaultUrl?: string;
  showAddressBar?: boolean;
  showControls?: boolean;
  allowNavigation?: boolean;
  sandboxed?: boolean;
}

export interface IframeViewProps {
  url: string;
  title?: string;
  width?: number | string;
  height?: number | string;
  sandbox?: string;
}

export interface UrlInputProps {
  id: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
}

export interface TabDefinition {
  id: string;
  label: string;
  icon?: string;
  components: UIComponent[];
}

export interface TabContainerProps {
  tabs: TabDefinition[];
  activeTab?: string;
}

export interface TerminalProps {
  readOnly?: boolean;
  theme?: 'dark' | 'light';
  prompt?: string;
  initialOutput?: string[];
}

export interface MarkdownViewerProps {
  content: string;
  enableHtml?: boolean;
}

export interface PdfViewerProps {
  url?: string;
  autoLoad?: boolean;
}

export interface SplitViewProps {
  orientation: 'horizontal' | 'vertical';
  leftComponents: UIComponent[];
  rightComponents: UIComponent[];
  defaultSplit?: number;
}

export type UIComponent =
  | { type: 'header'; props: HeaderProps }
  | { type: 'email-item'; props: EmailItemProps }
  | { type: 'weather-card'; props: WeatherCardProps }
  | { type: 'music-player'; props: MusicPlayerProps }
  | { type: 'paragraph'; props: ParagraphProps }
  | { type: 'button-group'; props: ButtonGroupProps }
  | { type: 'camera-view'; props: CameraViewProps }
  | { type: 'text-input'; props: TextInputProps }
  | { type: 'date-input'; props: DateInputProps }
  | { type: 'file-explorer'; props: FileExplorerProps }
  | { type: 'calendar-view'; props: CalendarViewProps }
  | { type: 'event-item'; props: EventItemProps }
  | { type: 'live-camera'; props: LiveCameraProps }
  | { type: 'audio-recorder'; props: AudioRecorderProps }
  | { type: 'file-upload'; props: FileUploadProps }
  | { type: 'location-display'; props: LocationDisplayProps }
  | { type: 'system-info'; props: SystemInfoProps }
  | { type: 'chart'; props: ChartProps }
  | { type: 'drawing-canvas'; props: DrawingCanvasProps }
  | { type: 'calculator'; props: CalculatorProps }
  | { type: 'text-editor'; props: TextEditorProps }
  | { type: 'code-editor'; props: CodeEditorProps }
  | { type: 'gallery'; props: GalleryProps }
  | { type: 'video-player'; props: VideoPlayerProps }
  | { type: 'enhanced-music-player'; props: EnhancedMusicPlayerProps }
  | { type: 'settings'; props: SettingsProps }
  | { type: 'web-browser'; props: WebBrowserProps }
  | { type: 'iframe-view'; props: IframeViewProps }
  | { type: 'url-input'; props: UrlInputProps }
  | { type: 'tab-container'; props: TabContainerProps }
  | { type: 'terminal'; props: TerminalProps }
  | { type: 'markdown-viewer'; props: MarkdownViewerProps }
  | { type: 'pdf-viewer'; props: PdfViewerProps }
  | { type: 'split-view'; props: SplitViewProps };

export interface AppSchema {
  appName: string;
  icon: string;
  layout: 'single-view' | 'list-view' | 'grid-view';
  components: UIComponent[];
  dataKey?: string; // Used for persisting app-specific data
  appData?: any; // The structured data model for the app's state
  hardwareAccess?: string[]; // Hardware capabilities needed
  systemIntegration?: boolean; // Whether this app integrates with system-wide data
}

export interface GeneratedApp extends AppSchema {
  id: number;
  position: { x: number; y: number };
  zIndex: number;
}