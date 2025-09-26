/// <reference lib="webworker" />

import type {
  ClusterCell,
  PalletPlacement,
  WorkerConfig,
  WorkerInboundMessage,
  WorkerInitDoneMessage,
  WorkerInventoryItem,
  WorkerMeta,
  WorkerOutboundMessage,
  WorkerTile,
  WorkerTilesMessage,
  WorkerViewport,
} from './warehouseTypes';
import { WORKER_TILE_SIZE } from './warehouseTypes';

type InternalCell = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  count: number;
  catCount: Record<string, number>;
};

type InternalTile = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  pallets: PalletPlacement[];
  catCount: Record<string, number>;
  cells: Map<string, InternalCell>;
  clusters: ClusterCell[];
};

type LayoutResult = {
  placements: PalletPlacement[];
  categories: string[];
  distinctBuckets: number;
};

const state: {
  items: WorkerInventoryItem[];
  config: WorkerConfig | null;
  tiles: Map<string, InternalTile>;
  meta: WorkerMeta;
} = {
  items: [],
  config: null,
  tiles: new Map(),
  meta: { totalPallets: 0, distinctBuckets: 0, categories: [] },
};

function normalize(value: string | null | undefined): string {
  const trimmed = (value ?? 'Unassigned').trim();
  return trimmed.length ? trimmed : 'Unassigned';
}

