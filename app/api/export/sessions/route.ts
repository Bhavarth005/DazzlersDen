import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { generateLedgerPDF } from '@/lib/pdfGenerator';
import { Parser } from 'json2csv';

export async function GET(req: Request) {
  try {
    await getCurrentAdmin(req);
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';

    // Fetch Sessions
    const sessions = await prisma.session.findMany({
        orderBy: { startTime: 'desc' },
        include: {
            customer: { select: { name: true, mobileNumber: true } }
        }
    });

    // Flatten Data
    const exportData = sessions.map(s => ({
        ID: s.id,
        Date: new Date(s.startTime).toLocaleDateString(),
        Customer: s.customer.name,
        Mobile: s.customer.mobileNumber,
        Duration: `${s.durationHr} hrs`,
        Guests: `${s.adults} Adults, ${s.children} Kids`,
        TotalCost: s.discountedCost.toFixed(2),
        Status: s.status,
        ExitTime: s.actualEndTime ? new Date(s.actualEndTime).toLocaleTimeString() : "Active"
    }));

    // CSV Export
    if (format === 'csv') {
        const parser = new Parser();
        return new NextResponse(parser.parse(exportData), {
            headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="sessions_${Date.now()}.csv"` }
        });
    }

    // PDF Export
    if (format === 'pdf') {
        const headers = ["Date", "Customer", "Duration", "Guests", "Cost", "Status"];
        const rows = exportData.map(d => [d.Date, d.Customer, d.Duration, d.Guests, d.TotalCost, d.Status]);
        const pdfBuffer = await generateLedgerPDF("Session History", headers, rows);
        
        return new NextResponse(pdfBuffer as any, {
            headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="sessions_${Date.now()}.pdf"` }
        });
    }

    return NextResponse.json(exportData);
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}