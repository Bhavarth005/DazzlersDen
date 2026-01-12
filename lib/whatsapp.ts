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
                '1': name,          
                '2': String(balance) 
            }),
             
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
            contentSid: 'HX823dbfb4506389f053925e1fdca274fa',
            contentVariables: JSON.stringify({
                '1': name,
                '2': guests,
                '3': String(cost)
            })
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
            contentSid: 'HXfd7880b0e7f1ef2e1856c96fb0047941', 
            contentVariables: JSON.stringify({
                '1': name,
                '2': String(balance)
            })
        });
        console.log(`Exit WhatsApp sent to ${name}`);
    } catch (error) {
        console.error("Failed to send Exit WhatsApp:", error);
    }
}

export async function sendRechargeMessage(name: string, mobile: string, amount: number, bonus: number, newBalance: number) {
    try {
        await client.messages.create({
            from: whatsappNumber,
            to: `whatsapp:+91${mobile}`,
            contentSid: 'HX894045f3714508fe42f560aeca394ae9', 
            contentVariables: JSON.stringify({
                '1': name,
                '2': String(amount),
                // LOGIC: If bonus is valid, show it. Otherwise show "0".
                '3': (bonus && bonus > 0) ? String(bonus) : "0", 
                '4': String(newBalance)
            })
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
      contentSid: 'HX4421a8a96b6ad4f197222b3657281628', 
      contentVariables: JSON.stringify({
        '1': messageBody 
      })
    });
    
    return { success: true };
  } catch (error) {
    console.error(`Failed to send to ${mobileNumber}:`, error);
    return { success: false, error };
  }
}