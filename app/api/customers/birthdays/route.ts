import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { sendBirthdayMessage } from '@/lib/whatsapp';

export async function GET(req: Request) {
  try {
    await getCurrentAdmin(req);
    
    const { searchParams } = new URL(req.url);
    const skip = parseInt(searchParams.get('skip') || '0');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    
    // Month is 0-11 from frontend, but SQL EXTRACT(MONTH) returns 1-12
    const monthParam = searchParams.get('month');
    if (!monthParam) {
        return NextResponse.json({ error: "Month is required" }, { status: 400 });
    }
    const targetMonth = parseInt(monthParam) + 1;

    const customers = await prisma.$queryRaw`
      SELECT id, name, "mobileNumber", birthdate 
      FROM "Customer"
      WHERE EXTRACT(MONTH FROM birthdate) = ${targetMonth}
      AND (
        ${search} = '' OR 
        name ILIKE ${`%${search}%`} OR 
        "mobileNumber" ILIKE ${`%${search}%`}
      )
      ORDER BY EXTRACT(DAY FROM birthdate) ASC
      LIMIT ${limit} OFFSET ${skip}
    `;

    // Get Total Count for Pagination (Separate Query)
    const totalCountResult: any = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count 
      FROM "Customer"
      WHERE EXTRACT(MONTH FROM birthdate) = ${targetMonth}
      AND (
        ${search} = '' OR 
        name ILIKE ${`%${search}%`} OR 
        "mobileNumber" ILIKE ${`%${search}%`}
      )
    `;
    
    const total = totalCountResult[0]?.count || 0;

    return NextResponse.json({
        data: customers,
        pagination: {
            total,
            skip,
            limit
        }
    });

  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
    try {
        await getCurrentAdmin(req);
        const body = await req.json();
        const { customerId } = body;

        const customer = await prisma.customer.findUnique({
            where: { id: customerId }
        });

        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        await sendBirthdayMessage(customer.name, customer.mobileNumber);

        return NextResponse.json({ success: true, message: "Birthday wish sent!" });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}