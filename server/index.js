const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "globalmart_secret_key_change_in_production";

let pool;

async function initDb() {
  pool = await mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "globalmart",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

async function getCartData(cartId) {
  const [rows] = await pool.query(
    `SELECT ci.product_id, ci.quantity, p.name, p.price, p.image_url
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.cart_id = ?`,
    [cartId]
  );

  let subtotal = 0;
  let totalQuantity = 0;
  const items = rows.map((row) => {
    const lineTotal = Number(row.price) * row.quantity;
    subtotal += lineTotal;
    totalQuantity += row.quantity;
    return {
      productId: row.product_id,
      quantity: row.quantity,
      name: row.name,
      price: Number(row.price),
      image_url: row.image_url
    };
  });

  return {
    items,
    subtotal,
    totalQuantity
  };
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, passwordHash]
    );

    const userId = result.insertId;
    const token = jwt.sign({ userId, email, name }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      message: "Registration successful",
      token,
      user: { id: userId, name, email }
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const [rows] = await pool.query("SELECT id, name, email, password_hash FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/auth/me", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, email, created_at FROM users WHERE id = ?", [req.user.userId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

app.get("/api/orders", authMiddleware, async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.id, o.status, o.total, o.shipping_address, o.created_at
       FROM orders o WHERE o.user_id = ? ORDER BY o.created_at DESC`,
      [req.user.userId]
    );

    for (const order of orders) {
      const [items] = await pool.query(
        `SELECT oi.quantity, oi.price, p.id AS product_id, p.name, p.image_url
         FROM order_items oi JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
    }

    res.json({ orders });
  } catch (err) {
    console.error("Orders fetch error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

app.post("/api/orders", authMiddleware, async (req, res) => {
  const { items, shippingAddress } = req.body || {};
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Order must have at least one item" });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const productId = item.productId || item.id;
      const qty = Number(item.qty || item.quantity || 0);
      if (!productId || qty <= 0) continue;

      const [productRows] = await conn.query("SELECT price FROM products WHERE id = ?", [productId]);
      if (productRows.length === 0) continue;

      const price = Number(productRows[0].price);
      total += price * qty;
      orderItems.push({ productId, quantity: qty, price });
    }

    if (orderItems.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ error: "No valid items in order" });
    }

    const [orderResult] = await conn.query(
      "INSERT INTO orders (user_id, total, shipping_address) VALUES (?, ?, ?)",
      [req.user.userId, total, shippingAddress || null]
    );
    const orderId = orderResult.insertId;

    for (const item of orderItems) {
      await conn.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
        [orderId, item.productId, item.quantity, item.price]
      );
    }

    await conn.commit();
    conn.release();

    res.status(201).json({
      message: "Order placed successfully",
      orderId,
      total
    });
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); conn.release(); } catch (_) {}
    }
    console.error("Order creation error:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

app.get("/api/addresses", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, street, city, state, zip, country, is_default FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC",
      [req.user.userId]
    );
    res.json({ addresses: rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch addresses" });
  }
});

app.post("/api/addresses", authMiddleware, async (req, res) => {
  const { name, street, city, state, zip, country, isDefault } = req.body || {};
  if (!name || !street || !city) {
    return res.status(400).json({ error: "Name, street, and city are required" });
  }

  try {
    if (isDefault) {
      await pool.query("UPDATE addresses SET is_default = FALSE WHERE user_id = ?", [req.user.userId]);
    }

    const [result] = await pool.query(
      "INSERT INTO addresses (user_id, name, street, city, state, zip, country, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [req.user.userId, name, street, city, state || null, zip || null, country || "United States", isDefault || false]
    );

    res.status(201).json({
      message: "Address added",
      addressId: result.insertId
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to add address" });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const q = req.query.q;
    const category = req.query.category;

    let sql = "SELECT p.id, p.name, p.description, p.price, p.image_url, c.name AS category, c.slug AS category_slug FROM products p JOIN categories c ON p.category_id = c.id";
    const params = [];
    const conditions = [];

    if (q) {
      conditions.push("(p.name LIKE ? OR p.description LIKE ?)");
      const like = `%${q}%`;
      params.push(like, like);
    }

    if (category) {
      conditions.push("c.slug = ?");
      params.push(category);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await pool.query(
      "SELECT p.id, p.name, p.description, p.price, p.image_url, c.name AS category FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

app.get("/api/categories", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, slug FROM categories ORDER BY name");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

app.get("/api/cart", async (req, res) => {
  const cartId = req.query.cartId;
  if (!cartId) {
    return res.status(400).json({ error: "cartId is required" });
  }

  try {
    const data = await getCartData(cartId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

app.post("/api/cart/sync", async (req, res) => {
  const { cartId, items } = req.body || {};

  if (!cartId || !Array.isArray(items)) {
    return res.status(400).json({ error: "cartId and items array are required" });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    await conn.query("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);

    for (const item of items) {
      const productId = item.productId || item.id;
      const qty = Number(item.qty || item.quantity || 0);
      if (!productId || !qty || qty <= 0) continue;
      await conn.query(
        "INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)",
        [cartId, productId, qty]
      );
    }

    await conn.commit();
    conn.release();

    const data = await getCartData(cartId);
    res.json(data);
  } catch (err) {
    if (conn) {
      try {
        await conn.rollback();
        conn.release();
      } catch (_) {
        // ignore rollback errors
      }
    }
    res.status(500).json({ error: "Failed to sync cart" });
  }
});

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`GlobalMart API listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database", err);
    process.exit(1);
  });
