"use client";

import { useLanguage } from '@/context/LanguageContext';

export default function WholesaleClient() {
  const { t } = useLanguage();

  return (
    <main className="flex-1 bg-surface relative overflow-hidden flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
       <div className="max-w-3xl mx-auto px-4 z-10 w-full py-20">
         <div className="bg-white/80 backdrop-blur-md p-8 md:p-12 rounded-3xl shadow-xl border border-white">
            <div className="text-center mb-10">
               <h1 className="text-4xl font-bold text-primary mb-4">{t('home.wholesaleBannerTitle')}</h1>
               <p className="text-neutral-600">{t('home.wholesaleBannerDesc')}</p>
            </div>

            <form 
              action="https://formspree.io/f/xpqyolpw" 
              method="POST" 
              className="space-y-6"
            >
              <input type="hidden" name="_subject" value={t('wholesale.emailSubject') || 'Wholesale Inquiry - Revathi Store'} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-sm font-bold text-foreground mb-2">{t('wholesale.businessName') || 'Business Name'}</label>
                   <input 
                     type="text" 
                     name="business_name"
                     className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white/50" 
                     placeholder={t('wholesale.businessPlaceholder') || 'Your Company Name'} 
                     required 
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-foreground mb-2">{t('wholesale.contactPerson') || 'Contact Person'}</label>
                   <input 
                     type="text" 
                     name="contact_person"
                     className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white/50" 
                     placeholder={t('wholesale.contactPlaceholder') || 'Your Name'} 
                     required 
                   />
                 </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-sm font-bold text-foreground mb-2">{t('wholesale.phone') || 'Phone Number'}</label>
                   <input 
                     type="tel" 
                     name="phone"
                     className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white/50" 
                     placeholder={t('wholesale.phonePlaceholder') || '+91 xxxxx xxxxx'} 
                     required 
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-foreground mb-2">{t('wholesale.email') || 'Email Address'}</label>
                   <input 
                     type="email" 
                     name="email"
                     className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white/50" 
                     placeholder={t('wholesale.emailPlaceholder') || 'mail@company.com'} 
                   />
                 </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">{t('wholesale.requirements') || 'Requirements / Estimated MOQ'}</label>
                <textarea 
                  rows={4} 
                  name="requirements"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white/50 resize-none" 
                  placeholder={t('wholesale.requirementsPlaceholder') || 'e.g. Need 100 liters of Groundnut oil per month...'}
                ></textarea>
              </div>

              <button 
                type="submit" 
                className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/30 active:scale-95 duration-150"
              >
                 {t('wholesale.submit') || 'Submit Inquiry'}
              </button>
            </form>
         </div>
       </div>
    </main>
  );
}

