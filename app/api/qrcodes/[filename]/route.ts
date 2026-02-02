import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ filename: string }> } // Await params for Next.js 15
) {
  try {
    const { filename } = await params;

    // 1. Define the path where files are actually saved
    // This must match the path used in your qrGenerator.ts
    const filePath = path.join(process.cwd(), 'public', '_qrcodes', filename);

    // 2. Check if file exists
    if (!fs.existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    // 3. Read the file from the filesystem
    const fileBuffer = fs.readFileSync(filePath);

    // 4. Return the image with correct headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=300', // Cache for 5 mins (matches your delete timer)
      },
    });

  } catch (error) {
    console.error('Error serving QR code:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}