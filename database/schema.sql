-- ============================================================
-- Adrenalina Extrema Huila — esquema PostgreSQL
-- Ejecutar con: npm run db:setup
-- ============================================================

create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

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

-- ---------- Alojamientos ----------
create table if not exists glampings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text not null default '',
  short_description text not null default '',
  description text not null default '',
  price_per_night numeric(12, 2) not null check (price_per_night >= 0),
  weekend_price_per_night numeric(12, 2) check (weekend_price_per_night is null or weekend_price_per_night >= 0),
  holiday_price_per_night numeric(12, 2) check (holiday_price_per_night is null or holiday_price_per_night >= 0),
  capacity integer not null default 2 check (capacity > 0),
  bedrooms integer not null default 1 check (bedrooms >= 0),
  bathrooms integer not null default 1 check (bathrooms >= 0),
  size_m2 integer,
  amenities text[] not null default '{}',
  includes text[] not null default '{}',
  conditions text not null default '',
  location text not null default '',
  main_image text not null default '',
  active boolean not null default true,
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists glampings_active_idx on glampings(active, sort_order);

-- Migración idempotente para bases de datos creadas antes de las tarifas
-- de fin de semana y festivos.
alter table glampings add column if not exists weekend_price_per_night numeric(12, 2);
alter table glampings add column if not exists holiday_price_per_night numeric(12, 2);

