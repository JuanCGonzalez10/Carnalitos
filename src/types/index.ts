export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "unpaid" | "paid" | "refunded";

export type PaymentMethod = "cash" | "nequi" | "bancolombia" | "card" | "transfer" | "other";

export type DeliveryMethod = "delivery" | "pickup";

export type PetType = "perro" | "gato" | "ambos";

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  image: string;
  sortOrder: number;
  active: boolean;
  productCount?: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  categoryId: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  sku: string;
  unit: string;
  weight: string;
  petType: PetType;
  benefits: string[];
  ingredients: string;
  image: string;
  active: boolean;
  featured: boolean;
  sortOrder: number;
  createdAt?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  productName: string;
  unitPrice: number;
  quantity: number;
  total: number;
  image: string;
}

export interface Order {
  id: string;
  code: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryMethod: DeliveryMethod;
  address: string;
  city: string;
  notes: string;
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
  itemsCount?: number;
  items?: OrderItem[];
}

export interface BusinessSettings {
  name: string;
  tagline: string;
  description: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  mapQuery: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  schedule: string;
  provisional: boolean;
}

export interface StoreSettings {
  currency: string;
  shippingCost: number;
  freeShippingThreshold: number;
  pickupAddress: string;
  pickupSchedule: string;
  deliveryNote: string;
  terms: string;
  lowStockThreshold: number;
}

export interface Settings {
  business: BusinessSettings;
  store: StoreSettings;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor";
  active: boolean;
  lastLoginAt: string | null;
}

export interface DashboardStats {
  revenue: number;
  pendingBalance: number;
  ordersThisMonth: number;
  pendingOrders: number;
  activeProducts: number;
  lowStock: number;
  customers: number;
  averageTicket: number;
  monthlyRevenue: Array<{ month: string; total: number }>;
  statusCounts: Record<string, number>;
  topProducts: Array<{ name: string; quantity: number; total: number }>;
  categorySales: Array<{ name: string; total: number }>;
  recentOrders: Order[];
  lowStockProducts: Product[];
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  unit: string;
  stock: number;
  quantity: number;
}

export interface CartTotals {
  subtotal: number;
  shipping: number;
  total: number;
  freeShippingRemaining: number;
  itemCount: number;
}
