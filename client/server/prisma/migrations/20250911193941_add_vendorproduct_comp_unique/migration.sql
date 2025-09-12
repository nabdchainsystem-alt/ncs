/*
  Warnings:

  - A unique constraint covering the columns `[vendorId,itemCode]` on the table `VendorProduct` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "Vendor_categoriesJson_idx" ON "Vendor"("categoriesJson");

-- CreateIndex
CREATE UNIQUE INDEX "VendorProduct_vendorId_itemCode_key" ON "VendorProduct"("vendorId", "itemCode");
