'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OrderTimeline } from '@/components/OrderTimeline';
import { StatusBadge } from '@/components/StatusBadge';
import { api, formatPrice } from '@/lib/api';

export default function MerchantOrdersPage() {
  const [isClient, setIsClient] = useState(false);
  React.useEffect(() => { setIsClient(true); }, []);

  const router = useRouter();
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['merchant-orders'],
    queryFn: () => api.getOrders(),
    enabled: isClient,
    retry: false,
  });

  if (!isClient) return <div className="container-page">جاري التحميل...</div>;

  if (!orders || orders.length === 0) {
    return (
      <div className="container-page">
        <h1 className="text-2xl font-bold mb-6">طلبات المتجر</h1>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">لا توجد طلبات حتى الآن.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page">
      <h1 className="text-2xl font-bold mb-6">طلبات المتجر</h1>

      <div className="space-y-4">
        {orders.map((order: any) => (
          <div key={order.id} className="card">
            <div onClick={() => setShowDetails(showDetails === order.id ? null : order.id)} className="p-4 flex justify-between items-center cursor-pointer">
              <div>
                <h3 className="font-bold">طلب #{order.id.slice(0, 8)}...</h3>
                <p className="text-sm text-gray-500">
                  العميل: {order.customer?.name || 'غير معروف'}
                </p>
              </div>
              <div className="text-left">
                <StatusBadge status={order.status} />
                <p className="text-sm font-bold mt-1">{formatPrice(order.total)}</p>
              </div>
            </div>

            {showDetails === order.id && (
              <div className="px-4 pb-4 border-t">
                {order.statusHistory && (
                  <OrderTimeline statusHistory={order.statusHistory} currentStatus={order.status} />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}