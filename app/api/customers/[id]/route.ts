import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';

// UPDATE Customer (PUT)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getCurrentAdmin(req);
    const { id } = await params;
    const body = await req.json();

    // We only include fields that are actually present in the body (Partial Update)
    const updateData: any = {};

    if (body.currentBalance) {
      if(admin.role != "SUPERADMIN") {
        return NextResponse.json({ detail: "Only SUPERADMIN can update balance" }, { status: 403 });
      }

      updateData.currentBalance = body.currentBalance;
    }

    if (body.name) updateData.name = body.name;
    if (body.mobile_number) updateData.mobileNumber = body.mobile_number; // Map snake_case to camelCase
    
    // Convert String to Date
    if (body.birthdate) {
        updateData.birthdate = new Date(body.birthdate);
    }

    // Perform Update
    const updatedCustomer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    return NextResponse.json(updatedCustomer);

  } catch (e: any) {
    // Handle record not found
    if (e.code === 'P2025') {
        return NextResponse.json({ detail: "Customer not found" }, { status: 404 });
    }
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}

// DELETE Customer
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await getCurrentAdmin(req);
        if (admin.role !== 'SUPERADMIN') return NextResponse.json({ detail: "Forbidden" }, { status: 403 });

        const { id } = await params;
        await prisma.customer.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ message: "Customer deleted successfully" });
    } catch (e: any) {
        if (e.code === 'P2025') return NextResponse.json({ detail: "Customer not found" }, { status: 404 });
        return NextResponse.json({ detail: e.message }, { status: 500 });
    }
}