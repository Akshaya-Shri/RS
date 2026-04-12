import Link from 'next/link';

export const metadata = {
  title: 'Your Cart | Revathi Store',
};

export default function CartPage() {
  return (
    <main className="flex-1 bg-surface py-12 md:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center gap-4 mb-10">
           {/* Animated Cart Icon */}
           <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center p-3">
              <svg viewBox="0 0 100 100" className="w-full h-full text-primary">
                 <path d="M20 20 L30 20 L40 70 L80 70 L90 30 L35 30" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                 <circle cx="45" cy="85" r="7" fill="currentColor">
                    <animate attributeName="cy" values="85; 82; 85" dur="1s" repeatCount="indefinite" />
                 </circle>
                 <circle cx="75" cy="85" r="7" fill="currentColor">
                    <animate attributeName="cy" values="85; 82; 85" dur="1s" repeatCount="indefinite" begin="0.2s" />
                 </circle>
                 <path d="M40 50 L80 50" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="10 5">
                    <animate attributeName="stroke-dashoffset" values="0; 15" dur="1s" repeatCount="indefinite" />
                 </path>
              </svg>
           </div>
           <h1 className="text-3xl font-bold text-foreground">Shopping Cart</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           {/* Cart Items */}
           <div className="lg:col-span-2 space-y-6">
              {[1, 2].map((item) => (
                 <div key={item} className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 flex flex-col sm:flex-row items-center gap-6 group">
                    <div className="w-24 h-24 bg-neutral-50 rounded-2xl flex items-center justify-center shrink-0">
                       <svg viewBox="0 0 100 100" className="w-12 h-12 text-secondary group-hover:scale-110 transition-transform">
                          <path d="M30 50 Q30 30 50 20 Q70 30 70 50 Q70 65 60 75 Q50 85 40 75 Q30 65 30 50 Z" fill="currentColor" />
                       </svg>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                       <h3 className="text-lg font-bold text-foreground mb-1">Cold Pressed {item === 1 ? 'Groundnut' : 'Sesame'} Oil</h3>
                       <p className="text-neutral-500 font-inter text-sm mb-3">Size: 1L Bottle</p>
                       <p className="text-secondary font-bold text-lg">₹{item === 1 ? '220' : '350'}</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                       <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden h-10">
                          <button className="px-3 text-neutral-500 hover:bg-neutral-50 hover:text-primary transition-colors h-full">-</button>
                          <div className="w-10 text-center font-bold text-sm">1</div>
                          <button className="px-3 text-neutral-500 hover:bg-neutral-50 hover:text-primary transition-colors h-full">+</button>
                       </div>
                       <button className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Remove">
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
                 <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium text-foreground">₹570.00</span>
                 </div>
                 <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="font-medium text-foreground">₹50.00</span>
                 </div>
                 <div className="flex justify-between">
                    <span>Tax (GST Included)</span>
                    <span className="font-medium text-foreground">₹0.00</span>
                 </div>
              </div>

              <div className="flex justify-between items-center py-4 border-t border-dashed border-neutral-200 mb-8">
                 <span className="font-bold text-foreground">Total</span>
                 <span className="text-2xl font-bold text-primary">₹620.00</span>
              </div>

              <Link href="/checkout" className="block w-full py-4 bg-primary text-white text-center font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/30 active:scale-95 duration-150">
                 Proceed to Checkout
              </Link>
           </div>
        </div>

      </div>
    </main>
  );
}
