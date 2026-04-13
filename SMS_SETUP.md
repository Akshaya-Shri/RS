# SMS Notifications Setup Guide

## Overview
Your store now supports SMS notifications for:
1. **Order Placement** - Customer receives order confirmation with Order ID and total amount
2. **Order Status Updates** - Customer receives updates when their order status changes

## How It Works
- Customer phone number is captured during checkout
- When `SMS_PROVIDER` is configured, the app sends SMS notifications instead of WhatsApp
- No customer account is required — only their phone number

## Setup Instructions

### Choose Your SMS Provider

#### Option 1: Fast2SMS (Recommended)
1. Create an account at [Fast2SMS](https://www.fast2sms.com/)
2. Complete KYC if required
3. Add wallet balance (₹500–₹1000 is enough to start)
4. Copy your API key from the dashboard

#### Option 2: MSG91
1. Create an account at [MSG91](https://www.msg91.com/)
2. Complete KYC if required
3. Add wallet balance
4. Copy your API key and sender ID from the dashboard

## Environment Variables

Add the following to `.env.local`:

```env
SMS_PROVIDER=fast2sms
SMS_API_KEY=your_api_key_here
SMS_SENDER_ID=YOURID
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

If you use MSG91 instead, set:

```env
SMS_PROVIDER=msg91
SMS_API_KEY=your_api_key_here
SMS_SENDER_ID=YOURID
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Notes

- `SMS_PROVIDER` chooses the SMS provider for order notifications.
- When `SMS_PROVIDER` is configured, notifications go through `/api/notify/sms`.
- `SMS_SENDER_ID` is optional for Fast2SMS; MSG91 generally requires a valid sender ID.

## Testing

### Test Order Notification
1. Place a new order through checkout
2. Confirm the form uses a valid phone number
3. Check server logs for SMS send status
4. Verify the customer receives the SMS

### Test Status Update Notification
1. Go to Admin → Orders
2. Update an order status
3. Verify the customer receives an SMS status update

## Message Templates

### Order Confirmation SMS
```
Order Confirmed!
Order ID: #ORD-0001
Amount: ₹500
Items: 2
We will verify your payment and update you shortly. Thank you for ordering from Revathi!
```

### Status Update SMS
```
Order Update!
Order ID: #ORD-0001
Status: Payment Verified ✓
Thank you for your patience.
```

## File References

- **SMS API:** [src/app/api/notify/sms/route.ts](src/app/api/notify/sms/route.ts)
- **Order Creation:** [src/app/api/orders/route.ts](src/app/api/orders/route.ts)
- **Admin Status Updates:** [src/app/api/admin/orders/route.ts](src/app/api/admin/orders/route.ts)

## Next Steps

1. Add SMS credentials to `.env.local`
2. Restart the server with `npm run dev`
3. Place a test order and verify SMS delivery
