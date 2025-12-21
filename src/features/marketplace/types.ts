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
    status?: string; // Mapped from raw data or alias for contractStatus
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
