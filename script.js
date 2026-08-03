(function () {
  'use strict';

  /* ---------- Nav: solid on scroll ---------- */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  function closeMenu() {
    document.body.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  toggle.addEventListener('click', function () {
    var open = document.body.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
  });
  links.addEventListener('click', function (e) {
    if (e.target.closest('a')) closeMenu();
  });

  /* ---------- Accordion ---------- */
  var items = Array.prototype.slice.call(document.querySelectorAll('.acc-item'));

  function closePanel(item) {
    var panel = item.querySelector('.acc-panel');
    // from auto height -> fixed -> 0 so the transition works
    panel.style.height = panel.scrollHeight + 'px';
    void panel.offsetHeight; // force reflow
    item.classList.remove('open');
    item.querySelector('.acc-head').setAttribute('aria-expanded', 'false');
    panel.style.height = '0px';
  }

  function openPanel(item, animate) {
    var panel = item.querySelector('.acc-panel');
    item.classList.add('open');
    item.querySelector('.acc-head').setAttribute('aria-expanded', 'true');
    if (animate === false) {
      panel.style.height = 'auto';
      return;
    }
    panel.style.height = panel.scrollHeight + 'px';
    var done = function (e) {
      if (e && e.propertyName !== 'height') return;
      if (item.classList.contains('open')) panel.style.height = 'auto';
      panel.removeEventListener('transitionend', done);
    };
    panel.addEventListener('transitionend', done);
  }

  items.forEach(function (item) {
    var head = item.querySelector('.acc-head');
    head.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      items.forEach(function (other) {
        if (other !== item && other.classList.contains('open')) closePanel(other);
      });
      if (isOpen) closePanel(item);
      else openPanel(item, true);
    });
  });

  // open the first category by default (height auto -> robust to reflow)
  if (items.length) openPanel(items[0], false);

  // recompute nothing needed for auto-height panels on resize; fonts may reflow
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      var open = document.querySelector('.acc-item.open .acc-panel');
      if (open && open.style.height !== 'auto') open.style.height = 'auto';
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal, .reveal-img');
  function revealAll() {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
    // Safety net: never leave content (especially images) hidden if the
    // observer does not fire for some reason. Guarantees visibility.
    window.setTimeout(revealAll, 2600);
  } else {
    revealAll();
  }

  /* ---------- Highlight today's opening hours ---------- */
  var today = new Date().getDay(); // 0 = Sonntag
  var row = document.querySelector('.hours-row[data-day="' + today + '"]');
  if (row) {
    row.classList.add('today');
    var pill = document.createElement('span');
    pill.className = 'today-pill';
    pill.textContent = 'Heute';
    row.querySelector('.day').appendChild(pill);
  }

  /* ---------- Year ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
