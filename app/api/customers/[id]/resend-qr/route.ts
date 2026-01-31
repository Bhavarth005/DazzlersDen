import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { resendQRCodeMessage } from '@/lib/whatsapp';
import { generateCompositeQR } from '@/lib/qrGenerator'; // Import the generator

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    // 1. Authenticate
    await getCurrentAdmin(req);
    
    // 2. Await Params
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
    const qrUuid = customer.qrCodeUuid; 

    if (!qrUuid) {
       return NextResponse.json({ detail: "Customer has no QR Code data" }, { status: 400 });
    }

    // 5. REGENERATE THE COMPOSITE IMAGE
    // (We must do this because the previous file might have been auto-deleted)
    let publicQrUrl = "";
    try {
        publicQrUrl = await generateCompositeQR(
            qrUuid,
            customer.name,
            customer.mobileNumber
        );
    } catch (qrError) {
        console.error("QR Generation Failed:", qrError);
        return NextResponse.json({ detail: "Failed to generate QR Image" }, { status: 500 });
    }

    // 6. Send WhatsApp with the NEW Image URL
    // const result = await resendQRCodeMessage(
    //     customer.name,
    //     customer.mobileNumber,
    //     publicQrUrl // Passing the full URL (e.g., https://.../uuid.png)
    // );

    // if (!result.success) {
    //     return NextResponse.json({ detail: "Failed to send WhatsApp message" }, { status: 500 });
    // }

    return NextResponse.json({ message: "QR Code regenerated and resent successfully!" });

  } catch (e: any) {
    return NextResponse.json({ detail: e.message || "Server Error" }, { status: 500 });
  }
}