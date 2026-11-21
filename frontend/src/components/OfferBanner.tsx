import React from 'react';
import Link from 'next/link';
import { formatPrice, type Offer } from '@/lib/api';

export const OfferBanner = ({ offers }: { offers: Offer[] }) => {
  const productOffers = offers.filter((offer) => offer.product !== null);
  if (!productOffers.length) return null;

  return (
    <section className="my-6">
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-4 min-w-max">
          {productOffers.slice(0, 5).map((offer) => {
            const product = offer.product;
            if (!product) return null;

            return (
              <Link
                key={offer.id}
                href={`/products/${product.id}`}
                className="relative w-72 flex-shrink-0 card overflow-hidden"
              >
                <img
                  src={product.images[0]?.url || '/placeholder.png'}
                  alt={product.name}
                  className="w-full h-40 object-cover"
                />
                <div className="absolute top-2 start-2">
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
                      {formatPrice(product.price - (offer.discountType === 'PERCENT' ? Math.floor(product.price * offer.discountValue / 100) : offer.discountValue))}
                    </span>
                    <span className="text-sm text-gray-400 line-through">
                      {formatPrice(product.price)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};