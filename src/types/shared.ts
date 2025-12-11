export enum Priority {
    Urgent = 'Urgent',
    High = 'High',
    Normal = 'Normal',
    Low = 'Low',
    None = 'None'
}

export enum Status {
    Todo = 'To do',
    InProgress = 'In Progress',
    Review = 'Review',
    Complete = 'Complete'
}

export interface User {
    id: string;
    name: string;
    avatar: string;
    color: string;
    email?: string;
    avatarUrl?: string;
    // Professional Fields
    role: 'Admin' | 'Manager' | 'Member' | 'Guest';
    hourlyRate?: number;
    weeklyCapacity?: number; // in hours
    skills?: string[];
    department?: string;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: Status;
    priority: Priority;
    assigneeId?: string;
    projectId?: string;
    // Professional Fields
    estimatedHours?: number;
    actualHours?: number;
    cost?: number; // Calculated from (actualHours * user.hourlyRate)
    startDate?: Date;
    dueDate?: Date;
    dependencies?: string[]; // IDs of tasks that must be completed first
    tags?: string[];
    workflowTriggers?: {
        onComplete?: string; // ID of next task to create/activate
    };
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    status: 'Active' | 'On Hold' | 'Completed' | 'Archived';
    // Professional Fields
    budget: number;
    spent: number;
    startDate: Date;
    deadline: Date;
    managerId: string;
    teamIds: string[];
    health: 'Good' | 'At Risk' | 'Critical'; // Calculated based on budget/timeline
}

export interface Vendor {
    id: string;
    name: string;
    nameArabic?: string;
    category: string;
    subCategory?: string;
    rating: number; // 0-5
    reviews?: number;
    description?: string;
    image?: string;
    coverImage?: string;
    priceRange?: string;
    deliveryTime?: string;
    minOrder?: string;
    address?: string;
    website?: string;
    phone?: string;
    email?: string;

    // Professional Fields
    reliabilityScore?: number; // 0-100 (Dynamic based on delivery performance)
    contactPerson?: string;
    position?: string;
    contractStatus?: 'Active' | 'Pending' | 'Expired';
    paymentTerms?: 'Net30' | 'Net60' | 'Immediate';
    cr?: string;
    vat?: string;
}

export interface PurchaseOrder {
    id: string;
    vendorId: string;
    items: {
        itemId: string; // InventoryItem ID
        quantity: number;
        unitPrice: number;
    }[];
    totalAmount: number;
    status: 'Draft' | 'Pending Approval' | 'Sent' | 'Fulfilled' | 'Cancelled';
    createdAt: Date;
    expectedDeliveryDate?: Date;
    notes?: string;
}

export interface InventoryItem {
    id: string;
    name: string;
    sku: string;
    category: string;
    // Professional Fields
    quantity: number;
    unitPrice: number;
    reorderPoint: number; // Threshold to trigger auto-reorder
    supplierId: string; // Link to Vendor
    location: string; // Warehouse ID
}

export interface Team {
    id: string;
    name: string;
    members: string[]; // user IDs
    color: string;
    company_id?: string;
}

export type Permissions = Record<string, boolean>;

export const DEFAULT_PERMISSIONS: Permissions = {
    // Sections
    departments: true,
    smartTools: true,
    marketplace: true,

    // Top Level
    inbox: true,
    discussion: true,
    overview: true,
    goals: true,
    reminders: true,
    tasks: true,
    vault: true,
    teams: true,

    // Supply Chain
    'supply-chain': true,
    'supply-chain/procurement': true,
    'supply-chain/warehouse': true,
    'supply-chain/shipping': true,
    'supply-chain/planning': true,
    'supply-chain/fleet': true,
    'supply-chain/vendors': true,

    // Operations
    'operations': true,
    'operations/maintenance': true,
    'operations/production': true,
    'operations/quality': true,

    // Business
    'business': true,
    'business/sales': true,
    'business/finance': true,

    // Support
    'support': true,
    'support/it': true,
    'support/hr': true,
    'support/marketing': true,

    // Smart Tools
    'smart-tools/mind-map': true,
    'smart-tools/dashboard': true,

    // Marketplace
    'marketplace/local': true,
    'marketplace/foreign': true
};

export type ViewType = 'list' | 'board' | 'calendar' | 'dashboard' | 'gantt';

export const STATUS_COLORS: Record<Status, string> = {
    [Status.Todo]: '#87909e',
    [Status.InProgress]: '#3b82f6',
    [Status.Review]: '#eab308',
    [Status.Complete]: '#22c55e',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
    [Priority.Urgent]: '#e44356',
    [Priority.High]: '#ffcc00',
    [Priority.Normal]: '#6fddff',
    [Priority.Low]: '#87909e',
    [Priority.None]: '#d1d5db',
};
