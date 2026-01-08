import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';

// Helper to parse ID safely
const getId = async (params: Promise<{ id: string }>) => {
  const { id } = await params;
  return parseInt(id);
};

// PUT: Edit Customer Details
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await getCurrentAdmin(req);
    const customerId = await getId(params);
    const body = await req.json();
    
    // Body: { name, mobile_number, birthdate }

    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        name: body.name,
        mobileNumber: body.mobile_number,
        birthdate: body.birthdate ? new Date(body.birthdate) : undefined
      }
    });

    return NextResponse.json(updatedCustomer);
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}

// DELETE: Remove Customer (Hard Delete)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getCurrentAdmin(req);
    const customerId = await getId(params);

    // Only SUPERADMIN can delete (Optional security check)
    // if (admin.role !== 'SUPERADMIN') return NextResponse.json({ detail: "Forbidden" }, { status: 403 });

    // Use transaction to delete ALL history first (Cascading Delete)
    await prisma.$transaction(async (tx) => {
      // 1. Delete Transactions
      await tx.transaction.deleteMany({ where: { customerId: customerId } });
      
      // 2. Delete Sessions
      await tx.session.deleteMany({ where: { customerId: customerId } });
      
      // 3. Delete Customer
      await tx.customer.delete({ where: { id: customerId } });
    });

    return NextResponse.json({ message: "Customer and all history deleted successfully" });

  } catch (e: any) {
    return NextResponse.json({ detail: "Failed to delete. Customer might not exist." }, { status: 500 });
  }
}