// Product Gallery and Quantity Functionality
document.addEventListener('DOMContentLoaded', function () {
    // Get all product cards
    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach(card => {
        const mainImage = card.querySelector('.product-main-img');
        const thumbnails = card.querySelectorAll('.product-thumb');
        const addToCartBtn = card.querySelector('.add-to-cart-btn');
        const quantityInput = card.querySelector('.product-quantity-input');
        const quantityBtns = card.querySelectorAll('.product-quantity-btn');

        // Gallery functionality for each card
        if (mainImage && thumbnails.length > 0) {
            thumbnails.forEach(thumb => {
                thumb.addEventListener('click', function () {
                    // Update main image source
                    mainImage.src = this.src;
                    mainImage.alt = this.alt;

                    // Remove active class from all thumbnails in this card
                    thumbnails.forEach(t => t.classList.remove('active'));

                    // Add active class to clicked thumbnail
                    this.classList.add('active');
                });
            });
        }

        // Quantity selector functionality
        if (quantityInput && quantityBtns) {
            quantityBtns.forEach(btn => {
                btn.addEventListener('click', function () {
                    const action = this.dataset.action;
                    let currentValue = parseInt(quantityInput.value);
                    const min = parseInt(quantityInput.min);
                    const max = parseInt(quantityInput.max);
                    console.log(action, currentValue, min, max);

                    if (action === 'increase' && currentValue < max) {
                        currentValue++;
                        quantityInput.value = currentValue;
                        console.log(currentValue);
                    } else if (action === 'decrease' && currentValue > min) {
                        currentValue--;
                        quantityInput.value = currentValue;
                        console.log(currentValue);
                    }
                    

                    // Update button states
                    updateQuantityButtons(card);

                    // Add visual feedback
                    this.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                        this.style.transform = '';
                    }, 100);
                });
            });

            // Initial button state update
            updateQuantityButtons(card);
        }

        // Add to cart functionality for each card
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', function () {
                // Add animation effect
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);

                // Show success message
                const originalText = this.querySelector('span').textContent;
                this.querySelector('span').textContent = 'Added!';

                setTimeout(() => {
                    this.querySelector('span').textContent = originalText;
                }, 1500);
            });
        }
    });
});

// Global function to update quantity button states
function updateQuantityButtons(card) {
    const quantityInput = card.querySelector('.product-quantity-input');
    const decreaseBtn = card.querySelector('product-quantity-btn [data-action=decrease]');
    const increaseBtn = card.querySelector('product-quantity-btn [data-action=increase]');

    if (!quantityInput || !decreaseBtn || !increaseBtn) return;

    const currentValue = parseInt(quantityInput.value);
    const min = parseInt(quantityInput.min) || 1;
    const max = parseInt(quantityInput.max) || 10;

    // Update decrease button
    if (currentValue <= min) {
        decreaseBtn.disabled = true;
        decreaseBtn.style.opacity = '0.5'; 
    } else {
        decreaseBtn.disabled = false;
        decreaseBtn.style.opacity = '1';
    }

    // Update increase button
    if (currentValue >= max) {
        increaseBtn.disabled = true;
        increaseBtn.style.opacity = '0.5';
    } else {
        increaseBtn.disabled = false;
        increaseBtn.style.opacity = '1';
    }
}
