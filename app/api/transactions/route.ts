import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    await getCurrentAdmin(req);

    const { searchParams } = new URL(req.url);
    const skip = parseInt(searchParams.get('skip') || '0');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const search = searchParams.get('search'); // id or customer name
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // 1. Build Dynamic Filter
    const whereClause: any = {};

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate);
      if (endDate) whereClause.date.lte = new Date(endDate);
    }

    if (search) {
      const isNumber = !isNaN(Number(search));
      whereClause.OR = [
        { customer: { name: { contains: search } } }, // Customer Name
      ];
      if (isNumber) {
        whereClause.OR.push({ id: parseInt(search) }); // Transaction ID
      }
    }

    // 2. Fetch Paginated Data
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      orderBy: { date: 'desc' },
      include: {
        customer: { select: { name: true, mobileNumber: true } },
        admin: { select: { username: true } }
      }
    });

    // 3. Calculate Sums (Separate Aggregation Query)
    const aggregations = await prisma.transaction.groupBy({
      by: ['paymentMode'],
      _sum: { amount: true },
      where: {
        ...whereClause,
        transactionType: "RECHARGE" 
      }
    });


    const sums = {
      CASH: 0,
      UPI: 0,
      TOTAL: 0
    };

    aggregations.forEach(agg => {
      const mode = agg.paymentMode || "UNKNOWN";
      const amount = agg._sum.amount || 0;
      if (sums[mode as keyof typeof sums] !== undefined) {
        sums[mode as keyof typeof sums] = amount;
      }
      sums.TOTAL += amount;
    });

    const totalCount = await prisma.transaction.count({ where: whereClause });

    return NextResponse.json({
      data: transactions,
      stats: sums,
      pagination: { total: totalCount, skip, limit }
    });

  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}