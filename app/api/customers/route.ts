import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { sendWelcomeMessage } from '@/lib/whatsapp'; 
import { customerCreateSchema } from '@/lib/schemas';
import { generateCustomerStatementPDF } from '@/lib/pdfGenerator';
import { Parser } from 'json2csv';

// Helper for Export formatting
function toIST(date: Date | string | null) {
    if (!date) return "-";
    return new Date(date).toLocaleString("en-IN", { 
        timeZone: "Asia/Kolkata",
        hour12: true, 
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    });
}

// GET: List & Export Customers
export async function GET(req: Request) {
  try {
    await getCurrentAdmin(req); 
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || "";
    const format = searchParams.get('format') || 'json';
    const customerIdsParam = searchParams.get('customer_id');

    const whereClause: any = {};

    // 1. Specific IDs Filter (for Bulk Export)
    if (customerIdsParam) {
        const ids = customerIdsParam.split(',').map(id => parseInt(id.trim())).filter(n => !isNaN(n));
        if (ids.length > 0) {
            whereClause.id = { in: ids };
        }
    }

    // 2. Search Filter
    if (search) {
      const isNumber = !isNaN(Number(search));
      whereClause.OR = [
        { name: { contains: search } }, 
        { mobileNumber: { contains: search } }, 
      ];
      if (isNumber) {
        whereClause.OR.push({ id: parseInt(search) });
      }
    }

    // 3. Fetch Data
    const customers = await prisma.customer.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      // Include related data only if exporting
      include: (format !== 'json') ? {
          transactions: { orderBy: { date: 'desc' }, take: 20, include: { admin: true } },
          sessions: { orderBy: { startTime: 'desc' }, take: 20 }
      } : undefined
    });
    
    // ---------------------------------------------------------
    // CASE A: JSON Request (Standard API)
    // ---------------------------------------------------------
    if (format === 'json') {
        return NextResponse.json(customers);
    }

    // ---------------------------------------------------------
    // CASE B: CSV Export (Summary)
    // ---------------------------------------------------------
    if (format === 'csv') {
        const flatData = customers.map(c => ({
            ID: c.id,
            Name: c.name,
            Mobile: c.mobileNumber,
            Balance: c.currentBalance,
            Joined: toIST(c.createdAt)
        }));
        const parser = new Parser();
        return new NextResponse(parser.parse(flatData), {
            headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="customers_${Date.now()}.csv"` }
        });
    }

    // ---------------------------------------------------------
    // CASE C: PDF Export (Detailed Dossier)
    // ---------------------------------------------------------
    if (format === 'pdf') {
        const pdfBuffer = await generateCustomerStatementPDF(customers);
        return new NextResponse(pdfBuffer as any, {
            headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="customer_statements_${Date.now()}.pdf"` }
        });
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });

  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Unauthorized" }, { status: 500 });
  }
}

// POST: Create Customer + Initial Transaction
export async function POST(req: Request) {
  try {
    const admin = await getCurrentAdmin(req);
    const rawBody = await req.json(); 
    
    // Validate core fields
    const body = customerCreateSchema.parse(rawBody);
    
    // Extract paymentMode directly from rawBody (Defaults to CASH)
    // We do this here so it works even if you haven't updated the Zod schema file yet
    const paymentMode = (rawBody as any).paymentMode || "CASH";
    
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
      const offer = await prisma.rechargeOffer.findFirst({
        where: { triggerAmount: initialAmount, isActive: true }
      });
      if (offer) bonus = offer.bonusAmount;
    }

    const totalStartingBalance = initialAmount + bonus;

    // 3. Atomic Transaction
    const result = await prisma.$transaction(async (tx) => {
      // A. Create Customer
      const newCustomer = await tx.customer.create({
        data: {
          name: body.name,
          mobileNumber: body.mobile_number,
          birthdate: new Date(body.birthdate),
          currentBalance: totalStartingBalance, 
        }
      });

      // B. Create Transactions if money was added
      if (initialAmount > 0) {
        await tx.transaction.create({
          data: {
            customerId: newCustomer.id,
            adminId: admin.id,
            transactionType: "RECHARGE",
            amount: initialAmount,
            paymentMode: paymentMode // <--- NOW DYNAMIC
          }
        });

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

    // 4. Send WhatsApp
    // Note: Ensure 'qrCodeUuid' exists on your Prisma model, otherwise this might be undefined
    await sendWelcomeMessage(
        result.name, 
        result.mobileNumber, 
        (result as any).qrCodeUuid, 
        result.currentBalance
    );

    return NextResponse.json({
        ...result,
        message: "Customer created & WhatsApp sent!"
    });

  } catch (e: any) {
    return NextResponse.json({ detail: e.message || "Server Error" }, { status: 500 });
  }
}