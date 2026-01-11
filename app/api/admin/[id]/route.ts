// app/api/admin/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';

export async function DELETE(
  req: Request,
  // 1. FIXED: Type definition now expects a Promise
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 2. FIXED: Await the params to get the actual ID
    const { id } = await params; 
    
    // Check Authentication
    const currentAdmin = await getCurrentAdmin(req);
    
    const adminIdToDelete = parseInt(id);

    if (isNaN(adminIdToDelete)) {
      return NextResponse.json({ detail: "Invalid ID" }, { status: 400 });
    }

    // Prevent deleting yourself
    if (adminIdToDelete === currentAdmin.id) {
        return NextResponse.json({ detail: "Cannot delete yourself" }, { status: 400 });
    }

    // Check if admin exists
    const adminExists = await prisma.admin.findUnique({
      where: { id: adminIdToDelete }
    });

    if (!adminExists) {
      return NextResponse.json({ detail: "Admin not found" }, { status: 404 });
    }

    // Delete
    await prisma.admin.delete({
      where: { id: adminIdToDelete }
    });

    return NextResponse.json({ message: "Admin deleted successfully" });

  } catch (e: any) {
    return NextResponse.json({ detail: e.message || "Server Error" }, { status: 500 });
  }
}