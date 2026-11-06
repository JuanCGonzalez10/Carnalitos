-- ============================================================
-- Carnalitos - instalación completa para Hostinger
--
-- Importa ESTE único archivo en phpMyAdmin y quedará lista la base:
--   1. Tablas (schema.sql)
--   2. Administrador, configuración, categorías y productos
--
-- Es seguro importarlo varias veces: los datos existentes se conservan.
--
-- Acceso inicial al panel:
--   Correo: carnalitosbarf@gmail.com
--   Contraseña: Cami0510*
-- Cambia la contraseña desde el panel apenas ingreses.
-- ============================================================

SET NAMES utf8mb4;

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

-- ============================================================
-- Datos iniciales
-- ============================================================

-- ============================================================
-- Carnalitos - datos iniciales para produccion (Hostinger)
-- Importar DESPUES de database/schema.sql en phpMyAdmin.
--
-- Incluye: administrador, configuracion, categorias y productos.
-- No incluye pedidos ni mensajes de demostracion.
--
-- Correo inicial: carnalitosbarf@gmail.com
-- Contrasena inicial: Cami0510*
-- Cambia la contrasena desde el panel apenas ingreses.
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- MySQL dump 10.13  Distrib 8.4.13, for Linux (x86_64)
--
-- Host: localhost    Database: carnalitos
-- ------------------------------------------------------
-- Server version	8.4.13

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `admin_users`
--

/*!40000 ALTER TABLE `admin_users` DISABLE KEYS */;
INSERT IGNORE INTO `admin_users` (`id`, `name`, `email`, `password_hash`, `role`, `active`, `last_login_at`, `created_at`) VALUES ('7a26bdd4-a9a6-4c4c-a9e4-e40b94890e62','Administrador Carnalitos','carnalitosbarf@gmail.com','scrypt$00c7ae0e004722ff4950af1383f17f4b$6b2b2c179b3df85b5ae7f7b2f865529246fb5315d3e6667bfbd3b271bf5608ec5e1c2148b15e6615cc1852382e1010e5b33486d71a5892818474242cdcd11f65','admin',1,NULL,'2026-11-06 19:27:02');
/*!40000 ALTER TABLE `admin_users` ENABLE KEYS */;

--
-- Dumping data for table `settings`
--

/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT IGNORE INTO `settings` (`key`, `value`, `updated_at`) VALUES ('business','{\"city\": \"Medellín\", \"name\": \"Carnalitos\", \"email\": \"carnalitosbarf@gmail.com\", \"phone\": \"+57 310 833 8636\", \"tiktok\": \"\", \"address\": \"Medellín, Colombia\", \"tagline\": \"Snacks y comida saludable para mascotas\", \"facebook\": \"\", \"mapQuery\": \"Medellín, Colombia\", \"schedule\": \"Lunes a sábado · 8:00 a. m. a 6:00 p. m.\", \"whatsapp\": \"+573108338636\", \"instagram\": \"https://www.instagram.com/carnalitos.co/\", \"description\": \"Carnalitos es una tienda colombiana de snacks naturales, comida saludable y premios para perros y gatos. Hacemos productos con ingredientes reales, sin conservantes ni colorantes artificiales.\", \"provisional\": false}','2026-11-06 19:27:02');
INSERT IGNORE INTO `settings` (`key`, `value`, `updated_at`) VALUES ('store','{\"terms\": \"Los pedidos se confirman por WhatsApp o correo. El pago contraentrega está disponible en Medellín. Los productos son elaborados de forma artesanal; las imágenes son de referencia.\", \"currency\": \"COP\", \"deliveryNote\": \"Entregas exclusivas en Medellín en 24 a 48 horas.\", \"shippingCost\": 12000, \"pickupAddress\": \"Medellín · entrega coordinada por WhatsApp\", \"pickupSchedule\": \"Lunes a sábado, 9:00 a. m. a 5:00 p. m.\", \"lowStockThreshold\": 5, \"freeShippingThreshold\": 120000}','2026-11-06 19:27:02');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;

