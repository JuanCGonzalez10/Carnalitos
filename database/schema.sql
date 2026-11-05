-- ============================================================
-- Carnalitos — esquema PostgreSQL
-- Tienda en línea de snacks y comida saludable para mascotas
-- Ejecutar con: npm run db:setup
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Administración y sesiones ----------
create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null default 'admin' check (role in ('admin', 'editor')),
  active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists admin_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  user_id uuid not null references admin_users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists admin_sessions_user_idx on admin_sessions(user_id);

-- ---------- Configuración editable ----------
create table if not exists settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------- Catálogo ----------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  icon text not null default 'paw',
  image text not null default '',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists categories_active_idx on categories(active, sort_order);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category_id uuid references categories(id) on delete set null,
  short_description text not null default '',
  description text not null default '',
  price numeric(12, 2) not null check (price >= 0),
  compare_at_price numeric(12, 2) check (compare_at_price is null or compare_at_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  sku text not null default '',
  unit text not null default 'unidad',
  weight text not null default '',
  pet_type text not null default 'ambos' check (pet_type in ('perro', 'gato', 'ambos')),
  benefits text[] not null default '{}',
  ingredients text not null default '',
  image text not null default '',
  active boolean not null default true,
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_active_idx on products(active, sort_order);
create index if not exists products_category_idx on products(category_id, active);
create index if not exists products_stock_idx on products(stock);

-- ---------- Pedidos ----------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  delivery_method text not null default 'delivery' check (delivery_method in ('delivery', 'pickup')),
  address text not null default '',
  city text not null default '',
  notes text not null default '',
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  shipping numeric(12, 2) not null default 0 check (shipping >= 0),
  total numeric(12, 2) not null default 0 check (total >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled')),
  payment_method text not null default 'cash'
    check (payment_method in ('cash', 'nequi', 'bancolombia', 'card', 'transfer', 'other')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid', 'refunded')),
  admin_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_status_idx on orders(status, created_at desc);
create index if not exists orders_created_idx on orders(created_at desc);
create index if not exists orders_email_idx on orders(lower(customer_email));
create index if not exists orders_payment_idx on orders(payment_status);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity integer not null default 1 check (quantity > 0),
  total numeric(12, 2) not null check (total >= 0),
  image text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists order_items_order_idx on order_items(order_id);
create index if not exists order_items_product_idx on order_items(product_id);

-- ---------- Mensajes de contacto ----------
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null default '',
  subject text not null default '',
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'replied', 'archived')),
  created_at timestamptz not null default now()
);

-- ---------- Datos iniciales de configuración ----------
insert into settings (key, value) values
  ('business', '{
    "name": "Carnalitos",
    "tagline": "Snacks y comida saludable para mascotas",
    "description": "Carnalitos es una tienda colombiana de snacks naturales, comida saludable y premios para perros y gatos. Hacemos productos con ingredientes reales, sin conservantes ni colorantes artificiales.",
    "phone": "+57 310 833 8636",
    "whatsapp": "+573108338636",
    "email": "carnalitosbarf@gmail.com",
    "address": "Medellín, Colombia",
    "city": "Medellín",
    "mapQuery": "Medellín, Colombia",
    "instagram": "https://www.instagram.com/carnalitos.co/",
    "facebook": "",
    "tiktok": "",
    "schedule": "Lunes a sábado · 8:00 a. m. a 6:00 p. m.",
    "provisional": false
  }'::jsonb),
  ('store', '{
    "currency": "COP",
    "shippingCost": 12000,
    "freeShippingThreshold": 120000,
    "pickupAddress": "Medellín · entrega coordinada por WhatsApp",
    "pickupSchedule": "Lunes a sábado, 9:00 a. m. a 5:00 p. m.",
    "deliveryNote": "Entregas exclusivas en Medellín en 24 a 48 horas.",
    "terms": "Los pedidos se confirman por WhatsApp o correo. El pago contraentrega está disponible en Medellín. Los productos son elaborados de forma artesanal; las imágenes son de referencia.",
    "lowStockThreshold": 5
  }'::jsonb)
on conflict (key) do nothing;
