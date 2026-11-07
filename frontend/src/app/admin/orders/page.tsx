'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { StatusBadge } from '@/components/StatusBadge';
import { api, formatPrice } from '@/lib/api';

export default function AdminOrdersPage() {
  const [isClient, setIsClient] = useState(false);
  React.useEffect(() => { setIsClient(true); }, []);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => api.getOrders(),
    enabled: isClient,
    retry: false,
  });

  if (!isClient) return <div className="container-page">جاري التحميل...</div>;
  if (isLoading) return <div className="container-page">جاري تحميل...</div>;

  return (
    <div className="container-page">
      <h1 className="text-2xl font-bold mb-6">جميعูลات</h1>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-start p-3">الطلب</th>
              <th className="text-start p-3">العميل</th>
              <th className="text-start p-3">المتجر</th>
              <th className="text-start p-3">الحالة</th>
              <th className="text-start p-3">الإجمالي</th>
              <th className="text-start p-3">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {(orders || []).map((order: any) => (
              <tr key={order.id} className="border-b hover:bg-gray-50">
                <td className="p-3">#{order.id.slice(0, 8)}...</td>
                <td className="p-3">{order.customer?.name || 'غير معروف'}</td>
                <td className="p-3">{order.store?.name || '-'}</td>
                <td className="p-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="p-3">{formatPrice(order.total)}</td>
                <td className="p-3">
                  {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}