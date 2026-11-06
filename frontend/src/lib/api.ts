const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'حدث خطأ');
  }
  return data.data;
}

export const api = {
  // Auth
  login: (phone: string, password: string) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    }).then(handleResponse),

  registerMerchant: (data: any) =>
    fetch(`${API_BASE}/auth/register/merchant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),

  // Categories
  getCategories: (params?: { parentId?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return fetch(`${API_BASE}/categories?${qs}`).then(handleResponse);
  },

  getCategoryById: (id: string) =>
    fetch(`${API_BASE}/categories/${id}`).then(handleResponse),

  // Products
  getProducts: (params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    storeId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    isAvailable?: boolean;
  }) => {
    const qs = new URLSearchParams(params as any).toString();
    return fetch(`${API_BASE}/products?${qs}`).then(handleResponse);
  },

  getProductById: (id: string) =>
    fetch(`${API_BASE}/products/${id}`).then(handleResponse),

  // Offers
  getOffers: (params?: { page?: number; limit?: number; storeId?: string; productId?: string; isActive?: boolean }) => {
    const qs = new URLSearchParams(params as any).toString();
    return fetch(`${API_BASE}/offers?${qs}`).then(handleResponse);
  },

  // Cart
  getCart: () =>
    fetch(`${API_BASE}/cart`, { headers: getAuthHeaders() }).then(handleResponse),

  addToCart: (productId: string, quantity?: number) =>
    fetch(`${API_BASE}/cart/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ productId, quantity }),
    }).then(handleResponse),

  updateCartItem: (productId: string, quantity: number) =>
    fetch(`${API_BASE}/cart/update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ productId, quantity }),
    }).then(handleResponse),

  removeFromCart: (productId: string) =>
    fetch(`${API_BASE}/cart/remove`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ productId }),
    }).then(handleResponse),

  clearCart: () =>
    fetch(`${API_BASE}/cart/clear`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then(handleResponse),

  // Orders
  createOrder: (data: {
    addressId: string;
    paymentMethod: string;
    notes?: string;
  }) =>
    fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    }).then(handleResponse),

  getOrders: () =>
    fetch(`${API_BASE}/orders`, { headers: getAuthHeaders() }).then(handleResponse),

  getOrderById: (id: string) =>
    fetch(`${API_BASE}/orders/${id}`, { headers: getAuthHeaders() }).then(handleResponse),

  updateOrderStatus: (id: string, status: string, note?: string) =>
    fetch(`${API_BASE}/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ status, note }),
    }).then(handleResponse),

  // Deliveries
  getMyDeliveries: () =>
    fetch(`${API_BASE}/deliveries`, { headers: getAuthHeaders() }).then(handleResponse),

  getDeliveryById: (id: string) =>
    fetch(`${API_BASE}/deliveries/${id}`, { headers: getAuthHeaders() }).then(handleResponse),

  updateDeliveryStatus: (id: string, status: string) =>
    fetch(`${API_BASE}/deliveries/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ status }),
    }).then(handleResponse),

  // Notifications
  getNotifications: () =>
    fetch(`${API_BASE}/notifications`, { headers: getAuthHeaders() }).then(handleResponse),

  markNotificationRead: (id: string) =>
    fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    }).then(handleResponse),

  markAllNotificationsRead: () =>
    fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    }).then(handleResponse),

  // Addresses
  getAddresses: () =>
    fetch(`${API_BASE}/addresses`, { headers: getAuthHeaders() }).then(handleResponse),

  createAddress: (data: { label: string; area: string; street: string; notes?: string; lat?: number; lng?: number }) =>
    fetch(`${API_BASE}/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    }).then(handleResponse),

  updateAddress: (id: string, data: any) =>
    fetch(`${API_BASE}/addresses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    }).then(handleResponse),

  deleteAddress: (id: string) =>
    fetch(`${API_BASE}/addresses/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then(handleResponse),

  // Stores
  getStores: (params?: { page?: number; limit?: number; status?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return fetch(`${API_BASE}/stores?${qs}`).then(handleResponse);
  },
};

export function formatSYP(amount: number): string {
  return new Intl.NumberFormat('ar-SY', {
    style: 'currency',
    currency: 'SYP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPrice(amount: number): string {
  return `${new Intl.NumberFormat('ar-SY').format(amount)} ل.س`;
}