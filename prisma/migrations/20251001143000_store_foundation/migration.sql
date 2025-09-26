-- Create Store table
CREATE TABLE "Store" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "location" TEXT,
  "description" TEXT,
  "capacity" INTEGER,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "Store_code_key" ON "Store"("code");
CREATE INDEX "Store_name_idx" ON "Store"("name");

-- Add store references to warehouses and inventory items
ALTER TABLE "Warehouse" ADD COLUMN "storeId" INTEGER;
CREATE INDEX "Warehouse_storeId_idx" ON "Warehouse"("storeId");

ALTER TABLE "InventoryItem" ADD COLUMN "storeId" INTEGER;
CREATE INDEX "InventoryItem_storeId_idx" ON "InventoryItem"("storeId");

-- Seed a default store and attach existing records
INSERT INTO "Store" ("code", "name", "createdAt", "updatedAt")
VALUES ('STORE-DEFAULT', 'Default Store', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

UPDATE "Warehouse"
SET "storeId" = (SELECT "id" FROM "Store" WHERE "code" = 'STORE-DEFAULT')
WHERE "storeId" IS NULL;

UPDATE "InventoryItem"
SET "storeId" = (SELECT "id" FROM "Store" WHERE "code" = 'STORE-DEFAULT')
WHERE "storeId" IS NULL;
