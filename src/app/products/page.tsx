import Link from 'next/link';
export const dynamic = 'force-dynamic';
import fs from 'fs';
import path from 'path';
import ProductsClient from './ProductsClient';

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

  return <ProductsClient products={filteredProducts} categoryFilter={categoryFilter} />;
}

