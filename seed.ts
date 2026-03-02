import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("superadmin123", 10);

  const admin = await prisma.admin.upsert({
    where: { 
      username: "superadmin"
    },
    update: {
      passwordHash: hash,
      role: "SUPERADMIN"
    },
    create: {
      username: "superadmin",
      passwordHash: hash,
      role: "SUPERADMIN"
    }
  });

  console.log(`Admin created with ID: ${admin.id}`);

  const pricingPlans = await prisma.pricingPlan.createMany({
    data: [
      { id: 1, name: "1 Hr Standard", price: 300, durationHr: 1, includedAdults: 0, type: "PLAN", isActive: true },
      { id: 2, name: "2 Hr Standard", price: 600, durationHr: 2, includedAdults: 0, type: "PLAN", isActive: true },
      { id: 3, name: "1 Hr Family", price: 500, durationHr: 1, includedAdults: 2, type: "PLAN", isActive: true },
      { id: 4, name: "2 Hr Family", price: 700, durationHr: 2, includedAdults: 2, type: "PLAN", isActive: true },
      { id: 5, name: "Extra Adult Charge", price: 100, durationHr: 0, includedAdults: 0, type: "ADDON", isActive: true }
    ],
    skipDuplicates: true, // Prevents errors if you run the seed script multiple times
  });

  console.log(`Seeded ${pricingPlans.count} pricing plans.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });