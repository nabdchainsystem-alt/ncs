# Procurement Reports System: The Complete Wiki

## 1. System Architecture & How It Works
This system uses a **Smart Logic Engine** to bridge the gap between raw data tables and visual analytics.

### Core Concepts
- **Smart Connection**: When you add a report, the system scans your entire workspace (Finance, Supply Chain, etc.) for tables that match the report's requirements.
- **Virtual Views (Multi-Source)**: For complex reports requiring data from multiple places (e.g., *Penalty Costs* needing both *Invoices* and *POs*), the system creates a 'Virtual View' that joins these tables on-the-fly without creating messy duplicate data.
- **Auto-Binding**: If you name your tables correctly (e.g., 'AP Invoices'), the system connects automatically. If not, you can manually link them.

## 2. Data Preparation Guide
To ensure reports work immediately, follow these naming conventions for your Custom Tables:
| Data Type | Recommended Table Names | Key Columns Needed |
|---|---|---|
| **Spend / Invoices** | `AP Invoices`, `Spend Data`, `Payments` | `Amount`, `Date`, `Vendor`, `Invoice ID` |
| **Purchase Orders** | `Purchase Orders`, `PO Data` | `PO Number`, `Date`, `Supplier`, `Total` |
| **Vendors** | `Vendor Master`, `Suppliers` | `Vendor Name`, `ID`, `Category` |
| **Requisitions** | `Requisitions`, `Requests` | `Req ID`, `Date`, `Status`, `Department` |

## 3. Report Catalog (210 Reports)
Below is the complete list of available reports, organized by Category. Use this to understand exactly what data you need for each.

### 📂 Advanced Analytics

#### 🔹 Contracts & Sourcing
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Contract Data Completeness** | Master data. Legal | `Filled / Total` | Standard Columns |

#### 🔹 Finance & Spend
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Price Elasticity Modeling** | Strategic pricing negotiation. Advanced: helps predict impact of supplier price hikes. | `PO_HISTORY, SALES_DATA` | Standard Columns |
| **Spend Anomaly Detection** | Fraud and error prevention. AI/ML model output. Detects split POs or weird weekend postings. | `AP_INVOICES` | Amount/Cost |
| **Spend Data Completeness** | Master data. Analytics foundation. | `SPEND_CUBE` | Amount/Cost |

#### 🔹 General Procurement
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Data Quality Score (Master Data)** | Trustworthiness of reports. Monthly | `UNSPSC)` | Standard Columns |
| **Automation Potential Analysis** | Digital roadmap planning. Identify candidates for RPA (Robotic Process Automation). | `PROCESS_MINING_DATA` | Standard Columns |
| **Procurement Data Accuracy** | Data. Trust. | `DQ_TOOL` | Standard Columns |
| **Procurement Reporting Usage** | Value. Adoption. | `BI_TOOL` | ID/Count |

#### 🔹 Orders (Purchasing)
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Delay Reasons Breakdown by Percent** | Find root causes of delays and target corrective actions. Reason taxonomy examples: stockout, shipping delay, data entry error, approvals. Provide drill to offending POs. | `Date), LATE_LOG (PO_ID, REASONS_DICTIONARY, Reason_Code` | Standard Columns |
| **Delay Reasons Breakdown by Percent** | Identify root causes of delivery delays and drive targeted corrective actions. Reasons may include stockout, shipping delay, data entry error, or pending approvals. Visualize contribution share and trend over time. | `Date), REASONS_DICTIONARY, Reason_Code, LATE_ORDERS (PO_ID` | Standard Columns |

#### 🔹 Vendors (SRM)
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Supplier Clustering / Segmentation** | Strategy differentiation. Visual: Kraljic Matrix (Strategic, Leverage, Bottleneck, Routine). | `SRM_ASSESSMENT` | Standard Columns |
| **Supplier Data Completeness** | Master data. Data quality. | `VENDOR_MASTER` | Standard Columns |

### 📂 Compliance / Risk

#### 🔹 Contracts & Sourcing
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Contract Leakage** | Lost value measurement. Similar to Maverick spend but specific to existing contracts not being used. | `SPEND_ANALYSIS, CONTRACT_TERMS` | Standard Columns |
| **Contract Value Distribution** | Portfolio risk analysis. Are we managing too many tiny contracts? | `CONTRACTS` | Standard Columns |
| **Contract Expiration Timeline** | Renewal planning. Visual renewal calendar. | `CONTRACTS` | Standard Columns |
| **Single Bid Rate** | Sourcing failure. Avoid this. It's not a market price. | `SOURCING_EVENTS` | ID/Count |
| **Contracts per Category** | Coverage analysis. Where are we exposed? | `CONTRACTS` | Status/Category |
| **Contract Compliance Rate** | Value realization. Leakage prevention. | `SPEND_ANALYSIS` | Standard Columns |

