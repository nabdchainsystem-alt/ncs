import csv
import json
import os
import random

def determine_chart_type(title):
    title_lower = title.lower()
    
    # Time Series / Trend
    if any(x in title_lower for x in ['trend', 'history', 'over time', 'monthly', 'weekly', 'daily', 'timeline']):
        return 'Line Chart'
    
    # Distribution / Breakdown
    if any(x in title_lower for x in ['breakdown', 'distribution', 'by category', 'by status', 'share', 'composition']):
        return 'Pie Chart'
    
    # Ranking / Comparison
    if any(x in title_lower for x in ['top', 'best', 'worst', 'highest', 'lowest', 'ranking', 'performance']):
        return 'Bar Chart'
        
    # Gauge / KPI
    if any(x in title_lower for x in ['utilization', 'completion', 'rate', 'percentage', 'score', 'kpi']):
        return 'Gauge Chart'
        
    # Default to Table for lists/details
    if any(x in title_lower for x in ['list', 'register', 'log', 'details', 'report', 'summary']):
        return 'Table'
        
    return 'Table' # Fallback

def infer_layer(title, category, module):
    text = (title + " " + category + " " + module).lower()
    
    if any(x in text for x in ['strategic', 'executive', 'financial', 'spend', 'cost', 'profit', 'global', 'kpi']):
        return 'Strategic'
    if any(x in text for x in ['planning', 'forecast', 'optimization', 'analysis', 'performance', 'trend', 'history']):
        return 'Tactical'
    if any(x in text for x in ['daily', 'log', 'list', 'status', 'tracking', 'real-time', 'execution', 'operational', 'inventory', 'shipment']):
        return 'Operational'
        
    return 'General'

def generate_logic(title, chart_type):
    logic = {
        "source": {
            "table_keywords": ["warehouse_data"] # Placeholder, needs refinement based on actual data
        },
        "processing": []
    }
    
    if chart_type == 'Line Chart':
        logic['processing'] = [
            {"step": "group_by", "group_column_ref": "Date"},
            {"step": "aggregation", "operation": "sum", "column_ref": "Amount"}
        ]
    elif chart_type == 'Pie Chart':
        logic['processing'] = [
            {"step": "group_by", "group_column_ref": "Category"}, # Placeholder
            {"step": "aggregation", "operation": "sum", "column_ref": "Amount"}
        ]
    elif chart_type == 'Bar Chart':
        logic['processing'] = [
            {"step": "group_by", "group_column_ref": "Entity"}, # Placeholder
            {"step": "aggregation", "operation": "sum", "column_ref": "Amount"},
            {"step": "sort", "direction": "desc"},
            {"step": "limit", "count": 10}
        ]
    
    return logic

def process_json(input_file, output_file):
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            reports = json.load(f)
            
        updated_count = 0
        for report in reports:
            # Update Layer if missing
            if "Layer" not in report or not report["Layer"]:
                report["Layer"] = infer_layer(
                    report.get("Report Title", ""),
                    report.get("Category 1 (Detailed)", ""),
                    report.get("Module (Category 2)", "")
                )
                updated_count += 1
                
            # Ensure logic exists
            if "logic" not in report:
                report["logic"] = generate_logic(report.get("Report Title", ""), report.get("Chart Type (ECharts)", "Table"))
                
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(reports, f, indent=4)
            
        print(f"Successfully updated {updated_count} reports in {output_file}")
        
    except FileNotFoundError:
        print(f"Error: Input file '{input_file}' not found.")
    except Exception as e:
        print(f"An error occurred: {e}")

def generate_dummy_data(output_file, count=10000):
    categories = ["Inventory", "Logistics", "Procurement", "Labor", "Equipment", "Safety"]
    modules = ["Inbound", "Outbound", "Storage", "Planning", "Compliance"]
    layers = ["Strategic", "Tactical", "Operational"]
    chart_types = ["Line Chart", "Bar Chart", "Pie Chart", "Gauge Chart", "Table"]
    
    reports = []
    for i in range(count):
        cat = random.choice(categories)
        mod = random.choice(modules)
        layer = random.choice(layers)
        ctype = random.choice(chart_types)
        title = f"{layer} {cat} {mod} Report {i+1}"
        
        report = {
            "id": f"dummy_rpt_{i+1}",
            "Report Title": title,
            "Category 1 (Detailed)": cat,
            "Module (Category 2)": mod,
            "Layer": layer,
            "Chart Type (ECharts)": ctype,
            "logic": generate_logic(title, ctype)
        }
        reports.append(report)
        
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(reports, f, indent=4)
        
    print(f"Successfully generated {count} dummy reports in {output_file}")

if __name__ == "__main__":
    import sys
    
    # Default paths
    PROCUREMENT_REPORTS = '/Users/max/ncs/data/reports/supply_chain_reports/procurement/procurement_reports.json'
    DUMMY_REPORTS = '/Users/max/ncs/data/reports/supply_chain_reports/procurement/dummy_reports_10k.json'
    
    if len(sys.argv) > 1 and sys.argv[1] == 'generate_dummy':
        generate_dummy_data(DUMMY_REPORTS, 10000)
    else:
        # Update existing reports
        print(f"Updating existing reports in {PROCUREMENT_REPORTS}...")
        process_json(PROCUREMENT_REPORTS, PROCUREMENT_REPORTS)
