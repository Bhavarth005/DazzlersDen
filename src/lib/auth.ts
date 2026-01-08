import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

const SECRET_KEY = process.env.SECRET_KEY || "supersecretkey"; 

export const verifyPassword = async (plain: string, hashed: string) => {
  return await bcrypt.compare(plain, hashed);
};

export const createToken = (username: string) => {
  return jwt.sign({ sub: username }, SECRET_KEY, { expiresIn: '300m' });
};

export async function getCurrentAdmin(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error("Unauthorized");
  }
  const token = authHeader.split(' ')[1];
  try {
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