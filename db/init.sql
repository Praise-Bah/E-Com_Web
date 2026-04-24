-- GlobalMart initial schema and seed data

CREATE DATABASE IF NOT EXISTS globalmart CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE globalmart;

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  stock INT NOT NULL DEFAULT 50,
  is_deal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cart_id VARCHAR(64) NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_cart_product (cart_id, product_id),
  CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  rating TINYINT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS wishlist_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_wishlist (user_id, product_id),
  CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_wishlist_product FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  total DECIMAL(10,2) NOT NULL,
  shipping_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  street VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  zip VARCHAR(20),
  country VARCHAR(100) NOT NULL DEFAULT 'United States',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT INTO categories (name, slug) VALUES
  ("Electronics", "electronics"),
  ("Fashion", "fashion"),
  ("Home & Kitchen", "home-kitchen"),
  ("Beauty", "beauty"),
  ("Sports", "sports"),
  ("Grocery", "grocery")
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Electronics (15 products)
INSERT INTO products (category_id, name, description, price, image_url, stock, is_deal) VALUES
  (1, "Lightweight performance laptop", "Powerful multi-core laptop with fast SSD storage and all-day battery life.", 459999, "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80", 25, TRUE),
  (1, "Wireless noise cancelling headphones", "Comfortable over-ear headphones with active noise cancellation.", 89999, "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80", 50, FALSE),
  (1, "Fitness smart watch with heart rate monitor", "Track your workouts, sleep, and heart rate with this smart watch.", 119999, "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80", 30, TRUE),
  (1, "Mirrorless camera kit", "High quality mirrorless camera with interchangeable lens.", 539999, "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80", 15, FALSE),
  (1, "Bluetooth portable speaker", "Waterproof portable speaker with 20 hours battery life.", 45999, "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=600&q=80", 60, TRUE),
  (1, "Wireless earbuds pro", "Premium earbuds with spatial audio and noise cancellation.", 149999, "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80", 40, FALSE),
  (1, "4K Ultra HD Smart TV 55 inch", "Crystal clear display with smart streaming built-in.", 349999, "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=80", 20, TRUE),
  (1, "Gaming console latest edition", "Next-gen gaming with 4K graphics and fast loading.", 299999, "https://images.unsplash.com/photo-1486401899868-0e435ed85128?auto=format&fit=crop&w=600&q=80", 10, FALSE),
  (1, "Tablet 10 inch with stylus", "Perfect for work and creativity with included stylus.", 279999, "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80", 35, FALSE),
  (1, "Wireless charging pad", "Fast wireless charging for all compatible devices.", 19999, "https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?auto=format&fit=crop&w=600&q=80", 100, FALSE),
  (1, "External SSD 1TB", "Ultra-fast portable storage for professionals.", 79999, "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80", 45, FALSE),
  (1, "Mechanical gaming keyboard", "RGB backlit keyboard with premium switches.", 69999, "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=600&q=80", 55, TRUE),
  (1, "Wireless gaming mouse", "High precision sensor with customizable buttons.", 39999, "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80", 70, FALSE),
  (1, "USB-C hub multiport adapter", "Connect all your devices with this versatile hub.", 29999, "https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?auto=format&fit=crop&w=600&q=80", 80, FALSE),
  (1, "Drone with 4K camera", "Capture stunning aerial footage with GPS stability.", 449999, "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=600&q=80", 12, TRUE),

