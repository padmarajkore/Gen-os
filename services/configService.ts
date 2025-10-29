/**
 * Configuration Service
 * Manages file paths and user preferences
 */

export interface FilePathConfig {
  photos: string;
  music: string;
  videos: string;
  documents: string;
  downloads: string;
}

export interface AppConfig {
  defaultPaths: FilePathConfig;
  userPaths: Partial<FilePathConfig>;
  autoSave: boolean;
  defaultFileFormats: {
    images: string[];
    audio: string[];
    video: string[];
    documents: string[];
  };
}

class ConfigService {
  private config: AppConfig;
  private readonly CONFIG_STORAGE_KEY = 'generative-os-config';

  constructor() {
    this.config = this.loadConfig();
  }

  private getDefaultConfig(): AppConfig {
    return {
      defaultPaths: {
        photos: import.meta.env.VITE_DEFAULT_PHOTOS_PATH || '/Users/padamarajkore/Desktop',
        music: import.meta.env.VITE_DEFAULT_MUSIC_PATH || '/Users/padamarajkore/Music',
        videos: import.meta.env.VITE_DEFAULT_VIDEOS_PATH || '/Users/padamarajkore/Movies',
        documents: import.meta.env.VITE_DEFAULT_DOCUMENTS_PATH || '/Users/padamarajkore/Documents',
        downloads: import.meta.env.VITE_DEFAULT_DOWNLOADS_PATH || '/Users/padamarajkore/Downloads',
      },
      userPaths: {},
      autoSave: true,
      defaultFileFormats: {
        images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'],
        audio: ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'],
        video: ['mp4', 'webm', 'avi', 'mov', 'mkv', 'wmv'],
        documents: ['txt', 'md', 'pdf', 'doc', 'docx', 'rtf'],
      },
    };
  }

  private loadConfig(): AppConfig {
    try {
      const stored = localStorage.getItem(this.CONFIG_STORAGE_KEY);
      if (stored) {
        const parsedConfig = JSON.parse(stored);
        // Merge with defaults to ensure all properties exist
        return { ...this.getDefaultConfig(), ...parsedConfig };
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
    return this.getDefaultConfig();
  }

  private saveConfig(): void {
    try {
      localStorage.setItem(this.CONFIG_STORAGE_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('Error saving config:', error);
    }
  }

  // Get effective path (user preference or default)
  getPath(type: keyof FilePathConfig): string {
    return this.config.userPaths[type] || this.config.defaultPaths[type];
  }

  // Set user preference for a path
  setPath(type: keyof FilePathConfig, path: string): void {
    this.config.userPaths[type] = path;
    this.saveConfig();
  }

  // Get all paths
  getAllPaths(): FilePathConfig {
    return {
      photos: this.getPath('photos'),
      music: this.getPath('music'),
      videos: this.getPath('videos'),
      documents: this.getPath('documents'),
      downloads: this.getPath('downloads'),
    };
  }

  // Reset to defaults
  resetPaths(): void {
    this.config.userPaths = {};
    this.saveConfig();
  }

  // Auto-save setting
  getAutoSave(): boolean {
    return this.config.autoSave;
  }

  setAutoSave(enabled: boolean): void {
    this.config.autoSave = enabled;
    this.saveConfig();
  }

  // File format helpers
  getAcceptedFormats(type: keyof AppConfig['defaultFileFormats']): string {
    return this.config.defaultFileFormats[type]
      .map(ext => `.${ext}`)
      .join(',');
  }

  isAcceptedFormat(filename: string, type: keyof AppConfig['defaultFileFormats']): boolean {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension ? this.config.defaultFileFormats[type].includes(extension) : false;
  }

  // Get suggested filename with timestamp
  getSuggestedFilename(type: 'photo' | 'recording' | 'document' | 'drawing', extension: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const prefixes = {
      photo: 'photo',
      recording: 'recording',
      document: 'document',
      drawing: 'drawing',
    };
    return `${prefixes[type]}_${timestamp}.${extension}`;
  }

  // Export config for backup
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  // Import config from backup
  importConfig(configJson: string): boolean {
    try {
      const importedConfig = JSON.parse(configJson);
      this.config = { ...this.getDefaultConfig(), ...importedConfig };
      this.saveConfig();
      return true;
    } catch (error) {
      console.error('Error importing config:', error);
      return false;
    }
  }
}

export const configService = new ConfigService();
