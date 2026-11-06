'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SearchBar } from '@/components/SearchBar';
import { ProductCard } from '@/components/ProductCard';
import { CategoryList } from '@/components/CategoryList';
import { OfferBanner } from '@/components/OfferBanner';
import { api } from '@/lib/api';

export default function HomePage() {
  const [isClient, setIsClient] = useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const { data: products } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => api.getProducts({ limit: 8, isAvailable: true }),
    enabled: isClient,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories({ parentId: undefined }),
    enabled: isClient,
  });

  const { data: offers } = useQuery({
    queryKey: ['active-offers'],
    queryFn: () => api.getOffers({ isActive: true, limit: 5 }),
    enabled: isClient,
  });

  return (
    <div className="container-page">
      <h1 className="mb-6 text-2xl font-bold">مرحباً بكم في سوق السويداء</h1>
      <p className="mb-8 text-muted-foreground">منصة ربط المتاجر المحلية بالمستهلكين</p>

      <SearchBar />

      {offers && <OfferBanner offers={offers} />}

      {categories && (
        <section className="my-8">
          <h2 className="mb-4 text-xl font-bold">التصنيفات</h2>
          <CategoryList categories={categories} />
        </section>
      )}

      {products && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">منتجات مميزة</h2>
            <a href="/products" className="text-sm text-primary-600 hover:underline">
              عرض الكل
            </a>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}