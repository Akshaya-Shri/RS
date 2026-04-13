import { NextResponse } from 'next/server';

async function sendSms(phoneNumber: string, message: string) {
  const provider = process.env.SMS_PROVIDER || 'fast2sms';

  if (provider === 'fast2sms') {
    return await sendFast2SMS(phoneNumber, message);
  } else if (provider === 'msg91') {
    return await sendMsg91(phoneNumber, message);
  }

  console.warn('No valid SMS provider configured');
  return { success: false, message: 'SMS provider not configured' };
}

async function sendFast2SMS(phoneNumber: string, message: string) {
  const apiKey = process.env.SMS_API_KEY;
  const sender = process.env.SMS_SENDER_ID || 'FSTSMS';

  if (!apiKey) {
    console.warn('Fast2SMS API key not configured');
    return { success: false, message: 'Fast2SMS not configured' };
  }

  const url = 'https://www.fast2sms.com/dev/bulkV2';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        route: 'v3',
        sender_id: sender,
        message: message,
        language: 'english',
        numbers: `91${phoneNumber}`
      })
    });

    const result = await response.json();

    if (!response.ok || result.return !== true) {
      console.error('Fast2SMS error:', result);
      return { success: false, message: 'Failed to send SMS via Fast2SMS' };
    }

    return { success: true, message: 'SMS sent via Fast2SMS' };
  } catch (error) {
    console.error('Fast2SMS error:', error);
    return { success: false, message: 'Failed to send SMS via Fast2SMS' };
  }
}

async function sendMsg91(phoneNumber: string, message: string) {
  const apiKey = process.env.SMS_API_KEY;
  const sender = process.env.SMS_SENDER_ID || 'MSGIND';

  if (!apiKey) {
    console.warn('MSG91 API key not configured');
    return { success: false, message: 'MSG91 not configured' };
  }

  const url = `https://api.msg91.com/api/sendhttp.php?authkey=${encodeURIComponent(apiKey)}&mobiles=91${phoneNumber}&message=${encodeURIComponent(message)}&sender=${encodeURIComponent(sender)}&route=4&country=91`;

  try {
    const response = await fetch(url, { method: 'GET' });
    const text = await response.text();

    if (!response.ok || text.includes('error')) {
      console.error('MSG91 error:', text);
      return { success: false, message: 'Failed to send SMS via MSG91' };
    }

    return { success: true, message: 'SMS sent via MSG91' };
  } catch (error) {
    console.error('MSG91 error:', error);
    return { success: false, message: 'Failed to send SMS via MSG91' };
  }
}

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
      message = `Order Confirmed!\nOrder ID: #ORD-${String(orderId).padStart(4, '0')}\nAmount: ₹${totalAmount}\nItems: ${items.length}\nWe will verify your payment and update you shortly. Thank you for ordering from Revathi!`;
    } else if (messageType === 'status_update') {
      const { orderId, statusDisplay } = orderData;
      message = `Order Update!\nOrder ID: #ORD-${String(orderId).padStart(4, '0')}\nStatus: ${statusDisplay}\nThank you for your patience.`;
    }

    if (!message) {
      return NextResponse.json(
        { success: false, message: 'Invalid message type' },
        { status: 400 }
      );
    }

    const result = await sendSms(phoneNumber, message);
    return NextResponse.json(result);
  } catch (error) {
    console.error('SMS API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process SMS notification' },
      { status: 500 }
    );
  }
}
