CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity INT NOT NULL DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0.00,
  image_url TEXT,
  status ENUM('in_stock','low','out_of_stock','discontinued') NOT NULL DEFAULT 'in_stock',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_inventory_status (status),
  INDEX idx_inventory_quantity (quantity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
