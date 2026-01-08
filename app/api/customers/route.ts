import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { sendWelcomeMessage } from '@/lib/whatsapp'; 
import { customerCreateSchema} from '@/lib/schemas';

// GET: List all customers
export async function GET(req: Request) {
  try {
    await getCurrentAdmin(req); 
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(customers);
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// POST: Create Customer + Initial Transaction (With Offers)
export async function POST(req: Request) {
  try {
    const admin = await getCurrentAdmin(req);
    const rawBody = await req.json(); 
    const body = customerCreateSchema.parse(rawBody);
    // Body: { name, mobile_number, birthdate, initial_balance }
    
    // 1. Check duplicate mobile
    const existing = await prisma.customer.findUnique({
      where: { mobileNumber: body.mobile_number }
    });
    if (existing) {
      return NextResponse.json({ detail: "Mobile number already registered" }, { status: 400 });
    }

    // 2. Calculate Balance based on Offers
    let initialAmount = body.initial_balance || 0;
    let bonus = 0;

    if (initialAmount > 0) {
      // Check if this initial amount triggers an offer
      const offer = await prisma.rechargeOffer.findFirst({
        where: {
          triggerAmount: initialAmount,
          isActive: true
        }
      });
      if (offer) {
        bonus = offer.bonusAmount;
      }
    }

    const totalStartingBalance = initialAmount + bonus;

    // 3. Atomic Transaction
    const result = await prisma.$transaction(async (tx) => {
      // A. Create Customer with the FINAL calculated balance
      const newCustomer = await tx.customer.create({
        data: {
          name: body.name,
          mobileNumber: body.mobile_number,
          birthdate: new Date(body.birthdate),
          currentBalance: totalStartingBalance, // Set balance = Cash + Bonus
        }
      });

      // B. Create Transactions if money was added
      if (initialAmount > 0) {
        // 1. Main Cash Transaction
        await tx.transaction.create({
          data: {
            customerId: newCustomer.id,
            adminId: admin.id,
            transactionType: "RECHARGE",
            amount: initialAmount,
            paymentMode: "CASH" // Default for initial creation
          }
        });

        // 2. Bonus Transaction (if applicable)
        if (bonus > 0) {
          await tx.transaction.create({
            data: {
              customerId: newCustomer.id,
              adminId: admin.id,
              transactionType: "BONUS",
              amount: bonus,
              paymentMode: "SYSTEM"
            }
          });
        }
      }

      return newCustomer;
    });
    await sendWelcomeMessage(
        result.name, 
        result.mobileNumber, 
        result.qrCodeUuid, 
        result.currentBalance
    );

    return NextResponse.json({
        ...result,
        message: "Customer created & WhatsApp sent!"
    });

    // return NextResponse.json({
    //     ...result,
    //     message: bonus > 0 
    //         ? `Customer created with balance ${initialAmount} + ${bonus} Bonus!` 
    //         : "Customer created successfully"
    // });

  } catch (e: any) {
    return NextResponse.json({ detail: e.message || "Server Error" }, { status: 500 });
  }
}