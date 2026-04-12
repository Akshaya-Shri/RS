import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'All Products | Revathi Store',
  description: 'Shop pure, cold-pressed oils. Groundnut, coconut, sesame, castor, and deepam oils available.'
};

const DUMMY_PRODUCTS = [
  { id: 1, name: 'Cold Pressed Groundnut Oil', price: 220, category: 'groundnut', slug: 'groundnut-oil', imageUrl: '/images/Oilimages/groundnutoil.png' },
  { id: 2, name: 'Cold Pressed Coconut Oil', price: 300, category: 'coconut', slug: 'coconut-oil', imageUrl: '/images/Oilimages/cocunutoil.png' },
  { id: 3, name: 'Cold Pressed Sesame Oil', price: 350, category: 'sesame', slug: 'sesame-oil', imageUrl: '/images/Oilimages/sesameoil.png' },
  { id: 4, name: 'Pure Castor Oil', price: 180, category: 'castor', slug: 'castor-oil', imageUrl: '/images/Oilimages/castoroil.png' },
  { id: 5, name: 'Special Deepam Oil', price: 120, category: 'deepam', slug: 'deepam-oil', imageUrl: '/images/Oilimages/deepamoil.png' },
];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const categoryFilter = resolvedSearchParams?.category as string;
  
  const filteredProducts = categoryFilter 
    ? DUMMY_PRODUCTS.filter(p => p.category === categoryFilter)
    : DUMMY_PRODUCTS;

  return (
    <main className="flex-1 bg-surface py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-primary mb-4">Our Products</h1>
          <p className="text-neutral-600">Authentic cold-pressed oils. Filter by category to find what you need.</p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <Link href="/products" className={`px-6 py-2 rounded-full font-medium border border-primary transition-colors ${!categoryFilter ? 'bg-primary text-white shadow' : 'bg-white text-primary hover:bg-primary-light/20'}`}>
            All
          </Link>
          {['groundnut', 'coconut', 'sesame', 'castor', 'deepam'].map(cat => (
             <Link key={cat} href={`/products?category=${cat}`} className={`px-6 py-2 font-medium rounded-full border border-primary transition-colors capitalize ${categoryFilter === cat ? 'bg-primary text-white shadow' : 'bg-white text-primary hover:bg-primary-light/20'}`}>
                {cat} Oil
             </Link>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 lift-effect group flex flex-col items-center">
              
              <Link href={`/products/${product.slug}`} className="block w-48 h-48 relative mb-6">
                 <div className="absolute inset-0 bg-neutral-50 rounded-full group-hover:bg-primary/5 transition-colors flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
                    <Image src={product.imageUrl} alt={product.name} fill className="object-cover p-2" />
                 </div>
              </Link>
              
              <div className="text-center w-full">
                <Link href={`/products/${product.slug}`}>
                  <h3 className="font-bold text-lg text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-2 min-h-[56px] leading-tight">{product.name}</h3>
                </Link>
                <div className="text-secondary font-bold text-xl mb-5">₹{product.price} <span className="text-sm text-neutral-500 font-normal">/ 1L</span></div>
                
                <button className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 active:scale-95 duration-150">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Add to Cart
                </button>
              </div>
              
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-20 text-center text-neutral-500">
               No products found in this category.
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
