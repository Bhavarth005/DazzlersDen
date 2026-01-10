// /api/customers/by-uuid/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    await getCurrentAdmin(req); 

    // 2. Parse Query Params
    const { searchParams } = new URL(req.url);
    const uuid = searchParams.get('uuid');

    if (!uuid) {
      return NextResponse.json({ error: "UUID is required" }, { status: 400 });
    }

    // 3. Find Customer
    // Assuming qrCodeUuid is a unique field in your Prisma schema
    const customer = await prisma.customer.findUnique({
      where: { qrCodeUuid: uuid },
    });
    
    if (!customer) {
        return NextResponse.json({ error: "Invalid QR Code or Customer not found" }, { status: 404 });
    }

    return NextResponse.json(customer);

  } catch (e: any) {
    if (e.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: e.message || "Server Error" }, { status: 500 });
  }
}