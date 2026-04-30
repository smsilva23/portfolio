/**
 * Sets active state on nav links from <body data-page="...">.
 */
(function () {
  var page = document.body.getAttribute("data-page");
  if (!page) return;
  document
    .querySelectorAll(
      ".nav-home-link[data-nav], .site-nav__link[data-nav], .nav-dropdown__trigger[data-nav]"
    )
    .forEach(function (link) {
      if (link.getAttribute("data-nav") === page) {
        link.classList.add("is-active");
      }
    });
})();

/**
 * Home: show bottom page arrows only after the hero has scrolled out of view.
 */
(function () {
  if (document.body.getAttribute("data-page") !== "home") return;

  var hero = document.getElementById("hero");
  var arrows = document.querySelector(".page-arrows");
  if (!hero || !arrows) return;

  function updateHomeArrows() {
    var pastHero = hero.getBoundingClientRect().bottom <= 0;
    arrows.classList.toggle("is-visible", pastHero);
    arrows.setAttribute("aria-hidden", pastHero ? "false" : "true");
  }

  updateHomeArrows();
  window.addEventListener("scroll", updateHomeArrows, { passive: true });
  window.addEventListener("resize", updateHomeArrows, { passive: true });
})();

/**
 * Nav dropdowns: closed by default; click trigger to open (accordion — one open at a time).
 */
(function () {
  document.querySelectorAll(".nav-dropdown").forEach(function (dd) {
    var trigger = dd.querySelector(".nav-dropdown__trigger");
    if (!trigger) return;

    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var willOpen = !dd.classList.contains("is-open");
      document.querySelectorAll(".nav-dropdown.is-open").forEach(function (o) {
        if (o !== dd) {
          o.classList.remove("is-open");
          var t = o.querySelector(".nav-dropdown__trigger");
          if (t) t.setAttribute("aria-expanded", "false");
        }
      });
      dd.classList.toggle("is-open", willOpen);
      trigger.setAttribute("aria-expanded", willOpen ? "true" : "false");
    });
  });

  document.addEventListener("click", function (e) {
    if (e.target.closest(".nav-dropdown")) return;
    document.querySelectorAll(".nav-dropdown.is-open").forEach(function (dd) {
      dd.classList.remove("is-open");
      var t = dd.querySelector(".nav-dropdown__trigger");
      if (t) t.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener(
    "keydown",
    function (e) {
      if (e.key !== "Escape") return;
      document.querySelectorAll(".nav-dropdown.is-open").forEach(function (dd) {
        dd.classList.remove("is-open");
        var t = dd.querySelector(".nav-dropdown__trigger");
        if (t) t.setAttribute("aria-expanded", "false");
      });
    },
    true
  );
})();

/**
 * Mobile / tablet (≤1023px): hamburger opens full-screen nav; links close it.
 * Desktop: menu is always visible in the header bar.
 */
(function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (!toggle || !nav) return;

  var mqMobile = window.matchMedia("(max-width: 1023px)");
  var header = document.querySelector(".site-header");

  function syncHeaderOffset() {
    if (!header) return;
    var h = Math.ceil(header.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--header-offset", h + "px");
  }

  function closeAllDropdowns() {
    document.querySelectorAll(".nav-dropdown.is-open").forEach(function (dd) {
      dd.classList.remove("is-open");
      var t = dd.querySelector(".nav-dropdown__trigger");
      if (t) t.setAttribute("aria-expanded", "false");
    });
  }

  function setNavOpen(open) {
    document.body.classList.toggle("nav-open", open);
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (!open) closeAllDropdowns();
  }

  function closeNav() {
    setNavOpen(false);
  }

  syncHeaderOffset();

  window.addEventListener("load", syncHeaderOffset, { passive: true });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      syncHeaderOffset();
    });
  }

  toggle.addEventListener("click", function (e) {
    e.stopPropagation();
    syncHeaderOffset();
    setNavOpen(!nav.classList.contains("is-open"));
  });

  nav.querySelectorAll("a").forEach(function (link) {
    if (link.classList.contains("nav-dropdown__trigger")) return;
    link.addEventListener("click", function () {
      if (mqMobile.matches) closeNav();
    });
  });

  document.querySelectorAll(".nav-home-link, .site-nav__link").forEach(function (link) {
    link.addEventListener("click", function () {
      if (mqMobile.matches) closeNav();
    });
  });

  window.addEventListener(
    "resize",
    function () {
      syncHeaderOffset();
      if (!mqMobile.matches) closeNav();
    },
    { passive: true }
  );

  document.addEventListener("click", function (e) {
    if (!mqMobile.matches || !nav.classList.contains("is-open")) return;
    if (e.target.closest("#site-nav") || e.target.closest(".nav-toggle")) return;
    closeNav();
  });

  window.addEventListener(
    "orientationchange",
    function () {
      syncHeaderOffset();
    },
    { passive: true }
  );

  document.addEventListener(
    "keydown",
    function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        closeNav();
        toggle.focus();
      }
    },
    true
  );
})();

