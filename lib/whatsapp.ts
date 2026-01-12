import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER; 

const client = twilio(accountSid, authToken);


export async function sendWelcomeMessage(name: string, mobile: string, qrUuid: string, balance: number) {
    try {
        // 1. Generate the Dynamic Link
        const dynamicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrUuid}`;

        await client.messages.create({
            from: whatsappNumber,
            to: `whatsapp:+91${mobile}`,
            
            // 2. Use the Template ID (Get this from Twilio Console after approval)
            contentSid: 'HX698ca8d131db92f57bee8e902bf43d04', 
            
            // 3. Map the Variables
            contentVariables: JSON.stringify({
                '1': name,          // Replaces {{1}} in the body
                '2': String(balance) // Replaces {{2}} in the body
                // Note: For Media Headers, Twilio often handles the media mapping differently 
                // depending on if you use the "Content API" or standard.
                // If using the standard content API, you might need to pass the media separately
                // or ensure your template configuration allows dynamic media.
            }),
             
            // IMPORTANT: For Media Templates, you often pass the media as a separate parameter
            // or inside the content variables depending on your specific Twilio setup version.
            // A common pattern for Media templates is:
            mediaUrl: [dynamicQrUrl] 
        });

        console.log(`Welcome WhatsApp template sent to ${mobile}`);

    } catch (error) {
        console.error("Failed to send Welcome WhatsApp:", error);
    }
}
export async function sendSessionStartMessage(name: string, mobile: string, cost: number, guests: string) {
    try {
        await client.messages.create({
            from: whatsappNumber,
            to: `whatsapp:+91${mobile}`,
            // Removed "Remaining Balance" line below
            body: `*Session Started!* 🎢\n\nHi ${name}, enjoy your time at Dazzler's Den!\n\n👥 *Guests:* ${guests}\n *Balance Deducted:* Rs. ${cost}`
        });
    } catch (error) {
        console.error("Failed to send Start WhatsApp:", error);
    }
}

export async function sendSessionExitMessage(name: string, mobile: string, balance: number) {
    try {
        await client.messages.create({
            from: whatsappNumber,
            to: `whatsapp:+91${mobile}`,
            body: `*Session Ended!*\n\nHello ${name},\n*Final Balance:* Rs. ${balance}\n\nThanks for visiting Dazzler's Den! 👋`
        });
        console.log(`Exit WhatsApp sent to ${name}`);
    } catch (error) {
        console.error("Failed to send Exit WhatsApp:", error);
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



export async function sendBroadcastMessage(mobileNumber: string, messageBody: string) {
  try {
    const formattedNumber = mobileNumber.startsWith('+91') 
      ? mobileNumber 
      : `+91${mobileNumber}`;

    await client.messages.create({
      from: whatsappNumber,
      to: `whatsapp:${formattedNumber}`,
      body: messageBody
    });
    
    return { success: true };
  } catch (error) {
    console.error(`Failed to send to ${mobileNumber}:`, error);
    return { success: false, error };
  }
}