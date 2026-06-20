/**
 * Bike Bhutan — script.js
 * Author: Bike Bhutan
 * Description: Progressive enhancement — all core content readable without JS.
 * Security: No eval(), no innerHTML with user data, CSP-friendly.
 */

'use strict';

/* ─── UTILITY ─────────────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/**
 * Throttle — prevents scroll/resize handlers firing too often.
 * @param {Function} fn
 * @param {number} wait  ms
 */
function throttle(fn, wait = 80) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn.apply(this, args);
    }
  };
}

/* ─── SCROLL PROGRESS BAR ─────────────────────────────────────────── */
function initProgressBar() {
  const bar = $('#progress-bar');
  if (!bar) return;

  const update = throttle(() => {
    const scrolled = window.scrollY;
    const total = document.body.scrollHeight - window.innerHeight;
    const pct = total > 0 ? (scrolled / total) * 100 : 0;
    bar.style.width = `${Math.min(pct, 100)}%`;
  }, 40);

  window.addEventListener('scroll', update, { passive: true });
}

/* ─── STICKY NAV ──────────────────────────────────────────────────── */
function initNavbar() {
  const navbar = $('#navbar');
  if (!navbar) return;

  const update = throttle(() => {
    navbar.classList.toggle('scrolled', window.scrollY > 80);
  }, 60);

  window.addEventListener('scroll', update, { passive: true });
}

/* ─── MOBILE NAV ──────────────────────────────────────────────────── */
function initMobileNav() {
  const hamburger = $('#nav-hamburger');
  const mobileMenu = $('#nav-mobile');
  const overlay    = $('#nav-overlay');

  if (!hamburger || !mobileMenu || !overlay) return;

  function open() {
    hamburger.classList.add('open');
    mobileMenu.classList.add('open');
    overlay.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    overlay.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    hamburger.getAttribute('aria-expanded') === 'true' ? close() : open();
  });

  overlay.addEventListener('click', close);

  // Close on mobile link click
  $$('.nav-mobile a').forEach(link => {
    link.addEventListener('click', close);
  });

  // Close on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
  });
}

/* ─── SCROLL REVEAL ───────────────────────────────────────────────── */
function initReveal() {
  const elements = $$('.reveal');
  if (!elements.length) return;

  // Skip if user prefers reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    elements.forEach(el => el.classList.add('visible'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach(el => io.observe(el));
}

/* ─── COUNTER ANIMATION ───────────────────────────────────────────── */
function animateCounter(el, target, suffix, duration = 1600) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = target.toLocaleString() + suffix;
    return;
  }

  const startTime = performance.now();
  const startVal = 0;

  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out quad
    const eased = 1 - (1 - progress) * (1 - progress);
    const current = Math.round(startVal + eased * (target - startVal));
    el.textContent = current.toLocaleString() + suffix;

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

function initCounters() {
  const strip = $('#altitude-strip');
  if (!strip) return;

  let triggered = false;

  const io = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !triggered) {
        triggered = true;
        io.disconnect();

        $$('.alt-num[data-count]').forEach(el => {
          const target = parseFloat(el.dataset.count);
          const suffix = el.dataset.suffix || '';
          if (!isNaN(target)) animateCounter(el, target, suffix);
        });
      }
    },
    { threshold: 0.4 }
  );

  io.observe(strip);
}

/* ─── SMOOTH SCROLL FOR ANCHORS ───────────────────────────────────── */
function initSmoothScroll() {
  // Only handle internal anchor links
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const targetId = link.getAttribute('href').slice(1);
      if (!targetId) return;

      const target = document.getElementById(targetId);
      if (!target) return;

      e.preventDefault();

      const navbarH = $('#navbar')?.offsetHeight ?? 0;
      const top = target.getBoundingClientRect().top + window.scrollY - navbarH - 8;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // Scroll hint arrow
  const scrollHint = $('.scroll-hint');
  if (scrollHint) {
    scrollHint.addEventListener('click', () => {
      const next = document.getElementById('altitude-strip');
      if (next) next.scrollIntoView({ behavior: 'smooth' });
    });
  }
}

/* ─── PARALLAX HERO ───────────────────────────────────────────────── */
function initParallax() {
  const heroBg = $('.hero-bg');
  if (!heroBg) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(max-width: 900px)').matches) return; // skip on mobile

  const update = throttle(() => {
    const scrolled = window.scrollY;
    heroBg.style.transform = `translateY(${scrolled * 0.28}px)`;
  }, 20);

  window.addEventListener('scroll', update, { passive: true });
}

