"use client";

import Link from 'next/link';
import Image from 'next/image';
import AddToCartSection from '@/components/ui/AddToCartSection';
import { useLanguage } from '@/context/LanguageContext';

export default function ProductDetailClient({ product }: { product: any }) {
  const { t, language } = useLanguage();

  const isAvailable = product?.available !== false;

  const benefits: string[] = (language === 'ta' && product?.benefits_ta)
    ? product.benefits_ta
    : (product?.benefits ?? []);

  return (
    <main className="flex-1 bg-surface py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-sm font-medium text-neutral-500 mb-8">
          <Link href="/" className="hover:text-primary transition-colors">{t('nav.home')}</Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-primary transition-colors">{t('nav.products')}</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{language === 'ta' && product.name_ta ? product.name_ta : product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Image Column */}
          <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-neutral-100 flex items-center justify-center min-h-[400px]">
             <div className="w-full max-w-sm aspect-square relative rounded-full overflow-hidden border-[12px] border-neutral-50 shadow-inner bg-neutral-100">
                <Image src={product.imageUrl} alt={product.name} fill className="object-cover p-2" />
             </div>
          </div>

          {/* Details Column */}
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <h1 className="text-3xl md:text-5xl font-bold text-foreground">{language === 'ta' && product.name_ta ? product.name_ta : product.name}</h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${isAvailable ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                {isAvailable ? t('products.inStock') || 'In Stock' : t('products.outOfStock') || 'Out of Stock'}
              </span>
            </div>
            <p className="text-neutral-600 font-inter leading-relaxed mb-8">{language === 'ta' && product.description_ta ? product.description_ta : product.description}</p>
            <AddToCartSection product={{
              id: product.id,
              slug: product.slug,
              name: language === 'ta' && product.name_ta ? product.name_ta : product.name,
              image: product.imageUrl,
              pricePerLiter: product.price,
              sizes: product.sizes,
              available: isAvailable
            }} />

            {/* Benefits & Usage Accordion */}
            <div className="space-y-6 pt-8 border-t border-neutral-100">
               <div>
                 <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t('products.keyBenefits') || 'Key Benefits'}
                 </h3>
                 <ul className="list-disc list-inside text-neutral-600 space-y-1 ml-2 font-inter">
                   {benefits.length > 0 ? benefits.map((b: string, i: number) => <li key={i}>{b}</li>) : <li>{t('products.noBenefits') || 'No benefits available.'}</li>}
                 </ul>
               </div>

               <div>
                 <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {t('products.usage') || 'Usage'}
                 </h3>
                 <p className="text-neutral-600 font-inter ml-7">{language === 'ta' && product.usage_ta ? product.usage_ta : product.usage}</p>
               </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
