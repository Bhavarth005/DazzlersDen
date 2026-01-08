import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { sendSessionStartMessage } from '@/lib/whatsapp';
import { sessionStartSchema } from '@/lib/schemas'; 

export async function POST(req: Request) {
  try {
    const admin = await getCurrentAdmin(req);
    const rawBody = await req.json();

    // 2. SECURITY: Validate Input
    const body = sessionStartSchema.parse(rawBody);

    // 3. Find Customer by QR UUID
    const customer = await prisma.customer.findUnique({
      where: { qrCodeUuid: body.qr_code_uuid }
    });

    if (!customer) {
      return NextResponse.json({ detail: "Invalid QR Code" }, { status: 404 });
    }

    // 4. Check for existing active session
    const activeSession = await prisma.session.findFirst({
      where: {
        customerId: customer.id,
        status: "ACTIVE"
      }
    });

    if (activeSession) {
      return NextResponse.json({ detail: "Customer already has an active session" }, { status: 400 });
    }

    // 5. Calculate Timings
    const startTime = new Date();
    const expectedEndTime = new Date(startTime.getTime() + body.duration_hr * 60 * 60 * 1000);

    // 6. Create Session (Atomic Transaction)
    const result = await prisma.$transaction(async (tx) => {
      // Deduct Balance
      await tx.customer.update({
        where: { id: customer.id },
        data: { currentBalance: { decrement: body.discounted_cost } }
      });

      // Create Session Record
      const newSession = await tx.session.create({
        data: {
          customerId: customer.id,
          children: body.children,
          adults: body.adults,
          durationHr: body.duration_hr,
          actualCost: body.actual_cost,
          discountedCost: body.discounted_cost,
          discountPercentage: body.discount_percentage,
          discountReason: body.discount_reason,
          startTime: startTime,
          expectedEndTime: expectedEndTime,
          status: "ACTIVE"
        }
      });

      // Create Transaction Record (Cost Deduction)
      await tx.transaction.create({
        data: {
          customerId: customer.id,
          adminId: admin.id,
          transactionType: "SESSION_DEDUCT",
          amount: body.discounted_cost,
          paymentMode: "WALLET"
        }
      });

      return newSession;
    });

    // 7. Send WhatsApp (Non-blocking)
    const newBalance = customer.currentBalance - body.discounted_cost;
    await sendSessionStartMessage(
        customer.name, 
        customer.mobileNumber, 
        body.discounted_cost, 
        newBalance, 
        `${body.adults} Adults, ${body.children} Kids`
    );

    return NextResponse.json(result);

  } catch (e: any) {
    // 8. Handle Validation Errors specifically
    if (e.name === 'ZodError') {
        return NextResponse.json({ detail: e.errors }, { status: 400 });
    }
    
    if (e.message === "Unauthorized") return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    
    console.error(e); // Log internal errors
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}