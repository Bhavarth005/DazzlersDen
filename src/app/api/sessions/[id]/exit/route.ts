import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';

export async function POST(
  req: Request,
  // 1. Update the type definition to wrap params in a Promise
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getCurrentAdmin(req); // Authenticate
    
    // 2. Await the params object to extract the ID
    const { id } = await params;
    const sessionId = parseInt(id);

    if (isNaN(sessionId)) {
        return NextResponse.json({ detail: "Invalid Session ID" }, { status: 400 });
    }

    const session = await prisma.session.findUnique({ where: { id: sessionId }});
    if (!session) return NextResponse.json({ detail: "Session not found" }, { status: 404 });

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        actualEndTime: new Date(),
        status: "COMPLETED"
      }
    });

    return NextResponse.json(updatedSession);
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}