import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// Validation Schema
const createAdminSchema = z.object({
  username: z.string().min(3, "Username too short"),
  password: z.string().min(6, "Password must be at least 6 chars"),
  role: z.enum(["ADMIN", "SUPERADMIN"]).default("ADMIN")
});

export async function POST(req: Request) {
  try {
    // 1. Security Check: Only SUPERADMINs can create new admins
    const currentAdmin = await getCurrentAdmin(req);
    if (currentAdmin.role !== 'SUPERADMIN') {
        return NextResponse.json({ detail: "Forbidden: Only Superadmins can create new users." }, { status: 403 });
    }

    const body = await req.json();
    const data = createAdminSchema.parse(body);

    // 2. Check if username exists
    const existing = await prisma.admin.findUnique({
        where: { username: data.username }
    });
    if (existing) {
        return NextResponse.json({ detail: "Username already taken" }, { status: 400 });
    }

    // 3. Hash the Password (CRITICAL STEP)
    // We never store plain text. We hash it with 10 rounds of salt.
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 4. Create the new Admin
    const newAdmin = await prisma.admin.create({
        data: {
            username: data.username,
            passwordHash: hashedPassword, // Store the hash, not the real password
            role: data.role
        }
    });

    // Return success (excluding the password)
    return NextResponse.json({
        id: newAdmin.id,
        username: newAdmin.username,
        role: newAdmin.role,
        message: "Admin created successfully"
    });

  } catch (e: any) {
    if (e.name === 'ZodError') return NextResponse.json({ detail: e.errors }, { status: 400 });
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}