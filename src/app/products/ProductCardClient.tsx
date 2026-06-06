"use client";

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function ProductCardClient({ product }: { product: any }) {
  const { t } = useLanguage();

  const isAvailable = product.available !== false;

  return (
    <div className="text-center w-full">
      <Link href={`/products/${product.slug}`}>
        <h3 className="font-bold text-lg text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-2 min-h-[56px] leading-tight">{product.name}</h3>
      </Link>
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        <span className="text-secondary font-bold text-xl">₹{product.price}</span>
        <span className="text-sm text-neutral-500 font-normal">/ 1L</span>
      </div>
      <div className="mb-5">
        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${isAvailable === false ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
          {isAvailable === false ? t('products.currentlyUnavailable') : t('products.addToCart') === 'Add to Cart' ? 'In Stock' : t('products.addToCart')}
        </span>
      </div>
      {isAvailable === false ? (
        <div className="w-full py-3 bg-neutral-200 text-neutral-500 font-bold rounded-lg text-center">
          {t('products.outOfStock')}
        </div>
      ) : (
        <Link href={`/products/${product.slug}`} className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 active:scale-95 duration-150">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {t('products.addToCart')}
        </Link>
      )}
    </div>
  );
}
