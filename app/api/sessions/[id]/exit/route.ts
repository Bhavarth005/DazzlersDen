import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { sendSessionExitMessage } from '@/lib/whatsapp';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getCurrentAdmin(req);
    const { id } = await params;
    const sessionId = parseInt(id);

    // 1. DATABASE TRANSACTION (Matches your Start Script style)
    // We use a transaction here to ensure we "Check Status" and "Update Status" atomically.
    const result = await prisma.$transaction(async (tx) => {

      // Step A: Find the Session (and lock it conceptually)
      const session = await tx.session.findUnique({
        where: { id: sessionId },
        include: { customer: true }
      });

      if (!session) {
        throw new Error("Session not found");
      }

      // Step B: Logic Validation inside Transaction
      if (session.status !== "ACTIVE") {
        throw new Error("Session is already closed");
      }

      // Step C: Calculate End Time
      const endTime = new Date();

      // (Optional: In the future, you can add "Overstay Penalty" calculation logic here
      // and create a 'transaction' record just like the Start script does.)

      // Step D: Update Session Status
      const updatedSession = await tx.session.update({
        where: { id: sessionId },
        data: {
          actualEndTime: endTime,
          status: "COMPLETED"
        }
      });

      // Return both session and customer data for the next step
      return { updatedSession, customer: session.customer };
    });

    // 2. Send WhatsApp (Non-blocking / Outside Transaction)
    try {
      await sendSessionExitMessage(
        result.customer.name,
        result.customer.mobileNumber,
        result.updatedSession.actualEndTime?.toLocaleTimeString() || "Now", // endTime
        result.customer.currentBalance // balance
      );
    } catch (whatsappError) {
      console.error("WhatsApp failed, but session exited successfully:", whatsappError);
    }

    return NextResponse.json(result.updatedSession);

  } catch (e: any) {

    // 3. Error Handling
    if (e.message === "Unauthorized") {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    // Handle the custom errors thrown inside the transaction
    if (e.message === "Session not found") {
      return NextResponse.json({ detail: "Session not found" }, { status: 404 });
    }

    if (e.message === "Session is already closed") {
      return NextResponse.json({ detail: "Session is already closed" }, { status: 400 });
    }

    console.error(e); // Log internal errors
    return NextResponse.json({ detail: e.message || "Internal Server Error" }, { status: 500 });
  }
}