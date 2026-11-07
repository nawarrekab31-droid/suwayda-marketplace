'use client';

import React, { useEffect, useState } from 'react';
import { Badge, Loader2, X, Shield, UserPlus, Folder, Settings, Calendar, Truck, Star, ClipboardList, CheckCircle, LogOut, LogIn } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/zod';
import { useRouter } from 'next/navigation';

export default function MerchantDashboard() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      return data.user;
    },
    enabled: isClient,
  });

  const router = useRouter();

  if (!user) {
    if (isClient) {
      return <button onClick={() => router.push('/login')}> تسجيل الدخول</button>;
    }
    return <div>جاري التحميل...</div>;
  }

  // Tab state
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'profile' | 'offers' | 'hours'>('products');

  // Products tab
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['merchant-products'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const res = await fetch('/api/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    enabled: isClient && !!user?.role && user.role === 'MERCHANT',
  });

  // Orders tab
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['merchant-orders'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    enabled: isClient && !!user?.role && user.role === 'MERCHANT',
  });

  // Profile tab state
  const [profileForm] = useForm({
    defaultValues: {
      name: user?.name || '',
      description: '',
      address: '',
      phone: '',
      workingHours: {
        open: '09:00',
        close: '21:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      },
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <h1 className="text-2xl font-bold">مرحباً، {user?.name}</h1>
          <div className="flex items-center gap-3">
            <Badge className="text-sm">
              {user?.role === 'MERCHANT' ? 'تاجر' : 'عميل'}
            </Badge>
            <div>
              <p className="text-sm text-gray-600">{user?.phone}</p>
              <button
                onClick={() => router.push('/login')}
                className="text-xs text-red-600 hover:underline"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <button
          onClick={() => setActiveTab('products')}
          className={activeTab === 'products' ? 'bg-primary-100 text-primary-700 px-4 py-2 rounded' : 'text-gray-500 hover:text-primary-600 px-4 py-2'}
        >
          المنتجات ({products?.data?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={activeTab === 'orders' ? 'bg-primary-100 text-primary-700 px-4 py-2 rounded' : 'text-gray-500 hover:text-primary-600 px-4 py-2'}
        >
          الطلبات ({orders?.data?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={activeTab === 'profile' ? 'bg-primary-100 text-primary-700 px-4 py-2 rounded' : 'text-gray-500 hover:text-primary-600 px-4 py-2'}
        >
          الملف الشخصي
        </button>
        <button
          onClick={() => setActiveTab('offers')}
          className={activeTab === 'offers' ? 'bg-primary-100 text-primary-700 px-4 py-2 rounded' : 'text-gray-500 hover:text-primary-600 px-4 py-2'}
        >
          العروض ({products?.data?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('hours')}
          className={activeTab === 'hours' ? 'bg-primary-100 text-primary-700 px-4 py-2 rounded' : 'text-gray-500 hover:text-primary-600 px-4 py-2'}
        >
          أوقات العمل
        </button>
      </div>

      {/* Content */}
      <div className="mt-6 max-w-7xl mx-auto px-4">
        {activeTab === 'products' && (
          <div>
            <h2 className="mb-4 text-xl font-bold">إدارة المنتجات</h2>
            {productsLoading ? (
              <p>جاري التحميل...</p>
            ) : products.data && products.data.length === 0 ? (
              <p>لا توجد منتجات بعد. أضف منتجاً جديداً.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اسم المنتج</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السعر (ل.س)</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المخزون</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التصنيف</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.data.map((product: any) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{product.price} ل.س</td>
                        <td className="px-6 py-4 whitespace-nowrap">{product.stock}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{product.category?.name || 'غير مصنف'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-primary-600 hover:text-primary-900 mr-3">تعديل</button>
                          <button className="text-red-600 hover:text-red-900">حذف</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <h2 className="mb-4 text-xl font-bold">إدارة الطلبات</h2>
            {ordersLoading ? (
              <p>جاري التحميل...</p>
            ) : orders.data && orders.data.length === 0 ? (
              <p>لا توجد طلبات حتى الآن.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">معرف الطلب</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">العميل</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المخزن</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.data.map((order: any) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{order.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{order.customer?.name || 'غير معروف'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{order.store?.name || 'غير معروف'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-primary-600 hover:text-primary-900">عرض التفاصيل</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div>
            <h2 className="mb-4 text-xl font-bold">تحديث الملف الشخصي</h2>
            <form
              onSubmit={async (e: React.FormEvent) => {
                e.preventDefault();
                // TODO: Submit profile update
                router.push('/merchant');
              }}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="label">اسم المتجر</label>
                  <input
                    className="input"
                    type="text"
                    defaultValue={profileForm.watch('name')}
                    disabled={true}
                  />
                </div>
                <div>
                  <label className="label">الوصف</label>
                  <textarea
                    className="input"
                    defaultValue={profileForm.watch('description')}
                    rows={3}
                    disabled={true}
                  />
                </div>
                <div>
                  <label className="label">ساعات العمل</label>
                  <p className="text-sm text-gray-500">
                    من {profileForm.watch('workingHours').open} إلى {profileForm.watch('workingHours').close}
                  </p>
                </div>
              </div>
              <button
                type="submit"
                className="mt-4 btn btn-primary"
              >
                حفظ التغييرات
              </button>
            </form>
          </div>
        )}

        {activeTab === 'offers' && (
          <div>
            <h2 className="mb-4 text-xl font-bold">إدارة العروض</h2>
            <p>الصفحة قيد الإنشاء.</p>
          </div>
        )}

        {activeTab === 'hours' && (
          <div>
            <h2 className="mb-4 text-xl font-bold">تحديث أوقات العمل</h2>
            <form
              onSubmit={async (e: React.FormEvent) => {
                e.preventDefault();
                // TODO: Submit hours update
                router.push('/merchant');
              }}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="label">وقت الافتتاح</label>
                  <input
                    className="input"
                    type="time"
                    defaultValue="09:00"
                  />
                </div>
                <div>
                  <label className="label">وقت الإغلاق</label>
                  <input
                    className="input"
                    type="time"
                    defaultValue="21:00"
                  />
                </div>
                <div>
                  <label className="label">أيام العمل</label>
                  <p className="text-sm text-gray-500">
                    {profileForm.watch('workingHours').days.map((d: string) => (
                      <span key={d} className="mx-1 bg-gray-100 px-2 rounded text-xs">
                        {d === 'monday' && 'الاثنين'}{' '}{'thursday' && 'الخميس'}{' '}{'friday' && 'الجمعة'}{' '}{'saturday' && 'السبت'}
                      </span>
                    ))}
                  </p>
                </div>
              </div>
              <button
                type="submit"
                className="mt-4 btn btn-primary"
              >
                حفظ التغييرات
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}