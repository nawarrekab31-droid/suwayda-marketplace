import React from 'react';

interface StatusBadgeProps {
  status: string;
  showLabel?: boolean;
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  NEW: { color: 'bg-yellow-100 text-yellow-800', label: 'جديد' },
  ACCEPTED_BY_MERCHANT: { color: 'bg-blue-100 text-blue-800', label: 'مقبول' },
  PREPARING: { color: 'bg-purple-100 text-purple-800', label: 'يُجهّز' },
  READY_FOR_PICKUP: { color: 'bg-indigo-100 text-indigo-800', label: 'جاهز للاستلام' },
  ASSIGNED_TO_DRIVER: { color: 'bg-cyan-100 text-cyan-800', label: 'مُوجّه للسائق' },
  ON_THE_WAY: { color: 'bg-emerald-100 text-emerald-800', label: 'في الطريق' },
  DELIVERED: { color: 'bg-green-100 text-green-800', label: 'تمت التوصيل' },
  REJECTED_BY_MERCHANT: { color: 'bg-red-100 text-red-800', label: 'مرفوض' },
  CANCELLED_BY_CUSTOMER: { color: 'bg-gray-100 text-gray-800', label: 'ملغى' },
  DELIVERY_FAILED: { color: 'bg-red-100 text-red-800', label: 'فشل التوصيل' },
};

export const StatusBadge = ({ status, showLabel = true }: StatusBadgeProps) => {
  const config = STATUS_CONFIG[status] || { color: 'bg-gray-100 text-gray-800', label: status };

  return (
    <span className={`px-3 py-1 text-xs rounded-full font-medium ${config.color}`}>
      {showLabel ? config.label : status}
    </span>
  );
};