import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { generateLedgerPDF } from '@/lib/pdfGenerator';
import { Parser } from 'json2csv';
import { sendRechargeMessage } from '@/lib/whatsapp'; 
import { z } from 'zod';

// --- FIXED SCHEMA ---
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

// --- GET: List History, Stats & Export ---
export async function GET(req: Request) {
  try {
    await getCurrentAdmin(req);

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';
    const fetchStats = searchParams.get('stats') === 'true'; // CHECK FOR STATS REQUEST
    
    // Pagination Params (Default: Page 1, Limit 10)
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Filters
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const customerName = searchParams.get('customer_name');
    const paymentMode = searchParams.get('payment_mode');

    const whereClause: any = {};
    
    if (customerName) {
        whereClause.customer = {
            name: { contains: customerName }
        };
    }

    if (paymentMode) {
        whereClause.paymentMode = { equals: paymentMode };
    }
    
    if (startDate || endDate) {
        whereClause.date = {};
        if (startDate) whereClause.date.gte = new Date(startDate);
        if (endDate) whereClause.date.lte = new Date(endDate);
    }

    // --- FEATURE 1: TRANSACTION STATS (Restored) ---
    // If client asks for stats (e.g. ?stats=true), return totals instead of list
    if (fetchStats) {
        const aggregations = await prisma.transaction.groupBy({
            by: ['paymentMode'],
            _sum: { amount: true },
            where: whereClause, // Stats respect current filters (date, name, etc.)
        });

        // Format: { UPI: 5000, CASH: 2000, TOTAL: 7000 }
        const stats = aggregations.reduce((acc, curr) => {
            const mode = curr.paymentMode || 'UNKNOWN';
            acc[mode] = curr._sum.amount || 0;
            acc.TOTAL += curr._sum.amount || 0;
            return acc;
        }, { TOTAL: 0 } as Record<string, number>);

        return NextResponse.json(stats);
    }

    // --- MAIN QUERY ---
    // We only use pagination (skip/take) if format is JSON. 
    // Exports (CSV/PDF) usually need ALL data, so we check format first.
    
    const isExport = format === 'csv' || format === 'pdf';

    // 1. Fetch Data
    const transactions = await prisma.transaction.findMany({
        where: whereClause,
        include: {
            customer: { select: { name: true, mobileNumber: true } },
            admin: { select: { username: true } }
        },
        orderBy: { date: 'desc' },
        // Only apply skip/limit if NOT exporting
        ...( !isExport && { skip, take: limit } )
    });

    // 2. Get Total Count (For Pagination UI)
    const totalCount = await prisma.transaction.count({ where: whereClause });

    // --- RETURN JSON (Standard API) ---
    if (format === 'json') {
        return NextResponse.json({
            data: transactions,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
    }

    // --- EXPORT LOGIC (CSV/PDF) ---
    // Format data for export
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

// --- POST: Handle Recharge (Unchanged) ---
export async function POST(req: Request) {
  try {
    const admin = await getCurrentAdmin(req);
    const rawBody = await req.json();

    const body = rechargeSchema.parse(rawBody); 

    const customer = await prisma.customer.findUnique({ 
        where: { id: body.customerId }
    });
    
    if (!customer) {
        return NextResponse.json({ detail: "Customer not found" }, { status: 404 });
    }

    const offer = await prisma.rechargeOffer.findFirst({
      where: {
        triggerAmount: body.amount,
        isActive: true
      }
    });

    const bonus = offer ? offer.bonusAmount : 0;
    const totalWalletAdd = body.amount + bonus;

    const result = await prisma.$transaction(async (tx) => {
      const updatedCustomer = await tx.customer.update({
        where: { id: body.customerId },
        data: { currentBalance: { increment: totalWalletAdd } }
      });

      const mainTxn = await tx.transaction.create({
        data: {
          customerId: body.customerId,
          adminId: admin.id,
          transactionType: "RECHARGE",
          amount: body.amount,
          paymentMode: body.paymentMode
        }
      });

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
    if (e instanceof z.ZodError) {
        return NextResponse.json({ detail: e.flatten() }, { status: 400 });
    }
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}