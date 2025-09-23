-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    CONSTRAINT "Request_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Request" ("approval", "createdAt", "department", "id", "orderNo", "priority", "quantity", "requester", "requiredDate", "status", "title", "type", "updatedAt", "vendor", "warehouse") SELECT "approval", "createdAt", "department", "id", "orderNo", "priority", "quantity", "requester", "requiredDate", "status", "title", "type", "updatedAt", "vendor", "warehouse" FROM "Request";
DROP TABLE "Request";
ALTER TABLE "new_Request" RENAME TO "Request";
CREATE UNIQUE INDEX "Request_orderNo_key" ON "Request"("orderNo");
CREATE INDEX "Request_createdAt_idx" ON "Request"("createdAt");
CREATE INDEX "Request_department_idx" ON "Request"("department");
CREATE INDEX "Request_vendor_idx" ON "Request"("vendor");
CREATE INDEX "Request_vendorId_idx" ON "Request"("vendorId");
CREATE INDEX "Request_orderNo_idx" ON "Request"("orderNo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
