import { notFound } from 'next/navigation';
import { pool } from '@/lib/db';
import ProductDetailClient from './ProductDetailClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return {
    title: `${slug.replace('-', ' ').toUpperCase()} | Revathi Store`,
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let product = null;
  try {
    const res = await pool.query(
      'SELECT *, type AS category FROM products WHERE slug = $1 LIMIT 1',
      [slug]
    );
    if (res.rowCount > 0) {
      product = res.rows[0];
    }
  } catch (err) {
    console.error('Failed to query product details from DB:', err);
  }

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
