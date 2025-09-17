# Page Structure

```text
src/pages
├── Dashboard
│   └── Overview.tsx              → /overview (re-exports existing overview)
├── SupplyChain
│   ├── Requests.tsx              → /requests (delegates to legacy Requests page)
│   ├── Orders.tsx                → /orders (delegates to legacy Orders page)
│   ├── Inventory.tsx             → /inventory (delegates to legacy Inventory page)
│   ├── Vendors.tsx               → /vendors (delegates to legacy Vendors page)
│   └── Fleet.tsx                 → /fleet (Coming Soon)
├── Operations
│   ├── Maintenance.tsx           → /operations/maintenance (Coming Soon)
│   ├── Production.tsx            → /operations/production (Coming Soon)
│   ├── Quality.tsx               → /operations/quality (Coming Soon)
│   └── Planning.tsx              → /operations/planning (Coming Soon)
├── OtherDepartments
│   ├── Sales.tsx                 → /other/sales (Coming Soon)
│   ├── Finance.tsx               → /other/finance (Coming Soon)
│   └── HumanResources.tsx        → /other/human-resources (Coming Soon)
├── Tools
│   ├── Calendar.tsx              → /calendar (delegates to legacy Calendar page)
│   └── Tasks.tsx                 → /tasks (delegates to legacy Tasks page)
├── SmartTools
│   ├── Lab.tsx                   → /lab (delegates to legacy Lab page)
│   └── SmartReports.tsx          → /smart-tools/reports (Coming Soon)
├── Marketplace
│   ├── LocalMarket.tsx           → /marketplace/local (Coming Soon)
│   └── GlobalMarket.tsx          → /marketplace/global (Coming Soon)
└── shared
    └── ComingSoonPage.tsx        → shared layout used by Coming Soon placeholders
```

_All legacy pages (e.g. `src/pages/Requests.tsx`, `src/pages/Orders.tsx`, `src/pages/Marketplace.tsx`) remain unchanged and are consumed by the new directory entry points where noted._
