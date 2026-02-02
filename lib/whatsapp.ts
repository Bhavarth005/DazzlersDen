import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER; 

const client = twilio(accountSid, authToken);


export async function sendWelcomeMessage(
    name: string, 
    mobile: string, 
    qrImageUrl: string, // Changed from uuid to full URL
    balance: number
) {
    try {
        await client.messages.create({
            from: whatsappNumber,
            to: `whatsapp:+91${mobile}`,
            contentSid: 'HX6f2e04123252d7c4bc835cb5d7ceaefb', 
            contentVariables: JSON.stringify({
                '1': name,           
                '2': String(balance),
                '3': qrImageUrl // Pass the .png URL here
            })
        });
        console.log(`Welcome WhatsApp sent to ${mobile}`);
    } catch (error) {
        console.error("Failed to send Welcome WhatsApp:", error);
    }
}
export async function sendSessionStartMessage(name: string, mobile: string, cost: number, guests: string) {
    try {
        await client.messages.create({
            from: whatsappNumber,
            to: `whatsapp:+91${mobile}`,
            contentSid: 'HX5389ab32294c14bcd785672486191863',
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
            contentSid: 'HXfa86646ed9007394aa6f6529d4e11273', 
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
            contentSid: 'HX276d81aed9bb57518ff25b6952aa3a90', 
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
      contentSid: 'HXb2bcb6e892701d8261eb704afaa84bcb', 
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

export async function resendQRCodeMessage(
    name: string, 
    mobile: string, 
    qrImageUrl: string // Changed from uuid to full URL
) {
    try {
        await client.messages.create({
            from: whatsappNumber,
            to: `whatsapp:+91${mobile}`,
            contentSid: 'HX474a617cc9f180b20bc0c22026d0a60e', 
            contentVariables: JSON.stringify({
                '1': name,
                '2': qrImageUrl // Pass the .png URL here
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
            contentSid: 'HX3739fd0166cdb78c029dbe8375eed9a2',
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