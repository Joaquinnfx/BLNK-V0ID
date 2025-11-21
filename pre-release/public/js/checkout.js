// checkout.js
class CheckoutPage {
  constructor() {
    this.cartItems = [];
    this.init();
  }

  async init() {
    await this.loadCartFromBackend();
    this.displayCartItems();
  }

  /** Carga el carrito desde el backend */
  async loadCartFromBackend() {
    try {
      const res = await fetch("/api/cart");
      if (!res.ok) throw new Error("Error al cargar el carrito");

      const payload = await res.json();
      const items = Array.isArray(payload.items) ? payload.items : [];

      // Normalizar estructura de productos
      this.cartItems = items.map(item => ({
        id: item.product_id || item.id,
        name: item.name || "Product without name",
        size: item.size,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        image: item.image || item.image1 || "/assets/imgs/default.jpg"
      }));

    } catch (err) {
      console.error("Error cargando carrito:", err);
      this.cartItems = [];
    }
  }

  /** Renderiza los productos del carrito en pantalla */
  displayCartItems() {
    const cartItemsList = document.getElementById('cartPageItems');
    const cartEmpty = document.getElementById('cartPageEmpty');
    const checkoutSection = document.getElementById('checkoutSection');
    const btnContinueShop = document.getElementById('btn-volver-unico')

    if (!cartItemsList || !cartEmpty || !checkoutSection) return;

    if (this.cartItems.length === 0) {
      cartItemsList.innerHTML = '';
      cartItemsList.style.display = 'none';
      cartEmpty.style.display = 'block';
      checkoutSection.style.display = 'none';
      btnContinueShop.style.display='none';
      return;
    }

    cartEmpty.style.display = 'none';
    checkoutSection.style.display = 'block';
    cartItemsList.style.display = 'block';
    btnContinueShop.style.display='block';

    // Renderizar productos
    cartItemsList.innerHTML = this.cartItems.map(item => `
      <div class="cart-page-item" data-id="${item.id}">
        <img src="${item.image}" alt="${item.name}" class="cart-page-item-image">
        <div class="cart-page-item-details">
          <h3 class="cart-page-item-name">${item.name}</h3>
          <div class="cart-page-item-price">
          <h4>Size: ${item.size}</h4>
            $${(item.price * item.quantity).toFixed(2)}
            <small>(${item.quantity} × $${item.price.toFixed(2)})</small>
          </div>
          <div class="cart-page-item-controls">
            <div class="page-quantity-controls">
              <button class="page-quantity-btn" data-action="decrease" data-id="${item.id}">
                <i class="fa-solid fa-minus"></i>
              </button>
              <span class="page-quantity-display">${item.quantity}</span>
              <button class="page-quantity-btn" data-action="increase" data-id="${item.id}">
                <i class="fa-solid fa-plus"></i>
              </button>
            </div>
            <button class="page-remove-item" data-id="${item.id}">
              <i class="fa-solid fa-trash"></i> Remove
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // 🔧 Reasignar los eventos después de renderizar
    this.bindCartItemEvents();
    this.updateOrderSummary();
  }

  /** Asigna los listeners de botones después del render */
  bindCartItemEvents() {
    const cartItemsList = document.getElementById('cartPageItems');
    if (!cartItemsList) return;

    cartItemsList.querySelectorAll('.page-quantity-btn').forEach(btn => {
      btn.addEventListener('click', async e => {
        const action = e.currentTarget.dataset.action;
        const itemId = parseInt(e.currentTarget.dataset.id);
        const item = this.cartItems.find(i => i.id === itemId);
        if (!item) return;

        const newQty = action === 'increase' ? item.quantity + 1 : item.quantity - 1;
        await this.updateQuantity(itemId, newQty);
      });
    });

    cartItemsList.querySelectorAll('.page-remove-item').forEach(btn => {
      btn.addEventListener('click', async e => {
        const itemId = parseInt(e.currentTarget.dataset.id);
        await this.removeFromCart(itemId);
      });
    });
  }

  /** Actualiza la cantidad de un producto */
  async updateQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
      return this.removeFromCart(productId);
    }

    try {
      await fetch(`/api/cart/update/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQuantity })
      });

      await this.loadCartFromBackend();
      this.displayCartItems();
    } catch (err) {
      console.error("Error actualizando cantidad:", err);
    }
  }

  /** Elimina un producto del carrito */
  async removeFromCart(productId) {
    try {
      await fetch(`/api/cart/delete/${productId}`, { method: "DELETE" });
      await this.loadCartFromBackend();
      this.displayCartItems();
    } catch (err) {
      console.error("Error eliminando producto:", err);
    }
  }

  /** Actualiza el resumen del pedido (solo subtotal) */
  updateOrderSummary() {
    const subtotal = this.getSubtotal();
    const subtotalElement = document.querySelector('.page-cart-subtotal');
    const totalElement = document.querySelector('.page-cart-total');

    if (subtotalElement) subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    if (totalElement) totalElement.textContent = `$${subtotal.toFixed(2)}`;
  }

  /** Calcula el subtotal */
  getSubtotal() {
    return this.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.checkoutPage) {
    window.checkoutPage = null; // elimina instancia anterior
  }
  if (document.getElementById('cart-page-section')) {
    window.checkoutPage = new CheckoutPage();
  }
});

/** Stripe Checkout Integration **/
document.addEventListener("DOMContentLoaded", async () => {
  const checkoutBtn = document.getElementById("proceedCheckoutBtn");

  if (!checkoutBtn) return;

  checkoutBtn.addEventListener("click", async () => {
    try {
      checkoutBtn.disabled = true;
      checkoutBtn.textContent = "Redirecting...";

      const res = await fetch("/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("No se pudo crear la sesión de Stripe");

      const { url } = await res.json();
      if (url) {
        window.location.href = url; // Redirige al checkout de Stripe
      } else {
        throw new Error("URL de sesión no recibida");
      }
    } catch (err) {
      console.error("Error iniciando pago con Stripe:", err);
      alert("Error iniciando el pago, intenta nuevamente.");
    } finally {
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = "Proceed to Checkout";
    }
  });
});
