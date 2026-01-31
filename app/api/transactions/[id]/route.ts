import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getCurrentAdmin(req);

    if (admin.role !== 'SUPERADMIN') return NextResponse.json({ detail: "Forbidden" }, { status: 403 });

    const { id } = await params;

    await prisma.transaction.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}