/**
 * Image lightbox: clicking a.piece-hover (not embed) opens enlarged image in-page.
 * Close: X button, dark backdrop click, or Escape.
 */
(function () {
  var root = null;
  var imgEl = null;
  var captionEl = null;
  var lastFocus = null;

  function ensureRoot() {
    if (root) return;
    root = document.createElement("div");
    root.id = "image-lightbox";
    root.className = "image-lightbox";
    root.setAttribute("hidden", "");
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Enlarged image");
    root.innerHTML =
      '<button type="button" class="image-lightbox__backdrop" aria-label="Close enlarged image"></button>' +
      '<div class="image-lightbox__panel">' +
      '<button type="button" class="image-lightbox__close" aria-label="Close">' +
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<path d="M18 6L6 18M6 6l12 12" /></svg></button>' +
      '<img class="image-lightbox__img" alt="" />' +
      '<p class="image-lightbox__caption"></p>' +
      "</div>";
    document.body.appendChild(root);
    imgEl = root.querySelector(".image-lightbox__img");
    captionEl = root.querySelector(".image-lightbox__caption");
    root.querySelector(".image-lightbox__backdrop").addEventListener("click", close);
    root.querySelector(".image-lightbox__close").addEventListener("click", close);
  }

  function open(href, alt, titleText) {
    ensureRoot();
    lastFocus = document.activeElement;
    imgEl.src = href;
    imgEl.alt = alt || "";
    if (captionEl) {
      var t = (titleText || "").trim();
      captionEl.textContent = t;
      captionEl.hidden = !t;
    }
    root.removeAttribute("hidden");
    document.body.classList.add("image-lightbox-open");
    window.setTimeout(function () {
      root.querySelector(".image-lightbox__close").focus();
    }, 0);
  }

  function close() {
    if (!root || root.hasAttribute("hidden")) return;
    root.setAttribute("hidden", "");
    imgEl.removeAttribute("src");
    document.body.classList.remove("image-lightbox-open");
    if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus();
    }
    lastFocus = null;
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest("a.piece-hover");
    if (!a) return;
    if (a.closest(".piece-hover--embed")) return;
    var innerImg = a.querySelector("img");
    if (!innerImg) return;
    e.preventDefault();
    var titleNode = a.querySelector(".piece-hover__title");
    var titleText = titleNode ? titleNode.textContent : "";
    open(a.getAttribute("href"), innerImg.getAttribute("alt") || "", titleText);
  });

  document.addEventListener(
    "keydown",
    function (e) {
      if (e.key !== "Escape") return;
      if (!root || root.hasAttribute("hidden")) return;
      e.preventDefault();
      close();
    },
    true
  );
})();

/**
 * Five Senses coverflow: the row translates so the active slide sits in the
 * viewport center; only the centered slide is scaled up. Arrows move the row.
 */
(function () {
  document.querySelectorAll(".piece-coverflow").forEach(function (root) {
    var viewport = root.querySelector(".piece-coverflow__viewport");
    var track = root.querySelector(".piece-coverflow__track");
    var slides = root.querySelectorAll(".piece-coverflow__slide");
    var prev = root.querySelector(".piece-coverflow__arrow--prev");
    var next = root.querySelector(".piece-coverflow__arrow--next");
    if (!viewport || !track || !slides.length || !prev || !next) return;

    var n = slides.length;
    var active = 0;

    function layout() {
      var vw = viewport.clientWidth;
      var slideW = slides[0].offsetWidth;
      if (slideW < 8) return;
      var pad = vw / 2 - slideW / 2;
      track.style.paddingLeft = pad + "px";
      track.style.paddingRight = pad + "px";
      var slideEl = slides[active];
      var centerX = slideEl.offsetLeft + slideEl.offsetWidth / 2;
      var tx = vw / 2 - centerX;
      track.style.transform = "translateX(" + tx + "px)";
    }

    function render() {
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === active);
      });
      layout();
    }

    function go(delta) {
      active = (active + delta + n) % n;
      render();
    }

    function onArrowClick(delta) {
      return function (e) {
        e.preventDefault();
        e.stopPropagation();
        go(delta);
      };
    }
    prev.addEventListener("click", onArrowClick(-1));
    next.addEventListener("click", onArrowClick(1));

    slides.forEach(function (slide, i) {
      slide.addEventListener("click", function (e) {
        if (i !== active) {
          e.preventDefault();
          e.stopPropagation();
          active = i;
          render();
        }
      });
    });

    window.addEventListener("resize", function () {
      layout();
    });

    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () {
        layout();
      });
      ro.observe(viewport);
    }

    function kick() {
      if (slides[0].offsetWidth < 8) {
        window.requestAnimationFrame(kick);
        return;
      }
      render();
    }

    window.requestAnimationFrame(kick);
    window.addEventListener("load", kick, { once: true });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(kick);
    }
  });
})();
