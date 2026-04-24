// Checkout Page JavaScript
const API_BASE = window.API_BASE || "http://localhost:3000/api";

let selectedAddressId = null;
let cartItems = [];
let addresses = [];

function formatPrice(amount) {
  return `Frs ${Number(amount).toLocaleString("en-US")}`;
}

function getAuthToken() {
  return localStorage.getItem("gm_token");
}

function getCart() {
  const data = localStorage.getItem("gm_cart");
  return data ? JSON.parse(data) : [];
}

function clearCart() {
  localStorage.removeItem("gm_cart");
}

async function fetchWithAuth(endpoint, options = {}) {
  const token = getAuthToken();
  return fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...options.headers
    }
  });
}

function showMessage(msg, type = "error") {
  const el = document.getElementById("checkout-message");
  el.textContent = msg;
  el.className = `checkout-message ${type}`;
  el.style.display = "block";
  window.scrollTo(0, 0);
}

function hideMessage() {
  document.getElementById("checkout-message").style.display = "none";
}

async function loadAddresses() {
  const container = document.getElementById("addresses-list");
  
  try {
    const res = await fetchWithAuth("/addresses");
    if (!res.ok) throw new Error("Failed to load addresses");
    
    const data = await res.json();
    addresses = data.addresses || [];
    
    if (addresses.length === 0) {
      container.innerHTML = '<p style="color:#555;">No saved addresses. Add a new address below.</p>';
      document.getElementById("add-address-form").classList.add("show");
      return;
    }

    container.innerHTML = addresses.map((addr, idx) => {
      const isSelected = addr.is_default || idx === 0;
      if (isSelected && !selectedAddressId) selectedAddressId = addr.id;
      
      return `
        <div class="address-card ${isSelected ? 'selected' : ''}" data-id="${addr.id}">
          <label>
            <input type="radio" name="address" value="${addr.id}" ${isSelected ? 'checked' : ''}>
            <strong>${addr.name}</strong>
          </label>
          <p style="margin:0.25rem 0 0 1.5rem;font-size:0.9rem;">
            ${addr.street}, ${addr.city}${addr.state ? ', ' + addr.state : ''}${addr.zip ? ' ' + addr.zip : ''}<br>
            ${addr.country || 'Cameroon'}
          </p>
        </div>
      `;
    }).join("");

    // Add click handlers
    container.querySelectorAll(".address-card").forEach(card => {
      card.addEventListener("click", () => {
        container.querySelectorAll(".address-card").forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        card.querySelector("input").checked = true;
        selectedAddressId = Number(card.dataset.id);
      });
    });

  } catch (err) {
    container.innerHTML = '<p style="color:#c40000;">Failed to load addresses.</p>';
  }
}

async function saveNewAddress() {
  const name = document.getElementById("addr-name").value.trim();
  const street = document.getElementById("addr-street").value.trim();
  const city = document.getElementById("addr-city").value.trim();
  const state = document.getElementById("addr-state").value.trim();
  const zip = document.getElementById("addr-zip").value.trim();
  const country = document.getElementById("addr-country").value.trim();

  if (!name || !street || !city) {
    showMessage("Please fill in name, street, and city.");
    return;
  }

  try {
    const res = await fetchWithAuth("/addresses", {
      method: "POST",
      body: JSON.stringify({
        name, street, city, state, zip, country,
        isDefault: addresses.length === 0
      })
    });

    if (!res.ok) throw new Error("Failed to save address");

    hideMessage();
    document.getElementById("add-address-form").classList.remove("show");
    
    // Clear form
    document.getElementById("addr-name").value = "";
    document.getElementById("addr-street").value = "";
    document.getElementById("addr-city").value = "";
    document.getElementById("addr-state").value = "";
    document.getElementById("addr-zip").value = "";
    
    await loadAddresses();
  } catch (err) {
    showMessage("Failed to save address. Please try again.");
  }
}

