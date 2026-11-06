'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api, formatPrice } from '@/lib/api';

interface Address {
  id: string;
  label: string;
  area: string;
  street: string;
  notes?: string;
}

export default function CheckoutPage() {
  const [isClient, setIsClient] = useState(false);
  React.useEffect(() => { setIsClient(true); }, []);

  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [customAddress, setCustomAddress] = useState<Omit<Address, 'id'>>({ label: '', area: '', street: '', notes: '' });
  const [newAddressMode, setNewAddressMode] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH_ON_DELIVERY' | 'SYRIATEL_CASH' | 'SHAM_CASH' | 'MTN_CASH'>('CASH_ON_DELIVERY');

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => api.getCart(),
    enabled: isClient,
  });

  const { data: addresses, isLoading: addressesLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => api.getAddresses(),
    enabled: isClient,
  });

  const createAddressMutation = useMutation({
    mutationFn: (data: Omit<Address, 'id'>) => api.createAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setNewAddressMode(false);
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: (data: { addressId: string; paymentMethod: string; notes?: string }) =>
      api.createOrder(data),
    onSuccess: (result: any) => {
      const order = result.subOrders?.[0] || result;
      router.push(`/orders/${order.id || order.parentOrderId || 'new'}`);
    },
  });

  const subtotal = cart?.subtotal || 0;
  const deliveryFee = subtotal > 50000 ? 0 : 5000;
  const total = subtotal + deliveryFee;

  const handleSubmit = () => {
    if (!selectedAddress && !newAddressMode) return;

    if (newAddressMode) {
      createAddressMutation.mutate(customAddress, {
        onSuccess: (newAddr: any) => {
          createOrderMutation.mutate({
            addressId: newAddr.id,
            paymentMethod,
          });
        },
      });
    } else {
      createOrderMutation.mutate({
        addressId: selectedAddress!,
        paymentMethod,
      });
    }
  };

  if (!isClient) return <div className="container-page">جاري التحميل...</div>;

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="container-page text-center py-12">
        <h2 className="text-2xl font-bold mb-4">سلة التسواب فارغة</h2>
        <Link href="/" className="btn btn-primary">
          تصفح المتاجر
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page">
      <h1 className="text-2xl font-bold mb-6">إتمام الطلب</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="card p-6 mb-6">
            <h3 className="font-bold mb-4">اختر عنوان التوصيل</h3>

            {addressesLoading ? (
              <p>جاري التحميل...</p>
            ) : (
              <>
                {addresses && addresses.length > 0 && (
                  <>
                    <div className="space-y-3 mb-4">
                      {addresses.map((addr: Address) => (
                        <label key={addr.id} className="flex items-start gap-3 p-3 border rounded cursor-pointer">
                          <input
                            type="radio"
                            checked={selectedAddress === addr.id}
                            onChange={() => setSelectedAddress(addr.id)}
                            className="mt-1"
                          />
                          <div>
                            <p className="font-medium">{addr.label}</p>
                            <p className="text-sm text-gray-500">{addr.area}، {addr.street}</p>
                          </div>
                        </label>
                      ))}
                    </div>

                    <button
                      onClick={() => setNewAddressMode(!newAddressMode)}
                      className="btn btn-outline w-full"
                    >
                      {newAddressMode ? 'إلغاء' : '+ إضافة عنوان جديد'}
                    </button>
                  </>
                )}

                {newAddressMode && (
                  <div className="mt-4 space-y-3">
                    <input
                      type="text"
                      placeholder="اسم العنوان (مثل: منزل، محل...)"
                      value={customAddress.label}
                      onChange={(e) => setCustomAddress({ ...customAddress, label: e.target.value })}
                      className="input"
                    />
                    <input
                      type="text"
                      placeholder="الحي"
                      value={customAddress.area}
                      onChange={(e) => setCustomAddress({ ...customAddress, area: e.target.value })}
                      className="input"
                    />
                    <input
                      type="text"
                      placeholder="الشارع"
                      value={customAddress.street}
                      onChange={(e) => setCustomAddress({ ...customAddress, street: e.target.value })}
                      className="input"
                    />
                    <textarea
                      placeholder="ملاحظات (اختيارية)"
                      value={customAddress.notes}
                      onChange={(e) => setCustomAddress({ ...customAddress, notes: e.target.value })}
                      className="input"
                      rows={2}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          <div className="card p-6 mb-6">
            <h3 className="font-bold mb-4">طريقة الدفع</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border rounded cursor-pointer">
                <input
                  type="radio"
                  checked={paymentMethod === 'CASH_ON_DELIVERY'}
                  onChange={() => setPaymentMethod('CASH_ON_DELIVERY')}
                />
                <span>الدفع عند التوصيل</span>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded cursor-pointer opacity-50">
                <input type="radio" disabled />
                <span>سندات شاملة ⏳ قريباً</span>
              </label>
            </div>
          </div>
        </div>

        <div>
          <div className="card p-6">
            <h3 className="font-bold mb-4">ملخص الطلب</h3>

            <div className="border divide-y mb-4">
              {cart.items?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 py-2">
                  <img src={item.product.images?.[0]?.url || '/placeholder.png'} alt="" className="w-12 h-12 object-cover rounded" />
                  <div className="flex-1">
                    <p className="text-sm">{item.product.name}</p>
                    <p className="text-xs text-gray-500">كمية: {item.quantity}</p>
                  </div>
                  <p className="font-medium">{formatPrice(item.product.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-between mb-2">
              <span>المجموع الفرعي:</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between mb-3">
              <span>رسوم التوصيل:</span>
              <span>{deliveryFee === 0 ? 'مجاناً' : formatPrice(deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-3 mb-4">
              <span>الإجمالي:</span>
              <span className="text-primary-600">{formatPrice(total)}</span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={createOrderMutation.isPending || (!selectedAddress && !newAddressMode)}
              className="btn btn-primary w-full py-3"
            >
              {createOrderMutation.isPending ? 'جاري تقديم الطلب...' : 'تأكيد الطلب 🛒'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}