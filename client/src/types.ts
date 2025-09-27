export type Priority = "Low" | "Medium" | "High";
export type Status = "New" | "Under Review" | "Quotation" | "Approved" | "Completed";
export type Approval = "Pending" | "Approved" | "Rejected" | "OnHold";

export interface FileMeta {
  id: string;
  name: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface LineItem {
  id: string;
  name: string;
  code: string;
  qty: number;
  unit: string;
  status?: 'NEW' | 'Approved' | 'Rejected' | 'RFQ_SENT';
  rfqSent?: boolean; // optional flag, can be derived from status
}

export interface RequestItem {
  id: string;
  orderNo: string;
  items: LineItem[];
  title: string;
  type: string;
  department: string;
  priority: Priority;
  quantity: number;
  specs?: string;
  notes?: string;
  machine?: string;
  owner?: string;
  sla?: string;
  status: Status;
  approval?: Approval;
  createdAt: string;
  updatedAt?: string;   
  files?: FileMeta[];
  completed: boolean;
}
// --- API DTOs --- //
export type RequestCreateDTO = {
  orderNo: string;
  title: string;
  type: string;
  department: string;
  priority: Priority;
  quantity: number;
  specs?: string;
  items: {
    name: string;
    code?: string;
    qty: number;
    unit?: string;
    note?: string;
  }[];
  warehouse?: string;
  vendor?: string;
  notes?: string;
};

// Update DTO used by Edit modal — items are intentionally excluded
export type RequestUpdateDTO = Partial<Omit<RequestCreateDTO, 'items'>> & {
  id?: string;
  status?: Status;
};

// --- Tasks --- //
export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority?: string | null;
  assignee?: string | null;
  label?: string | null;
  dueDate?: string | null;
  progress?: number; // 0..100
  custom?: Record<string, unknown> | null; // custom fields (budget, risk, etc.)
  tags?: string[]; // optional tags
  refType?: "REQUEST" | "RFQ" | "PO" | "INVENTORY" | null;
  refId?: number | null;
  order: number;
  commentsCount?: number;
  createdAt: string;
  updatedAt: string;
}