#### 🔹 General Procurement
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Number of Procurement Audit Findings** | Process control quality. Zero major findings is the goal. | `AUDIT_REPORTS` | Standard Columns |
| **Procurement Policy Compliance** | Governance. Risk control. | `AUDIT_LOGS` | Standard Columns |
| **Procurement Audit Compliance** | Governance. Control. | `AUDIT_LOGS` | Standard Columns |
| **Procurement Risk Mitigation** | Risk. Readiness. | `RISK_REGISTER` | Standard Columns |

#### 🔹 Vendors (SRM)
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Supplier Risk Score / Risk Index** | Holistic risk view. Monthly | `and Operational risk` | Standard Columns |
| **Sole Source Spend Ratio** | Supply continuity risk. High ratio = low leverage and high risk. Strategy: Qualify alternates. | `SOURCING_STRATEGY_MAP` | Amount/Cost |
| **Supplier Bankruptcy Risk (Z-Score)** | Financial health. Early warning system. | `FINANCIAL_FEED` | Standard Columns |
| **Supplier Code of Conduct Acceptance** | Governance. Risk mitigation. | `VENDOR_PORTAL` | Standard Columns |
| **Supplier Financial Risk Assessment Coverage** | Risk. Continuity. | `RISK_TOOL` | Standard Columns |
| **Supplier Cyber Risk Assessment Coverage** | Risk. Data protection. | `IT_SECURITY` | Standard Columns |

### 📂 Forecasting & Planning

#### 🔹 Contracts & Sourcing
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Sourcing Project Savings (Estimated)** | Pipeline value. Future value indicator. | `SOURCING_PROJECTS` | Amount/Cost |

#### 🔹 Finance & Spend
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Spend Forecast Accuracy** | Improve financial predictability. Critical for cash flow management. | `FORECASTS, AP_SPEND` | Amount/Cost |
| **Spend Forecast Bias** | Predictability. Calibration. | `FORECASTS` | Amount/Cost |

#### 🔹 Inventory & Logistics
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Inventory Turnover Ratio** | Efficiency of inventory management. Higher is generally better. Low turns = trapped cash. | `GL_COGS, INVENTORY_SNAPSHOT` | Standard Columns |
| **Stockout Rate** | Service level failure measurement. Critical for MRO and Direct materials. | `ORDERS, INVENTORY_TRANSACTIONS` | Standard Columns |
| **Slow-Moving Inventory Ratio** | Identify obsolescence risk. Action: Scrap, discount, or return to vendor. | `INVENTORY_AGING` | Standard Columns |
| **Safety Stock Adherence** | Risk management for inventory. Falling below SS increases risk of stockout. | `INVENTORY_LEVELS, ITEM_MASTER (SS_Limit)` | ID/Count |
| **Obsolete Inventory Provision** | Financial impact of bad inventory. Direct hit to P&L. Root cause: poor forecasting or engineering changes. | `INVENTORY_VALUATION` | Amount/Cost |

#### 🔹 Requests & Demand
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Demand Forecast Accuracy (MAPE)** | Optimize inventory and purchasing plans. High error leads to stockouts or overstock. Segment by ABC. | `DEMAND_PLAN, SALES_HISTORY` | Standard Columns |
| **Requisition Urgency Distribution** | Behavior analysis. Too many "Urgent" = broken process. | `REQUISITIONS` | ID/Count |
| **Demand Variability Index** | Stability. Buffer stock sizing. | `SALES_HISTORY` | Standard Columns |

### 📂 Internal Improvement

#### 🔹 General Procurement
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Internal Customer Satisfaction (NPS)** | Measure procurement service quality. Are stakeholders happy? | `SURVEY_RESULTS` | Standard Columns |
| **Stakeholder Satisfaction Score** | Service quality. Voice of the customer. | `SURVEYS` | Standard Columns |
| **Procurement Innovation Projects** | Innovation. Transformation. | `PROJECT_TRACKER` | ID/Count |
| **Procurement Customer Satisfaction** | Service. Trend. | `SURVEYS` | Standard Columns |
| **Procurement Benchmarking** | Strategy. Gap analysis. | `BENCHMARK_REPORT` | Standard Columns |
| **Procurement Brand Equity** | Strategy. Influence. | `SURVEYS` | Standard Columns |
| **Procurement Strategic Alignment** | Strategy. Relevance. | `STRATEGY_MAP` | Standard Columns |
| **Procurement Value Contribution** | Strategy. ROI. | `VALUE_LOG` | Standard Columns |

#### 🔹 Vendors (SRM)
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Supplier Collaboration Index** | Relationship depth. Annually | `innovation` | Standard Columns |

### 📂 Internal Improvement & Innovation

#### 🔹 General Procurement
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Procurement Maturity Index / Scorecard** | Strategic development tracking. Annually | `tech` | Standard Columns |

### 📂 Internal Process Efficiency

#### 🔹 Contracts & Sourcing
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Contract Cycle Time (Creation to Sign)** | Legal/Sourcing speed. Bottleneck analysis (Legal vs Vendor vs Procurement). | `CLM_SYSTEM (Timestamps)` | Date |
| **Sourcing Projects by Status** | Workload tracking. Tables: SOURCING_PROJECTS. | `Neg` | Status/Category |
| **Contract Approval Cycle Time** | Speed. Bottleneck ID. | `CLM` | Standard Columns |

