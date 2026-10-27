export type BookingStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "completed"
  | "cancelled"
  | "no_show";

export type PaymentStatus = "unpaid" | "deposit_paid" | "paid" | "refunded";

export type PaymentMethod = "cash" | "nequi" | "bancolombia" | "card" | "transfer" | "other";

export interface GlampingImage {
  id: string;
  glampingId: string;
  url: string;
  alt: string;
  sortOrder: number;
  isMain: boolean;
}

export interface GlampingRate {
  id: string;
  glampingId: string;
  name: string;
  startDate: string;
  endDate: string;
  pricePerNight: number;
  minNights: number;
  active: boolean;
}

export interface BlockedDate {
  id: string;
  glampingId: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface Glamping {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  shortDescription: string;
  description: string;
  pricePerNight: number;
  weekendPricePerNight: number | null;
  holidayPricePerNight: number | null;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  sizeM2: number | null;
  amenities: string[];
  includes: string[];
  conditions: string;
  location: string;
  mainImage: string;
  active: boolean;
  featured: boolean;
  sortOrder: number;
  createdAt?: string;
  images?: GlampingImage[];
  rates?: GlampingRate[];
  blocks?: BlockedDate[];
}

export interface Activity {
  id: string;
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  description: string;
  price: number;
  weekendPrice: number | null;
  holidayPrice: number | null;
  priceUnit: string;
  duration: string;
  difficulty: string;
  minAge: number;
  maxPeople: number | null;
  includes: string[];
  requirements: string;
  image: string;
  active: boolean;
  featured: boolean;
  sortOrder: number;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  priceUnit: string;
  image: string;
  active: boolean;
  sortOrder: number;
}

export interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  category: string;
  sortOrder: number;
  active: boolean;
}

export interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  document: string;
  city: string;
  notes: string;
  createdAt: string;
  bookingsCount?: number;
  totalSpent?: number;
  lastBookingAt?: string | null;
}

export interface BookingActivity {
  id: string;
  activityId: string | null;
  activityName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface BookingService {
  id: string;
  serviceId: string | null;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  status: "pending" | "approved" | "rejected" | "refunded";
  paidAt: string;
  notes: string;
  createdBy: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  code: string;
  customerId: string | null;
  glampingId: string;
  glampingName?: string;
  glampingSlug?: string;
  glampingImage?: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestDocument: string;
  guestCity: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  nightlyRate: number;
  subtotal: number;
  activitiesTotal: number;
  servicesTotal: number;
  total: number;
  depositRequired: number;
  paidAmount: number;
  balance: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  source: string;
  notes: string;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
  activities?: BookingActivity[];
  services?: BookingService[];
  payments?: Payment[];
  history?: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    note: string;
    createdBy: string;
    createdAt: string;
  }>;
}

export interface BusinessSettings {
  name: string;
  tagline: string;
  description: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  mapQuery: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  schedule: string;
  provisional: boolean;
}

export interface BookingSettings {
  currency: string;
  depositPercent: number;
  minNights: number;
  checkInTime: string;
  checkOutTime: string;
  maxGuests: number;
  terms: string;
}

export interface IntegrationSettings {
  payments: { provider: string; enabled: boolean; publicKeyConfigured: boolean };
  electronicInvoice: { provider: string; enabled: boolean; dianValidated: boolean };
  email: { provider: string; enabled: boolean };
}

export interface Settings {
  business: BusinessSettings;
  booking: BookingSettings;
  integrations: IntegrationSettings;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor";
  active: boolean;
  lastLoginAt: string | null;
}

export interface Quote {
  nights: number;
  nightlyRate: number;
  subtotal: number;
  activitiesTotal: number;
  servicesTotal: number;
  total: number;
  depositRequired: number;
  balance: number;
  minNights: number;
  rateName: string;
  nightlyBreakdown: Array<{
    date: string;
    price: number;
    label: string;
    kind: "seasonal" | "holiday" | "weekend" | "base";
  }>;
  activityLines: Array<{
    activityId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
    priceLabel: string;
    priceKind: "holiday" | "weekend" | "base";
  }>;
  serviceLines: Array<{ serviceId: string; name: string; quantity: number; unitPrice: number; total: number }>;
}

export interface QuoteActivityInput {
  activityId: string;
  quantity: number;
}

export interface QuoteServiceInput {
  serviceId: string;
  quantity: number;
}

export interface AvailabilityItem {
  glamping: Glamping;
  available: boolean;
  quote: Quote | null;
  reason?: string;
}

export interface DashboardStats {
  revenue: number;
  pendingBalance: number;
  bookingsThisMonth: number;
  activeBookings: number;
  occupancy: number;
  activeGlampings: number;
  customers: number;
  pendingBookings: number;
  monthlyRevenue: Array<{ month: string; total: number }>;
  statusCounts: Record<string, number>;
  recentBookings: Booking[];
  upcomingBookings: Booking[];
}
