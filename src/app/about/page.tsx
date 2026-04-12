export const metadata = {
  title: 'Our Story | Revathi Store',
  description: 'Almost 50 years of delivering uncompromised purity and tradition. Founded in 1975 in Theni.'
};

export default function AboutPage() {
  return (
    <main className="flex-1 bg-surface py-20 overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">Our Legacy Since 1975</h1>
          <p className="text-xl text-neutral-600 font-inter">Almost 50 years of delivering uncompromised purity and tradition.</p>
        </div>

        {/* Timeline */}
        <div className="relative border-l-4 border-secondary/30 ml-6 md:ml-12 pl-8 space-y-16">
           <div className="relative group">
              <div className="absolute -left-[45px] top-0 w-8 h-8 bg-secondary rounded-full flex items-center justify-center ring-4 ring-white shadow-md group-hover:scale-125 transition-transform duration-500">
                <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
              </div>
              <h3 className="text-2xl font-bold text-primary mb-2">The Beginning</h3>
              <p className="font-bold text-secondary mb-4">1975</p>
              <p className="text-neutral-600 leading-relaxed bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">Founded in Theni, Tamil Nadu, by Shanmugavelan A R, Revathi Store began as a humble business with a single wooden press (chekku), supplying pure groundnut and sesame oils to the local community.</p>
           </div>

           <div className="relative group">
              <div className="absolute -left-[45px] top-0 w-8 h-8 bg-primary-light rounded-full flex items-center justify-center ring-4 ring-white shadow-md group-hover:scale-125 transition-transform duration-500">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
              </div>
              <h3 className="text-2xl font-bold text-primary mb-2">Expansion & Recognition</h3>
              <p className="font-bold text-secondary mb-4">2000s</p>
              <p className="text-neutral-600 leading-relaxed bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">Expanded our capacity while retaining traditional extraction methods. Officially recognized by MSME and acquired GST compliance, stepping into wholesale distribution across Tamil Nadu.</p>
           </div>

           <div className="relative group">
              <div className="absolute -left-[45px] top-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center ring-4 ring-white shadow-md glow-effect transition-transform duration-500">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
              <h3 className="text-2xl font-bold text-primary mb-2">Digital Era</h3>
              <p className="font-bold text-secondary mb-4">Present</p>
              <p className="text-neutral-600 leading-relaxed bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">Bringing our premium oils directly to consumers pan-India through our digital storefront, eliminating middlemen and ensuring the freshness of the mill reaches your kitchen.</p>
           </div>
        </div>

        {/* Certifications / Badges */}
        <div className="mt-24 pt-16 border-t border-neutral-200">
           <h2 className="text-3xl font-bold text-center text-primary mb-12">Our Certifications</h2>
           <div className="flex flex-wrap justify-center gap-10">
              {['MSME Registered (TN23A0003022)', 'GST Compliant', 'FSSAI Certified', '100% Vegan'].map((badge, idx) => (
                 <div key={idx} className="flex flex-col items-center group">
                    <div className="w-20 h-20 bg-white rounded-full shadow-md flex items-center justify-center mb-4 border-2 border-primary/10 group-hover:border-primary group-hover:-translate-y-2 transition-all duration-300">
                       <svg className="w-10 h-10 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                       </svg>
                    </div>
                    <span className="font-bold text-neutral-700 max-w-[120px] text-center text-sm">{badge}</span>
                 </div>
              ))}
           </div>
        </div>
      </div>
    </main>
  );
}
