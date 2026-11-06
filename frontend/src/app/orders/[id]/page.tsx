'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { OrderTimeline } from '@/components/OrderTimeline';
import { StatusBadge } from '@/components/StatusBadge';
import { ReviewModal } from '@/components/ReviewModal';
import { api, formatPrice } from '@/lib/api';

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const [isClient, setIsClient] = useState(false);
  React.useEffect(() => { setIsClient(true); }, []);

  const router = useRouter();
  const [showReview, setShowReview] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', params.id],
    queryFn: () => api.getOrderById(params.id),
    enabled: isClient && !!params.id,
  });

  const cancelOrder = useMutation({
    mutationFn: (note?: string) => api.updateOrderStatus(params.id, 'CANCELLED_BY_CUSTOMER', note),
    onSuccess: () => router.push('/orders'),
  });

  const updateStatus = useMutation({
    mutationFn: (status: string, note?: string) => api.updateOrderStatus(params.id, status, note),
  });

  if (!isClient) return <div className="container-page">جاري التحميل...</div>;
  if (isLoading) return <div className="container-page">جاري تحميل الطلب...</div>;
  if (!order) return <div className="container-page">الطلب غير موجود</div>;

  const canCancel = ['NEW', 'ACCEPTED_BY_MERCHANT'].includes(order.status);
  const canReview = order.status === 'DELIVERED';
  const canAccept = order.status === 'NEW';
  const canPrepare = order.status === 'ACCEPTED_BY_MERCHANT';
  const canReady = order.status === 'PREPARING';
  const canOnTheWay = order.status === 'ASSIGNED_TO_DRIVER';
  const canDeliver = order.status === 'ON_THE_WAY';

  return (
    <div className="container-page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">طلب #{order.id.slice(0, 8)}...</h1>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-bold mb-4">البيانات</h3>
          <div className="space-y-3 text-sm">
            <p>المتجر: <span className="font-medium">{order.store?.name || 'غير معروف'}</span></p>
            <p>العميل: <span className="font-medium">{order.customer?.name || 'غير معروف'}</span></p>
            <p>عنوان التوصيل: {order.addressSnapshot?.area}، {order.addressSnapshot?.street}</p>
            <p>طريقة الدفع: {order.paymentMethod}</p>
            <p>ملاحظات: {order.notes || 'لا توجد ملاحظات'}</p>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-bold mb-4">العناصر</h3>
          <div className="divide-y">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between py-2">
                <div>
                  <p className="text-sm font-medium">{item.nameSnapshot}</p>
                  <p className="text-xs text-gray-500">كمية: {item.quantity}</p>
                </div>
                <p className="text-sm font-medium">{formatPrice(item.unitPriceSnapshot * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="border-t mt-3 pt-3">
            <div className="flex justify-between text-sm">
              <span>المجموع الفرعي:</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>رسوم التوصيل:</span>
              <span>{formatPrice(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between font-bold mt-2">
              <span>الإجمالي:</span>
              <span className="text-primary-600">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {order.statusHistory && (
        <div className="card p-6 mt-6">
          <OrderTimeline statusHistory={order.statusHistory} currentStatus={order.status} />
        </div>
      )}

      <div className="flex flex-wrap gap-3 mt-6">
        {canAccept && (
          <button
            onClick={() => updateStatus.mutate('ACCEPTED_BY_MERCHANT', 'تم قبول الطلب')}
            className="btn btn-primary"
          >
            قبول الطلب
          </button>
        )}
        {canPrepare && (
          <button
            onClick={() => updateStatus.mutate('PREPARING', 'يتم تجهيز الطلب')}
            className="btn btn-primary"
          >
            بدء التجهيز
          </button>
        )}
        {canReady && (
          <button
            onClick={() => updateStatus.mutate('READY_FOR_PICKUP', 'الطلب جاهز للاستلام')}
            className="btn btn-primary"
          >
            جاهز للاستلام
          </button>
        )}
        {canOnTheWay && (
          <button
            onClick={() => updateStatus.mutate('ON_THE_WAY', 'في طريق التوصيل')}
            className="btn btn-primary"
          >
            في طريق التوصيل
          </button>
        )}
        {canDeliver && (
          <button
            onClick={() => updateStatus.mutate('DELIVERED', 'تم التوصيل')}
            className="btn btn-primary"
          >
            توصيل الطلب
          </button>
        )}
        {canCancel && (
          <button
            onClick={() => cancelOrder.mutate('تم إلغاء الطلب من قبل العميل')}
            className="btn bg-red-600 text-white hover:bg-red-700"
          >
            إلغاء الطلب
          </button>
        )}
        {canReview && (
          <button
            onClick={() => setShowReview(true)}
            className="btn btn-secondary"
          >
            تقييم المتجر
          </button>
        )}
      </div>

      <ReviewModal
        orderId={order.id}
        storeName={order.store?.name || ''}
        isOpen={showReview}
        onClose={() => setShowReview(false)}
      />
    </div>
  );
}