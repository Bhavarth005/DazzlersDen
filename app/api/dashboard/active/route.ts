import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    await getCurrentAdmin(req);
    
    // Fetch active sessions & include customer details
    const activeSessions = await prisma.session.findMany({
      where: { status: "ACTIVE" },
      include: {
        customer: true 
      }
    });

    return NextResponse.json(activeSessions);
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}