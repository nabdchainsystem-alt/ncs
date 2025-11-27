
import json
import re

def get_department_from_table(table_name):
    table_name = table_name.upper()
    if any(x in table_name for x in ['INVOICE', 'PAYMENT', 'GL_', 'BUDGET', 'FINANCE', 'AP_', 'AR_']):
        return 'finance'
    if any(x in table_name for x in ['PO', 'PURCHASE', 'SPEND', 'SOURCING', 'CONTRACT', 'VENDOR', 'SUPPLIER', 'REQUISITION']):
        return 'supply-chain/procurement'
    if any(x in table_name for x in ['INVENTORY', 'STOCK', 'WAREHOUSE']):
        return 'supply-chain/warehouse'
    return 'supply-chain/procurement' # Default

def generate_logic(report):
    formula = report.get('formula', '')
    data_needed = report.get('data_needed', '')
    
    # Extract table keywords
    clean_source = data_needed.replace("Tables: ", "").replace(" table", "").replace(".", "")
    tables = [t.strip() for t in clean_source.split(',')]
    
    # Determine if multi-source
    if len(tables) > 1:
        logic = {
            "sources": [],
            "join": {
                "type": "inner",
                "on": "common_id_placeholder" # To be refined manually or by smarter heuristics later
            },
            "requirements": [],
            "processing": []
        }
        
        for table in tables:
            dept = get_department_from_table(table)
            logic["sources"].append({
                "department": dept,
                "table_keywords": [table]
            })
            
    else:
        # Single source logic (existing)
        department = get_department_from_table(tables[0] if tables else "")
        logic = {
            "source": {
                "department": department,
                "table_keywords": tables
            },
            "requirements": [],
            "processing": []
        }
    
    # Heuristic 1: Bucketing (Aging)
    if "grouped by buckets" in formula or "aging" in report.get('Report Title', '').lower():
        logic["requirements"].append({"key": "date_col", "types": ["date"], "keywords": ["date", "created", "due"]})
        logic["requirements"].append({"key": "amount_col", "types": ["number"], "keywords": ["amount", "total", "value"]})
        logic["processing"].append({
            "step": "calculate_column",
            "name": "Aging Bucket",
            "operation": "date_diff_buckets",
            "params": {
                "date_column_ref": "date_col",
                "buckets": [
                    { "label": "Current", "max_days": 0 },
                    { "label": "1-30 Days", "min_days": 1, "max_days": 30 },
                    { "label": "31-60 Days", "min_days": 31, "max_days": 60 },
                    { "label": ">60 Days", "min_days": 61 }
                ]
            }
        })
        logic["processing"].append({
            "step": "group_by",
            "group_column": "Aging Bucket",
            "value_column_ref": "amount_col",
            "aggregation": "sum"
        })
        
    # Heuristic 2: Simple Count
    elif "COUNT" in formula:
        logic["processing"].append({
            "step": "aggregation",
            "operation": "count",
            "label": "Total Count"
        })
        
    # Heuristic 3: Simple Sum
    elif "SUM" in formula or "Total Spend" in report.get('Report Title', ''):
        logic["requirements"].append({"key": "amount_col", "types": ["number"], "keywords": ["amount", "spend", "cost"]})
        logic["processing"].append({
            "step": "aggregation",
            "operation": "sum",
            "column_ref": "amount_col",
            "label": "Total Value"
        })

    # Heuristic 4: Group By Category/Status
    elif "grouped by" in formula or "by Status" in report.get('Report Title', '') or "by Category" in report.get('Report Title', ''):
        group_key = "Status" if "Status" in report.get('Report Title', '') else "Category"
        logic["requirements"].append({"key": "group_col", "types": ["text"], "keywords": [group_key.lower(), "type"]})
        logic["processing"].append({
            "step": "group_by",
            "group_column_ref": "group_col",
            "aggregation": "count"
        })

    # Default/Complex Fallback
    else:
        logic["processing"].append({
            "step": "custom_formula",
            "formula_raw": formula,
            "note": "Requires manual configuration or advanced parsing"
        })
        
    return logic

def update_reports():
    filepath = '/Users/max/ncs/data/reports/procurements_reports.json'
    with open(filepath, 'r') as f:
        reports = json.load(f)
        
    for report in reports:
        report['logic'] = generate_logic(report)
        
    with open(filepath, 'w') as f:
        json.dump(reports, f, indent=4)
    
    print(f"Updated {len(reports)} reports with smart logic.")

if __name__ == "__main__":
    update_reports()
