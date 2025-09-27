export type BoardHistoryEntryType = 'move' | 'edit' | 'link' | 'create' | 'delete';

export type BoardHistoryEntry = {
  id: string;
  type: BoardHistoryEntryType;
  summary: string;
  timestamp: number;
};

export type BoardNode = {
  id: string;
  title: string;
  body?: string;
  dept?: string;
  owner?: string;
  ownerAvatar?: string;
  dueDate?: string;
  status?: 'Draft' | 'Pending' | 'Approved' | 'Done' | string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
  metadata?: Record<string, unknown>;
  history?: BoardHistoryEntry[];
};

export type BoardEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  metadata?: Record<string, unknown>;
  selected?: boolean;
};

export type BoardViewport = {
  x: number;
  y: number;
  zoom: number;
};

export type BoardState = {
  nodes: BoardNode[];
  edges: BoardEdge[];
  viewport: BoardViewport;
  lastUpdated?: number;
};
