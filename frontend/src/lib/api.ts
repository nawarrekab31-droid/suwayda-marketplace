const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Address {
  id: string;
  label: string;
  area: string;
  street: string;
  notes?: string;
  lat?: number;
  lng?: number;
}

export interface ProductImage {
  id: string;
  url: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isAvailable: boolean;
  images: ProductImage[];
  store: { name: string };
  category: { name: string } | null;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  parentId: string | null;
  children: Category[];
}

export interface Offer {
  id: string;
  title: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  startsAt: string;
  endsAt: string;
  store: { name: string };
  product: Pick<Product, 'id' | 'name' | 'price' | 'images'> | null;
}

export type OrderStatus =
  | 'NEW'
  | 'ACCEPTED_BY_MERCHANT'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'ASSIGNED_TO_DRIVER'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'REJECTED_BY_MERCHANT'
  | 'CANCELLED_BY_CUSTOMER'
  | 'DELIVERY_FAILED';

export interface OrderStatusHistory {
  id: string;
  status: OrderStatus;
  changedBy: string;
  note: string | null;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  nameSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
}

export interface Order {
  id: string;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  notes: string | null;
  createdAt: string;
  addressSnapshot: {
    area: string;
    street: string;
    notes: string | null;
  };
  store: { name: string } | null;
  customer: { name: string; phone: string } | null;
  items: OrderItem[];
  statusHistory: OrderStatusHistory[];
}

export interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    images: { url: string }[];
    store: { name: string } | null;
  };
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface Delivery {
  id: string;
  status: 'ASSIGNED' | 'PICKED_UP' | 'DELIVERED' | 'FAILED';
  pickedAt: string | null;
  deliveredAt: string | null;
  order: Pick<Order, 'id' | 'status' | 'total' | 'paymentMethod' | 'addressSnapshot' | 'store' | 'customer'>;
}

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
    return fetch(`${API_BASE}/categories?${qs}`)
      .then((res) => handleResponse<Category[]>(res));
  },

  getCategoryById: (id: string) =>
    fetch(`${API_BASE}/categories/${id}`)
      .then((res) => handleResponse<Category>(res)),

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
    return fetch(`${API_BASE}/products?${qs}`)
      .then((res) => handleResponse<Product[]>(res));
  },

  getProductById: (id: string) =>
    fetch(`${API_BASE}/products/${id}`)
      .then((res) => handleResponse<Product>(res)),

  // Offers
  getOffers: (params?: { page?: number; limit?: number; storeId?: string; productId?: string; isActive?: boolean }) => {
    const qs = new URLSearchParams(params as any).toString();
    return fetch(`${API_BASE}/offers?${qs}`)
      .then((res) => handleResponse<Offer[]>(res));
  },

  // Cart
  getCart: (): Promise<Cart> =>
    fetch(`${API_BASE}/cart`, { headers: getAuthHeaders() })
      .then((res) => handleResponse<Cart>(res)),

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

  getOrders: (): Promise<Order[]> =>
    fetch(`${API_BASE}/orders`, { headers: getAuthHeaders() })
      .then((res) => handleResponse<Order[]>(res)),

  getOrderById: (id: string): Promise<Order> =>
    fetch(`${API_BASE}/orders/${id}`, { headers: getAuthHeaders() })
      .then((res) => handleResponse<Order>(res)),

  updateOrderStatus: (id: string, status: string, note?: string) =>
    fetch(`${API_BASE}/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ status, note }),
    }).then(handleResponse),

  // Deliveries
  getMyDeliveries: (): Promise<Delivery[]> =>
    fetch(`${API_BASE}/deliveries/my`, { headers: getAuthHeaders() })
      .then((res) => handleResponse<Delivery[]>(res)),

  getDeliveryById: (id: string) =>
    fetch(`${API_BASE}/deliveries/${id}`, { headers: getAuthHeaders() }).then(handleResponse),

  updateDeliveryStatus: (id: string, status: string) =>
    fetch(`${API_BASE}/deliveries/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ status }),
    }).then(handleResponse),

  // Notifications
  getNotifications: (): Promise<Notification[]> =>
    fetch(`${API_BASE}/notifications`, { headers: getAuthHeaders() })
      .then((res) => handleResponse<Notification[]>(res)),

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
  getAddresses: (): Promise<Address[]> =>
    fetch(`${API_BASE}/addresses`, { headers: getAuthHeaders() })
      .then((res) => handleResponse<Address[]>(res)),

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