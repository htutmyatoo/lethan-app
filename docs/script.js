(() => {
  'use strict';

  /* =======================================================
     Public beta link
     ======================================================= */
  // Replace this once with your Firebase App Distribution group invite URL.
  // Example: const BETA_INVITE_URL = 'https://appdistribution.firebase.dev/i/...';
  const BETA_INVITE_URL = 'https://appdistribution.firebase.dev/i/d71744164f981096';

  const NEWSLETTER_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbwrKGFFbB6ZO1myNoQw9yqnkL8QwVJT2GbJcjJqvc9K1FQ26qw9Q8vPh95kJ0hH5YSs/exec';

  function initBetaLinks() {
    document.querySelectorAll('[data-beta-link]').forEach((link) => {
      if (BETA_INVITE_URL) {
        link.href = BETA_INVITE_URL;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        return;
      }

      link.addEventListener('click', (event) => {
        event.preventDefault();
        console.warn('LetHan: add the Firebase App Distribution invite URL to BETA_INVITE_URL in script.js.');
      });
    });
  }

  /* =======================================================
     Newsletter signup
     ======================================================= */
async function submitNewsletterSignup(email) {
  const response = await fetch(NEWSLETTER_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify({ email })
  });

  const raw = await response.text();

  console.log('Newsletter status:', response.status);
  console.log('Newsletter response:', raw);

  let result;

  try {
    result = JSON.parse(raw);
  } catch {
    throw new Error(
      'Google Apps Script returned a non-JSON response.'
    );
  }

  if (!result.success) {
    throw new Error(
      result.message || 'Newsletter signup failed.'
    );
  }

  return result;
}

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function initNewsletterForm() {
  const form = document.getElementById('newsletter-form');

  if (!form) return;

  const status = document.getElementById('newsletter-form-status');
  const input = form.querySelector('.email-input');
  const submitBtn = form.querySelector('.btn-submit');

  if (!status || !input || !submitBtn) return;

  let isSubmitting = false;

  function setStatus(message, state) {
    status.textContent = message;

    if (state) {
      status.setAttribute('data-state', state);
    } else {
      status.removeAttribute('data-state');
    }
  }

  function setInvalid(isInvalid) {
    if (isInvalid) {
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.removeAttribute('aria-invalid');
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    const email = input.value.trim();

    if (!email) {
      setInvalid(true);
      setStatus('Enter your email address to join.', 'error');
      input.focus();
      return;
    }

    if (!EMAIL_RE.test(email)) {
      setInvalid(true);
      setStatus(
        'That email address doesn’t look right — check it and try again.',
        'error'
      );
      input.focus();
      return;
    }

    setInvalid(false);

    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.classList.add('is-loading');
    input.disabled = true;

    setStatus('Joining…', null);

    try {
      const result = await submitNewsletterSignup(email);

      if (result.alreadySubscribed) {
        setStatus(
          'You’re already on the LetHan newsletter. 🤟',
          'success'
        );
      } else {
        setStatus(
          'You’re in — welcome to the LetHan newsletter. 🤟',
          'success'
        );
      }

      form.reset();

    } catch (err) {
      setStatus(
        'Something went wrong. Please try again in a moment.',
        'error'
      );

      console.error('LetHan newsletter signup failed:', err);

    } finally {
      isSubmitting = false;

      submitBtn.disabled = false;
      submitBtn.classList.remove('is-loading');
      input.disabled = false;
    }
  });
}

  /* =======================================================
     Interactive problem challenge
     ======================================================= */
  function initTypingChallenge() {
    const form = document.getElementById('challenge-form');
    const input = document.getElementById('challenge-input');
    const timerEl = document.getElementById('challenge-timer');
    const result = document.getElementById('challenge-result');
    const finalTime = document.getElementById('challenge-final-time');

    if (!form || !input || !timerEl || !result || !finalTime) return;

    let startTime = null;
    let rafId = null;
    let finished = false;

    function elapsedSeconds() {
      if (startTime === null) return 0;
      return (performance.now() - startTime) / 1000;
    }

    function renderTimer() {
      if (finished || startTime === null) return;
      timerEl.textContent = `${elapsedSeconds().toFixed(1)} seconds`;
      rafId = requestAnimationFrame(renderTimer);
    }

    input.addEventListener('input', () => {
      if (startTime !== null || !input.value.trim()) return;
      startTime = performance.now();
      renderTimer();
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      if (!input.value.trim()) {
        input.focus();
        input.setAttribute('aria-invalid', 'true');
        return;
      }

      input.removeAttribute('aria-invalid');
      if (startTime === null) startTime = performance.now();

      finished = true;
      if (rafId) cancelAnimationFrame(rafId);

      const seconds = Math.max(elapsedSeconds(), 0.1).toFixed(1);
      timerEl.textContent = `${seconds} seconds`;
      finalTime.textContent = `${seconds} seconds`;
      result.hidden = false;
      input.disabled = true;
      form.querySelector('button[type="submit"]').disabled = true;
    });
  }

  /* =======================================================
     Platform installer tabs
     ======================================================= */
  function initPlatformTabs() {
    const tabs = Array.from(document.querySelectorAll('[data-platform-tab]'));
    const panels = Array.from(document.querySelectorAll('[data-platform-panel]'));
    if (!tabs.length || !panels.length) return;

    function activateTab(tab) {
      const platform = tab.dataset.platformTab;

      tabs.forEach((item) => {
        const active = item === tab;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-selected', String(active));
        item.tabIndex = active ? 0 : -1;
      });

      panels.forEach((panel) => {
        const active = panel.dataset.platformPanel === platform;
        panel.classList.toggle('is-active', active);
        panel.hidden = !active;
      });
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activateTab(tab));
      tab.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
        event.preventDefault();
        const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
        const next = tabs[(index + delta + tabs.length) % tabs.length];
        activateTab(next);
        next.focus();
      });
    });
  }

  /* =======================================================
     Mobile nav toggle
     ======================================================= */
  function initNavToggle() {
    const toggle = document.getElementById('nav-toggle');
    const links = document.getElementById('nav-links');
    if (!toggle || !links) return;

    toggle.addEventListener('click', () => {
      const isOpen = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    links.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* =======================================================
     Scroll reveal via IntersectionObserver
     ======================================================= */
  function initScrollReveal() {
    const targets = document.querySelectorAll('.reveal');
    if (!targets.length) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    targets.forEach((el) => observer.observe(el));
  }

  /* =======================================================
     Gesture data — shared between hero phone mock and demo
     ======================================================= */
  const GESTURES = {
    palm: {
      emoji: '✋',
      label: 'Open palm',
      message: 'Could I have a chicken wrap with no onions, no spicy sauce, and a bottle of still water?',
      confidence: 98,
    },
    thumb: { emoji: '👍', label: 'Thumb up', message: 'Excuse me, I’m trying to get to Sunderland Station for the 4:20 train to Newcastle.', confidence: 95 },
    fist: { emoji: '✊', label: 'Closed fist', message: 'Emergency action', confidence: 99 },
  };

  /* =======================================================
     Hero phone mock
     ======================================================= */
  function initPhoneVideoSoundToggle() {
  const video = document.getElementById('phone-promo-video');
  const button = document.getElementById('phone-sound-toggle');

  if (!video || !button) return;

  function updateButton() {
    button.classList.toggle('is-muted', video.muted);
    button.setAttribute('aria-pressed', String(!video.muted));
    button.setAttribute(
      'aria-label',
      video.muted ? 'Turn sound on' : 'Turn sound off'
    );
  }

  button.addEventListener('click', () => {
    video.muted = !video.muted;
    updateButton();

    if (!video.muted && video.paused) {
      video.play().catch(() => {});
    }
  });

  updateButton();
}
  function initPhoneMock() {
    const dockButtons = document.querySelectorAll('.dock-gesture');
    const statusLabel = document.getElementById('status-label');
    const statusConfidence = document.getElementById('status-confidence');
    const messageEl = document.getElementById('phone-message');
    const inkUnderline = document.getElementById('ink-underline');

    if (!dockButtons.length || !statusLabel || !messageEl) return;

    function replayInkAnimation() {
      if (!inkUnderline) return;
      const path = inkUnderline.querySelector('path');
      if (!path) return;
      path.style.animation = 'none';
      void path.offsetWidth;
      path.style.animation = '';
    }

    function setGesture(key) {
      const gesture = GESTURES[key];
      if (!gesture) return;

      dockButtons.forEach((btn) => {
        const isActive = btn.dataset.gesture === key;
        btn.setAttribute('aria-pressed', String(isActive));
      });

      statusLabel.textContent = 'Gesture recognised';
      statusConfidence.textContent = `${gesture.confidence}%`;
      messageEl.textContent = gesture.message;
      replayInkAnimation();
    }

    dockButtons.forEach((btn) => {
      btn.addEventListener('click', () => setGesture(btn.dataset.gesture));
    });
  }

  /* =======================================================
     How it works demo
     ======================================================= */
  function initGestureDemo() {
    const demoButtons = document.querySelectorAll('.demo-btn');
    const resultEl = document.getElementById('demo-result');
    if (!demoButtons.length || !resultEl) return;

    demoButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const gesture = GESTURES[btn.dataset.demo];
        if (!gesture) return;

        demoButtons.forEach((b) => b.classList.toggle('is-active', b === btn));
        resultEl.textContent = `“${gesture.message}”`;
      });
    });
  }

  /* =======================================================
     Copyright
     ======================================================= */
function initCurrentYear() {
  const yearEl = document.getElementById('current-year');

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

  /* =======================================================
     BG MUSIC
     ======================================================= */
function initSpotifyVisibility() {
  const player = document.getElementById('spotify-player');
  const hero = document.querySelector('.hero');
  const footer = document.querySelector('.site-footer');

  if (!player || !hero || !footer) return;

  let heroVisible = false;
  let footerVisible = false;

  function updatePlayerVisibility() {
    const shouldHide = heroVisible || footerVisible;

    player.classList.toggle('is-hidden', shouldHide);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.target === hero) {
          heroVisible = entry.isIntersecting;
        }

        if (entry.target === footer) {
          footerVisible = entry.isIntersecting;
        }
      });

      updatePlayerVisibility();
    },
    {
      threshold: 0.1
    }
  );

  observer.observe(hero);
  observer.observe(footer);
}

  /* =======================================================
     Init
     ======================================================= */
  document.addEventListener('DOMContentLoaded', () => {
    initPhoneVideoSoundToggle();
    initBetaLinks();
    initNewsletterForm();
    initTypingChallenge();
    initPlatformTabs();
    initNavToggle();
    initScrollReveal();
    initPhoneMock();
    initGestureDemo();
    initCurrentYear();
  });
})();
