(() => {
  const root = document.querySelector('[data-barb-ticker]');
  if (!root) return;

  const panel = root.querySelector('[data-ticker-panel]');
  const handle = root.querySelector('[data-ticker-handle]');
  if (!panel || !handle) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const state = {
    open: false,
    dragging: false,
    pointerId: null,
    startY: 0,
    lastY: 0
  };

  const viewportHeight = () => Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0, 1);
  const openThreshold = () => Math.min(150, Math.max(86, viewportHeight() * 0.14));

  function emit(name) {
    root.dispatchEvent(new CustomEvent(name, { bubbles: true }));
  }

  function setPanelDrag(px) {
    const h = viewportHeight();
    if (state.open) {
      const clamped = Math.max(-h, Math.min(0, px));
      panel.style.transform = `translate3d(0, ${clamped}px, 0)`;
    } else {
      const clamped = Math.max(0, Math.min(h, px));
      panel.style.transform = `translate3d(0, calc(-100% + ${clamped}px), 0)`;
    }
  }

  function clearPanelDrag() {
    panel.style.transform = '';
  }

  function openTicker({ focus = false } = {}) {
    if (state.open) return;
    state.open = true;
    clearPanelDrag();
    root.classList.add('is-open');
    root.classList.remove('is-dragging');
    handle.setAttribute('aria-expanded', 'true');
    handle.setAttribute('aria-label', 'Close BarbPH ticker');
    panel.setAttribute('aria-hidden', 'false');
    document.body.classList.add('barb-ticker-lock');
    if (focus) handle.focus({ preventScroll: true });
    emit('barb:ticker-open');
  }

  function closeTicker({ focus = false } = {}) {
    if (!state.open && !root.classList.contains('is-open')) return;
    state.open = false;
    clearPanelDrag();
    root.classList.remove('is-open', 'is-dragging');
    handle.setAttribute('aria-expanded', 'false');
    handle.setAttribute('aria-label', 'Open BarbPH ticker');
    panel.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('barb-ticker-lock');
    if (focus) handle.focus({ preventScroll: true });
    emit('barb:ticker-close');
  }

  function toggleTicker() {
    state.open ? closeTicker() : openTicker();
  }

  function beginDrag(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    state.dragging = true;
    state.pointerId = event.pointerId;
    state.startY = event.clientY;
    state.lastY = event.clientY;
    root.classList.add('is-dragging');
    handle.setPointerCapture?.(event.pointerId);
  }

  function moveDrag(event) {
    if (!state.dragging || event.pointerId !== state.pointerId) return;
    state.lastY = event.clientY;
    const delta = event.clientY - state.startY;

    if (state.open) {
      setPanelDrag(Math.min(0, delta));
    } else {
      setPanelDrag(Math.max(0, delta));
    }
  }

  function finishDrag(event) {
    if (!state.dragging || event.pointerId !== state.pointerId) return;
    const delta = state.lastY - state.startY;
    const meaningfulDrag = Math.abs(delta) >= 8;

    state.dragging = false;
    state.pointerId = null;
    root.classList.remove('is-dragging');
    clearPanelDrag();

    if (!meaningfulDrag) {
      toggleTicker();
      return;
    }

    if (!state.open && delta >= openThreshold()) {
      openTicker();
    } else if (state.open && delta <= -openThreshold() * 0.7) {
      closeTicker();
    } else {
      state.open ? openTicker() : closeTicker();
    }
  }

  function cancelDrag(event) {
    if (!state.dragging || event.pointerId !== state.pointerId) return;
    state.dragging = false;
    state.pointerId = null;
    root.classList.remove('is-dragging');
    clearPanelDrag();
  }

  handle.addEventListener('pointerdown', beginDrag);
  handle.addEventListener('pointermove', moveDrag);
  handle.addEventListener('pointerup', finishDrag);
  handle.addEventListener('pointercancel', cancelDrag);

  handle.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleTicker();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state.open) {
      event.preventDefault();
      closeTicker({ focus: true });
    }
  });

  function initCrossfade(container) {
    const items = Array.from(container.querySelectorAll('[data-crossfade-item]'));
    if (!items.length) return;

    let index = Math.max(0, items.findIndex((item) => item.classList.contains('is-active')));
    items.forEach((item, i) => item.classList.toggle('is-active', i === index));

    if (items.length < 2 || reduceMotion.matches) return;
    window.setInterval(() => {
      items[index].classList.remove('is-active');
      index = (index + 1) % items.length;
      items[index].classList.add('is-active');
    }, 6200);
  }

  root.querySelectorAll('[data-crossfade]').forEach(initCrossfade);

  function syncEmptyZones() {
    root.querySelectorAll('[data-collapse-when-empty]').forEach((zone) => {
      const content = zone.querySelector('[data-zone-content]');
      const hasContent = content && content.children.length > 0;
      zone.classList.toggle('is-empty', !hasContent);
    });
  }

  syncEmptyZones();

  window.BarbTickerBones = Object.freeze({
    open: () => openTicker(),
    close: () => closeTicker(),
    toggle: () => toggleTicker(),
    syncEmptyZones,
    get isOpen() { return state.open; }
  });
})();
