import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { generateLedgerPDF } from '@/lib/pdfGenerator';
import { Parser } from 'json2csv';
import { sendRechargeMessage } from '@/lib/whatsapp'; 
import { z } from 'zod';

// --- FIXED SCHEMA ---
// Removed { required_error } objects to satisfy TypeScript
const rechargeSchema = z.object({
  customerId: z.number(), 
  amount: z.number().min(1, "Amount must be positive"),
  paymentMode: z.string().min(1, "Payment mode is required"), 
});

// --- HELPER: Timezone Formatting ---
function toIST(date: Date | string | null) {
    if (!date) return "-";
    return new Date(date).toLocaleString("en-IN", { 
        timeZone: "Asia/Kolkata",
        hour12: true, 
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    });
}

// --- GET: List History & Export (CSV/PDF) ---
export async function GET(req: Request) {
  try {
    await getCurrentAdmin(req);

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json'; 
    
    // Filters
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const customerName = searchParams.get('customer_name');
    const paymentMode = searchParams.get('payment_mode');

    const whereClause: any = {};
    
    if (customerName) {
        whereClause.customer = {
            name: { contains: customerName, mode: 'insensitive' }
        };
    }

    if (paymentMode) {
        whereClause.paymentMode = { equals: paymentMode, mode: 'insensitive' };
    }
    
    if (startDate || endDate) {
        whereClause.date = {};
        if (startDate) whereClause.date.gte = new Date(startDate);
        if (endDate) whereClause.date.lte = new Date(endDate);
    }

    // Fetch Data
    const transactions = await prisma.transaction.findMany({
        where: whereClause,
        include: {
            customer: { select: { name: true, mobileNumber: true } },
            admin: { select: { username: true } }
        },
        orderBy: { date: 'desc' }
    });

    // 1. Return JSON (Standard API)
    if (format === 'json') {
        return NextResponse.json(transactions);
    }

    // 2. Format for Export
    const exportData = transactions.map(t => ({
        ID: t.id,
        Date: toIST(t.date), 
        Customer: t.customer.name,
        Mobile: t.customer.mobileNumber,
        Type: t.transactionType,
        Amount: t.amount.toFixed(2),
        Mode: t.paymentMode || "-",
        Admin: t.admin?.username || "System"
    }));

    // CSV Export
    if (format === 'csv') {
        const parser = new Parser();
        const csv = parser.parse(exportData);
        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="transactions_export_${Date.now()}.csv"`
            }
        });
    }

    // PDF Export
    if (format === 'pdf') {
        const headers = ["Date", "Customer", "Type", "Mode", "Amount", "Admin"];
        const rows = exportData.map(d => [
            d.Date, d.Customer, d.Type, d.Mode, `Rs. ${d.Amount}`, d.Admin
        ]);
        const pdfBuffer = await generateLedgerPDF("Transaction Ledger", headers, rows);
        return new NextResponse(pdfBuffer as any, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="ledger_${Date.now()}.pdf"`
            }
        });
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });

  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}

// --- POST: Handle Recharge (With Offers & WhatsApp) ---
export async function POST(req: Request) {
  try {
    const admin = await getCurrentAdmin(req);
    const rawBody = await req.json();

    // 1. Validation
    const body = rechargeSchema.parse(rawBody); 

    const customer = await prisma.customer.findUnique({ 
        where: { id: body.customerId }
    });
    
    if (!customer) {
        return NextResponse.json({ detail: "Customer not found" }, { status: 404 });
    }

    // 2. Check Offers
    const offer = await prisma.rechargeOffer.findFirst({
      where: {
        triggerAmount: body.amount,
        isActive: true
      }
    });

    const bonus = offer ? offer.bonusAmount : 0;
    const totalWalletAdd = body.amount + bonus;

    // 3. Atomic Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update Customer Balance
      const updatedCustomer = await tx.customer.update({
        where: { id: body.customerId },
        data: { currentBalance: { increment: totalWalletAdd } }
      });

      // Create MAIN Transaction
      const mainTxn = await tx.transaction.create({
        data: {
          customerId: body.customerId,
          adminId: admin.id,
          transactionType: "RECHARGE",
          amount: body.amount,
          paymentMode: body.paymentMode
        }
      });

      // Create BONUS Transaction (if any)
      if (bonus > 0) {
        await tx.transaction.create({
          data: {
            customerId: body.customerId,
            adminId: admin.id,
            transactionType: "BONUS",
            amount: bonus,
            paymentMode: "SYSTEM"
          }
        });
      }

      return { mainTxn, updatedCustomer };
    });

    // 4. Send WhatsApp
    await sendRechargeMessage(
        customer.name,
        customer.mobileNumber,
        body.amount,
        bonus,
        result.updatedCustomer.currentBalance 
    );

    return NextResponse.json({
      success: true,
      new_balance: result.updatedCustomer.currentBalance,
      message: bonus > 0 
        ? `Recharged ${body.amount} + ${bonus} Bonus!` 
        : `Recharged ${body.amount} successfully.`
    });

  } catch (e: any) {
    // FIX: Use e.flatten() or e.message to avoid "Property 'errors' does not exist"
    if (e instanceof z.ZodError) {
        return NextResponse.json({ detail: e.flatten() }, { status: 400 });
    }
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}