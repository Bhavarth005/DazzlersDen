import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { sendSessionStartMessage } from '@/lib/whatsapp'; 

export async function POST(req: Request) {
  try {
    const admin = await getCurrentAdmin(req);
    const body = await req.json();
    
    // Body: { qr_code_uuid, children, adults, discount_percentage, 
    //         duration_hr, actual_cost, discounted_cost, discount_reason }

    // 1. Find Customer by QR
    const customer = await prisma.customer.findUnique({
      where: { qrCodeUuid: body.qr_code_uuid }
    });

    if (!customer) {
      return NextResponse.json({ detail: "Invalid QR Code / Customer not found" }, { status: 404 });
    }

    // 2. Check for Existing Active Session (Prevent Double Entry)
    const activeSession = await prisma.session.findFirst({
      where: {
        customerId: customer.id,
        status: "ACTIVE"
      }
    });

    if (activeSession) {
      return NextResponse.json({ 
        detail: `Customer already has an active session! (Session ID: ${activeSession.id})` 
      }, { status: 400 });
    }

    // 3. Check Balance
    if (customer.currentBalance < body.discounted_cost) {
      return NextResponse.json({ 
        detail: `Insufficient Balance. Required: ${body.discounted_cost}, Available: ${customer.currentBalance}` 
      }, { status: 400 });
    }

    // 4. Process Session Start (Atomic Transaction)
    const session = await prisma.$transaction(async (tx) => {
      // Deduct Money
      await tx.customer.update({
        where: { id: customer.id },
        data: { currentBalance: { decrement: body.discounted_cost }}
      });

      // Create Deduction Transaction
      await tx.transaction.create({
        data: {
          customerId: customer.id,
          transactionType: "SESSION_DEDUCT",
          amount: body.discounted_cost,
          paymentMode: null, // Internal deduction
          adminId: admin.id
        }
      });

      // Calculate End Time
      const endTime = new Date();
      endTime.setHours(endTime.getHours() + body.duration_hr);

      // Create Session
      const newSession = await tx.session.create({
        data: {
          customerId: customer.id,
          children: body.children,
          adults: body.adults,
          discountPercentage: body.discount_percentage,
          discountReason: body.discount_reason,
          actualCost: body.actual_cost,
          discountedCost: body.discounted_cost,
          durationHr: body.duration_hr,
          expectedEndTime: endTime,
          status: "ACTIVE",
          actualEndTime: null
        }
      });

      return newSession;
    });

    const newBalance = customer.currentBalance - body.discounted_cost;
    
    await sendSessionStartMessage(
        customer.name,
        customer.mobileNumber,
        body.discounted_cost,
        newBalance,
        `${body.adults} Adults, ${body.children} Kids`
    );

    return NextResponse.json(session);

  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ detail: e.message || "Server Error" }, { status: 500 });
  }
}