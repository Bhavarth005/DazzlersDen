import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { z } from 'zod';

const offerSchema = z.object({
  id: z.number().optional(), // If ID exists, we update. If not, we create.
  triggerAmount: z.number().positive(),
  bonusAmount: z.number().nonnegative(),
  description: z.string().optional(),
  isActive: z.boolean().optional()
});

// GET: List all offers (Visible to all admins)
export async function GET(req: Request) {
  try {
    await getCurrentAdmin(req);
    const offers = await prisma.rechargeOffer.findMany({
        orderBy: { triggerAmount: 'asc' }
    });
    return NextResponse.json(offers);
  } catch(e) { return NextResponse.json({error: "Unauthorized"}, {status: 401}); }
}

// POST: Create or Update (SUPERADMIN ONLY)
export async function POST(req: Request) {
  try {
    const admin = await getCurrentAdmin(req);

    // 1. ROLE CHECK
    if (admin.role !== 'SUPERADMIN') {
        return NextResponse.json({ detail: "Forbidden: Superadmin access required" }, { status: 403 });
    }

    const body = await req.json();
    const data = offerSchema.parse(body);

    let result;

    if (data.id) {
        // Update existing
        result = await prisma.rechargeOffer.update({
            where: { id: data.id },
            data: {
                triggerAmount: data.triggerAmount,
                bonusAmount: data.bonusAmount,
                description: data.description,
                isActive: data.isActive
            }
        });
    } else {
        result = await prisma.rechargeOffer.create({
            data: {
                triggerAmount: data.triggerAmount,
                bonusAmount: data.bonusAmount,
                description: data.description,
                isActive: data.isActive ?? true
            }
        });
    }

    return NextResponse.json(result);

  } catch (e: any) {
    if (e.name === 'ZodError') return NextResponse.json({ detail: e.errors }, { status: 400 });
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}

// DELETE: Remove an offer (SUPERADMIN ONLY)
export async function DELETE(req: Request) {
  try {
    const admin = await getCurrentAdmin(req);

    // 1. ROLE CHECK
    if (admin.role !== 'SUPERADMIN') {
        return NextResponse.json({ detail: "Forbidden: Superadmin access required" }, { status: 403 });
    }

    // 2. Get ID from URL Query Params
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ detail: "Offer ID is required" }, { status: 400 });
    }

    // 3. Perform Delete
    await prisma.rechargeOffer.delete({
        where: { id: Number(id) }
    });

    return NextResponse.json({ success: true, message: "Offer deleted successfully" });

  } catch (e: any) {
    // Handle case where record doesn't exist
    if (e.code === 'P2025') {
        return NextResponse.json({ detail: "Offer not found" }, { status: 404 });
    }
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}