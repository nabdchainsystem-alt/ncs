import React from 'react';
import { Stage, Layer, FastLayer, Rect, Text, Group } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Stage as KonvaStage } from 'konva/lib/Stage';
import { Boxes, Download, Gauge, RefreshCw, Ruler, ZoomIn, ZoomOut } from 'lucide-react';
import { InView } from 'react-intersection-observer';

import BaseCard from '../ui/BaseCard';
import { StatCard } from '../shared';
import { useAllInventoryItems } from '../../features/inventory/hooks';
import type {
  ClusterCell,
  PalletPlacement,
  WorkerInitDoneMessage,
  WorkerOutboundMessage,
  WorkerTilesMessage,
  WorkerMeta,
  WorkerTile,
  WorkerViewport,
} from '../../workers/warehouseTypes';
import { WORKER_TILE_SIZE } from '../../workers/warehouseTypes';
// eslint-disable-next-line import/no-unresolved
import WarehouseLayoutWorker from '../../workers/warehouseLayout.worker?worker';

const COLORS = ['#4F46E5', '#06B6D4', '#22C55E', '#F59E0B', '#E11D48', '#A855F7', '#0EA5E9', '#84CC16'];
const PADDING = 24;
const TILE_W = 34;
const TILE_H = 22;
const LOD = 1.6;
const TILE_CACHE_LIMIT = 180;

function throttle<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let last = 0;
  let timeout: number | null = null;
  let pendingArgs: any[] | null = null;

  const invoke = (args: any[]) => {
    last = performance.now();
    fn(...args);
  };

  return (...args: any[]) => {
    const now = performance.now();
    const remaining = ms - (now - last);

    if (remaining <= 0) {
      if (timeout) {
        window.clearTimeout(timeout);
        timeout = null;
      }
      invoke(args);
    } else {
      pendingArgs = args;
      if (!timeout) {
        timeout = window.setTimeout(() => {
          if (pendingArgs) {
            invoke(pendingArgs);
            pendingArgs = null;
          }
          timeout = null;
        }, remaining);
      }
    }
  };
}

type UseContainerSizeResult<T extends HTMLElement> = {
  ref: React.RefObject<T>;
  size: { w: number; h: number };
};

function useContainerSize<T extends HTMLElement>(): UseContainerSizeResult<T> {
  const ref = React.useRef<T | null>(null);
  const [size, setSize] = React.useState({ w: 960, h: 420 });

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const rect = entry.contentRect;
      setSize({
        w: Math.max(320, rect.width),
        h: Math.max(320, rect.height || 420),
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, size };
}

function uniqueSorted(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => (value ?? 'Unassigned').trim() || 'Unassigned'))).sort();
}

function colorForCategory(category: string): string {
  const hash = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return COLORS[Math.abs(hash) % COLORS.length];
}

function computeViewport(
  scale: number,
  offset: { x: number; y: number },
  size: { w: number; h: number },
) {
  const safeScale = scale > 0 ? scale : 1;
  return {
    x: (-offset.x) / safeScale,
    y: (-offset.y) / safeScale,
    w: size.w / safeScale,
    h: size.h / safeScale,
    scale: safeScale,
  };
}

