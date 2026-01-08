import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    await getCurrentAdmin(req);

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Active Sessions Count
    const activeCount = await prisma.session.count({
      where: { status: "ACTIVE" }
    });

    // 2. Overdue Sessions Count (Active but past expected end time)
    const overdueCount = await prisma.session.count({
      where: {
        status: "ACTIVE",
        expectedEndTime: { lt: now } // "lt" means Less Than
      }
    });

    // 3. Monthly Revenue (Total Recharges done this month)
    // We only sum "RECHARGE" type (Real Cash), excluding "BONUS"
    const monthlyRevenue = await prisma.transaction.aggregate({
      _sum: {
        amount: true
      },
      where: {
        transactionType: "RECHARGE",
        date: { gte: firstDayOfMonth }
      }
    });

    return NextResponse.json({
      active_sessions: activeCount,
      overdue_sessions: overdueCount,
      monthly_revenue: monthlyRevenue._sum.amount || 0
    });

  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}