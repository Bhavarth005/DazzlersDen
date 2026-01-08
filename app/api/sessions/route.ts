import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    await getCurrentAdmin(req);

    // 1. Parse Query Parameters
    const { searchParams } = new URL(req.url);
    const skip = parseInt(searchParams.get('skip') || '0');
    const limit = parseInt(searchParams.get('limit') || '10');

    // 2. Fetch Sessions with Pagination
    const sessions = await prisma.session.findMany({
      skip: skip,
      take: limit,
      orderBy: { startTime: 'desc' },
      include: {
        customer: {
          select: { name: true, mobileNumber: true }
        }
      }
    });

    // 3. Get Total Count
    const totalCount = await prisma.session.count();

    return NextResponse.json({
      data: sessions,
      pagination: {
        total: totalCount,
        skip: skip,
        limit: limit
      }
    });

  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}