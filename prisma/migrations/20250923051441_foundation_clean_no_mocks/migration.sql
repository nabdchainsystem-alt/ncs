-- CreateTable
CREATE TABLE "Request" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderNo" TEXT NOT NULL,
    "title" TEXT,
    "type" TEXT,
    "department" TEXT,
    "vendor" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "status" TEXT NOT NULL DEFAULT 'Open',
    "quantity" INTEGER,
    "requiredDate" DATETIME,
    "warehouse" TEXT DEFAULT '',
    "requester" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "approval" TEXT DEFAULT 'Pending'
);

-- CreateTable
CREATE TABLE "RequestItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requestId" INTEGER NOT NULL,
    "name" TEXT,
    "qty" INTEGER,
    "unit" TEXT,
    "code" TEXT,
    "machine" TEXT,
    "warehouse" TEXT,
    "requester" TEXT,
    "status" TEXT DEFAULT 'NEW',
    "note" TEXT,
    CONSTRAINT "RequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "priority" TEXT DEFAULT 'Medium',
    "assignee" TEXT,
    "label" TEXT,
    "dueDate" DATETIME,
    "order" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "categoriesJson" TEXT,
    "regionsJson" TEXT,
    "contactsJson" TEXT,
    "bankJson" TEXT,
    "onTimePct" REAL,
    "leadTimeAvgDays" INTEGER,
    "qualityPpm" REAL,
    "priceIndex" REAL,
    "quoteRespHrs" REAL,
    "trustScore" REAL,
    "prefIncoterms" TEXT,
    "shipModesJson" TEXT,
    "avgCO2perOrder" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VendorProduct" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vendorId" INTEGER NOT NULL,
    "itemCode" TEXT NOT NULL,
    "price" REAL,
    "currency" TEXT DEFAULT 'SAR',
    "lastQuotedAt" DATETIME,
    "moq" INTEGER,
    "leadTimeDays" INTEGER,
    CONSTRAINT "VendorProduct_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VendorPerformanceHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vendorId" INTEGER NOT NULL,
    "month" DATETIME NOT NULL,
    "onTimePct" REAL,
    "qualityPpm" REAL,
    "disputes" INTEGER,
    "quotesCount" INTEGER,
    "avgRespHrs" REAL,
    "trustScore" REAL,
    CONSTRAINT "VendorPerformanceHistory_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VendorDocument" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vendorId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "number" TEXT,
    "expiry" DATETIME,
    "fileUrl" TEXT,
    "valid" BOOLEAN DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VendorDocument_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLoginAt" DATETIME
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "materialNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "unit" TEXT,
    "qtyOnHand" INTEGER NOT NULL DEFAULT 0,
    "reorderPoint" INTEGER NOT NULL DEFAULT 0,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "warehouseId" INTEGER,
    "lastMovementAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryItem_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "itemId" INTEGER NOT NULL,
    "moveType" TEXT NOT NULL DEFAULT 'IN',
    "qty" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "plateNo" TEXT NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "department" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "odometer" INTEGER,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastServiceAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MaintenanceRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vehicleId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "costSar" REAL NOT NULL DEFAULT 0,
    "vendorName" TEXT,
    "odometer" INTEGER,
    "notes" TEXT,
    CONSTRAINT "MaintenanceRecord_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Rfq" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requestId" INTEGER NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "contactEmail" TEXT,
    "contactName" TEXT,
    "message" TEXT,
    "status" TEXT DEFAULT 'Pending',
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Rfq_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Rfq_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderNo" TEXT NOT NULL,
    "vendorId" INTEGER,
    "requestId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "totalValue" REAL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "expectedDelivery" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "category" TEXT,
    "version" TEXT DEFAULT '1.0',
    "effectiveAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Request_orderNo_key" ON "Request"("orderNo");

-- CreateIndex
CREATE INDEX "Request_createdAt_idx" ON "Request"("createdAt");

-- CreateIndex
CREATE INDEX "Request_department_idx" ON "Request"("department");

-- CreateIndex
CREATE INDEX "Request_vendor_idx" ON "Request"("vendor");

-- CreateIndex
CREATE INDEX "Request_orderNo_idx" ON "Request"("orderNo");

