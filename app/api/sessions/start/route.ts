import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { sendSessionStartMessage } from '@/lib/whatsapp';
import { z } from 'zod';

// 1. FIXED SCHEMA
// Removed the { required_error } object that was causing the TS error.
// Using .min(1, "Message") achieves the same result safely.
const sessionStartSchema = z.object({
  qr_code_uuid: z.string().min(1, "QR Code is required"),
  children: z.number().min(1, "At least 1 child required"),
  adults: z.number().default(0),
  duration_hr: z.number().min(0.5, "Minimum duration is 30 mins"),
  actual_cost: z.number(),
  discounted_cost: z.number(),
  discount_percentage: z.number().optional(),
  discount_reason: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const admin = await getCurrentAdmin(req);
    const rawBody = await req.json();

    // 2. VALIDATION
    const body = sessionStartSchema.parse(rawBody);

    // 3. FIND CUSTOMER (Strictly by QR)
    const customer = await prisma.customer.findUnique({
      where: { qrCodeUuid: body.qr_code_uuid }
    });

    if (!customer) {
      return NextResponse.json({ detail: "Invalid QR Code: Customer not found" }, { status: 404 });
    }

    // 4. BALANCE CHECK
    if (customer.currentBalance < body.discounted_cost) {
        return NextResponse.json({ 
            detail: `Insufficient Balance. Required: ${body.discounted_cost}, Available: ${customer.currentBalance}` 
        }, { status: 400 });
    }

    // 5. CHECK EXISTING SESSION
    const activeSession = await prisma.session.findFirst({
      where: {
        customerId: customer.id,
        status: "ACTIVE"
      }
    });

    if (activeSession) {
      return NextResponse.json({ detail: "Customer already has an active session" }, { status: 400 });
    }

    // 6. CALCULATE TIMINGS
    const startTime = new Date();
    const expectedEndTime = new Date(startTime.getTime() + body.duration_hr * 60 * 60 * 1000);

    // 7. ATOMIC TRANSACTION (Create Session + Deduct Money)
    const result = await prisma.$transaction(async (tx) => {
      // A. Deduct Balance
      await tx.customer.update({
        where: { id: customer.id },
        data: { currentBalance: { decrement: body.discounted_cost } }
      });

      // B. Create Session Record
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

      // C. Create Ledger Transaction (History)
      await tx.transaction.create({
        data: {
          customerId: customer.id,
          adminId: admin.id,
          transactionType: "SESSION_DEDUCT", // Custom type for session costs
          amount: body.discounted_cost,
          paymentMode: "WALLET"
        }
      });

      return newSession;
    });

    // 8. SEND WHATSAPP (Non-blocking)
    try {
      await sendSessionStartMessage(
        customer.name, 
        customer.mobileNumber, 
        body.discounted_cost, 
        `${body.adults} Adults, ${body.children} Kids`
      );
    } catch(whatsappError) {
      console.error("WhatsApp Error:", whatsappError);
    }

    return NextResponse.json(result);

  } catch (e: any) {
    // 9. FIXED ERROR HANDLING
    // Use .flatten() to fix the "Property 'errors' does not exist" error
    if (e instanceof z.ZodError) {
        return NextResponse.json({ detail: e.flatten() }, { status: 400 });
    }
    
    if (e.message === "Unauthorized") {
        return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ detail: e.message || "Internal Server Error" }, { status: 500 });
  }
}