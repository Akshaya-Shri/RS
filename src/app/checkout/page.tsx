"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function CheckoutPage() {
  const [paymentStep, setPaymentStep] = useState(false);
  const [file, setFile] = useState<File | null>(null);

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
                     <input type="text" className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" required />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-foreground mb-2">Phone Number</label>
                     <input type="tel" className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" required />
                   </div>
                </div>
                
                <div>
                   <label className="block text-sm font-bold text-foreground mb-2">Complete Address</label>
                   <textarea rows={3} className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" required></textarea>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                   <div>
                     <label className="block text-sm font-bold text-foreground mb-2">City</label>
                     <input type="text" className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" required />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-foreground mb-2">State</label>
                     <input type="text" className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" defaultValue="Tamil Nadu" required />
                   </div>
                   <div className="col-span-2 md:col-span-1">
                     <label className="block text-sm font-bold text-foreground mb-2">PIN Code</label>
                     <input type="text" className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" required />
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
                <p className="text-neutral-600 font-inter">Total Amount to Pay: <strong className="text-secondary text-xl">₹620.00</strong></p>
             </div>

             <div className="flex flex-col md:flex-row gap-12 items-center justify-center mb-12">
                {/* QR Code Placeholder (Animated Frame) */}
                <div className="relative p-4 bg-white rounded-2xl shadow-xl border border-neutral-100 w-64 h-64 flex flex-col items-center justify-center">
                   <div className="absolute inset-0 border-2 border-dashed border-primary/50 rounded-2xl opacity-50 pulse-border"></div>
                   
                   {/* Fake QR using SVG pattern */}
                   <svg width="180" height="180" xmlns="http://www.w3.org/2000/svg" className="opacity-90">
                      <rect width="180" height="180" fill="#f8fafc" />
                      {/* Top Left Corner */}
                      <rect x="10" y="10" width="40" height="40" fill="none" stroke="#171717" strokeWidth="8" />
                      <rect x="25" y="25" width="10" height="10" fill="#171717" />
                      {/* Top Right Corner */}
                      <rect x="130" y="10" width="40" height="40" fill="none" stroke="#171717" strokeWidth="8" />
                      <rect x="145" y="25" width="10" height="10" fill="#171717" />
                      {/* Bottom Left Corner */}
                      <rect x="10" y="130" width="40" height="40" fill="none" stroke="#171717" strokeWidth="8" />
                      <rect x="25" y="145" width="10" height="10" fill="#171717" />
                      
                      {/* Random Data Pattern */}
                      <circle cx="90" cy="90" r="30" fill="#171717" opacity="0.1" />
                      {Array.from({length: 40}).map((_, i) => (
                         <rect key={i} x={10 + (i%8)*20} y={60 + Math.floor(i/8)*20} width="10" height="10" fill="#171717" opacity={Math.random() > 0.5 ? 1 : 0} />
                      ))}
                      
                      {/* Center Logo Area */}
                      <circle cx="90" cy="90" r="15" fill="white" />
                      <path d="M90 80 Q80 95 80 100 A10 10 0 0 0 100 100 Q100 95 90 80 Z" fill="#1B5E20" />
                   </svg>
                   <p className="mt-4 text-xs font-bold text-neutral-500 uppercase tracking-widest text-center">GPay • PhonePe<br/>Paytm</p>
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
                         <li>Pay the exact amount of <strong>₹620.00</strong>.</li>
                         <li>Take a screenshot of the successful payment.</li>
                         <li>Enter the UPI Transaction ID below and upload the screenshot.</li>
                      </ol>
                   </div>

                   <div>
                     <label className="block text-sm font-bold text-foreground mb-2">UPI Transaction ID (12 Digits)</label>
                     <input type="text" className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="e.g. 301234567890" required />
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
                <button type="button" onClick={() => alert("Order Placed Successfully! We will verify the payment and confirm shortly.")} className="px-8 py-4 bg-secondary text-white font-bold rounded-xl hover:bg-secondary/90 transition-all shadow-lg hover:shadow-secondary/30 glow-effect active:scale-95">
                   Confirm Order
                </button>
             </div>
          </div>
        )}
      </div>
    </main>
  );
}
