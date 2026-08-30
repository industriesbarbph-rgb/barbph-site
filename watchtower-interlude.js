(() => {
  'use strict';

  if (window.BarbPHWatchtowerInterlude) return;

  const WATCHTOWER_URL = 'https://watchtower.barbph.com/';
  const HOUR_MS = 60 * 60 * 1000;
  const INTERLUDE_MS = 90 * 1000;
  const PRELOAD_MS = 12 * 1000;
  const LOAD_GRACE_MS = 12 * 1000;
  const CHECK_MS = 500;

  const cssId = 'barbph-watchtower-interlude-css';
  if (!document.getElementById(cssId)) {
    const link = document.createElement('link');
    link.id = cssId;
    link.rel = 'stylesheet';
    link.href = '/watchtower-interlude.css?v=20260830-1';
    document.head.appendChild(link);
  }

  const overlay = document.createElement('section');
  overlay.id = 'barbph-watchtower-interlude';
  overlay.className = 'watchtower-interlude';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.setAttribute('aria-label', 'Watchtower live world interlude');
  overlay.innerHTML = `
    <div class="watchtower-interlude__stage">
      <div class="watchtower-interlude__standby" aria-live="polite">
        <span>WATCHTOWER</span>
        <small>LIVE WORLD WINDOW</small>
      </div>
      <div class="watchtower-interlude__frame-host"></div>
    </div>`;
  document.body.appendChild(overlay);

  const host = overlay.querySelector('.watchtower-interlude__frame-host');
  const standby = overlay.querySelector('.watchtower-interlude__standby');

  let frame = null;
  let frameLoaded = false;
  let frameSlot = null;
  let activeSlot = null;
  let failedSlot = null;
  let loadGraceTimer = null;
  let previousBodyOverflow = '';
  let previousHtmlOverflow = '';
  let previousFocus = null;

  function slotStartAt(ms) {
    return Math.floor(ms / HOUR_MS) * HOUR_MS;
  }

  function currentSlot(now = Date.now()) {
    const start = slotStartAt(now);
    const elapsed = now - start;
    if (elapsed >= 0 && elapsed < INTERLUDE_MS) {
      return { start, end: start + INTERLUDE_MS, remaining: INTERLUDE_MS - elapsed };
    }
    return null;
  }

  function nextSlotStart(now = Date.now()) {
    return slotStartAt(now) + HOUR_MS;
  }

  function clearLoadGrace() {
    if (loadGraceTimer) clearTimeout(loadGraceTimer);
    loadGraceTimer = null;
  }

  function unloadFrame() {
    clearLoadGrace();
    if (frame) {
      frame.removeAttribute('src');
      frame.remove();
    }
    frame = null;
    frameLoaded = false;
    frameSlot = null;
    overlay.classList.remove('is-frame-ready');
    if (host) host.replaceChildren();
  }

  function buildFrame(slot) {
    if (frame && frameSlot === slot) return frame;
    unloadFrame();

    frame = document.createElement('iframe');
    frame.className = 'watchtower-interlude__frame';
    frame.title = 'Watchtower live world observation';
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.setAttribute('allowfullscreen', '');
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.src = WATCHTOWER_URL;
    frameSlot = slot;
    frameLoaded = false;

    frame.addEventListener('load', () => {
      frameLoaded = true;
      clearLoadGrace();
      if (activeSlot === slot) overlay.classList.add('is-frame-ready');
    }, { once: true });

    host.appendChild(frame);
    return frame;
  }

  function preload(slot) {
    if (failedSlot === slot || (frame && frameSlot === slot)) return;
    buildFrame(slot);
  }

  function lockPage() {
    previousBodyOverflow = document.body.style.overflow;
    previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }

  function unlockPage() {
    document.body.style.overflow = previousBodyOverflow;
    document.documentElement.style.overflow = previousHtmlOverflow;
  }

  function show(slot) {
    if (failedSlot === slot || activeSlot === slot) return;

    activeSlot = slot;
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    buildFrame(slot);
    lockPage();

    overlay.classList.add('is-active');
    overlay.classList.toggle('is-frame-ready', frameLoaded);
    overlay.setAttribute('aria-hidden', 'false');

    if (standby) standby.setAttribute('aria-label', 'Watchtower is loading');

    clearLoadGrace();
    if (!frameLoaded) {
      loadGraceTimer = setTimeout(() => {
        if (activeSlot !== slot || frameLoaded) return;
        failedSlot = slot;
        hide({ unload: true, restoreFocus: true });
      }, LOAD_GRACE_MS);
    }
  }

  function hide({ unload = true, restoreFocus = false } = {}) {
    if (!activeSlot && !overlay.classList.contains('is-active')) {
      if (unload) unloadFrame();
      return;
    }

    activeSlot = null;
    clearLoadGrace();
    overlay.classList.remove('is-active', 'is-frame-ready');
    overlay.setAttribute('aria-hidden', 'true');
    unlockPage();

    if (unload) unloadFrame();
    if (restoreFocus && previousFocus && document.contains(previousFocus)) {
      previousFocus.focus({ preventScroll: true });
    }
    previousFocus = null;
  }

  function reconcile() {
    const now = Date.now();
    const slot = currentSlot(now);

    if (slot) {
      if (failedSlot !== slot.start) show(slot.start);
      return;
    }

    if (activeSlot !== null) hide({ unload: true, restoreFocus: true });

    const next = nextSlotStart(now);
    const untilNext = next - now;
    if (untilNext <= PRELOAD_MS && untilNext > 0) {
      preload(next);
    } else if (frame && frameSlot !== next) {
      unloadFrame();
    }

    if (failedSlot !== null && failedSlot < slotStartAt(now)) failedSlot = null;
  }

  const interval = setInterval(reconcile, CHECK_MS);
  document.addEventListener('visibilitychange', reconcile);
  window.addEventListener('pageshow', reconcile);

  window.BarbPHWatchtowerInterlude = Object.freeze({
    url: WATCHTOWER_URL,
    intervalMinutes: 60,
    durationSeconds: 90,
    reconcile,
    preview(seconds = 15) {
      const safeSeconds = Math.max(1, Math.min(90, Number(seconds) || 15));
      failedSlot = null;
      const testSlot = Date.now();
      show(testSlot);
      setTimeout(() => {
        if (activeSlot === testSlot) hide({ unload: true, restoreFocus: true });
      }, safeSeconds * 1000);
    },
    stop() {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', reconcile);
      window.removeEventListener('pageshow', reconcile);
      hide({ unload: true, restoreFocus: true });
    }
  });

  reconcile();
})();
