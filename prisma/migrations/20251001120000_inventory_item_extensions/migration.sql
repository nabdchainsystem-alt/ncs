-- Add optional metadata columns to inventory items
ALTER TABLE "InventoryItem" ADD COLUMN "categoryParent" TEXT;
ALTER TABLE "InventoryItem" ADD COLUMN "picture" TEXT;
ALTER TABLE "InventoryItem" ADD COLUMN "bigUnit" TEXT;
ALTER TABLE "InventoryItem" ADD COLUMN "unitCost" REAL;
ALTER TABLE "InventoryItem" ADD COLUMN "warehouseLabel" TEXT;
