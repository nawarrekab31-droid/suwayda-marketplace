import React from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  price: number;
  images: { url: string }[];
  store: { name: string };
}

export const ProductCard = ({ product }: { product: Product }) => {
  return (
    <Link href={`/products/${product.id}`} className="card hover:shadow-md transition-shadow">
      <img src={product.images[0]?.url || '/placeholder.png'} alt={product.name} className="w-full h-40 object-cover" />
      <div className="p-3">
        <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
        <p className="text-sm text-gray-500">{product.store.name}</p>
        <p className="mt-1 font-bold text-primary-600">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
};
