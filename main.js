(function () {
  'use strict';

  // Scroll-triggered fade-in animations
  var elements = document.querySelectorAll('.animate-on-scroll');

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    elements.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  // Sticky nav — add class on scroll for enhanced background
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

  // Mobile menu toggle
  var toggle = document.querySelector('.mobile-menu-toggle');
  var nav = document.querySelector('.top-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('nav-open');
    });
  }
})();
