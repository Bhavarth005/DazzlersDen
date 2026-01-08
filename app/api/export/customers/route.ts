import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { generateCustomerStatementPDF } from '@/lib/pdfGenerator';
import { Parser } from 'json2csv';

export async function GET(req: Request) {
  try {
    await getCurrentAdmin(req);
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';
    const customerId = searchParams.get('customer_id');

    // Filter Logic
    const whereClause: any = {};
    if (customerId) whereClause.id = parseInt(customerId);

    // Fetch Deep Data (Include Transactions & Sessions)
    const customers = await prisma.customer.findMany({
        where: whereClause,
        include: {
            transactions: { 
                orderBy: { date: 'desc' },
                take: 20, // Limit history length per customer for readability
                include: { admin: true }
            },
            sessions: {
                orderBy: { startTime: 'desc' },
                take: 20
            }
        },
        orderBy: { name: 'asc' }
    });

    // CSV Export (Summary Only - Flat Data)
    if (format === 'csv') {
        const flatData = customers.map(c => ({
            ID: c.id,
            Name: c.name,
            Mobile: c.mobileNumber,
            Balance: c.currentBalance,
            TotalTransactions: c.transactions.length,
            TotalSessions: c.sessions.length,
            Joined: new Date(c.createdAt).toLocaleDateString()
        }));
        const parser = new Parser();
        return new NextResponse(parser.parse(flatData), {
            headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="customers_summary_${Date.now()}.csv"` }
        });
    }

    // PDF Export (Detailed Dossier)
    if (format === 'pdf') {
        const pdfBuffer = await generateCustomerStatementPDF(customers);
        return new NextResponse(pdfBuffer as any, {
            headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="customer_statements_${Date.now()}.pdf"` }
        });
    }

    return NextResponse.json(customers);
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}