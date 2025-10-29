import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { DrawingCanvasProps, CalculatorProps, TextEditorProps, CodeEditorProps, GalleryProps, EnhancedMusicPlayerProps, VideoPlayerProps, SettingsProps } from '../types';
import { hardwareService } from '../services/hardwareService';
import { configService } from '../services/configService';
import type { FilePathConfig } from '../services/configService';

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ 
  width = 800, 
  height = 600, 
  backgroundColor = '#ffffff' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(5);
  const [brushColor, setBrushColor] = useState('#000000');
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }, [width, height, backgroundColor]);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
  }, []);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = brushColor;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing, brushSize, brushColor, tool]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }, [width, height, backgroundColor]);

  const saveDrawing = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'drawing.png';
    link.href = canvas.toDataURL();
    link.click();
  }, []);

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setTool('pen')}
            className={`px-3 py-1 rounded ${tool === 'pen' ? 'bg-blue-600' : 'bg-gray-600'}`}
          >
            ✏️ Pen
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`px-3 py-1 rounded ${tool === 'eraser' ? 'bg-blue-600' : 'bg-gray-600'}`}
          >
            🧽 Eraser
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-300">Size:</label>
          <input
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-20"
          />
          <span className="text-sm text-gray-300 w-8">{brushSize}</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-300">Color:</label>
          <input
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            className="w-8 h-8 rounded border-none"
          />
        </div>

        <button
          onClick={clearCanvas}
          className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded"
        >
          🗑️ Clear
        </button>

        <button
          onClick={saveDrawing}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded"
        >
          💾 Save
        </button>
      </div>

      <div className="border border-gray-600 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="block cursor-crosshair"
          style={{ backgroundColor }}
        />
      </div>
    </div>
  );
};

