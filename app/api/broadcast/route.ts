import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { sendBroadcastMessage } from '@/lib/whatsapp';

export async function POST(req: Request) {
  try {
    // 1. Secure the route
    const admin = await getCurrentAdmin(req);
    if (!admin) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse Input
    const { message } = await req.json();
    if (!message || message.length < 5) {
      return NextResponse.json({ detail: "Message too short" }, { status: 400 });
    }

    // 3. Fetch All Customers (Only those with phone numbers)
    const customers = await prisma.customer.findMany({
      where: {
        mobileNumber: { not: "" } // Ensure valid number
      },
      select: { id: true, name: true, mobileNumber: true }
    });

    if (customers.length === 0) {
      return NextResponse.json({ detail: "No customers found" }, { status: 404 });
    }

    // 4. Send Messages (Batch Processing)
    // We use Promise.allSettled to ensure one failure doesn't stop the whole batch
    const results = await Promise.allSettled(
      customers.map(customer => {
        // Optional: Replace {{name}} variable if you used it in UI
        const personalizedMessage = message.replace('{{name}}', customer.name);
        return sendBroadcastMessage(customer.mobileNumber, personalizedMessage);
      })
    );

    // 5. Calculate Stats
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failureCount = customers.length - successCount;

    return NextResponse.json({
      success: true,
      total: customers.length,
      sent: successCount,
      failed: failureCount,
      message: `Broadcast complete. Sent: ${successCount}, Failed: ${failureCount}`
    });

  } catch (e: any) {
    console.error("Broadcast Error:", e);
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}