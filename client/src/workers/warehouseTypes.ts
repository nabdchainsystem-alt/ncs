export type WorkerInventoryItem = {
  id: string;
  name: string;
  category?: string | null;
  warehouse?: string | null;
  qty: number;
  unit?: string | null;
  valueSAR?: number | null;
};

export type WorkerConfig = {
  palletUnits: number;
  warehouseFilter: string;
  categoryFilter: string;
  areaW: number;
  areaH: number;
  padding: number;
  cellWidth: number;
  cellHeight: number;
  tileSize: number;
  lod: number;
};

export type PalletPlacement = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  category: string;
  warehouse: string;
};

export type ClusterCell = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  count: number;
  topCategory: string;
};

export type WorkerTile = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  count: number;
  topCategory: string;
  pallets?: PalletPlacement[];
  clusters?: ClusterCell[];
};

export type WorkerMeta = {
  totalPallets: number;
  distinctBuckets: number;
  categories: string[];
};

export type WorkerViewport = {
  x: number;
  y: number;
  w: number;
  h: number;
  scale: number;
};

export type WorkerUpdateResponse = {
  tiles: WorkerTile[];
  meta: WorkerMeta;
};

export type WorkerInitMessage = {
  type: 'init';
  items: WorkerInventoryItem[];
  config: WorkerConfig;
};

export type WorkerUpdateViewportMessage = {
  type: 'updateViewport';
  viewport: WorkerViewport;
  requestId: number;
};

export type WorkerDisposeMessage = {
  type: 'dispose';
};

export type WorkerInboundMessage =
  | WorkerInitMessage
  | WorkerUpdateViewportMessage
  | WorkerDisposeMessage;

export type WorkerInitDoneMessage = {
  type: 'initDone';
  meta: WorkerMeta;
};

export type WorkerTilesMessage = {
  type: 'tiles';
  requestId: number;
  tiles: WorkerTile[];
  meta: WorkerMeta;
};

export type WorkerErrorMessage = {
  type: 'error';
  message: string;
};

export type WorkerOutboundMessage =
  | WorkerInitDoneMessage
  | WorkerTilesMessage
  | WorkerErrorMessage;

export const WORKER_TILE_SIZE = 256;
