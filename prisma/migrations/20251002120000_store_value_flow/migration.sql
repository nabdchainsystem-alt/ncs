PRAGMA foreign_keys=OFF;
PRAGMA defer_foreign_keys=ON;

-- Redefine Request to include store metadata
CREATE TABLE "new_Request" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderNo" TEXT NOT NULL,
    "title" TEXT,
    "type" TEXT,
    "department" TEXT,
    "vendor" TEXT,
    "vendorId" INTEGER,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "status" TEXT NOT NULL DEFAULT 'Open',
    "quantity" INTEGER,
    "requiredDate" DATETIME,
    "warehouse" TEXT DEFAULT '',
    "requester" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "approval" TEXT DEFAULT 'Pending',
    "storeId" INTEGER,
    "storeLabel" TEXT,
    CONSTRAINT "Request_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Request_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Request" (
  "id", "orderNo", "title", "type", "department", "vendor", "vendorId", "priority", "status", "quantity", "requiredDate", "warehouse", "requester", "createdAt", "updatedAt", "approval",
  "storeId", "storeLabel"
)
SELECT
  "id", "orderNo", "title", "type", "department", "vendor", "vendorId", "priority", "status", "quantity", "requiredDate", "warehouse", "requester", "createdAt", "updatedAt", "approval",
  NULL, NULL
FROM "Request";
DROP TABLE "Request";
ALTER TABLE "new_Request" RENAME TO "Request";
CREATE INDEX "Request_orderNo_idx" ON "Request"("orderNo");
CREATE INDEX "Request_vendorId_idx" ON "Request"("vendorId");
CREATE INDEX "Request_department_idx" ON "Request"("department");
CREATE INDEX "Request_createdAt_idx" ON "Request"("createdAt");
CREATE INDEX "Request_storeId_idx" ON "Request"("storeId");

-- Redefine RequestItem to track store
CREATE TABLE "new_RequestItem" (
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
    "storeId" INTEGER,
    "storeLabel" TEXT,
    CONSTRAINT "RequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RequestItem_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_RequestItem" (
  "id", "requestId", "name", "qty", "unit", "code", "machine", "warehouse", "requester", "status", "note",
  "storeId", "storeLabel"
)
SELECT
  "id", "requestId", "name", "qty", "unit", "code", "machine", "warehouse", "requester", "status", "note",
  NULL, NULL
FROM "RequestItem";
DROP TABLE "RequestItem";
ALTER TABLE "new_RequestItem" RENAME TO "RequestItem";
CREATE INDEX "RequestItem_requestId_idx" ON "RequestItem"("requestId");
CREATE INDEX "RequestItem_storeId_idx" ON "RequestItem"("storeId");

-- Redefine Order to include store metadata
CREATE TABLE "new_Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderNo" TEXT NOT NULL,
    "vendorId" INTEGER,
    "requestId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "totalValue" REAL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "expectedDelivery" DATETIME,
    "storeId" INTEGER,
    "storeLabel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" (
  "id", "orderNo", "vendorId", "requestId", "status", "totalValue", "currency", "expectedDelivery", "createdAt", "updatedAt",
  "storeId", "storeLabel"
)
SELECT
  "id", "orderNo", "vendorId", "requestId", "status", "totalValue", "currency", "expectedDelivery", "createdAt", "updatedAt",
  NULL, NULL
FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_orderNo_key" ON "Order"("orderNo");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_expectedDelivery_idx" ON "Order"("expectedDelivery");
CREATE INDEX "Order_storeId_idx" ON "Order"("storeId");

-- Redefine StockMovement to track store movement/value
CREATE TABLE "new_StockMovement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "itemId" INTEGER NOT NULL,
    "moveType" TEXT NOT NULL DEFAULT 'IN',
    "qty" INTEGER NOT NULL,
    "note" TEXT,
    "orderId" INTEGER,
    "sourceWarehouseId" INTEGER,
    "destinationWarehouseId" INTEGER,
    "sourceWarehouseLabel" TEXT,
    "destinationWarehouseLabel" TEXT,
    "sourceStoreId" INTEGER,
    "destinationStoreId" INTEGER,
    "storeId" INTEGER,
    "valueSar" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_sourceWarehouseId_fkey" FOREIGN KEY ("sourceWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_destinationWarehouseId_fkey" FOREIGN KEY ("destinationWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_sourceStoreId_fkey" FOREIGN KEY ("sourceStoreId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_destinationStoreId_fkey" FOREIGN KEY ("destinationStoreId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_StockMovement" (
  "id", "itemId", "moveType", "qty", "note", "orderId", "sourceWarehouseId", "destinationWarehouseId",
  "sourceWarehouseLabel", "destinationWarehouseLabel", "createdAt",
  "sourceStoreId", "destinationStoreId", "storeId", "valueSar"
)
SELECT
  "id", "itemId", "moveType", "qty", "note", "orderId", "sourceWarehouseId", "destinationWarehouseId",
  "sourceWarehouseLabel", "destinationWarehouseLabel", "createdAt",
  NULL, NULL, NULL, NULL
FROM "StockMovement";
DROP TABLE "StockMovement";
ALTER TABLE "new_StockMovement" RENAME TO "StockMovement";
CREATE INDEX "StockMovement_itemId_idx" ON "StockMovement"("itemId");
CREATE INDEX "StockMovement_orderId_idx" ON "StockMovement"("orderId");
CREATE INDEX "StockMovement_sourceWarehouseId_idx" ON "StockMovement"("sourceWarehouseId");
CREATE INDEX "StockMovement_destinationWarehouseId_idx" ON "StockMovement"("destinationWarehouseId");
CREATE INDEX "StockMovement_storeId_idx" ON "StockMovement"("storeId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
