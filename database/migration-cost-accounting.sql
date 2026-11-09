-- ---------------------------------------------------------------------------
-- Migración: costo de productos y costo histórico de venta
--
-- Objetivo:
--   * products.cost        -> costo unitario actual del producto (uso interno).
--   * order_items.unit_cost -> costo unitario congelado al momento de la venta.
--
-- Ejecutar UNA sola vez en la base de datos de producción (phpMyAdmin)
-- ANTES de desplegar el código que lee estas columnas.
--
-- Es idempotente: si las columnas ya existen, no hace nada.
-- Compatible con MySQL 8 y MariaDB (Hostinger).
-- ---------------------------------------------------------------------------

DROP PROCEDURE IF EXISTS carnalitos_add_cost_columns;

DELIMITER $$
CREATE PROCEDURE carnalitos_add_cost_columns()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'cost'
  ) THEN
    ALTER TABLE products
      ADD COLUMN cost DECIMAL(12, 2) NOT NULL DEFAULT 0 AFTER price;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'order_items'
      AND COLUMN_NAME = 'unit_cost'
  ) THEN
    ALTER TABLE order_items
      ADD COLUMN unit_cost DECIMAL(12, 2) NOT NULL DEFAULT 0 AFTER unit_price;
  END IF;
END$$
DELIMITER ;

CALL carnalitos_add_cost_columns();
DROP PROCEDURE carnalitos_add_cost_columns;

-- Verificación rápida (debe devolver una fila por columna):
-- SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT
-- FROM information_schema.COLUMNS
-- WHERE TABLE_SCHEMA = DATABASE()
--   AND ((TABLE_NAME = 'products' AND COLUMN_NAME = 'cost')
--     OR (TABLE_NAME = 'order_items' AND COLUMN_NAME = 'unit_cost'));
