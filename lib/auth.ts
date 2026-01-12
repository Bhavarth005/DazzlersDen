import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

// 1. Read from environment (give it a temporary name)
const envSecret = process.env.SECRET_KEY;

// 2. Validate
if (!envSecret) {
  throw new Error("FATAL: SECRET_KEY is not defined in environment variables.");
}

// 3. Export the validated, safe string
export const SECRET_KEY = envSecret as string;

export const verifyPassword = async (plain: string, hashed: string) => {
  return await bcrypt.compare(plain, hashed);
};

export const createToken = (username: string) => {
  // Use the exported SECRET_KEY here
  return jwt.sign({ sub: username }, SECRET_KEY, { expiresIn: '720m' }); //  12 hrs = 720m
};

export async function getCurrentAdmin(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error("Unauthorized");
  }
  const token = authHeader.split(' ')[1];
  try {
    // Use the exported SECRET_KEY here
    const decoded = jwt.verify(token, SECRET_KEY) as { sub: string };
    const admin = await prisma.admin.findUnique({
      where: { username: decoded.sub }
    });
    if (!admin) throw new Error("Admin not found");
    return admin;
  } catch (err) {
    throw new Error("Unauthorized");
  }
}
