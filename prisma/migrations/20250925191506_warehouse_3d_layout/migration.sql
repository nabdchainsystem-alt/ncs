-- CreateTable
CREATE TABLE "Rack" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "warehouseId" INTEGER NOT NULL,
    "xM" REAL NOT NULL,
    "zM" REAL NOT NULL,
    "lengthM" REAL NOT NULL,
    "depthM" REAL NOT NULL,
    "levels" INTEGER NOT NULL,
    "baysPerLevel" INTEGER NOT NULL,
    "orientation" TEXT NOT NULL DEFAULT 'z',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Rack_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StorageLocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "warehouseId" INTEGER NOT NULL,
    "rackId" TEXT,
    "type" TEXT NOT NULL,
    "xM" REAL NOT NULL,
    "yM" REAL NOT NULL,
    "zM" REAL NOT NULL,
    "capacityPallets" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StorageLocation_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StorageLocation_rackId_fkey" FOREIGN KEY ("rackId") REFERENCES "Rack" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LocationOccupancy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "warehouseId" INTEGER NOT NULL,
    "locationId" TEXT NOT NULL,
    "itemId" TEXT,
    "itemCode" TEXT,
    "itemName" TEXT,
    "category" TEXT,
    "batchNo" TEXT,
    "pallets" INTEGER NOT NULL,
    "qtyUnits" INTEGER NOT NULL,
    "colorHex" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LocationOccupancy_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LocationOccupancy_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "StorageLocation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PalletizationRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchBy" TEXT NOT NULL,
    "matchValue" TEXT NOT NULL,
    "unitsPerPallet" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Warehouse" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "widthM" REAL NOT NULL DEFAULT 0,
    "depthM" REAL NOT NULL DEFAULT 0,
    "heightM" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Warehouse" ("code", "createdAt", "id", "name", "updatedAt") SELECT "code", "createdAt", "id", "name", "updatedAt" FROM "Warehouse";
DROP TABLE "Warehouse";
ALTER TABLE "new_Warehouse" RENAME TO "Warehouse";
CREATE UNIQUE INDEX "Warehouse_code_key" ON "Warehouse"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Rack_warehouseId_idx" ON "Rack"("warehouseId");

-- CreateIndex
CREATE INDEX "Rack_orientation_idx" ON "Rack"("orientation");

-- CreateIndex
CREATE INDEX "StorageLocation_warehouseId_type_idx" ON "StorageLocation"("warehouseId", "type");

-- CreateIndex
CREATE INDEX "StorageLocation_rackId_idx" ON "StorageLocation"("rackId");

-- CreateIndex
CREATE INDEX "LocationOccupancy_warehouseId_idx" ON "LocationOccupancy"("warehouseId");

-- CreateIndex
CREATE INDEX "LocationOccupancy_locationId_idx" ON "LocationOccupancy"("locationId");

-- CreateIndex
CREATE INDEX "LocationOccupancy_category_idx" ON "LocationOccupancy"("category");

-- CreateIndex
CREATE INDEX "PalletizationRule_matchBy_matchValue_idx" ON "PalletizationRule"("matchBy", "matchValue");

-- CreateIndex
CREATE INDEX "PalletizationRule_enabled_idx" ON "PalletizationRule"("enabled");
