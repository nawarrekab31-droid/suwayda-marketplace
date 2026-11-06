'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductCard } from '@/components/ProductCard';
import { api } from '@/lib/api';

export default function ProductsPage() {
  const [isClient, setIsClient] = useState(false);
  React.useEffect(() => { setIsClient(true); }, []);

  const searchParams = useSearchParams();
  const router = useRouter();
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', search, category, minPrice, maxPrice],
    queryFn: () =>
      api.getProducts({
        search: search || undefined,
        categoryId: category || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        isAvailable: true,
        limit: 40,
      }),
    enabled: isClient,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
    enabled: isClient,
  });

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page');
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="container-page">
      <h1 className="mb-6 text-2xl font-bold">المنتجات</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="md:col-span-1">
          <div className="card p-4">
            <h3 className="font-bold mb-3">التصنيفات</h3>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setFilter('category', '')}
                className={`text-start text-sm px-2 py-1.5 rounded ${!category ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-gray-50'}`}
              >
                جميع التصنيفات
              </button>
              {categories?.map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => setFilter('category', cat.id)}
                  className={`text-start text-sm px-2 py-1.5 rounded ${category === cat.id ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-gray-50'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <h3 className="font-bold mt-4 mb-3">السعر</h3>
            <div className="flex flex-col gap-2">
              <input
                type="number"
                placeholder="الحد الأدنى"
                value={minPrice}
                onChange={(e) => setFilter('minPrice', e.target.value)}
                className="input"
              />
              <input
                type="number"
                placeholder="الحد الأقصى"
                value={maxPrice}
                onChange={(e) => setFilter('maxPrice', e.target.value)}
                className="input"
              />
            </div>
          </div>
        </aside>

        <main className="md:col-span-3">
          {isLoading ? (
            <p>جاري التحميل...</p>
          ) : products && products.length === 0 ? (
            <p className="text-muted-foreground">لا توجد منتجات مطابقة.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products?.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}