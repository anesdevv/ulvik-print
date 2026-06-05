const API_BASE = '/api';

async function request<T>(
  path: string,
  method: string = 'GET',
  body?: any,
  isMultipart: boolean = false
): Promise<T> {
  const token = sessionStorage.getItem('ulvic_token');
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = isMultipart ? body : JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${path}`, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export interface Product {
  id: string;
  name_en: string;
  name_fr: string;
  description_en?: string;
  description_fr?: string;
  price: number;
  category?: string;
  images: string[];
  sizes: string[];
  colors: Array<{ label: string; hex: string }>;
  in_stock: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  created_at: string;
  product_id?: string | null;
  product_name: string;
  size: string;
  color: string;
  customer_name: string;
  phone: string;
  wilaya: string;
  baladiya: string;
  delivery_type: 'home' | 'desk';
  delivery_fee: number;
  total_price: number;
  status: 'new' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
}

export interface DeliveryPrice {
  wilaya: string;
  fee: number;
}

export const api = {
  products: {
    list: () => request<Product[]>('/products'),
    get: (id: string) => request<Product>(`/products/${id}`),
    create: (data: Partial<Product>) => request<Product>('/products', 'POST', data),
    update: (id: string, data: Partial<Product>) => request<Product>(`/products/${id}`, 'PUT', data),
    delete: (id: string) => request<{ message: string }>(`/products/${id}`, 'DELETE'),
    toggleStock: (id: string) => request<Product>(`/products/${id}/stock`, 'PATCH'),
  },
  orders: {
    create: (data: Omit<Order, 'id' | 'created_at' | 'status'>) => request<Order>('/orders', 'POST', data),
    list: (filters: { status?: string; wilaya?: string; from?: string; to?: string; page?: number; limit?: number }) => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.wilaya) params.append('wilaya', filters.wilaya);
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      return request<{ orders: Order[]; count: number; page: number; limit: number }>(`/orders?${params.toString()}`);
    },
    updateStatus: (id: string, status: string) => request<Order>(`/orders/${id}/status`, 'PATCH', { status }),
    delete: (id: string) => request<{ message: string }>(`/orders/${id}`, 'DELETE'),
  },
  delivery: {
    list: () => request<DeliveryPrice[]>('/delivery'),
    bulkUpdate: (data: DeliveryPrice[]) => request<DeliveryPrice[]>('/delivery', 'PUT', data),
  },
  upload: {
    image: (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      return request<{ url: string; path: string }>('/upload', 'POST', formData, true);
    }
  }
};
