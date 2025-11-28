
// Mock Data Generator Utility

export const generateMockData = (report: any) => {
    // Default fallback
    const result = {
        value: '0',
        trendValue: '0%',
        trend: 'neutral',
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        values: [10, 20, 15, 25, 30, 28]
    };

    if (!report) return result;

    // Generate realistic looking numbers based on report title/category
    const isCurrency = report["Report Title"]?.toLowerCase().includes('spend') ||
        report["Report Title"]?.toLowerCase().includes('cost') ||
        report["Report Title"]?.toLowerCase().includes('value');

    const isPercentage = report["Report Title"]?.toLowerCase().includes('rate') ||
        report["Report Title"]?.toLowerCase().includes('accuracy') ||
        report["Report Title"]?.toLowerCase().includes('%');

    // KPI Value
    let baseValue = Math.floor(Math.random() * 1000);
    if (isCurrency) {
        result.value = `$${(baseValue * 1.5).toFixed(2)}`;
    } else if (isPercentage) {
        result.value = `${Math.min(100, Math.floor(Math.random() * 100))}%`;
    } else {
        result.value = baseValue.toString();
    }

    // Trend
    const trendDir = Math.random() > 0.5 ? 'up' : 'down';
    result.trend = trendDir;
    result.trendValue = `${Math.floor(Math.random() * 20)}%`;

    // Chart Data
    // Simple random series for now
    result.values = Array.from({ length: 6 }, () => Math.floor(Math.random() * 100));

    // For Pie/Donut
    if (report["Chart Type (ECharts)"]?.includes('Pie') || report["Chart Type (ECharts)"]?.includes('Donut')) {
        result.categories = ['Category A', 'Category B', 'Category C', 'Category D'];
        result.values = [30, 20, 15, 35]; // Should ideally sum to 100 for % but not strictly required for values
    }

    return result;
};

// Table Generators (from previous plan)
export const generateVendors = (count: number = 20) => {
    const categories = ['IT Services', 'Office Supplies', 'Raw Materials', 'Logistics', 'Consulting', 'Hardware', 'Software'];
    const statuses = ['Active', 'Active', 'Active', 'Inactive', 'Blacklisted'];

    return Array.from({ length: count }).map((_, i) => ({
        id: `VEN-${1000 + i}`,
        data: {
            col1: `VEN-${1000 + i}`,
            col2: `Vendor ${String.fromCharCode(65 + (i % 26))}${i}`,
            col3: categories[Math.floor(Math.random() * categories.length)],
            col4: statuses[Math.floor(Math.random() * statuses.length)],
            col5: `Contact ${i}`
        }
    }));
};

export const generateContracts = (count: number = 15, vendors: any[]) => {
    const statuses = ['Active', 'Active', 'Expired', 'Renewed'];

    return Array.from({ length: count }).map((_, i) => {
        const vendor = vendors && vendors.length > 0 ? vendors[Math.floor(Math.random() * vendors.length)] : { data: { col2: 'Unknown' } };
        const startDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);

        return {
            id: `CON-${1000 + i}`,
            data: {
                col1: `CON-${1000 + i}`,
                col2: vendor.data.col2,
                col3: startDate.toISOString().split('T')[0],
                col4: endDate.toISOString().split('T')[0],
                col5: Math.floor(Math.random() * 100000) + 5000,
                col6: statuses[Math.floor(Math.random() * statuses.length)]
            }
        };
    });
};

export const generateRequisitions = (count: number = 30) => {
    const depts = ['IT', 'HR', 'Finance', 'Marketing', 'Operations'];
    const statuses = ['Approved', 'Pending', 'Pending', 'Rejected'];

    return Array.from({ length: count }).map((_, i) => ({
        id: `REQ-${1000 + i}`,
        data: {
            col1: `REQ-${1000 + i}`,
            col2: depts[Math.floor(Math.random() * depts.length)],
            col3: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
            col4: statuses[Math.floor(Math.random() * statuses.length)],
            col5: `User ${i}`
        }
    }));
};

export const generatePurchaseOrders = (count: number = 40, vendors: any[]) => {
    const statuses = ['Open', 'Open', 'Closed', 'Cancelled'];
    const depts = ['IT', 'HR', 'Finance', 'Marketing', 'Operations'];

    return Array.from({ length: count }).map((_, i) => {
        const vendor = vendors && vendors.length > 0 ? vendors[Math.floor(Math.random() * vendors.length)] : { data: { col2: 'Unknown' } };
        return {
            id: `PO-${1000 + i}`,
            data: {
                col1: `PO-${1000 + i}`,
                col2: vendor.data.col2,
                col3: Math.floor(Math.random() * 50000) + 1000,
                col4: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
                col5: statuses[Math.floor(Math.random() * statuses.length)],
                col6: depts[Math.floor(Math.random() * depts.length)]
            }
        };
    });
};
