class Products {

  constructor() {
    this.products = [];
    this.init();
  }

  async init() {
    await this.getProducts();
    this.mostrarProductos();
    this.bindEvents();
  }

  async getProducts() {
    try {
      const jsonPath = '/pre-release/data/products.json';
      const response = await fetch(jsonPath);
      if (!response.ok) throw new Error('Error al cargar productos');

      this.products = await response.json();
      // console.log(this.products);

    } catch (error) {
      console.error('Error cargando productos:', error);
      this.products = [];
    }
  }

  renderizarProductos(productos, targetGrid) {
    const container = document.getElementById(targetGrid);
    if (!container) {
      console.error(`Contenedor ${targetGrid} no encontrado`);
      return;
    }
    if (productos.length === 0) {
      container.innerHTML = `
                <div class="no-products">
                    <h3 class="no-products-text">There are no products, wait for the next drop</h3>
                    <a href="/index.html" class="continue-shopping-btn">
                      <i class="fa-solid fa-arrow-left"></i>
                       Go Back
                    </a>
                </div>
            `;
      return;
    }
    container.innerHTML = productos.map(product => this.pintarProductos(product)).join('');
  }

  mostrarProductos() {
    this.renderizarProductos(this.products, 'productsGrid');
  }

  pintarProductos(product) {
    return `
            <div class="product-card">
                <div class="product-images">
                    <img src="${product.image1}" alt="${product.name}" class="product-main-img">
                    <div class="product-gallery">
                        <img src="${product.image2}" alt="${product.name}" class="product-thumb">
                        <img src="${product.image3}" alt="${product.name}" class="product-thumb">
                        <img src="${product.image4}" alt="${product.name}" class="product-thumb">
                    </div>
                </div>
                <div class="product-info">
              <h2 class="product-title">${product.name}</h2>
              <p class="product-description">${product.description}</p>
              <div class="product-details">
                <div class="product-price">
                  <span class="price-currency">$</span>
                  <span class="price-amount">${product.price.toFixed(2)}</span>
                </div>
                <div class="product-stock">
                  <span class="stock-label">Stock:</span>
                  <span class="stock-amount">${product.stock}</span>
                  <span class="stock-unit">units</span>
                </div>
              </div>
              <div class="product-actions">
                <div class="product-quantity-section">
                  <label class="quantity-label">Quantity:</label>
                  <div class="product-quantity-controls">
                    <button id="btnDecrease" type="button" class="product-quantity-btn" data-action="decrease" data-id="${product.id}">
                      <i class="fa-solid fa-minus"></i>
                    </button>
                    <input type="number" class="product-quantity-input" value="1" min="1" max="${product.stock}">
                    <button id="btnIncrease" type="button" class="product-quantity-btn" data-action="increase" data-id="${product.id}">
                      <i class="fa-solid fa-plus"></i>
                    </button>
                  </div>
                </div>
                <button class="add-to-cart-btn">
                  <i class="fa-solid fa-shopping-cart"></i>
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
            </div>
        `;
  }

  bindEvents() {
    // Quantity buttons
    document.querySelectorAll('.product-quantity-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.product-card');
        const input = card.querySelector('.product-quantity-input');
        const max = parseInt(input.max);
        const min = parseInt(input.min);
        let value = parseInt(input.value);

        if (btn.dataset.action === 'increase' && value < max) value++;
        if (btn.dataset.action === 'decrease' && value > min) value--;
        input.value = value;
      });
    });

    // Add to cart buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', () => this.handleAddToCart(btn));
    });

    // Galeria de imagenes
    document.querySelectorAll('.product-card').forEach(card => {
      const mainImg = card.querySelector('.product-main-img');
      const thumbs = card.querySelectorAll('.product-thumb');

      thumbs.forEach(thumb => {
        thumb.addEventListener('click', () => {
          // Cambia la imagen principal
          mainImg.src = thumb.src;

          // Resalta la miniatura activa
          thumbs.forEach(t => t.classList.remove('active-thumb'));
          thumb.classList.add('active-thumb');
        });
      });
    });
  }

  handleAddToCart(button) {
    const card = button.closest('.product-card');
    const productId = parseInt(card.dataset.id);
    const product = this.products.find(p => p.id === productId);
    const input = card.querySelector('.product-quantity-input');
    const quantity = parseInt(input.value) || 1;

    if (!product) return;

    // Creamos un objeto producto simplificado
    const productToAdd = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity
    };

    // Agregar al carrito usando la instancia global
    if (window.shoppingCart) {
      window.shoppingCart.addToCart(productToAdd);
    } else {
      console.warn('ShoppingCart no inicializado aún');
    }

    // Feedback visual
    this.showAddedAnimation(button);
  }

  showAddedAnimation(button) {
    const span = button.querySelector('span');
    const originalText = span.textContent;
    span.textContent = 'Added!';
    button.style.transform = 'scale(0.95)';

    setTimeout(() => {
      button.style.transform = '';
      span.textContent = originalText;
    }, 1000);
  }

}

document.addEventListener('DOMContentLoaded', () => {
  new Products();
});










