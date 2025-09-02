export type Priority = "Low" | "Medium" | "High";
export type Status = "New" | "Under Review" | "Quotation" | "Approved";

export interface FileMeta {
  id: string;
  name: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface RequestItem {
  id: string;
  title: string;
  type: string;
  department: string;
  priority: Priority;
  quantity: number;
  specs?: string;
  status: Status;
  createdAt: string;
  files?: FileMeta[];
  completed: boolean;
}