#### 🔹 Finance & Spend
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Procurement Operating Expense Ratio** | Cost efficiency of the function. Benchmark against industry peers (e.g. | `GL_REVENUE, GL_EXPENSES` | Standard Columns |

#### 🔹 General Procurement
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Req-to-Pay (R2P) Cycle Time** | End-to-end speed. The grand total process time. | `ALL_STAGES` | Date |
| **Procurement Cycle Time Variability** | Process stability. Process improvement target. | `LOGS` | Standard Columns |
| **Procurement Technology Adoption** | Digital. ROI on tech. | `SYSTEM_LOGS` | Standard Columns |
| **Procurement Process Automation** | Digital. Efficiency. | `PROCESS_MAP` | Standard Columns |

#### 🔹 Orders (Purchasing)
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Electronic PO Rate / Digital Adoption** | Measure digitization maturity. Goal is 100%. Paper POs are slow and error-prone. | `PO_TRANSMISSION_LOG` | ID/Count |
| **Manual PO Processing Time** | Efficiency loss. Justification for automation. | `ACTIVITY_LOGS` | Standard Columns |

#### 🔹 Requests & Demand
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Total Requisitions (Count)** | Immediate visibility into demand volume. The absolute number of requests entering the system. | `REQUISITIONS` | Standard Columns |
| **Requisitions by Status** | Identify bottlenecks in approval flow. REQUISITIONS table | `Rejected` | Status/Category |
| **Pending Requests Aging** | Target old requests for immediate action. Stacked bar showing how many requests are rotting in the queue. | `REQUISITIONS` | Date |
| **RFQ to Order Conversion Rate** | Sourcing effectiveness. Low conversion means wasted effort on RFQs that go nowhere. | `SOURCING_EVENTS` | Standard Columns |
| **Requisition Volume Trend** | Resource planning. Seasonality analysis. | `REQUISITIONS` | Standard Columns |
| **Catalog Item Count** | Content richness. More items = more compliance. | `CATALOG_MASTER` | Standard Columns |
| **Free-Text Requisition Rate** | Compliance gap. Target for reduction. | `REQ_LINES` | Standard Columns |
| **Auto-Approval Rate** | Speed. Goal: Maximize for low value items. | `APPROVAL_LOGS` | Standard Columns |

#### 🔹 Vendors (SRM)
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Supplier Onboarding Cycle Time** | Speed to market. Slow onboarding delays projects and savings realization. | `VENDOR_MASTER_LOG` | Date |
| **Vendor Portal Adoption Rate** | Digitization. Drive self-service. | `PORTAL_USERS` | Standard Columns |

### 📂 Inventory & Logistics

#### 🔹 Inventory & Logistics
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Freight Cost per Unit / Shipment** | Logistics efficiency. Normalize by weight (Cost per kg/mile). | `SHIPMENT_LOGS, FREIGHT_BILLS` | Standard Columns |
| **Premium Freight Ratio** | Expediting waste measurement. High ratio indicates poor planning or production emergencies. | `FREIGHT_SPEND (Service_Level)` | Standard Columns |
| **Outbound Shipping Accuracy** | Customer service level (if applicable). Monthly | `and docs` | Standard Columns |
| **Average Customs Clearance Time** | Import efficiency. Delays here increase lead time and demurrage costs. | `IMPORT_LOGS` | Date |
| **Logistics Spend by Mode** | Transport strategy. Tables: FREIGHT_BILLS. | `Road` | Amount/Cost |
| **Warehouse Utilization** | Capacity planning. Need more space? | `WMS` | Standard Columns |
| **Inventory Record Accuracy (IRA)** | Data trust. System trust. | `CYCLE_COUNTS` | ID/Count |
| **Reverse Logistics Cost** | Quality cost. Cost of poor quality. | `FREIGHT, HANDLING` | Amount/Cost |

### 📂 Order / PO Performance

#### 🔹 Contracts & Sourcing
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Contract Renewal Rate** | Measure supplier retention and satisfaction. Low renewal might mean churning suppliers (good or bad?). | `CONTRACT_HISTORY` | Standard Columns |
| **Sourcing Cycle Time** | Measure RFx process speed. Long cycles delay savings realization. | `SOURCING_PROJECTS` | Date |

#### 🔹 Finance & Spend
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **First Pass Match Rate** | AP Efficiency metric. Key driver for touchless AP. dependent on PO and Data quality. | `AP_MATCHING_LOG` | ID/Count |
| **Receipt to Invoice Time** | Measure supplier billing speed. Lagging invoices complicate accruals and budget tracking. | `RECEIPTS, AP_INVOICES` | Date |
| **Invoice Approval Cycle Time** | Measure AP internal speed. Delays here cause late payments and missed discounts. | `AP_WORKFLOW_LOG` | Date |

#### 🔹 Orders (Purchasing)
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Total Purchase Orders Issued** | Measure workload and purchasing volume. Headline metric for purchasing activity. | `PURCHASE_ORDERS` | Standard Columns |
| **Open vs Closed POs** | Track completion rate of purchasing cycle. Simple snapshot of current workload. | `PURCHASE_ORDERS` | Standard Columns |
| **PO Cycle Time / Lead Time** | Speed of execution measurement. Internal processing speed. Automation reduces this drastically. | `PO_HISTORY_LOG` | Date |
| **PO Approval Cycle Time** | Identify bottlenecks in management approvals. Identify slow approvers. Segment by PO value thresholds. | `APPROVAL_LOGS` | Date |
| **PO Change Order Rate** | Measure process stability and requirement clarity. High change rate = poor definition of requirements or volatile demand. | `PO_VERSION_HISTORY` | ID/Count |
| **Emergency / Rush Order Rate** | Measure planning efficiency vs reactivity. Rush orders cost more (shipping + premium). High rate = poor planning. | `PURCHASE_ORDERS (Priority_Flag)` | ID/Count |
| **Administrative Cost per PO** | Efficiency benchmark. Industry benchmark varies ($50 - $500). High cost justifies automation. | `PO_COUNTS, GL_EXPENSES` | Standard Columns |
| **PO Cancellation Rate** | Measure waste and rework. Indicates changing business needs or errors in ordering. | `PURCHASE_ORDERS (Status)` | ID/Count |
| **PO Volume Trend** | Workload analysis. Correlate with headcount. | `PURCHASE_ORDERS` | Standard Columns |
| **Average Lines per PO** | Process efficiency. Consolidation metric. Higher is usually better (fewer POs). | `PO_LINES` | ID/Count |
| **Emergency Purchase Ratio** | Planning failure. High cost channel. | `PO_TYPES` | Standard Columns |
| **First Time Right PO** | Quality. Rework reduction. | `PO_HISTORY` | ID/Count |

#### 🔹 Requests & Demand
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Requisition to PO Cycle Time** | Measure internal approval and sourcing speed. Long cycle times frustrate stakeholders. Break down by Buyer. | `PURCHASE_ORDERS, REQUISITIONS` | Date |
| **PR Approval Cycle Time** | Identify bottlenecks in budget/management approvals. Often the biggest source of delay. Correlate with "Count of Approvers". | `REQUISITIONS, APPROVAL_LOGS` | Date |
| **Catalog Compliance / Usage Rate** | Drive users to pre-negotiated items. Catalog orders are touchless. Free-text requires manual buyer intervention. | `PO_LINES (Source_Type)` | Standard Columns |

### 📂 People / Competencies / Training

#### 🔹 Finance & Spend
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Savings per FTE** | Productivity metric. High savings/FTE indicates a highly effective team. | `SAVINGS_TRACKER, HR_HEADCOUNT` | ID/Count |
| **AP Staff Productivity (Invoices/FTE)** | Efficiency. Workload balancing. | `AP_LOGS` | ID/Count |

#### 🔹 General Procurement
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Training Hours per FTE** | Team development. Correlate with ""Certification Count"". | `HR_LMS` | Standard Columns |
| **Category Manager Workload (Spend/Count)** | Resource allocation. Identify overloaded managers. | `SPEND_ANALYSIS, ORG_CHART` | Amount/Cost, ID/Count, Status/Category |
| **Procurement Staff Turnover** | Team health. Retention issues? | `HR_DATA` | Standard Columns |
| **Certified Staff Ratio (CIPS/CPSM)** | Competency. Skill level. | `HR_DATA` | ID/Count |
| **Procurement Resource Utilization** | Efficiency. Capacity planning. | `TIMESHEETS` | Standard Columns |
| **Procurement Employee Satisfaction** | Culture. Retention. | `HR_SURVEY` | Standard Columns |
| **Procurement Training Spend per Employee** | Development. categories[value] | `Annually` | Amount/Cost |

#### 🔹 Orders (Purchasing)
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Orders / POs per Buyer / Employee** | Workload balancing. Balance workload. Too high = errors; Too low = inefficiency. | `BUYER_LIST, PURCHASE_ORDERS` | Standard Columns |
| **Cycle Time per Buyer** | Performance mgmt. Training needs identification. | `PO_LOGS` | Standard Columns |

### 📂 Spend & Cost

#### 🔹 Contracts & Sourcing
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Contract Utilization Rate** | Ensure negotiated contracts are actually used. Low utilization implies poor communication of contracts or poor vendor compliance. | `CONTRACT_SPEND, OFF_CONTRACT_SPEND` | Standard Columns |
| **Contract Pricing Compliance** | Recover overpayments. Discrepancies indicate system data errors or vendor billing errors. | `CONTRACT_ITEMS (Price_List), PO_LINES` | ID/Count |
| **Contract Coverage (Spend)** | Core compliance metric. Goal is typically >80%. Uncovered spend is market-price exposed. | `SPEND_ANALYSIS, CONTRACTS` | Amount/Cost |
| **Average Number of Bids per RFx** | Competition intensity. More bids = better price discovery. | `SOURCING_EVENTS` | ID/Count |

#### 🔹 Finance & Spend
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Total PO Value (Committed Spend)** | Financial control and budget tracking. Total money committed. | `PURCHASE_ORDERS` | Amount/Cost |
| **Travel Spend by Department** | Control overhead costs. Departmental spend view. | `EXPENSES` | Amount/Cost |
| **Spend Under Management (SUM)** | Increase procurement's influence and savings potential. Goal is >80%. Unmanaged spend (maverick) usually leaves 10-20% savings on the table. | `AP_SPEND_ANALYSIS (Vendor, Channel), Amount, GL_EXPENSES` | Amount/Cost |
| **Total Spend by Category** | Identify high-impact categories for sourcing strategies. Use Treemap or Sunburst. Essential for ""Pareto Analysis"" (top 20% categories = 80% spend). | `AP_INVOICES, COMMODITY_CODES (UNSPSC or Custom)` | Amount/Cost, Status/Category |
| **Spend by Business Unit / Department** | Allocate costs accurately and manage internal demand. Enables internal benchmarking (e.g. | `AP_INVOICES, ORG_STRUCTURE` | Amount/Cost |
| **Maverick Spend / Non-Contract Spend** | Reduce leakage and enforce compliance. High maverick spend erodes negotiated savings. Drill down to offender departments. | `AP_INVOICES, CONTRACT_COVERAGE_MAP` | Amount/Cost |
| **Cost Avoidance** | Capture value of procurement beyond price reduction (e.g. CPO / Finance | `AVOIDANCE = (Market_Price - Contract_Price) * Qty` | Standard Columns |
| **Cost Savings (Hard Savings)** | Direct bottom-line impact measurement. Must be validated by Finance to count towards EBITDA. Split by "Year-over-Year" vs "Negotiated". | `PO_HISTORY (Unit_Price_Old, Unit_Price_New), CONTRACTS` | Standard Columns |
| **Procurement ROI** | Justify existence and budget of procurement function. World-class is often > 5x or 10x. Includes both Hard Savings and Cost Avoidance (sometimes). | `GL_EXPENSES (Procurement_Dept), SAVINGS_TRACKER` | Standard Columns |
| **Annualized Savings Run-Rate** | Forecast future value delivery. Helps track progress against annual savings targets. | `SAVINGS_TRACKER, CONTRACT_START_DATES` | Standard Columns |
| **Spend Fragmentation (Tail Spend)** | Identify consolidation opportunities. High fragmentation = high admin cost. Strategy: Consolidate to preferred vendors or marketplaces. | `SUPPLIERS, AP_INVOICES` | Amount/Cost |
| **Spend Velocity / Burn Rate** | Monitor budget consumption speed. Alert if burn rate projects budget overrun before year-end. | `AP_INVOICES, BUDGETS` | Amount/Cost |
| **Spend per Employee (Indirect)** | Benchmark consumption patterns. Useful for benchmarking categories like Office Supplies, IT, Travel. | `HR_HEADCOUNT, AP_INVOICES (Indirect)` | Amount/Cost, ID/Count |
| **Savings Pipeline Coverage** | Ensure future savings targets will be met. Rule of thumb: Need 2x or 3x pipeline to hit 1x target. | `OPPORTUNITY_TRACKER (Stage, Est_Value), TARGETS` | Standard Columns |
| **Tail Spend Percentage** | Focus resources on strategic vs transactional spend. Procurement Strategy | `TAIL% = Sum(Bottom_80%_Suppliers_Spend) / Total_Spend` | Amount/Cost |
| **Spend Visibility** | Improve decision making data quality. Unclassified spend (General Ledger bucket "Misc") hides risks and opportunities. | `SPEND_CUBE, AP_GL_DUMP` | Amount/Cost |
| **Cost Reduction Ratio** | Measure impact on unit costs. Focus on top 50 SKUs. Aggregated view of deflationary efforts. | `ITEM_PRICE_HISTORY` | Standard Columns |
| **Realized Sourcing Savings** | Strategy effectiveness. The "banked" money. | `SAVINGS_TRACKER` | Amount/Cost |
| **Category Spend Trend** | Pattern recognition. Identify growing/shrinking categories. | `SPEND_ANALYSIS` | Amount/Cost, Status/Category |
| **Top 10 Items by Spend** | SKU rationalization. Candidates for auctions/negotiation. | `PO_LINES` | Amount/Cost |
| **Cost Center Spend Pareto** | Internal benchmarking. Who are the big spenders? | `AP_INVOICES` | Amount/Cost |
| **Realized Savings vs Budget** | Performance to plan. Are we hitting the number? | `SAVINGS_TRACKER` | Standard Columns |
| **Spend by GL Account** | Accounting view. Accounting reconciliation. | `AP_DISTRIBUTION` | Amount/Cost |
| **Material Price Index (Internal)** | Inflation tracking. Internal inflation rate. | `PO_HISTORY` | Standard Columns |
| **Savings to Cost Ratio** | ROI. Investment return. | `SAVINGS, GL` | Standard Columns |
| **Maverick Buying Rate** | Compliance. Control failure. | `PO_INVOICE_DATES` | ID/Count |
| **Procurement Savings Pipeline** | Planning. Future savings. | `PIPELINE` | Standard Columns |

#### 🔹 Orders (Purchasing)
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Price Variance (Purchase Price Variance - PPV)** | Detect cost creep and inflation impact. Negative PPV is bad (paid more). Critical for manufacturing/direct materials. | `PO_LINES (Price), RECEIPTS, ITEM_MASTER (Std_Cost)` | Standard Columns |
| **Average PO Value** | Optimize transaction efficiency (reduce small POs). Low average value suggests need for P-Cards or Catalogs to reduce process cost. | `PURCHASE_ORDERS` | ID/Count |
| **PO Value Distribution (Buckets)** | Process fit. Ops | `Histogram` | Standard Columns |

#### 🔹 Requests & Demand
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Category Budget Utilization** | Track category-level performance against limits. Heatmap or bar chart showing which categories are over/under budget. | `AP_INVOICES, BUDGETS` | Status/Category |
| **Budget Burn Rate** | Fiscal control. Are we spending too fast? | `BUDGETS` | Standard Columns |

#### 🔹 Vendors (SRM)
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Total Spend by Supplier** | Negotiate volume discounts and consolidate tail spend. Identify top strategic partners. Watch for ""Tail Spend"" (too many small suppliers). | `VENDOR_HIERARCHY, AP_INVOICES` | Amount/Cost |
| **Spend in High-Risk Countries / Geographies** | Mitigate geopolitical and supply continuity risks. Map visualization is best. Define risk by political stability, natural disaster, etc. | `VENDOR_ADDRESS, RISK_MAP, AP_INVOICES` | Amount/Cost, ID/Count |
| **Top 10 Suppliers by Spend** | Focus list. These 10 usually equal 50% of spend. | `SPEND_ANALYSIS` | Amount/Cost |

### 📂 Supplier / Quality

#### 🔹 Orders (Purchasing)
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Perfect Order Rate** | Composite metric for overall supply chain reliability. Tables: RECEIPTS, QUALITY, AP_INVOICES (Doc_Errors). | `Damage-Free` | Standard Columns |
| **Item Fill Rate (Line Fill Rate)** | Measure order completeness. Distinguish between "Line Fill" and "Order Fill". | `RECEIPTS, PO_LINES` | Standard Columns |
| **Under-Delivery Rate** | Identify quantity compliance issues. Causes production shortages. Check if backordered or cancelled. | `RECEIPTS, PO_LINES` | ID/Count |
| **Over-Delivery Rate** | Identify quantity compliance issues. Causes inventory bloat and payment disputes. | `RECEIPTS, PO_LINES` | ID/Count |

#### 🔹 Vendors (SRM)
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Total Vendor Count** | Database size monitoring. Size of supply base. | `VENDORS` | Standard Columns |
| **Active vs Inactive Vendors** | Cleanse master data. Active vs dead weight. | `VENDORS` | Standard Columns |
| **Supplier On-Time Delivery (OTD)** | Avoid production stoppages and maintain service levels. Critical KPI. Drill down by supplier. Define "On Time" window (e.g., +/- 1 day). | `PURCHASE_ORDERS (Promised_Date), RECEIPTS (Date)` | ID/Count |
| **Supplier Defect Rate / Quality Yield** | Reduce rework and scrap costs. Track PPM (Parts Per Million) for high volume. Correlate with Supplier Scorecard. | `QUALITY_LOGS (Pass/Fail), RECEIPTS` | Standard Columns |
| **Supplier Lead Time Variance** | Improve inventory planning and safety stock calculation. High variance forces higher safety stock. Identify reliable vs erratic suppliers. | `PO (Created_Date), ITEM_MASTER (Lead_Time), RECEIPTS (Date)` | Standard Columns |
| **Return to Vendor (RTV) Rate** | Measure severity of quality failures. High RTV indicates serious quality control failures at supplier site. | `RTV_LOGS, RECEIPTS` | Standard Columns |
| **Supplier Incident Rate** | Track operational disruptions caused by suppliers. Incidents include packaging errors, documentation missing, labeling issues. | `INCIDENT_LOG, SCAR_SYSTEM` | Standard Columns |
| **Supplier Audit Compliance** | Ensure suppliers meet regulatory and internal standards. Critical for pharma | `Supplier), AUDIT_RECORDS (Date, Result` | ID/Count |
| **Supplier Availability / Uptime** | For service/IT contracts: monitor service consistency. Crucial for SaaS, Logistics, and Maintenance contracts. | `SLA_MONITORING, SERVICE_LOGS` | Standard Columns |
| **Supplier Innovation Contribution** | Track value beyond cost savings from partners. Shift from transactional to strategic relationship. Hard to measure but valuable. | `SRM_MEETINGS, INNOVATION_PORTAL` | Standard Columns |
| **Supplier Responsiveness / Response Time** | Measure ease of doing business. Slow response is a leading indicator of future delivery issues. | `EMAIL_LOGS or PORTAL_TIMESTAMPS` | Date |
| **Supplier Invoice Error Rate** | Measure administrative quality of supplier. Monthly | `info)` | Standard Columns |
| **Supplier Scorecard Distribution** | Macro view of supply base performance. Tables: SCORECARD_RESULTS. | `Bronze` | Standard Columns |
| **Sub-tier Supplier Visibility** | Risk management for deep supply chain. Identify choke points (e.g., all suppliers use same raw material source). | `SUPPLY_CHAIN_MAP` | Standard Columns |
| **Supplier Concentration Risk (Revenue Dependence)** | Avoid suppliers who are too dependent on us (financial risk). If we are >30% of their revenue, they are high risk if we leave. If >50%, we own them. | `VENDOR_FINANCIALS, AP_SPEND` | Standard Columns |
| **Supplier Capacity Utilization** | Predict supply shortages. If >90%, risk of delay increases. If <50%, financial risk for supplier. | `CAPACITY_SURVEYS, FORECAST` | Standard Columns |
| **Supplier Geographical Map** | Supply base visualization. Visual aid for risk and logistics. | `VENDOR_ADDRESS` | ID/Count |
| **Supplier Retention Rate** | Relationship stability. High churn is costly. | `SPEND_ANALYSIS` | Standard Columns |
| **New Supplier Additions** | Gatekeeping. Are we proliferating suppliers? | `VENDOR_LOG` | Standard Columns |
| **Inactive Supplier Count** | Data hygiene. Candidates for deactivation. | `VENDOR_MASTER` | Standard Columns |
| **Supplier Lead Time Variability** | Reliability. Safety stock driver. | `RECEIPTS` | Standard Columns |
| **Supplier Performance Review Coverage** | SRM. Relationship mgmt. | `SRM_TOOL` | Standard Columns |
| **Supplier Development Projects** | Innovation. Value add. | `PROJECT_TRACKER` | ID/Count |

### 📂 Sustainability & CSR

#### 🔹 Contracts & Sourcing
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Sustainable Sourcing Rate** | ESG. Impact. | `SOURCING_EVENTS` | ID/Count |
| **Diversity Sourcing Rate** | DEI. Inclusion. | `SOURCING_EVENTS` | ID/Count |
| **Local Sourcing Rate** | Local impact. Community support. | `SPEND_ANALYSIS` | Standard Columns |

#### 🔹 Vendors (SRM)
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Scope 3 Carbon Emissions** | Sustainability compliance. Environmental impact. | `EMISSION_FACTORS, PO_LINES` | Amount/Cost |
| **Spend with Sustainable Suppliers Ratio** | ESG Goal tracking. Key metric for Annual Report. | `VENDOR_CERTIFICATIONS, SPEND_ANALYSIS` | Amount/Cost |
| **Supplier Diversity Spend Ratio** | CSR / DEI Goal tracking. Often a regulatory or client requirement (e.g. | `VENDOR_CERTIFICATIONS, SPEND_ANALYSIS` | Amount/Cost |
| **Diverse Supplier Count** | Program reach. Expansion of the program. | `VENDOR_CERTIFICATIONS` | Standard Columns |
| **Green / Sustainable Supplier Count** | Program reach. Expansion of the program. | `VENDOR_CERTIFICATIONS` | Standard Columns |
| **Procurement Sustainability Impact** | ESG. Sustainability | `Sum(Impact)` | Standard Columns |
| **Procurement Diversity Impact** | DEI. Social value. | `DEI_REPORT` | Standard Columns |
| **Procurement Local Impact** | Local. Community. | `SPEND_ANALYSIS` | Standard Columns |
| **Procurement Ethical Sourcing** | Ethics. Reputation. | `CERTIFICATIONS` | Standard Columns |

### 📂 Working Capital & Payments

#### 🔹 Finance & Spend
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Average Payment Period / Days Payable Outstanding (DPO)** | Improve cash flow management and negotiate better payment terms. Track by supplier and category. Use a calendar table for continuous periods. Consider excluding disputed invoices; show p50/p90 alongside average. | `Payment_Date, AP_INVOICES (Supplier_ID, Amount), Invoice_Date, SUPPLIERS; optional COGS from GL` | Date |
| **Days Receivable Outstanding (DSO)** | Improve liquidity forecasting by monitoring collection speed. Though AR is outside procurement, include to complete cash-to-cash. Segment by customer group and payment terms; exclude credit memos if needed. | `Receipt_Date, CUSTOMERS, Amount), Invoice_Date, AR_INVOICES (Invoice_ID` | Date |
| **Cash-to-Cash Cycle Time (CCC)** | Assess working capital efficiency across procure-to-pay and order-to-cash. Lower CCC indicates better cash efficiency. Provide sensitivity by adjusting terms and inventory policies; show component trends (ID, DSO, DPO). | `COGS), AR_INVOICES, DATE_DIM, AP_INVOICES, Inventory_Snapshot (Avg_Inventory` | Standard Columns |
| **Payment Delinquency Rate** | Reveal cash coordination gaps between procurement Monthly | `Share of invoices paid after due date within period` | Standard Columns |
| **Interest / Late Fee Cost** | Quantify loss from payment delays and prioritize remediation. Drill by supplier and category; benchmark before/after process improvements; show % of AP spend impacted. | `Date), Amount, AP_INVOICES, Supplier_ID, AP_CHARGES (Charge_Type` | Amount/Cost |
| **Invoice vs PO Variance / Match Rate** | Reduce manual intervention in AP and prevent overpayment. High match rates enable touchless processing. Track variances by supplier to identify chronic billing errors. | `RECEIPTS, AP_INVOICES, PURCHASE_ORDERS (Price, Qty)` | Standard Columns |
| **Early Payment Discount Capture Rate** | Directly increase bottom-line savings through efficient AP processing. Missed discounts are often due to slow approval workflows. Correlate with "Invoice Approval Cycle Time". | `Payment_Date, AP_INVOICES (Terms, DISCOUNTS_OFFERED, Amount)` | Amount/Cost |
| **Accounts Payable Aging Buckets** | Forecast short-term cash outflows and manage supplier relationships. Use stacked bar chart by supplier category. Critical for cash flow planning. | `Status='Open'), AP_AGING_SNAPSHOT or AP_INVOICES (Due_Date, Amount` | Date, Amount/Cost |
| **Duplicate Payment Ratio** | Detect fraud or system errors; recover lost cash. Implementation of controls is better than detection. Often caused by master data duplication (same vendor twice). | `Date), AP_PAYMENTS (Vendor, Amount, Invoice_Ref` | Standard Columns |
| **Working Capital Turnover** | Measure how effectively capital is used to generate revenue. Higher ratio implies efficient usage. Procurement impacts this via Inventory and AP terms. | `GL_INCOME_STATEMENT (Sales), Current_Liabilities), GL_BALANCE_SHEET (Current_Assets` | Standard Columns |
| **AP Automation / Touchless Processing Rate** | Reduce AP processing costs and error rates. Investigate manual touch points (coding | `AP_PROCESS_LOG (Invoice_ID, Method), Touch_Count` | Standard Columns |
| **Supplier Payment Term Compliance** | Ensure negotiated terms are actually applied in the ERP. Discrepancies lead to early payments (cash drag) or late payments (relationship damage). | `VENDOR_MASTER (Terms), CONTRACTS (Terms), AP_INVOICES (Applied_Terms)` | Standard Columns |
| **Cost per Invoice Processed** | Benchmark AP efficiency and justify automation investments. Compare vs industry benchmarks. High cost suggests need for EDI/OCR or process simplification. | `AP_INVOICES (Count), GL_EXPENSES (Cost_Center_AP)` | Standard Columns |
| **Unmatched Invoices Aging** | Clear bottlenecks preventing payment and accruals. Accounts Payable | `SUM(Amount) of blocked invoices grouped by days since receipt` | Date |
| **Payment Method Mix (Check vs ACH vs Card)** | Shift to cheaper/safer payment methods (e.g.  Card | `COUNT(Payments) by Method (Check` | Standard Columns |
| **Invoice Volume Trend** | AP workload analysis. Predict end-of-month spikes. | `AP_INVOICES` | Standard Columns |
| **Rejected Invoice Rate** | Process quality. Indicates poor supplier instruction or strict controls. | `AP_INVOICES` | Standard Columns |
| **Payment Terms Distribution** | Cash flow leverage. Quarterly | `etc)` | Standard Columns |
| **GR/IR Imbalance Account** | Accounting hygiene. Clearing account health. | `GR_IR_ACCOUNT` | Standard Columns |
| **Lost Early Payment Discounts** | Opportunity cost. Money left on the table. | `DISCOUNTS` | Amount/Cost |
| **Invoice Exception Rate** | Process quality. Automation blocker. | `AP_WORKFLOW` | ID/Count |

#### 🔹 Inventory & Logistics
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Days Sales of Inventory (DSI)** | Optimize stock levels to free up cash. High DSI indicates overstock/obsolescence risk; Low DSI risks stockouts. Balance with Service Level. | `GL_COGS, INVENTORY_VALUATION` | Standard Columns |

#### 🔹 Orders (Purchasing)
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Late Payment Penalty Cost per PO / Supplier** | Pinpoint specific suppliers or buyers causing late fees. Use pareto chart to find the ""vital few"" suppliers causing most penalties. | `AP_CHARGES, PURCHASE_ORDERS` | Amount/Cost |

#### 🔹 Requests & Demand
| Report Title | What It Does | Data Required (Tables) | Key Data Points |
|---|---|---|---|
| **Budget vs Actual Requests** | Prevent overspending before it is committed. Implement ""Pre-encumbrance"" tracking. Visualize as bullet chart or gauge per department. | `REQUISITIONS, Category, Amount), BUDGETS (Department` | Amount/Cost |