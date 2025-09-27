-- Create Material table
CREATE TABLE "Material" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "uq_material_name" ON "Material"("name");
CREATE UNIQUE INDEX "uq_material_code" ON "Material"("code");
CREATE INDEX "Material_name_idx" ON "Material"("name");

-- Seed materials from existing inventory items
INSERT OR IGNORE INTO "Material" ("name", "code", "createdAt", "updatedAt")
SELECT DISTINCT TRIM("name") AS name,
       "materialNo" AS code,
       COALESCE("createdAt", CURRENT_TIMESTAMP) AS createdAt,
       COALESCE("updatedAt", CURRENT_TIMESTAMP) AS updatedAt
FROM "InventoryItem"
WHERE "name" IS NOT NULL AND TRIM("name") <> '';

-- Add store lifecycle columns
ALTER TABLE "Store" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Store" ADD COLUMN "deletedAt" DATETIME;

-- Ensure store names remain unique before adding the constraint
UPDATE "Store"
SET "name" = "name" || ' (' || "id" || ')'
WHERE "id" IN (
  SELECT s1."id"
  FROM "Store" s1
  JOIN "Store" s2 ON s1."name" = s2."name" AND s1."id" > s2."id"
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_store_name" ON "Store"("name");

-- Rebuild InventoryItem table with materialId foreign key
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_InventoryItem" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "materialNo" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT,
  "categoryParent" TEXT,
  "picture" TEXT,
  "unit" TEXT,
  "bigUnit" TEXT,
  "unitCost" REAL,
  "qtyOnHand" INTEGER NOT NULL DEFAULT 0,
  "reorderPoint" INTEGER NOT NULL DEFAULT 0,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "warehouseId" INTEGER,
  "storeId" INTEGER,
  "materialId" INTEGER,
  "warehouseLabel" TEXT,
  "lastMovementAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventoryItem_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "InventoryItem_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "InventoryItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_InventoryItem" (
  "id", "materialNo", "name", "category", "categoryParent", "picture", "unit", "bigUnit", "unitCost",
  "qtyOnHand", "reorderPoint", "isDeleted", "warehouseId", "storeId", "materialId", "warehouseLabel",
  "lastMovementAt", "createdAt", "updatedAt"
)
SELECT
  "id", "materialNo", "name", "category", "categoryParent", "picture", "unit", "bigUnit", "unitCost",
  "qtyOnHand", "reorderPoint", "isDeleted", "warehouseId", "storeId",
  (
    SELECT "id" FROM "Material"
    WHERE "Material"."name" = TRIM("InventoryItem"."name")
    LIMIT 1
  ) AS materialId,
  "warehouseLabel", "lastMovementAt", "createdAt", "updatedAt"
FROM "InventoryItem";

DROP TABLE "InventoryItem";
ALTER TABLE "new_InventoryItem" RENAME TO "InventoryItem";

CREATE UNIQUE INDEX "InventoryItem_materialNo_key" ON "InventoryItem"("materialNo");
CREATE INDEX "InventoryItem_warehouseId_idx" ON "InventoryItem"("warehouseId");
CREATE INDEX "InventoryItem_isDeleted_idx" ON "InventoryItem"("isDeleted");
CREATE INDEX "InventoryItem_storeId_idx" ON "InventoryItem"("storeId");
CREATE INDEX "InventoryItem_materialId_idx" ON "InventoryItem"("materialId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
