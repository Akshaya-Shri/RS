import Link from 'next/link';
export const dynamic = 'force-dynamic';
import { pool } from '@/lib/db';
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
  const resolvedSearchParams = await searchParams;
  const categoryFilter = resolvedSearchParams?.category as string;

  let products: any[] = [];
  try {
    let query = 'SELECT *, type AS category FROM products';
    const params: any[] = [];
    if (categoryFilter) {
      query += ' WHERE type = $1';
      params.push(categoryFilter);
    }
    query += ' ORDER BY id ASC';
    const res = await pool.query(query, params);
    products = res.rows;
  } catch (err) {
    console.error('Failed to query products from DB:', err);
  }

  return <ProductsClient products={products} categoryFilter={categoryFilter} />;
}

