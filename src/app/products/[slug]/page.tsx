import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

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

  return <ProductDetailClient product={product} />;
}
