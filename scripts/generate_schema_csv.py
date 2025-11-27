
import json
import csv

def generate_csv():
    with open('/Users/max/ncs/data/reports/procurements_reports.json', 'r') as f:
        reports = json.load(f)

    output_path = '/Users/max/ncs/docs/supply_chain/procurement/procurement_data_schema.csv'
    
    with open(output_path, 'w', newline='') as csvfile:
        fieldnames = ['Report Title', 'Category', 'Required Table(s)', 'Required Column 1', 'Required Column 2', 'Required Column 3', 'Logic / Function']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        writer.writeheader()

        for r in reports:
            logic = r.get('logic', {})
            
            # 1. Determine Tables
            tables = []
            if 'sources' in logic:
                for s in logic['sources']:
                    tables.extend(s.get('table_keywords', []))
            elif 'source' in logic:
                tables = logic['source'].get('table_keywords', [])
            
            table_str = " OR ".join(tables) if tables else r.get('data_needed', 'N/A')
            
            # 2. Determine Columns (Prescriptive)
            req_cols = []
            
            # Check explicit requirements from logic
            if 'requirements' in logic:
                for req in logic['requirements']:
                    # Be prescriptive: Suggest the first keyword as the column name
                    best_name = req.get('keywords', ['Unknown'])[0].title()
                    col_type = req.get('types', ['text'])[0]
                    req_cols.append(f"{best_name} ({col_type})")
            
            # Fallback/Heuristics if logic requirements are empty (for simple reports)
            formula = r.get('formula', '')
            title = r.get('Report Title', '')
            
            if not req_cols:
                if "Count" in formula:
                    req_cols.append("ID (text)") # Count usually needs an ID
                if "Sum" in formula or "Spend" in title:
                    req_cols.append("Amount (number)")
                if "Date" in formula or "aging" in title.lower():
                    req_cols.append("Created Date (date)")
                if "Status" in title:
                    req_cols.append("Status (text)")
                if "Department" in title:
                    req_cols.append("Department (text)")
                if "Supplier" in title or "Vendor" in title:
                    req_cols.append("Supplier Name (text)")
            
            # Pad columns to 3
            while len(req_cols) < 3:
                req_cols.append("")

            # 3. Determine Logic
            processing = logic.get('processing', [])
            logic_desc = ""
            if processing:
                steps = []
                for p in processing:
                    if p['step'] == 'aggregation':
                        steps.append(f"{p['operation'].upper()} of {p.get('column_ref', 'records')}")
                    elif p['step'] == 'group_by':
                        steps.append(f"Group by {p.get('group_column_ref', 'Category')}")
                    elif p['step'] == 'calculate_column':
                        steps.append(f"Calc: {p['name']}")
                logic_desc = " -> ".join(steps)
            else:
                logic_desc = formula

            writer.writerow({
                'Report Title': r.get('Report Title'),
                'Category': r.get('Category 1 (Detailed)'),
                'Required Table(s)': table_str,
                'Required Column 1': req_cols[0],
                'Required Column 2': req_cols[1],
                'Required Column 3': req_cols[2],
                'Logic / Function': logic_desc
            })

    print(f"CSV generated at: {output_path}")

if __name__ == "__main__":
    generate_csv()
