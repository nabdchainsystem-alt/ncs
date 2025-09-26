-- Add new relation columns to stock movements for richer tracking
ALTER TABLE "StockMovement" ADD COLUMN "orderId" INTEGER;
ALTER TABLE "StockMovement" ADD COLUMN "sourceWarehouseId" INTEGER;
ALTER TABLE "StockMovement" ADD COLUMN "destinationWarehouseId" INTEGER;
ALTER TABLE "StockMovement" ADD COLUMN "sourceWarehouseLabel" TEXT;
ALTER TABLE "StockMovement" ADD COLUMN "destinationWarehouseLabel" TEXT;

-- Create indexes for the new foreign keys
CREATE INDEX "StockMovement_orderId_idx" ON "StockMovement"("orderId");
CREATE INDEX "StockMovement_sourceWarehouseId_idx" ON "StockMovement"("sourceWarehouseId");
CREATE INDEX "StockMovement_destinationWarehouseId_idx" ON "StockMovement"("destinationWarehouseId");
