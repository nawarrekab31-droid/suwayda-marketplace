'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OrderTimeline } from '@/components/OrderTimeline';
import { StatusBadge } from '@/components/StatusBadge';
import { api, formatPrice } from '@/lib/api';

export default function OrdersPage() {
  const [isClient, setIsClient] = useState(false);
  React.useEffect(() => { setIsClient(true); }, []);

  const [showDetails, setShowDetails] = useState<string | null>(null);

  const router = useRouter();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.getOrders(),
    enabled: isClient,
    retry: false,
  });

  if (!isClient) return <div className="container-page">جاري التحميل...</div>;

  if (!orders || orders.length === 0) {
    return (
      <div className="container-page text-center py-12">
        <h2 className="text-2xl font-bold mb-4">لا توجد طلبات بعد</h2>
        <p className="text-gray-500 mb-6">لديك لا توجد طلبات حتى الآن.</p>
        <Link href="/" className="btn btn-primary">
          تصفح المتاجر
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page">
      <h1 className="text-2xl font-bold mb-6">طلباتي</h1>

      <div className="space-y-4">
        {orders.map((order: any) => (
          <div key={order.id} className="card">
            <div onClick={() => setShowDetails(showDetails === order.id ? null : order.id)} className="p-4 flex justify-between items-center cursor-pointer">
              <div>
                <h3 className="font-bold">طلب #{order.id.slice(0, 8)}...</h3>
                <p className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                </p>
              </div>
              <div className="text-left">
                <StatusBadge status={order.status} />
                <p className="text-sm font-bold mt-1">{formatPrice(order.total)}</p>
              </div>
            </div>

            {showDetails === order.id && (
              <div className="px-4 pb-4 border-t">
                <h4 className="font-medium mb-2">البيانات</h4>
                <div className="text-sm space-y-1">
                  <p>المتجر: {order.store?.name || 'غير معروف'}</p>
                  <p>عنوان التوصيل: {order.addressSnapshot?.area}، {order.addressSnapshot?.street}</p>
                  <p>طريقة الدفع: {order.paymentMethod}</p>
                  <p>عدد المنتجات: {order.items?.length || 0}</p>
                </div>

                {order.statusHistory && (
                  <OrderTimeline statusHistory={order.statusHistory} currentStatus={order.status} />
                )}

                <div className="mt-4">
                  <button
                    onClick={() => router.push(`/orders/${order.id}`)}
                    className="btn btn-outline text-sm"
                  >
                    عرض التفاصيل الكاملة
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}