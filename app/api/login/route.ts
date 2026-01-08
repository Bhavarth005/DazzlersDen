import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createToken } from '@/lib/auth';

export async function POST(req: Request) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  try {
    const body = await req.json(); // Expects { username, password }
    
    const admin = await prisma.admin.findUnique({
      where: { username: body.username }
    });

    if (!admin || !(await verifyPassword(body.password, admin.passwordHash))) {
      return NextResponse.json(
        { detail: "Incorrect username or password" }, 
        { status: 401 }
      );
    }

    const token = createToken(admin.username);
    return NextResponse.json({ access_token: token, token_type: "bearer" });
    
  } catch (e) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}