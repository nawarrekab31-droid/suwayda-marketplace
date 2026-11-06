'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, formatPrice } from '@/lib/api';

export default function CartPage() {
  const [isClient, setIsClient] = useState(false);
  React.useEffect(() => { setIsClient(true); }, []);

  const router = useRouter();

  const { data: cart, isLoading, refetch } = useQuery({
    queryKey: ['cart'],
    queryFn: () => api.getCart(),
    enabled: isClient,
    retry: false,
  });

  const updateQuantity = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      api.updateCartItem(productId, quantity),
    onSuccess: () => refetch(),
  });

  const removeFromCart = useMutation({
    mutationFn: (productId: string) => api.removeFromCart(productId),
    onSuccess: () => refetch(),
  });

  const subtotal = cart?.subtotal || 0;
  const deliveryFee = subtotal > 50000 ? 0 : 5000;
  const total = subtotal + deliveryFee;

  if (!isClient) return <div className="container-page">جاري التحميل...</div>;

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="container-page text-center py-12">
        <h2 className="text-2xl font-bold mb-4">سلة التسوق فارغة</h2>
        <p className="text-gray-500 mb-6">لم تقم بإضافة أي منتجات إلى سلة التسوق بعد.</p>
        <Link href="/" className="btn btn-primary">
          تصفح المتاجر
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page">
      <h1 className="text-2xl font-bold mb-6">سلة التسوق</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="card divide-y">
            {cart.items.map((item: any) => (
              <div key={item.id} className="flex items-center gap-4 p-4">
                <img
                  src={item.product.images?.[0]?.url || '/placeholder.png'}
                  alt={item.product.name}
                  className="w-20 h-20 object-cover rounded"
                />
                <div className="flex-1">
                  <Link href={`/products/${item.product.id}`} className="font-medium">
                    {item.product.name}
                  </Link>
                  <p className="text-sm text-gray-500">{item.product.store?.name}</p>
                  <p className="text-sm font-bold text-primary-600">
                    {formatPrice(item.product.price * item.quantity)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity.mutate({ productId: item.product.id, quantity: item.quantity - 1 })}
                    disabled={updateQuantity.isPending || item.quantity <= 1}
                    className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity.mutate({ productId: item.product.id, quantity: item.quantity + 1 })}
                    disabled={updateQuantity.isPending}
                    className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-100"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeFromCart.mutate(item.product.id)}
                    disabled={removeFromCart.isPending}
                    className="text-red-600 hover:text-red-800"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="card p-6">
            <h3 className="font-bold mb-4">ملخص الطلب</h3>
            <div className="flex justify-between mb-3">
              <span>المجموع الفرعي:</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between mb-3">
              <span>رسوم التوصيل:</span>
              <span>{deliveryFee === 0 ? 'مجاناً' : formatPrice(deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold mb-6">
              <span>الإجمالي:</span>
              <span className="text-primary-600">{formatPrice(total)}</span>
            </div>
            <button
              onClick={() => router.push('/checkout')}
              className="btn btn-primary w-full py-3"
            >
              الانتقال إلى الدفع
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}