-- Fashion (15 products)
  (2, "Running sneakers", "Lightweight sneakers designed for daily runs and comfort.", 54999, "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80", 60, FALSE),
  (2, "Everyday backpack", "Durable backpack with multiple compartments for work or school.", 35999, "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80", 45, FALSE),
  (2, "Classic leather watch", "Elegant timepiece with genuine leather strap.", 89999, "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=600&q=80", 30, TRUE),
  (2, "Designer sunglasses", "UV protection with premium polarized lenses.", 79999, "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80", 40, FALSE),
  (2, "Cotton casual t-shirt", "Soft breathable cotton in multiple colors.", 14999, "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80", 200, FALSE),
  (2, "Denim jeans slim fit", "Classic denim with modern slim fit design.", 44999, "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?auto=format&fit=crop&w=600&q=80", 80, TRUE),
  (2, "Leather wallet bifold", "Genuine leather wallet with RFID protection.", 24999, "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80", 90, FALSE),
  (2, "Winter jacket waterproof", "Stay warm and dry with this insulated jacket.", 129999, "https://images.unsplash.com/photo-1544923246-77307dd628b0?auto=format&fit=crop&w=600&q=80", 25, FALSE),
  (2, "Formal dress shirt", "Wrinkle-free dress shirt for professional looks.", 34999, "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80", 55, FALSE),
  (2, "Canvas tote bag", "Eco-friendly reusable bag with stylish design.", 19999, "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80", 120, FALSE),
  (2, "Athletic shorts", "Quick-dry fabric perfect for workouts.", 22999, "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=600&q=80", 75, TRUE),
  (2, "Wool blend sweater", "Cozy sweater for cool weather comfort.", 54999, "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=600&q=80", 40, FALSE),
  (2, "Leather belt classic", "Timeless design with durable buckle.", 29999, "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80", 65, FALSE),
  (2, "Sports cap adjustable", "Breathable cap with adjustable strap.", 12999, "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80", 150, FALSE),
  (2, "Ankle boots leather", "Stylish boots for any occasion.", 99999, "https://images.unsplash.com/photo-1542840410-8e878b394108?auto=format&fit=crop&w=600&q=80", 35, TRUE),

-- Home & Kitchen (15 products)
  (3, "Home & kitchen bundle", "Curated bundle of kitchen essentials for everyday cooking.", 109999, "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80", 20, TRUE),
  (3, "Non-stick cookware set", "Complete 10-piece set with ergonomic handles.", 89999, "https://images.unsplash.com/photo-1584990347449-a6330c1f3d2b?auto=format&fit=crop&w=600&q=80", 30, FALSE),
  (3, "Coffee maker programmable", "Wake up to fresh coffee with timer function.", 64999, "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=600&q=80", 40, TRUE),
  (3, "Blender high speed", "Powerful motor for smoothies and food prep.", 49999, "https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=600&q=80", 55, FALSE),
  (3, "Air fryer digital", "Healthy cooking with little to no oil.", 79999, "https://images.unsplash.com/photo-1648055603817-9d8c0a0e2b0f?auto=format&fit=crop&w=600&q=80", 35, TRUE),
  (3, "Knife set with block", "Professional grade stainless steel knives.", 69999, "https://images.unsplash.com/photo-1566454419290-57a0589c9b17?auto=format&fit=crop&w=600&q=80", 25, FALSE),
  (3, "Bedding set queen size", "Luxurious cotton sheets with pillowcases.", 54999, "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80", 45, FALSE),
  (3, "Vacuum cleaner cordless", "Powerful suction with long battery life.", 199999, "https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=600&q=80", 20, FALSE),
  (3, "Smart home speaker", "Voice-controlled assistant for your home.", 59999, "https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&w=600&q=80", 50, TRUE),
  (3, "Throw blanket soft", "Cozy fleece blanket for sofa or bed.", 24999, "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80", 80, FALSE),
  (3, "Dinnerware set 16 piece", "Elegant ceramic plates and bowls.", 44999, "https://images.unsplash.com/photo-1603199506016-5d54ebf56b63?auto=format&fit=crop&w=600&q=80", 30, FALSE),
  (3, "Instant pot multi-cooker", "7-in-1 cooking functions for easy meals.", 89999, "https://images.unsplash.com/photo-1585664811087-47f65abbad64?auto=format&fit=crop&w=600&q=80", 25, TRUE),
  (3, "Wall art canvas print", "Modern abstract art to decorate your space.", 34999, "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80", 60, FALSE),
  (3, "LED desk lamp adjustable", "Eye-caring light with multiple brightness levels.", 29999, "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80", 70, FALSE),
  (3, "Storage containers set", "Airtight containers for pantry organization.", 27999, "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=600&q=80", 90, FALSE),

