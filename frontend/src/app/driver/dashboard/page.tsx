'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { StatusBadge } from '@/components/StatusBadge';
import { api, formatPrice } from '@/lib/api';

export default function DriverDashboardPage() {
  const [isClient, setIsClient] = useState(false);
  React.useEffect(() => { setIsClient(true); }, []);

  const { data: deliveries, isLoading } = useQuery({
    queryKey: ['my-deliveries'],
    queryFn: () => api.getMyDeliveries(),
    enabled: isClient,
    retry: false,
  });

  const updateStatus = useMutation({
    mutationFn: (data: { id: string; status: string }) =>
      api.updateDeliveryStatus(data.id, data.status),
  });

  if (!isClient) return <div className="container-page">جاري التحميل...</div>;
  if (isLoading) return <div className="container-page">جاري تحميل التوصيلات...</div>;

  if (!deliveries || deliveries.length === 0) {
    return (
      <div className="container-page">
        <h1 className="text-2xl font-bold mb-6">لوحة السائق</h1>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">لا توجد توصيلات مُخصصة لك حتى الآن.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page">
      <h1 className="text-2xl font-bold mb-6">لوحة السائق</h1>

      <div className="space-y-4">
        {deliveries.map((delivery: any) => {
          const order = delivery.order;
          if (!order) return null;

          const canPickup = delivery.pickedAt === null && delivery.deliveredAt === null;
          const canDeliver = delivery.pickedAt !== null && delivery.deliveredAt === null;
          const canFail = delivery.deliveredAt === null;

          return (
            <div key={delivery.id} className="card p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold">طلب #{order.id.slice(0, 8)}...</h3>
                  <p className="text-sm text-gray-500">
                    المتجر: {order.store?.name || 'غير معروف'}
                  </p>
                  <p className="text-sm text-gray-500">
                    العميل: {order.customer?.name || 'غير معروف'}
                  </p>
                </div>
                <div className="text-start">
                  <StatusBadge status={order.status} />
                  <p className="text-sm font-bold mt-1">{formatPrice(order.total)}</p>
                </div>
              </div>

              <div className="text-sm space-y-1 mb-4">
                <p>عنوان التوصيل: {order.addressSnapshot?.area}، {order.addressSnapshot?.street}</p>
                <p>طريقة الدفع: {order.paymentMethod}</p>
                {delivery.pickedAt && (
                  <p>تم الاستلام: {new Date(delivery.pickedAt).toLocaleString('ar-EG')}</p>
                )}
                {delivery.deliveredAt && (
                  <p>تم التوصيل: {new Date(delivery.deliveredAt).toLocaleString('ar-EG')}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {canPickup && (
                  <button
                    onClick={() => updateStatus.mutate({ id: delivery.id, status: 'PICKED_UP' })}
                    className="btn btn-primary text-sm"
                  >
                    استلام الطلب
                  </button>
                )}
                {canDeliver && (
                  <button
                    onClick={() => updateStatus.mutate({ id: delivery.id, status: 'DELIVERED' })}
                    className="btn btn-primary text-sm"
                  >
                    توصيل الطلب
                  </button>
                )}
                {canFail && (
                  <button
                    onClick={() => updateStatus.mutate({ id: delivery.id, status: 'FAILED' })}
                    className="btn bg-red-600 text-white hover:bg-red-700 text-sm"
                  >
                    فشل التوصيل
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}