/* ─── IMAGE LAZY LOADING FALLBACK ─────────────────────────────────── */
function initImages() {
  // Modern browsers handle loading="lazy" natively.
  // Fallback for older browsers: observe and set src from data-src.
  if ('loading' in HTMLImageElement.prototype) return;

  const images = $$('img[loading="lazy"]');
  if (!images.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.dataset.src || img.getAttribute('src');
          if (src) img.src = src;
          io.unobserve(img);
        }
      });
    },
    { rootMargin: '200px' }
  );

  images.forEach(img => io.observe(img));
}

/* ─── SECURITY: EXTERNAL LINK PROTECTION ─────────────────────────── */
function initExternalLinks() {
  $$('a[href^="http"]').forEach(link => {
    if (link.hostname !== window.location.hostname) {
      // rel="noopener noreferrer" prevents tab-napping attacks
      link.setAttribute('rel', 'noopener noreferrer');
      if (!link.getAttribute('target')) {
        link.setAttribute('target', '_blank');
      }
    }
  });
}

/* ─── HERO PARTICLES ─────────────────────────────────────────────── */
function initParticles() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const hero = $('#hero');
  if (!hero) return;

  const COUNT = 14;
  const frag  = document.createDocumentFragment();

  for (let i = 0; i < COUNT; i++) {
    const p  = document.createElement('span');
    p.className = 'hero-particle';
    const size = 3 + Math.random() * 5;
    const dur  = 5 + Math.random() * 8;
    const dx   = (Math.random() - 0.5) * 60;

    p.style.cssText = [
      `width:${size}px`,
      `height:${size}px`,
      `left:${5 + Math.random() * 90}%`,
      `bottom:${5 + Math.random() * 35}%`,
      `--p-dur:${dur.toFixed(1)}s`,
      `--p-delay:${(Math.random() * dur).toFixed(1)}s`,
      `--p-dx:${dx.toFixed(0)}px`,
      `opacity:0`,
    ].join(';');

    frag.appendChild(p);
  }
  hero.appendChild(frag);
}

/* ─── 3D CARD TILT ────────────────────────────────────────────────── */
function initCardTilt() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(max-width: 900px)').matches) return;

  const cards = $$('.include-card');
  if (!cards.length) return;

  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const rx   = ((e.clientY - cy) / (rect.height / 2)) * -8;
      const ry   = ((e.clientX - cx) / (rect.width  / 2)) *  8;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(6px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* ─── BUTTON RIPPLE ───────────────────────────────────────────────── */
function initRipple() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  $$('.btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const wave = document.createElement('span');
      wave.className = 'ripple-wave';
      wave.style.cssText = [
        `width:${size}px`,
        `height:${size}px`,
        `left:${e.clientX - rect.left - size / 2}px`,
        `top:${e.clientY - rect.top  - size / 2}px`,
      ].join(';');
      btn.appendChild(wave);
      wave.addEventListener('animationend', () => wave.remove(), { once: true });
    });
  });
}

/* ─── TIMELINE SELF-DRAW ──────────────────────────────────────────── */
function initTimelineDraw() {
  const timeline = $('.stops-timeline');
  if (!timeline) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    timeline.classList.add('line-drawn');
    return;
  }

  const io = new IntersectionObserver(
    entries => {
      if (entries[0].isIntersecting) {
        timeline.classList.add('line-drawn');
        io.disconnect();
      }
    },
    { threshold: 0.05 }
  );

  io.observe(timeline);
}

/* ─── THEME TOGGLE ────────────────────────────────────────────────── */
function initTheme() {
  const toggle = $('#theme-toggle');
  if (!toggle) return;

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bikebhutan-theme', theme);
    toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.content = theme === 'dark' ? '#0d1a10' : '#0D2818';
  }

  toggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    applyTheme(isDark ? 'light' : 'dark');
  });

  // Sync aria-label with current state on load
  const current = document.documentElement.getAttribute('data-theme');
  toggle.setAttribute('aria-label', current === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
}

/* ─── BOOKING FORM ────────────────────────────────────────────────── */
// Replace with the real WhatsApp number (country code + number, no +)
const BK_WA_NUM = '97577277687';

