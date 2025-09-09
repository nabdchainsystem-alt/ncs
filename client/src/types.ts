export type Priority = "Low" | "Medium" | "High";
export type Status = "New" | "Under Review" | "Quotation" | "Approved" | "Completed";

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
  status: Status;
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
};

// Update DTO used by Edit modal — items are intentionally excluded
export type RequestUpdateDTO = Partial<Omit<RequestCreateDTO, 'items'>> & {
  id?: string;
  status?: Status;
};