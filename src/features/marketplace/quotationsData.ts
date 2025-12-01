export interface Quotation {
    id: string;
    vendorId: string;
    reference: string;
    date: string;
    status: 'Pending' | 'Processing' | 'Received' | 'Rejected';
    items: number;
    totalAmount: string;
    validUntil: string;
}

export const MOCK_QUOTATIONS: Quotation[] = [
    {
        id: '1',
        vendorId: '1',
        reference: 'QT-2024-001',
        date: '2024-05-15',
        status: 'Received',
        items: 3,
        totalAmount: '$1,200.00',
        validUntil: '2024-06-15'
    },
    {
        id: '2',
        vendorId: '1',
        reference: 'QT-2024-005',
        date: '2024-05-20',
        status: 'Processing',
        items: 1,
        totalAmount: '$450.00',
        validUntil: '2024-06-20'
    },
    {
        id: '3',
        vendorId: '2',
        reference: 'QT-2024-002',
        date: '2024-05-18',
        status: 'Pending',
        items: 5,
        totalAmount: '-',
        validUntil: '-'
    },
    {
        id: '4',
        vendorId: '3',
        reference: 'QT-2024-003',
        date: '2024-05-10',
        status: 'Rejected',
        items: 2,
        totalAmount: '$8,500.00',
        validUntil: '2024-06-10'
    },
    {
        id: '5',
        vendorId: '1',
        reference: 'QT-2024-008',
        date: '2024-06-01',
        status: 'Pending',
        items: 10,
        totalAmount: '-',
        validUntil: '-'
    }
];