function clampPositive(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function aggregateAndPlace(items: WorkerInventoryItem[], config: WorkerConfig): LayoutResult {
  const safeUnits = clampPositive(config.palletUnits, 1);
  const bucketMap = new Map<string, { warehouse: string; category: string; pallets: number }>();
  const categories = new Set<string>();

  for (const item of items) {
    const warehouse = normalize(item.warehouse);
    const category = normalize(item.category);

    if (config.warehouseFilter !== 'All' && warehouse !== config.warehouseFilter) {
      continue;
    }
    if (config.categoryFilter !== 'All' && category !== config.categoryFilter) {
      continue;
    }

    const qty = Number(item.qty) || 0;
    if (qty <= 0) continue;

    const pallets = Math.ceil(Math.max(0, qty) / safeUnits);
    if (pallets <= 0) continue;

    categories.add(category);

    const key = `${warehouse}__${category}`;
    const current = bucketMap.get(key);
    if (current) {
      current.pallets += pallets;
    } else {
      bucketMap.set(key, { warehouse, category, pallets });
    }
  }

  const buckets = Array.from(bucketMap.values()).filter((bucket) => bucket.pallets > 0);
  buckets.sort((a, b) => b.pallets - a.pallets);

  return {
    placements: layoutPallets(buckets, config),
    categories: Array.from(categories.values()).sort(),
    distinctBuckets: buckets.length,
  };
}

function layoutPallets(
  buckets: Array<{ warehouse: string; category: string; pallets: number }>,
  config: WorkerConfig,
): PalletPlacement[] {
  if (buckets.length === 0) return [];

  const padding = clampPositive(config.padding, 0);
  const cellWidth = clampPositive(config.cellWidth, 1);
  const cellHeight = clampPositive(config.cellHeight, 1);
  const areaWidth = Math.max(config.areaW, padding * 2 + cellWidth);
  const usableWidth = Math.max(1, areaWidth - padding * 2);
  const columns = Math.max(1, Math.floor(usableWidth / cellWidth));

  let index = 0;
  const placements: PalletPlacement[] = [];

  for (const bucket of buckets) {
    for (let p = 0; p < bucket.pallets; p += 1) {
      const col = index % columns;
      const row = Math.floor(index / columns);

      placements.push({
        id: `${bucket.warehouse}:${bucket.category}:${index}`,
        x: padding + col * cellWidth,
        y: padding + row * cellHeight,
        w: Math.max(1, cellWidth - 2),
        h: Math.max(1, cellHeight - 2),
        category: bucket.category,
        warehouse: bucket.warehouse,
      });

      index += 1;
    }
  }

  return placements;
}

function pickTopCategory(catCount: Record<string, number>): string {
  let top = 'Mixed';
  let max = 0;
  for (const [category, count] of Object.entries(catCount)) {
    if (count > max) {
      top = category;
      max = count;
    }
  }
  return max > 0 ? top : 'Mixed';
}

function buildTiles(placements: PalletPlacement[], config: WorkerConfig): Map<string, InternalTile> {
  const tileSize = clampPositive(config.tileSize, WORKER_TILE_SIZE);
  const tiles = new Map<string, InternalTile>();

  for (const placement of placements) {
    const tileCol = Math.floor(placement.x / tileSize);
    const tileRow = Math.floor(placement.y / tileSize);
    const tileId = `${tileCol}:${tileRow}`;
    let tile = tiles.get(tileId);

    if (!tile) {
      tile = {
        id: tileId,
        x: tileCol * tileSize,
        y: tileRow * tileSize,
        w: tileSize,
        h: tileSize,
        pallets: [],
        catCount: Object.create(null),
        cells: new Map(),
        clusters: [],
      };
      tiles.set(tileId, tile);
    }

    tile.pallets.push(placement);
    tile.catCount[placement.category] = (tile.catCount[placement.category] ?? 0) + 1;

    const cellWidth = clampPositive(config.cellWidth, 1);
    const cellHeight = clampPositive(config.cellHeight, 1);
    const padding = clampPositive(config.padding, 0);

    const cellCol = Math.floor((placement.x - padding) / cellWidth);
    const cellRow = Math.floor((placement.y - padding) / cellHeight);
    const cellId = `${cellCol}:${cellRow}`;

    let cell = tile.cells.get(cellId);
    if (!cell) {
      cell = {
        id: cellId,
        x: padding + cellCol * cellWidth,
        y: padding + cellRow * cellHeight,
        w: Math.max(1, cellWidth - 2),
        h: Math.max(1, cellHeight - 2),
        count: 0,
        catCount: Object.create(null),
      };
      tile.cells.set(cellId, cell);
    }

    cell.count += 1;
    cell.catCount[placement.category] = (cell.catCount[placement.category] ?? 0) + 1;
  }

  tiles.forEach((tile) => {
    const clusters: ClusterCell[] = [];
    tile.cells.forEach((cell) => {
      clusters.push({
        id: `${tile.id}:${cell.id}`,
        x: cell.x,
        y: cell.y,
        w: cell.w,
        h: cell.h,
        count: cell.count,
        topCategory: pickTopCategory(cell.catCount),
      });
    });
    tile.clusters = clusters;
  });

  return tiles;
}

function queryVisibleTiles(view: WorkerViewport, config: WorkerConfig, tiles: Map<string, InternalTile>): WorkerTile[] {
  if (!config) return [];
  const tileSize = clampPositive(config.tileSize, WORKER_TILE_SIZE);
  const padTiles = 1;
  const startCol = Math.floor((view.x - padTiles * tileSize) / tileSize);
  const endCol = Math.floor((view.x + view.w + padTiles * tileSize) / tileSize);
  const startRow = Math.floor((view.y - padTiles * tileSize) / tileSize);
  const endRow = Math.floor((view.y + view.h + padTiles * tileSize) / tileSize);
  const detailed = view.scale >= (config.lod ?? 1.6);

  const visible: WorkerTile[] = [];

  for (let col = startCol; col <= endCol; col += 1) {
    for (let row = startRow; row <= endRow; row += 1) {
      const id = `${col}:${row}`;
      const tile = tiles.get(id);
      if (!tile) continue;
      visible.push({
        id,
        x: tile.x,
        y: tile.y,
        w: tile.w,
        h: tile.h,
        count: tile.pallets.length,
        topCategory: pickTopCategory(tile.catCount),
        pallets: detailed ? tile.pallets : undefined,
        clusters: detailed ? undefined : tile.clusters,
      });
    }
  }

  return visible;
}

function postMessageSafe(message: WorkerOutboundMessage) {
  (self as DedicatedWorkerGlobalScope).postMessage(message);
}

function handleInit(items: WorkerInventoryItem[], config: WorkerConfig) {
  state.items = items.slice();
  state.config = { ...config, tileSize: clampPositive(config.tileSize, WORKER_TILE_SIZE) };

  if (state.items.length === 0) {
    state.tiles = new Map();
    state.meta = { totalPallets: 0, distinctBuckets: 0, categories: [] };
  } else {
    const layout = aggregateAndPlace(state.items, state.config);
    state.tiles = buildTiles(layout.placements, state.config);
    state.meta = {
      totalPallets: layout.placements.length,
      distinctBuckets: layout.distinctBuckets,
      categories: layout.categories,
    };
  }

  const message: WorkerInitDoneMessage = { type: 'initDone', meta: state.meta };
  postMessageSafe(message);
}

function handleUpdateViewport(view: WorkerViewport, requestId: number) {
  if (!state.config) {
    postMessageSafe({ type: 'error', message: 'worker_not_initialized' });
    return;
  }

  const tiles = queryVisibleTiles(view, state.config, state.tiles);
  const message: WorkerTilesMessage = {
    type: 'tiles',
    requestId,
    tiles,
    meta: state.meta,
  };
  postMessageSafe(message);
}

function handleDispose() {
  state.items = [];
  state.tiles.clear();
  state.config = null;
  state.meta = { totalPallets: 0, distinctBuckets: 0, categories: [] };
}

self.addEventListener('message', (event: MessageEvent<WorkerInboundMessage>) => {
  const data = event.data;
  switch (data.type) {
    case 'init':
      handleInit(data.items, data.config);
      break;
    case 'updateViewport':
      handleUpdateViewport(data.viewport, data.requestId);
      break;
    case 'dispose':
      handleDispose();
      break;
    default:
      postMessageSafe({ type: 'error', message: 'unknown_message' });
  }
});