--
-- Dumping data for table `categories`
--

/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT IGNORE INTO `categories` (`id`, `slug`, `name`, `description`, `icon`, `image`, `sort_order`, `active`, `created_at`, `updated_at`) VALUES ('71f3f43e-8315-4ec2-9c75-4aaa04e7f067','premios-entrenamiento','Premios de entrenamiento','Porciones pequeñas y aromáticas para reforzar buenos comportamientos.','star','',3,1,'2026-11-06 19:27:02','2026-11-06 19:27:02');
INSERT IGNORE INTO `categories` (`id`, `slug`, `name`, `description`, `icon`, `image`, `sort_order`, `active`, `created_at`, `updated_at`) VALUES ('8ca044e1-03cd-43e5-a39d-4e1292c8b028','comida-saludable','Comida saludable','Recetas completas y balanceadas para perros y gatos, con ingredientes visibles.','utensils','',2,1,'2026-11-06 19:27:02','2026-11-06 19:27:02');
INSERT IGNORE INTO `categories` (`id`, `slug`, `name`, `description`, `icon`, `image`, `sort_order`, `active`, `created_at`, `updated_at`) VALUES ('93ea1d43-0f47-4dc8-9004-b649c17827f6','snacks-naturales','Snacks naturales','Premios horneados y deshidratados con proteína real, ideales para el día a día.','bone','',1,1,'2026-11-06 19:27:02','2026-11-06 19:27:02');
INSERT IGNORE INTO `categories` (`id`, `slug`, `name`, `description`, `icon`, `image`, `sort_order`, `active`, `created_at`, `updated_at`) VALUES ('bb22a147-44ad-4c0f-9f9d-0fc4b5567504','para-gatos','Para gatos','Snacks y comida pensada para el paladar felino y su digestión.','heart','',4,1,'2026-11-06 19:27:02','2026-11-06 19:27:02');
INSERT IGNORE INTO `categories` (`id`, `slug`, `name`, `description`, `icon`, `image`, `sort_order`, `active`, `created_at`, `updated_at`) VALUES ('c9f1017f-3da1-44f8-8077-d6c06bab524d','masticables','Masticables','Opciones duraderas que ayudan a la limpieza dental y al entretenimiento.','paw','',5,1,'2026-11-06 19:27:02','2026-11-06 19:27:02');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;

--
-- Dumping data for table `products`
--

