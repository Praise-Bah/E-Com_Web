// Admin Panel JavaScript
const API_BASE = window.API_BASE || "http://localhost:3000/api";

function getAdminToken() {
    return localStorage.getItem("gm_admin_token");
}

function getAdminUser() {
    const user = localStorage.getItem("gm_admin_user");
    return user ? JSON.parse(user) : null;
}

function adminLogout() {
    localStorage.removeItem("gm_admin_token");
    localStorage.removeItem("gm_admin_user");
    window.location.href = "login.html";
}

async function adminFetch(endpoint, options = {}) {
    const token = getAdminToken();
    if (!token) {
        window.location.href = "login.html";
        return null;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            ...options.headers
        }
    });

    if (res.status === 401 || res.status === 403) {
        adminLogout();
        return null;
    }

    return res;
}

function formatPrice(amount) {
    return `Frs ${Number(amount).toLocaleString("en-US")}`;
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

// Dashboard Functions
async function loadDashboardStats() {
    const res = await adminFetch("/admin/stats");
    if (!res) return;

    const data = await res.json();
    
    document.getElementById("stat-products").textContent = data.productCount || 0;
    document.getElementById("stat-orders").textContent = data.orderCount || 0;
    document.getElementById("stat-users").textContent = data.userCount || 0;
    document.getElementById("stat-revenue").textContent = formatPrice(data.revenue || 0);
}

// Products Functions
let categories = [];

async function loadCategories() {
    const res = await adminFetch("/admin/categories");
    if (!res) return;
    categories = await res.json();
    
    const select = document.getElementById("product-category");
    if (select) {
        select.innerHTML = '<option value="">Select category...</option>';
        categories.forEach(cat => {
            select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
        });
    }
}

async function loadProducts() {
    const res = await adminFetch("/admin/products");
    if (!res) return;

    const products = await res.json();
    const tbody = document.getElementById("products-tbody");
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No products found</td></tr>';
        return;
    }

    tbody.innerHTML = products.map(p => `
        <tr>
            <td><img src="${p.image_url}" alt="${p.name}"></td>
            <td><strong>${p.name}</strong></td>
            <td>${p.category}</td>
            <td>${formatPrice(p.price)}</td>
            <td class="${p.stock <= 5 ? 'stock-low' : 'stock-ok'}">
                ${p.stock <= 0 ? 'Out of Stock' : p.stock <= 5 ? `${p.stock} left` : p.stock}
            </td>
            <td>${p.is_deal ? '✓ Deal' : '-'}</td>
            <td>
                <button class="admin-btn" onclick="editProduct(${p.id})">Edit</button>
                <button class="admin-btn admin-btn-danger" onclick="deleteProduct(${p.id}, '${p.name.replace(/'/g, "\\'")}')">Delete</button>
            </td>
        </tr>
    `).join("");
}

function showProductModal(product = null) {
    const modal = document.getElementById("product-modal");
    const title = document.getElementById("modal-title");
    const form = document.getElementById("product-form");

    if (product) {
        title.textContent = "Edit Product";
        document.getElementById("product-id").value = product.id;
        document.getElementById("product-name").value = product.name;
        document.getElementById("product-description").value = product.description || "";
        document.getElementById("product-price").value = product.price;
        document.getElementById("product-stock").value = product.stock;
        document.getElementById("product-category").value = product.category_id;
        document.getElementById("product-image").value = product.image_url;
        document.getElementById("product-deal").checked = product.is_deal;
    } else {
        title.textContent = "Add Product";
        form.reset();
        document.getElementById("product-id").value = "";
    }

    modal.style.display = "flex";
}

function hideProductModal() {
    document.getElementById("product-modal").style.display = "none";
}

async function editProduct(id) {
    const res = await adminFetch(`/admin/products`);
    if (!res) return;
    
    const products = await res.json();
    const product = products.find(p => p.id === id);
    if (product) {
        showProductModal(product);
    }
}

async function deleteProduct(id, name) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    const res = await adminFetch(`/admin/products/${id}`, { method: "DELETE" });
    if (res && res.ok) {
        loadProducts();
    } else {
        alert("Failed to delete product");
    }
}

