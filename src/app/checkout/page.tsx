"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart, CartItem } from '@/components/cart/CartProvider';

export default function CheckoutPage() {
  const [paymentStep, setPaymentStep] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: '',
    transactionId: ''
  });
  const { total, cartItems, clearCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleOrderSubmit = async () => {
    if (!file || !formData.transactionId) {
      alert('Please upload payment screenshot and enter transaction ID');
      return;
    }

    setLoading(true);

    try {
      // First upload the payment image
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('isPayment', 'true');

      const uploadRes = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formDataUpload
      });

      const uploadJson = await uploadRes.json();
      if (!uploadJson.success) {
        throw new Error('Failed to upload payment proof');
      }

      // Prepare order data
      const orderData = {
        customer_name: formData.name,
        customer_phone: formData.phone,
        customer_email: formData.email || null,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        transaction_id: formData.transactionId,
        payment_img_url: uploadJson.url,
        total_amount: total,
        items: cartItems.map((item: CartItem) => ({
          product_id: item.product_id || 1, // Default to first product if not set
          size: item.size,
          quantity: item.qty,
          price: item.price
        }))
      };

      // Create order
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const orderJson = await orderRes.json();
      if (!orderJson.success) {
        throw new Error(orderJson.message || 'Failed to create order');
      }

      // Clear cart and redirect
      clearCart();
      alert(`Order placed successfully! Order ID: #ORD-${orderJson.data.orderId.toString().padStart(4, '0')}\n\nWe will verify the payment and update the status soon.`);
      router.push('/');

    } catch (error) {
      console.error('Order submission error:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 bg-surface py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Progress Tracker */}
        <div className="flex items-center justify-center mb-12">
           <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${!paymentStep ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-primary text-white'}`}>1</div>
              <div className={`w-16 h-1 rounded-full ${paymentStep ? 'bg-primary' : 'bg-neutral-200'}`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${paymentStep ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-neutral-200 text-neutral-500'}`}>2</div>
           </div>
        </div>

        {!paymentStep ? (
          /* Step 1: Shipping Details */
          <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-neutral-100">
             <h2 className="text-2xl font-bold text-foreground mb-8">Shipping Address</h2>
             <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setPaymentStep(true); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label className="block text-sm font-bold text-foreground mb-2">Full Name</label>
                     <input
                       type="text"
                       name="name"
                       value={formData.name}
                       onChange={handleInputChange}
                       className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                       required
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-foreground mb-2">Phone Number</label>
                     <input
                       type="tel"
                       name="phone"
                       value={formData.phone}
                       onChange={handleInputChange}
                       className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                       required
                     />
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-bold text-foreground mb-2">Email (Optional)</label>
                   <input
                     type="email"
                     name="email"
                     value={formData.email}
                     onChange={handleInputChange}
                     className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                   />
                </div>

                <div>
                   <label className="block text-sm font-bold text-foreground mb-2">Complete Address</label>
                   <textarea
                     rows={3}
                     name="address"
                     value={formData.address}
                     onChange={handleInputChange}
                     className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                     required
                   ></textarea>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                   <div>
                     <label className="block text-sm font-bold text-foreground mb-2">City</label>
                     <input
                       type="text"
                       name="city"
                       value={formData.city}
                       onChange={handleInputChange}
                       className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                       required
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-foreground mb-2">State</label>
                     <input
                       type="text"
                       name="state"
                       value={formData.state}
                       onChange={handleInputChange}
                       className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                       required
                     />
                   </div>
                   <div className="col-span-2 md:col-span-1">
                     <label className="block text-sm font-bold text-foreground mb-2">PIN Code</label>
                     <input
                       type="text"
                       name="pincode"
                       value={formData.pincode}
                       onChange={handleInputChange}
                       className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                       required
                     />
                   </div>
                </div>

                <div className="pt-8 flex justify-between items-center border-t border-neutral-100 mt-8">
                   <Link href="/cart" className="text-primary font-bold hover:underline">Return to Cart</Link>
                   <button type="submit" className="px-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                      Continue to Payment
                   </button>
                </div>
             </form>
          </div>
        ) : (
          /* Step 2: Payment Details */
          <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-neutral-100">
             <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-primary mb-2">Scan & Pay</h2>
                <p className="text-neutral-600 font-inter">Total Amount to Pay: <strong className="text-secondary text-xl">₹{total.toFixed(2)}</strong></p>
             </div>

             <div className="flex flex-col md:flex-row gap-12 items-center justify-center mb-12">
                {/* QR Code Placeholder (Animated Frame) */}
                <div className="relative p-4 bg-white rounded-2xl shadow-xl border border-neutral-100 w-64 h-64 flex flex-col items-center justify-center">
                   <div className="absolute inset-0 border-2 border-dashed border-primary/50 rounded-2xl opacity-50 pulse-border"></div>
                   
                   {/* Real QR using uploaded QR */}
                   <div className="relative w-[180px] h-[180px] z-10 bg-white p-2 rounded-xl">
                      <Image src="/images/qr-payment.png" alt="Payment QR Code" fill className="object-contain" unoptimized />
                   </div>
                   <p className="mt-4 text-xs font-bold text-neutral-500 uppercase tracking-widest text-center z-10 relative">GPay • PhonePe<br/>Paytm</p>
                </div>

                <div className="flex-1 w-full space-y-6">
                   <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 mb-6">
                      <h3 className="font-bold text-primary mb-2 flex items-center gap-2">
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                         Payment Instructions
                      </h3>
                      <ol className="list-decimal list-inside text-sm text-neutral-700 space-y-2 font-inter">
                         <li>Scan the QR code using any UPI app.</li>
                         <li>Pay the exact amount of <strong>₹{total.toFixed(2)}</strong>.</li>
                         <li>Take a screenshot of the successful payment.</li>
                         <li>Enter the UPI Transaction ID below and upload the screenshot.</li>
                      </ol>
                   </div>

                   <div>
                     <label className="block text-sm font-bold text-foreground mb-2">UPI Transaction ID (12 Digits)</label>
                     <input
                       type="text"
                       name="transactionId"
                       value={formData.transactionId}
                       onChange={handleInputChange}
                       inputMode="numeric"
                       pattern="[0-9]*"
                       maxLength={12}
                       onInput={(e) => {
                         e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                       }}
                       className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                       placeholder="e.g. 301234567890"
                       required
                     />
                   </div>

                   <div>
                     <label className="block text-sm font-bold text-foreground mb-2">Upload Payment Screenshot</label>
                     <div className="relative border-2 border-dashed border-primary/30 rounded-xl p-6 text-center hover:bg-primary/5 transition-colors cursor-pointer">
                        <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
                        {file ? (
                           <div className="text-primary font-bold flex items-center justify-center gap-2">
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {file.name}
                           </div>
                        ) : (
                           <div className="text-neutral-500 font-inter">
                              <svg className="w-8 h-8 mx-auto mb-2 text-primary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                              Click to upload or drag and drop<br/>PNG, JPG up to 5MB
                           </div>
                        )}
                     </div>
                   </div>
                </div>
             </div>

             <div className="pt-8 flex justify-between items-center border-t border-neutral-100">
                <button type="button" onClick={() => setPaymentStep(false)} className="text-neutral-500 font-bold hover:text-primary transition-colors">Back</button>
                <button
                  type="button"
                  onClick={handleOrderSubmit}
                  disabled={loading}
                  className="px-8 py-4 bg-secondary text-white font-bold rounded-xl hover:bg-secondary/90 transition-all shadow-lg hover:shadow-secondary/30 glow-effect active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing Order...' : 'Confirm Order'}
                </button>
             </div>
          </div>
        )}
      </div>
    </main>
  );
}