create table if not exists glamping_images (
  id uuid primary key default gen_random_uuid(),
  glamping_id uuid not null references glampings(id) on delete cascade,
  url text not null,
  alt text not null default '',
  sort_order integer not null default 0,
  is_main boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists glamping_images_glamping_idx on glamping_images(glamping_id, sort_order);

create table if not exists glamping_rates (
  id uuid primary key default gen_random_uuid(),
  glamping_id uuid not null references glampings(id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  price_per_night numeric(12, 2) not null check (price_per_night >= 0),
  min_nights integer not null default 1 check (min_nights > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint glamping_rates_dates check (end_date >= start_date)
);
create index if not exists glamping_rates_glamping_idx on glamping_rates(glamping_id, start_date);

create table if not exists blocked_dates (
  id uuid primary key default gen_random_uuid(),
  glamping_id uuid not null references glampings(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text not null default '',
  created_at timestamptz not null default now(),
  constraint blocked_dates_dates check (end_date >= start_date)
);
create index if not exists blocked_dates_glamping_idx on blocked_dates(glamping_id, start_date);

-- ---------- Actividades y servicios ----------
create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null default 'Aventura',
  short_description text not null default '',
  description text not null default '',
  price numeric(12, 2) not null check (price >= 0),
  weekend_price numeric(12, 2) check (weekend_price is null or weekend_price >= 0),
  holiday_price numeric(12, 2) check (holiday_price is null or holiday_price >= 0),
  price_unit text not null default 'persona',
  duration text not null default '',
  difficulty text not null default 'Media',
  min_age integer not null default 8 check (min_age >= 0),
  max_people integer,
  includes text[] not null default '{}',
  requirements text not null default '',
  image text not null default '',
  active boolean not null default true,
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists activities_active_idx on activities(active, sort_order);

-- Migración idempotente para bases de datos creadas antes de las tarifas
-- de fin de semana y festivos.
alter table activities add column if not exists weekend_price numeric(12, 2);
alter table activities add column if not exists holiday_price numeric(12, 2);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price numeric(12, 2) not null check (price >= 0),
  price_unit text not null default 'servicio',
  image text not null default '',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Galería ----------
create table if not exists gallery_images (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  alt text not null default '',
  category text not null default 'General',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- Clientes ----------
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null default '',
  document text not null default '',
  city text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists customers_email_unique on customers (lower(email)) where email <> '';

-- ---------- Reservas ----------
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  customer_id uuid references customers(id) on delete set null,
  glamping_id uuid not null references glampings(id) on delete restrict,
  guest_name text not null,
  guest_email text not null,
  guest_phone text not null,
  guest_document text not null default '',
  guest_city text not null default '',
  check_in date not null,
  check_out date not null,
  guests integer not null default 2 check (guests > 0),
  nights integer not null check (nights > 0),
  nightly_rate numeric(12, 2) not null default 0 check (nightly_rate >= 0),
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  activities_total numeric(12, 2) not null default 0 check (activities_total >= 0),
  services_total numeric(12, 2) not null default 0 check (services_total >= 0),
  total numeric(12, 2) not null default 0 check (total >= 0),
  deposit_required numeric(12, 2) not null default 0 check (deposit_required >= 0),
  paid_amount numeric(12, 2) not null default 0 check (paid_amount >= 0),
  balance numeric(12, 2) not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'deposit_paid', 'paid', 'refunded')),
  source text not null default 'web',
  notes text not null default '',
  admin_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_dates_valid check (check_out > check_in),
  -- Garantía real contra dobles reservas, incluso con peticiones concurrentes.
  constraint bookings_no_overlap exclude using gist (
    glamping_id with =,
    daterange(check_in, check_out, '[)') with &&
  ) where (status in ('pending', 'confirmed', 'checked_in'))
);
create index if not exists bookings_glamping_idx on bookings(glamping_id, check_in, check_out);
create index if not exists bookings_email_idx on bookings(lower(guest_email));
create index if not exists bookings_status_idx on bookings(status, created_at desc);
create index if not exists bookings_created_idx on bookings(created_at desc);

create table if not exists booking_activities (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  activity_id uuid references activities(id) on delete set null,
  activity_name text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  total numeric(12, 2) not null check (total >= 0),
  created_at timestamptz not null default now()
);
create index if not exists booking_activities_booking_idx on booking_activities(booking_id);

create table if not exists booking_services (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  service_id uuid references services(id) on delete set null,
  service_name text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  total numeric(12, 2) not null check (total >= 0),
  created_at timestamptz not null default now()
);
create index if not exists booking_services_booking_idx on booking_services(booking_id);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  method text not null default 'other'
    check (method in ('cash', 'nequi', 'bancolombia', 'card', 'transfer', 'other')),
  reference text not null default '',
  status text not null default 'approved'
    check (status in ('pending', 'approved', 'rejected', 'refunded')),
  paid_at date not null default current_date,
  notes text not null default '',
  created_by text not null default 'admin',
  created_at timestamptz not null default now()
);
create index if not exists payments_booking_idx on payments(booking_id, paid_at desc);

create table if not exists booking_status_history (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  from_status text,
  to_status text not null,
  note text not null default '',
  created_by text not null default 'admin',
  created_at timestamptz not null default now()
);

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
    "name": "Adrenalina Extrema Huila",
    "tagline": "Aventura y glamping en el Cañón del Magdalena",
    "description": "Un refugio de aventura en el sur del Huila. Glamping entre montañas, río y bosque, con experiencias diseñadas para reconectar con lo salvaje.",
    "phone": "+57 300 000 0000",
    "whatsapp": "+573333",
    "email": "reservas@adrenalinaextrema.co",
    "address": "Cañón del Magdalena, Huila, Colombia",
    "mapQuery": "Cañón del Magdalena, Huila, Colombia",
    "instagram": "https://www.instagram.com/adextremahuila/",
    "facebook": "https://facebook.com/",
    "tiktok": "",
    "schedule": "Todos los días · 7:00 a. m. a 8:00 p. m.",
    "provisional": true
  }'::jsonb),
  ('booking', '{
    "currency": "COP",
    "depositPercent": 30,
    "minNights": 1,
    "checkInTime": "3:00 p. m.",
    "checkOutTime": "12:00 m.",
    "maxGuests": 12,
    "terms": "La reserva se confirma con el pago del anticipo. Las tarifas pueden variar en temporada alta. La cancelación con reembolso aplica hasta 7 días antes de la llegada; después se abona a una nueva fecha según disponibilidad."
  }'::jsonb),
  ('integrations', '{
    "payments": {"provider": "wompi", "enabled": false, "publicKeyConfigured": false},
    "electronicInvoice": {"provider": "factus", "enabled": false, "dianValidated": false},
    "email": {"provider": "smtp", "enabled": false}
  }'::jsonb)
on conflict (key) do nothing;
