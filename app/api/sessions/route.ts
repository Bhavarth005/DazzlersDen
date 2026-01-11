import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { generateLedgerPDF } from '@/lib/pdfGenerator';
import { Parser } from 'json2csv';

// Helper: Timezone Formatting
function toIST(date: Date | string | null) {
    if (!date) return "-";
    return new Date(date).toLocaleString("en-IN", { 
        timeZone: "Asia/Kolkata",
        hour12: true, 
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    });
}

export async function GET(req: Request) {
  try {
    await getCurrentAdmin(req);

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';
    
    // Filters
    const search = searchParams.get('search');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const skip = parseInt(searchParams.get('skip') || '0');
    const limit = parseInt(searchParams.get('limit') || '10');

    // 1. AUTO-UPDATE OVERDUE STATUS
    await prisma.session.updateMany({
      where: {
        status: 'ACTIVE',
        expectedEndTime: { lt: new Date() }
      },
      data: { status: 'OVERDUE' }
    });

    // 2. Build Query
    const whereClause: any = {};

    if (startDate || endDate) {
      whereClause.startTime = {};
      if (startDate) whereClause.startTime.gte = new Date(startDate);
      if (endDate) whereClause.startTime.lte = new Date(endDate);
    }

    if (search) {
      const isNumber = !isNaN(Number(search));
      whereClause.OR = [
        // Case Insensitive Search for Name
        { customer: { name: { contains: search, mode: 'insensitive' } } }
      ];
      if (isNumber) {
        whereClause.OR.push({ id: parseInt(search) });
      }
    }

    // 3. Fetch Data
    const sessions = await prisma.session.findMany({
      where: whereClause,
      skip: (format === 'json') ? skip : undefined,
      take: (format === 'json') ? limit : undefined,
      orderBy: { startTime: 'desc' },
      include: {
        customer: { select: { name: true, mobileNumber: true } }
      }
    });

    // Case A: JSON Response
    if (format === 'json') {
        const totalCount = await prisma.session.count({ where: whereClause });
        return NextResponse.json({
            data: sessions,
            pagination: { total: totalCount, skip, limit }
        });
    }

    // Case B: Export Data
    const exportData = sessions.map(s => ({
        ID: s.id,
        Date: toIST(s.startTime),
        Customer: s.customer.name,
        Mobile: s.customer.mobileNumber,
        Duration: `${s.durationHr} hrs`,
        Guests: `${s.adults} Adults, ${s.children} Kids`,
        TotalCost: s.discountedCost.toFixed(2),
        Status: s.status,
        ExitTime: s.actualEndTime ? toIST(s.actualEndTime) : "Active"
    }));

    if (format === 'csv') {
        const parser = new Parser();
        return new NextResponse(parser.parse(exportData), {
            headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="sessions_${Date.now()}.csv"` }
        });
    }

    if (format === 'pdf') {
        const headers = ["Date", "Customer", "Duration", "Guests", "Cost", "Status"];
        const rows = exportData.map(d => [d.Date, d.Customer, d.Duration, d.Guests, d.TotalCost, d.Status]);
        const pdfBuffer = await generateLedgerPDF("Session History", headers, rows);
        
        return new NextResponse(pdfBuffer as any, {
            headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="sessions_${Date.now()}.pdf"` }
        });
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });

  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}