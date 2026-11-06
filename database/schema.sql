-- ============================================================
-- Carnalitos — esquema MySQL / MariaDB
-- Tienda en línea de snacks y comida saludable para mascotas
--
-- Ejecutar con: npm run db:setup
-- O importar este archivo desde phpMyAdmin (Hostinger).
-- ============================================================

SET NAMES utf8mb4;

-- ---------- Administración y sesiones ----------
CREATE TABLE IF NOT EXISTS admin_users (
  id CHAR(36) NOT NULL,
  name VARCHAR(191) NOT NULL,
  email VARCHAR(191) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'editor') NOT NULL DEFAULT 'admin',
  active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY admin_users_email_uq (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_sessions (
  id CHAR(36) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  user_id CHAR(36) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY admin_sessions_token_uq (token_hash),
  KEY admin_sessions_user_idx (user_id),
  CONSTRAINT admin_sessions_user_fk
    FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Configuración editable ----------
CREATE TABLE IF NOT EXISTS settings (
  `key` VARCHAR(64) NOT NULL,
  `value` JSON NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Catálogo ----------
CREATE TABLE IF NOT EXISTS categories (
  id CHAR(36) NOT NULL,
  slug VARCHAR(191) NOT NULL,
  name VARCHAR(191) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(64) NOT NULL DEFAULT 'paw',
  image VARCHAR(500) NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY categories_slug_uq (slug),
  KEY categories_active_idx (active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id CHAR(36) NOT NULL,
  slug VARCHAR(191) NOT NULL,
  name VARCHAR(191) NOT NULL,
  category_id CHAR(36) NULL,
  short_description TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  compare_at_price DECIMAL(12, 2) NULL,
  stock INT NOT NULL DEFAULT 0,
  sku VARCHAR(100) NOT NULL DEFAULT '',
  unit VARCHAR(64) NOT NULL DEFAULT 'unidad',
  weight VARCHAR(64) NOT NULL DEFAULT '',
  pet_type ENUM('perro', 'gato', 'ambos') NOT NULL DEFAULT 'ambos',
  benefits JSON NOT NULL,
  ingredients TEXT NOT NULL,
  image VARCHAR(500) NOT NULL DEFAULT '',
  active TINYINT(1) NOT NULL DEFAULT 1,
  featured TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY products_slug_uq (slug),
  KEY products_active_idx (active, sort_order),
  KEY products_category_idx (category_id, active),
  KEY products_stock_idx (stock),
  CONSTRAINT products_category_fk
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT products_price_ck CHECK (price >= 0),
  CONSTRAINT products_compare_price_ck CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
  CONSTRAINT products_stock_ck CHECK (stock >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Pedidos ----------
CREATE TABLE IF NOT EXISTS orders (
  id CHAR(36) NOT NULL,
  code VARCHAR(32) NOT NULL,
  customer_name VARCHAR(191) NOT NULL,
  customer_email VARCHAR(191) NOT NULL,
  customer_phone VARCHAR(64) NOT NULL,
  delivery_method ENUM('delivery', 'pickup') NOT NULL DEFAULT 'delivery',
  address TEXT NOT NULL,
  city VARCHAR(120) NOT NULL,
  notes TEXT NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  shipping DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status ENUM('pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled')
    NOT NULL DEFAULT 'pending',
  payment_method ENUM('cash', 'nequi', 'bancolombia', 'card', 'transfer', 'other')
    NOT NULL DEFAULT 'cash',
  payment_status ENUM('unpaid', 'paid', 'refunded') NOT NULL DEFAULT 'unpaid',
  admin_notes VARCHAR(2000) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY orders_code_uq (code),
  KEY orders_status_idx (status, created_at),
  KEY orders_created_idx (created_at),
  KEY orders_email_idx (customer_email),
  KEY orders_payment_idx (payment_status),
  CONSTRAINT orders_subtotal_ck CHECK (subtotal >= 0),
  CONSTRAINT orders_shipping_ck CHECK (shipping >= 0),
  CONSTRAINT orders_total_ck CHECK (total >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id CHAR(36) NOT NULL,
  order_id CHAR(36) NOT NULL,
  product_id CHAR(36) NULL,
  product_name VARCHAR(191) NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  total DECIMAL(12, 2) NOT NULL,
  image VARCHAR(500) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY order_items_order_idx (order_id),
  KEY order_items_product_idx (product_id),
  CONSTRAINT order_items_order_fk
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT order_items_product_fk
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  CONSTRAINT order_items_price_ck CHECK (unit_price >= 0),
  CONSTRAINT order_items_quantity_ck CHECK (quantity > 0),
  CONSTRAINT order_items_total_ck CHECK (total >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Mensajes de contacto ----------
CREATE TABLE IF NOT EXISTS contact_messages (
  id CHAR(36) NOT NULL,
  name VARCHAR(191) NOT NULL,
  email VARCHAR(191) NOT NULL,
  phone VARCHAR(64) NOT NULL DEFAULT '',
  subject VARCHAR(255) NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  status ENUM('new', 'read', 'replied', 'archived') NOT NULL DEFAULT 'new',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY contact_messages_status_idx (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Datos iniciales de configuración ----------
INSERT IGNORE INTO settings (`key`, `value`) VALUES
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
  }'),
  ('store', '{
    "currency": "COP",
    "shippingCost": 12000,
    "freeShippingThreshold": 120000,
    "pickupAddress": "Medellín · entrega coordinada por WhatsApp",
    "pickupSchedule": "Lunes a sábado, 9:00 a. m. a 5:00 p. m.",
    "deliveryNote": "Entregas exclusivas en Medellín en 24 a 48 horas.",
    "terms": "Los pedidos se confirman por WhatsApp o correo. El pago contraentrega está disponible en Medellín. Los productos son elaborados de forma artesanal; las imágenes son de referencia.",
    "lowStockThreshold": 5
  }');
