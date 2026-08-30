(() => {
  'use strict';

  const styleId = 'barbph-transmission-register-v2';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('link');
    style.id = styleId;
    style.rel = 'stylesheet';
    style.href = '/transmission-register-v2.css?v=20260830-1';
    document.head.appendChild(style);
  }

  const topbar = document.querySelector('[data-ticker-topbar]');
  const handle = document.querySelector('[data-satellite-handle]');
  const drawer = document.getElementById('barb-satellite-drawer');
  if (!topbar || !handle || !drawer) return;

  const ee = document.querySelector('.folder-tab--mystery');
  if (ee && ee.parentElement === handle.parentElement) ee.insertAdjacentElement('afterend', handle);

  const surface = handle.querySelector('.folder-tab__surface');
  if (surface) {
    const satelliteArt = new Image();
    satelliteArt.className = 'satellite-tab-art';
    satelliteArt.alt = '';
    satelliteArt.setAttribute('aria-hidden', 'true');
    satelliteArt.decoding = 'async';
    satelliteArt.onload = () => {
      surface.replaceChildren(satelliteArt);
    };
    satelliteArt.onerror = () => {
      // Keep the inline SVG in the HTML as the guaranteed fallback.
    };
    satelliteArt.src = '/satellite-tab.png?v=a88f57b2';
  }

  const machine = drawer.querySelector('.satellite-machine');
  const headId = drawer.querySelector('.satellite-machine__id');
  const headSignal = drawer.querySelector('.satellite-machine__signal');
  if (machine) machine.classList.add('satellite-machine--physical');
  if (headId) headId.textContent = 'BARBPH TRANSMISSION REGISTER';
  if (headSignal) headSignal.textContent = 'LIVE BROADCAST SYSTEM';

  const rows = {
    yesterday: drawer.querySelector('[data-sat-day="yesterday"]'),
    today: drawer.querySelector('[data-sat-day="today"]'),
    tomorrow: drawer.querySelector('[data-sat-day="tomorrow"]')
  };
  const publication = drawer.querySelector('[data-sat-publication]');
  const status = drawer.querySelector('[data-sat-status]');
  let timer = null;
  let arcCounter = 0;

  if (publication) publication.textContent = 'READ THE BUILD NOTES →';

  if (machine && !machine.querySelector('.satellite-indicators')) {
    const indicators = document.createElement('div');
    indicators.className = 'satellite-indicators';
    indicators.setAttribute('aria-label', 'Transmission status');
    ['SIGNAL', 'LIVE', 'LOCKED'].forEach(label => {
      const item = document.createElement('span');
      item.className = 'satellite-indicator';
      item.textContent = label;
      indicators.appendChild(item);
    });
    publication?.insertAdjacentElement('beforebegin', indicators);
  }

  if (machine && !machine.querySelector('.satellite-serial')) {
    const serial = document.createElement('span');
    serial.className = 'satellite-serial';
    serial.textContent = 'TR-001';
    serial.setAttribute('aria-hidden', 'true');
    machine.appendChild(serial);
  }

  const sourceEl = row => row?.querySelector('.satellite-reel__source');
  const metaEl = row => row?.querySelector('.satellite-reel__meta');

  function renderCurvedSource(source, value) {
    if (!source) return;
    const text = String(value || 'AWAITING SIGNAL').trim().toUpperCase();
    source.dataset.value = text;
    source.dataset.length = text.length > 28 ? 'xlong' : text.length > 18 ? 'long' : 'normal';
    source.setAttribute('aria-label', text);
    source.replaceChildren();

    const ns = 'http://www.w3.org/2000/svg';
    const xlink = 'http://www.w3.org/1999/xlink';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 300 108');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('aria-hidden', 'true');

    const defs = document.createElementNS(ns, 'defs');
    const path = document.createElementNS(ns, 'path');
    const pathId = `satellite-arc-${++arcCounter}`;
    path.setAttribute('id', pathId);
    path.setAttribute('d', 'M 18 82 Q 150 18 282 82');
    defs.appendChild(path);

    const textNode = document.createElementNS(ns, 'text');
    const textPath = document.createElementNS(ns, 'textPath');
    textPath.setAttributeNS(xlink, 'xlink:href', `#${pathId}`);
    textPath.setAttribute('href', `#${pathId}`);
    textPath.setAttribute('startOffset', '50%');
    textPath.setAttribute('text-anchor', 'middle');
    textPath.textContent = text;
    textNode.appendChild(textPath);

    svg.append(defs, textNode);
    source.appendChild(svg);
  }

  function renderDay(key, day) {
    const row = rows[key];
    if (!row) return;
    const source = sourceEl(row);
    const meta = metaEl(row);

    if (!day) {
      renderCurvedSource(source, key === 'tomorrow' ? 'PENDING ASSIGNMENT' : 'AWAITING SIGNAL');
      if (meta) meta.textContent = key === 'tomorrow' ? 'SCHEDULE PENDING' : 'NO TRANSMISSION RECORD';
      return;
    }

    const scheduled = day.scheduled || day.scheduled_source || '';
    const served = day.served || day.served_source || '';
    const fallback = Boolean(day.fallback || (scheduled && served && scheduled !== served));
    const visible = key === 'tomorrow' ? scheduled : (served || scheduled);
    renderCurvedSource(source, visible || 'AWAITING SIGNAL');

    if (meta) {
      if (fallback) meta.textContent = `ASSIGNED · ${scheduled} / FALLBACK ENGAGED`;
      else if (key === 'today' && day.live) meta.textContent = 'LIVE ASSIGNMENT · NOW SERVING';
      else if (key === 'today') meta.textContent = 'TODAY\'S ASSIGNMENT';
      else if (key === 'tomorrow') meta.textContent = 'NEXT ASSIGNMENT';
      else meta.textContent = 'TRANSMISSION LOG';
    }
  }

  Object.entries(rows).forEach(([key, row]) => {
    const source = sourceEl(row);
    if (!source) return;
    renderCurvedSource(source, source.textContent || (key === 'tomorrow' ? 'PENDING ASSIGNMENT' : 'AWAITING SIGNAL'));
  });

  async function refresh() {
    if (status) status.textContent = 'SYNCING TRANSMISSION LOG';
    try {
      const r = await fetch('/.netlify/functions/daily-discover-schedule', { cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      renderDay('yesterday', data.yesterday);
      renderDay('today', data.today);
      renderDay('tomorrow', data.tomorrow);

      if (publication) {
        const url = String(data.publication_url || '').trim();
        if (/^https:\/\//i.test(url) || /^\//.test(url)) {
          publication.href = url;
          publication.removeAttribute('aria-disabled');
          publication.tabIndex = 0;
        } else {
          publication.removeAttribute('href');
          publication.setAttribute('aria-disabled', 'true');
          publication.tabIndex = -1;
        }
      }

      if (status) status.textContent = data.updated_label || `MANILA DATE · ${data.date_manila || ''}`;
    } catch (err) {
      if (status) status.textContent = 'TRANSMISSION LOG TEMPORARILY UNAVAILABLE';
    }
  }

  function closeOtherPanels() {
    const ticker = document.querySelector('[data-barb-ticker]');
    const tickerHandle = document.querySelector('[data-ticker-handle]');
    if (ticker?.classList.contains('is-open') && tickerHandle) tickerHandle.click();
    const connectHandle = document.querySelector('[data-connect-handle]');
    if (topbar.classList.contains('is-connect-open') && connectHandle) connectHandle.click();
  }

  function setOpen(open) {
    if (open) closeOtherPanels();
    topbar.classList.toggle('is-satellite-open', open);
    drawer.classList.toggle('is-open', open);
    handle.classList.toggle('is-active', open);
    handle.setAttribute('aria-expanded', String(open));
    drawer.setAttribute('aria-hidden', String(!open));

    if (open) {
      refresh();
      clearInterval(timer);
      timer = setInterval(refresh, 60000);
    } else {
      clearInterval(timer);
      timer = null;
    }
  }

  handle.addEventListener('click', () => setOpen(!drawer.classList.contains('is-open')));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && drawer.classList.contains('is-open')) setOpen(false);
  });

  drawer.classList.remove('is-open');
  drawer.setAttribute('aria-hidden', 'true');
})();

(() => {
  'use strict';
  if (window.BarbPHWatchtowerInterlude || document.querySelector('script[data-watchtower-interlude-loader]')) return;
  const script = document.createElement('script');
  script.src = '/watchtower-interlude.js?v=20260830-1';
  script.defer = true;
  script.dataset.watchtowerInterludeLoader = 'true';
  document.head.appendChild(script);
})();
