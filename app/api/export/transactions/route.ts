import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { generateLedgerPDF } from '@/lib/pdfGenerator';
import { Parser } from 'json2csv';

export async function GET(req: Request) {
  try {
    await getCurrentAdmin(req);

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json'; // csv, pdf, json
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const customerId = searchParams.get('customer_id');

    // 1. Build Filter
    const whereClause: any = {};
    
    if (customerId) whereClause.customerId = parseInt(customerId);
    
    if (startDate || endDate) {
        whereClause.date = {};
        if (startDate) whereClause.date.gte = new Date(startDate);
        if (endDate) whereClause.date.lte = new Date(endDate);
    }

    // 2. Fetch Data
    const transactions = await prisma.transaction.findMany({
        where: whereClause,
        include: {
            customer: { select: { name: true, mobileNumber: true } },
            admin: { select: { username: true } }
        },
        orderBy: { date: 'desc' }
    });

    // 3. Flatten Data for Export (Common step for CSV & PDF)
    const exportData = transactions.map(t => ({
        ID: t.id,
        Date: new Date(t.date).toLocaleDateString(),
        Customer: t.customer.name,
        Mobile: t.customer.mobileNumber,
        Type: t.transactionType,
        Amount: t.amount.toFixed(2),
        Mode: t.paymentMode || "-",
        Admin: t.admin?.username || "System"
    }));

    // 4. Handle CSV Export
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

    // 5. Handle PDF Export (Ledger Style)
    if (format === 'pdf') {
        const headers = ["Date", "Customer", "Type", "Mode", "Amount", "Admin"];
        const rows = exportData.map(d => [
            d.Date, 
            d.Customer, 
            d.Type, 
            d.Mode, 
            `Rs. ${d.Amount}`, 
            d.Admin
        ]);

        const pdfBuffer = await generateLedgerPDF("Transaction Ledger", headers, rows);

        // 5. Handle PDF Export (Ledger Style)
    if (format === 'pdf') {
        const headers = ["Date", "Customer", "Type", "Mode", "Amount", "Admin"];
        const rows = exportData.map(d => [
            d.Date, 
            d.Customer, 
            d.Type, 
            d.Mode, 
            `Rs. ${d.Amount}`, 
            d.Admin
        ]);

        const pdfBuffer = await generateLedgerPDF("Transaction Ledger", headers, rows);

        // FIX: Cast pdfBuffer to 'any' or 'BodyInit' to satisfy TypeScript
        return new NextResponse(pdfBuffer as any, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="ledger_${Date.now()}.pdf"`
            }
        });
    }

    // Default JSON
    return NextResponse.json(exportData);

}
} catch (e: any) {
  return NextResponse.json({ detail: e.message }, { status: 500 });
}}