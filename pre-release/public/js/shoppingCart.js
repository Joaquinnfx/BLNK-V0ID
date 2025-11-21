class ShoppingCart {
  constructor() {
    this.products = []; // catálogo desde el backend
    this.carrito = [];  // carrito del backend
    this.init();
  }

  async init() {
    await this.getProducts();
    await this.getCart();
    this.bindEvents();
    this.updateCartDisplay();
  }

  // INTEGRACION CON BACKEND

  async getProducts() {
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Error al cargar productos");
      this.products = await response.json();
    } catch (error) {
      console.error("Error cargando productos:", error);
      this.products = [];
    }
  }

  async getCart() {
    try {
      const response = await fetch("/api/cart");
      if (!response.ok) throw new Error("Error al obtener el carrito");
      this.carrito = await response.json();
    } catch (error) {
      console.error("Error cargando carrito:", error);
      this.carrito = [];
    }
  }

  async addToCartAPI(productId, quantity = 1) {
    try {
      const res = await fetch(`/api/cart/add/${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity })
      });
      if (!res.ok) throw new Error("Error al agregar producto al carrito");
      await this.getCart();
      this.updateCartDisplay();
    } catch (err) {
      console.error(err);
    }
  }

  async removeFromCartAPI(productId) {
    try {
      const res = await fetch(`/api/cart/remove/${productId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar producto del carrito");
      await this.getCart();
      this.updateCartDisplay();
    } catch (err) {
      console.error(err);
    }
  }

  bindEvents() {
    // Abrir y cerrar carrito
    const cartTrigger = document.getElementById("cart-trigger");
    const cartClose = document.getElementById("cartClose");
    const cartOverlay = document.getElementById("cartOverlay");

    if (cartTrigger) {
      cartTrigger.addEventListener("click", (e) => {
        e.preventDefault();
        this.openCart();
      });
    }
    if (cartClose) cartClose.addEventListener("click", () => this.closeCart());
    if (cartOverlay) cartOverlay.addEventListener("click", () => this.closeCart());

    // Checkout
    const checkoutBtn = document.querySelector(".checkout-btn");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => this.checkout());
    }
  }

  async addToCartFromButton(button) {
    const productCard = button.closest(".product-card");
    if (!productCard) return;

    const productId = productCard.dataset.id;
    const quantityInput = productCard.querySelector(".product-quantity-input");
    const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;

    await this.addToCartAPI(productId, quantity);
    this.showAddedAnimation(button);
  }

  openCart() {
    const overlay = document.getElementById("cartOverlay");
    const offcanvas = document.getElementById("cartOffcanvas");
    if (overlay && offcanvas) {
      overlay.classList.add("active");
      offcanvas.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  }

  closeCart() {
    const overlay = document.getElementById("cartOverlay");
    const offcanvas = document.getElementById("cartOffcanvas");
    if (overlay && offcanvas) {
      overlay.classList.remove("active");
      offcanvas.classList.remove("active");
      document.body.style.overflow = "";
    }
  }

  updateCartDisplay() {
    const cartItems = document.getElementById("cartItems");
    const cartEmpty = document.getElementById("cartEmpty");
    const cartFooter = document.getElementById("cartFooter");

    if (!cartItems || !cartEmpty || !cartFooter) return;

    if (this.carrito.length === 0) {
      cartItems.style.display = "none";
      cartEmpty.style.display = "flex";
      cartFooter.style.display = "none";
    } else {
      cartItems.style.display = "block";
      cartEmpty.style.display = "none";
      cartFooter.style.display = "block";

      this.renderCartItems();
      this.updateCartSummary();
    }
  }

  renderCartItems() {
    const cartItems = document.getElementById("cartItems");
    if (!cartItems) return;

    cartItems.innerHTML = this.carrito
      .map(
        (item) => `
        <div class="cart-item" data-id="${item.product_id}">
          <img src="${item.image1 || '/assets/imgs/default.jpg'}" alt="${item.name}" class="cart-item-image">
          <div class="cart-item-details">
            <h4 class="cart-item-name">${item.name}</h4>
            <div class="cart-item-price">$${parseFloat(item.price).toFixed(2)}</div>
            <div class="cart-item-controls">
              <div class="quantity-controls">
                <button class="quantity-btn" data-action="decrease" data-id="${item.product_id}">
                  <i class="fa-solid fa-minus"></i>
                </button>
                <span class="quantity-display">${item.quantity}</span>
                <button class="quantity-btn" data-action="increase" data-id="${item.product_id}">
                  <i class="fa-solid fa-plus"></i>
                </button>
              </div>
              <button class="remove-item" data-id="${item.product_id}">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `
      )
      .join("");

    this.bindCartItemEvents();
  }

  bindCartItemEvents() {
    // Botones de cantidad
    document.querySelectorAll(".quantity-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const action = btn.dataset.action;
        const productId = btn.dataset.id;
        const item = this.carrito.find((i) => i.product_id === productId);

        if (!item) return;

        let newQuantity = item.quantity;
        if (action === "increase") newQuantity++;
        else if (action === "decrease") newQuantity--;

        if (newQuantity <= 0) await this.removeFromCartAPI(productId);
        else await this.addToCartAPI(productId, newQuantity - item.quantity);
      });
    });

    // Botones eliminar
    document.querySelectorAll(".remove-item").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const productId = btn.dataset.id;
        await this.removeFromCartAPI(productId);
      });
    });
  }

  updateCartSummary() {
    const subtotal = this.getSubtotal();
    const subtotalElement = document.querySelector(".cart-subtotal");
    const totalElement = document.querySelector(".cart-total");

    if (subtotalElement) subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    if (totalElement) totalElement.textContent = `$${subtotal.toFixed(2)}`;
  }

  getSubtotal() {
    return this.carrito.reduce(
      (sum, item) => sum + parseFloat(item.price) * item.quantity,
      0
    );
  }

  showAddedAnimation(button) {
    const span = button.querySelector("span");
    const originalText = span.textContent;
    span.textContent = "Added!";
    button.style.transform = "scale(0.95)";
    setTimeout(() => {
      button.style.transform = "";
      span.textContent = originalText;
    }, 1000);
  }

  checkout() {
    if (this.carrito.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    this.closeCart();

    // Redirigir al checkout
    const baseUrl = window.location.origin;
    window.location.href = `${baseUrl}/checkout`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.shoppingCart = new ShoppingCart();
});
