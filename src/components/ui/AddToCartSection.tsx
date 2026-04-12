"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/cart/CartProvider';

export default function AddToCartSection({ product }: { product: { slug: string, name: string, image: string, sizes: string[], pricePerLiter: number, available?: boolean } }) {
  const { slug, name, image, sizes, pricePerLiter, available = true } = product;
  const [selectedSize, setSelectedSize] = useState(sizes.find((s: string) => s === '1L') || sizes[0]);
  const [quantity, setQuantity] = useState(1);
  
  const { addItem } = useCart();
  const router = useRouter();

  // Quick helper to estimate price based on size string for realistic UX
  const getPriceMultiplier = (size: string) => {
    if (size.includes('100ml')) return 0.15;
    if (size.includes('500ml')) return 0.55;
    if (size.includes('5L')) return 4.8;
    if (size.includes('15L')) return 14;
    return 1; // 1L default
  };

  const currentPrice = Math.round(pricePerLiter * getPriceMultiplier(selectedSize)) * quantity;

  return (
    <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100 mb-8 space-y-6">
      {/* Dynamic Price Display */}
      <div className="flex items-end gap-2">
        <p className="text-3xl font-bold text-secondary">₹{currentPrice}</p>
        <span className="text-base text-neutral-500 font-normal pb-1">
          {quantity > 1 ? `(Total for ${quantity} x ${selectedSize})` : `/ ${selectedSize}`}
        </span>
      </div>

      {/* Size Selector */}
      <div>
        <h3 className="font-bold text-foreground mb-3 text-sm uppercase tracking-wider opacity-80">Select Size</h3>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <button 
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                selectedSize === size 
                  ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary' 
                  : 'border-neutral-200 text-neutral-600 hover:border-primary-light bg-white'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity & Add to Cart */}
      <div className="flex items-center gap-4 pt-2">
        <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden h-14 bg-white shrink-0">
          <button 
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={!available}
            className="px-4 text-neutral-500 hover:bg-neutral-50 hover:text-primary transition-colors h-full text-lg w-12 flex justify-center items-center disabled:cursor-not-allowed disabled:opacity-40"
          >
            -
          </button>
          <div className="w-8 text-center font-bold">{quantity}</div>
          <button 
            onClick={() => setQuantity(quantity + 1)}
            disabled={!available}
            className="px-4 text-neutral-500 hover:bg-neutral-50 hover:text-primary transition-colors h-full text-lg w-12 flex justify-center items-center disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>
        <button 
          onClick={() => {
            addItem({
              id: `${slug}-${selectedSize}`,
              slug,
              name,
              size: selectedSize,
              price: Math.round(pricePerLiter * getPriceMultiplier(selectedSize)), // Base item price
              image,
              qty: quantity,
              product_id: 1 // Default for now - will be updated when we have proper product IDs
            });
            router.push('/cart');
          }}
          disabled={!available}
          className={`flex-1 h-14 font-bold rounded-lg transition-all flex items-center justify-center gap-2 lift-effect shadow-md shadow-primary/20 ${available ? 'bg-primary text-white hover:bg-primary/90' : 'bg-neutral-200 text-neutral-500 cursor-not-allowed opacity-80'}`}
        >
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
           </svg>
           {available ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
      {!available && (
        <p className="text-sm text-red-600 font-medium">This product is currently unavailable.</p>
      )}
    </div>
  );
}
