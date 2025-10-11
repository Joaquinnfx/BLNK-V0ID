// Cart System for BLNK-V0ID
class ShoppingCart {
    constructor() {
        this.products = []; //catálogo de productos
        this.carrito = JSON.parse(localStorage.getItem('blnk-cart')) || []; //carrito del usuario
        this.init();
    }

    async init() {
        await this.getProducts();
        this.bindEvents();
        this.updateCartDisplay();
    }

    async getProducts() {
            try {
                const jsonPath = '/pre-release/data/products.json';
                const response = await fetch(jsonPath);
                if (!response.ok) {
                    throw new Error('Error al cargar productos');
                }
                this.products = await response.json();
                
            } catch (error) {
                console.error('Error cargando productos:', error);
                this.products = [];
            }
    }


    bindEvents() {
        // Cart trigger button
        const cartTrigger = document.getElementById('cart-trigger');
        if (cartTrigger) {
            cartTrigger.addEventListener('click', (e) => {
                e.preventDefault();
                this.openCart();
            });
        }

        // Cart close button
        const cartClose = document.getElementById('cartClose');
        if (cartClose) {
            cartClose.addEventListener('click', () => {
                this.closeCart();
            });
        }

        // Cart overlay
        const cartOverlay = document.getElementById('cartOverlay');
        if (cartOverlay) {
            cartOverlay.addEventListener('click', () => {
                this.closeCart();
            });
        }

        // Add to cart buttons
        const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
        addToCartBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.addToCartFromButton(btn);
            });
        });

        // Checkout button
        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                this.checkout();
            });
        }

    }

    addToCartFromButton(button) {
        // Find the product card containing this button
        const productCard = button.closest('.product-card');
        if (!productCard) return;

        // Get selected quantity
        const quantityInput = productCard.querySelector('.product-quantity-input');
        const selectedQuantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;

        // Extract product information
        const product = {
            id: Date.now() + Math.random(),
            // id: productCard.dataset.id,
            name: productCard.querySelector('.product-title')?.textContent || 'Unknown Product',
            price: this.extractPrice(productCard),
            image: productCard.querySelector('.product-main-img')?.src || '../assets/imgs/logo-img.jpg',
            quantity: selectedQuantity
        };

        this.addToCart(product);
        this.showAddedAnimation(button);

        // Reset quantity to 1 after adding to cart
        if (quantityInput) {
            quantityInput.value = 1;
            // Trigger button state update if the updateQuantityButtons function exists
            if (typeof updateQuantityButtons === 'function') {
                updateQuantityButtons(productCard);
            }
        }
    }

    extractPrice(productCard) {
        const priceAmount = productCard.querySelector('.price-amount')?.textContent || '0';
        const priceCents = productCard.querySelector('.price-cents')?.textContent || '.00';
        return parseFloat(priceAmount + priceCents.replace('.', '.'));
    }

    addToCart(product) {
        //Verifica si el producto ya existe en el carrito
        const existingItem = this.carrito.find(item => item.name === product.name);

        if (existingItem) { //Si existe, se agrega la cantidad
            existingItem.quantity += product.quantity;
        } else {
            // this.products.stock -= product.quantity;
            this.carrito.push(product); //Si no existe, se agrega el producto al carrito
            
        }
        console.log(this.products);
        this.saveCart();
        this.updateCartDisplay();
    }

    removeFromCart(productId) {
        this.carrito = this.carrito.filter(item => item.id !== productId);
        // this.products.stock += product.quantity;
        this.saveCart();
        this.updateCartDisplay();
    }

    updateQuantity(productId, newQuantity) {
        const item = this.carrito.find(item => item.id === productId);
        if (item) {
            if (newQuantity <= 0) {
                this.removeFromCart(productId);
            } else {
                item.quantity = newQuantity;
                this.saveCart();
                this.updateCartDisplay();
            }
        }
    }

    openCart() {
        const cartOverlay = document.getElementById('cartOverlay');
        const cartOffcanvas = document.getElementById('cartOffcanvas');

        if (cartOverlay && cartOffcanvas) {
            cartOverlay.classList.add('active');
            cartOffcanvas.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeCart() {
        const cartOverlay = document.getElementById('cartOverlay');
        const cartOffcanvas = document.getElementById('cartOffcanvas');

        if (cartOverlay && cartOffcanvas) {
            cartOverlay.classList.remove('active');
            cartOffcanvas.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    updateCartDisplay() {
        const cartItems = document.getElementById('cartItems');
        const cartEmpty = document.getElementById('cartEmpty');
        const cartFooter = document.getElementById('cartFooter');

        if (!cartItems || !cartEmpty || !cartFooter) return;

        if (this.carrito.length === 0) {
            cartItems.style.display = 'none';
            cartEmpty.style.display = 'flex';
            cartFooter.style.display = 'none';
        } else {
            cartItems.style.display = 'block';
            cartEmpty.style.display = 'none';
            cartFooter.style.display = 'block';

            this.renderCartItems();
            this.updateCartSummary();
        }
    }

    renderCartItems() {
        const cartItems = document.getElementById('cartItems');
        if (!cartItems) return;

        cartItems.innerHTML = this.carrito.map(item => 
            `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <h4 class="cart-item-name">${item.name}</h4>
                    <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                    <div class="cart-item-controls">
                        <div class="quantity-controls">
                            <button class="quantity-btn" data-action="decrease" data-id="${item.id}">
                                <i class="fa-solid fa-minus"></i>
                            </button>
                            <span class="quantity-display">${item.quantity}</span>
                            <button class="quantity-btn" data-action="increase" data-id="${item.id}">
                                <i class="fa-solid fa-plus"></i>
                            </button>
                        </div>
                        <button class="remove-item" data-id="${item.id}">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        // Bind events for cart item controls
        this.bindCartItemEvents();
    }

    bindCartItemEvents() {
        // Quantity buttons
        const quantityBtns = document.querySelectorAll('.quantity-btn');
        quantityBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                const itemId = parseFloat(btn.dataset.id);
                const item = this.carrito.find(i => i.id === itemId);

                if (item) {
                    if (action === 'increase') {
                        this.updateQuantity(itemId, item.quantity + 1);
                    } else if (action === 'decrease') {
                        this.updateQuantity(itemId, item.quantity - 1);
                    }
                }
            });
        });

        // Remove buttons
        const removeButtons = document.querySelectorAll('.remove-item');
        removeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = parseFloat(btn.dataset.id);
                this.removeFromCart(itemId);
            });
        });
    }

    updateCartSummary() {
        const subtotal = this.getSubtotal();
        const total = this.getTotal();

        const subtotalElement = document.querySelector('.cart-subtotal');
        const totalElement = document.querySelector('.cart-total');

        if (subtotalElement) {
            subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        }
        if (totalElement) {
            totalElement.textContent = `$${total.toFixed(2)}`;
        }
    }

    getSubtotal() {
        return this.carrito.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    getTotal() {
        // For now, total equals subtotal. You can add tax, shipping, etc. here
        return this.getSubtotal();
    }

    getItemCount() {
        return this.carrito.reduce((count, item) => count + item.quantity, 0);
    }

    saveCart() {
        localStorage.setItem('blnk-cart', JSON.stringify(this.carrito));
    }

    showAddedAnimation(button) {
        const originalText = button.querySelector('span').textContent;
        const span = button.querySelector('span');

        // Change text and add animation
        span.textContent = 'Added!';
        button.style.transform = 'scale(0.95)';

        setTimeout(() => {
            button.style.transform = '';
        }, 150);

        setTimeout(() => {
            span.textContent = originalText;
        }, 2000);
    }

    checkout() {
        if (this.carrito.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        // Close the off canvas
        this.closeCart();

        // Redirect to cart page
        // window.location.href = '/pre-release/pages/cart.html'; (opcion en caso de que falle la ruta)
        
        // Detecta el origen del sitio (ej: https://blnkvoid.com)
    const baseUrl = window.location.origin;

    // Ruta relativa al carrito (siempre la misma)
    const cartPath = '/pre-release/pages/cart.html';

    // Redirige sin importar en qué HTML estés
    window.location.href = baseUrl + cartPath;
    }

    // Method to clear cart (useful for testing)
    clearCart() {
        this.carrito = [];
        this.saveCart();
        this.updateCartDisplay();
    }
}

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    
    window.shoppingCart = new ShoppingCart();
});