async function saveProduct(e) {
    e.preventDefault();
    
    const id = document.getElementById("product-id").value;
    const data = {
        name: document.getElementById("product-name").value,
        description: document.getElementById("product-description").value,
        price: Number(document.getElementById("product-price").value),
        stock: Number(document.getElementById("product-stock").value),
        category_id: Number(document.getElementById("product-category").value),
        image_url: document.getElementById("product-image").value,
        is_deal: document.getElementById("product-deal").checked
    };

    const endpoint = id ? `/admin/products/${id}` : "/admin/products";
    const method = id ? "PUT" : "POST";

    const res = await adminFetch(endpoint, {
        method,
        body: JSON.stringify(data)
    });

    if (res && res.ok) {
        hideProductModal();
        loadProducts();
    } else {
        const err = await res.json();
        alert(err.error || "Failed to save product");
    }
}

// Orders Functions
async function loadOrders() {
    const res = await adminFetch("/admin/orders");
    if (!res) return;

    const { orders } = await res.json();
    const tbody = document.getElementById("orders-tbody");
    
    if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No orders found</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(o => `
        <tr>
            <td><strong>#${o.id}</strong></td>
            <td>
                <div>${o.user_name}</div>
                <small style="color:#666;">${o.user_email}</small>
            </td>
            <td>${formatDate(o.created_at)}</td>
            <td>${o.items ? o.items.length : 0} items</td>
            <td>${formatPrice(o.total)}</td>
            <td>
                <select class="status-select" onchange="updateOrderStatus(${o.id}, this.value)">
                    <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="processing" ${o.status === 'processing' ? 'selected' : ''}>Processing</option>
                    <option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
            <td>
                <button class="admin-btn" onclick="viewOrder(${o.id})">View</button>
            </td>
        </tr>
    `).join("");
}

async function updateOrderStatus(id, status) {
    const res = await adminFetch(`/admin/orders/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status })
    });

    if (!res || !res.ok) {
        alert("Failed to update order status");
        loadOrders();
    }
}

async function viewOrder(id) {
    const res = await adminFetch("/admin/orders");
    if (!res) return;

    const { orders } = await res.json();
    const order = orders.find(o => o.id === id);
    if (!order) return;

    const modal = document.getElementById("order-modal");
    const details = document.getElementById("order-details");

    details.innerHTML = `
        <div class="order-info">
            <h3>Order #${order.id}</h3>
            <p><strong>Customer:</strong> ${order.user_name} (${order.user_email})</p>
            <p><strong>Date:</strong> ${formatDate(order.created_at)}</p>
            <p><strong>Status:</strong> <span class="status-badge status-${order.status}">${order.status}</span></p>
            ${order.shipping_address ? `<p><strong>Shipping Address:</strong> ${order.shipping_address}</p>` : ''}
        </div>
        <div class="order-info">
            <h3>Items</h3>
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-item">
                        <img src="${item.image_url}" alt="${item.name}">
                        <div style="flex:1;">
                            <div>${item.name}</div>
                            <small>Qty: ${item.quantity} × ${formatPrice(item.price)}</small>
                        </div>
                        <div><strong>${formatPrice(item.quantity * item.price)}</strong></div>
                    </div>
                `).join("")}
            </div>
            <p style="text-align:right;font-size:1.2rem;"><strong>Total: ${formatPrice(order.total)}</strong></p>
        </div>
    `;

    modal.style.display = "flex";
}

function hideOrderModal() {
    document.getElementById("order-modal").style.display = "none";
}

// Initialize
document.addEventListener("DOMContentLoaded", function() {
    const token = getAdminToken();
    if (!token && !window.location.pathname.includes("login.html")) {
        window.location.href = "login.html";
        return;
    }

    // Set admin name in nav
    const user = getAdminUser();
    const nameEl = document.getElementById("admin-name");
    if (nameEl && user) {
        nameEl.textContent = user.name || "Admin";
    }

    // Logout button
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", adminLogout);
    }

    // Page-specific initialization
    const page = window.location.pathname.split("/").pop();

    if (page === "index.html" || page === "") {
        loadDashboardStats();
    }

    if (page === "products.html") {
        loadCategories();
        loadProducts();

        document.getElementById("add-product-btn")?.addEventListener("click", () => showProductModal());
        document.getElementById("modal-close")?.addEventListener("click", hideProductModal);
        document.getElementById("cancel-btn")?.addEventListener("click", hideProductModal);
        document.getElementById("product-form")?.addEventListener("submit", saveProduct);

        // Check for action=add in URL
        const params = new URLSearchParams(window.location.search);
        if (params.get("action") === "add") {
            setTimeout(() => showProductModal(), 500);
        }
    }

    if (page === "orders.html") {
        loadOrders();
        document.getElementById("modal-close")?.addEventListener("click", hideOrderModal);
    }
});
