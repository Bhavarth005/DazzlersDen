import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';

// POST: Create or Update
export async function POST(req: Request) {
  try {
    await getCurrentAdmin(req);
    const body = await req.json();

    if (body.id) {
        // UPDATE
        const updated = await prisma.pricingPlan.update({
            where: { id: body.id },
            data: {
                name: body.name,
                price: parseInt(body.price),
                durationHr: parseFloat(body.durationHr || 0),
                includedAdults: parseInt(body.includedAdults || 0),
                type: body.type || "PLAN", // Allows setting type to ADDON
                isActive: body.isActive
            }
        });
        return NextResponse.json(updated);
    } else {
        // CREATE
        const created = await prisma.pricingPlan.create({
            data: {
                name: body.name,
                price: parseInt(body.price),
                durationHr: parseFloat(body.durationHr || 0),
                includedAdults: parseInt(body.includedAdults || 0),
                type: body.type || "PLAN",
                isActive: true
            }
        });
        return NextResponse.json(created);
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE
export async function DELETE(req: Request) {
    try {
        await getCurrentAdmin(req);
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        await prisma.pricingPlan.delete({ where: { id: parseInt(id) } });
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}