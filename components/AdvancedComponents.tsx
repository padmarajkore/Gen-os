import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  WebBrowserProps,
  IframeViewProps,
  UrlInputProps,
  TerminalProps,
  MarkdownViewerProps,
  PdfViewerProps,
  TabContainerProps,
  SplitViewProps,
  UIComponent,
  Action
} from '../types';

interface Actionable {
  onExecuteAction: (action: Action, payload?: any) => void;
}

interface RendererCapable {
  renderComponent: (component: UIComponent, index: number) => React.ReactNode;
}

export const WebBrowser: React.FC<WebBrowserProps & Actionable> = ({
  defaultUrl = 'https://example.com',
  showAddressBar = true,
  showControls = true,
  allowNavigation = true,
  sandboxed = false,
  onExecuteAction
}) => {
  const [currentUrl, setCurrentUrl] = useState(defaultUrl);
  const [addressValue, setAddressValue] = useState(defaultUrl);
  const [history, setHistory] = useState<string[]>([defaultUrl]);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    setCurrentUrl(defaultUrl);
    setAddressValue(defaultUrl);
    setHistory([defaultUrl]);
    setHistoryIndex(0);
  }, [defaultUrl]);

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  const navigateTo = (url: string, pushHistory = true) => {
    if (!url) return;
    const normalizedUrl = normaliseUrl(url);
    setCurrentUrl(normalizedUrl);
    setAddressValue(normalizedUrl);

    if (pushHistory) {
      setHistory(prev => {
        const nextHistory = [...prev.slice(0, historyIndex + 1), normalizedUrl];
        setHistoryIndex(nextHistory.length - 1);
        return nextHistory;
      });
    }

    onExecuteAction({ type: 'navigate_url', url: normalizedUrl, target: '_self' });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!allowNavigation) return;
    navigateTo(addressValue);
  };

  const goBack = () => {
    if (!canGoBack) return;
    setHistoryIndex(prev => {
      const newIndex = prev - 1;
      setCurrentUrl(history[newIndex]);
      setAddressValue(history[newIndex]);
      return newIndex;
    });
  };

  const goForward = () => {
    if (!canGoForward) return;
    setHistoryIndex(prev => {
      const newIndex = prev + 1;
      setCurrentUrl(history[newIndex]);
      setAddressValue(history[newIndex]);
      return newIndex;
    });
  };

  const refresh = () => {
    setCurrentUrl(prev => prev);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden border border-white/10">
      {(showAddressBar || showControls) && (
        <div className="flex items-center gap-2 p-3 bg-gray-800 border-b border-white/10">
          {showControls && (
            <div className="flex items-center gap-2">
              <button
                onClick={goBack}
                disabled={!canGoBack || !allowNavigation}
                className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-sm"
              >
                ⬅︎
              </button>
              <button
                onClick={goForward}
                disabled={!canGoForward || !allowNavigation}
                className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-sm"
              >
                ➡︎
              </button>
              <button
                onClick={refresh}
                className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-sm"
              >
                ⟳
              </button>
              <button
                onClick={() => window.open(currentUrl, '_blank')}
                className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-sm"
              >
                ↗︎
              </button>
            </div>
          )}
          {showAddressBar && (
            <form onSubmit={handleSubmit} className="flex-1">
              <input
                value={addressValue}
                onChange={(e) => setAddressValue(e.target.value)}
                disabled={!allowNavigation}
                className="w-full px-3 py-2 rounded bg-gray-900/80 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter URL"
              />
            </form>
          )}
        </div>
      )}
      <div className="flex-1 relative bg-black">
        <iframe
          key={currentUrl}
          src={currentUrl}
          title={currentUrl}
          className="w-full h-full border-0"
          sandbox={sandboxed ? 'allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups' : undefined}
        />
      </div>
    </div>
  );
};


export const IframeView: React.FC<IframeViewProps & Actionable> = ({
  url,
  title,
  width = '100%',
  height = 400,
  sandbox,
  onExecuteAction
}) => {
  useEffect(() => {
    onExecuteAction({ type: 'navigate_url', url, target: '_self' });
  }, [url, onExecuteAction]);

  return (
    <div className="w-full bg-gray-900 rounded-lg border border-white/10 overflow-hidden">
      {title && (
        <div className="px-4 py-2 border-b border-white/10 text-sm text-gray-300 bg-gray-800">
          {title}
        </div>
      )}
      <iframe
        src={url}
        title={title ?? url}
        width={typeof width === 'number' ? `${width}px` : width}
        height={typeof height === 'number' ? `${height}px` : height}
        className="w-full"
        sandbox={sandbox}
      />
    </div>
  );
};

export const UrlInput: React.FC<UrlInputProps & Actionable> = ({
  id,
  label,
  placeholder,
  defaultValue = '',
  onExecuteAction
}) => {
  const [value, setValue] = useState(defaultValue);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!value) return;
    onExecuteAction({ type: 'navigate_url', url: value, target: '_self' });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-2 bg-gray-900 rounded-lg border border-white/10">
      <label htmlFor={id} className="block text-sm font-medium text-gray-300">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          name={id}
          type="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 rounded bg-gray-800 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-sm font-medium"
        >
          Go
        </button>
      </div>
    </form>
  );
};

