import Link from 'next/link';
import Image from 'next/image';
import fs from 'fs';
import path from 'path';

export const metadata = {
  title: 'All Products | Revathi Store',
  description: 'Shop pure, cold-pressed oils. Groundnut, coconut, sesame, castor, and deepam oils available.'
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const filePath = path.join(process.cwd(), 'src/data/products.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const products = JSON.parse(fileContents);

  const resolvedSearchParams = await searchParams;
  const categoryFilter = resolvedSearchParams?.category as string;
  
  const filteredProducts = categoryFilter 
    ? products.filter((p: any) => p.category === categoryFilter)
    : products;

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
          {filteredProducts.map((product: any) => (
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
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  <span className="text-secondary font-bold text-xl">₹{product.price}</span>
                  <span className="text-sm text-neutral-500 font-normal">/ 1L</span>
                </div>
                <div className="mb-5">
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${product.available === false ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {product.available === false ? 'Unavailable' : 'In Stock'}
                  </span>
                </div>
                {product.available === false ? (
                  <div className="w-full py-3 bg-neutral-200 text-neutral-500 font-bold rounded-lg text-center">
                    Out of Stock
                  </div>
                ) : (
                  <Link href={`/products/${product.slug}`} className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 active:scale-95 duration-150">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Add to Cart
                  </Link>
                )}
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
