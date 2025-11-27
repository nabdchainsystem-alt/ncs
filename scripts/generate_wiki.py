
import json
import os

def generate_wiki():
    with open('/Users/max/ncs/data/reports/procurements_reports.json', 'r') as f:
        reports = json.load(f)

    # Group reports by Category and Module
    grouped = {}
    for r in reports:
        cat = r.get('Category 1 (Detailed)', 'Uncategorized')
        mod = r.get('Module (Category 2)', 'General')
        if cat not in grouped: grouped[cat] = {}
        if mod not in grouped[cat]: grouped[cat][mod] = []
        grouped[cat][mod].append(r)

    lines = []
    
    # --- Section 1: System Architecture ---
    lines.append("# Procurement Reports System: The Complete Wiki")
    lines.append("\n## 1. System Architecture & How It Works")
    lines.append("This system uses a **Smart Logic Engine** to bridge the gap between raw data tables and visual analytics.")
    lines.append("\n### Core Concepts")
    lines.append("- **Smart Connection**: When you add a report, the system scans your entire workspace (Finance, Supply Chain, etc.) for tables that match the report's requirements.")
    lines.append("- **Virtual Views (Multi-Source)**: For complex reports requiring data from multiple places (e.g., *Penalty Costs* needing both *Invoices* and *POs*), the system creates a 'Virtual View' that joins these tables on-the-fly without creating messy duplicate data.")
    lines.append("- **Auto-Binding**: If you name your tables correctly (e.g., 'AP Invoices'), the system connects automatically. If not, you can manually link them.")

    lines.append("\n## 2. Data Preparation Guide")
    lines.append("To ensure reports work immediately, follow these naming conventions for your Custom Tables:")
    lines.append("| Data Type | Recommended Table Names | Key Columns Needed |")
    lines.append("|---|---|---|")
    lines.append("| **Spend / Invoices** | `AP Invoices`, `Spend Data`, `Payments` | `Amount`, `Date`, `Vendor`, `Invoice ID` |")
    lines.append("| **Purchase Orders** | `Purchase Orders`, `PO Data` | `PO Number`, `Date`, `Supplier`, `Total` |")
    lines.append("| **Vendors** | `Vendor Master`, `Suppliers` | `Vendor Name`, `ID`, `Category` |")
    lines.append("| **Requisitions** | `Requisitions`, `Requests` | `Req ID`, `Date`, `Status`, `Department` |")

    lines.append("\n## 3. Report Catalog (210 Reports)")
    lines.append("Below is the complete list of available reports, organized by Category. Use this to understand exactly what data you need for each.")

    # --- Section 2: Report Catalog ---
    for cat, modules in sorted(grouped.items()):
        lines.append(f"\n### 📂 {cat}")
        for mod, report_list in sorted(modules.items()):
            lines.append(f"\n#### 🔹 {mod}")
            
            # Table Header
            lines.append("| Report Title | What It Does | Data Required (Tables) | Key Data Points |")
            lines.append("|---|---|---|---|")
            
            for r in report_list:
                title = r.get('Report Title', 'N/A')
                desc = r.get('benefit', '') + " " + r.get('detailed_explanation', '')
                
                # Format Data Source
                logic = r.get('logic', {})
                sources = []
                if 'sources' in logic:
                    for s in logic['sources']:
                        sources.extend(s.get('table_keywords', []))
                elif 'source' in logic:
                    sources = logic['source'].get('table_keywords', [])
                
                source_str = ", ".join(set(sources)) if sources else r.get('data_needed', 'N/A')
                
                # Format Key Data Points (Inferred)
                reqs = []
                formula = r.get('formula', '')
                if "Date" in formula or "aging" in title.lower(): reqs.append("Date")
                if "Amount" in formula or "SUM" in formula or "Spend" in title: reqs.append("Amount/Cost")
                if "Count" in formula: reqs.append("ID/Count")
                if "Status" in title or "Category" in title: reqs.append("Status/Category")
                
                req_str = ", ".join(reqs) if reqs else "Standard Columns"

                # Clean text for markdown table
                desc = desc.replace("\n", " ").replace("|", "-")
                
                lines.append(f"| **{title}** | {desc} | `{source_str}` | {req_str} |")

    # Write to file
    output_path = '/Users/max/ncs/docs/supply_chain/procurement/procurement_reports_wiki.md'
    with open(output_path, 'w') as f:
        f.write("\n".join(lines))
    
    print(f"Wiki generated at: {output_path}")

if __name__ == "__main__":
    generate_wiki()
