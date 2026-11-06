'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api, formatPrice } from '@/lib/api';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [isClient, setIsClient] = useState(false);
  React.useEffect(() => { setIsClient(true); }, []);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', params.id],
    queryFn: () => api.getProductById(params.id),
    enabled: isClient && !!params.id,
  });

  const addToCartMutation = useMutation({
    mutationFn: () => api.addToCart(params.id, quantity),
    onSuccess: () => {
      setMessage('تمت الإضافة إلى السلة بنجاح!');
      setTimeout(() => setMessage(''), 3000);
    },
    onError: (err: any) => {
      setMessage(err.message || 'حدث خطأ أثاني الإضافة');
    },
  });

  if (isLoading) return <div className="container-page">جاري التحميل...</div>;
  if (!product) return <div className="container-page">المنتج غير موجود</div>;

  return (
    <div className="container-page">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="card overflow-hidden mb-4">
            <img
              src={product.images?.[selectedImage]?.url || '/placeholder.png'}
              alt={product.name}
              className="w-full h-80 object-cover"
            />
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img: any, idx: number) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(idx)}
                  className={`border-2 rounded overflow-hidden w-16 h-16 ${selectedImage === idx ? 'border-primary-600' : 'border-transparent'}`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
          <p className="text-sm text-gray-500 mb-4">المتجر: {product.store?.name}</p>

          <div className="text-2xl font-bold text-primary-600 mb-6">
            {formatPrice(product.price)}
          </div>

          {product.description && (
            <p className="text-gray-700 mb-6 whitespace-pre-line">{product.description}</p>
          )}

          <div className="flex items-center gap-4 mb-6">
            <label className="label mb-0">الكمية:</label>
            <div className="flex items-center border rounded">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-1 hover:bg-gray-100"
              >
                -
              </button>
              <span className="px-4 py-1">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-1 hover:bg-gray-100"
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={() => addToCartMutation.mutate()}
            disabled={addToCartMutation.isPending || !product.isAvailable}
            className="btn btn-primary w-full py-3 text-lg"
          >
            {addToCartMutation.isPending ? 'جاري الإضافة...' : 'إضافة إلى السلة 🛒'}
          </button>

          {message && <p className="mt-4 text-center font-medium text-green-600">{message}</p>}
        </div>
      </div>
    </div>
  );
}