'use client';

import OilPourHeroSVG from '@/components/ui/OilPourHeroSVG';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function Home() {
  const { t } = useLanguage();

  const categories = [
    { nameKey: 'home.groundnutOil', type: 'groundnut' as const, slug: 'groundnut', color: 'bg-orange-50', imageUrl: '/images/Oilimages/groundnutoil.png' },
    { nameKey: 'home.coconutOil', type: 'coconut' as const, slug: 'coconut', color: 'bg-amber-50', imageUrl: '/images/Oilimages/cocunutoil.png' },
    { nameKey: 'home.sesameOil', type: 'sesame' as const, slug: 'sesame', color: 'bg-green-50', imageUrl: '/images/Oilimages/sesameoil.png' },
    { nameKey: 'home.castorOil', type: 'castor' as const, slug: 'castor', color: 'bg-purple-50', imageUrl: '/images/Oilimages/castoroil.png' },
    { nameKey: 'home.deepamOil', type: 'deepam' as const, slug: 'deepam', color: 'bg-red-50', imageUrl: '/images/Oilimages/deepamoil.png' },
  ];

  const features = [
    { 
      titleKey: 'home.pureExtraction', 
      descKey: 'home.pureExtractionDesc',
      icon: (
        <svg viewBox="0 0 24 24" className="w-12 h-12 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      titleKey: 'home.directFromMill', 
      descKey: 'home.directFromMillDesc',
      icon: (
        <svg viewBox="0 0 24 24" className="w-12 h-12 text-secondary" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 21h18M3 7v1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1h-18l2-4h14l2 4M5 21V10.85M19 21V10.85M9 21v-4a2 2 0 0 1 4 0v4"/>
        </svg>
      )
    },
    { 
      titleKey: 'home.msemCertified', 
      descKey: 'home.msemCertifiedDesc',
      icon: (
        <svg viewBox="0 0 24 24" className="w-12 h-12 text-primary-light" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    }
  ];

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-surface py-20 lg:py-32 border-b border-primary-light/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                Since 1975
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight">
                {t('home.heroTitle')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">oil mill</span> to your home.
              </h1>
              <p className="text-xl text-neutral-600 font-inter">
                {t('home.heroSubtitle')}
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link href="/products" className="px-8 py-4 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30 flex items-center gap-2 group">
                  {t('home.exploreProducts')}
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                <Link href="/wholesale" className="px-8 py-4 bg-white text-primary border-2 border-primary font-bold rounded-lg hover:bg-neutral-50 transition-colors">
                  Wholesale Inquiry
                </Link>
              </div>
            </div>
            
            <div className="relative h-[400px] lg:h-[600px] flex items-center justify-center">
               <OilPourHeroSVG className="max-w-md" />
            </div>
          </div>
        </div>
        {/* Background Decorative Pattern */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1B5E20 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-primary mb-4">Our Pure Oils</h2>
            <p className="text-neutral-600 font-inter">Explore our range of traditionally extracted cold-pressed oils.</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
            {categories.map((cat) => (
              <Link key={cat.slug} href={`/products?category=${cat.slug}`} className="group flex flex-col items-center lift-effect">
                <div className={`w-32 h-32 rounded-full ${cat.color} border-4 border-white shadow-md flex items-center justify-center relative overflow-hidden`}>
                   <div className="absolute inset-0 bg-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                   <Image src={cat.imageUrl} alt={t(cat.nameKey)} fill className="object-cover p-2" />
                </div>
                <h3 className="mt-4 font-bold text-foreground group-hover:text-primary transition-colors text-center">{t(cat.nameKey)}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-primary mb-16">{t('home.whyChooseUs')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100 lift-effect text-center group">
                <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{t(feature.titleKey)}</h3>
                <p className="text-neutral-600 font-inter leading-relaxed">{t(feature.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wholesale Banner */}
      <section className="py-24 bg-primary relative overflow-hidden">
        {/* Animated Background loop */}
         <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="gear" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                   <path d="M50 20 L50 10 M80 50 L90 50 M50 80 L50 90 M20 50 L10 50" stroke="white" strokeWidth="4" />
                   <circle cx="50" cy="50" r="20" fill="none" stroke="white" strokeWidth="4" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#gear)">
                  <animateTransform attributeName="transform" type="translate" values="0,0; -100,-100" dur="20s" repeatCount="indefinite" />
              </rect>
            </svg>
         </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl font-bold text-white mb-6">Looking for Bulk Orders?</h2>
          <p className="text-xl text-primary-light mb-10 font-inter">We supply high-quality cold-pressed oils at wholesale prices for businesses and large family needs.</p>
          <Link href="/wholesale" className="inline-block px-10 py-4 bg-secondary text-white font-bold rounded-lg hover:bg-secondary/90 transition-all glow-effect text-lg">
            Request Wholesale Quote
          </Link>
        </div>
      </section>
    </main>
  );
}
