
/* Script para el menú hamburguesa responsive*/

  document.addEventListener('DOMContentLoaded', function() {
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
    });

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


