import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    await getCurrentAdmin(req);
    const now = new Date();

    const overdueSessions = await prisma.session.findMany({
      where: {
        status: "ACTIVE",
        expectedEndTime: { lt: now }
      },
      include: {
        customer: {
          select: { name: true, mobileNumber: true }
        }
      },
      orderBy: { expectedEndTime: 'asc' } // Show most overdue first
    });

    return NextResponse.json(overdueSessions);

  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}