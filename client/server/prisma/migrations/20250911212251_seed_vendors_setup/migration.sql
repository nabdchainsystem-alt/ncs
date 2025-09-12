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
CREATE INDEX "VendorDocument_valid_idx" ON "VendorDocument"("valid");

-- CreateIndex
CREATE INDEX "VendorDocument_type_expiry_valid_idx" ON "VendorDocument"("type", "expiry", "valid");

-- CreateIndex
CREATE INDEX "VendorPerformanceHistory_vendorId_trustScore_idx" ON "VendorPerformanceHistory"("vendorId", "trustScore");

-- CreateIndex
CREATE INDEX "VendorProduct_price_idx" ON "VendorProduct"("price");

-- CreateIndex
CREATE INDEX "VendorProduct_leadTimeDays_idx" ON "VendorProduct"("leadTimeDays");
