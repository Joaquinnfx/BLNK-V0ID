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

