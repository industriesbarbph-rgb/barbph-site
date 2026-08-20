(() => {
  const root = document.querySelector('[data-barb-ticker]');
  if (!root) return;

  const panel = root.querySelector('[data-ticker-panel]');
  const handle = root.querySelector('[data-ticker-handle]');
  if (!panel || !handle) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const state = { open:false, dragging:false, pointerId:null, startY:0, lastY:0, handleStartTop:0 };

  const viewportHeight = () => Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0, 1);
  const panelHeight = () => Math.max(1, panel.getBoundingClientRect().height || viewportHeight() * .48);
  const openThreshold = () => Math.min(110, Math.max(62, panelHeight() * .22));
  const firstPanelFocusable = () => panel.querySelector('input:not([disabled]),button:not([disabled]),a[href],select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])');

  function emit(name) {
    root.dispatchEvent(new CustomEvent(name,{bubbles:true}));
  }

  function setPanelAccessibility(open) {
    panel.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) {
      panel.removeAttribute('inert');
      try { panel.inert = false; } catch {}
    } else {
      panel.setAttribute('inert','');
      try { panel.inert = true; } catch {}
    }
  }

  function setPanelDrag(px) {
    const h = panelHeight();
    if (state.open) {
      const clamped = Math.max(-h, Math.min(0, px));
      panel.style.transform = `translate3d(0, ${clamped}px, 0)`;
      handle.style.top = `${Math.max(8, h + clamped - 27)}px`;
    } else {
      const clamped = Math.max(0, Math.min(h, px));
      panel.style.transform = `translate3d(0, calc(-100% + ${clamped}px), 0)`;
      handle.style.top = `${state.handleStartTop + clamped}px`;
    }
  }

  function clearPanelDrag() {
    panel.style.transform = '';
    handle.style.top = '';
  }

  function openTicker({focus=false,focusPanel=false}={}) {
    if (state.open) {
      if (focusPanel) firstPanelFocusable()?.focus({preventScroll:true});
      return;
    }
    state.open = true;
    clearPanelDrag();
    root.classList.add('is-open');
    root.classList.remove('is-dragging');
    handle.setAttribute('aria-expanded','true');
    handle.setAttribute('aria-label','Close BarbPH ticker');
    setPanelAccessibility(true);
    document.body.classList.add('barb-ticker-lock');
    if (focusPanel) requestAnimationFrame(() => firstPanelFocusable()?.focus({preventScroll:true}));
    else if (focus) handle.focus({preventScroll:true});
    emit('barb:ticker-open');
  }

  function closeTicker({focus=false}={}) {
    if (!state.open && !root.classList.contains('is-open')) return;
    const focusWasInside = panel.contains(document.activeElement);
    state.open = false;
    clearPanelDrag();
    root.classList.remove('is-open','is-dragging');
    handle.setAttribute('aria-expanded','false');
    handle.setAttribute('aria-label','Open BarbPH ticker');
    setPanelAccessibility(false);
    document.body.classList.remove('barb-ticker-lock');
    if (focus || focusWasInside) handle.focus({preventScroll:true});
    emit('barb:ticker-close');
  }

  function toggleTicker() { state.open ? closeTicker() : openTicker(); }

  function beginDrag(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    state.dragging = true;
    state.pointerId = event.pointerId;
    state.startY = event.clientY;
    state.lastY = event.clientY;
    state.handleStartTop = parseFloat(getComputedStyle(handle).top) || 16;
    root.classList.add('is-dragging');
    handle.setPointerCapture?.(event.pointerId);
  }

  function moveDrag(event) {
    if (!state.dragging || event.pointerId !== state.pointerId) return;
    state.lastY = event.clientY;
    const delta = event.clientY - state.startY;
    setPanelDrag(state.open ? Math.min(0,delta) : Math.max(0,delta));
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

    if (!state.open && delta >= openThreshold()) openTicker();
    else if (state.open && delta <= -openThreshold() * .7) closeTicker();
  }

  function cancelDrag(event) {
    if (!state.dragging || (event && event.pointerId !== state.pointerId)) return;
    state.dragging = false;
    state.pointerId = null;
    root.classList.remove('is-dragging');
    clearPanelDrag();
  }

  handle.addEventListener('pointerdown',beginDrag);
  handle.addEventListener('pointermove',moveDrag);
  handle.addEventListener('pointerup',finishDrag);
  handle.addEventListener('pointercancel',cancelDrag);
  window.addEventListener('blur',() => cancelDrag());
  window.addEventListener('resize',() => cancelDrag(),{passive:true});

  handle.addEventListener('keydown',(event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (state.open) closeTicker({focus:true});
      else openTicker({focusPanel:true});
    }
  });

  document.addEventListener('keydown',(event) => {
    if (event.key === 'Escape' && state.open) {
      event.preventDefault();
      closeTicker({focus:true});
    }
  });

  function initCrossfade(container) {
    const items = Array.from(container.querySelectorAll('[data-crossfade-item]'));
    if (!items.length) return;
    let index = Math.max(0,items.findIndex(item => item.classList.contains('is-active')));
    items.forEach((item,i) => {
      item.classList.toggle('is-active',i === index);
      item.setAttribute('aria-hidden', i === index ? 'false' : 'true');
    });
    if (items.length < 2 || reduceMotion.matches) return;
    window.setInterval(() => {
      items[index].classList.remove('is-active');
      items[index].setAttribute('aria-hidden','true');
      index = (index + 1) % items.length;
      items[index].classList.add('is-active');
      items[index].setAttribute('aria-hidden','false');
    },6200);
  }

  setPanelAccessibility(false);
  root.querySelectorAll('[data-crossfade]').forEach(initCrossfade);
  window.addEventListener('pagehide',() => document.body.classList.remove('barb-ticker-lock'),{once:true});

  window.BarbTickerBones = Object.freeze({
    open:() => openTicker(),
    close:() => closeTicker(),
    toggle:() => toggleTicker(),
    get isOpen(){ return state.open; }
  });
})();
