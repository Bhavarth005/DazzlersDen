import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const currentAdmin = await getCurrentAdmin(req);

    // Security: Only SUPERADMIN should see the list of all staff
    if (currentAdmin.role !== 'SUPERADMIN') {
        return NextResponse.json({ detail: "Forbidden: Superadmin access required" }, { status: 403 });
    }

    const admins = await prisma.admin.findMany({
        select: {
            id: true,
            username: true,
            role: true
            // We explicitly exclude 'password'/'passwordHash' for security
        },
        orderBy: { id: 'asc' }
    });

    return NextResponse.json(admins);

  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}