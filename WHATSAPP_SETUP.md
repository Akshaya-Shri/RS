# WhatsApp Notifications Setup Guide

## Overview
Your store now automatically sends WhatsApp notifications when:
1. **Order is Placed** - Customer gets order confirmation with Order ID and total amount
2. **Order Status Updates** - Customer gets notified when order is verified, shipped, or delivered

## How It Works
- Customer's phone number is captured during checkout
- API automatically sends WhatsApp messages instead of relying on Order ID memory
- No customer account needed - just their phone number!

## Setup Instructions

### Choose Your WhatsApp Provider

#### Option 1: Twilio (Recommended for Beginners)

1. **Sign up at [Twilio](https://www.twilio.com/)**
   - Create a free account or select a paid plan
   - Verify your personal phone number

2. **Enable WhatsApp Sandbox**
   - Go to: Messaging → WhatsApp → Sandbox
   - Join the sandbox by sending the code to the sandbox number
   - Note your sandbox number (format: `whatsapp:+1...`)

3. **Get Your Credentials**
   - Account SID: [Twilio Console](https://console.twilio.com)
   - Auth Token: [Twilio Console](https://console.twilio.com)
   - WhatsApp Number: From Sandbox settings

4. **Add to .env.local:**
```env
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

#### Option 2: Infobip (For Production)

1. **Sign up at [Infobip](https://www.infobip.com/)**
   - Create account
   - Access WhatsApp channel

2. **Get Your API Key**
   - From Dashboard → API
   - Create new API key

3. **Add to .env.local:**
```env
WHATSAPP_PROVIDER=infobip
INFOBIP_API_KEY=your_api_key_here
INFOBIP_SENDER=YourBusinessName
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

#### Option 3: Meta WhatsApp Business API (Recommended for true WhatsApp Business)

1. **Set up a WhatsApp Business Account**
   - Create a Meta Business Manager account
   - Add a WhatsApp Business phone number or use a number from your business account
   - Get the Phone Number ID and access token from the Meta for Developers dashboard

2. **Add to .env.local:**
```env
WHATSAPP_PROVIDER=meta
META_WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
META_WHATSAPP_ACCESS_TOKEN=your_long_lived_access_token
META_WHATSAPP_API_VERSION=v17.0
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

> With Meta WhatsApp Business API, you can send official transactional updates using your verified business number.


#### Option 3: Other Providers (WhatsApp Business API, Waxia, etc.)
You can extend the code in `/api/notify/whatsapp/route.ts` to support other providers.

## Environment Variables

Required in `.env.local`:

```env
# Choose provider: twilio, infobip, or meta
WHATSAPP_PROVIDER=twilio

# Twilio Config (if using Twilio)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=

# Infobip Config (if using Infobip)
INFOBIP_API_KEY=
INFOBIP_SENDER=

# Meta WhatsApp Business API Config (if using meta)
META_WHATSAPP_PHONE_NUMBER_ID=
META_WHATSAPP_ACCESS_TOKEN=
META_WHATSAPP_API_VERSION=v17.0

# Base URL (for notifications to work in production)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Testing

### Test Order Notification
1. Go to checkout page
2. Fill in form with your phone number (format: 10 digits without +91)
3. Complete the order
4. Should receive WhatsApp message with order confirmation

### Test Status Update Notification
1. Go to Admin → Orders
2. Select an order
3. Change status (e.g., pending → verified)
4. Customer should receive WhatsApp update

## Message Templates

### Order Confirmation
```
🎉 Order Confirmed!

Order ID: #ORD-0001
Amount: ₹500
Items: 2

We will verify your payment and update you shortly. Thank you for ordering from Revathi!
```

### Status Updates
```
✅ Order Update

Order ID: #ORD-0001
Status: Payment Verified ✓

Thank you for your patience!
```

**Other statuses:**
- ⏳ Payment Pending
- 📦 Shipped
- 🎁 Delivered
- ❌ Cancelled

## FAQ

**Q: Will it work without setting up environment variables?**
A: Messages won't send, but the app will still work. The order placement won't be affected.

**Q: Can I add custom messages?**
A: Yes! Edit `/src/app/api/notify/whatsapp/route.ts` to customize message templates.

**Q: What if the customer's phone number is wrong?**
A: The message will fail silently and won't break the order. Check the server logs.

**Q: How much does it cost?**
A: Depends on your provider:
- **Twilio**: ~1-3 INR per message (after free trial)
- **Infobip**: Custom pricing based on volume

**Q: Can I test with Twilio for free?**
A: Yes! Twilio Sandbox allows unlimited messages to verified numbers.

## File References

- **WhatsApp API:** [src/app/api/notify/whatsapp/route.ts](src/app/api/notify/whatsapp/route.ts)
- **Order Creation:** [src/app/api/orders/route.ts](src/app/api/orders/route.ts) (lines showing notification call)
- **Order Status Update:** [src/app/api/admin/orders/route.ts](src/app/api/admin/orders/route.ts) (lines showing notification call)

## Next Steps

1. Choose a provider (Twilio recommended for testing)
2. Set up credentials in `.env.local`
3. Restart dev server: `npm run dev`
4. Test order placement → Should receive WhatsApp!