-- CreateIndex
CREATE INDEX "Task_status_order_idx" ON "Task"("status", "order");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_code_key" ON "Vendor"("code");

-- CreateIndex
CREATE INDEX "Vendor_code_idx" ON "Vendor"("code");

-- CreateIndex
CREATE INDEX "Vendor_status_idx" ON "Vendor"("status");

-- CreateIndex
CREATE INDEX "Vendor_name_idx" ON "Vendor"("name");

-- CreateIndex
CREATE INDEX "Vendor_categoriesJson_idx" ON "Vendor"("categoriesJson");

-- CreateIndex
CREATE INDEX "Vendor_trustScore_idx" ON "Vendor"("trustScore");

-- CreateIndex
CREATE INDEX "Vendor_status_trustScore_idx" ON "Vendor"("status", "trustScore");

-- CreateIndex
CREATE INDEX "Vendor_onTimePct_idx" ON "Vendor"("onTimePct");

-- CreateIndex
CREATE INDEX "Vendor_leadTimeAvgDays_idx" ON "Vendor"("leadTimeAvgDays");

-- CreateIndex
CREATE INDEX "Vendor_priceIndex_idx" ON "Vendor"("priceIndex");

-- CreateIndex
CREATE INDEX "Vendor_quoteRespHrs_idx" ON "Vendor"("quoteRespHrs");

-- CreateIndex
CREATE INDEX "Vendor_name_status_idx" ON "Vendor"("name", "status");

-- CreateIndex
CREATE INDEX "VendorProduct_vendorId_itemCode_idx" ON "VendorProduct"("vendorId", "itemCode");

-- CreateIndex
CREATE INDEX "VendorProduct_price_idx" ON "VendorProduct"("price");

-- CreateIndex
CREATE INDEX "VendorProduct_leadTimeDays_idx" ON "VendorProduct"("leadTimeDays");

-- CreateIndex
CREATE UNIQUE INDEX "VendorProduct_vendorId_itemCode_key" ON "VendorProduct"("vendorId", "itemCode");

-- CreateIndex
CREATE INDEX "VendorPerformanceHistory_vendorId_month_idx" ON "VendorPerformanceHistory"("vendorId", "month");

-- CreateIndex
CREATE INDEX "VendorPerformanceHistory_vendorId_trustScore_idx" ON "VendorPerformanceHistory"("vendorId", "trustScore");

-- CreateIndex
CREATE INDEX "VendorDocument_vendorId_type_idx" ON "VendorDocument"("vendorId", "type");

-- CreateIndex
CREATE INDEX "VendorDocument_expiry_idx" ON "VendorDocument"("expiry");

-- CreateIndex
CREATE INDEX "VendorDocument_valid_idx" ON "VendorDocument"("valid");

-- CreateIndex
CREATE INDEX "VendorDocument_type_expiry_valid_idx" ON "VendorDocument"("type", "expiry", "valid");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_code_key" ON "Warehouse"("code");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_materialNo_key" ON "InventoryItem"("materialNo");

-- CreateIndex
CREATE INDEX "InventoryItem_warehouseId_idx" ON "InventoryItem"("warehouseId");

-- CreateIndex
CREATE INDEX "InventoryItem_isDeleted_idx" ON "InventoryItem"("isDeleted");

-- CreateIndex
CREATE INDEX "StockMovement_itemId_idx" ON "StockMovement"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_plateNo_key" ON "Vehicle"("plateNo");

-- CreateIndex
CREATE INDEX "Vehicle_status_idx" ON "Vehicle"("status");

-- CreateIndex
CREATE INDEX "Vehicle_isDeleted_idx" ON "Vehicle"("isDeleted");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_vehicleId_date_idx" ON "MaintenanceRecord"("vehicleId", "date");

-- CreateIndex
CREATE INDEX "Rfq_vendorId_idx" ON "Rfq"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "Rfq_requestId_vendorId_key" ON "Rfq"("requestId", "vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNo_key" ON "Order"("orderNo");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_expectedDelivery_idx" ON "Order"("expectedDelivery");

-- CreateIndex
CREATE INDEX "Policy_category_idx" ON "Policy"("category");
