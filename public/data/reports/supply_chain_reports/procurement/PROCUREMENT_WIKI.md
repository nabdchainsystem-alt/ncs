# Procurement Data Wiki

## 1. Overview
This document serves as the **Single Source of Truth** for the Procurement Data Layer. It defines the physical tables available in the system, their schemas, and how they map to the "Logical Data Keys" requested by the 75,000+ reports in the Supply Chain Analytics Engine.

**Purpose:**
- **For Developers:** Understand table schemas and column types.
- **For Analysts:** Know which tables to query for specific reports.
- **For Architects:** Identify missing data dependencies and integration points.

---

## 2. Logical to Physical Mapping
The Reporting Engine uses "Logical Keys" (e.g., `PO_TABLE`) to request data. These keys map to specific "Physical Tables" (e.g., `PRC_PO_Headers`).

| Logical Key (Report Requirement) | Physical Table ID | Description |
| :--- | :--- | :--- |
| **VENDOR_MASTER**, `SUPPLIERS`, `Vendors` | `PRC_Vendors` | Master list of all suppliers and vendors. |
| **RISK_TABLE**, `VendorRisk` | `PRC_Vendor_Risk` | Risk scores (Financial, ESG, Operational). |
| **CATEGORY_MASTER**, `Categories` | `PRC_Categories` | Spend category tree (Level 1-4). |
| **ITEMS**, `MaterialMaster` | `PRC_Items` | Products and services master data. |
| **REQUISITIONS**, `Requests` | `PRC_Requisitions` | Internal purchase requests (PR). |
| **PO_TABLE**, `PO_HEADERS`, `Orders` | `PRC_PO_Headers` | Purchase Order headers. |
| **PO_LINES** | `PRC_PO_Lines` | Line-item details for POs. |
| **RFQ_LOGS**, `Tenders` | `PRC_RfQ_Headers` | Requests for Quotation (Sourcing events). |
| **QUOTES** | `PRC_Supplier_Quotes` | Supplier responses to RFQs. |
| **CONTRACTS**, `Agreements` | `PRC_Contracts` | Legal contracts and framework agreements. |
| **INVOICES**, `AP_INVOICES`, `AP` | `PRC_Invoices` | Accounts Payable invoices. |
| **PAYMENTS**, `Cash` | `PRC_Payments` | Payment records linked to invoices. |
| **SAVINGS_LOG**, `Projects` | `PRC_Savings_Register` | Tracked savings and cost avoidance. |

---

## 3. Table Definitions & Schemas

### 3.1 Master Data

#### `PRC_Vendors` (Vendor Master)
*The central repository for all supplier information.*
- **vendor_id** (`string`, PK): Unique System ID (e.g., `VND-001`).
- **vendor_code** (`string`): ERP Code (e.g., `SAP-1002`).
- **vendor_name** (`string`): Legal Name.
- **country** (`string`): ISO Country Code.
- **category_segment** (`string`): Primary category (e.g., "IT Services").
- **status** (`string`): `Active`, `Inactive`, `Blacklisted`.

#### `PRC_Items` (Item Master)
*Catalog of goods and services.*
- **item_id** (`string`, PK): Unique Item ID.
- **item_code** (`string`): SKU or Service Code.
- **item_description** (`string`): Full text description.
- **uom** (`string`): Unit of Measure (e.g., `EA`, `KG`, `HR`).
- **item_type** (`string`): `Goods` or `Service`.

### 3.2 Transactional Data

#### `PRC_PO_Headers` (Purchase Orders)
*Confirmed orders sent to suppliers.*
- **po_id** (`string`, PK): Unique PO ID.
- **po_no** (`string`): Human-readable PO Number (e.g., `PO-2024-001`).
- **vendor_id** (`string`, FK): Link to `PRC_Vendors`.
- **po_date** (`date`): Date of issuance.
- **currency** (`string`): Transaction currency (e.g., `USD`).
- **status** (`string`): `Draft`, `Issued`, `Received`, `Closed`.
- **buying_group** (`string`): Department or Entity placing the order.

#### `PRC_Invoices` (AP Invoices)
*Bills received from vendors.*
- **invoice_id** (`string`, PK): Unique Invoice ID.
- **invoice_no** (`string`): Vendor's Invoice Number.
- **vendor_id** (`string`, FK): Link to `PRC_Vendors`.
- **invoice_date** (`date`): Date on invoice.
- **due_date** (`date`): Payment due date.
- **invoice_amount** (`number`): Total amount including tax.
- **match_status** (`string`): `2-Way Match`, `3-Way Match`, `Mismatch`.

#### `PRC_RfQ_Headers` (Sourcing Events)
*Tenders and requests for quotes.*
- **rfq_id** (`string`, PK): Unique RFQ ID.
- **rfq_no** (`string`): Public Reference Number.
- **creation_date** (`date`): Start date.
- **sourcing_event_type** (`string`): `RFI`, `RFP`, `RFQ`, `Auction`.

---

## 4. Missing Dependencies (Gap Analysis)
The following data domains are requested by reports but **do not yet exist** in the Procurement schema. These require cross-departmental integration or new table creation.

### High Priority (Critical for >2000 Reports)
1.  **FINANCIAL_DATA**: General Ledger, Budget vs Actuals. (Likely `Finance` Dept).
2.  **INVENTORY_DATA**: Stock levels, movements. (Exists in `Warehouse` Dept as `WHS_Inventory`).
3.  **DEMAND_DATA**: Sales forecasts. (Exists in `Planning` Dept as `PLN_Demand_Forecast`).
4.  **LOGISTICS_DATA**: Freight costs, routes. (Exists in `Shipping` Dept).

### Medium Priority
1.  **ESG_SURVEYS**: Detailed sustainability audit logs.
2.  **MARKET_INDEXES**: External commodity price feeds (e.g., Metal, Oil).
3.  **SLA_DEFINITIONS**: Contractual Service Level Agreement details.

---

## 5. How to Use This Data
To create a new chart for "Spend by Vendor":
1.  **Source**: Query `PRC_Invoices`.
2.  **Join**: `PRC_Vendors` on `vendor_id`.
3.  **Filter**: `invoice_date` within range.
4.  **Aggregate**: Sum `invoice_amount` by `vendor_name`.

*Wiki generated by Antigravity Data Engineering.*