-- Beauty (15 products)
  (4, "Skincare routine set", "Complete morning and night skincare essentials.", 74999, "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80", 40, TRUE),
  (4, "Vitamin C serum", "Brightening serum for radiant skin.", 29999, "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80", 60, FALSE),
  (4, "Moisturizer SPF 30", "Daily hydration with sun protection.", 24999, "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=600&q=80", 80, FALSE),
  (4, "Hair dryer professional", "Ionic technology for fast drying.", 59999, "https://images.unsplash.com/photo-1522338140262-f46f5913618a?auto=format&fit=crop&w=600&q=80", 35, TRUE),
  (4, "Makeup brush set 12pc", "Professional brushes for flawless application.", 34999, "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80", 50, FALSE),
  (4, "Perfume eau de parfum", "Long-lasting fragrance with elegant notes.", 89999, "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=600&q=80", 45, FALSE),
  (4, "Lip gloss collection", "Set of 6 trendy shades for every mood.", 19999, "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80", 100, TRUE),
  (4, "Face mask variety pack", "Sheet masks for hydration and glow.", 14999, "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=600&q=80", 120, FALSE),
  (4, "Electric toothbrush", "Sonic cleaning with multiple modes.", 49999, "https://images.unsplash.com/photo-1559590240-6e4b1c0e7c0c?auto=format&fit=crop&w=600&q=80", 55, FALSE),
  (4, "Nail polish set 8 colors", "Chip-resistant formula in trendy colors.", 17999, "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=600&q=80", 70, FALSE),
  (4, "Eye cream anti-aging", "Reduce dark circles and fine lines.", 39999, "https://images.unsplash.com/photo-1567721913486-6585f069b332?auto=format&fit=crop&w=600&q=80", 45, TRUE),
  (4, "Body lotion shea butter", "Deep moisturizing for silky smooth skin.", 19999, "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=600&q=80", 90, FALSE),
  (4, "Hair straightener ceramic", "Fast heat-up with adjustable temperature.", 44999, "https://images.unsplash.com/photo-1522338140262-f46f5913618a?auto=format&fit=crop&w=600&q=80", 40, FALSE),
  (4, "Eyeshadow palette 18 shades", "Matte and shimmer shades for any look.", 32999, "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80", 55, TRUE),
  (4, "Facial cleanser gentle", "Removes makeup without stripping skin.", 16999, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=600&q=80", 85, FALSE),

-- Sports (15 products)
  (5, "Yoga mat premium", "Non-slip surface with carrying strap.", 24999, "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=600&q=80", 60, FALSE),
  (5, "Dumbbell set adjustable", "Space-saving design from 5 to 25 lbs.", 149999, "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80", 30, TRUE),
  (5, "Resistance bands set", "5 levels of resistance for full body workout.", 19999, "https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=600&q=80", 100, FALSE),
  (5, "Running shoes cushioned", "Maximum comfort for long distance runs.", 79999, "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=600&q=80", 45, TRUE),
  (5, "Basketball official size", "Indoor/outdoor ball with superior grip.", 24999, "https://images.unsplash.com/photo-1494199505258-5f95387f933c?auto=format&fit=crop&w=600&q=80", 70, FALSE),
  (5, "Tennis racket graphite", "Lightweight with enlarged sweet spot.", 89999, "https://images.unsplash.com/photo-1617083934555-d0f6d44c8e59?auto=format&fit=crop&w=600&q=80", 25, FALSE),
  (5, "Fitness tracker band", "Track steps, heart rate, and sleep.", 39999, "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=600&q=80", 80, TRUE),
  (5, "Gym bag duffle", "Large capacity with shoe compartment.", 34999, "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80", 50, FALSE),
  (5, "Jump rope speed", "Ball bearing handles for smooth rotation.", 12999, "https://images.unsplash.com/photo-1434682881908-b43d0467b798?auto=format&fit=crop&w=600&q=80", 120, FALSE),
  (5, "Foam roller muscle", "Deep tissue massage for recovery.", 22999, "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80", 65, FALSE),
  (5, "Water bottle insulated", "Keeps drinks cold 24 hours or hot 12 hours.", 19999, "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80", 150, FALSE),
  (5, "Cycling helmet safety", "Lightweight with adjustable fit system.", 49999, "https://images.unsplash.com/photo-1557803175-2f8c4e5e6e6e?auto=format&fit=crop&w=600&q=80", 35, TRUE),
  (5, "Protein shaker bottle", "Leak-proof with mixing ball included.", 9999, "https://images.unsplash.com/photo-1594498653385-d5172c532c00?auto=format&fit=crop&w=600&q=80", 200, FALSE),
  (5, "Pull-up bar doorway", "No screws needed, fits most door frames.", 27999, "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80", 40, FALSE),
  (5, "Soccer ball size 5", "FIFA quality for match play.", 29999, "https://images.unsplash.com/photo-1552318965-6e6be7484ada?auto=format&fit=crop&w=600&q=80", 55, FALSE),

-- Grocery (15 products)
  (6, "Organic coffee beans 1kg", "Single origin Arabica, medium roast.", 24999, "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=600&q=80", 80, FALSE),
  (6, "Extra virgin olive oil 1L", "Cold-pressed from premium olives.", 19999, "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80", 100, TRUE),
  (6, "Honey raw organic 500g", "Pure unfiltered honey from local farms.", 14999, "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80", 70, FALSE),
  (6, "Mixed nuts premium 1kg", "Almonds, cashews, walnuts, and more.", 34999, "https://images.unsplash.com/photo-1536591375637-b3f65d7df44c?auto=format&fit=crop&w=600&q=80", 50, TRUE),
  (6, "Green tea bags 100 pack", "Antioxidant-rich Japanese green tea.", 12999, "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80", 120, FALSE),
  (6, "Pasta variety pack", "Spaghetti, penne, and fusilli combo.", 9999, "https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=600&q=80", 150, FALSE),
  (6, "Chocolate dark 70% cacao", "Premium Belgian chocolate bar.", 7999, "https://images.unsplash.com/photo-1481391319762-47dff72954d9?auto=format&fit=crop&w=600&q=80", 90, TRUE),
  (6, "Rice basmati premium 5kg", "Aged aromatic long-grain rice.", 17999, "https://images.unsplash.com/photo-1586201375761-83865001e8ac?auto=format&fit=crop&w=600&q=80", 60, FALSE),
  (6, "Oats rolled organic 1kg", "Heart-healthy whole grain oats.", 8999, "https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?auto=format&fit=crop&w=600&q=80", 85, FALSE),
  (6, "Protein bar box 12 pack", "High protein snack for active lifestyle.", 24999, "https://images.unsplash.com/photo-1622484212850-eb596d769eab?auto=format&fit=crop&w=600&q=80", 70, TRUE),
  (6, "Coconut oil organic 500ml", "Cold-pressed for cooking and beauty.", 12999, "https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=600&q=80", 75, FALSE),
  (6, "Granola clusters 500g", "Crunchy mix with dried fruits.", 11999, "https://images.unsplash.com/photo-1517093728432-a0440f8d45af?auto=format&fit=crop&w=600&q=80", 65, FALSE),
  (6, "Sparkling water 12 pack", "Refreshing mineral water with bubbles.", 8999, "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=600&q=80", 200, FALSE),
  (6, "Almond butter natural 400g", "Stone-ground with no added sugar.", 15999, "https://images.unsplash.com/photo-1612187181009-ee4e7c32e5a5?auto=format&fit=crop&w=600&q=80", 55, FALSE),
  (6, "Energy drink pack 6 cans", "Sugar-free boost for active days.", 11999, "https://images.unsplash.com/photo-1527960471264-932f39eb5846?auto=format&fit=crop&w=600&q=80", 100, TRUE);

-- Seed admin user (password: Admin123)
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Admin', 'admin1@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1U6f/VLR3bYLH8S9VuFnPpN4YLVPw2q', 'admin')
ON DUPLICATE KEY UPDATE name = VALUES(name);
