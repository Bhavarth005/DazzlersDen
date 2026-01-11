-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
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
INSERT INTO "new_Transaction" ("adminId", "amount", "customerId", "date", "id", "paymentMode", "transactionType") SELECT "adminId", "amount", "customerId", "date", "id", "paymentMode", "transactionType" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE TABLE "new_Session" (
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
INSERT INTO "new_Session" ("actualCost", "actualEndTime", "adults", "children", "customerId", "discountPercentage", "discountReason", "discountedCost", "durationHr", "expectedEndTime", "id", "startTime", "status") SELECT "actualCost", "actualEndTime", "adults", "children", "customerId", "discountPercentage", "discountReason", "discountedCost", "durationHr", "expectedEndTime", "id", "startTime", "status" FROM "Session";
DROP TABLE "Session";
ALTER TABLE "new_Session" RENAME TO "Session";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
