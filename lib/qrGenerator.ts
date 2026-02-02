import sharp from 'sharp';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';

// Helper to ensure public directory exists
const ensureDirectory = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

export async function generateCompositeQR(
  uuid: string, 
  name: string, 
  mobile: string
): Promise<string> {
  try {
    // Base image lives in root/assets (Private)
    const baseImagePath = path.join(process.cwd(), 'assets', 'base.png');
    
    // Output image lives in root/public/qrcodes (Public)
    const publicDir = path.join(process.cwd(), 'public', '_qrcodes');
    ensureDirectory(publicDir);
    
    const fileName = `${uuid}.png`;
    const outputPath = path.join(publicDir, fileName);

    // 2. GENERATE QR BUFFER (Locally)
    // Faster and safer than fetching from api.qrserver.com
    const qrBuffer = await QRCode.toBuffer(uuid, {
      width: 475,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#00000000' // Transparent background
      }
    });

    // 3. GENERATE TEXT SVG
    const width = 582;
    const height = 1024;
    
    // Sanitize text to prevent SVG breaking
    const safeName = name.replace(/[<>&]/g, '');

    const textSvg = `
      <svg width="${width}" height="${height}">
        <style>
          .title { fill: black; font-size: 44px; font-family: 'Inter', sans-serif; font-weight: bold; }
          .subtext { fill: black; font-size: 22px; font-family: 'Inter', sans-serif; font-weight: 100; }
        </style>
        
        <text x="291" y="212" text-anchor="middle" class="title">${safeName}</text>
        
        <text x="127" y="904" class="subtext">SCAN THIS QR CODE AT ENTRY</text>
      </svg>
    `;

    // 4. COMPOSITE WITH SHARP
    await sharp(baseImagePath)
      .resize(width, height)
      .composite([
        { input: qrBuffer, top: 361, left: 53 }, // Adjust these coordinates if your QR size changed
        { input: Buffer.from(textSvg), top: 0, left: 0 }
      ])
      .toFile(outputPath);

    // 5. SET SELF-DESTRUCT TIMER (5 Minutes)
    setTimeout(() => {
      fs.unlink(outputPath, (err) => {
        if (err) console.error(`Failed to delete QR ${fileName}:`, err);
        else console.log(`Auto-deleted QR ${fileName}`);
      });
    }, 5 * 60 * 1000); // 5 minutes in milliseconds

    // 6. RETURN PUBLIC URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return `${baseUrl}/api/qrcodes/${fileName}`;

  } catch (error) {
    console.error("Error generating composite QR:", error);
    throw new Error("Failed to generate QR Card");
  }
}