export const Terminal: React.FC<TerminalProps & Actionable> = ({
  readOnly = false,
  theme = 'dark',
  prompt = '$',
  initialOutput = [],
  onExecuteAction
}) => {
  const [lines, setLines] = useState<string[]>(initialOutput);
  const [command, setCommand] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const appendLine = (line: string) => {
    setLines(prev => [...prev, line]);
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!command.trim()) return;

    const trimmed = command.trim();
    appendLine(`${prompt} ${trimmed}`);
    onExecuteAction({ type: 'execute_command', command: trimmed });
    appendLine('> Command execution is not available in this environment.');
    setCommand('');
  };

  const containerClass = theme === 'dark'
    ? 'bg-black text-green-400'
    : 'bg-gray-100 text-gray-800';

  return (
    <div className={`rounded-lg border border-white/10 overflow-hidden ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="px-4 py-2 text-xs uppercase tracking-wide bg-gray-800 text-gray-400 border-b border-white/10">
        Terminal
      </div>
      <div
        ref={containerRef}
        className={`max-h-80 overflow-y-auto font-mono text-sm px-4 py-3 space-y-1 ${containerClass}`}
      >
        {lines.length === 0 && <div className="text-gray-500">No output yet.</div>}
        {lines.map((line, index) => (
          <div key={index}>{line}</div>
        ))}
      </div>
      {!readOnly && (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3 bg-gray-900 border-t border-white/10">
          <span className="font-mono text-sm text-green-500">{prompt}</span>
          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            className="flex-1 bg-gray-800 text-white font-mono text-sm px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter command"
          />
        </form>
      )}
    </div>
  );
};

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, enableHtml = false }) => {
  const htmlContent = useMemo(() => {
    if (enableHtml) {
      return content;
    }

    let processed = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br />');

    return processed;
  }, [content, enableHtml]);

  return (
    <div className="p-4 bg-gray-900 rounded-lg border border-white/10 prose prose-invert max-w-none">
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </div>
  );
};

export const PdfViewer: React.FC<PdfViewerProps & Actionable> = ({ url, autoLoad = false, onExecuteAction }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(autoLoad ? url ?? null : null);

  useEffect(() => {
    if (autoLoad && url) {
      setPdfUrl(url);
    }
  }, [autoLoad, url]);

  const handleLoad = () => {
    if (!url) return;
    setPdfUrl(url);
    onExecuteAction({ type: 'navigate_url', url, target: '_self' });
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-white/10 overflow-hidden flex flex-col">
      <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between bg-gray-800">
        <span className="text-sm text-gray-300">PDF Viewer</span>
        {!autoLoad && (
          <button
            onClick={handleLoad}
            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded"
          >
            Load PDF
          </button>
        )}
      </div>
      <div className="flex-1 min-h-[400px] bg-black">
        {pdfUrl ? (
          <iframe src={pdfUrl} title="PDF" className="w-full h-full" />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
            No PDF loaded.
          </div>
        )}
      </div>
    </div>
  );
};

function normaliseUrl(value: string) {
  if (!value) return '';
  try {
    return new URL(value).toString();
  } catch {
    return `https://${value}`;
  }
}

export const TabContainer: React.FC<TabContainerProps & Actionable & RendererCapable> = ({
  tabs,
  activeTab,
  onExecuteAction,
  renderComponent
}) => {
  const [currentTab, setCurrentTab] = useState<string>(activeTab ?? (tabs[0]?.id ?? ''));
  const tabMap = useMemo(() => new Map(tabs.map(tab => [tab.id, tab])), [tabs]);

  useEffect(() => {
    if (activeTab && activeTab !== currentTab) {
      setCurrentTab(activeTab);
    }
  }, [activeTab, currentTab]);

  const handleTabClick = useCallback((tabId: string) => {
    setCurrentTab(tabId);
    if (onExecuteAction) {
      onExecuteAction({ type: 'open_tab', tabId });
    }
  }, [onExecuteAction]);

  const current = tabMap.get(currentTab) ?? tabs[0];

  return (
    <div className="bg-gray-900 rounded-lg border border-white/10 overflow-hidden">
      <div className="flex items-center gap-1 px-2 py-2 bg-gray-800 border-b border-white/10 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${tab.id === current?.id ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`}
          >
            {tab.icon && <span dangerouslySetInnerHTML={{ __html: tab.icon }} className="w-4 h-4" />}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="p-3 space-y-3">
        {current?.components?.length ? (
          current.components.map((component, index) => renderComponent(component, index))
        ) : (
          <div className="text-sm text-gray-400">No content available for this tab.</div>
        )}
      </div>
    </div>
  );
};

export const SplitView: React.FC<SplitViewProps & Actionable & RendererCapable> = ({
  orientation,
  leftComponents,
  rightComponents,
  defaultSplit = 50,
  renderComponent
}) => {
  const isHorizontal = orientation === 'horizontal';
  const containerClass = isHorizontal ? 'flex flex-col md:flex-row gap-4' : 'flex flex-col gap-4';
  const leftStyle = isHorizontal ? { flexBasis: `${defaultSplit}%` } : undefined;
  const rightStyle = isHorizontal ? { flexBasis: `${100 - defaultSplit}%` } : undefined;

  return (
    <div className={`bg-gray-900 rounded-lg border border-white/10 p-4 ${containerClass}`}>
      <div className="flex-1 space-y-3" style={leftStyle}>
        {leftComponents?.length ? (
          leftComponents.map((component, index) => renderComponent(component, index))
        ) : (
          <div className="text-sm text-gray-500">No content</div>
        )}
      </div>
      <div className="flex-1 space-y-3" style={rightStyle}>
        {rightComponents?.length ? (
          rightComponents.map((component, index) => renderComponent(component, index + (leftComponents?.length ?? 0)))
        ) : (
          <div className="text-sm text-gray-500">No content</div>
        )}
      </div>
    </div>
  );
};