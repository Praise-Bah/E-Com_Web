// API_BASE is set in config.js, fallback for safety
const API_BASE = window.API_BASE || "http://localhost:3000/api";

function getAuthToken() {
  return localStorage.getItem("gm_token");
}

function setAuthToken(token) {
  localStorage.setItem("gm_token", token);
}

function removeAuthToken() {
  localStorage.removeItem("gm_token");
  localStorage.removeItem("gm_user");
}

function getUser() {
  try {
    const raw = localStorage.getItem("gm_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setUser(user) {
  localStorage.setItem("gm_user", JSON.stringify(user));
}

function isLoggedIn() {
  return !!getAuthToken();
}

async function fetchWithAuth(path, options = {}) {
  const token = getAuthToken();
  const headers = { ...options.headers };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  return res;
}

function updateHeaderAuth() {
  const accountItem = document.querySelector(".gm-header-account");
  if (!accountItem) return;

  const user = getUser();
  const smallText = accountItem.querySelector(".gm-header-item-small");
  
  if (user && isLoggedIn()) {
    if (smallText) {
      smallText.textContent = `Hello, ${user.name.split(" ")[0]}`;
    }
    accountItem.onclick = () => { window.location.href = "account.html"; };
  } else {
    if (smallText) {
      smallText.textContent = "Hello, sign in";
    }
    accountItem.onclick = () => { window.location.href = "login.html"; };
  }
}

function initBackToTop() {
  const backToTop = document.querySelector(".gm-footer-backtotop");
  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
}

async function initProductsFilters(q, activeCategory) {
  const list = document.querySelector(".gm-filter-categories");
  if (!list) return;

  try {
    const categories = await fetchJson("/categories");
    list.innerHTML = "";

    const allLi = document.createElement("li");
    const allLink = document.createElement("a");
    allLink.href = q ? `products.html?q=${encodeURIComponent(q)}` : "products.html";
    allLink.textContent = "All departments";
    if (!activeCategory) {
      allLink.style.fontWeight = "700";
    }
    allLi.appendChild(allLink);
    list.appendChild(allLi);

    categories.forEach((cat) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      const slug = cat.slug || cat.name;
      const parts = [];
      if (q) parts.push(`q=${encodeURIComponent(q)}`);
      parts.push(`category=${encodeURIComponent(slug)}`);
      a.href = `products.html?${parts.join("&")}`;
      a.textContent = cat.name;
      if (activeCategory === slug) {
        a.style.fontWeight = "700";
      }
      li.appendChild(a);
      list.appendChild(li);
    });
  } catch {
    // leave default list on error
  }
}

function getCart() {
  try {
    const raw = localStorage.getItem("gm_cart");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem("gm_cart", JSON.stringify(cart));
}

function getCartId() {
  let id = localStorage.getItem("gm_cart_id");
  if (!id) {
    id = "gm_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("gm_cart_id", id);
  }
  return id;
}

async function syncCartToServer(cart) {
  try {
    await fetch(`${API_BASE}/cart/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartId: getCartId(), items: cart })
    });
  } catch {
    // ignore sync errors on the client; local cart still works
  }
}

function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
  document.querySelectorAll(".gm-cart-count").forEach((el) => {
    el.textContent = String(count);
  });
}

function initSearchRedirect() {
  const searchForm = document.querySelector(".gm-search");
  if (!searchForm) return;

  searchForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const input = searchForm.querySelector(".gm-search-input");
    const q = input ? input.value.trim() : "";
    const target = "products.html" + (q ? `?q=${encodeURIComponent(q)}` : "");
    window.location.href = target;
  });
}

function getCurrentPage() {
  const path = window.location.pathname;
  const file = path.split("/").pop() || "index.html";
  return file.toLowerCase();
}

async function fetchJson(path) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

function initHomePage() {
  const dealsRow = document.querySelector('.gm-home-row-scroll[data-row="deals"]');
  const historyRow = document.querySelector('.gm-home-row-scroll[data-row="history"]');
  if (!dealsRow && !historyRow) return;

  fetchJson("/products")
    .then((products) => {
      if (!Array.isArray(products)) return;
      if (dealsRow) renderHomeRow(dealsRow, products.slice(0, 4));
      if (historyRow) renderHomeRow(historyRow, products.slice(3));
    })
    .catch(() => {
      // keep static fallback content on error
    });
}

function renderHomeRow(container, products) {
  if (!container) return;
  container.innerHTML = "";
  products.forEach((p) => {
    const item = document.createElement("article");
    item.className = "gm-home-product";

    const imgWrap = document.createElement("div");
    imgWrap.className = "gm-home-product-img";
    const img = document.createElement("img");
    img.src = p.image_url;
    img.alt = p.name;
    imgWrap.appendChild(img);

    const category = document.createElement("div");
    category.className = "gm-product-card-category";
    if (p.category) {
      category.textContent = p.category;
    }

    const title = document.createElement("div");
    title.className = "gm-home-product-title";
    title.textContent = p.name;

    const price = document.createElement("div");
    price.className = "gm-home-product-price";
    price.textContent = `$${Number(p.price).toFixed(2)}`;

    item.appendChild(imgWrap);
    item.appendChild(title);
    item.appendChild(price);
    container.appendChild(item);
  });
}

function renderProductsGrid(products) {
  const grid = document.querySelector(".gm-products-grid");
  if (!grid) return;

  grid.innerHTML = "";

  if (!products || products.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "No products found.";
    empty.style.fontSize = "0.9rem";
    grid.appendChild(empty);
    return;
  }

  products.forEach((p) => {
    const card = document.createElement("article");
    card.className = "gm-product-card";

    const imgWrap = document.createElement("div");
    imgWrap.className = "gm-product-card-img";
    const img = document.createElement("img");
    img.src = p.image_url;
    img.alt = p.name;
    imgWrap.appendChild(img);

    const category = document.createElement("div");
    category.className = "gm-product-card-category";
    if (p.category) {
      category.textContent = p.category;
    }

    const title = document.createElement("div");
    title.className = "gm-product-card-title";
    title.textContent = p.name;

    const stars = document.createElement("div");
    stars.className = "gm-stars";
    const ratingBase = (p.id || 1) % 3; // 0,1,2
    const rating = 3 + ratingBase; // 3–5
    const fullStars = "★".repeat(rating);
    const emptyStars = "☆".repeat(5 - rating);
    stars.textContent = fullStars + emptyStars;

    const price = document.createElement("div");
    price.className = "gm-product-card-price";
    price.textContent = `$${Number(p.price).toFixed(2)}`;

    const link = document.createElement("a");
    link.href = `product.html?id=${encodeURIComponent(p.id)}`;
    link.textContent = "View details";
    link.style.color = "#007185";
    link.style.fontSize = "0.85rem";

    card.appendChild(imgWrap);
    card.appendChild(category);
    card.appendChild(title);
    card.appendChild(stars);
    card.appendChild(price);
    card.appendChild(link);

    grid.appendChild(card);
  });
}

async function initProductsPage() {
  const mainSection = document.querySelector(".gm-products-main");
  if (!mainSection) return;

  const params = new URLSearchParams(window.location.search);
  const q = params.get("q") || "";
   const category = params.get("category") || "";

  const resultsText = mainSection.querySelector("p");
  if (resultsText) {
    let label = "All products";
    if (q) label = `Results for <strong>"${q}"</strong>`;
    if (category) label += ` in <strong>${category}</strong>`;
    resultsText.innerHTML = label;
  }

  initProductsFilters(q, category);

  try {
    let path = "/products";
    const qs = [];
    if (q) qs.push(`q=${encodeURIComponent(q)}`);
    if (category) qs.push(`category=${encodeURIComponent(category)}`);
    if (qs.length) path += `?${qs.join("&")}`;

    const products = await fetchJson(path);
    renderProductsGrid(products);
  } catch (err) {
    const grid = document.querySelector(".gm-products-grid");
    if (grid) {
      grid.innerHTML = "";
      const error = document.createElement("p");
      error.textContent = "Unable to load products right now. Please try again later.";
      error.style.fontSize = "0.9rem";
      grid.appendChild(error);
    }
  }
}

function initCartPage() {
  const cartSection = document.querySelector(".gm-cart");
  if (!cartSection) return;

  const itemsContainer = cartSection.querySelector(".gm-cart-items");
  const summary = cartSection.querySelector(".gm-cart-summary");
  if (!itemsContainer || !summary) return;

  function render(cart) {
    itemsContainer.innerHTML = "";

    if (!cart || cart.length === 0) {
      const p = document.createElement("p");
      p.textContent = "Your cart is empty.";
      itemsContainer.appendChild(p);
      summary.innerHTML = "<p>Subtotal (0 items): <strong>$0.00</strong></p>";
      return;
    }

    let subtotal = 0;
    let totalItems = 0;

    cart.forEach((item, index) => {
      const article = document.createElement("article");
      article.className = "gm-cart-item";

      const imgWrap = document.createElement("div");
      const img = document.createElement("img");
      img.src = item.image_url;
      img.alt = item.name;
      imgWrap.appendChild(img);

      const info = document.createElement("div");
      const title = document.createElement("h2");
      title.style.fontSize = "0.95rem";
      title.textContent = item.name;
      const inStock = document.createElement("p");
      inStock.style.color = "#007185";
      inStock.style.fontSize = "0.85rem";
      inStock.textContent = "In stock";
      const price = document.createElement("p");
      price.style.fontSize = "0.95rem";
      price.style.fontWeight = "700";
      price.style.marginTop = "0.25rem";
      price.textContent = `$${item.price.toFixed(2)}`;

      const controls = document.createElement("div");
      controls.style.marginTop = "0.5rem";
      controls.style.fontSize = "0.85rem";
      controls.innerHTML = `Qty: ${item.qty} | <a href="#" data-index="${index}" class="gm-cart-delete" style="color:#007185;">Delete</a>`;

      info.appendChild(title);
      info.appendChild(inStock);
      info.appendChild(price);
      info.appendChild(controls);

      article.appendChild(imgWrap);
      article.appendChild(info);
      itemsContainer.appendChild(article);

      subtotal += item.price * item.qty;
      totalItems += item.qty;
    });

    summary.innerHTML = `<p>Subtotal (${totalItems} items): <strong>$${subtotal.toFixed(2)}</strong></p><button class="gm-btn-primary">Proceed to checkout</button>`;

    itemsContainer.querySelectorAll(".gm-cart-delete").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const idx = Number(link.getAttribute("data-index"));
        const cart = getCart();
        cart.splice(idx, 1);
        saveCart(cart);
        updateCartCount();
        syncCartToServer(cart);
        render(cart);
      });
    });
  }

  (async () => {
    let cart = getCart();
    try {
      const remote = await fetchJson(`/cart?cartId=${encodeURIComponent(getCartId())}`);
      if (remote && Array.isArray(remote.items) && remote.items.length) {
        cart = remote.items.map((item) => ({
          id: item.productId,
          name: item.name,
          price: Number(item.price),
          image_url: item.image_url,
          qty: item.quantity
        }));
        saveCart(cart);
        updateCartCount();
      }
    } catch {
      // fall back to local cart only
    }
    render(cart);
  })();
}

async function initProductDetailPage() {
  const detailSection = document.querySelector(".gm-product-detail");
  if (!detailSection) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) {
    const info = detailSection.querySelector(".gm-product-info");
    if (info) {
      info.innerHTML = "<p>Product not specified.</p>";
    }
    return;
  }

  try {
    const product = await fetchJson(`/products/${encodeURIComponent(id)}`);

    const img = document.querySelector(".gm-product-gallery-main img");
    if (img) {
      img.src = product.image_url;
      img.alt = product.name;
    }

    const title = document.querySelector(".gm-product-info h1");
    if (title) {
      title.textContent = product.name;
    }

    const priceMain = document.querySelector(".gm-product-buy-price");
    if (priceMain) {
      priceMain.textContent = `$${Number(product.price).toFixed(2)}`;
    }

    const aboutList = document.querySelector(".gm-product-about-list");
    if (aboutList && product.description) {
      aboutList.innerHTML = "";
      const li = document.createElement("li");
      li.textContent = product.description;
      aboutList.appendChild(li);
    }

    const breadcrumbLast = document.querySelector(".gm-breadcrumb span");
    if (breadcrumbLast) {
      breadcrumbLast.textContent = product.name;
    }

    const addBtn = document.querySelector(".gm-btn-primary");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        const qtySelect = document.getElementById("qty");
        const qty = qtySelect ? Number(qtySelect.value || 1) : 1;
        const cart = getCart();
        const existing = cart.find((item) => item.id === product.id);
        if (existing) {
          existing.qty += qty;
        } else {
          cart.push({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            image_url: product.image_url,
            qty,
          });
        }
        saveCart(cart);
        updateCartCount();
        syncCartToServer(cart);
      });
    }
  } catch (err) {
    const info = document.querySelector(".gm-product-info");
    if (info) {
      info.innerHTML = "<p>Failed to load product. Please try again later.</p>";
    }
  }
}

function initLoginPage() {
  const form = document.getElementById("login-form");
  if (!form) return;

  if (isLoggedIn()) {
    window.location.href = "account.html";
    return;
  }

  const errorDiv = document.querySelector(".gm-auth-error");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      if (errorDiv) {
        errorDiv.textContent = "Please enter email and password.";
        errorDiv.style.display = "block";
      }
      return;
    }

    const btn = form.querySelector("button");
    if (btn) btn.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      setAuthToken(data.token);
      setUser(data.user);
      window.location.href = "account.html";
    } catch (err) {
      if (errorDiv) {
        errorDiv.textContent = err.message;
        errorDiv.style.display = "block";
      }
      if (btn) btn.disabled = false;
    }
  });
}

function initSignupPage() {
  const form = document.getElementById("signup-form");
  if (!form) return;

  if (isLoggedIn()) {
    window.location.href = "account.html";
    return;
  }

  const errorDiv = document.querySelector(".gm-auth-error");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("password-confirm").value;

    if (!name || !email || !password) {
      if (errorDiv) {
        errorDiv.textContent = "Please fill in all fields.";
        errorDiv.style.display = "block";
      }
      return;
    }

    if (password !== passwordConfirm) {
      if (errorDiv) {
        errorDiv.textContent = "Passwords do not match.";
        errorDiv.style.display = "block";
      }
      return;
    }

    if (password.length < 6) {
      if (errorDiv) {
        errorDiv.textContent = "Password must be at least 6 characters.";
        errorDiv.style.display = "block";
      }
      return;
    }

    const btn = form.querySelector("button");
    if (btn) btn.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setAuthToken(data.token);
      setUser(data.user);
      window.location.href = "account.html";
    } catch (err) {
      if (errorDiv) {
        errorDiv.textContent = err.message;
        errorDiv.style.display = "block";
      }
      if (btn) btn.disabled = false;
    }
  });
}

async function initAccountPage() {
  const accountSection = document.querySelector(".gm-account-sections");
  if (!accountSection) return;

  if (!isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }

  const user = getUser();
  const welcomeEl = document.querySelector(".gm-account-welcome");
  if (welcomeEl && user) {
    welcomeEl.textContent = `Hello, ${user.name}`;
  }

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      removeAuthToken();
      window.location.href = "index.html";
    });
  }
}

async function initOrdersPage() {
  const ordersList = document.querySelector(".gm-orders-list");
  if (!ordersList) return;

  if (!isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetchWithAuth("/orders");
    if (!res.ok) {
      if (res.status === 401) {
        removeAuthToken();
        window.location.href = "login.html";
        return;
      }
      throw new Error("Failed to load orders");
    }

    const data = await res.json();
    const orders = data.orders || [];

    ordersList.innerHTML = "";

    if (orders.length === 0) {
      ordersList.innerHTML = "<p>You have no orders yet.</p>";
      return;
    }

    orders.forEach((order) => {
      const card = document.createElement("div");
      card.className = "gm-order-card";

      const header = document.createElement("div");
      header.style.display = "flex";
      header.style.justifyContent = "space-between";
      header.style.marginBottom = "0.5rem";
      header.style.paddingBottom = "0.5rem";
      header.style.borderBottom = "1px solid #ddd";

      const orderDate = new Date(order.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });

      header.innerHTML = `
        <div>
          <div style="font-size:0.75rem;color:#555;">ORDER PLACED</div>
          <div>${orderDate}</div>
        </div>
        <div>
          <div style="font-size:0.75rem;color:#555;">TOTAL</div>
          <div>$${Number(order.total).toFixed(2)}</div>
        </div>
        <div>
          <div style="font-size:0.75rem;color:#555;">STATUS</div>
          <div style="text-transform:capitalize;">${order.status}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:0.75rem;color:#555;">ORDER # ${order.id}</div>
        </div>
      `;

      const itemsDiv = document.createElement("div");
      if (order.items && order.items.length > 0) {
        order.items.forEach((item) => {
          const itemRow = document.createElement("div");
          itemRow.style.display = "flex";
          itemRow.style.gap = "0.75rem";
          itemRow.style.marginTop = "0.5rem";
          itemRow.style.alignItems = "center";

          itemRow.innerHTML = `
            <img src="${item.image_url}" alt="${item.name}" style="width:60px;height:60px;object-fit:contain;">
            <div>
              <div style="font-weight:500;">${item.name}</div>
              <div style="font-size:0.8rem;color:#555;">Qty: ${item.quantity} × $${Number(item.price).toFixed(2)}</div>
            </div>
          `;
          itemsDiv.appendChild(itemRow);
        });
      }

      card.appendChild(header);
      card.appendChild(itemsDiv);
      ordersList.appendChild(card);
    });
  } catch (err) {
    ordersList.innerHTML = `<p style="color:#d13212;">Failed to load orders. Please try again.</p>`;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  initBackToTop();
  initSearchRedirect();
  updateHeaderAuth();

  const page = getCurrentPage();
  if (page === "index.html" || page === "") {
    initHomePage();
  } else if (page === "products.html") {
    initProductsPage();
  } else if (page === "product.html") {
    initProductDetailPage();
  } else if (page === "cart.html") {
    initCartPage();
  } else if (page === "login.html") {
    initLoginPage();
  } else if (page === "signup.html") {
    initSignupPage();
  } else if (page === "account.html") {
    initAccountPage();
  } else if (page === "orders.html") {
    initOrdersPage();
  }

  updateCartCount();
});
