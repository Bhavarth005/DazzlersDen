import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const t0 = Date.now();
    await getCurrentAdmin(req);
    const t1 = Date.now() - t0;

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. MAINTENANCE: Auto-update "Active" sessions that have expired to "Overdue"
    // We do this first so the data below is accurate
    await prisma.session.updateMany({
      where: {
        status: "ACTIVE",
        expectedEndTime: { lt: now }
      },
      data: {
        status: "OVERDUE"
      }
    });
    const t2 = Date.now() - t0 - t1;

    // 2. FETCH EVERYTHING IN PARALLEL (Faster)
    const [
        activeCount, 
        overdueCount, 
        monthlyRevenue, 
        activeSessionsList, 
        overdueSessionsList
    ] = await Promise.all([
        // A. Stats: Active Count
        prisma.session.count({ where: { status: "ACTIVE" } }),

        // B. Stats: Overdue Count
        prisma.session.count({ where: { status: "OVERDUE" } }),

        // C. Stats: Monthly Revenue (Recharges only)
        prisma.transaction.aggregate({
            _sum: { amount: true },
            where: {
                transactionType: "RECHARGE",
                date: { gte: firstDayOfMonth }
            }
        }),

        // D. List: Actual Active Sessions (for the table)
        prisma.session.findMany({
            where: { status: "ACTIVE" },
            include: { customer: { select: { name: true, mobileNumber: true } } },
            orderBy: { startTime: 'desc' }
        }),

        // E. List: Actual Overdue Sessions (for the alert table)
        prisma.session.findMany({
            where: { status: "OVERDUE" },
            include: { customer: { select: { name: true, mobileNumber: true } } },
            orderBy: { expectedEndTime: 'asc' } // Most overdue first
        })
    ]);
    const t3 = Date.now() - t0 - t2;

    // 3. Return One Unified JSON
    return NextResponse.json({
      stats: {
        active_sessions: activeCount,
        overdue_sessions: overdueCount,
        monthly_revenue: monthlyRevenue._sum.amount || 0
      },
      lists: {
        active_sessions: activeSessionsList,
        overdue_sessions: overdueSessionsList
      },
      benchmark: {
        "ADMIN_FETCH": t1,
        "OVERDUE_UPDATE": t2,
        "DATA_FETCH": t3
      }
    });

  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}