import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER; 

const client = twilio(accountSid, authToken);


export async function sendWelcomeMessage(name: string, mobile: string, qrUuid: string, balance: number) {
    try {
        await client.messages.create({
            from: whatsappNumber,
            to: `whatsapp:+91${mobile}`,
            
            // Use your Content SID
            contentSid: 'HXb730819516e4b0a1eb7f55befb2749fd', 
            contentVariables: JSON.stringify({
                '1': name,           
                '2': String(balance) ,
                '3': qrUuid
            })
            
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
            contentSid: 'HXa802ec0cdda9f2357ab603eacc9a8d02', 
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

export async function resendQRCodeMessage(name: string, mobile: string, qrUuid: string) {
    try {
        const dynamicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrUuid}`;

        await client.messages.create({
            from: whatsappNumber,
            to: `whatsapp:+91${mobile}`,
            
            contentSid: 'HX4af174c452bf514bc93411a5c124d652', 
            
           
            contentVariables: JSON.stringify({
                '1': name,
                '2': dynamicQrUrl
            })
        });

        console.log(`Resend QR WhatsApp sent to ${mobile}`);
        return { success: true };

    } catch (error) {
        console.error("Failed to resend QR WhatsApp:", error);
        return { success: false, error };
    }
}

export async function sendBirthdayMessage(name: string, mobile: string) {
    try {

        await client.messages.create({
            from: whatsappNumber,
            to: `whatsapp:+91${mobile}`,
            contentSid: 'HX2a8c033c8d7254271c8fc47237d9b34d',
            contentVariables: JSON.stringify({
                '1': name
            })
        });
        console.log(`Birthday WhatsApp sent to ${mobile}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to send Birthday WhatsApp:", error);
        return { success: false, error };
    }
}