"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/cart/CartProvider';

export default function CartPage() {
  const { cartItems, updateQuantity, removeItem, subtotal, shipping, total } = useCart();

  Math.max(1, 0);

  return (
    <main className="flex-1 bg-surface py-12 md:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center gap-4 mb-10 border-b border-neutral-200 pb-6">
           <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">Shopping Cart</h1>
           <span className="bg-primary/10 text-primary py-1.5 px-4 rounded-full font-bold text-sm shrink-0">
             {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}
           </span>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl shadow-sm border border-neutral-100 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-neutral-50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Your cart is empty</h2>
            <p className="text-neutral-500 mb-8 max-w-sm">Looks like you haven't added any pure cold-pressed oils to your cart yet.</p>
            <Link href="/products" className="px-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
             {/* Cart Items */}
             <div className="lg:col-span-2 space-y-6">
                {cartItems.map((item) => (
                   <div key={item.id} className="bg-white p-5 rounded-3xl shadow-sm border border-neutral-100 flex flex-col sm:flex-row items-center gap-6 group hover:shadow-md transition-shadow">
                      <Link href="/products" className="w-28 h-28 bg-neutral-50 rounded-2xl flex items-center justify-center shrink-0 relative overflow-hidden border-4 border-white shadow-sm">
                         <Image src={item.image} alt={item.name} fill className="object-cover p-2" />
                      </Link>
                      <div className="flex-1 text-center sm:text-left w-full">
                         <Link href="/products">
                           <h3 className="text-lg font-bold text-foreground mb-1 hover:text-primary transition-colors">{item.name}</h3>
                         </Link>
                         <p className="text-neutral-500 font-inter text-sm mb-3 bg-neutral-50 inline-block px-3 py-1 rounded-md">Size: {item.size}</p>
                         <p className="text-secondary font-bold text-lg">₹{item.price}</p>
                      </div>
                      
                      <div className="flex items-center gap-4 border-t sm:border-t-0 border-neutral-100 w-full sm:w-auto pt-4 sm:pt-0 justify-center">
                         <div className="flex items-center border border-neutral-200 bg-neutral-50 rounded-lg overflow-hidden h-12">
                            <button onClick={() => updateQuantity(item.id, -1)} className="px-4 text-neutral-500 hover:bg-white hover:text-primary transition-colors h-full flex items-center justify-center font-bold text-lg">-</button>
                            <div className="w-10 text-center font-bold bg-white h-full flex items-center justify-center">{item.qty}</div>
                            <button onClick={() => updateQuantity(item.id, 1)} className="px-4 text-neutral-500 hover:bg-white hover:text-primary transition-colors h-full flex items-center justify-center font-bold text-lg">+</button>
                         </div>
                         <button onClick={() => removeItem(item.id)} className="p-3 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0" title="Remove Item">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                         </button>
                      </div>
                   </div>
                ))}
             </div>
  
             {/* Order Summary */}
             <div className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100 h-fit sticky top-28">
                <h2 className="text-xl font-bold text-foreground mb-6 pb-4 border-b border-neutral-100">Order Summary</h2>
                
                <div className="space-y-4 font-inter text-neutral-600 mb-6">
                   <div className="flex justify-between items-center">
                      <span>Subtotal</span>
                      <span className="font-medium text-foreground">₹{subtotal.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span>Shipping</span>
                      <span className="font-medium text-foreground">₹{shipping.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span>Tax (GST Included)</span>
                      <span className="font-medium text-foreground text-green-600">₹0.00</span>
                   </div>
                </div>
  
                <div className="flex justify-between items-center py-5 border-t border-dashed border-neutral-200 mb-8 bg-neutral-50/50 -mx-8 px-8 border-b">
                   <span className="font-bold text-foreground">Total</span>
                   <span className="text-3xl font-extrabold text-primary">₹{total.toFixed(2)}</span>
                </div>
  
                <Link href="/checkout" className="flex items-center justify-center gap-2 w-full py-4 bg-primary text-white text-center font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/30 active:scale-95 duration-150 relative overflow-hidden group">
                   Proceed to Checkout
                   <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                   </svg>
                </Link>

                <div className="mt-6 text-center">
                   <Link href="/products" className="text-primary hover:text-primary-light font-bold text-sm tracking-wide flex items-center justify-center gap-1 transition-colors">
                      <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      Continue Shopping
                   </Link>
                </div>
             </div>
          </div>
        )}

      </div>
    </main>
  );
}
