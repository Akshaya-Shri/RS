import { NextResponse } from 'next/server';

// WhatsApp notification function
// This uses environment variables for API configuration
// Supports multiple providers: Twilio, Infobip, Waxia, etc.

async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  try {
    const provider = process.env.WHATSAPP_PROVIDER || 'twilio';

    if (provider === 'twilio') {
      return await sendTwilioMessage(phoneNumber, message);
    } else if (provider === 'infobip') {
      return await sendInfobipMessage(phoneNumber, message);
    } else if (provider === 'meta') {
      return await sendMetaWhatsAppMessage(phoneNumber, message);
    } else {
      console.warn('No valid WhatsApp provider configured');
      return { success: false, message: 'WhatsApp provider not configured' };
    }
  } catch (error) {
    console.error('WhatsApp notification error:', error);
    return { success: false, message: 'Failed to send WhatsApp message' };
  }
}

// Twilio WhatsApp implementation
async function sendTwilioMessage(phoneNumber: string, message: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('Twilio credentials not configured');
    return { success: false, message: 'Twilio not configured' };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: `whatsapp:+91${phoneNumber}`,
        Body: message,
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Twilio API error: ${response.statusText}`);
    }

    return { success: true, message: 'WhatsApp message sent' };
  } catch (error) {
    console.error('Twilio error:', error);
    return { success: false, message: 'Failed to send via Twilio' };
  }
}

// Infobip WhatsApp implementation
async function sendInfobipMessage(phoneNumber: string, message: string) {
  const apiKey = process.env.INFOBIP_API_KEY;
  const sender = process.env.INFOBIP_SENDER || 'Revathi';

  if (!apiKey) {
    console.warn('Infobip API key not configured');
    return { success: false, message: 'Infobip not configured' };
  }

  try {
    const response = await fetch('https://api.infobip.com/whatsapp/1/message/template', {
      method: 'POST',
      headers: {
        'Authorization': `App ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            from: sender,
            to: `91${phoneNumber}`,
            content: {
              body: {
                text: message,
              },
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Infobip API error: ${response.statusText}`);
    }

    return { success: true, message: 'WhatsApp message sent' };
  } catch (error) {
    console.error('Infobip error:', error);
    return { success: false, message: 'Failed to send via Infobip' };
  }
}

// Meta WhatsApp Business API implementation
async function sendMetaWhatsAppMessage(phoneNumber: string, message: string) {
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN;
  const apiVersion = process.env.META_WHATSAPP_API_VERSION || 'v17.0';

  if (!phoneNumberId || !accessToken) {
    console.warn('Meta WhatsApp credentials not configured');
    return { success: false, message: 'Meta WhatsApp not configured' };
  }

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: `91${phoneNumber}`,
        type: 'text',
        text: {
          body: message,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Meta WhatsApp API error: ${response.statusText} ${errorText}`);
    }

    return { success: true, message: 'WhatsApp message sent via Meta Business API' };
  } catch (error) {
    console.error('Meta WhatsApp error:', error);
    return { success: false, message: 'Failed to send via Meta WhatsApp Business API' };
  }
}

// API Route Handler
export async function POST(req: Request) {
  try {
    const { phoneNumber, messageType, orderData } = await req.json();

    if (!phoneNumber || !messageType) {
      return NextResponse.json(
        { success: false, message: 'Missing phone number or message type' },
        { status: 400 }
      );
    }

    let message = '';

    if (messageType === 'order_placed') {
      const { orderId, totalAmount, items } = orderData;
      message = `🎉 Order Confirmed!\n\nOrder ID: #ORD-${String(orderId).padStart(4, '0')}\nAmount: ₹${totalAmount}\nItems: ${items.length}\n\nWe will verify your payment and update you shortly. Thank you for ordering from Revathi!`;
    } else if (messageType === 'status_update') {
      const { orderId, status, statusDisplay } = orderData;
      const statusEmojis: Record<string, string> = {
        pending: '⏳',
        confirmed: '✅',
        shipped: '📦',
        delivered: '🎁',
        cancelled: '❌',
      };
      message = `${statusEmojis[status] || '📌'} Order Update\n\nOrder ID: #ORD-${String(orderId).padStart(4, '0')}\nStatus: ${statusDisplay}\n\nThank you for your patience!`;
    }

    if (!message) {
      return NextResponse.json(
        { success: false, message: 'Invalid message type' },
        { status: 400 }
      );
    }

    const result = await sendWhatsAppMessage(phoneNumber, message);
    return NextResponse.json(result);
  } catch (error) {
    console.error('WhatsApp API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process WhatsApp notification' },
      { status: 500 }
    );
  }
}
