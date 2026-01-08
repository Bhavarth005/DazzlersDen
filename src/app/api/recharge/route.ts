import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const admin = await getCurrentAdmin(req);
    const body = await req.json(); 
    // Body: { customer_id, amount, payment_mode }

    // 1. Validate Customer
    const customer = await prisma.customer.findUnique({ 
        where: { id: body.customer_id }
    });
    
    if (!customer) {
        return NextResponse.json({ detail: "Customer not found" }, { status: 404 });
    }

    // 2. Check for Active Offers
    // We look for an offer where the triggerAmount matches exactly what is being paid
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
      // A. Update Wallet Balance (Cash + Bonus)
      await tx.customer.update({
        where: { id: body.customer_id },
        data: { currentBalance: { increment: totalWalletAdd } }
      });

      // B. Create MAIN Transaction (Real Money)
      const mainTxn = await tx.transaction.create({
        data: {
          customerId: body.customer_id,
          adminId: admin.id,
          transactionType: "RECHARGE", // Standard type
          amount: body.amount,         // Only the real cash amount
          paymentMode: body.payment_mode
        }
      });

      // C. Create BONUS Transaction (If applicable)
      if (bonus > 0) {
        await tx.transaction.create({
          data: {
            customerId: body.customer_id,
            adminId: admin.id,
            transactionType: "BONUS",  // Distinct type for filtering later
            amount: bonus,
            paymentMode: "SYSTEM"      // Indicates system generated
          }
        });
      }

      return mainTxn;
    });

    return NextResponse.json({
      success: true,
      new_balance: customer.currentBalance + totalWalletAdd,
      message: bonus > 0 
        ? `Recharged ${body.amount} + ${bonus} Bonus Applied!` 
        : `Recharged ${body.amount} successfully.`
    });

  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}