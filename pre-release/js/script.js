// Funcionalidad de la galeria y el selector de cantidad
document.addEventListener('DOMContentLoaded', function () {
    // Obtener todas las cards de productos
    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach(card => {
        const mainImage = card.querySelector('.product-main-img');
        const thumbnails = card.querySelectorAll('.product-thumb');
        const addToCartBtn = card.querySelector('.add-to-cart-btn');
        const quantityInput = card.querySelector('.product-quantity-input');
        const quantityBtns = card.querySelectorAll('.product-quantity-btn');

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

        // Funcionalidad del selector de cantidad
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
                    

                    // Actualizar los botones de cantidad
                    updateQuantityButtons(card);

                    // Agregar feedback visual
                    this.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                        this.style.transform = '';
                    }, 100);
                });
            });

            // Actualizar los botones de cantidad
            updateQuantityButtons(card);
        }

        // Agregar al carrito desde el boton de cada card
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', function () {
                // Add animation effect
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);

                // Mostrar mensaje de exito
                const originalText = this.querySelector('span').textContent;
                this.querySelector('span').textContent = 'Added!';

                setTimeout(() => {
                    this.querySelector('span').textContent = originalText;
                }, 1500);
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

const carousels = document.querySelectorAll(".void-carousel");
carousels.forEach(initCarousel);

});

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

      if (currentScroll < lastScroll) {
        header.classList.add("head-oculto");
        
      } else {
        header.classList.remove("head-oculto");
      }

      lastScroll = currentScroll;
    });

// Función global para actualizar los botones de cantidad
function updateQuantityButtons(card) {
    const quantityInput = card.querySelector('.product-quantity-input');
    const decreaseBtn = card.querySelector('product-quantity-btn [data-action=decrease]');
    const increaseBtn = card.querySelector('product-quantity-btn [data-action=increase]');

    if (!quantityInput || !decreaseBtn || !increaseBtn) return;

    const currentValue = parseInt(quantityInput.value);
    const min = parseInt(quantityInput.min) || 1;
    const max = parseInt(quantityInput.max) || 10;

    // Actualizar el boton de disminuir
    if (currentValue <= min) {
        decreaseBtn.disabled = true;
        decreaseBtn.style.opacity = '0.5'; 
    } else {
        decreaseBtn.disabled = false;
        decreaseBtn.style.opacity = '1';
    }

    // Actualizar el boton de aumentar
    if (currentValue >= max) {
        increaseBtn.disabled = true;
        increaseBtn.style.opacity = '0.5';
    } else {
        increaseBtn.disabled = false;
        increaseBtn.style.opacity = '1';
    }
}
