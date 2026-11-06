'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Address {
  id: string;
  label: string;
  area: string;
  street: string;
  notes?: string;
}

export default function AddressesPage() {
  const [isClient, setIsClient] = useState(false);
  React.useEffect(() => { setIsClient(true); }, []);

  const queryClient = useQueryClient();

  const { data: addresses, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => api.getAddresses(),
    enabled: isClient,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteAddress(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  });

  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  if (!isClient) return <div className="container-page">جاري التحميل...</div>;

  return (
    <div className="container-page">
      <h1 className="text-2xl font-bold mb-6">عناويني</h1>

      {isLoading ? (
        <p>جاري التحميل...</p>
      ) : (
        <div className="space-y-4">
          {addresses?.map((addr: Address) => (
            <div key={addr.id} className="card p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{addr.label}</p>
                  <p className="text-sm text-gray-500">{addr.area}، {addr.street}</p>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(addr.id)}
                  disabled={deleteMutation.isPending}
                  className="text-red-600 hover:text-red-800"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}

          {addresses?.length === 0 && (
            <p className="text-center text-gray-500 py-8">لا توجد عناوين محفوظة</p>
          )}
        </div>
      )}
    </div>
  );
}