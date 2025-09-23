export type InventoryKpis = {
  lowStock: number;
  outOfStock: number;
  inventoryValue: number;
  totalItems: number;
};

export type PieDatum = { name: string; value: number };

export type BarSeries = {
  name: string;
  data: number[];
};

export type BarChartResponse = {
  categories: string[];
  series: BarSeries[];
};

export type CriticalKpis = {
  criticalItems: number;
  criticalOOS: number;
  criticalLow: number;
  linkedRequests: number;
};

export type SlowExcessKpis = {
  slowCount: number;
  slowValue: number;
  excessCount: number;
  excessValue: number;
};

export type ActivityKpis = {
  inboundToday: number;
  outboundToday: number;
  transfersToday: number;
  movementValue: number;
};

export type RecentMovementsParams = {
  page: number;
  pageSize: number;
  type?: string;
  warehouse?: string;
};

export type RecentMovementRow = {
  date: string;
  item: string;
  warehouse: string;
  type: string;
  qty: number;
  value: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
};

export type InventoryItemsFromOrdersParams = {
  page: number;
  pageSize: number;
  status?: string;
  warehouse?: string;
  category?: string;
  q?: string;
};

export type InventoryItemsFromOrdersRow = {
  code: string;
  name: string;
  category: string;
  warehouse: string;
  qty: number;
  reorder: number;
  value: number;
  status: string;
  ageDays: number | null;
};

export type UtilizationKpis = {
  totalCapacity: number;
  usedCapacity: number;
  freeCapacity: number;
  utilizationPct: number;
};
