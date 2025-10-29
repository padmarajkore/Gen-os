import React, { useState, useRef, useEffect } from 'react';
import type {
  LiveCameraProps,
  AudioRecorderProps,
  FileUploadProps,
  LocationDisplayProps,
  SystemInfoProps
} from '../types';
import { hardwareService } from '../services/hardwareService';

export const LiveCamera: React.FC<LiveCameraProps & { onAction?: (action: any) => void }> = ({
  width,
  height,
  facingMode,
  onAction
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Failed to access camera');
      console.error('Camera error:', err);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !stream) return;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, width, height);
      canvas.toBlob(async (blob) => {
        if (blob) {
          const filename = `photo_${Date.now()}.jpg`;
          
          // Save to local file system
          const saved = await hardwareService.saveFileToLocal(blob, filename);
          if (saved) {
            console.log(`Photo saved locally: ${filename}`);
          }
          
          if (onAction) {
            onAction({
              type: 'capture_photo',
              filename,
              blob
            });
          }
        }
      }, 'image/jpeg');
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Live Camera</h3>
      {error ? (
        <div className="text-red-400 text-center p-8">{error}</div>
      ) : (
        <div className="relative">
          <video
            ref={videoRef}
            width={width}
            height={height}
            autoPlay
            playsInline
            muted
            className="rounded-lg bg-black"
          />
          <button
            onClick={capturePhoto}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white text-black p-3 rounded-full hover:bg-gray-200"
          >
            📷
          </button>
        </div>
      )}
    </div>
  );
};

export const AudioRecorder: React.FC<AudioRecorderProps & { onAction?: (action: any) => void }> = ({
  maxDuration,
  onAction
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const filename = `recording_${Date.now()}.wav`;
        if (onAction) {
          onAction({
            type: 'stop_recording',
            filename,
            blob
          });
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);

      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (maxDuration && newTime >= maxDuration) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);

      if (onAction) {
        onAction({
          type: 'start_recording',
          filename: `recording_${Date.now()}.wav`
        });
      }
    } catch (err) {
      setError('Failed to access microphone');
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Audio Recorder</h3>
        <div className="text-2xl font-mono">
          {formatTime(recordingTime)}
        </div>
      </div>
      
      {error && (
        <div className="text-red-400 text-sm mb-2">{error}</div>
      )}
      
      <div className="flex justify-center">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-full text-lg font-semibold"
          >
            <div className="w-4 h-4 bg-white rounded-full"></div>
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-full text-lg font-semibold"
          >
            <div className="w-4 h-4 bg-white"></div>
            Stop Recording
          </button>
        )}
      </div>
      
      {maxDuration && (
        <div className="mt-2 text-sm text-gray-400 text-center">
          Max duration: {formatTime(maxDuration)}
        </div>
      )}
    </div>
  );
};

export const FileUpload: React.FC<FileUploadProps & { onAction?: (action: any) => void }> = ({
  accept,
  multiple,
  onAction
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      setSelectedFiles(fileArray);
      
      if (onAction) {
        onAction({
          type: 'select_files',
          files: fileArray.map(f => ({
            name: f.name,
            size: f.size,
            type: f.type
          }))
        });
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  return (
    <div className="p-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-blue-400 bg-blue-400/10'
            : 'border-gray-600 hover:border-gray-500'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-gray-300">
            {isDragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {accept || 'Any file type'} • {multiple ? 'Multiple files' : 'Single file'}
          </p>
        </label>
      </div>
      
      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Selected Files:</h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-800 rounded p-2">
                <span className="text-sm text-gray-300">{file.name}</span>
                <span className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const LocationDisplay: React.FC<LocationDisplayProps & { onAction?: (action: any) => void }> = ({ 
  showMap, 
  onAction 
}) => {
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const locationData = await hardwareService.getCurrentLocation();
      setLocation(locationData);
      if (onAction) {
        onAction({
          type: 'get_location',
          location: locationData
        });
      }
    } catch (err) {
      setError('Failed to get location');
      console.error('Location error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Location</h3>
        <button
          onClick={getCurrentLocation}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded"
        >
          {loading ? 'Getting Location...' : 'Get Location'}
        </button>
      </div>

      {error && (
        <div className="text-red-400 text-sm mb-4">{error}</div>
      )}

      {location && (
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Latitude:</span>
              <span className="ml-2 text-gray-200">{location.latitude.toFixed(6)}</span>
            </div>
            <div>
              <span className="text-gray-400">Longitude:</span>
              <span className="ml-2 text-gray-200">{location.longitude.toFixed(6)}</span>
            </div>
            <div>
              <span className="text-gray-400">Accuracy:</span>
              <span className="ml-2 text-gray-200">{location.accuracy.toFixed(0)}m</span>
            </div>
          </div>
          
          {showMap && (
            <div className="mt-4 bg-gray-700 rounded p-4 text-center text-gray-400">
              Map view would be displayed here
              <br />
              <small>({location.latitude.toFixed(4)}, {location.longitude.toFixed(4)})</small>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const SystemInfo: React.FC<SystemInfoProps> = ({ fields }) => {
  const [systemInfo, setSystemInfo] = useState<Record<string, any>>({});

  useEffect(() => {
    const info: Record<string, any> = {};
    
    fields.forEach(field => {
      info[field] = getFieldValue(field);
    });
    
    setSystemInfo(info);
  }, [fields]);

  const getFieldValue = (field: string) => {
    switch (field) {
      case 'userAgent':
        return navigator.userAgent;
      case 'platform':
        return navigator.platform;
      case 'language':
        return navigator.language;
      case 'cookieEnabled':
        return navigator.cookieEnabled;
      case 'onLine':
        return navigator.onLine;
      case 'screenWidth':
        return screen.width;
      case 'screenHeight':
        return screen.height;
      case 'windowWidth':
        return window.innerWidth;
      case 'windowHeight':
        return window.innerHeight;
      case 'timezone':
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      case 'timestamp':
        return new Date().toISOString();
      default:
        return 'Unknown field';
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">System Information</h3>
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="space-y-3">
          {fields.map(field => (
            <div key={field} className="flex justify-between">
              <span className="text-gray-400 capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}:</span>
              <span className="text-gray-200 text-right max-w-xs truncate">
                {String(getFieldValue(field))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
