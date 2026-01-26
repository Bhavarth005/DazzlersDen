import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const data = await prisma.pricingPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    });

    // We separate them here to make Frontend life easier
    const plans = data.filter(item => item.type === 'PLAN');
    const addons = data.filter(item => item.type === 'ADDON');

    return NextResponse.json({
      plans,
      extraAdultPrice: addons.length > 0 ? addons[0].price : 100 // Default fallback
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}