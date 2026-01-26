-- CreateTable
CREATE TABLE "PricingPlan" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "durationHr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "includedAdults" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL DEFAULT 'PLAN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PricingPlan_pkey" PRIMARY KEY ("id")
);
