// app/api/admin/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Check Authentication (Only Superadmins can delete admins)
    const currentAdmin = await getCurrentAdmin(req);
    
    // Optional: Check if current admin is SUPERADMIN
    // if (currentAdmin.role !== 'SUPERADMIN') {
    //   return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
    // }

    const adminIdToDelete = parseInt(params.id);

    if (isNaN(adminIdToDelete)) {
      return NextResponse.json({ detail: "Invalid ID" }, { status: 400 });
    }

    // 2. Prevent deleting yourself
    if (adminIdToDelete === currentAdmin.id) {
        return NextResponse.json({ detail: "Cannot delete yourself" }, { status: 400 });
    }

    // 3. Check if admin exists
    const adminExists = await prisma.admin.findUnique({
      where: { id: adminIdToDelete }
    });

    if (!adminExists) {
      return NextResponse.json({ detail: "Admin not found" }, { status: 404 });
    }

    // 4. Delete
    await prisma.admin.delete({
      where: { id: adminIdToDelete }
    });

    return NextResponse.json({ message: "Admin deleted successfully" });

  } catch (e: any) {
    return NextResponse.json({ detail: e.message || "Server Error" }, { status: 500 });
  }
}