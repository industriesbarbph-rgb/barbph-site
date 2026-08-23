(() => {
  'use strict';
  const topbar = document.querySelector('[data-ticker-topbar]');
  const handle = document.querySelector('[data-satellite-handle]');
  const drawer = document.getElementById('barb-satellite-drawer');
  if (!topbar || !handle || !drawer) return;

  const ee = document.querySelector('.folder-tab--mystery');
  if (ee && ee.parentElement === handle.parentElement) ee.insertAdjacentElement('afterend', handle);

  const surface = handle.querySelector('.folder-tab__surface');
  if (surface) {
    surface.innerHTML = '<img class="satellite-tab-art" src="/satellite-tab.png" alt="" aria-hidden="true" decoding="async">';
  }

  const rows = {
    yesterday: drawer.querySelector('[data-sat-day="yesterday"]'),
    today: drawer.querySelector('[data-sat-day="today"]'),
    tomorrow: drawer.querySelector('[data-sat-day="tomorrow"]')
  };
  const publication = drawer.querySelector('[data-sat-publication]');
  const status = drawer.querySelector('[data-sat-status]');
  let timer = null;

  const sourceEl = row => row?.querySelector('.satellite-reel__source');
  const metaEl = row => row?.querySelector('.satellite-reel__meta');

  function renderDay(key, day) {
    const row = rows[key];
    if (!row) return;
    const source = sourceEl(row);
    const meta = metaEl(row);
    if (!day) {
      if (source) source.textContent = 'AWAITING LOG';
      if (meta) meta.textContent = key === 'tomorrow' ? 'SCHEDULE PENDING' : 'NO TRANSMISSION RECORD';
      return;
    }
    const scheduled = day.scheduled || day.scheduled_source || '';
    const served = day.served || day.served_source || '';
    const fallback = Boolean(day.fallback || (scheduled && served && scheduled !== served));
    const visible = key === 'tomorrow' ? scheduled : (served || scheduled);
    if (source) source.textContent = visible || 'AWAITING SIGNAL';
    if (meta) {
      if (fallback) meta.textContent = `ASSIGNED · ${scheduled}  /  FALLBACK ENGAGED`;
      else if (key === 'today' && day.live) meta.textContent = 'LIVE ASSIGNMENT · NOW SERVING';
      else if (key === 'today') meta.textContent = 'TODAY\'S ASSIGNMENT';
      else if (key === 'tomorrow') meta.textContent = 'NEXT ASSIGNMENT';
      else meta.textContent = 'TRANSMISSION LOG';
    }
  }

  async function refresh() {
    if (status) status.textContent = 'SYNCING TRANSMISSION LOG…';
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

  handle.addEventListener('click', () => setOpen(!topbar.classList.contains('is-satellite-open')));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && topbar.classList.contains('is-satellite-open')) setOpen(false);
  });
})();
