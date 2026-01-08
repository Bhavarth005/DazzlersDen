import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.admin.create({
    data: {
      username: "admin",
      passwordHash: hash,
      role: "SUPERADMIN"
    }
  });

  console.log(`Admin created with ID: ${admin.id}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });