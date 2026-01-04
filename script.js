(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scroll reveal
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) e.target.classList.add('in');
    }
  }, { threshold: 0.14 });

  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Active nav link on scroll
  const sections = [...document.querySelectorAll('section[id]')];
  const navLinks = [...document.querySelectorAll('.navlinks a[href^="#"]')];

  const setActive = () => {
    const y = window.scrollY + 120;
    let current = sections[0]?.id;
    for (const s of sections) {
      if (s.offsetTop <= y) current = s.id;
    }
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${current}`));
  };
  window.addEventListener('scroll', setActive, { passive: true });
  setActive();

  // Button interactions: sweep + ripple + micro-bounce
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(btn => {
    // add sweep element once
    if (!btn.querySelector('.sweep')) {
      const s = document.createElement('span');
      s.className = 'sweep';
      btn.appendChild(s);
    }

    const doRipple = (evt) => {
      const rect = btn.getBoundingClientRect();
      const x = (evt.clientX ?? (rect.left + rect.width/2)) - rect.left;
      const y = (evt.clientY ?? (rect.top + rect.height/2)) - rect.top;

      const r = document.createElement('span');
      r.className = 'ripple';
      r.style.left = `${x}px`;
      r.style.top = `${y}px`;
      btn.appendChild(r);
      r.addEventListener('animationend', () => r.remove(), { once: true });

      btn.classList.remove('sweeping');
      // retrigger
      void btn.offsetWidth;
      btn.classList.add('sweeping');
      setTimeout(() => btn.classList.remove('sweeping'), 380);
    };

    btn.addEventListener('pointerdown', (e) => {
      if (prefersReduced) return;
      doRipple(e);
    });

    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (!prefersReduced) doRipple(e);
      }
    });
  });

  // Make sure hero video tries to play; show controls only if autoplay fails
  const v = document.querySelector('video[data-hero]');
  if (v) {
    const tryPlay = async () => {
      try {
        const p = v.play();
        if (p && typeof p.then === 'function') await p;
      } catch {
        v.controls = true;
      }
    };
    // iOS/Safari: play after metadata
    v.addEventListener('loadedmetadata', tryPlay, { once: true });
    // also attempt immediately
    tryPlay();
  }

  // Smooth scrolling
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', id);
    });
  });

  // Demo form -> Formspree
  const form = document.querySelector('#demoForm');
  const status = document.querySelector('#formStatus');
  const submitBtn = document.querySelector('#demoSubmit');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (submitBtn) submitBtn.disabled = true;
      if (status) status.textContent = 'Sending…';

      try {
        const res = await fetch(form.action, {
          method: form.method || 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        });

        if (res.ok) {
          if (status) status.textContent = 'Thanks — we got it. We’ll reply shortly.';
          form.reset();
        } else {
          let msg = 'Something went wrong. Please try again.';
          try {
            const data = await res.json();
            if (data?.errors?.length) msg = data.errors[0].message || msg;
          } catch (_) {}
          if (status) status.textContent = msg;
        }
      } catch (err) {
        if (status) status.textContent = 'Network error. Please check your connection and try again.';
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
})();

// ----- Mobile menu toggle -----
(() => {
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (!menuBtn || !mobileMenu) return;

  const open = () => {
    mobileMenu.classList.add('open');
    document.body.classList.add('menuOpen');
    menuBtn.setAttribute('aria-expanded', 'true');
    mobileMenu.setAttribute('aria-hidden', 'false');
  };

  const close = () => {
    mobileMenu.classList.remove('open');
    document.body.classList.remove('menuOpen');
    menuBtn.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
  };

  menuBtn.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.contains('open');
    isOpen ? close() : open();
  });

  // Close when clicking the dimmed backdrop
  mobileMenu.addEventListener('click', (e) => {
    if (e.target === mobileMenu) close();
  });

  // Close after selecting a link
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => close());
  });

  // Escape key close
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  // Close if we rotate/resize up to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 640) close();
  });
})();
// --- Mobile menu safety: close on desktop width ---
const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu") || document.querySelector(".mobileMenu");

function closeMobileMenu() {
  if (!mobileMenu) return;
  mobileMenu.classList.remove("open");
  if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
}

window.addEventListener("resize", () => {
  if (window.innerWidth > 640) closeMobileMenu();
});

// Optional: close if user taps a link inside the mobile menu
if (mobileMenu) {
  mobileMenu.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a) closeMobileMenu();
  });
}
