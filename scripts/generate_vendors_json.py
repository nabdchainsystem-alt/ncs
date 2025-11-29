import csv
import json
import os

def generate_vendors_json():
    csv_path = '/Users/max/ncs/data/reports/supply_chain_reports/vendors/vendors_ultimate.csv'
    json_path = '/Users/max/ncs/data/reports/supply_chain_reports/vendors/vendors_reports.json'

    reports = []
    
    print(f"Reading CSV from {csv_path}...")
    
    # Robust reading strategy: Read binary -> Decode -> Remove NULs -> Parse
    encodings = ['utf-16', 'utf-16-le', 'utf-8-sig', 'latin-1', 'cp1252']
    
    content = None
    used_encoding = None

    for encoding in encodings:
        print(f"Trying encoding: {encoding}...")
        try:
            with open(csv_path, mode='rb') as f:
                raw_data = f.read()
                # Decode with replacement to handle errors
                content = raw_data.decode(encoding, errors='replace')
                
                # Check if it looks like a CSV (has header)
                if "Report Title" in content:
                    used_encoding = encoding
                    print(f"Successfully decoded with {encoding}")
                    break
        except Exception as e:
            print(f"Failed decode with {encoding}: {e}")
            continue
            
    if not content:
        print("Failed to read/decode CSV with any encoding.")
        return

    # Clean content: Remove NUL bytes which choke the csv module
    content = content.replace('\0', '')
    # Normalize newlines
    content = content.replace('\r\n', '\n').replace('\r', '\n')
    
    # Parse using io.StringIO
    import io
    try:
        f = io.StringIO(content)
        reader = csv.DictReader(f)
        
        # Debug: Print headers
        print(f"Found headers: {reader.fieldnames}")
        
        row_count = 0
        for row in reader:
            row_count += 1
                
            # Map CSV columns to JSON structure
            report = {
                "id": row.get("id", f"vendors-ultimate-{row_count}"),
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
            elif row_count < 5:
                print(f"Skipping row {row_count} due to missing Report Title: {row}")
                
    except Exception as e:
        print(f"Error parsing CSV content: {e}")
        return

    print(f"Processed {len(reports)} reports.")
    
    print(f"Writing JSON to {json_path}...")
    with open(json_path, 'w', encoding='utf-8') as jsonfile:
        json.dump(reports, jsonfile, indent=4)
        
    print("Done.")

if __name__ == "__main__":
    generate_vendors_json()
