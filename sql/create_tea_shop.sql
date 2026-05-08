-- ============================================================
-- Tea Stories 茶物语 - MySQL 数据库建表语句（仅结构，无 INSERT）
-- 数据库名: tea_shop
-- 字符集: utf8mb4
-- ============================================================

CREATE DATABASE IF NOT EXISTS tea_shop
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE tea_shop;

-- ------------------------------------------------------------
-- 1. 门店
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stores (
  id INT NOT NULL AUTO_INCREMENT,
  code VARCHAR(32) NOT NULL COMMENT '门店代码，如 kuchai, cheras, sri_petal',
  name VARCHAR(128) NOT NULL COMMENT '门店名称',
  address VARCHAR(255) DEFAULT NULL,
  city VARCHAR(64) DEFAULT NULL,
  lat DECIMAL(10, 6) DEFAULT NULL,
  lng DECIMAL(10, 6) DEFAULT NULL,
  open_hours VARCHAR(64) DEFAULT NULL COMMENT '营业时间描述',
  PRIMARY KEY (id),
  UNIQUE KEY uk_stores_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. 商品类目
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_categories (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(64) NOT NULL,
  parent_id INT DEFAULT NULL COMMENT '父类目 ID，可为空',
  display_order INT DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. 商品
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id INT NOT NULL AUTO_INCREMENT,
  category_id INT NOT NULL,
  name VARCHAR(128) NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  image_url VARCHAR(255) DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY idx_products_category (category_id),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES product_categories (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 4. 用户
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT NOT NULL AUTO_INCREMENT,
  openid VARCHAR(128) DEFAULT NULL,
  nickname VARCHAR(64) DEFAULT NULL,
  avatar_url VARCHAR(255) DEFAULT NULL,
  channel VARCHAR(32) DEFAULT NULL COMMENT '如 miniapp',
  created_at DATETIME DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_users_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 5. 用户画像（与 users 一对一）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profile (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  gender VARCHAR(8) DEFAULT NULL COMMENT 'M/F/U',
  age INT DEFAULT NULL,
  occupation VARCHAR(64) DEFAULT NULL,
  city VARCHAR(64) DEFAULT NULL,
  province VARCHAR(64) DEFAULT NULL,
  income_level VARCHAR(16) DEFAULT NULL COMMENT '如 低/中/高',
  marital_status VARCHAR(32) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_profile_user (user_id),
  CONSTRAINT fk_user_profile_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 6. 订单
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id INT NOT NULL AUTO_INCREMENT,
  order_no VARCHAR(64) NOT NULL COMMENT '订单号，唯一',
  user_id INT NOT NULL,
  store_id INT NOT NULL,
  delivery_mode VARCHAR(16) NOT NULL DEFAULT 'self' COMMENT 'self/delivery',
  status VARCHAR(32) NOT NULL COMMENT 'pending_pay/paid/picked/done',
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  payable_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  payment_method VARCHAR(32) DEFAULT NULL COMMENT '如 TNG, OnlineBank',
  created_at DATETIME DEFAULT NULL,
  paid_at DATETIME DEFAULT NULL,
  finished_at DATETIME DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_orders_order_no (order_no),
  KEY idx_orders_user (user_id),
  KEY idx_orders_store (store_id),
  KEY idx_orders_created (created_at),
  KEY idx_orders_paid (paid_at),
  KEY idx_orders_status (status),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_orders_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 7. 订单明细
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id INT NOT NULL AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_variant_id INT DEFAULT NULL COMMENT '规格 ID，可为空',
  product_name_snap VARCHAR(128) DEFAULT NULL COMMENT '下单时商品名称快照',
  unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  qty INT NOT NULL DEFAULT 1,
  line_total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_id),
  KEY idx_order_items_product (product_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 8. 订单配送信息（仅 delivery 订单有记录）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_delivery_info (
  id INT NOT NULL AUTO_INCREMENT,
  order_id INT NOT NULL,
  receiver_name VARCHAR(64) DEFAULT NULL,
  phone VARCHAR(32) DEFAULT NULL,
  full_address VARCHAR(512) DEFAULT NULL,
  postcode VARCHAR(16) DEFAULT NULL,
  lat DECIMAL(10, 6) DEFAULT NULL,
  lng DECIMAL(10, 6) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_order_delivery_order (order_id),
  CONSTRAINT fk_order_delivery_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
