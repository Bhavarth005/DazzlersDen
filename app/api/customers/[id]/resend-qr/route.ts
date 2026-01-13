// app/api/customers/[id]/resend-qr/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { resendQRCodeMessage } from '@/lib/whatsapp';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // FIXED: params is a Promise in Next.js 15
) {
  try {
    // 1. Authenticate
    await getCurrentAdmin(req);
    
    // 2. Await Params (Crucial fix for Next.js 15)
    const { id } = await params;
    const customerId = parseInt(id);

    if (isNaN(customerId)) {
      return NextResponse.json({ detail: "Invalid ID" }, { status: 400 });
    }

    // 3. Fetch Customer
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return NextResponse.json({ detail: "Customer not found" }, { status: 404 });
    }

    // 4. Validate Data
    // We need 'qrCodeUuid' to be present. 
    // (Ensure your schema has this field, or use 'id' if you generate QR from ID)
    const qrData = (customer as any).qrCodeUuid; 

    if (!qrData) {
       return NextResponse.json({ detail: "Customer has no QR Code data" }, { status: 400 });
    }
    const result = await resendQRCodeMessage(
        customer.name,
        customer.mobileNumber,
        qrData
    );

    if (!result.success) {
        return NextResponse.json({ detail: "Failed to send WhatsApp message" }, { status: 500 });
    }

    return NextResponse.json({ message: "QR Code resent successfully!" });

  } catch (e: any) {
    return NextResponse.json({ detail: e.message || "Server Error" }, { status: 500 });
  }
}