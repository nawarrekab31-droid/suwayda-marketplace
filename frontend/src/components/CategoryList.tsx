import React from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/api';

interface Category {
  id: string;
  name: string;
  icon?: string;
  children?: Category[];
}

export const CategoryList = ({ categories }: { categories: Category[] }) => {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-3 min-w-max">
        {categories.map((cat) => (
          <Link key={cat.id} href={`/products?category=${cat.id}`} className="flex flex-col items-center gap-1 px-3 py-2 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition-shadow whitespace-nowrap shrink-0">
            <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center">
              {cat.icon ? (
                <img src={cat.icon} alt={cat.name} className="w-8 h-8" />
              ) : (
                <span className="text-2xl">📦</span>
              )}
            </div>
            <span className="text-sm font-medium text-gray-700">{cat.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};