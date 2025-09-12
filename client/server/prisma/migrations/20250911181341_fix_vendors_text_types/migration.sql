-- CreateTable
CREATE TABLE "Vendor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "categoriesJson" TEXT,
    "regionsJson" TEXT,
    "contactsJson" TEXT,
    "bankJson" TEXT,
    "onTimePct" REAL,
    "leadTimeAvgDays" INTEGER,
    "qualityPpm" REAL,
    "priceIndex" REAL,
    "quoteRespHrs" REAL,
    "trustScore" REAL,
    "prefIncoterms" TEXT,
    "shipModesJson" TEXT,
    "avgCO2perOrder" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VendorProduct" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vendorId" INTEGER NOT NULL,
    "itemCode" TEXT NOT NULL,
    "price" REAL,
    "currency" TEXT DEFAULT 'SAR',
    "lastQuotedAt" DATETIME,
    "moq" INTEGER,
    "leadTimeDays" INTEGER,
    CONSTRAINT "VendorProduct_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VendorPerformanceHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vendorId" INTEGER NOT NULL,
    "month" DATETIME NOT NULL,
    "onTimePct" REAL,
    "qualityPpm" REAL,
    "disputes" INTEGER,
    "quotesCount" INTEGER,
    "avgRespHrs" REAL,
    "trustScore" REAL,
    CONSTRAINT "VendorPerformanceHistory_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VendorDocument" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vendorId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "number" TEXT,
    "expiry" DATETIME,
    "fileUrl" TEXT,
    "valid" BOOLEAN DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VendorDocument_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_code_key" ON "Vendor"("code");

-- CreateIndex
CREATE INDEX "Vendor_code_idx" ON "Vendor"("code");

-- CreateIndex
CREATE INDEX "Vendor_status_idx" ON "Vendor"("status");

-- CreateIndex
CREATE INDEX "Vendor_name_idx" ON "Vendor"("name");

-- CreateIndex
CREATE INDEX "VendorProduct_vendorId_itemCode_idx" ON "VendorProduct"("vendorId", "itemCode");

-- CreateIndex
CREATE INDEX "VendorPerformanceHistory_vendorId_month_idx" ON "VendorPerformanceHistory"("vendorId", "month");

-- CreateIndex
CREATE INDEX "VendorDocument_vendorId_type_idx" ON "VendorDocument"("vendorId", "type");

-- CreateIndex
CREATE INDEX "VendorDocument_expiry_idx" ON "VendorDocument"("expiry");
