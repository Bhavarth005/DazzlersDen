-- CreateTable
CREATE TABLE "Admin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "qrCodeUuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthdate" DATETIME NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "currentBalance" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Session" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerId" INTEGER NOT NULL,
    "children" INTEGER NOT NULL DEFAULT 1,
    "adults" INTEGER NOT NULL DEFAULT 1,
    "discountPercentage" REAL NOT NULL DEFAULT 0.0,
    "discountReason" TEXT,
    "startTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationHr" INTEGER NOT NULL DEFAULT 1,
    "expectedEndTime" DATETIME NOT NULL,
    "actualEndTime" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "actualCost" REAL NOT NULL,
    "discountedCost" REAL NOT NULL,
    CONSTRAINT "Session_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerId" INTEGER NOT NULL,
    "adminId" INTEGER,
    "transactionType" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "paymentMode" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RechargeOffer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "triggerAmount" REAL NOT NULL,
    "bonusAmount" REAL NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_qrCodeUuid_key" ON "Customer"("qrCodeUuid");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_mobileNumber_key" ON "Customer"("mobileNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RechargeOffer_triggerAmount_key" ON "RechargeOffer"("triggerAmount");

