-- CreateTable
CREATE TABLE "RechargeOffer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "triggerAmount" REAL NOT NULL,
    "bonusAmount" REAL NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateIndex
CREATE UNIQUE INDEX "RechargeOffer_triggerAmount_key" ON "RechargeOffer"("triggerAmount");
