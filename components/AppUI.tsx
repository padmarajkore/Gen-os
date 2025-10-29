import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { HeaderProps, EmailItemProps, WeatherCardProps, MusicPlayerProps, ParagraphProps, ButtonGroupProps, Action, CameraViewProps, TextInputProps, FileExplorerProps, CalendarViewProps, EventItemProps, DateInputProps, LiveCameraProps, AudioRecorderProps, FileUploadProps, LocationDisplayProps, SystemInfoProps, ChartProps } from '../types';
import { SunIcon, CloudIcon, RainIcon, SnowIcon, StormIcon, PlayIcon, PauseIcon, SkipBackIcon, SkipForwardIcon, ShutterIcon, FileIcon } from './Icons';
import { hardwareService } from '../services/hardwareService';
import { configService } from '../services/configService';
// Hardware components are imported in DynamicRenderer

interface Actionable {
    onExecuteAction: (action: Action, payload?: any) => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => (
  <div className="p-5 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
    <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
    {subtitle && <p className="text-sm text-gray-400 mt-1.5">{subtitle}</p>}
  </div>
);

export const EmailItem: React.FC<EmailItemProps & Actionable> = ({ from, subject, preview, timestamp, read, action, onExecuteAction }) => (
  <div
    className={`flex items-start gap-4 p-4 border-b border-white/5 ${read ? 'opacity-60' : ''} ${action ? 'cursor-pointer hover:bg-white/5 card-hover transition-all' : ''}`}
    onClick={() => action && onExecuteAction(action)}
  >
    <div className={`w-2.5 h-2.5 mt-2 rounded-full ${read ? 'bg-gray-500' : 'bg-blue-500 glow-blue'} flex-shrink-0`}></div>
    <div className="flex-grow overflow-hidden">
      <div className="flex justify-between items-baseline">
        <p className={`font-semibold ${read ? 'text-gray-300' : 'text-white'}`}>{from}</p>
        <p className="text-xs text-gray-500">{timestamp}</p>
      </div>
      <p className={`text-sm font-medium mt-0.5 ${read ? 'text-gray-400' : 'text-gray-200'}`}>{subject}</p>
      <p className="text-sm text-gray-500 truncate mt-1">{preview}</p>
    </div>
  </div>
);

const weatherIconMap = {
  sun: <SunIcon className="w-16 h-16 text-yellow-400" />,
  cloud: <CloudIcon className="w-16 h-16 text-gray-400" />,
  rain: <RainIcon className="w-16 h-16 text-blue-400" />,
  snow: <SnowIcon className="w-16 h-16 text-white" />,
  storm: <StormIcon className="w-16 h-16 text-indigo-400" />,
};

export const WeatherCard: React.FC<WeatherCardProps> = ({ location, temperature, condition, icon }) => (
  <div className="p-6 flex flex-col items-center justify-center text-center text-white">
    <h2 className="text-2xl font-bold">{location}</h2>
    <div className="my-4">{weatherIconMap[icon] || weatherIconMap['cloud']}</div>
    <p className="text-5xl font-light">{temperature}°</p>
    <p className="text-lg text-gray-300 capitalize">{condition}</p>
  </div>
);

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ trackName, artistName, albumArtUrl, isPlaying }) => (
  <div className="p-6 flex flex-col items-center text-white">
    <img src={albumArtUrl} alt="Album Art" className="w-48 h-48 rounded-lg shadow-lg mb-6" />
    <h3 className="text-xl font-bold">{trackName}</h3>
    <p className="text-gray-400 mb-6">{artistName}</p>
    <div className="w-full h-1 bg-white/20 rounded-full mb-2">
        <div className="w-1/2 h-full bg-white rounded-full"></div>
    </div>
    <div className="flex items-center justify-center gap-6 text-gray-300">
        <button className="hover:text-white transition-colors"><SkipBackIcon className="w-6 h-6" /></button>
        <button className="w-14 h-14 flex items-center justify-center rounded-full bg-white text-gray-900 hover:bg-gray-200 transition-colors">
            {isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8" />}
        </button>
        <button className="hover:text-white transition-colors"><SkipForwardIcon className="w-6 h-6" /></button>
    </div>
  </div>
);

export const Paragraph: React.FC<ParagraphProps> = ({ text }) => (
    <p className="p-5 text-gray-300 leading-relaxed text-sm">{text}</p>
);

export const ButtonGroup: React.FC<ButtonGroupProps & Actionable> = ({ buttons, onExecuteAction }) => (
    <div className="p-4 flex gap-2.5 flex-wrap">
        {buttons.map((button, index) => (
            <button 
                key={index} 
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all btn-hover shadow-lg ${button.variant === 'primary' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 glow' : 'bg-white/10 text-gray-200 hover:bg-white/20 border border-white/20'}`}
                onClick={() => button.action && onExecuteAction(button.action)}
            >
                {button.label}
            </button>
        ))}
    </div>
);

export const CameraView: React.FC<CameraViewProps & Actionable> = ({ prompt, onExecuteAction }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isCaptured, setIsCaptured] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingStart, setRecordingStart] = useState<number | null>(null);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [currentAction, setCurrentAction] = useState<Action | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const animationFrameRef = useRef<number>();

    useEffect(() => {
        const startCamera = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error('Error accessing camera:', err);
                setError('Could not access the camera. Please check permissions.');
            }
        };

        startCamera();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            stream?.getTracks().forEach(track => track.stop());
        };
    }, []);

    useEffect(() => {
        if (isRecording && recordingStart) {
            const updateDuration = () => {
                setRecordingDuration(Date.now() - recordingStart);
                animationFrameRef.current = requestAnimationFrame(updateDuration);
            };
            animationFrameRef.current = requestAnimationFrame(updateDuration);
            return () => {
                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            };
        }
    }, [isRecording, recordingStart]);

    const handlePhotoCapture = useCallback((action: Action) => {
        if (!videoRef.current) return;

        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
            if (blob) {
                setIsCaptured(true);
                setStatusMessage('Photo captured successfully.');
                onExecuteAction(action, { blob });
            }
        }, 'image/jpeg', 0.92);
    }, [onExecuteAction]);

    const handleCapture = useCallback((action: Action) => {
        setCurrentAction(action);
        if (action.type === 'capture_photo') {
            handlePhotoCapture(action);
        } else if (action.type === 'capture_video') {
            if (!isRecording) {
                setStatusMessage('Start recording using the controls below.');
            }
        } else if (action.type === 'capture_audio') {
            setStatusMessage('Starting audio recording...');
        }
    }, [handlePhotoCapture, isRecording]);

    const startRecording = useCallback(async () => {
        if (isRecording || !currentAction || currentAction.type !== 'capture_video') return;
        try {
            if (!stream) {
                setStatusMessage('Camera stream not available.');
                return;
            }

            const mimeType = currentAction.mimeType || 'video/webm;codecs=vp9,opus';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                console.warn(`MIME type ${mimeType} not supported. Falling back to video/webm`);
            }

            const recorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'video/webm'
            });

            recordedChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };

            recorder.onstart = () => {
                setIsRecording(true);
                setRecordingStart(Date.now());
                setRecordingDuration(0);
                setStatusMessage('Recording started...');
            };

            recorder.onerror = (event) => {
                console.error('MediaRecorder error:', event);
                setStatusMessage('Recording error occurred.');
                setIsRecording(false);
            };

            recorder.start();
            setMediaRecorder(recorder);
        } catch (error) {
            console.error('Failed to start recording:', error);
            setStatusMessage('Recording failed to start.');
        }
    }, [currentAction, isRecording, stream]);

    const stopRecording = useCallback(async () => {
        if (!isRecording || !currentAction || currentAction.type !== 'capture_video') return;
        try {
            if (mediaRecorder) {
                await new Promise<void>((resolve) => {
                    mediaRecorder.onstop = () => resolve();
                    mediaRecorder.stop();
                });
            }

            const blob = new Blob(recordedChunksRef.current, { type: mediaRecorder?.mimeType || 'video/webm' });
            const filename = currentAction.filename.replace('${Date.Now()}', Date.now().toString());

            setIsRecording(false);
            setRecordingStart(null);
            setRecordingDuration(0);
            setStatusMessage('Recording saved successfully.');

            onExecuteAction({ type: 'stop_recording', filename }, { blob, filename, mimeType: blob.type, duration: recordingDuration });
        } catch (error) {
            console.error('Failed to stop recording:', error);
            setStatusMessage('Error stopping recording.');
        }
    }, [currentAction, isRecording, mediaRecorder, onExecuteAction, recordingDuration]);

    if (error) {
        return <div className="p-4 text-red-400">{error}</div>;
    }

    const recordingSeconds = Math.floor(recordingDuration / 1000);
    const formattedDuration = `${String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:${String(recordingSeconds % 60).padStart(2, '0')}`;

    return (
        <div className="relative bg-black rounded-lg overflow-hidden">
            <div className="aspect-video bg-black">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" muted></video>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                {prompt ? (
                    <div className="px-3 py-2 bg-black/60 rounded-lg text-white text-sm font-medium shadow-lg">
                        {isCaptured ? 'Captured!' : prompt}
                    </div>
                ) : (
                    <div />
                )}
                {isRecording && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-600/90 rounded-full text-white text-sm font-semibold shadow-lg">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                        Recording {formattedDuration}
                    </div>
                )}
            </div>
            {statusMessage && (
                <div className="absolute bottom-28 left-1/2 -translate-x-1/2 px-3 py-2 bg-black/60 text-white text-sm rounded-md">
                    {statusMessage}
                </div>
            )}
            <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-3">
                {currentAction?.type === 'capture_video' ? (
                    <div className="flex items-center gap-3 bg-black/50 px-4 py-3 rounded-full backdrop-blur-md border border-white/10">
                        <button
                            className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-semibold transition-colors ${isRecording ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}
                            onClick={isRecording ? stopRecording : startRecording}
                        >
                            {isRecording ? '■' : '●'}
                        </button>
                        <div className="flex flex-col text-sm text-white/90">
                            <span>{isRecording ? 'Tap to stop recording' : 'Tap to start recording'}</span>
                            <span className="text-xs text-white/70">Saved as: {currentAction.filename}</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-6">
                        <button
                            className={`w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm border-2 border-white flex items-center justify-center text-white transition ${isCaptured ? 'opacity-60' : 'hover:bg-white/50'}`}
                            onClick={() => currentAction && handlePhotoCapture(currentAction)}
                            disabled={!currentAction || currentAction.type !== 'capture_photo'}
                        >
                            <ShutterIcon className="w-8 h-8" />
                        </button>
                        <span className="text-sm text-white/80">
                            Use the "Capture Photo" action button below to take a picture
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export const TextInput: React.FC<TextInputProps> = ({ id, label, placeholder }) => (
    <div className="p-4">
        <label htmlFor={id} className="block text-sm font-semibold text-gray-300 mb-2">{label}</label>
        <input
            type="text"
            id={id}
            name={id}
            placeholder={placeholder}
            className="w-full h-11 px-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none input-focus transition-all"
        />
    </div>
);

export const DateInput: React.FC<DateInputProps> = ({ id, label }) => (
    <div className="p-4 pt-0">
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <input
            type="date"
            id={id}
            name={id}
            className="w-full h-10 px-3 bg-white/5 border border-white/20 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            style={{ colorScheme: 'dark' }}
        />
    </div>
);

export const FileExplorer: React.FC<FileExplorerProps & Actionable> = ({ files, onExecuteAction }) => (
    <div className="p-3">
        {files.length === 0 ? (
            <div className="p-8 text-center">
                <FileIcon className="w-16 h-16 text-gray-600 mx-auto mb-3 opacity-50" />
                <p className="text-gray-400 text-sm">No files found</p>
            </div>
        ) : (
            <div className="grid grid-cols-3 gap-3 p-2">
                {files.map((file, index) => (
                    <div 
                        key={index} 
                        className={`flex flex-col items-center justify-center aspect-square bg-white/5 rounded-lg p-2.5 text-center hover:bg-white/10 card-hover border border-white/10 ${file.action ? 'cursor-pointer' : ''}`}
                        onClick={() => file.action && onExecuteAction(file.action)}
                    >
                        {file.type === 'image' && file.url ? (
                             <img src={file.url} alt={file.name} className="w-full h-full object-cover rounded-md shadow-lg" />
                        ) : (
                            <FileIcon className="w-10 h-10 text-gray-400 mb-2" />
                        )}
                        <p className="text-xs text-gray-300 truncate w-full mt-2 font-medium" title={file.name}>{file.name}</p>
                    </div>
                ))}
            </div>
        )}
    </div>
);

export const EventItem: React.FC<EventItemProps & Actionable> = ({ time, title, action, onExecuteAction }) => (
    <div 
        className={`flex items-center gap-3 p-2 rounded-md hover:bg-white/10 ${action ? 'cursor-pointer' : ''}`}
        onClick={() => action && onExecuteAction(action)}
    >
        <span className="text-sm font-semibold text-gray-300 w-16 text-right">{time}</span>
        <div className="w-1 h-8 bg-purple-500 rounded-full"></div>
        <span className="text-sm text-gray-100">{title}</span>
    </div>
);

export const CalendarView: React.FC<CalendarViewProps> = ({ year, month, events }) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date(year, month - 1, new Date().getDate()));

    const date = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfMonth = date.getDay(); // 0 = Sunday, 1 = Monday...

    const eventsByDate = new Map(events.map(e => [e.date, e.items]));

    const renderDays = () => {
        const dayElements = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            dayElements.push(<div key={`empty-${i}`} className="w-full aspect-square"></div>);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(year, month - 1, day);
            const dateString = currentDate.toISOString().split('T')[0];
            const hasEvent = eventsByDate.has(dateString);

            dayElements.push(
                <div 
                    key={day} 
                    className={`w-full aspect-square flex items-center justify-center rounded-full cursor-pointer transition-colors ${
                        selectedDate?.getDate() === day ? 'bg-purple-600 text-white' : 'hover:bg-white/10'
                    }`}
                    onClick={() => setSelectedDate(currentDate)}
                >
                    <span className={`relative ${hasEvent && 'font-bold'}`}>
                        {day}
                        {hasEvent && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full"></div>}
                    </span>
                </div>
            );
        }
        return dayElements;
    };
    
    const selectedDateString = selectedDate?.toISOString().split('T')[0];
    const eventsForSelectedDay = selectedDateString ? eventsByDate.get(selectedDateString) || [] : [];

    return (
        <div className="p-4">
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 text-sm">
                {renderDays()}
            </div>
            {selectedDate && (
                 <div className="mt-4 border-t border-white/10 pt-4">
                    <h3 className="font-semibold text-lg mb-2">
                        Events for {selectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                    </h3>
                    {eventsForSelectedDay && Array.isArray(eventsForSelectedDay) && eventsForSelectedDay.length > 0 ? (
                        <div className="space-y-1">
                             {eventsForSelectedDay.map((event: any) => <EventItem key={event.id} {...event} />)}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm">No events scheduled for this day.</p>
                    )}
                 </div>
            )}
        </div>
    );
};

export const Chart: React.FC<ChartProps> = ({ type, data, title, width = 400, height = 300 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !data.length) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        if (type === 'pie') {
            drawPieChart(ctx, data, width, height);
        } else if (type === 'bar') {
            drawBarChart(ctx, data, width, height);
        } else if (type === 'line') {
            drawLineChart(ctx, data, width, height);
        }
    }, [data, type, width, height]);

    const drawPieChart = (ctx: CanvasRenderingContext2D, data: any[], w: number, h: number) => {
        const centerX = w / 2;
        const centerY = h / 2;
        const radius = Math.min(w, h) / 2 - 20;
        
        const total = data.reduce((sum, item) => sum + item.value, 0);
        let currentAngle = -Math.PI / 2;

        const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

        data.forEach((item, index) => {
            const sliceAngle = (item.value / total) * 2 * Math.PI;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            
            ctx.fillStyle = item.color || colors[index % colors.length];
            ctx.fill();
            
            ctx.strokeStyle = '#1F2937';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Add labels
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
            const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(item.label, labelX, labelY);
            
            currentAngle += sliceAngle;
        });
    };

    const drawBarChart = (ctx: CanvasRenderingContext2D, data: any[], w: number, h: number) => {
        const padding = 40;
        const chartWidth = w - padding * 2;
        const chartHeight = h - padding * 2;
        const barWidth = chartWidth / data.length - 10;
        const maxValue = Math.max(...data.map(d => d.value));

        const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

        data.forEach((item, index) => {
            const barHeight = (item.value / maxValue) * chartHeight;
            const x = padding + index * (barWidth + 10);
            const y = h - padding - barHeight;

            ctx.fillStyle = item.color || colors[index % colors.length];
            ctx.fillRect(x, y, barWidth, barHeight);

            // Add labels
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(item.label, x + barWidth / 2, h - padding + 15);
            ctx.fillText(item.value.toString(), x + barWidth / 2, y - 5);
        });
    };

    const drawLineChart = (ctx: CanvasRenderingContext2D, data: any[], w: number, h: number) => {
        const padding = 40;
        const chartWidth = w - padding * 2;
        const chartHeight = h - padding * 2;
        const maxValue = Math.max(...data.map(d => d.value));

        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 3;
        ctx.beginPath();

        data.forEach((item, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = h - padding - (item.value / maxValue) * chartHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            // Draw points
            ctx.fillStyle = '#3B82F6';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();

            // Add labels
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(item.label, x, h - padding + 15);
        });

        ctx.stroke();
    };

    return (
        <div className="p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-100">{title}</h3>
            <div className="bg-gray-800 p-4 rounded-lg">
                <canvas 
                    ref={canvasRef}
                    width={width}
                    height={height}
                    className="max-w-full h-auto"
                />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
                {data.map((item, index) => (
                    <div key={item.label} className="flex items-center space-x-2">
                        <div 
                            className="w-4 h-4 rounded" 
                            style={{ backgroundColor: item.color || ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'][index % 8] }}
                        />
                        <span className="text-sm text-gray-300">{item.label}: {item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};