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
  const safeFocus = element => {
    if (!element) return;
    try { element.focus({preventScroll:true}); }
    catch { try { element.focus(); } catch {} }
  };

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
      if (focusPanel) safeFocus(firstPanelFocusable());
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
    if (focusPanel) requestAnimationFrame(() => safeFocus(firstPanelFocusable()));
    else if (focus) safeFocus(handle);
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
    if (focus || focusWasInside) safeFocus(handle);
    emit('barb:ticker-close');
  }

  function toggleTicker() { state.open ? closeTicker() : openTicker(); }

  function releasePointerCapture() {
    if (state.pointerId == null) return;
    try {
      if (handle.hasPointerCapture?.(state.pointerId)) handle.releasePointerCapture(state.pointerId);
    } catch {}
  }

  function beginDrag(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    state.dragging = true;
    state.pointerId = event.pointerId;
    state.startY = event.clientY;
    state.lastY = event.clientY;
    state.handleStartTop = parseFloat(getComputedStyle(handle).top) || 16;
    root.classList.add('is-dragging');
    try { handle.setPointerCapture?.(event.pointerId); } catch {}
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

    releasePointerCapture();
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
    if (!state.dragging || (event && event.pointerId != null && event.pointerId !== state.pointerId)) return;
    releasePointerCapture();
    state.dragging = false;
    state.pointerId = null;
    root.classList.remove('is-dragging');
    clearPanelDrag();
  }

  handle.addEventListener('pointerdown',beginDrag);
  handle.addEventListener('pointermove',moveDrag);
  handle.addEventListener('pointerup',finishDrag);
  handle.addEventListener('pointercancel',cancelDrag);
  handle.addEventListener('lostpointercapture',event => {
    if (state.dragging && event.pointerId === state.pointerId) cancelDrag(event);
  });
  window.addEventListener('blur',() => cancelDrag());
  window.addEventListener('resize',() => cancelDrag(),{passive:true});
  window.addEventListener('orientationchange',() => cancelDrag(),{passive:true});
  document.addEventListener('visibilitychange',() => { if (document.hidden) cancelDrag(); });

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
  window.addEventListener('pagehide',() => {
    cancelDrag();
    document.body.classList.remove('barb-ticker-lock');
  },{once:true});

  window.BarbTickerBones = Object.freeze({
    open:() => openTicker(),
    close:() => closeTicker(),
    toggle:() => toggleTicker(),
    get isOpen(){ return state.open; }
  });
})();

