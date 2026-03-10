(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────
     Scroll-triggered fade-in animations
  ───────────────────────────────────────────────────────────── */
  var scrollEls = document.querySelectorAll('.animate-on-scroll');

  if ('IntersectionObserver' in window) {
    var scrollObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            scrollObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    scrollEls.forEach(function (el) { scrollObserver.observe(el); });
  } else {
    scrollEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ─────────────────────────────────────────────────────────────
     Sticky nav scroll effect
  ───────────────────────────────────────────────────────────── */
  var header = document.querySelector('.site-header');
  if (header) {
    var scrolled = false;
    window.addEventListener('scroll', function () {
      if (window.scrollY > 20 && !scrolled) {
        header.classList.add('header-scrolled');
        scrolled = true;
      } else if (window.scrollY <= 20 && scrolled) {
        header.classList.remove('header-scrolled');
        scrolled = false;
      }
    }, { passive: true });
  }

  /* ─────────────────────────────────────────────────────────────
     Mobile menu toggle
  ───────────────────────────────────────────────────────────── */
  var toggle = document.querySelector('.mobile-menu-toggle');
  var nav    = document.querySelector('.top-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('nav-open');
    });
  }

  /* ─────────────────────────────────────────────────────────────
     Nav dropdown
  ───────────────────────────────────────────────────────────── */
  var dropdowns = document.querySelectorAll('.nav-dropdown');
  dropdowns.forEach(function (dropdown) {
    var btn = dropdown.querySelector('.nav-dropdown-toggle');
    if (!btn) return;

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var wasOpen = dropdown.classList.contains('is-open');
      dropdowns.forEach(function (d) {
        d.classList.remove('is-open');
        var b = d.querySelector('.nav-dropdown-toggle');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        dropdown.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });

    dropdown.addEventListener('mouseenter', function () {
      if (window.innerWidth > 768) {
        dropdown.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
    dropdown.addEventListener('mouseleave', function () {
      if (window.innerWidth > 768) {
        dropdown.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  });

  document.addEventListener('click', function () {
    dropdowns.forEach(function (d) {
      d.classList.remove('is-open');
      var b = d.querySelector('.nav-dropdown-toggle');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  });

})();