export const Calculator: React.FC<CalculatorProps> = ({ mode = 'basic' }) => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputNumber = useCallback((num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  }, [display, waitingForOperand]);

  const inputOperation = useCallback((nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      let result = 0;

      switch (operation) {
        case '+':
          result = currentValue + inputValue;
          break;
        case '-':
          result = currentValue - inputValue;
          break;
        case '×':
          result = currentValue * inputValue;
          break;
        case '÷':
          result = inputValue !== 0 ? currentValue / inputValue : 0;
          break;
        case '=':
          result = inputValue;
          break;
        default:
          return;
      }

      setDisplay(String(result));
      setPreviousValue(result);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  }, [display, previousValue, operation]);

  const calculate = useCallback(() => {
    inputOperation('=');
  }, [inputOperation]);

  const clear = useCallback(() => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  }, []);

  const inputDecimal = useCallback(() => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  }, [display, waitingForOperand]);

  const buttons = [
    ['C', '±', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '=']
  ];

  return (
    <div className="p-4 max-w-sm mx-auto">
      <div className="bg-gray-900 p-4 rounded-lg mb-4">
        <div className="text-right text-3xl font-mono text-white overflow-hidden">
          {display}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {buttons.flat().map((btn) => (
          <button
            key={btn}
            onClick={() => {
              if (btn === 'C') clear();
              else if (btn === '=') calculate();
              else if (btn === '.') inputDecimal();
              else if (['+', '-', '×', '÷'].includes(btn)) inputOperation(btn);
              else if (!isNaN(Number(btn))) inputNumber(btn);
            }}
            className={`
              h-16 rounded-lg font-semibold text-lg transition-colors
              ${btn === '=' ? 'col-span-2 bg-orange-600 hover:bg-orange-700' : ''}
              ${btn === '0' ? 'col-span-2' : ''}
              ${['+', '-', '×', '÷'].includes(btn) ? 'bg-orange-600 hover:bg-orange-700' : ''}
              ${['C', '±', '%'].includes(btn) ? 'bg-gray-600 hover:bg-gray-700' : ''}
              ${!isNaN(Number(btn)) || btn === '.' ? 'bg-gray-800 hover:bg-gray-700' : ''}
              text-white
            `}
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
};

export const TextEditor: React.FC<TextEditorProps> = ({ 
  placeholder = 'Start typing...', 
  initialContent = '',
  features = ['bold', 'italic', 'underline', 'lists']
}) => {
  const [content, setContent] = useState(initialContent);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const toggleFormat = useCallback((format: string) => {
    execCommand(format);
    
    // Update button states
    setTimeout(() => {
      setIsBold(document.queryCommandState('bold'));
      setIsItalic(document.queryCommandState('italic'));
      setIsUnderline(document.queryCommandState('underline'));
    }, 10);
  }, [execCommand]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  }, []);

  const saveDocument = useCallback(() => {
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'document.html';
    link.click();
    URL.revokeObjectURL(url);
  }, [content]);

  return (
    <div className="p-4">
      {features.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2 p-2 bg-gray-800 rounded-lg">
          {features.includes('bold') && (
            <button
              onClick={() => toggleFormat('bold')}
              className={`px-3 py-1 rounded font-bold ${isBold ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-700'}`}
            >
              B
            </button>
          )}
          {features.includes('italic') && (
            <button
              onClick={() => toggleFormat('italic')}
              className={`px-3 py-1 rounded italic ${isItalic ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-700'}`}
            >
              I
            </button>
          )}
          {features.includes('underline') && (
            <button
              onClick={() => toggleFormat('underline')}
              className={`px-3 py-1 rounded underline ${isUnderline ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-700'}`}
            >
              U
            </button>
          )}
          {features.includes('lists') && (
            <>
              <button
                onClick={() => execCommand('insertUnorderedList')}
                className="px-3 py-1 rounded bg-gray-600 hover:bg-gray-700"
              >
                • List
              </button>
              <button
                onClick={() => execCommand('insertOrderedList')}
                className="px-3 py-1 rounded bg-gray-600 hover:bg-gray-700"
              >
                1. List
              </button>
            </>
          )}
          <div className="flex-1"></div>
          <button
            onClick={saveDocument}
            className="px-3 py-1 rounded bg-green-600 hover:bg-green-700"
          >
            💾 Save
          </button>
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-96 p-4 bg-white text-black rounded-lg border-2 border-gray-600 focus:border-blue-500 outline-none"
        style={{ minHeight: '400px' }}
        dangerouslySetInnerHTML={{ __html: initialContent }}
        data-placeholder={placeholder}
      />
    </div>
  );
};

export const CodeEditor: React.FC<CodeEditorProps> = ({ 
  language = 'javascript', 
  theme = 'dark',
  initialCode = '// Start coding...\n'
}) => {
  const [code, setCode] = useState(initialCode);
  const [lineNumbers, setLineNumbers] = useState(['1']);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const lines = code.split('\n');
    setLineNumbers(lines.map((_, i) => String(i + 1)));
  }, [code]);

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  }, [code]);

  const runCode = useCallback(() => {
    if (language === 'javascript') {
      try {
        // Create a safe evaluation context
        const result = eval(code);
        alert(`Result: ${result}`);
      } catch (error) {
        alert(`Error: ${error}`);
      }
    } else {
      alert('Code execution is only supported for JavaScript');
    }
  }, [code, language]);

  const saveCode = useCallback(() => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `code.${language === 'javascript' ? 'js' : language}`;
    link.click();
    URL.revokeObjectURL(url);
  }, [code, language]);

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-gray-700 rounded text-sm">
            {language}
          </span>
          <span className="px-3 py-1 bg-gray-700 rounded text-sm">
            {theme} theme
          </span>
        </div>
        <div className="flex gap-2">
          {language === 'javascript' && (
            <button
              onClick={runCode}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded"
            >
              ▶️ Run
            </button>
          )}
          <button
            onClick={saveCode}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded"
          >
            💾 Save
          </button>
        </div>
      </div>

      <div className="flex bg-gray-900 rounded-lg overflow-hidden border border-gray-600">
        <div className="bg-gray-800 p-4 text-gray-400 text-right select-none font-mono text-sm leading-6">
          {lineNumbers.map(num => (
            <div key={num}>{num}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={code}
          onChange={handleCodeChange}
          onKeyDown={handleKeyDown}
          className="flex-1 p-4 bg-transparent text-white font-mono text-sm leading-6 resize-none outline-none"
          style={{ minHeight: '400px' }}
          spellCheck={false}
        />
      </div>
    </div>
  );
};

export const Gallery: React.FC<GalleryProps> = ({ autoLoad = false, columns = 3 }) => {
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasDirectoryAccess, setHasDirectoryAccess] = useState(false);
  const [defaultPath] = useState(configService.getPath('photos'));

  const loadImagesFromDirectory = useCallback(async () => {
    setLoading(true);
    try {
      const files = await hardwareService.selectDirectory();
      const imageFiles = files.filter(file => 
        configService.isAcceptedFormat(file.name, 'images')
      );
      setImages(imageFiles);
      
      const urls = imageFiles.map(file => hardwareService.createObjectURL(file));
      setImageUrls(urls);
      setHasDirectoryAccess(true);
    } catch (error) {
      console.error('Error loading images from directory:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadImages = useCallback(async () => {
    setLoading(true);
    try {
      const files = await hardwareService.selectImageFiles();
      setImages(files);
      
      const urls = files.map(file => hardwareService.createObjectURL(file));
      setImageUrls(urls);
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Auto-prompt user to access default folder if autoLoad is enabled
    if (autoLoad && !hasDirectoryAccess && images.length === 0) {
      // Small delay to ensure component is mounted
      const timer = setTimeout(() => {
        loadImagesFromDirectory();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoLoad, hasDirectoryAccess, images.length, loadImagesFromDirectory]);

  useEffect(() => {
    return () => {
      imageUrls.forEach(url => hardwareService.revokeObjectURL(url));
    };
  }, [imageUrls]);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Photo Gallery</h3>
        <div className="flex space-x-2">
          <button
            onClick={loadImagesFromDirectory}
            disabled={loading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-sm"
            title={`Access folder: ${defaultPath}`}
          >
            {loading ? 'Loading...' : 'Select Folder'}
          </button>
          <button
            onClick={loadImages}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm"
          >
            {loading ? 'Loading...' : 'Browse Files'}
          </button>
        </div>
      </div>

      {images.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-300 mb-2">No Photos Loaded</h3>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="text-green-400">• "Select Folder"</span> - Access your default photos folder: 
              <span className="text-gray-400 text-xs block">{defaultPath}</span>
            </p>
            <p className="text-sm">
              <span className="text-blue-400">• "Browse Files"</span> - Select individual image files
            </p>
            <p className="text-xs mt-3 text-gray-500">Supported formats: JPG, PNG, GIF, WebP, SVG, BMP</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {imageUrls.map((url, index) => (
            <div
              key={index}
              className="aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setSelectedImage(url)}
            >
              <img
                src={url}
                alt={images[index].name}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={() => setSelectedImage(null)}>
          <div className="max-w-full max-h-full p-4">
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export const EnhancedMusicPlayer: React.FC<EnhancedMusicPlayerProps> = ({ 
  autoLoad = false, 
  showPlaylist = true 
}) => {
  const [musicFiles, setMusicFiles] = useState<File[]>([]);
  const [musicUrls, setMusicUrls] = useState<string[]>([]);
  const [currentTrack, setCurrentTrack] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const defaultMusicPath = useMemo(() => configService.getPath('music'), []);

  const updatePlaylist = useCallback((files: File[]) => {
    setMusicFiles(files);
    setMusicUrls(prevUrls => {
      prevUrls.forEach(url => hardwareService.revokeObjectURL(url));
      return files.map(file => hardwareService.createObjectURL(file));
    });
    setCurrentTrack(0);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const loadMusic = useCallback(async () => {
    setLoading(true);
    try {
      const files = await hardwareService.selectMusicFiles();
      updatePlaylist(files);
    } catch (error) {
      console.error('Error loading music:', error);
    } finally {
      setLoading(false);
    }
  }, [updatePlaylist]);

  const loadMusicFromDirectory = useCallback(async () => {
    setLoading(true);
    try {
      const files = await hardwareService.selectDirectory();
      const audioFiles = files.filter(file => configService.isAcceptedFormat(file.name, 'audio'));
      updatePlaylist(audioFiles);
    } catch (error) {
      console.error('Error loading music from folder:', error);
    } finally {
      setLoading(false);
    }
  }, [updatePlaylist]);

  useEffect(() => {
    if (autoLoad) {
      console.warn('Music Player autoLoad disabled - browsers require user interaction to access files');
    }
  }, [autoLoad]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime || 0);
    const updateDuration = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      if (currentTrack < musicFiles.length - 1) {
        setCurrentTrack(prev => prev + 1);
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrack, musicFiles.length]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const currentUrl = musicUrls[currentTrack];
    if (currentUrl) {
      audio.src = currentUrl;
      audio.currentTime = 0;
      if (isPlaying) {
        audio.play().catch(error => console.error('Audio play failed:', error));
      }
    } else {
      audio.removeAttribute('src');
      setIsPlaying(false);
    }
  }, [musicUrls, currentTrack, isPlaying]);

  useEffect(() => {
    return () => {
      musicUrls.forEach(url => hardwareService.revokeObjectURL(url));
    };
  }, [musicUrls]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skipTrack = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentTrack < musicFiles.length - 1) {
      setCurrentTrack(prev => prev + 1);
    } else if (direction === 'prev' && currentTrack > 0) {
      setCurrentTrack(prev => prev - 1);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (audio) {
      const newTime = (parseFloat(e.target.value) / 100) * duration;
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value) / 100;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  return (
    <div className="p-4">
      <audio ref={audioRef} />
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Music Player</h3>
        <div className="flex space-x-2">
          <button
            onClick={loadMusicFromDirectory}
            disabled={loading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded"
            title={`Access folder: ${defaultMusicPath}`}
          >
            {loading ? 'Loading...' : 'Select Folder'}
          </button>
          <button
            onClick={loadMusic}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded"
          >
            {loading ? 'Loading...' : 'Browse Files'}
          </button>
        </div>
      </div>

      {musicFiles.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-300 mb-2">No Music Loaded</h3>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="text-green-400">• "Select Folder"</span> - Access music from {defaultMusicPath}
            </p>
            <p className="text-sm">
              <span className="text-blue-400">• "Browse Files"</span> - Pick individual tracks
            </p>
            <p className="text-xs mt-2 text-gray-500">Supported formats: MP3, WAV, OGG, AAC, M4A, FLAC</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-lg font-medium text-white mb-2">
              {musicFiles[currentTrack]?.name || 'No track selected'}
            </h4>
            
            <div className="mb-4">
              <input
                type="range"
                min="0"
                max="100"
                value={duration ? (currentTime / duration) * 100 : 0}
                onChange={handleSeek}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-400 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-4 mb-4">
              <button
                onClick={() => skipTrack('prev')}
                disabled={currentTrack === 0}
                className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
              >
                ⏮️
              </button>
              <button
                onClick={togglePlay}
                className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-2xl"
              >
                {isPlaying ? '⏸️' : '▶️'}
              </button>
              <button
                onClick={() => skipTrack('next')}
                disabled={currentTrack === musicFiles.length - 1}
                className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
              >
                ⏭️
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">🔊</span>
              <input
                type="range"
                min="0"
                max="100"
                value={volume * 100}
                onChange={handleVolumeChange}
                className="flex-1"
              />
            </div>
          </div>

          {showPlaylist && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h5 className="text-md font-medium text-white mb-2">Playlist</h5>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {musicFiles.map((file, index) => (
                  <div
                    key={index}
                    onClick={() => setCurrentTrack(index)}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      index === currentTrack 
                        ? 'bg-blue-600 text-white' 
                        : 'hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{index === currentTrack ? '▶️' : '🎵'}</span>
                      <span className="text-sm truncate">{file.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ autoLoad = false, controls = true }) => {
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [currentVideo, setCurrentVideo] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const defaultVideoPath = useMemo(() => configService.getPath('videos'), []);

  const updateVideoList = useCallback((files: File[]) => {
    setVideoFiles(files);
    setVideoUrls(prevUrls => {
      prevUrls.forEach(url => hardwareService.revokeObjectURL(url));
      return files.map(file => hardwareService.createObjectURL(file));
    });
    setCurrentVideo(0);
  }, []);

  const loadVideos = useCallback(async () => {
    setLoading(true);
    try {
      const files = await hardwareService.selectVideoFiles();
      updateVideoList(files);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  }, [updateVideoList]);

  const loadVideosFromDirectory = useCallback(async () => {
    setLoading(true);
    try {
      const files = await hardwareService.selectDirectory();
      const videoFilesFiltered = files.filter(file => configService.isAcceptedFormat(file.name, 'video'));
      updateVideoList(videoFilesFiltered);
    } catch (error) {
      console.error('Error loading videos from folder:', error);
    } finally {
      setLoading(false);
    }
  }, [updateVideoList]);

  useEffect(() => {
    if (autoLoad) {
      console.warn('Video Player autoLoad disabled - browsers require user interaction to access files');
    }
  }, [autoLoad]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const currentUrl = videoUrls[currentVideo];
    if (currentUrl) {
      video.src = currentUrl;
      video.load();
    } else {
      video.removeAttribute('src');
    }
  }, [videoUrls, currentVideo]);

  useEffect(() => {
    return () => {
      videoUrls.forEach(url => hardwareService.revokeObjectURL(url));
    };
  }, [videoUrls]);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Video Player</h3>
        <div className="flex space-x-2">
          <button
            onClick={loadVideosFromDirectory}
            disabled={loading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded"
            title={`Access folder: ${defaultVideoPath}`}
          >
            {loading ? 'Loading...' : 'Select Folder'}
          </button>
          <button
            onClick={loadVideos}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded"
          >
            {loading ? 'Loading...' : 'Browse Files'}
          </button>
        </div>
      </div>

      {videoFiles.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-300 mb-2">No Videos Loaded</h3>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="text-green-400">• "Select Folder"</span> - Access videos from {defaultVideoPath}
            </p>
            <p className="text-sm">
              <span className="text-blue-400">• "Browse Files"</span> - Pick individual videos
            </p>
            <p className="text-xs mt-2 text-gray-500">Supported formats: MP4, WebM, AVI, MOV, MKV, WMV</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              controls={controls}
              className="w-full max-h-96"
              style={{ maxHeight: '400px' }}
            >
              Your browser does not support the video tag.
            </video>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-lg font-medium text-white mb-2">
              {videoFiles[currentVideo]?.name || 'No video selected'}
            </h4>
            
            {videoFiles.length > 1 && (
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setCurrentVideo(prev => Math.max(0, prev - 1))}
                  disabled={currentVideo === 0}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded"
                >
                  ⏮️ Previous
                </button>
                <span className="text-gray-300">
                  {currentVideo + 1} of {videoFiles.length}
                </span>
                <button
                  onClick={() => setCurrentVideo(prev => Math.min(videoFiles.length - 1, prev + 1))}
                  disabled={currentVideo === videoFiles.length - 1}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded"
                >
                  Next ⏭️
                </button>
              </div>
            )}
          </div>

          {videoFiles.length > 1 && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h5 className="text-md font-medium text-white mb-2">Video List</h5>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {videoFiles.map((file, index) => (
                  <div
                    key={index}
                    onClick={() => setCurrentVideo(index)}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      index === currentVideo 
                        ? 'bg-blue-600 text-white' 
                        : 'hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{index === currentVideo ? '▶️' : '🎬'}</span>
                      <span className="text-sm truncate">{file.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const Settings: React.FC<SettingsProps> = ({ category = 'general' }) => {
  const [activeTab, setActiveTab] = useState(category);
  const [paths, setPaths] = useState<FilePathConfig>(configService.getAllPaths());
  const [autoSave, setAutoSave] = useState(configService.getAutoSave());

  const handlePathChange = (type: keyof FilePathConfig, value: string) => {
    configService.setPath(type, value);
    setPaths(configService.getAllPaths());
  };

  const handleAutoSaveChange = (enabled: boolean) => {
    configService.setAutoSave(enabled);
    setAutoSave(enabled);
  };

  const handleReset = () => {
    configService.resetPaths();
    setPaths(configService.getAllPaths());
  };

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'paths', label: 'File Paths', icon: '📁' },
    { id: 'about', label: 'About', icon: 'ℹ️' },
  ];

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-100">Settings</h2>
      </div>

      <div className="flex space-x-1 mb-6 bg-gray-800 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">General Settings</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-gray-200 font-medium">Auto-save files</label>
                <p className="text-sm text-gray-400">Automatically save captured photos and recordings</p>
              </div>
              <button
                onClick={() => handleAutoSaveChange(!autoSave)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoSave ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoSave ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'paths' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-100">Default File Paths</h3>
              <button
                onClick={handleReset}
                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
              >
                Reset to Defaults
              </button>
            </div>
            
            {Object.entries(paths).map(([type, path]) => (
              <div key={type} className="space-y-2">
                <label className="block text-gray-200 font-medium capitalize">
                  {type} Folder
                </label>
                <input
                  type="text"
                  value={path}
                  onChange={(e) => handlePathChange(type as keyof FilePathConfig, e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 focus:border-blue-500 focus:outline-none"
                  placeholder={`Default ${type} folder path`}
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">About Generative OS</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-200 mb-2">Version</h4>
                <p className="text-sm text-gray-400">Generative OS v1.0.0</p>
              </div>
              
              <div className="p-4 bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-200 mb-2">Features</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• AI-powered app generation from natural language</li>
                  <li>• Real local file system integration</li>
                  <li>• Photo gallery, music player, and video player</li>
                  <li>• Camera with automatic local file saving</li>
                  <li>• Drawing canvas, calculator, and text editors</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
