/* =========================================================
   TAQUERIA ROLY'S — interactions
   ========================================================= */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Lenis smooth scroll (single rAF driver) ---------- */
  let lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  /* ---------- GSAP / ScrollTrigger ---------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) lenis.on("scroll", ScrollTrigger.update);
  }

  /* ---------- Nav solid on scroll ---------- */
  const nav = document.getElementById("nav");
  function onScrollNav() {
    if (!nav) return;
    if (window.scrollY > 60) nav.classList.add("is-solid");
    else nav.classList.remove("is-solid");
  }
  onScrollNav();
  window.addEventListener("scroll", onScrollNav, { passive: true });

  /* ---------- Mobile overlay ---------- */
  const toggle = document.getElementById("navToggle");
  const overlay = document.getElementById("overlay");
  const overlayClose = document.getElementById("overlayClose");

  function openOverlay() {
    if (!overlay) return;
    overlay.classList.add("is-open");
    if (toggle) toggle.setAttribute("aria-expanded", "true");
    if (lenis) lenis.stop();
    document.body.style.overflow = "hidden";
  }
  function closeOverlay() {
    if (!overlay) return;
    overlay.classList.remove("is-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    if (lenis) lenis.start();
    document.body.style.overflow = "";
  }
  if (toggle) toggle.addEventListener("click", openOverlay);
  if (overlayClose) overlayClose.addEventListener("click", closeOverlay);
  if (overlay) {
    overlay.querySelectorAll(".overlay__nav a").forEach(function (a) {
      a.addEventListener("click", closeOverlay);
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeOverlay();
  });

  /* ---------- Anchor smooth scroll via Lenis ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      const id = a.getAttribute("href");
      if (!id || id === "#" || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -70 });
      else target.scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ---------- Reveal animations ---------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (window.gsap && window.ScrollTrigger && !reduceMotion) {
    revealEls.forEach(function (el) {
      gsap.fromTo(el, { opacity: 0, y: 28 }, {
        opacity: 1, y: 0, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" }
      });
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Hero parallax ---------- */
  const heroImg = document.getElementById("heroImg");
  if (heroImg && window.gsap && window.ScrollTrigger && !reduceMotion) {
    gsap.to(heroImg, {
      yPercent: 18, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });
  }

  /* ---------- Section image parallax ---------- */
  if (window.gsap && window.ScrollTrigger && !reduceMotion) {
    document.querySelectorAll("[data-parallax]").forEach(function (img) {
      gsap.fromTo(img, { yPercent: -6 }, {
        yPercent: 6, ease: "none",
        scrollTrigger: { trigger: img.closest("[data-parallax-wrap]") || img, start: "top bottom", end: "bottom top", scrub: true }
      });
    });
  }

  /* ---------- Signature title letters ---------- */
  if (window.gsap && window.ScrollTrigger && !reduceMotion) {
    document.querySelectorAll("[data-letters]").forEach(function (el) {
      const text = el.textContent;
      el.innerHTML = "";
      const frag = document.createDocumentFragment();
      text.split("").forEach(function (ch) {
        const span = document.createElement("span");
        span.className = "ltr";
        span.textContent = ch === " " ? " " : ch;
        frag.appendChild(span);
      });
      el.appendChild(frag);
      gsap.fromTo(el.querySelectorAll(".ltr"),
        { yPercent: 110, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: .7, ease: "power3.out", stagger: .02,
          scrollTrigger: { trigger: el, start: "top 86%" } });
    });
  }

  /* ---------- Stat counters ---------- */
  function animateCount(el) {
    const target = parseFloat(el.getAttribute("data-count"));
    const decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    const suffix = el.getAttribute("data-suffix") || "";
    if (isNaN(target)) return;
    if (reduceMotion) { el.textContent = target.toFixed(decimals) + suffix; return; }
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.8, ease: "power2.out",
      onUpdate: function () {
        el.textContent = obj.v.toFixed(decimals) + suffix;
      }
    });
  }
  if (window.gsap && window.ScrollTrigger) {
    document.querySelectorAll("[data-count]").forEach(function (el) {
      ScrollTrigger.create({
        trigger: el, start: "top 90%", once: true,
        onEnter: function () { animateCount(el); }
      });
    });
  } else {
    document.querySelectorAll("[data-count]").forEach(function (el) {
      const t = parseFloat(el.getAttribute("data-count"));
      const d = parseInt(el.getAttribute("data-decimals") || "0", 10);
      el.textContent = (isNaN(t) ? "" : t.toFixed(d)) + (el.getAttribute("data-suffix") || "");
    });
  }

  /* ---------- Highlight current day's hours ---------- */
  (function () {
    const today = new Date().getDay(); // 0 = Sunday
    const row = document.querySelector('#hours tr[data-day="' + today + '"]');
    if (!row) return;
    const td = row.querySelector("td");
    if (td && td.classList.contains("closed")) return;
    // Only flag "open now" within service hours
    const hrs = new Date().getHours();
    let open = false;
    if (today === 6) open = hrs >= 11 && hrs < 16;       // Saturday 11-4
    else if (today >= 1 && today <= 5) open = hrs >= 11 && hrs < 19; // Mon-Fri 11-7
    if (open) row.classList.add("is-now");
  })();

  /* ---------- Swiper: gallery ---------- */
  if (window.Swiper) {
    new Swiper(".gallery__swiper", {
      slidesPerView: "auto",
      spaceBetween: 18,
      grabCursor: true,
      navigation: { nextEl: ".gallery__btn--next", prevEl: ".gallery__btn--prev" },
      breakpoints: { 760: { spaceBetween: 26 } }
    });

    new Swiper(".reviews__swiper", {
      slidesPerView: 1,
      loop: true,
      autoplay: { delay: 5200, disableOnInteraction: false },
      pagination: { el: ".reviews__dots", clickable: true },
      effect: "fade",
      fadeEffect: { crossFade: true },
      speed: 700
    });
  }

  /* ---------- Refresh ScrollTrigger after load ---------- */
  window.addEventListener("load", function () {
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });
})();
