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
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "approval" TEXT NOT NULL DEFAULT 'Pending',
    "quantity" INTEGER,
    "requiredDate" DATETIME,
    "warehouse" TEXT DEFAULT '',
    "requester" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Request" ("createdAt", "department", "id", "orderNo", "priority", "quantity", "requester", "requiredDate", "status", "title", "type", "updatedAt", "vendor", "warehouse") SELECT "createdAt", "department", "id", "orderNo", "priority", "quantity", "requester", "requiredDate", "status", "title", "type", "updatedAt", "vendor", "warehouse" FROM "Request";
DROP TABLE "Request";
ALTER TABLE "new_Request" RENAME TO "Request";
CREATE UNIQUE INDEX "Request_orderNo_key" ON "Request"("orderNo");
CREATE INDEX "Request_orderNo_idx" ON "Request"("orderNo");
CREATE INDEX "Request_vendor_idx" ON "Request"("vendor");
CREATE INDEX "Request_department_idx" ON "Request"("department");
CREATE INDEX "Request_createdAt_idx" ON "Request"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
