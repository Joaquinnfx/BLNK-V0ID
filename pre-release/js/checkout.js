// Checkout Page Functionality for BLNK-V0ID
class CheckoutPage {
    constructor() {
        this.cartItems = JSON.parse(localStorage.getItem('blnk-cart')) || [];
        this.shippingCost = 9.99;
        this.taxRate = 0.08; // 8% tax
        this.currentStep = 'summary'; // summary, form, confirmation
        this.init();
    }

    init() {
        this.bindEvents();
        this.displayCartItems();
        this.updateOrderSummary();
        this.setupFormValidation();
    }

    bindEvents() {
        // Proceed to checkout button
        const proceedBtn = document.getElementById('proceedCheckoutBtn');
        if (proceedBtn) {
            proceedBtn.addEventListener('click', () => {
                this.showCheckoutForm();
            });
        }

        // Back to summary button
        const backBtn = document.getElementById('backToSummaryBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.showOrderSummary();
            });
        }

        // Checkout form submission
        const checkoutForm = document.getElementById('checkoutForm');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processOrder();
            });
        }

        // New order button
        const newOrderBtn = document.getElementById('newOrderBtn');
        if (newOrderBtn) {
            newOrderBtn.addEventListener('click', () => {
                this.startNewOrder();
            });
        }

        // Input formatting
        this.setupInputFormatting();
    }

    displayCartItems() {
        const cartItemsList = document.getElementById('cartPageItems');
        const cartEmpty = document.getElementById('cartPageEmpty');
        const checkoutSection = document.getElementById('checkoutSection');

        if (!cartItemsList || !cartEmpty || !checkoutSection) return;

        if (this.cartItems.length === 0) {
            cartItemsList.style.display = 'none';
            cartEmpty.style.display = 'block';
            checkoutSection.style.display = 'none';
            return;
        }

        cartEmpty.style.display = 'none';
        checkoutSection.style.display = 'block';
        cartItemsList.style.display = 'block';

        cartItemsList.innerHTML = this.cartItems.map(item => `
            <div class="cart-page-item" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="cart-page-item-image">
                <div class="cart-page-item-details">
                    <h3 class="cart-page-item-name">${item.name}</h3>
                    <div class="cart-page-item-price">$${(item.price * item.quantity).toFixed(2)} <small>(${item.quantity} × $${item.price.toFixed(2)})</small></div>
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
                            <i class="fa-solid fa-trash"></i>
                            Remove
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        this.bindCartItemEvents();
    }

    bindCartItemEvents() {
        // Quantity buttons
        const quantityBtns = document.querySelectorAll('.page-quantity-btn');
        quantityBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                const itemId = parseFloat(btn.dataset.id);
                const item = this.cartItems.find(i => i.id === itemId);

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
        const removeButtons = document.querySelectorAll('.page-remove-item');
        removeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = parseFloat(btn.dataset.id);
                this.removeFromCart(itemId);
            });
        });
    }

    updateQuantity(productId, newQuantity) {
        const item = this.cartItems.find(item => item.id === productId);
        if (item) {
            if (newQuantity <= 0) {
                this.removeFromCart(productId);
            } else {
                item.quantity = newQuantity;
                this.saveCart();
                this.displayCartItems();
                this.updateOrderSummary();
            }
        }
    }

    removeFromCart(productId) {
        this.cartItems = this.cartItems.filter(item => item.id !== productId);
        this.saveCart();
        this.displayCartItems();
        this.updateOrderSummary();
    }

    saveCart() {
        localStorage.setItem('blnk-cart', JSON.stringify(this.cartItems));
    }

    updateOrderSummary() {
        const subtotal = this.getSubtotal();
        const tax = this.getTax();
        const total = this.getTotal();

        const subtotalElement = document.querySelector('.page-cart-subtotal');
        const taxElement = document.querySelector('.tax-cost');
        const totalElement = document.querySelector('.page-cart-total');

        if (subtotalElement) subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        if (taxElement) taxElement.textContent = `$${tax.toFixed(2)}`;
        if (totalElement) totalElement.textContent = `$${total.toFixed(2)}`;
    }

    getSubtotal() {
        return this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    getTax() {
        return this.getSubtotal() * this.taxRate;
    }

    getShipping() {
        return this.cartItems.length > 0 ? this.shippingCost : 0;
    }

    getTotal() {
        return this.getSubtotal() + this.getTax() + this.getShipping();
    }

    showCheckoutForm() {
        if (this.cartItems.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        const orderSummary = document.querySelector('.order-summary');
        const checkoutForm = document.getElementById('checkoutFormContainer');

        if (orderSummary && checkoutForm) {
            orderSummary.style.display = 'none';
            checkoutForm.style.display = 'block';
            this.currentStep = 'form';

            // Scroll to form
            checkoutForm.scrollIntoView({ behavior: 'smooth' });
        }
    }

    showOrderSummary() {
        const orderSummary = document.querySelector('.order-summary');
        const checkoutForm = document.getElementById('checkoutFormContainer');

        if (orderSummary && checkoutForm) {
            orderSummary.style.display = 'block';
            checkoutForm.style.display = 'none';
            this.currentStep = 'summary';

            // Scroll to summary
            orderSummary.scrollIntoView({ behavior: 'smooth' });
        }
    }

    setupFormValidation() {
        const form = document.getElementById('checkoutForm');
        if (!form) return;

        const inputs = form.querySelectorAll('input[required], select[required]');

        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateInput(input);
            });

            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    this.validateInput(input);
                }
            });
        });
    }

    validateInput(input) {
        const value = input.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Reset previous error state
        input.classList.remove('error');
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Check if required field is empty
        if (input.required && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }

        // Specific validations
        if (value && input.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        }

        if (value && input.name === 'phone') {
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (!phoneRegex.test(value.replace(/\s|-|\(|\)/g, ''))) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number';
            }
        }

        if (value && input.name === 'cardNumber') {
            const cardRegex = /^\d{4}\s\d{4}\s\d{4}\s\d{4}$/;
            if (!cardRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid card number (1234 5678 9012 3456)';
            }
        }

        if (value && input.name === 'expiryDate') {
            const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
            if (!expiryRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid expiry date (MM/YY)';
            }
        }

        if (value && input.name === 'cvv') {
            const cvvRegex = /^\d{3,4}$/;
            if (!cvvRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid CVV (3-4 digits)';
            }
        }

        if (value && input.name === 'zipCode') {
            const zipRegex = /^\d{5}(-\d{4})?$/;
            if (!zipRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid ZIP code';
            }
        }

        if (!isValid) {
            input.classList.add('error');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = errorMessage;
            errorDiv.style.color = '#ff6b6b';
            errorDiv.style.fontSize = '0.9rem';
            errorDiv.style.marginTop = '5px';
            errorDiv.style.fontFamily = '"Pathway Gothic One", sans-serif';
            input.parentNode.appendChild(errorDiv);
        }

        return isValid;
    }

    setupInputFormatting() {
        // Card number formatting
        const cardNumberInput = document.getElementById('cardNumber');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
                value = value.substring(0, 16);
                value = value.replace(/(.{4})/g, '$1 ').trim();
                e.target.value = value;
            });
        }

        // Expiry date formatting
        const expiryInput = document.getElementById('expiryDate');
        if (expiryInput) {
            expiryInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.substring(0, 2) + '/' + value.substring(2, 4);
                }
                e.target.value = value;
            });
        }

        // CVV formatting
        const cvvInput = document.getElementById('cvv');
        if (cvvInput) {
            cvvInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
            });
        }

        // Phone formatting
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 6) {
                    value = value.replace(/(\d{3})(\d{3})(\d{0,4})/, '($1) $2-$3');
                } else if (value.length >= 3) {
                    value = value.replace(/(\d{3})(\d{0,3})/, '($1) $2');
                }
                e.target.value = value;
            });
        }
    }

    validateForm() {
        const form = document.getElementById('checkoutForm');
        if (!form) return false;

        const inputs = form.querySelectorAll('input[required], select[required]');
        let allValid = true;

        inputs.forEach(input => {
            if (!this.validateInput(input)) {
                allValid = false;
            }
        });

        return allValid;
    }

    async processOrder() {
        // Validate form
        if (!this.validateForm()) {
            alert('Please fix the errors in the form before proceeding.');
            return;
        }

        // Show loading state
        const submitBtn = document.querySelector('.place-order-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
        submitBtn.disabled = true;

        try {
            // Simulate payment processing
            await this.simulatePaymentProcessing();

            // Generate order
            const orderData = this.generateOrderData();

            // Show confirmation
            this.showOrderConfirmation(orderData);

            // Clear cart
            this.clearCart();

        } catch (error) {
            alert('Payment processing failed. Please try again.');
            console.error('Order processing error:', error);
        } finally {
            // Restore button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async simulatePaymentProcessing() {
        // Simulate various payment processing steps with delays
        return new Promise((resolve, reject) => {
            const steps = [
                { message: 'Validating payment information...', delay: 1000 },
                { message: 'Processing payment...', delay: 1500 },
                { message: 'Confirming transaction...', delay: 1000 },
                { message: 'Finalizing order...', delay: 800 }
            ];

            let currentStep = 0;
            const submitBtn = document.querySelector('.place-order-btn');

            function processStep() {
                if (currentStep < steps.length) {
                    const step = steps[currentStep];
                    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${step.message}`;

                    setTimeout(() => {
                        currentStep++;
                        processStep();
                    }, step.delay);
                } else {
                    // 95% success rate simulation
                    if (Math.random() > 0.05) {
                        resolve();
                    } else {
                        reject(new Error('Payment declined'));
                    }
                }
            }

            processStep();
        });
    }

    generateOrderData() {
        const form = document.getElementById('checkoutForm');
        const formData = new FormData(form);

        return {
            orderNumber: this.generateOrderNumber(),
            customer: {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                phone: formData.get('phone')
            },
            shipping: {
                address: formData.get('address'),
                city: formData.get('city'),
                state: formData.get('state'),
                zipCode: formData.get('zipCode'),
                country: formData.get('country')
            },
            payment: {
                cardNumber: '**** **** **** ' + formData.get('cardNumber').slice(-4),
                cardName: formData.get('cardName')
            },
            items: [...this.cartItems],
            summary: {
                subtotal: this.getSubtotal(),
                tax: this.getTax(),
                shipping: this.getShipping(),
                total: this.getTotal()
            },
            date: new Date().toISOString(),
            status: 'confirmed'
        };
    }

    generateOrderNumber() {
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `BLNK-${timestamp}${random}`;
    }

    showOrderConfirmation(orderData) {
        const checkoutForm = document.getElementById('checkoutFormContainer');
        const orderConfirmation = document.getElementById('orderConfirmation');

        if (checkoutForm && orderConfirmation) {
            checkoutForm.style.display = 'none';
            orderConfirmation.style.display = 'block';

            // Update order details
            const orderNumber = document.getElementById('orderNumber');
            const orderTotalPaid = document.getElementById('orderTotalPaid');

            if (orderNumber) orderNumber.textContent = orderData.orderNumber;
            if (orderTotalPaid) orderTotalPaid.textContent = `$${orderData.summary.total.toFixed(2)}`;

            // Scroll to confirmation
            orderConfirmation.scrollIntoView({ behavior: 'smooth' });

            // Save order to localStorage for potential future reference
            this.saveOrderHistory(orderData);

            this.currentStep = 'confirmation';
        }
    }

    saveOrderHistory(orderData) {
        const orders = JSON.parse(localStorage.getItem('blnk-orders')) || [];
        orders.push(orderData);
        localStorage.setItem('blnk-orders', JSON.stringify(orders));
    }

    clearCart() {
        this.cartItems = [];
        localStorage.removeItem('blnk-cart');
    }

    startNewOrder() {
        // Reset to initial state
        this.cartItems = [];
        this.currentStep = 'summary';

        // Hide confirmation and show summary
        const orderConfirmation = document.getElementById('orderConfirmation');
        const orderSummary = document.querySelector('.order-summary');

        if (orderConfirmation && orderSummary) {
            orderConfirmation.style.display = 'none';
            orderSummary.style.display = 'block';
        }

        // Reset form
        const form = document.getElementById('checkoutForm');
        if (form) {
            form.reset();

            // Remove any error states
            const errorInputs = form.querySelectorAll('.error');
            errorInputs.forEach(input => input.classList.remove('error'));

            const errorMessages = form.querySelectorAll('.error-message');
            errorMessages.forEach(msg => msg.remove());
        }

        // Refresh display
        this.displayCartItems();
        this.updateOrderSummary();

        // Scroll to top
        document.querySelector('#cart-page-section').scrollIntoView({ behavior: 'smooth' });
    }
}

// Initialize checkout page when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Only initialize if we're on the cart page
    if (document.getElementById('cart-page-section')) {
        window.checkoutPage = new CheckoutPage();
    }
});
