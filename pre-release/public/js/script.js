// Funcionalidad de la galeria y el selector de cantidad
document.addEventListener('DOMContentLoaded', function () {
    AOS.init();
    // Obtener todas las cards de productos
    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach(card => {
        const mainImage = card.querySelector('.product-main-img');
        const thumbnails = card.querySelectorAll('.product-thumb');
        const addToCartBtn = card.querySelector('.add-to-cart-btn');
        const quantityInput = card.querySelector('.product-quantity-input');
        const quantityBtns = card.querySelectorAll('.product-quantity-btn');
        const sizeSelect = card.querySelector('.size-select');

        // Funcionalidad de la galeria para cada card
        if (mainImage && thumbnails.length > 0) {
            thumbnails.forEach(thumb => {
                thumb.addEventListener('click', function () {
                    // Actualizar la imagen principal
                    mainImage.src = this.src;
                    mainImage.alt = this.alt;

                    // Remover la clase active de todos los thumbnails en esta card
                    thumbnails.forEach(t => t.classList.remove('active'));

                    // Agregar la clase active al thumbnail clickeado
                    this.classList.add('active');
                });
            });
        }
      // Funcionalidad de los botones de cantidad
        if (quantityInput && quantityBtns.length) {
            quantityBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    let currentValue = parseInt(quantityInput.value);
                    const min = parseInt(quantityInput.min) || 1;
                    const max = parseInt(quantityInput.max) || 99;
                    if (action === 'increase' && currentValue < max) {
                        quantityInput.value = currentValue + 1;
                    } else if (action === 'decrease' && currentValue > min) {
                        quantityInput.value = currentValue - 1;
                    }
                    updateQuantityButtons(card);
                    // feedback visual
                    btn.style.transform = 'scale(0.9)';
                    setTimeout(() => (btn.style.transform = ''), 100);
                });
            });
          updateQuantityButtons(card);
        }

        //Agregar al carrito con cantidad
        if (addToCartBtn && quantityInput) {
            addToCartBtn.addEventListener('click', async () => {
                const productId = addToCartBtn.dataset.productId;
                const quantity = parseInt(quantityInput.value) || 1;
              //Logica del size
                const size = sizeSelect.value;
              //Validacion de size
              if(!size){
                showCartNotification('Please select a size before adding to cart', 'error');
                return;
              };
                try {
                    console.log("SIZE SELECCIONADO:", size);
                    const response = await fetch(`/cart/add/${productId}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ quantity, size })
                    });
                    const data = await response.json();
                    if (response.ok) {
                        showCartNotification('Product added to cart', 'success');
                    } else {
                        console.error('Error al agregar producto:', data);
                        showCartNotification('Error adding product to cart', 'error');
                    }
                } catch (error) {
                    console.error('Error en la petición:', error);
                    showCartNotification('Connection error', 'error');
                }
            });
        }                      
    });

    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navbar = document.getElementById('navbar');
        
    mobileMenuToggle.addEventListener('click', function() {
    navbar.classList.toggle('active');
    mobileMenuToggle.classList.toggle('active');
    });
        
// Cerrar menú al hacer clic en un enlace
    const navLinks = navbar.querySelectorAll('a');
    navLinks.forEach(link => {
    link.addEventListener('click', () => {
    navbar.classList.remove('active');
    mobileMenuToggle.classList.remove('active');
    });
    });
        
// Cerrar menú al redimensionar la ventana
    window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
    navbar.classList.remove('active');
    mobileMenuToggle.classList.remove('active');
    }
    });

const carousels = document.querySelectorAll(".void-carrousel");
carousels.forEach(initCarousel);

});//Cierre del addEventListener principal

// Funcionalidad del carousel
function initCarousel(root) {
    const viewport = root.querySelector(".vc-viewport");
    const track = root.querySelector(".vc-track");
    const slides = Array.from(root.querySelectorAll(".vc-slide"));
    const prevBtn = root.querySelector(".vc-prev");
    const nextBtn = root.querySelector(".vc-next");
    const dotsContainer = root.querySelector(".vc-dots");
  
    if (!viewport || !track || slides.length === 0) return;
  
    let current = 0;
    let autoplayTimer = null;
    const autoplayDelayMs = 4000;
  
    // Construir los dots
    slides.forEach((_, idx) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", `Ir a slide ${idx + 1}`);
      dot.addEventListener("click", () => goTo(idx));
      dotsContainer.appendChild(dot);
    });
  
    function updateActiveState() {
      slides.forEach((slide, i) => {
        slide.classList.toggle("is-active", i === current);
      });
      const dots = Array.from(dotsContainer.children);
      dots.forEach((d, i) =>
        d.setAttribute("aria-current", i === current ? "true" : "false")
      );
    }
  
    function applyTransform() {
      const offset = -current * 100;
      track.style.transform = `translateX(${offset}%)`;
    }
  
    function goTo(index) {
      if (index < 0) index = slides.length - 1;
      if (index >= slides.length) index = 0;
      current = index;
      applyTransform();
      updateActiveState();
      restartAutoplay();
    }
  
    function next() {
      goTo(current + 1);
    }
    function prev() {
      goTo(current - 1);
    }
  
    // Eventos
    nextBtn && nextBtn.addEventListener("click", next);
    prevBtn && prevBtn.addEventListener("click", prev);
  
    // Autoplay
    function startAutoplay() {
      stopAutoplay();
      autoplayTimer = setInterval(next, autoplayDelayMs);
    }
    function stopAutoplay() {
      if (autoplayTimer) clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
    function restartAutoplay() {
      startAutoplay();
    }
  
    root.addEventListener("mouseenter", stopAutoplay);
    root.addEventListener("mouseleave", startAutoplay);
  
    // Swipe support
    let startX = 0;
    let isDragging = false;
  
    function onStart(clientX) {
      isDragging = true;
      startX = clientX;
      stopAutoplay();
    }
    function onMove(clientX) {
      if (!isDragging) return;
      const delta = clientX - startX;
      const percent = (delta / viewport.clientWidth) * 100;
      track.style.transition = "none";
      track.style.transform = `translateX(${-current * 100 + percent}%)`;
    }
    function onEnd(clientX) {
      if (!isDragging) return;
      isDragging = false;
      track.style.transition = "";
      const delta = clientX - startX;
      const threshold = viewport.clientWidth * 0.15;
      if (Math.abs(delta) > threshold) {
        if (delta < 0) next();
        else prev();
      } else {
        applyTransform();
      }
      startAutoplay();
    }
  
    // Eventos de touch
    viewport.addEventListener(
      "touchstart",
      (e) => onStart(e.touches[0].clientX),
      { passive: true }
    );
    viewport.addEventListener("touchmove", (e) => onMove(e.touches[0].clientX), {
      passive: true,
    });
    viewport.addEventListener("touchend", (e) =>
      onEnd(e.changedTouches[0].clientX)
    );
  
    // Eventos de mouse
    viewport.addEventListener("mousedown", (e) => onStart(e.clientX));
    viewport.addEventListener("mousemove", (e) => onMove(e.clientX));
    window.addEventListener("mouseup", (e) => onEnd(e.clientX));
  
    // Inicializar
    updateActiveState();
    applyTransform();
    startAutoplay();
  }

//Boton WhatsApp
const btnWpp = document.createElement('a'); 
  btnWpp.innerHTML = `<a href="https://wa.me/+17282026267?text=Hi! I would like more information about BLNK-V0ID. 🚀" 
  target="_blank"
  rel="noopener noreferrer"
  title="Contact via WhatsApp">
  <i class="fa-brands fa-whatsapp" style="color: #ffffff;"></i>
  </a>`;
btnWpp.classList.add('whatsapp-float');
document.body.appendChild(btnWpp);

//Ocultar header al hacer scroll up y mostrar al hacer scroll down

let lastScroll = 0; 
const header = document.getElementById("header");

    window.addEventListener("scroll", () => {
      const currentScroll = window.scrollY;

      if (currentScroll > lastScroll) {
        header.classList.add("head-oculto");
        
      } else {
        header.classList.remove("head-oculto");
      }

      lastScroll = currentScroll;
    });

// Función global para actualizar los botones de cantidad
function updateQuantityButtons(card) {
        const quantityInput = card.querySelector('.product-quantity-input');
        const decreaseBtn = card.querySelector('.product-quantity-btn[data-action="decrease"]');
        const increaseBtn = card.querySelector('.product-quantity-btn[data-action="increase"]');

        if (!quantityInput || !decreaseBtn || !increaseBtn) return;

        const value = parseInt(quantityInput.value);
        const min = parseInt(quantityInput.min) || 1;
        const max = parseInt(quantityInput.max) || 99;

        decreaseBtn.disabled = value <= min;
        increaseBtn.disabled = value >= max;

        decreaseBtn.style.opacity = decreaseBtn.disabled ? '0.5' : '1';
        increaseBtn.style.opacity = increaseBtn.disabled ? '0.5' : '1';
    }

// Notificación visual
  function showCartNotification(message) {
    const existing = document.querySelector(".cart-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = "cart-toast";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("visible");
      setTimeout(() => {
        toast.classList.remove("visible");
        setTimeout(() => toast.remove(), 500);
      }, 2000);
    }, 100);
  }

//Modal Size Guide
const sizeGuideModal = document.getElementById("size-guide-modal");
const openButtons = document.querySelectorAll(".size-guide-link");
const closeBtn = sizeGuideModal.querySelector(".close-btn");

openButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      sizeGuideModal.classList.add("active");
      document.body.style.overflow = 'hidden'; // Evita el scroll del fondo
    });
});

closeBtn.addEventListener("click",() => {
    sizeGuideModal.classList.remove("active");
    document.body.style.overflow = ''; // Restaura el scroll
});



// const glitchButton = document.getElementById("glitchButton");
// const glitchText = document.querySelector(".glitch-text");

// const messages = [
//   "Signal me next drop ",
//   "Wake me when it drops ",
//   "Awaiting transmission...",
//   "Glitched out — try again",
//   "Enter the void "
// ];

// glitchButton.addEventListener("mouseenter", () => {
//   const randomMsg = messages[Math.floor(Math.random() * messages.length)];
//   glitchText.textContent = randomMsg;
// });

// glitchButton.addEventListener("mouseleave", () => {
//   glitchText.textContent = "Back to Home";
// });

// glitchButton.addEventListener("click", () => {
//   window.location.href = "/";
// });

