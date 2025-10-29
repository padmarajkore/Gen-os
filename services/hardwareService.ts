/**
 * Hardware Access Service
 * Provides unified access to device hardware capabilities
 */

import { configService } from './configService';

export interface CameraCapture {
  blob: Blob;
  url: string;
  timestamp: number;
  filename: string;
}

export interface AudioRecording {
  blob: Blob;
  url: string;
  duration: number;
  timestamp: number;
  filename: string;
}

export interface FileHandle {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  content: ArrayBuffer | string;
}

export interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

class HardwareService {
  private mediaStream: MediaStream | null = null;
  private audioRecorder: MediaRecorder | null = null;
  private isRecording = false;

  /**
   * Camera Service
   */
  async requestCameraPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      });
      stream.getTracks().forEach(track => track.stop()); // Stop immediately after permission check
      return true;
    } catch (error) {
      console.error('Camera permission denied:', error);
      return false;
    }
  }

  async startCamera(): Promise<MediaStream | null> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false 
      });
      return this.mediaStream;
    } catch (error) {
      console.error('Failed to start camera:', error);
      return null;
    }
  }

  async capturePhoto(filename?: string): Promise<CameraCapture | null> {
    if (!this.mediaStream) {
      throw new Error('Camera not started. Call startCamera() first.');
    }

    try {
      const video = document.createElement('video');
      video.srcObject = this.mediaStream;
      video.play();

      return new Promise((resolve) => {
        video.addEventListener('loadedmetadata', () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const timestamp = Date.now();
              const generatedFilename = filename || `photo_${timestamp}.jpg`;
              const url = URL.createObjectURL(blob);
              
              resolve({
                blob,
                url,
                timestamp,
                filename: generatedFilename
              });
            }
          }, 'image/jpeg', 0.9);
        });
      });
    } catch (error) {
      console.error('Failed to capture photo:', error);
      return null;
    }
  }

  stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  /**
   * Audio Service
   */
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }

  async startAudioRecording(): Promise<boolean> {
    if (this.isRecording) {
      console.warn('Already recording audio');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioRecorder = new MediaRecorder(stream);
      this.isRecording = true;
      
      this.audioRecorder.start();
      return true;
    } catch (error) {
      console.error('Failed to start audio recording:', error);
      return false;
    }
  }

  async stopAudioRecording(filename?: string): Promise<AudioRecording | null> {
    if (!this.audioRecorder || !this.isRecording) {
      throw new Error('No active recording to stop');
    }

    return new Promise((resolve) => {
      const chunks: BlobPart[] = [];
      const startTime = Date.now();

      this.audioRecorder!.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      this.audioRecorder!.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const duration = Date.now() - startTime;
        const timestamp = Date.now();
        const generatedFilename = filename || `recording_${timestamp}.webm`;

        // Clean up
        this.audioRecorder!.stream.getTracks().forEach(track => track.stop());
        this.audioRecorder = null;
        this.isRecording = false;

        resolve({
          blob,
          url,
          duration,
          timestamp,
          filename: generatedFilename
        });
      };

      this.audioRecorder!.stop();
    });
  }

  /**
   * File System Service
   */
  async selectFiles(options?: {
    multiple?: boolean;
    accept?: string;
  }): Promise<FileHandle[]> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = options?.multiple || false;
      input.accept = options?.accept || '*/*';

      input.onchange = async (event) => {
        const files = (event.target as HTMLInputElement).files;
        if (!files) {
          resolve([]);
          return;
        }

        const fileHandles: FileHandle[] = [];
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          try {
            const content = await this.readFileContent(file);
            fileHandles.push({
              name: file.name,
              size: file.size,
              type: file.type,
              lastModified: file.lastModified,
              content
            });
          } catch (error) {
            console.error(`Failed to read file ${file.name}:`, error);
          }
        }

        resolve(fileHandles);
      };

      input.onerror = () => reject(new Error('File selection failed'));
      input.click();
    });
  }

  private async readFileContent(file: File): Promise<ArrayBuffer | string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        resolve(reader.result as ArrayBuffer | string);
      };
      
      reader.onerror = () => reject(reader.error);
      
      // Read as text for text files, as ArrayBuffer for binary files
      if (file.type.startsWith('text/') || file.type === 'application/json') {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  }

  async downloadFile(blob: Blob, filename: string): Promise<void> {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Enhanced file system methods for local file access
  async saveFileToLocal(blob: Blob, filename: string): Promise<boolean> {
    try {
      if ('showSaveFilePicker' in window) {
        // Use File System Access API for better local integration
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'All files',
            accept: { '*/*': ['*'] }
          }]
        });
        
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
      } else {
        // Fallback to download
        await this.downloadFile(blob, filename);
        return true;
      }
    } catch (error) {
      console.error('Error saving file locally:', error);
      return false;
    }
  }

  async selectImageFiles(): Promise<File[]> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = 'image/*';
      
      input.onchange = (e) => {
        const files = Array.from((e.target as HTMLInputElement).files || []);
        resolve(files);
      };
      
      input.oncancel = () => resolve([]);
      input.click();
    });
  }

  async selectMusicFiles(): Promise<File[]> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = 'audio/*';
      
      input.onchange = (e) => {
        const files = Array.from((e.target as HTMLInputElement).files || []);
        resolve(files);
      };
      
      input.oncancel = () => resolve([]);
      input.click();
    });
  }

  async selectVideoFiles(): Promise<File[]> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = 'video/*';
      
      input.onchange = (e) => {
        const files = Array.from((e.target as HTMLInputElement).files || []);
        resolve(files);
      };
      
      input.oncancel = () => resolve([]);
      input.click();
    });
  }

  async selectDirectory(): Promise<File[]> {
    try {
      if ('showDirectoryPicker' in window) {
        // Use File System Access API for directory access
        const dirHandle = await (window as any).showDirectoryPicker();
        const files: File[] = [];
        
        for await (const [name, handle] of dirHandle.entries()) {
          if (handle.kind === 'file') {
            const file = await handle.getFile();
            files.push(file);
          }
        }
        
        return files;
      } else {
        // Fallback: ask user to select multiple files
        return this.selectFiles({ multiple: true }).then(handles => 
          handles.map(h => new File([h.content as ArrayBuffer], h.name, { type: h.type }))
        );
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
      return [];
    }
  }

  createObjectURL(file: File): string {
    return URL.createObjectURL(file);
  }

  revokeObjectURL(url: string): void {
    URL.revokeObjectURL(url);
  }

  // Enhanced photo capture with local save
  async captureAndSavePhoto(filename?: string): Promise<CameraCapture | null> {
    const suggestedFilename = filename || configService.getSuggestedFilename('photo', 'jpg');
    const capture = await this.capturePhoto(suggestedFilename);
    if (capture) {
      // Automatically save to local file system
      const saved = await this.saveFileToLocal(capture.blob, capture.filename);
      if (saved) {
        console.log(`Photo saved locally: ${capture.filename}`);
      }
    }
    return capture;
  }

  // Get configured paths
  getConfiguredPaths() {
    return configService.getAllPaths();
  }

  // Get suggested filename for different file types
  getSuggestedFilename(type: 'photo' | 'recording' | 'document' | 'drawing', extension: string): string {
    return configService.getSuggestedFilename(type, extension);
  }

  /**
   * Geolocation Service
   */
  async getCurrentLocation(): Promise<GeolocationData | null> {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Notification Service
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async showNotification(title: string, options?: {
    body?: string;
    icon?: string;
    tag?: string;
    data?: any;
  }): Promise<boolean> {
    if (!(await this.requestNotificationPermission())) {
      return false;
    }

    try {
      new Notification(title, {
        body: options?.body,
        icon: options?.icon || '/favicon.ico',
        tag: options?.tag,
        data: options?.data
      });
      return true;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return false;
    }
  }

  /**
   * System Information
   */
  getSystemInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      timestamp: Date.now()
    };
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.stopCamera();
    if (this.isRecording && this.audioRecorder) {
      this.audioRecorder.stop();
    }
  }

}

export const hardwareService = new HardwareService();
