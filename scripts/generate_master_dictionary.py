
import json
from collections import defaultdict

def generate_master_dictionary():
    with open('/Users/max/ncs/data/reports/procurements_reports.json', 'r') as f:
        reports = json.load(f)

    # Dictionary to hold table definitions: TableName -> {Columns: Set, Functions: Set}
    tables_agg = defaultdict(lambda: {'columns': set(), 'functions': set()})

    for r in reports:
        logic = r.get('logic', {})
        
        # Identify Tables
        current_tables = []
        if 'sources' in logic:
            for s in logic['sources']:
                current_tables.extend(s.get('table_keywords', []))
        elif 'source' in logic:
            current_tables = logic['source'].get('table_keywords', [])
        
        # Identify Columns & Functions
        cols = set()
        funcs = set()
        
        # From Requirements
        if 'requirements' in logic:
            for req in logic['requirements']:
                col_name = req.get('keywords', ['Unknown'])[0].title()
                cols.add(col_name)
        
        # From Formula/Title (Heuristics)
        formula = r.get('formula', '')
        title = r.get('Report Title', '')
        
        if "Count" in formula: 
            cols.add("ID")
            funcs.add("Count")
        if "Sum" in formula: 
            cols.add("Amount")
            funcs.add("Sum")
        if "Date" in formula or "aging" in title.lower(): 
            cols.add("Date")
            funcs.add("Aging/DateDiff")
        if "Status" in title: 
            cols.add("Status")
            funcs.add("Group By")
        if "Department" in title: 
            cols.add("Department")
            funcs.add("Group By")
        if "Supplier" in title: 
            cols.add("Supplier")
            funcs.add("Group By")

        # Map to a "Master Table" bucket based on keyword
        for t in current_tables:
            t_upper = t.upper()
            master_name = "Unknown"
            if any(k in t_upper for k in ['INVOICE', 'SPEND', 'PAYMENT', 'AP_']): master_name = "FINANCE_AP_INVOICES"
            elif any(k in t_upper for k in ['PO', 'PURCHASE', 'ORDER']): master_name = "PROCUREMENT_PURCHASE_ORDERS"
            elif any(k in t_upper for k in ['VENDOR', 'SUPPLIER']): master_name = "PROCUREMENT_VENDORS"
            elif any(k in t_upper for k in ['REQ', 'REQUEST']): master_name = "PROCUREMENT_REQUISITIONS"
            elif any(k in t_upper for k in ['CONTRACT']): master_name = "PROCUREMENT_CONTRACTS"
            else: master_name = f"OTHER_{t_upper}"
            
            tables_agg[master_name]['columns'].update(cols)
            tables_agg[master_name]['functions'].update(funcs)

    # Output Markdown
    lines = []
    lines.append("# Master Data Dictionary")
    lines.append("To power all 210 reports, you need to create these **Core Tables** with the listed columns.")
    
    for table, data in sorted(tables_agg.items()):
        if table.startswith("OTHER"): continue # Skip obscure ones for the summary
        
        cols_sorted = sorted(list(data['columns']))
        funcs_sorted = sorted(list(data['functions']))
        
        lines.append(f"\n## 🗄️ {table.replace('_', ' ')}")
        lines.append(f"**Required Columns:**")
        lines.append(f"> `{'`, `'.join(cols_sorted)}`")
        lines.append(f"**Used For:**")
        lines.append(f"> {', '.join(funcs_sorted)}")

    with open('/Users/max/ncs/docs/supply_chain/procurement/procurement_master_dictionary.md', 'w') as f:
        f.write("\n".join(lines))
        
    print("Master Dictionary generated.")

if __name__ == "__main__":
    generate_master_dictionary()