/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT IGNORE INTO `products` (`id`, `slug`, `name`, `category_id`, `short_description`, `description`, `price`, `compare_at_price`, `stock`, `sku`, `unit`, `weight`, `pet_type`, `benefits`, `ingredients`, `image`, `active`, `featured`, `sort_order`, `created_at`, `updated_at`) VALUES ('18c76ccb-3fe4-4252-92d3-ee1b4ad7a686','frutas-deshidratadas','Frutas deshidratadas','93ea1d43-0f47-4dc8-9004-b649c17827f6','Mezcla de manzana, naranja y plátano deshidratados, sin azúcar añadida.','Una mezcla de frutas de temporada deshidratadas a baja temperatura. El resultado es un snack crujiente y natural, sin azúcar añadida ni conservantes.\n\nEs una opción distinta para variar los premios y aportar fibra. Ofrece siempre en porciones moderadas y retira las semillas.',13900.00,NULL,44,'CAR-SN-003','paquete','90 g','ambos','[\"Sin azúcar añadida\", \"Fibra natural\", \"Mezcla de frutas\", \"Textura crujiente\"]','Manzana, naranja y plátano deshidratados.','/images/productos/frutas-deshidratadas.svg',1,0,9,'2026-11-06 19:27:02','2026-11-06 19:27:02');
INSERT IGNORE INTO `products` (`id`, `slug`, `name`, `category_id`, `short_description`, `description`, `price`, `compare_at_price`, `stock`, `sku`, `unit`, `weight`, `pet_type`, `benefits`, `ingredients`, `image`, `active`, `featured`, `sort_order`, `created_at`, `updated_at`) VALUES ('3512e4d8-9510-4a24-8642-3509a3ca0bc3','snack-de-atun-para-gatos','Snack de atún para gatos','bb22a147-44ad-4c0f-9f9d-0fc4b5567504','Atún al vapor en porciones pequeñas, ideal como premio o para mezclar.','Atún al vapor, sin sal añadida, en porciones pequeñas que funcionan como premio o como complemento de la comida. Su aroma es irresistible incluso para gatos que suelen ser selectivos.\n\nRecomendamos ofrecerlo como complemento, no como reemplazo de una dieta completa.',17900.00,NULL,26,'CAR-GA-001','paquete','70 g','gato','[\"Atún al vapor\", \"Sin sal añadida\", \"Aroma intenso\", \"Porciones pequeñas\"]','Atún, agua y aceite de pescado.','/images/productos/snack-atun.svg',1,1,8,'2026-11-06 19:27:02','2026-11-06 19:27:02');
INSERT IGNORE INTO `products` (`id`, `slug`, `name`, `category_id`, `short_description`, `description`, `price`, `compare_at_price`, `stock`, `sku`, `unit`, `weight`, `pet_type`, `benefits`, `ingredients`, `image`, `active`, `featured`, `sort_order`, `created_at`, `updated_at`) VALUES ('48d32a01-1fdb-4938-920d-b9494ce43b51','pollo-con-verduras','Pollo con verduras','8ca044e1-03cd-43e5-a39d-4e1292c8b028','Receta completa de pollo, calabaza, zanahoria y arroz para perros.','Comida cocinada a baja temperatura con pollo desmechado, calabaza, zanahoria y arroz integral. Una mezcla suave y fácil de digerir, pensada para perros de todas las edades.\n\nSirve como complemento de su alimentación o como comida completa según su tamaño y nivel de actividad. Consulta con tu veterinario si tu perro tiene necesidades especiales.',42900.00,46900.00,18,'CAR-CO-002','paquete','500 g','perro','[\"Fácil de digerir\", \"Verduras reales\", \"Cocción suave\", \"Sin colorantes\"]','Pollo, calabaza, zanahoria, arroz integral y aceite de coco.','/images/productos/pollo-verduras.svg',1,1,5,'2026-11-06 19:27:02','2026-11-06 19:27:02');
INSERT IGNORE INTO `products` (`id`, `slug`, `name`, `category_id`, `short_description`, `description`, `price`, `compare_at_price`, `stock`, `sku`, `unit`, `weight`, `pet_type`, `benefits`, `ingredients`, `image`, `active`, `featured`, `sort_order`, `created_at`, `updated_at`) VALUES ('4bb21177-d5f5-4629-b925-d051c6bcf52a','masticable-de-yuca','Masticable de yuca','c9f1017f-3da1-44f8-8077-d6c06bab524d','Barras de yuca deshidratada, duraderas y sin granos ni aditivos.','Un masticable vegetal para perros que necesitan algo que dure. La yuca se pela, se corta y se deshidrata lentamente hasta obtener una textura firme que se va ablandando con la saliva.\n\nNo contiene granos, trigo ni conservantes. Supervisa siempre a tu perro mientras mastica y retira el producto cuando quede muy pequeño.',15900.00,NULL,35,'CAR-MA-001','paquete','2 unidades','perro','[\"Sin granos\", \"Larga duración\", \"Origen vegetal\", \"Ayuda a la masticación\"]','Yuca 100%.','/images/productos/masticable-yuca.svg',1,0,7,'2026-11-06 19:27:02','2026-11-06 19:27:02');
INSERT IGNORE INTO `products` (`id`, `slug`, `name`, `category_id`, `short_description`, `description`, `price`, `compare_at_price`, `stock`, `sku`, `unit`, `weight`, `pet_type`, `benefits`, `ingredients`, `image`, `active`, `featured`, `sort_order`, `created_at`, `updated_at`) VALUES ('5873cc73-4257-4fc2-a5f4-4f9407b9328a','hueso-de-pollo-desecado','Hueso de pollo desecado','93ea1d43-0f47-4dc8-9004-b649c17827f6','Pechuga de pollo deshidratada en forma de hueso, crujiente y sin aditivos.','Un premio sencillo y honesto: pechuga de pollo seleccionada, deshidratada lentamente para conservar su aroma y su textura crujiente. No lleva conservantes, colorantes ni saborizantes.\n\nEs perfecto como premio diario o para mantener a tu perro entretenido. Por su textura firme, también funciona muy bien para perros que mastican con entusiasmo.',18900.00,22000.00,40,'CAR-SN-001','paquete','120 g','perro','[\"Alta en proteína\", \"Sin conservantes\", \"Textura crujiente\", \"Hecho en lotes pequeños\"]','Pechuga de pollo 100%.','/images/productos/hueso-pollo.svg',1,1,1,'2026-11-06 19:27:02','2026-11-06 19:27:02');
INSERT IGNORE INTO `products` (`id`, `slug`, `name`, `category_id`, `short_description`, `description`, `price`, `compare_at_price`, `stock`, `sku`, `unit`, `weight`, `pet_type`, `benefits`, `ingredients`, `image`, `active`, `featured`, `sort_order`, `created_at`, `updated_at`) VALUES ('7502bba8-dd8e-4bd5-bbe7-74232ce6cabd','hueso-de-cuero-natural','Hueso de cuero natural','c9f1017f-3da1-44f8-8077-d6c06bab524d','Cuero de res prensado en forma de hueso, resistente y sin tratamientos químicos.','Cuero de res natural, prensado y cortado en forma de hueso. Es un masticable resistente que mantiene a los perros entretenidos y ayuda a la limpieza mecánica de los dientes.\n\nNo recibe tratamientos químicos ni blanqueadores. Elige el tamaño adecuado para tu perro y supervisa siempre el momento de la masticación.',21900.00,NULL,20,'CAR-MA-002','unidad','1 unidad','perro','[\"Cuero natural\", \"Sin blanqueadores\", \"Larga duración\", \"Ayuda dental\"]','Cuero de res 100%.','/images/productos/hueso-cuero.svg',1,0,10,'2026-11-06 19:27:02','2026-11-06 19:27:02');
INSERT IGNORE INTO `products` (`id`, `slug`, `name`, `category_id`, `short_description`, `description`, `price`, `compare_at_price`, `stock`, `sku`, `unit`, `weight`, `pet_type`, `benefits`, `ingredients`, `image`, `active`, `featured`, `sort_order`, `created_at`, `updated_at`) VALUES ('c3ece12d-37f8-47b0-81db-8528c60f61f4','chips-de-higado-de-res','Chips de hígado de res','93ea1d43-0f47-4dc8-9004-b649c17827f6','Láminas finas de hígado deshidratado, intensas en sabor y hierro.','El hígado es uno de los ingredientes más aromáticos para los perros y una buena fuente natural de hierro y vitamina A. Lo cortamos en láminas finas y lo deshidratamos hasta lograr un snack ligero y quebradizo.\n\nÚsalo como premio de alto valor en entrenamientos o para romper la rutina. Por su intensidad, recomendamos darlo en porciones pequeñas.',16500.00,NULL,32,'CAR-SN-002','paquete','80 g','perro','[\"Rico en hierro\", \"Muy aromático\", \"Ideal para entrenar\", \"Sin cereales\"]','Hígado de res 100%.','/images/productos/chips-higado.svg',1,1,2,'2026-11-06 19:27:02','2026-11-06 19:27:02');
INSERT IGNORE INTO `products` (`id`, `slug`, `name`, `category_id`, `short_description`, `description`, `price`, `compare_at_price`, `stock`, `sku`, `unit`, `weight`, `pet_type`, `benefits`, `ingredients`, `image`, `active`, `featured`, `sort_order`, `created_at`, `updated_at`) VALUES ('d6b90006-ea4c-456d-9535-687445667bd3','croquetas-de-salmon','Croquetas de salmón','8ca044e1-03cd-43e5-a39d-4e1292c8b028','Comida completa para gatos con salmón, arroz integral y caldo de pescado.','Una receta húmeda y aromática para gatos exigentes. El salmón aporta proteína de alta calidad y omega 3, mientras el arroz integral y las verduras completan una porción equilibrada.\n\nSe puede servir sola o mezclada con su comida habitual. Viene en porciones individuales para mantener la frescura.',48900.00,NULL,4,'CAR-CO-001','paquete','500 g','gato','[\"Omega 3\", \"Proteína de salmón\", \"Sin subproductos\", \"Porciones individuales\"]','Salmón, arroz integral, zanahoria, caldo de pescado y aceite de salmón.','/images/productos/croquetas-salmon.svg',1,1,4,'2026-11-06 19:27:02','2026-11-06 19:27:02');
INSERT IGNORE INTO `products` (`id`, `slug`, `name`, `category_id`, `short_description`, `description`, `price`, `compare_at_price`, `stock`, `sku`, `unit`, `weight`, `pet_type`, `benefits`, `ingredients`, `image`, `active`, `featured`, `sort_order`, `created_at`, `updated_at`) VALUES ('d88db141-b846-411e-adbe-60e71d2dfec6','galletas-de-avena-y-miel','Galletas de avena y miel','71f3f43e-8315-4ec2-9c75-4aaa04e7f067','Galletas horneadas con avena integral y un toque de miel, tamaño bocado.','Una receta casera convertida en galleta: avena integral, huevo y un toque de miel. Horneamos cada lote hasta que queda firme por fuera y suave por dentro.\n\nEl tamaño bocado las hace ideales para premios frecuentes y para perros de todos los tamaños. También son una buena opción para gatos curiosos, siempre en porciones pequeñas.',14900.00,NULL,48,'CAR-PR-001','paquete','150 g','ambos','[\"Avena integral\", \"Tamaño bocado\", \"Horneadas a mano\", \"Sin azúcar añadida\"]','Avena integral, huevo, miel, aceite de coco y canela.','/images/productos/galletas-avena.svg',1,1,3,'2026-11-06 19:27:02','2026-11-06 19:27:02');
INSERT IGNORE INTO `products` (`id`, `slug`, `name`, `category_id`, `short_description`, `description`, `price`, `compare_at_price`, `stock`, `sku`, `unit`, `weight`, `pet_type`, `benefits`, `ingredients`, `image`, `active`, `featured`, `sort_order`, `created_at`, `updated_at`) VALUES ('f93dd14e-6ddb-4689-a135-3f5d61148336','premios-de-calabaza','Premios de calabaza','71f3f43e-8315-4ec2-9c75-4aaa04e7f067','Bocaditos suaves de calabaza y avena, ricos en fibra y muy fáciles de partir.','La calabaza es una aliada natural de la digestión. La mezclamos con avena y la horneamos en bocaditos suaves que se pueden partir con la mano, perfectos para premiar sin excederse.\n\nIdeales para cachorros, perros mayores o mascotas con estómagos sensibles.',12900.00,NULL,60,'CAR-PR-002','paquete','100 g','ambos','[\"Rica en fibra\", \"Textura suave\", \"Fácil de partir\", \"Apta para cachorros\"]','Calabaza, avena integral, huevo y canela.','/images/productos/premios-calabaza.svg',1,0,6,'2026-11-06 19:27:02','2026-11-06 19:27:02');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-06 19:27:13

SET FOREIGN_KEY_CHECKS = 1;
