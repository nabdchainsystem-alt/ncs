
export interface Report {
    id: string;
    "Report Title": string;
    "Category 1 (Detailed)": string;
    "Module (Category 2)": string;
    "Layer"?: string;
    "Sub-Layer"?: string;
    "Chart Type (ECharts)"?: string;
    [key: string]: any;
}

export interface TableTemplate {
    table_id: string;
    display_name: string;
    columns: Array<{
        name: string;
        type: string;
        role: string;
    }>;
    [key: string]: any;
}

class ReportService {
    private cache: Map<string, any> = new Map();

    private async fetchData<T>(path: string): Promise<T> {
        if (this.cache.has(path)) {
            return this.cache.get(path);
        }

        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${path}`);
            }
            const data = await response.json();
            this.cache.set(path, data);
            return data;
        } catch (error) {
            console.error(`Error loading data from ${path}:`, error);
            return [] as any;
        }
    }

    async getReports(department: string, domain: string): Promise<Report[]> {
        // Map department/domain to file path
        // e.g. supply-chain/procurement -> /data/reports/supply_chain_reports/procurement/procurement_reports.json

        let deptFolder = '';
        if (department === 'supply-chain') deptFolder = 'supply_chain_reports';
        else if (department === 'operations') deptFolder = 'operations_reports';
        else if (department === 'business') deptFolder = 'business_reports';
        else if (department === 'support') deptFolder = 'support_reports';
        else return [];

        const path = `/data/reports/${deptFolder}/${domain}/${domain}_reports.json`;
        return this.fetchData<Report[]>(path);
    }

    async getTables(department: string, domain: string): Promise<TableTemplate[]> {
        let deptFolder = '';
        if (department === 'supply-chain') deptFolder = 'supply_chain_reports';
        else if (department === 'operations') deptFolder = 'operations_reports';
        else if (department === 'business') deptFolder = 'business_reports';
        else if (department === 'support') deptFolder = 'support_reports';
        else return [];

        const path = `/data/reports/${deptFolder}/${domain}/${domain}_tables.json`;
        return this.fetchData<TableTemplate[]>(path);
    }

    async getTemplates(type: string): Promise<any[]> {
        // e.g. procurement_tables.json
        const path = `/data/templates/${type}_tables.json`;
        return this.fetchData<any[]>(path);
    }
}

export const reportService = new ReportService();
