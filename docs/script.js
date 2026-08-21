(() => {
  'use strict';

  /* =======================================================
     Beta signup — shared submission logic
     ======================================================= */

  /**
   * Submits an email address for beta access.
   *
   * >>> BACKEND INTEGRATION POINT <<<
   * Replace the body of this function with a real call, e.g.:
   *
   *   const res = await fetch('/api/beta-signup', {
   *     method: 'POST',
   *     headers: { 'Content-Type': 'application/json' },
   *     body: JSON.stringify({ email })
   *   });
   *   if (!res.ok) throw new Error('Request failed');
   *   return res.json();
   *
   * or call Firebase (addDoc / httpsCallable / etc).
   *
   * This placeholder does NOT fake a network request or a
   * success response — it deliberately throws, so it is obvious
   * this still needs to be wired up.
   */
  async function submitBetaSignup(email) {
    // TODO: connect Firebase / API / newsletter provider here.
    throw new Error(
      'submitBetaSignup() is a placeholder — connect it to your backend (Firebase/API/mailing service) before going live.'
    );
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function initSignupForm(formId, statusId) {
    const form = document.getElementById(formId);
    if (!form) return;

    const status = document.getElementById(statusId);
    const input = form.querySelector('.email-input');
    const submitBtn = form.querySelector('.btn-submit');
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

      if (isSubmitting) return; // duplicate-click protection

      const email = input.value.trim();

      if (!email) {
        setInvalid(true);
        setStatus('Enter your email address to continue.', 'error');
        input.focus();
        return;
      }

      if (!EMAIL_RE.test(email)) {
        setInvalid(true);
        setStatus('That email address doesn\u2019t look right — check it and try again.', 'error');
        input.focus();
        return;
      }

      setInvalid(false);
      isSubmitting = true;
      submitBtn.disabled = true;
      submitBtn.classList.add('is-loading');
      input.disabled = true;
      setStatus('Sending\u2026', null);

      try {
        await submitBetaSignup(email);
        setStatus('You\u2019re on the list \u2014 look out for an email from LetHan.', 'success');
        form.reset();
      } catch (err) {
        setStatus(
          'Something went wrong on our end. Please try again in a moment.',
          'error'
        );
        // Surface the real reason for developers without alarming visitors.
        console.error('LetHan beta signup failed:', err);
      } finally {
        isSubmitting = false;
        submitBtn.disabled = false;
        submitBtn.classList.remove('is-loading');
        input.disabled = false;
      }
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
    palm: { emoji: '\u270B', label: 'Open palm', message: 'I\u2019d like to order, please.', confidence: 98 },
    thumb: { emoji: '\uD83D\uDC4D', label: 'Thumb up', message: 'Yes, thank you.', confidence: 95 },
    fist: { emoji: '\u270A', label: 'Closed fist', message: 'Emergency action', confidence: 99 },
  };

  /* =======================================================
     Hero phone mock — dock buttons update the mini screen
     ======================================================= */
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
      // Force reflow so the animation can restart.
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
      statusConfidence.textContent = gesture.confidence + '%';
      messageEl.textContent = gesture.message;
      replayInkAnimation();
    }

    dockButtons.forEach((btn) => {
      btn.addEventListener('click', () => setGesture(btn.dataset.gesture));
    });
  }

  /* =======================================================
     "How it works" interactive demo
     ======================================================= */
  function initGestureDemo() {
    const demoButtons = document.querySelectorAll('.demo-btn');
    const resultEl = document.getElementById('demo-result');
    if (!demoButtons.length || !resultEl) return;

    demoButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.demo;
        const gesture = GESTURES[key];
        if (!gesture) return;

        demoButtons.forEach((b) => b.classList.toggle('is-active', b === btn));
        resultEl.textContent = '\u201C' + gesture.message + '\u201D';
      });
    });
  }

  /* =======================================================
     Init
     ======================================================= */
  document.addEventListener('DOMContentLoaded', () => {
    initSignupForm('hero-form', 'hero-form-status');
    initSignupForm('beta-form', 'beta-form-status');
    initNavToggle();
    initScrollReveal();
    initPhoneMock();
    initGestureDemo();
  });
})();
