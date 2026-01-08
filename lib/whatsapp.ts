import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER; 

const client = twilio(accountSid, authToken);


export async function sendWelcomeMessage(name: string, mobile: string, qrUuid: string, balance: number) {
    try {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrUuid}`;
        
        await client.messages.create({
            from: whatsappNumber,
            to: `whatsapp:+91${mobile}`, // Assuming India (+91)
            body: `*Welcome to Dazzler's Den, ${name}!* 🌟\n\nYour account has been created.\n💰 *Current Balance:* Rs. ${balance}\n\nScan the QR code above at the entry gate to start your session!`,
            mediaUrl: [qrUrl] // This sends the image!
        });
        console.log(`Welcome WhatsApp sent to ${mobile}`);
    } catch (error) {
        console.error("Failed to send Welcome WhatsApp:", error);
        // Don't crash the app if WhatsApp fails
    }
}

export async function sendSessionStartMessage(name: string, mobile: string, cost: number, balance: number, guests: string) {
    try {
        await client.messages.create({
            from: whatsappNumber,
            to: `whatsapp:+91${mobile}`,
            body: `*Session Started!* 🎢\n\nHi ${name}, enjoy your time at Dazzler's Den!\n\n👥 *Guests:* ${guests}\n💸 *Deducted:* Rs. ${cost}\n💰 *Remaining Balance:* Rs. ${balance}`
        });
    } catch (error) {
        console.error("Failed to send Start WhatsApp:", error);
    }
}

export async function sendSessionEndMessage(name: string, mobile: string, duration: number) {
    try {
        await client.messages.create({
            from: whatsappNumber,
            to: `whatsapp:+91${mobile}`,
            body: `*Session Completed* ✅\n\nHope you had a great time, ${name}!\nYour session of ${duration} hours has ended.\n\nSee you next time! 👋`
        });
    } catch (error) {
        console.error("Failed to send End WhatsApp:", error);
    }
}

export async function sendRechargeMessage(name: string, mobile: string, amount: number, bonus: number, newBalance: number) {
    try {
        let messageBody = `*Recharge Successful!* 💰\n\nHi ${name}, your wallet has been recharged with Rs. ${amount}.`;
        
        if (bonus > 0) {
            messageBody += `\n🎉 *Bonus Added:* Rs. ${bonus}`;
        }
        
        messageBody += `\n\n💰 *Current Balance:* Rs. ${newBalance}\nThank you for choosing Dazzler's Den!`;

        await client.messages.create({
            from: whatsappNumber,
            to: `whatsapp:+91${mobile}`,
            body: messageBody
        });
        console.log(`Recharge WhatsApp sent to ${mobile}`);
    } catch (error) {
        console.error("Failed to send Recharge WhatsApp:", error);
    }
}