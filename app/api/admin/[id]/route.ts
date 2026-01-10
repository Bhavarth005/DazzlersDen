import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getCurrentAdmin(req);
    const { id } = await params;
    const targetId = parseInt(id);

    // 1. Security Check: Only SUPERADMIN can delete
    if (admin.role !== 'SUPERADMIN') {
        return NextResponse.json({ detail: "Forbidden: Superadmin access required" }, { status: 403 });
    }

    // 2. Safety Check: Prevent suicide (Deleting yourself)
    if (admin.id === targetId) {
        return NextResponse.json({ detail: "You cannot delete your own account." }, { status: 400 });
    }

    // 3. Perform Delete
    await prisma.admin.delete({
        where: { id: targetId }
    });

    return NextResponse.json({ message: "Admin deleted successfully" });

  } catch (e: any) {
    // Prisma error code for "Record not found"
    if (e.code === 'P2025') {
        return NextResponse.json({ detail: "Admin not found" }, { status: 404 });
    }
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}