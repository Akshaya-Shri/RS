export const metadata = {
  title: 'Wholesale & Bulk Orders | Revathi Store',
  description: 'Provide direct-from-mill purity to your customers with our wholesale cold-pressed oils. Partner with us today.'
};

export default function WholesalePage() {
  return (
    <main className="flex-1 bg-surface relative overflow-hidden flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
       {/* Animated Factory Background */}
       <div className="absolute inset-0 opacity-5 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="factory" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                 <path d="M10 90 L10 50 L30 40 L30 50 L50 40 L50 90 Z" fill="none" stroke="#1b5e20" strokeWidth="2" />
                 <path d="M60 90 L60 30 L80 30 L80 90 Z" fill="none" stroke="#1b5e20" strokeWidth="2" />
                 <circle cx="70" cy="50" r="5" fill="none" stroke="#1b5e20" />
                 <path d="M20 90 L20 70 M40 90 L40 70" stroke="#1b5e20" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#factory)">
                <animateTransform attributeName="transform" type="translate" values="0,0; -100,0" dur="15s" repeatCount="indefinite" />
            </rect>
          </svg>
       </div>
       
       <div className="max-w-3xl mx-auto px-4 z-10 w-full py-20">
         <div className="bg-white/80 backdrop-blur-md p-8 md:p-12 rounded-3xl shadow-xl border border-white">
            <div className="text-center mb-10">
               <h1 className="text-4xl font-bold text-primary mb-4">Partner With Us</h1>
               <p className="text-neutral-600">Provide direct-from-mill purity to your customers. Fill the form below for wholesale pricing and bulk orders.</p>
            </div>

            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-sm font-bold text-foreground mb-2">Business Name</label>
                   <input type="text" className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white/50" placeholder="Your Company Name" required />
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-foreground mb-2">Contact Person</label>
                   <input type="text" className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white/50" placeholder="Your Name" required />
                 </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-sm font-bold text-foreground mb-2">Phone Number</label>
                   <input type="tel" className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white/50" placeholder="+91 xxxxx xxxxx" required />
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-foreground mb-2">Email Address</label>
                   <input type="email" className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white/50" placeholder="mail@company.com" />
                 </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Requirements / Estimated MOQ</label>
                <textarea rows={4} className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white/50 resize-none" placeholder="e.g. Need 100 liters of Groundnut oil per month..."></textarea>
              </div>

              <button type="submit" className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/30 active:scale-95 duration-150">
                 Submit Inquiry
              </button>
            </form>
         </div>
       </div>
    </main>
  );
}
