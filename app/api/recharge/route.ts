import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { sendRechargeMessage } from '@/lib/whatsapp'; 
import { rechargeSchema } from '@/lib/schemas';

export async function POST(req: Request) {
  try {
    const admin = await getCurrentAdmin(req);
    const rawBody = await req.json();

    // VALIDATION STEP: This throws an error if inputs are bad (e.g. negative amount)
    const body = rechargeSchema.parse(rawBody);
    // Body: { customer_id, amount, payment_mode }

    // 1. Validate Customer
    const customer = await prisma.customer.findUnique({ 
        where: { id: body.customer_id }
    });
    
    if (!customer) {
        return NextResponse.json({ detail: "Customer not found" }, { status: 404 });
    }

    // 2. Check for Active Offers
    const offer = await prisma.rechargeOffer.findFirst({
      where: {
        triggerAmount: body.amount,
        isActive: true
      }
    });

    const bonus = offer ? offer.bonusAmount : 0;
    const totalWalletAdd = body.amount + bonus;

    // 3. Perform Transaction (Atomic Update)
    const result = await prisma.$transaction(async (tx) => {
      // Update Balance
      const updatedCustomer = await tx.customer.update({
        where: { id: body.customer_id },
        data: { currentBalance: { increment: totalWalletAdd } }
      });

      // Create MAIN Transaction
      const mainTxn = await tx.transaction.create({
        data: {
          customerId: body.customer_id,
          adminId: admin.id,
          transactionType: "RECHARGE",
          amount: body.amount,
          paymentMode: body.payment_mode
        }
      });

      // Create BONUS Transaction
      if (bonus > 0) {
        await tx.transaction.create({
          data: {
            customerId: body.customer_id,
            adminId: admin.id,
            transactionType: "BONUS",
            amount: bonus,
            paymentMode: "SYSTEM"
          }
        });
      }

      // Return the updated customer so we have the exact new balance
      return { mainTxn, updatedCustomer };
    });

    // --- NEW: SEND WHATSAPP NOTIFICATION ---
    await sendRechargeMessage(
        customer.name,
        customer.mobileNumber,
        body.amount,
        bonus,
        result.updatedCustomer.currentBalance // The authoritative new balance from DB
    );

    return NextResponse.json({
      success: true,
      new_balance: result.updatedCustomer.currentBalance,
      message: bonus > 0 
        ? `Recharged ${body.amount} + ${bonus} Bonus Applied!` 
        : `Recharged ${body.amount} successfully.`
    });

  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    if (e.name === 'ZodError') {
        return NextResponse.json({ detail: e.errors }, { status: 400 });
    }
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}