function renderCartItems() {
  const container = document.getElementById("checkout-items");
  const itemCountEl = document.getElementById("item-count");
  const summaryCountEl = document.getElementById("summary-count");
  const subtotalEl = document.getElementById("summary-subtotal");
  const shippingEl = document.getElementById("summary-shipping");
  const totalEl = document.getElementById("summary-total");

  cartItems = getCart();
  
  let totalQty = 0;
  let subtotal = 0;

  container.innerHTML = cartItems.map(item => {
    totalQty += item.qty;
    subtotal += item.price * item.qty;
    return `
      <div class="order-item">
        <img src="${item.image_url}" alt="${item.name}">
        <div class="order-item-info">
          <div style="font-weight:500;">${item.name}</div>
          <div style="font-size:0.9rem;color:#555;">Qty: ${item.qty}</div>
          <div style="font-weight:600;">${formatPrice(item.price * item.qty)}</div>
        </div>
      </div>
    `;
  }).join("");

  const shipping = subtotal >= 50000 ? 0 : 2500; // Free shipping over 50,000 Frs
  const total = subtotal + shipping;

  itemCountEl.textContent = totalQty;
  summaryCountEl.textContent = totalQty;
  subtotalEl.textContent = formatPrice(subtotal);
  shippingEl.textContent = shipping === 0 ? "FREE" : formatPrice(shipping);
  totalEl.textContent = formatPrice(total);
}

async function placeOrder() {
  const btn = document.getElementById("place-order-btn");
  btn.disabled = true;
  btn.textContent = "Processing...";
  hideMessage();

  if (!selectedAddressId) {
    showMessage("Please select a shipping address.");
    btn.disabled = false;
    btn.textContent = "Place Your Order";
    return;
  }

  if (cartItems.length === 0) {
    showMessage("Your cart is empty.");
    btn.disabled = false;
    btn.textContent = "Place Your Order";
    return;
  }

  // Build shipping address string
  const addr = addresses.find(a => a.id === selectedAddressId);
  const shippingAddress = addr 
    ? `${addr.name}, ${addr.street}, ${addr.city}${addr.state ? ', ' + addr.state : ''}${addr.zip ? ' ' + addr.zip : ''}, ${addr.country || 'Cameroon'}`
    : "";

  try {
    const res = await fetchWithAuth("/orders", {
      method: "POST",
      body: JSON.stringify({
        items: cartItems.map(item => ({
          productId: item.id,
          quantity: item.qty
        })),
        shippingAddress
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to place order");
    }

    const data = await res.json();
    
    // Clear cart
    clearCart();
    
    // Redirect to success page
    window.location.href = `order-success.html?orderId=${data.orderId}`;

  } catch (err) {
    showMessage(err.message || "Failed to place order. Please try again.");
    btn.disabled = false;
    btn.textContent = "Place Your Order";
  }
}

// Initialize checkout page
document.addEventListener("DOMContentLoaded", function() {
  const token = getAuthToken();
  const cart = getCart();

  const loginEl = document.getElementById("checkout-login");
  const emptyEl = document.getElementById("checkout-empty");
  const contentEl = document.getElementById("checkout-content");

  // Check if logged in
  if (!token) {
    loginEl.style.display = "block";
    return;
  }

  // Check if cart has items
  if (!cart || cart.length === 0) {
    emptyEl.style.display = "block";
    return;
  }

  // Show checkout content
  contentEl.style.display = "grid";
  
  loadAddresses();
  renderCartItems();

  // Address form toggle
  document.getElementById("add-address-toggle").addEventListener("click", () => {
    document.getElementById("add-address-form").classList.toggle("show");
  });

  document.getElementById("cancel-address-btn").addEventListener("click", () => {
    document.getElementById("add-address-form").classList.remove("show");
  });

  document.getElementById("save-address-btn").addEventListener("click", saveNewAddress);

  // Place order button
  document.getElementById("place-order-btn").addEventListener("click", placeOrder);
});