export default function Warehouse2DLayoutBlock() {
  const { data: items = [], isLoading, refetch } = useAllInventoryItems();
  const { ref: hostRef, size } = useContainerSize<HTMLDivElement>();
  const stageRef = React.useRef<KonvaStage | null>(null);

  const workerInstanceRef = React.useRef<Worker | null>(null);
  const [workerReady, setWorkerReady] = React.useState(false);
  const [workerError, setWorkerError] = React.useState(false);
  const workerInitializedRef = React.useRef(false);

  const scaleRef = React.useRef(1);
  const [scale, setScale] = React.useState(1);
  const offsetRef = React.useRef({ x: 0, y: 0 });

  const [warehouseFilter, setWarehouseFilter] = React.useState('All');
  const [categoryFilter, setCategoryFilter] = React.useState('All');
  const [preset, setPreset] = React.useState<'euro' | 'us' | 'custom'>('euro');
  const [customUnits, setCustomUnits] = React.useState(50);

  const palletUnits = React.useMemo(() => {
    if (preset === 'euro') return 50;
    if (preset === 'us') return 60;
    return Math.max(1, customUnits || 1);
  }, [preset, customUnits]);

  const warehouses = React.useMemo(() => ['All', ...uniqueSorted(items.map((item) => item.warehouse))], [items]);
  const categories = React.useMemo(() => ['All', ...uniqueSorted(items.map((item) => item.category))], [items]);

  const [gridKey, setGridKey] = React.useState(0);
  const gridImageRef = React.useRef<HTMLImageElement | null>(null);

  const tileCacheRef = React.useRef<Map<string, WorkerTile>>(new Map());
  const [visibleTileIds, setVisibleTileIds] = React.useState<string[]>([]);
  const [meta, setMeta] = React.useState<WorkerMeta>({ totalPallets: 0, distinctBuckets: 0, categories: [] });
  const [capacity, setCapacity] = React.useState(100);

  const requestSeqRef = React.useRef(0);
  const viewportFrameRef = React.useRef<number | null>(null);
  const latestRequestIdRef = React.useRef(0);
  const pendingViewportRef = React.useRef<WorkerViewport | null>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      setWorkerReady(false);
      setWorkerError(true);
      return;
    }

    let worker: Worker | null = null;

    try {
      worker = new WarehouseLayoutWorker();
      workerInstanceRef.current = worker;
      setWorkerReady(true);
      setWorkerError(false);
    } catch (error) {
      console.error('warehouse layout worker init failed', error);
      setWorkerReady(false);
      setWorkerError(true);
      workerInstanceRef.current = null;
    }

    return () => {
      worker?.terminate();
      workerInstanceRef.current = null;
      workerInitializedRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_W;
    canvas.height = TILE_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#F3F4F6';
    ctx.fillRect(canvas.width - 1, 0, 1, canvas.height);
    ctx.fillRect(0, canvas.height - 1, canvas.width, 1);

    const img = new Image();
    img.src = canvas.toDataURL();
    img.onload = () => {
      gridImageRef.current = img;
      setGridKey((value) => value + 1);
    };
  }, []);

  const sendViewportToWorker = React.useCallback(
    (viewport: WorkerViewport) => {
      const worker = workerInstanceRef.current;
      if (!worker) return;
      const requestId = ++requestSeqRef.current;
      latestRequestIdRef.current = requestId;
      worker.postMessage({ type: 'updateViewport', viewport, requestId });
    },
    [],
  );

  const requestViewport = React.useCallback(
    (viewport: WorkerViewport) => {
      if (!workerInitializedRef.current) {
        pendingViewportRef.current = viewport;
        return;
      }
      pendingViewportRef.current = viewport;
      sendViewportToWorker(viewport);
    },
    [sendViewportToWorker],
  );

  const updateViewport = React.useCallback(
    (scaleValue: number, offsetValue: { x: number; y: number }) => {
      const viewport = computeViewport(scaleValue, offsetValue, { w: size.w, h: size.h });
      requestViewport(viewport);
    },
    [requestViewport, size.w, size.h],
  );

  const scheduleViewportUpdate = React.useCallback(() => {
    if (viewportFrameRef.current !== null) return;
    viewportFrameRef.current = window.requestAnimationFrame(() => {
      viewportFrameRef.current = null;
      updateViewport(scaleRef.current, offsetRef.current);
    });
  }, [updateViewport]);

  React.useEffect(() => () => {
    if (viewportFrameRef.current !== null) {
      window.cancelAnimationFrame(viewportFrameRef.current);
    }
  }, []);

  const handleWorkerMessage = React.useCallback(
    (event: MessageEvent<WorkerOutboundMessage>) => {
      const data = event.data;
      if (data.type === 'error') {
        console.error('warehouse worker error', data.message);
        setWorkerError(true);
        return;
      }

      if (data.type === 'initDone') {
        const payload = data as WorkerInitDoneMessage;
        tileCacheRef.current.clear();
        setMeta(payload.meta);
        workerInitializedRef.current = true;
        const pendingViewport = pendingViewportRef.current;
        if (pendingViewport) {
          sendViewportToWorker(pendingViewport);
        }
        return;
      }

      if (data.type === 'tiles') {
        const payload = data as WorkerTilesMessage;
        if (payload.requestId !== latestRequestIdRef.current) return;
        const cache = tileCacheRef.current;
        payload.tiles.forEach((tile) => {
          cache.delete(tile.id);
          cache.set(tile.id, tile);
          if (cache.size > TILE_CACHE_LIMIT) {
            const firstKey = cache.keys().next().value;
            if (firstKey) cache.delete(firstKey);
          }
        });
        setVisibleTileIds(payload.tiles.map((tile) => tile.id));
        setMeta(payload.meta);
      }
    },
    [sendViewportToWorker],
  );

  React.useEffect(() => {
    const worker = workerInstanceRef.current;
    if (!worker) return;
    worker.addEventListener('message', handleWorkerMessage);
    return () => worker.removeEventListener('message', handleWorkerMessage);
  }, [handleWorkerMessage]);

  React.useEffect(() => {
    if (!workerReady || !workerInstanceRef.current) return;

    const worker = workerInstanceRef.current;
    workerInitializedRef.current = false;
    const areaW = size.w;
    const areaH = size.h;
    const config = {
      palletUnits,
      warehouseFilter,
      categoryFilter,
      areaW,
      areaH,
      padding: PADDING,
      cellWidth: TILE_W,
      cellHeight: TILE_H,
      tileSize: WORKER_TILE_SIZE,
      lod: LOD,
    };

    tileCacheRef.current.clear();
    pendingViewportRef.current = computeViewport(scaleRef.current, offsetRef.current, { w: areaW, h: areaH });
    latestRequestIdRef.current = 0;
    setWorkerError(false);

    worker.postMessage({ type: 'init', items, config });

    return () => {
      worker.postMessage({ type: 'dispose' });
      workerInitializedRef.current = false;
    };
  }, [items, palletUnits, warehouseFilter, categoryFilter, size.w, size.h, workerReady]);

  React.useEffect(() => {
    setCapacity((previous) => {
      const base = meta.totalPallets || 1;
      return previous < base ? base : previous;
    });
  }, [meta.totalPallets]);

  const applyScale = React.useCallback(
    (nextScale: number) => {
      const clamped = Math.min(4, Math.max(0.5, Number(nextScale.toFixed(2))));
      scaleRef.current = clamped;
      setScale(clamped);
      scheduleViewportUpdate();
    },
    [scheduleViewportUpdate],
  );

  const handleWheel = React.useMemo(
    () =>
      throttle((event: WheelEvent) => {
        event.preventDefault();
        const direction = Math.sign(event.deltaY);
        applyScale(scaleRef.current + (direction > 0 ? -0.1 : 0.1));
      }, 16),
    [applyScale],
  );

  React.useEffect(() => {
    const element = hostRef.current;
    if (!element) return;
    const handler = (event: WheelEvent) => handleWheel(event);
    element.addEventListener('wheel', handler, { passive: false });
    return () => element.removeEventListener('wheel', handler as EventListener);
  }, [handleWheel, hostRef, size.w, size.h]);

  const handleDragMove = React.useCallback(
    (event: KonvaEventObject<DragEvent>) => {
      const target = event.target as KonvaStage;
      const pos = target.position();
      offsetRef.current = { x: pos.x, y: pos.y };
      scheduleViewportUpdate();
    },
    [scheduleViewportUpdate],
  );

  const handleDragEnd = React.useCallback(
    (event: KonvaEventObject<DragEvent>) => {
      const target = event.target as KonvaStage;
      const pos = target.position();
      offsetRef.current = { x: pos.x, y: pos.y };
      target.getStage()?.batchDraw();
      scheduleViewportUpdate();
    },
    [scheduleViewportUpdate],
  );

  const resetView = React.useCallback(() => {
    offsetRef.current = { x: 0, y: 0 };
    scaleRef.current = 1;
    setScale(1);
    const stage = stageRef.current;
    stage?.position({ x: 0, y: 0 });
    stage?.batchDraw();
    scheduleViewportUpdate();
  }, [scheduleViewportUpdate]);

  const exportPng = React.useCallback(() => {
    const dataUrl = stageRef.current?.toDataURL({ pixelRatio: 2 });
    if (!dataUrl) return;
    const anchor = document.createElement('a');
    anchor.href = dataUrl;
    anchor.download = 'warehouse-2d.png';
    anchor.click();
  }, []);

  const legendEntries = React.useMemo(() => categories.slice(1, 1 + COLORS.length), [categories]);

  const visibleTiles = React.useMemo(() => {
    const cache = tileCacheRef.current;
    return visibleTileIds
      .map((id) => cache.get(id))
      .filter((tile): tile is WorkerTile => Boolean(tile));
  }, [visibleTileIds]);

  const aggregatedCells = React.useMemo(() => {
    if (scale >= LOD) return [] as ClusterCell[];
    const cells: ClusterCell[] = [];
    for (const tile of visibleTiles) {
      if (tile.clusters) cells.push(...tile.clusters);
    }
    return cells;
  }, [visibleTiles, scale]);

  const detailedPallets = React.useMemo(() => {
    if (scale < LOD) return [] as PalletPlacement[];
    const list: PalletPlacement[] = [];
    for (const tile of visibleTiles) {
      if (tile.pallets) list.push(...tile.pallets);
    }
    return list;
  }, [visibleTiles, scale]);

  const occupancy = capacity > 0 ? Math.min(100, Math.round((meta.totalPallets / capacity) * 100)) : 0;

  return (
    <BaseCard title="Warehouse 2D Layout" subtitle="Auto-render pallets from live inventory using a 2D grid">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Pallets Used" value={meta.totalPallets} icon={<Boxes className="h-5 w-5" />} delta={null} />
          <StatCard label="Occupancy" value={occupancy} valueFormat="percent" icon={<Gauge className="h-5 w-5" />} delta={null} />
          <div className="rounded-2xl border bg-white p-4 shadow-sm dark:bg-gray-900">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
              <Ruler className="h-4 w-4" /> Pallet Units
            </div>
            <div className="mt-2 space-y-2">
              <select
                value={preset}
                onChange={(event) => setPreset(event.target.value as 'euro' | 'us' | 'custom')}
                className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="euro">Euro (120×80) • 50 units</option>
                <option value="us">US (48×40) • 60 units</option>
                <option value="custom">Custom…</option>
              </select>
              {preset === 'custom' && (
                <input
                  type="number"
                  min={1}
                  value={customUnits}
                  onChange={(event) => setCustomUnits(Number(event.target.value || 1))}
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-gray-700 dark:bg-gray-900"
                />
              )}
            </div>
          </div>
          <div className="rounded-2xl border bg-white p-4 shadow-sm dark:bg-gray-900">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Capacity Override</div>
            <input
              type="number"
              min={meta.totalPallets || 1}
              value={capacity}
              onChange={(event) => setCapacity(Math.max(meta.totalPallets || 1, Number(event.target.value || 1)))}
              className="mt-2 w-full rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
        </div>

        <div className="lg:col-span-6 grid grid-cols-2 items-end gap-2 sm:grid-cols-4">
          <div className="col-span-1 sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-300">Warehouse</label>
            <select
              value={warehouseFilter}
              onChange={(event) => setWarehouseFilter(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-gray-700 dark:bg-gray-900"
            >
              {warehouses.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-1 sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-300">Category</label>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-gray-700 dark:bg-gray-900"
            >
              {categories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2 flex items-center gap-2 sm:justify-end">
            <button type="button" className="btn-icon" onClick={() => applyScale(scaleRef.current + 0.1)} aria-label="Zoom in">
              <ZoomIn className="h-4 w-4" />
            </button>
            <button type="button" className="btn-icon" onClick={() => applyScale(scaleRef.current - 0.1)} aria-label="Zoom out">
              <ZoomOut className="h-4 w-4" />
            </button>
            <button type="button" className="btn-icon" onClick={resetView} aria-label="Reset view">
              Reset
            </button>
            <button type="button" className="btn-icon" onClick={exportPng} aria-label="Export PNG">
              <Download className="h-4 w-4" />
            </button>
            <button type="button" className="btn-icon" onClick={() => refetch()} aria-label="Refresh data">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="my-4 flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-300">
        {legendEntries.map((category) => (
          <span key={category} className="inline-flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded" style={{ background: colorForCategory(category) }} />
            {category}
          </span>
        ))}
      </div>

      <InView rootMargin="200px" triggerOnce={false}>
        {({ inView, ref: inViewRef }) => (
          <div ref={inViewRef}>
            {inView ? (
              <div
                ref={hostRef}
                className="relative h-[420px] w-full overflow-hidden rounded-2xl border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950"
              >
                <Stage
                  ref={stageRef}
                  id="wh-2d-stage"
                  width={size.w}
                  height={size.h}
                  pixelRatio={1}
                  scaleX={scale}
                  scaleY={scale}
                  draggable
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                >
                  {gridImageRef.current && (
                    <Layer listening={false}>
                      <Group>
                        <Rect
                          key={gridKey}
                          x={0}
                          y={0}
                          width={size.w}
                          height={size.h}
                          fillPatternImage={gridImageRef.current}
                          fillPatternRepeat="repeat"
                          perfectDrawEnabled={false}
                        />
                      </Group>
                    </Layer>
                  )}

                  {scale < LOD ? (
                    <FastLayer listening={false}>
                      {aggregatedCells.map((cell) => (
                        <Group key={cell.id}>
                          <Rect
                            x={cell.x}
                            y={cell.y}
                            width={cell.w}
                            height={cell.h}
                            fill={colorForCategory(cell.topCategory)}
                            opacity={0.85}
                            perfectDrawEnabled={false}
                          />
                          {cell.count > 1 && (
                            <Text
                              x={cell.x + 2}
                              y={cell.y + 2}
                              text={String(cell.count)}
                              fontSize={9}
                              fill="#FFFFFF"
                              listening={false}
                            />
                          )}
                        </Group>
                      ))}
                    </FastLayer>
                  ) : (
                    <FastLayer listening={false}>
                      {detailedPallets.map((pallet) => (
                        <Rect
                          key={pallet.id}
                          x={pallet.x}
                          y={pallet.y}
                          width={pallet.w}
                          height={pallet.h}
                          cornerRadius={2}
                          fill={colorForCategory(pallet.category)}
                          perfectDrawEnabled={false}
                        />
                      ))}
                    </FastLayer>
                  )}
                </Stage>

                {isLoading ? (
                  <div className="absolute inset-0 grid place-items-center text-sm text-gray-500">Loading inventory…</div>
                ) : null}
                {!workerReady && workerError ? (
                  <div className="absolute inset-0 grid place-items-center text-sm text-red-500">
                    Canvas worker failed to load. Showing empty state.
                  </div>
                ) : null}
                {!isLoading && meta.totalPallets === 0 ? (
                  <div className="absolute inset-0 grid place-items-center text-sm text-gray-500">
                    No pallets to render for current filters.
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="h-[420px] rounded-2xl border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
                <div className="grid h-full place-items-center text-sm text-gray-400">Preparing canvas…</div>
              </div>
            )}
          </div>
        )}
      </InView>
    </BaseCard>
  );
}
