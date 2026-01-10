import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    await getCurrentAdmin(req);

    const { searchParams } = new URL(req.url);
    const skip = parseInt(searchParams.get('skip') || '0');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const whereClause: any = {};

    // Date Filter
    if (startDate || endDate) {
      whereClause.startTime = {};
      if (startDate) whereClause.startTime.gte = new Date(startDate);
      if (endDate) whereClause.startTime.lte = new Date(endDate);
    }

    // Search Filter
    if (search) {
      const isNumber = !isNaN(Number(search));
      whereClause.OR = [
        { customer: { name: { contains: search } } }
      ];
      if (isNumber) {
        whereClause.OR.push({ id: parseInt(search) }); // Session ID
      }
    }

    const sessions = await prisma.session.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      orderBy: { startTime: 'desc' },
      include: {
        customer: { select: { name: true, mobileNumber: true } }
      }
    });

    const totalCount = await prisma.session.count({ where: whereClause });

    return NextResponse.json({
      data: sessions,
      pagination: { total: totalCount, skip, limit }
    });

  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}