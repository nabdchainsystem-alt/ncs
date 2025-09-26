import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import MindElixir, {
  type MindElixirData,
  type MindElixirInstance,
  type Topic,
} from 'mind-elixir';
import 'mind-elixir/style.css';
import { Markmap } from 'markmap-view';
import { Transformer } from 'markmap-lib';
import {
  Crosshair,
  Expand,
  ExternalLink,
  FileDown,
  FileUp,
  GitBranchPlus,
  ImageDown,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import Button from '../../components/ui/Button';

const CANVAS_STORAGE_KEY = 'mindmap-canvas';
const MARKMAP_STORAGE_KEY = 'mindmap-md';
const DEFAULT_MARKDOWN = `# Mind Map\n\n## Topic A\n- Note 1\n- Note 2\n\n## Topic B\n- Item`;

type TabKey = 'canvas' | 'markmap';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function parseMindElixirData(raw: string | null): MindElixirData | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MindElixirData;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('mind-mapping: failed to parse stored canvas data', error);
    return null;
  }
}

function getDefaultMindElixirData(): MindElixirData {
  return MindElixir.new('Mind Map');
}

export default function MindMapping() {
  const [activeTab, setActiveTab] = useState<TabKey>('canvas');
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() =>
    typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : false,
  );
  const [direction, setDirection] = useState<'ltr' | 'rtl'>(() =>
    typeof document !== 'undefined' && document.documentElement.dir === 'rtl'
      ? 'rtl'
      : 'ltr',
  );
  const mindContainerRef = useRef<HTMLDivElement | null>(null);
  const mindInstanceRef = useRef<MindElixirInstance | null>(null);
  const canvasImportInputRef = useRef<HTMLInputElement | null>(null);
  const markmapImportInputRef = useRef<HTMLInputElement | null>(null);
  const markmapSvgRef = useRef<SVGSVGElement | null>(null);
  const markmapContainerRef = useRef<HTMLDivElement | null>(null);
  const markmapInstanceRef = useRef<Markmap | null>(null);
  const transformer = useMemo(() => new Transformer(), []);

  const persistCanvasData = useCallback((data: MindElixirData) => {
    try {
      window.localStorage.setItem(CANVAS_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('mind-mapping: failed to persist canvas data', error);
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    const syncPrefs = () => {
      setIsDarkMode(root.classList.contains('dark'));
      setDirection(root.dir === 'rtl' ? 'rtl' : 'ltr');
    };

    syncPrefs();

    const observer = new MutationObserver(syncPrefs);
    observer.observe(root, { attributes: true, attributeFilter: ['class', 'dir'] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!mindContainerRef.current) return undefined;

    const root = typeof document !== 'undefined' ? document.documentElement : null;
    const initialData = parseMindElixirData(
      typeof window !== 'undefined'
        ? window.localStorage.getItem(CANVAS_STORAGE_KEY)
        : null,
    ) || getDefaultMindElixirData();

    const mind = new MindElixir({
      el: mindContainerRef.current,
      direction: MindElixir.SIDE,
      draggable: true,
      contextMenu: true,
      toolBar: false,
      keypress: true,
      locale: 'en',
      theme: root?.classList.contains('dark') ? MindElixir.DARK_THEME : MindElixir.THEME,
    });

    const initError = mind.init(initialData);
    if (initError instanceof Error) {
      // eslint-disable-next-line no-console
      console.error('mind-mapping: failed to initialize MindElixir', initError.message);
    } else if (initError) {
      // eslint-disable-next-line no-console
      console.error('mind-mapping: failed to initialize MindElixir', initError);
    } else {
      mind.toCenter();
    }

    const handlePersist = () => {
      try {
        const data = mind.getData();
        window.localStorage.setItem(CANVAS_STORAGE_KEY, JSON.stringify(data));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('mind-mapping: failed to persist canvas data on operation', error);
      }
    };

    mind.bus.addListener('operation', handlePersist);

    mindInstanceRef.current = mind;

    return () => {
      mind.bus.removeListener('operation', handlePersist);
      mind.destroy();
      mindInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const mind = mindInstanceRef.current;
    if (!mind) return;
    const theme = isDarkMode ? MindElixir.DARK_THEME : MindElixir.THEME;
    mind.changeTheme(theme, true);
  }, [isDarkMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(MARKMAP_STORAGE_KEY);
      if (stored && stored.trim().length > 0) {
        setMarkdown(stored);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('mind-mapping: failed to load stored markdown', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const timeoutId = window.setTimeout(() => {
      try {
        window.localStorage.setItem(MARKMAP_STORAGE_KEY, markdown);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('mind-mapping: failed to persist markdown', error);
      }
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [markdown]);

  useEffect(() => {
    const svgElement = markmapSvgRef.current;
    if (!svgElement) return;

    if (!markmapInstanceRef.current) {
      markmapInstanceRef.current = Markmap.create(svgElement, {
        autoFit: true,
        fitRatio: 0.96,
        paddingX: 18,
      });
    }

    const mm = markmapInstanceRef.current;
    const { root } = transformer.transform(markdown);
    void mm.setData(root).then(() => {
      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(() => {
          if (activeTab === 'markmap') {
            void mm.fit();
          }
        });
      }
    });
  }, [markdown, transformer, activeTab]);

  useEffect(() => {
    return () => {
      markmapInstanceRef.current?.destroy();
      markmapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (activeTab !== 'markmap') return;
    const mm = markmapInstanceRef.current;
    if (!mm) return;
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        void mm.fit();
      });
    }
  }, [activeTab]);

  const handleCanvasNew = useCallback(() => {
    const mind = mindInstanceRef.current;
    if (!mind) return;
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Clear current mind map?');
      if (!confirmed) return;
    }
    const fresh = getDefaultMindElixirData();
    mind.refresh(fresh);
    mind.toCenter();
    persistCanvasData(fresh);
  }, [persistCanvasData]);

  const handleAddChild = useCallback(() => {
    const mind = mindInstanceRef.current;
    if (!mind) return;
    void mind.addChild();
  }, []);

  const handleAddSibling = useCallback(() => {
    const mind = mindInstanceRef.current;
    if (!mind) return;
    void mind.insertSibling('after');
  }, []);

  const handleDeleteNode = useCallback(() => {
    const mind = mindInstanceRef.current;
    if (!mind) return;
    const nodes = mind.currentNodes && mind.currentNodes.length > 0
      ? mind.currentNodes
      : mind.currentNode
      ? [mind.currentNode]
      : [];
    if (!nodes?.length) return;
    void mind.removeNodes(nodes);
  }, []);

  const handleToggleExpand = useCallback(() => {
    const mind = mindInstanceRef.current;
    if (!mind) return;
    const target = mind.currentNode ?? (mind.root as Topic | null);
    if (!target) return;
    mind.expandNode(target);
  }, []);

  const handleCenter = useCallback(() => {
    mindInstanceRef.current?.toCenter();
  }, []);

  const handleCanvasImportClick = useCallback(() => {
    canvasImportInputRef.current?.click();
  }, []);

  const handleCanvasImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const mind = mindInstanceRef.current;
    if (!mind) return;
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text) as MindElixirData;
      mind.refresh(json);
      mind.toCenter();
      persistCanvasData(json);
    } catch (error) {
      if (typeof window !== 'undefined') {
        window.alert('Invalid JSON file');
      }
    } finally {
      event.target.value = '';
    }
  }, [persistCanvasData]);

  const handleCanvasExport = useCallback(() => {
    const mind = mindInstanceRef.current;
    if (!mind) return;
    const data = mind.getData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, 'mindmap.json');
  }, []);

  const handleMarkdownNew = useCallback(() => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Clear current mind map?');
      if (!confirmed) return;
    }
    setMarkdown(DEFAULT_MARKDOWN);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(MARKMAP_STORAGE_KEY, DEFAULT_MARKDOWN);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('mind-mapping: failed to reset markdown storage', error);
    }
  }, []);

  const handleMarkdownImportClick = useCallback(() => {
    markmapImportInputRef.current?.click();
  }, []);

  const handleMarkdownImport = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        setMarkdown(text);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('mind-mapping: failed to read markdown file', error);
      } finally {
        event.target.value = '';
      }
    },
    [],
  );

  const cloneSvgWithStyles = useCallback(() => {
    const svgElement = markmapSvgRef.current;
    const mm = markmapInstanceRef.current;
    if (!svgElement || !mm) return null;

    const clone = svgElement.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const styleContent = mm.getStyleContent();
    if (styleContent) {
      const style = document.createElement('style');
      style.innerHTML = styleContent;
      clone.insertBefore(style, clone.firstChild);
    }
    return clone;
  }, []);

  const handleExportSvg = useCallback(() => {
    const svgClone = cloneSvgWithStyles();
    if (!svgClone) return;
    const serializer = new XMLSerializer();
    const markup = serializer.serializeToString(svgClone);
    const blob = new Blob([
      '<?xml version="1.0" encoding="UTF-8"?>\n',
      markup,
    ], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(blob, 'mindmap.svg');
  }, [cloneSvgWithStyles]);

  const handleExportPng = useCallback(async () => {
    const svgClone = cloneSvgWithStyles();
    if (!svgClone) return;
    const serializer = new XMLSerializer();
    const markup = serializer.serializeToString(svgClone);
    const svgBlob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });
      const viewBox = svgClone.viewBox.baseVal;
      const width = viewBox?.width || image.width || svgClone.clientWidth || 1024;
      const height = viewBox?.height || image.height || svgClone.clientHeight || 768;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) return;
      const fallbackBg = '#ffffff';
      if (typeof window !== 'undefined') {
        const container = markmapContainerRef.current ?? svgClone.parentElement;
        const bg = container ? window.getComputedStyle(container).backgroundColor : fallbackBg;
        context.fillStyle = bg && bg !== 'rgba(0, 0, 0, 0)' ? bg : fallbackBg;
      } else {
        context.fillStyle = fallbackBg;
      }
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      const pngBlob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      );
      if (!pngBlob) return;
      downloadBlob(pngBlob, 'mindmap.png');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('mind-mapping: failed to export PNG', error);
    } finally {
      URL.revokeObjectURL(url);
    }
  }, [cloneSvgWithStyles]);

  const handleOpenCoggle = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.open('https://coggle.it/', '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden" dir={direction}>
      <div className="shrink-0 px-4 pt-6 pb-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Mind Mapping</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Build visual mind maps on the canvas or continue with the Markdown mind map preview.
            </p>
          </div>
          <div className="inline-flex items-center rounded-full bg-gray-100 p-1 text-sm dark:bg-gray-800" role="tablist">
            {([
              { key: 'canvas', label: 'Canvas' },
              { key: 'markmap', label: 'Markmap' },
            ] satisfies Array<{ key: TabKey; label: string }>).map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                className={`rounded-full px-3 py-1.5 font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-100'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 px-4 pb-6 sm:px-6 lg:px-8">
        {activeTab === 'canvas' ? (
          <div className="flex h-full min-h-0 flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleCanvasNew} variant="secondary" size="sm">
                <RotateCcw className="mr-2 h-4 w-4" />
                New Map
              </Button>
              <Button onClick={handleAddChild} variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Child
              </Button>
              <Button onClick={handleAddSibling} variant="outline" size="sm">
                <GitBranchPlus className="mr-2 h-4 w-4" />
                Add Sibling
              </Button>
              <Button onClick={handleDeleteNode} variant="outline" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Node
              </Button>
              <Button onClick={handleToggleExpand} variant="outline" size="sm">
                <Expand className="mr-2 h-4 w-4" />
                Expand/Collapse
              </Button>
              <Button onClick={handleCenter} variant="outline" size="sm">
                <Crosshair className="mr-2 h-4 w-4" />
                Center
              </Button>
              <Button onClick={handleCanvasImportClick} variant="outline" size="sm">
                <FileUp className="mr-2 h-4 w-4" />
                Import JSON
              </Button>
              <Button onClick={handleCanvasExport} variant="outline" size="sm">
                <FileDown className="mr-2 h-4 w-4" />
                Export JSON
              </Button>
            </div>
            <div className="flex-1 min-h-0 rounded-2xl border border-gray-200 bg-white shadow-card dark:border-gray-800 dark:bg-gray-950">
              <div ref={mindContainerRef} className="h-full w-full" />
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-0 flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleMarkdownNew} variant="secondary" size="sm">
                <RotateCcw className="mr-2 h-4 w-4" />
                New
              </Button>
              <Button onClick={handleMarkdownImportClick} variant="outline" size="sm">
                <FileUp className="mr-2 h-4 w-4" />
                Import .md
              </Button>
              <Button onClick={handleExportSvg} variant="outline" size="sm">
                <FileDown className="mr-2 h-4 w-4" />
                Export SVG
              </Button>
              <Button onClick={handleExportPng} variant="outline" size="sm">
                <ImageDown className="mr-2 h-4 w-4" />
                Export PNG
              </Button>
              <Button onClick={handleOpenCoggle} variant="ghost" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Coggle
              </Button>
            </div>
            <div className="grid flex-1 min-h-0 gap-4 lg:grid-cols-2">
              <section className="flex min-h-0 flex-col rounded-2xl border border-gray-200 bg-white shadow-card dark:border-gray-800 dark:bg-gray-950">
                <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  Markdown
                </div>
                <textarea
                  value={markdown}
                  onChange={(event) => setMarkdown(event.currentTarget.value)}
                  placeholder="Write Markdown here…"
                  className="flex-1 min-h-0 w-full resize-none bg-transparent px-4 py-3 text-sm font-mono leading-relaxed text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 dark:text-gray-100"
                  spellCheck={false}
                  dir="auto"
                />
              </section>
              <section className="flex min-h-0 flex-col rounded-2xl border border-gray-200 bg-white shadow-card dark:border-gray-800 dark:bg-gray-950">
                <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  Preview
                </div>
                <div ref={markmapContainerRef} className="flex-1 min-h-0 overflow-auto p-4">
                  <svg ref={markmapSvgRef} className="h-full w-full" aria-label="Mind map preview" />
                </div>
              </section>
            </div>
          </div>
        )}
      </div>

      <input
        ref={canvasImportInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleCanvasImport}
      />
      <input
        ref={markmapImportInputRef}
        type="file"
        accept=".md,.markdown,.txt"
        className="hidden"
        onChange={handleMarkdownImport}
      />
    </div>
  );
}
