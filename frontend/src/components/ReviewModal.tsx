'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface ReviewModalProps {
  orderId: string;
  storeName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ReviewModal = ({ orderId, storeName, isOpen, onClose, onSuccess }: ReviewModalProps) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const submitMutation = useMutation({
    mutationFn: (data: { storeRating: number; comment?: string }) =>
      fetch('http://localhost:5000/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ orderId, storeId: null, storeRating: data.storeRating, comment: data.comment }),
      }).then(res => res.json()),
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="card w-full max-w-md mx-4 p-6">
        <h2 className="text-xl font-bold mb-4">قيّم المتجر</h2>
        <p className="text-gray-600 mb-4">المتجر: {storeName}</p>

        <div className="flex items-center gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} onClick={() => setRating(star)}>
              <svg
                className={`w-8 h-8 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="اكتب تعليقك (اختياري)..."
          className="input"
          rows={3}
          placeholder="اكتب تعليقك..."
        />

        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="btn btn-secondary flex-1">
            إلغاء
          </button>
          <button
            onClick={() => submitMutation.mutate({ storeRating: rating, comment })}
            disabled={submitMutation.isPending}
            className="btn btn-primary flex-1"
          >
            {submitMutation.isPending ? 'جاري الإرسال...' : 'إرسال التقييم'}
          </button>
        </div>
      </div>
    </div>
  );
};