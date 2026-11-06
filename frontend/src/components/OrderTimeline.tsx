import React from 'react';

interface OrderStatusHistory {
  status: string;
  changedBy: string;
  note: string;
  createdAt: string;
}

const STATUS_ORDER = ['NEW', 'ACCEPTED_BY_MERCHANT', 'PREPARING', 'READY_FOR_PICKUP', 'ASSIGNED_TO_DRIVER', 'ON_THE_WAY', 'DELIVERED'];

interface OrderTimelineProps {
  statusHistory: OrderStatusHistory[];
  currentStatus: string;
}

export const OrderTimeline = ({ statusHistory, currentStatus }: OrderTimelineProps) => {
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      NEW: 'مراجعة',
      ACCEPTED_BY_MERCHANT: 'مقبول',
      PREPARING: 'يُجهّز',
      READY_FOR_PICKUP: 'جاهز للاستلام',
      ASSIGNED_TO_DRIVER: 'مُوجّه للسائق',
      ON_THE_WAY: 'في الطريق',
      DELIVERED: 'تمت التوصيل',
      REJECTED_BY_MERCHANT: 'مرفوض',
      CANCELLED_BY_CUSTOMER: 'ملغى',
      DELIVERY_FAILED: 'فشل التوصيل',
    };
    return labels[status] || status;
  };

  const getCurrentIndex = () => STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className="card p-6">
      <h3 className="font-bold mb-4">تتبع الطلب</h3>

      <div className="relative">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          {STATUS_ORDER.map((s, idx) => (
            <span key={s} className={idx <= getCurrentIndex() ? 'text-primary-600 font-medium' : ''}>
              {getStatusLabel(s)}
            </span>
          ))}
        </div>

        <div className="relative">
          <div className="absolute top-4 left-0 right-0 h-2 bg-gray-200"></div>
          <div
            className="absolute top-4 left-0 h-2 bg-primary-600 transition-all duration-300"
            style={{ width: `${(getCurrentIndex() + 1) / (STATUS_ORDER.length - 1) * 100}%` }}
          ></div>
        </div>

        <div className="flex justify-between mt-6 text-sm">
          {statusHistory.map((history) => (
            <div key={history.status} className="text-center">
              <div className="bg-primary-50 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-1">
                <span className="text-primary-600 font-bold text-xs">
                  {STATUS_ORDER.indexOf(history.status) + 1}
                </span>
              </div>
              <p className="text-xs text-gray-600">{getStatusLabel(history.status)}</p>
              <p className="text-xs text-gray-400">{new Date(history.createdAt).toLocaleDateString('ar-EG')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};