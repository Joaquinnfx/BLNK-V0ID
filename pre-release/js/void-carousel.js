document.addEventListener("DOMContentLoaded", function () {
  const carousels = document.querySelectorAll(".void-carousel");
  carousels.forEach(initCarousel);
});

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

  // Build dots
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

  // Events
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

  // Touch events
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

  // Mouse events
  viewport.addEventListener("mousedown", (e) => onStart(e.clientX));
  viewport.addEventListener("mousemove", (e) => onMove(e.clientX));
  window.addEventListener("mouseup", (e) => onEnd(e.clientX));

  // Init
  updateActiveState();
  applyTransform();
  startAutoplay();
}
