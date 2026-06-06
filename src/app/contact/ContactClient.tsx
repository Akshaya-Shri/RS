"use client";

import { useLanguage } from '@/context/LanguageContext';

export default function ContactClient() {
  const { t } = useLanguage();

  return (
    <main className="flex-1 bg-surface py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl font-bold text-primary mb-4">{t('contact.headerTitle')}</h1>
          <p className="text-xl text-neutral-600 font-inter">{t('contact.headerSubtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
           {/* Contact Info & Map */}
           <div className="space-y-8">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100 flex items-start gap-6 group lift-effect">
                 <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                   <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                   </svg>
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{t('contact.visitStore')}</h3>
                    <p className="text-neutral-600 font-inter leading-relaxed">Revathi Store<br/>Theni Main Road<br/>Theni, Tamil Nadu - 625531<br/>India</p>
                 </div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100 flex items-start gap-6 group lift-effect">
                 <div className="w-14 h-14 bg-secondary/10 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                   <svg className="w-7 h-7 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                   </svg>
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{t('contact.callUs')}</h3>
                    <p className="text-neutral-600 font-inter mb-1"><strong>{t('contact.phoneLabel') || 'Phone:'}</strong> +91 92454 83536</p>
                    <p className="text-neutral-600 font-inter mb-1"><strong>{t('contact.alternateLabel') || 'Alternate:'}</strong> +91 92450 31931</p>
                    <p className="text-neutral-600 font-inter mb-2"><strong>{t('contact.emailLabel') || 'Email:'}</strong> shanmugaveloilmill@gmail.com</p>
                    <p className="text-sm text-neutral-500 font-inter">{t('contact.hours')}</p>
                 </div>
              </div>

              {/* Interactive Google Map */}
              <div className="bg-white p-2 rounded-3xl shadow-sm border border-neutral-100 h-[400px] relative overflow-hidden flex items-center justify-center group lift-effect">
                 <iframe 
                   src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3929.062986187607!2d77.47522287503135!3d10.011656190094335!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTDCsDAwJzQyLjAiTiA3N8KwMjgnNDAuMSJF!5e0!3m2!1sen!2sin!4v1775975420850!5m2!1sen!2sin" 
                   width="100%" 
                   height="100%" 
                   style={{ border: 0 }} 
                   allowFullScreen={true} 
                   loading="lazy" 
                   referrerPolicy="no-referrer-when-downgrade"
                   className="rounded-2xl w-full h-full"
                 ></iframe>
              </div>
           </div>

           {/* Contact Form */}
           <div className="bg-white p-8 md:p-12 rounded-3xl shadow-lg border border-neutral-100">
              <h3 className="text-2xl font-bold text-primary mb-6">{t('contact.sendMessage')}</h3>
              <form className="space-y-6">
                 <div>
                   <label className="block text-sm font-bold text-foreground mb-2">{t('contact.form.fullNameLabel')}</label>
                   <input type="text" className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-surface" placeholder={t('contact.form.namePlaceholder')} required />
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-foreground mb-2">{t('contact.form.contactLabel')}</label>
                   <input type="text" className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-surface" placeholder={t('contact.form.contactPlaceholder')} required />
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-foreground mb-2">{t('contact.form.messageLabel')}</label>
                   <textarea rows={5} className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-surface resize-none" placeholder={t('contact.form.messagePlaceholder')} required></textarea>
                 </div>
                 <button type="submit" className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/30 active:scale-95 duration-150 flex items-center justify-center gap-2">
                    {t('contact.form.sendButton')}
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                 </button>
              </form>
           </div>
        </div>

      </div>
    </main>
  );
}

