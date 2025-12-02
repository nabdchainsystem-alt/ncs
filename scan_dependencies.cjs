const fs = require('fs');
const path = require('path');

const rootPath = '/Users/max/ncs/src/data/reports';

const deptMappings = {
    'procurement': 'supply_chain_reports/procurement',
    'planning': 'supply_chain_reports/planning',
    'fleet': 'supply_chain_reports/fleet',
    'shipping': 'supply_chain_reports/shipping',
    'vendors': 'supply_chain_reports/vendors',
    'warehouse': 'supply_chain_reports/warehouse',
    'maintenance': 'operations_reports/maintenance',
    'production': 'operations_reports/production',
    'quality': 'operations_reports/quality',
    'sales': 'business_reports/sales',
    'finance': 'business_reports/finance',
    'it': 'support_reports/it',
    'hr': 'support_reports/hr',
    'marketing': 'support_reports/marketing'
};

// Helper to read JSON safely
function readJson(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(content);
        }
    } catch (e) {
        console.error(`Error reading ${filePath}:`, e.message);
    }
    return [];
}

// 1. Load all Existing Tables
const allTables = [];
const tableIds = new Set();
const tableKeywordsMap = new Map(); // keyword -> list of table_ids

console.log('--- Loading Tables ---');
Object.entries(deptMappings).forEach(([dept, relativePath]) => {
    const tablePath = path.join(rootPath, relativePath, `${dept}_tables.json`);
    const tables = readJson(tablePath);
    if (tables.length > 0) {
        console.log(`Loaded ${tables.length} tables from ${dept}`);
    }

    tables.forEach(table => {
        allTables.push({ ...table, department: dept });
        tableIds.add(table.table_id.toUpperCase());

        if (table.table_keywords) {
            table.table_keywords.forEach(k => {
                const key = k.toUpperCase();
                if (!tableKeywordsMap.has(key)) {
                    tableKeywordsMap.set(key, []);
                }
                tableKeywordsMap.get(key).push(table.table_id);
            });
        }
    });
});

console.log(`\nTotal Existing Tables: ${allTables.length}`);

// 2. Scan Reports for Dependencies
const missingDependencies = new Map(); // dependency -> count
const missingKeywords = new Map(); // keyword -> count

console.log('\n--- Scanning Reports ---');
// Only scan Supply Chain departments for reports, as others don't have reports yet
const supplyChainDepts = ['procurement', 'planning', 'fleet', 'shipping', 'vendors', 'warehouse'];

supplyChainDepts.forEach(dept => {
    const reportPath = path.join(rootPath, 'supply_chain_reports', dept, `${dept}_reports.json`);
    const reports = readJson(reportPath);
    console.log(`Scanning ${reports.length} reports from ${dept}`);

    reports.forEach(report => {
        // Check data_needed (comma separated IDs or keys)
        if (report.data_needed) {
            const needed = report.data_needed.split(',').map(s => s.trim().toUpperCase());
            needed.forEach(n => {
                // Heuristic: Check if 'n' exists as a table_id or is a known concept
                // We are looking for things that are NOT in tableIds
                if (!tableIds.has(n)) {
                    // It might be a keyword match? 
                    // If it's not a table ID, we flag it as a potential missing table reference
                    const count = missingDependencies.get(n) || 0;
                    missingDependencies.set(n, count + 1);
                }
            });
        }

        // Check logic.source.table_keywords
        if (report.logic) {
            try {
                const logic = typeof report.logic === 'string' ? JSON.parse(report.logic) : report.logic;
                if (logic.source && logic.source.table_keywords) {
                    logic.source.table_keywords.forEach(k => {
                        const key = k.toUpperCase();
                        if (!tableKeywordsMap.has(key)) {
                            const count = missingKeywords.get(key) || 0;
                            missingKeywords.set(key, count + 1);
                        }
                    });
                }
            } catch (e) {
                // ignore parse errors
            }
        }
    });
});

// 3. Output Results
console.log('\n--- Missing Table Dependencies (Top 50) ---');
console.log('These are "data_needed" references in reports that do not match any existing "table_id".');
const sortedMissing = [...missingDependencies.entries()].sort((a, b) => b[1] - a[1]);
sortedMissing.slice(0, 50).forEach(([dep, count]) => {
    console.log(`- ${dep}: requested by ${count} reports`);
});

console.log('\n--- Missing Keyword Coverage (Top 50) ---');
console.log('These are keywords in reports that match NO existing tables.');
const sortedKeywords = [...missingKeywords.entries()].sort((a, b) => b[1] - a[1]);
sortedKeywords.slice(0, 50).forEach(([k, count]) => {
    console.log(`- ${k}: requested by ${count} reports`);
});

// 4. Generate Wiki Data Structure
// We will output a summary for the Wiki
const wikiData = {
    procurementTables: allTables.filter(t => t.department === 'procurement'),
    missingTop10: sortedMissing.slice(0, 10).map(x => x[0]),
    stats: {
        totalReports: supplyChainDepts.reduce((acc, d) => acc + readJson(path.join(rootPath, 'supply_chain_reports', d, `${d}_reports.json`)).length, 0),
        totalTables: allTables.length
    }
};

fs.writeFileSync('wiki_data.json', JSON.stringify(wikiData, null, 2));
console.log('\nWiki data saved to wiki_data.json');
