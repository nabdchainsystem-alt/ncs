import csv
import json
import os

def generate_warehouse_json():
    csv_path = '/Users/max/ncs/data/reports/supply_chain_reports/warehouse/report_template.csv'
    json_path = '/Users/max/ncs/data/reports/supply_chain_reports/warehouse/warehouse_reports.json'

    reports = []
    
    print(f"Reading CSV from {csv_path}...")
    
    try:
        with open(csv_path, mode='r', encoding='utf-8-sig') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                # Map CSV columns to JSON structure
                report = {
                    "id": row.get("id", ""),
                    "Layer": row.get("layer", "General"), # Map layer -> Layer
                    "Sub-Layer": row.get("Sub-Layer", "General"), # New Sub-Layer field
                    "Category 1 (Detailed)": row.get("Category 1 (Detailed)", ""),
                    "Module (Category 2)": row.get("Module (Category 2)", ""),
                    "Report Title": row.get("Report Title", ""),
                    "Chart Type (ECharts)": row.get("Chart Type (ECharts)", "Bar Chart"),
                    "benefit": row.get("benefit", ""),
                    "kpi_definition": row.get("kpi_definition", ""),
                    "formula": row.get("formula", ""),
                    "data_needed": row.get("data_needed", ""),
                    "detailed_explanation": row.get("detailed_explanation", ""),
                    "logic": row.get("logic", "") # Keep as string or parse if needed
                }
                
                # Basic validation
                if report["Report Title"]:
                    reports.append(report)
                    
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return

    print(f"Processed {len(reports)} reports.")
    
    print(f"Writing JSON to {json_path}...")
    with open(json_path, 'w', encoding='utf-8') as jsonfile:
        json.dump(reports, jsonfile, indent=4)
        
    print("Done.")

if __name__ == "__main__":
    generate_warehouse_json()