/* BarbPH production visual correction pass — 2026-08-22 */
(() => {
  'use strict';

  const style=document.createElement('style');
  style.id='barbph-production-v2';
  style.textContent=`
    .fab{--fab-size:88px!important}
    .fab__orb{appearance:none!important;padding:0!important;border:0!important;outline:0!important;border-radius:52% 48% 55% 45% / 47% 54% 46% 53%!important;background:radial-gradient(ellipse at 29% 22%,rgba(255,255,255,.98) 0 6%,rgba(255,255,255,.60) 12%,rgba(255,255,255,0) 29%),radial-gradient(ellipse at 70% 77%,rgba(195,207,211,.38) 0 15%,rgba(195,207,211,0) 47%),radial-gradient(ellipse at 35% 70%,rgba(232,211,219,.30) 0 14%,rgba(232,211,219,0) 43%),radial-gradient(circle at 50% 48%,rgba(255,255,255,.50) 0,rgba(247,244,236,.24) 46%,rgba(219,223,221,.22) 74%,rgba(255,255,255,.34) 100%)!important;box-shadow:inset 10px 11px 23px rgba(255,255,255,.72),inset -13px -15px 26px rgba(104,116,122,.10),0 17px 36px rgba(44,38,31,.13),0 2px 9px rgba(255,255,255,.70)!important;backdrop-filter:blur(23px) saturate(116%)!important;-webkit-backdrop-filter:blur(23px) saturate(116%)!important;overflow:hidden!important;animation:fabLifeV2 6.2s ease-in-out infinite!important;transition:transform .3s cubic-bezier(.2,.8,.2,1),box-shadow .3s ease,filter .3s ease!important}
    .fab__orb::before{content:""!important;position:absolute!important;width:78%!important;height:30%!important;left:-19%!important;top:7%!important;border:0!important;border-radius:50%!important;background:linear-gradient(92deg,transparent 4%,rgba(255,255,255,.22) 26%,rgba(255,255,255,.82) 49%,rgba(255,255,255,.18) 72%,transparent 96%)!important;filter:blur(5px)!important;opacity:.60!important;transform:rotate(-29deg) translateX(-10px)!important;animation:fabCausticV2 8.4s ease-in-out infinite alternate!important;pointer-events:none!important}
    .fab__orb::after{content:""!important;position:absolute!important;inset:auto -16% -12% auto!important;width:65%!important;height:61%!important;border:0!important;border-radius:55% 45% 52% 48% / 46% 58% 42% 54%!important;background:radial-gradient(circle at 34% 30%,rgba(255,255,255,.34),rgba(186,202,205,.19) 45%,rgba(255,255,255,0) 74%)!important;box-shadow:none!important;filter:blur(7px)!important;opacity:.76!important;animation:fabInnerDriftV2 7.2s ease-in-out infinite alternate!important;pointer-events:none!important}
    .fab__orb:hover,.fab__orb:focus-visible{outline:none!important;transform:translateY(-3px) scale(1.035)!important;filter:saturate(1.04)!important;box-shadow:inset 11px 12px 25px rgba(255,255,255,.78),inset -13px -14px 26px rgba(104,116,122,.09),0 21px 42px rgba(44,38,31,.17),0 3px 13px rgba(255,255,255,.74)!important}
    .fab.is-open .fab__orb{transform:scale(.93)!important;filter:saturate(.96)!important}
    .fab__word{font-size:clamp(21px,1.72vw,25px)!important;min-height:52px!important;background:transparent!important;border:0!important}.fab__word:nth-child(1){--tx:-126px!important;--ty:-140px!important}.fab__word:nth-child(2){--tx:-177px!important;--ty:-78px!important}.fab__word:nth-child(3){--tx:-155px!important;--ty:-17px!important}
    @keyframes fabLifeV2{0%,100%{transform:scale(.992) rotate(-.2deg);border-radius:52% 48% 55% 45% / 47% 54% 46% 53%}48%{transform:scale(1.018) rotate(.35deg);border-radius:48% 52% 46% 54% / 54% 47% 53% 46%}}
    @keyframes fabCausticV2{0%{transform:rotate(-29deg) translateX(-12px);opacity:.42}100%{transform:rotate(-22deg) translateX(30px);opacity:.72}}
    @keyframes fabInnerDriftV2{0%{transform:translate(-3px,2px) scale(.94) rotate(-4deg)}100%{transform:translate(5px,-4px) scale(1.06) rotate(5deg)}}

    .noen-hq{--hq-w:396px!important;left:0!important;bottom:0!important;width:var(--hq-w)!important;height:202px!important;overflow:visible!important;margin:0!important}.noen-hq__label{display:none!important}.noen-hq__scene{left:0!important;right:0!important;bottom:-8px!important;height:202px!important;overflow:visible!important}.noen-hq svg{width:100%!important;height:100%!important;overflow:visible!important}
    .hq-back{fill:#2b3135!important;opacity:.24!important}.hq-mid{fill:#171d21!important;opacity:.56!important}.hq-front{fill:#080c0f!important;opacity:.97!important}.hq-antenna{stroke:#090d10!important;stroke-width:2.1!important;fill:none!important;stroke-linecap:round!important;stroke-linejoin:round!important}.hq-antenna-fine{stroke:#0b1014!important;stroke-width:1.05!important;fill:none!important;stroke-linecap:round!important;stroke-linejoin:round!important}.hq-wire{stroke:#0d1216!important;stroke-width:.62!important;fill:none!important;opacity:.56!important}.hq-dish,.hq-panel{fill:#090d10!important}.hq-slit{fill:#151c21!important;opacity:.78!important}
    .hq-led{fill:#c5cace!important;opacity:.26!important;filter:drop-shadow(0 0 .55px rgba(209,214,217,.25))!important;transform-box:fill-box!important;transform-origin:center!important}.hq-led.steady{opacity:.44!important}.hq-led.pulse{animation:hqLedPulseV2 4.8s ease-in-out infinite!important}.hq-led.tx{animation:hqLedTxV2 3.9s steps(2,end) infinite!important}.hq-led.tx2{animation:hqLedTxV2 5.2s steps(2,end) infinite .8s!important}.noen-hq[data-state="standby"] .hq-led.tx,.noen-hq[data-state="standby"] .hq-led.tx2{animation-play-state:paused!important;opacity:.16!important}.noen-hq[data-state="waking"] .hq-led{animation-duration:2.1s!important}.noen-hq[data-state="patrolling"] .hq-led.tx{animation-duration:1.7s!important}.noen-hq[data-state="patrolling"] .hq-led.tx2{animation-duration:2.1s!important}.noen-hq[data-state="verifying"] .hq-led.pulse{animation-duration:1.55s!important}.noen-hq[data-state="offline"] .hq-led{animation:none!important;opacity:.07!important}.noen-hq[data-state="offline"] .hq-led.safety{opacity:.26!important;animation:hqLedPulseV2 6.5s ease-in-out infinite!important}
    @keyframes hqLedPulseV2{0%,100%{opacity:.16;transform:scale(.9)}50%{opacity:.48;transform:scale(1.05)}}@keyframes hqLedTxV2{0%,68%,100%{opacity:.12}70%,79%{opacity:.46}81%{opacity:.15}}

    .behind-link,.builds,.b-anchor{overflow:visible!important}.celestial{z-index:20!important;opacity:1!important;visibility:visible!important;overflow:visible!important}.celestial img{display:block!important;opacity:1!important;visibility:visible!important;object-fit:contain!important;filter:drop-shadow(0 8px 10px rgba(0,0,0,.30))!important}.celestial__sun{width:clamp(56px,6.2vw,88px)!important;left:clamp(-49px,-4.6vw,-35px)!important;top:clamp(-68px,-6.1vw,-49px)!important}.celestial__s1{width:clamp(25px,2.9vw,40px)!important;left:clamp(22px,2.2vw,31px)!important;top:clamp(-78px,-7vw,-57px)!important;transform:rotate(8deg)!important}.celestial__s2{width:clamp(22px,2.5vw,35px)!important;left:clamp(-59px,-5.4vw,-42px)!important;top:clamp(-10px,-.8vw,-4px)!important;transform:rotate(-10deg)!important}.celestial__s3{width:clamp(19px,2.1vw,30px)!important;left:clamp(42px,4vw,56px)!important;top:clamp(-47px,-4vw,-32px)!important;transform:rotate(18deg)!important}
    @media(max-width:720px){.fab{--fab-size:75px!important}.fab__word{font-size:19px!important;min-height:46px!important}.fab__word:nth-child(1){--tx:-86px!important;--ty:-119px!important}.fab__word:nth-child(2){--tx:-128px!important;--ty:-66px!important}.fab__word:nth-child(3){--tx:-110px!important;--ty:-14px!important}.noen-hq{--hq-w:264px!important;height:144px!important}.noen-hq__scene{height:144px!important;bottom:-6px!important}.celestial__sun{width:clamp(49px,13vw,65px)!important;left:-35px!important;top:-50px!important}.celestial__s1{width:27px!important;left:20px!important;top:-57px!important}.celestial__s2{width:24px!important;left:-42px!important;top:-4px!important}.celestial__s3{width:21px!important;left:34px!important;top:-33px!important}}
    @media(max-width:420px){.noen-hq{--hq-w:232px!important;height:130px!important}.noen-hq__scene{height:130px!important;bottom:-5px!important}.fab__word:nth-child(1){--tx:-64px!important;--ty:-116px!important}.fab__word:nth-child(2){--tx:-101px!important;--ty:-64px!important}.fab__word:nth-child(3){--tx:-89px!important;--ty:-14px!important}}
    @media(prefers-reduced-motion:reduce){.fab__orb,.fab__orb::before,.fab__orb::after,.hq-led{animation:none!important}.hq-layer{transform:none!important}}
  `;
  document.head.appendChild(style);

  const partnership=[...document.querySelectorAll('.fab__word')].find(a=>a.textContent.trim()==='Partnership');
  if(partnership){partnership.href='/partnership.html';partnership.removeAttribute('aria-disabled');partnership.setAttribute('tabindex','-1');}

  const scene=document.querySelector('.noen-hq__scene');
  if(scene){
    scene.innerHTML=`<svg viewBox="0 0 440 210" role="img" aria-label="">
      <g class="hq-layer hq-back"><path d="M0 166 H78 L91 153 H151 L163 166 H213 V210 H0 Z"/><path d="M272 169 H329 L340 158 H407 L420 169 H440 V210 H272 Z"/><rect x="185" y="177" width="64" height="33"/></g>
      <g class="hq-layer hq-mid"><path d="M20 158 H116 L130 145 H169 L181 158 V210 H20 Z"/><path d="M286 151 H363 L376 139 H420 V210 H286 Z"/><rect x="77" y="137" width="53" height="73"/><rect x="319" y="132" width="47" height="78"/></g>
      <g class="hq-layer hq-front"><path d="M69 161 L92 143 H151 L166 152 H278 L294 142 H346 L373 161 V210 H69 Z"/><path d="M145 151 L160 135 H279 L294 151 V210 H145 Z"/><rect x="185" y="121" width="68" height="89"/><path d="M193 121 L204 110 H234 L245 121 Z"/><rect class="hq-slit" x="103" y="172" width="44" height="5" rx="1"/><rect class="hq-slit" x="300" y="171" width="38" height="5" rx="1"/><rect class="hq-slit" x="166" y="158" width="33" height="5" rx="1"/><rect class="hq-slit" x="239" y="158" width="33" height="5" rx="1"/></g>
      <g class="hq-layer hq-front"><path class="hq-antenna" d="M78 143 L96 43 L114 143"/><path class="hq-antenna-fine" d="M83 116 H109 M87 92 H105 M91 68 H101 M84 116 L108 92 M109 116 L87 92 M88 92 L104 68 M105 92 L91 68"/><path class="hq-antenna" d="M96 43 V22 M88 35 H104 M91 28 H101"/><path class="hq-wire" d="M95 49 L57 143 M97 49 L137 143"/><path class="hq-dish" d="M74 66 Q95 45 116 66 Q96 78 74 66 Z"/><rect class="hq-panel" x="70" y="80" width="9" height="18" rx="1" transform="rotate(-8 74 89)"/></g>
      <g class="hq-layer hq-front"><path class="hq-antenna" d="M219 121 V25 M211 105 H227 M209 87 H229 M207 69 H231 M212 49 H226"/><path class="hq-antenna-fine" d="M211 105 L227 87 M227 105 L209 87 M209 87 L231 69 M229 87 L207 69 M207 69 L226 49 M231 69 L212 49"/><path class="hq-wire" d="M218 36 L170 143 M220 36 L269 143"/><path class="hq-dish" d="M188 48 Q219 22 250 48 Q221 64 188 48 Z"/><rect x="217.3" y="9" width="3.4" height="20"/><path class="hq-antenna-fine" d="M206 17 H232 M211 13 H227"/></g>
      <g class="hq-layer hq-front"><path class="hq-antenna" d="M341 139 V39 M332 139 L341 39 L350 139"/><path class="hq-antenna-fine" d="M335 111 H347 M333 87 H349 M336 63 H346 M335 111 L349 87 M347 111 L333 87 M333 87 L346 63 M349 87 L336 63"/><rect class="hq-panel" x="350" y="52" width="17" height="27" rx="1" transform="rotate(7 358 65)"/><rect class="hq-panel" x="316" y="73" width="15" height="23" rx="1" transform="rotate(-8 323 84)"/><path class="hq-wire" d="M341 47 L296 143 M342 47 L389 143"/></g>
      <g><circle class="hq-led steady safety" cx="219" cy="8" r=".72"/><circle class="hq-led pulse" cx="96" cy="21" r=".62"/><circle class="hq-led tx" cx="341" cy="38" r=".62"/><circle class="hq-led tx2" cx="358" cy="54" r=".56"/><circle class="hq-led pulse" cx="76" cy="82" r=".56" style="animation-delay:1.2s"/><circle class="hq-led steady" cx="219" cy="94" r=".52"/><circle class="hq-led tx2" cx="197" cy="156" r=".50" style="animation-delay:.5s"/><circle class="hq-led tx" cx="263" cy="156" r=".50" style="animation-delay:1.5s"/></g>
    </svg><span id="noen-hq-root"></span>`;
  }

  const s1=document.querySelector('.celestial__s1');
  const s2=document.querySelector('.celestial__s2');
  const s3=document.querySelector('.celestial__s3');
  if(s1&&s2&&!s2.getAttribute('src')) s2.src=s1.src;
  if(s1&&s3&&!s3.getAttribute('src')) s3.src=s1.src;
})();
