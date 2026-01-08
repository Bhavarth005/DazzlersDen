import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    await getCurrentAdmin(req); // Authenticate

    // 1. Parse Query Parameters
    const { searchParams } = new URL(req.url);
    const skip = parseInt(searchParams.get('skip') || '0');
    const limit = parseInt(searchParams.get('limit') || '10');

    // 2. Fetch Transactions with Pagination
    const transactions = await prisma.transaction.findMany({
      skip: skip,
      take: limit,
      orderBy: { date: 'desc' }, // Newest first
      include: {
        customer: {
          select: { name: true, mobileNumber: true } // Only fetch name/mobile
        },
        admin: {
          select: { username: true } // Only fetch admin username
        }
      }
    });

    // 3. Get Total Count (Useful for frontend pagination UI)
    const totalCount = await prisma.transaction.count();

    return NextResponse.json({
      data: transactions,
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