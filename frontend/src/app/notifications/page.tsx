'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function NotificationsPage() {
  const [isClient, setIsClient] = useState(false);
  React.useEffect(() => { setIsClient(true); }, []);

  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications(),
    enabled: isClient,
    retry: false,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => refetch(),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => refetch(),
  });

  if (!isClient) return <div className="container-page">جاري التحميل...</div>;
  if (isLoading) return <div className="container-page">جاري تحميل الإشعارات...</div>;

  const unread = (notifications || []).filter((n: any) => !n.isRead);

  return (
    <div className="container-page">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">الإشعارات</h1>
        {unread.length > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="btn btn-outline text-sm"
          >
            {markAllRead.isPending ? 'جاري...' : 'تحديد كـ مُقرأ'}
          </button>
        )}
      </div>

      {unread.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm">
          {unread.length} إشعارات غير مُقرأة
        </div>
      )}

      {!notifications || notifications.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">لا توجد إشعارات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n: any) => (
            <div
              key={n.id}
              className={`card p-4 ${!n.isRead ? 'border-l-4 border-primary-500 bg-blue-50' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{n.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{n.body}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(n.createdAt).toLocaleString('ar-EG')}
                  </p>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => markRead.mutate(n.id)}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    تحديد كـ مُقرأ
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}