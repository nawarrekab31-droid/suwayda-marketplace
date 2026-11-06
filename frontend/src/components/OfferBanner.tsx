import React from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/api';

interface Offer {
  id: string;
  title: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  product: { id: string; name: string; price: number; images: { url: string }[] };
  store: { name: string };
  endsAt: string;
}

export const OfferBanner = ({ offers }: { offers: Offer[] }) => {
  if (!offers.length) return null;

  return (
    <section className="my-6">
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-4 min-w-max">
          {offers.slice(0, 5).map((offer) => (
            <Link
              key={offer.id}
              href={`/products/${offer.product.id}`}
              className="relative w-72 flex-shrink-0 card overflow-hidden"
            >
              <img
                src={offer.product.images[0]?.url || '/placeholder.png'}
                alt={offer.product.name}
                className="w-full h-40 object-cover"
              />
              <div className="absolute top-2 left-2">
                <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                  {offer.discountType === 'PERCENT'
                    ? `خصم ${offer.discountValue}%`
                    : `خصم ${formatPrice(offer.discountValue)}`}
                </span>
              </div>
              <div className="p-3">
                <h3 className="font-medium text-gray-900 truncate">{offer.title}</h3>
                <p className="text-xs text-gray-500">{offer.store.name}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-primary-600">
                    {formatPrice(offer.product.price - (offer.discountType === 'PERCENT' ? Math.floor(offer.product.price * offer.discountValue / 100) : offer.discountValue))}
                  </span>
                  <span className="text-sm text-gray-400 line-through">
                    {formatPrice(offer.product.price)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};