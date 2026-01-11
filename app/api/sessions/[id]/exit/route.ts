import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { sendSessionExitMessage } from '@/lib/whatsapp';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getCurrentAdmin(req);
    const { id } = await params;
    const sessionId = parseInt(id);

    // 1. ATOMIC TRANSACTION
    const result = await prisma.$transaction(async (tx) => {

      // A. Find Session
      const session = await tx.session.findUnique({
        where: { id: sessionId },
        include: { customer: true }
      });

      if (!session) {
        throw new Error("Session not found");
      }

      // B. Validate Status (Allow Active & Overdue)
      if (session.status !== "ACTIVE" && session.status !== "OVERDUE") {
        throw new Error("Session is already closed");
      }

      // C. Update Session Status
      const updatedSession = await tx.session.update({
        where: { id: sessionId },
        data: {
          actualEndTime: new Date(),
          status: "COMPLETED"
        }
      });

      return { updatedSession, customer: session.customer };
    });

    // 2. SEND WHATSAPP (Non-blocking)
    try {
      await sendSessionExitMessage(
        result.customer.name,
        result.customer.mobileNumber,
        result.customer.currentBalance
      );
    } catch (whatsappError) {
      console.error("WhatsApp failed, but session exited successfully:", whatsappError);
    }

    return NextResponse.json(result.updatedSession);

  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    if (e.message === "Session not found") return NextResponse.json({ detail: "Session not found" }, { status: 404 });
    if (e.message === "Session is already closed") return NextResponse.json({ detail: "Session is already closed" }, { status: 400 });

    return NextResponse.json({ detail: e.message || "Internal Server Error" }, { status: 500 });
  }
}