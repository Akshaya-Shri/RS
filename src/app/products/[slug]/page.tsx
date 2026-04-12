import Link from 'next/link';
import Image from 'next/image';
import AddToCartSection from '@/components/ui/AddToCartSection';

import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return {
    title: `${slug.replace('-', ' ').toUpperCase()} | Revathi Store`,
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const filePath = path.join(process.cwd(), 'src/data/products.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const products = JSON.parse(fileContents);
  
  const product = products.find((p: any) => p.slug === slug);

  if (!product) {
    notFound();
  }

  const imageUrl = product.imageUrl || '/images/Oilimages/groundnutoil.png';

  const isAvailable = product.available !== false;

  return (
    <main className="flex-1 bg-surface py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <nav className="text-sm font-medium text-neutral-500 mb-8">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-primary transition-colors">Products</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Image Column */}
          <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-neutral-100 flex items-center justify-center min-h-[400px]">
             <div className="w-full max-w-sm aspect-square relative rounded-full overflow-hidden border-[12px] border-neutral-50 shadow-inner bg-neutral-100">
                <Image src={imageUrl} alt={product.name} fill className="object-cover p-2" />
             </div>
          </div>

          {/* Details Column */}
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <h1 className="text-3xl md:text-5xl font-bold text-foreground">{product.name}</h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${isAvailable ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                {isAvailable ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
            <p className="text-neutral-600 font-inter leading-relaxed mb-8">{product.description}</p>
            
            {/* Interactive Add To Cart Box */}
            <AddToCartSection product={{
              slug: slug,
              name: product.name,
              image: imageUrl,
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
                    Key Benefits
                 </h3>
                 <ul className="list-disc list-inside text-neutral-600 space-y-1 ml-2 font-inter">
                   {product.benefits.map((b: string, i: number) => <li key={i}>{b}</li>)}
                 </ul>
               </div>

               <div>
                 <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Usage
                 </h3>
                 <p className="text-neutral-600 font-inter ml-7">{product.usage}</p>
               </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
