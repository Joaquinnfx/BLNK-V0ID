class Products {

    constructor() {
        this.products = [];
        this.carrito = JSON.parse(localStorage.getItem('blnk-cart')) || [];
        this.init();
    }

    async init() {
        await this.cargarProductos();
        // console.log(this.products);
        this.mostrarProductos();
    }

    async cargarProductos() {
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

    renderizarProductos(productos, targetGrid) {
        const container = document.getElementById(targetGrid);
        if (!container) {
            console.error(`Contenedor ${targetGrid} no encontrado`);
            return;
        }

        if (productos.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <h3 class="text-muted">No se encontraron productos</h3>
                </div>
            `;
            return;
        }

        container.innerHTML = productos.map(product => this.subirProductos(product)).join('');
    }

    subirProductos(product) {
        console.log(product);
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
                  <span class="price-amount">${product.price}</span>
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
                    <button type="button" class="product-quantity-btn" data-action="decrease">
                      <i class="fa-solid fa-minus"></i>
                    </button>
                    <input type="number" class="product-quantity-input" value="1" min="1" max="${product.stock}">
                    <button type="button" class="product-quantity-btn" data-action="increase">
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

    mostrarProductos(){
        this.renderizarProductos(this.products, 'productsGrid');
    }

}

document.addEventListener('DOMContentLoaded', () => {
    
    new Products();

});