function initBookingForm() {
  const form        = document.getElementById('booking-form');
  const successPanel = document.querySelector('.bk-success');
  const resetBtn    = document.querySelector('.bk-reset-btn');
  if (!form || !successPanel) return;

  // Set date minimum to today
  const dateInput = document.getElementById('bk-date');
  if (dateInput) {
    dateInput.min = new Date().toISOString().split('T')[0];
  }

  resetBtn?.addEventListener('click', () => {
    form.reset();
    form.hidden = false;
    successPanel.hidden = true;
    form.querySelectorAll('.bk-invalid').forEach(el => el.classList.remove('bk-invalid'));
    form.querySelectorAll('.bk-err').forEach(el => { el.textContent = ''; });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!bkValidate(form)) return;

    const d    = new FormData(form);
    const name   = d.get('name').trim();
    const email  = d.get('email').trim();
    const date   = bkFormatDate(d.get('date'));
    const slot   = d.get('slot');
    const riders = d.get('riders');
    const phone  = (d.get('phone') || '').trim();
    const notes  = (d.get('notes') || '').trim();

    let msg = `Hi Bike Bhutan! 🚴 I'd like to book a ride.\n\n`;
    msg += `*Name:* ${name}\n`;
    msg += `*Email:* ${email}\n`;
    msg += `*Date:* ${date}\n`;
    msg += `*Time:* ${slot}\n`;
    msg += `*Riders:* ${riders}\n`;
    if (phone) msg += `*Phone:* ${phone}\n`;
    if (notes) msg += `*Notes:* ${notes}\n`;
    msg += `\nPlease confirm my spot. Thank you!`;

    window.open(`https://wa.me/${BK_WA_NUM}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');

    form.hidden = true;
    successPanel.hidden = false;
  });
}

function bkValidate(form) {
  let ok = true;

  form.querySelectorAll('.bk-err').forEach(el => { el.textContent = ''; });
  form.querySelectorAll('.bk-invalid').forEach(el => el.classList.remove('bk-invalid'));

  const name  = form.querySelector('#bk-name');
  const email = form.querySelector('#bk-email');
  const date  = form.querySelector('#bk-date');
  const riders = form.querySelector('#bk-riders');
  const slots  = form.querySelector('.bk-slots');
  const slotErr = form.querySelector('.bk-slot-err');

  if (!name.value.trim()) {
    bkError(name, 'Please enter your name.'); ok = false;
  }
  if (!email.value.trim()) {
    bkError(email, 'Please enter your email.'); ok = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    bkError(email, 'Please enter a valid email address.'); ok = false;
  }
  if (!date.value) {
    bkError(date, 'Please choose a ride date.'); ok = false;
  }
  if (!riders.value) {
    bkError(riders, 'Please select the number of riders.'); ok = false;
  }
  if (!form.querySelector('input[name="slot"]:checked')) {
    slots?.classList.add('bk-invalid');
    if (slotErr) slotErr.textContent = 'Please choose a time slot.';
    ok = false;
  }

  if (!ok) {
    const first = form.querySelector('.bk-invalid input, .bk-invalid select, .bk-invalid');
    first?.focus();
  }
  return ok;
}

function bkError(input, msg) {
  input.classList.add('bk-invalid');
  const err = input.closest('.bk-field')?.querySelector('.bk-err');
  if (err) err.textContent = msg;
}

function bkFormatDate(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
}

/* ─── WHATSAPP BUTTON VALIDATION ──────────────────────────────────── */
function initWhatsApp() {
  // Validates the WhatsApp href at runtime so the link is safe.
  const waBtn = $('.whatsapp-btn');
  if (!waBtn) return;

  const href = waBtn.getAttribute('href') || '';

  // Only allow wa.me or api.whatsapp.com URLs
  const ALLOWED = /^https:\/\/(wa\.me|api\.whatsapp\.com)\//;
  if (href && !ALLOWED.test(href)) {
    // Remove the href to prevent navigation to an unexpected URL
    waBtn.removeAttribute('href');
    console.warn('[BikeBhutan] WhatsApp URL does not match allowed pattern. Link disabled.');
  }
}

/* ─── INIT ────────────────────────────────────────────────────────── */
function init() {
  initProgressBar();
  initNavbar();
  initMobileNav();
  initTheme();
  initReveal();
  initCounters();
  initSmoothScroll();
  initParallax();
  initParticles();
  initCardTilt();
  initRipple();
  initTimelineDraw();
  initBookingForm();
  initImages();
  initExternalLinks();
  initWhatsApp();
}

// Run after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
