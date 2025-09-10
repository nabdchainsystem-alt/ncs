-- CreateTable
CREATE TABLE "Request" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderNo" TEXT NOT NULL,
    "title" TEXT,
    "type" TEXT,
    "department" TEXT,
    "vendor" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "quantity" INTEGER,
    "requiredDate" DATETIME,
    "warehouse" TEXT DEFAULT '',
    "requester" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RequestItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requestId" INTEGER NOT NULL,
    "name" TEXT,
    "qty" INTEGER,
    "unit" TEXT,
    "code" TEXT,
    "machine" TEXT,
    "warehouse" TEXT,
    "requester" TEXT,
    "status" TEXT DEFAULT 'NEW',
    "note" TEXT,
    CONSTRAINT "RequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "priority" TEXT DEFAULT 'Medium',
    "assignee" TEXT,
    "label" TEXT,
    "dueDate" DATETIME,
    "order" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Request_orderNo_key" ON "Request"("orderNo");

-- CreateIndex
CREATE INDEX "Request_orderNo_idx" ON "Request"("orderNo");

-- CreateIndex
CREATE INDEX "Request_vendor_idx" ON "Request"("vendor");

-- CreateIndex
CREATE INDEX "Request_department_idx" ON "Request"("department");

-- CreateIndex
CREATE INDEX "Request_createdAt_idx" ON "Request"("createdAt");

-- CreateIndex
CREATE INDEX "Task_status_order_idx" ON "Task"("status", "order");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");
