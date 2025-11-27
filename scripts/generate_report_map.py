
import json

def analyze_reports():
    with open('/Users/max/ncs/data/reports/procurements_reports.json', 'r') as f:
        reports = json.load(f)

    output_lines = []
    output_lines.append("# Report Data Source Map")
    output_lines.append("| ID | Report Title | Complexity | Data Source(s) | Formula Logic |")
    output_lines.append("|---|---|---|---|---|")

    for report in reports:
        formula = report.get('formula', '')
        data_needed = report.get('data_needed', '')
        
        complexity = "Low"
        if "Tables:" in data_needed and "," in data_needed:
            complexity = "High (Multi-Table)"
        elif "grouped by" in formula or "buckets" in formula:
            complexity = "Medium (Bucketing)"
        elif "/" in formula or "+" in formula or "-" in formula:
             complexity = "Medium (Calculation)"

        # Clean up data source
        source = data_needed.replace("Tables: ", "").replace(" table", "")
        
        output_lines.append(f"| {report['id']} | {report['Report Title']} | {complexity} | {source} | {formula} |")

    with open('/Users/max/.gemini/antigravity/brain/7ba86ae5-1d31-4adc-af57-32cd310599f2/report_data_sources.md', 'w') as f:
        f.write("\n".join(output_lines))

if __name__ == "__main__":
    analyze_reports()
