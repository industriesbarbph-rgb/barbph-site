(() => {
  'use strict';
  if (window.BarbPHContinuousSource) return;

  const ENDPOINT = '/.netlify/functions/daily-stream';
  const PRIORITY = '/.netlify/functions/homepage-priority';
  const world = document.querySelector('.world');
  if (!world) return;

  let enabled = false;
  let generation = null;
  let source = '';
  let served = '';
  let nodes = [];
  let index = 0;
  let rotateTimer = null;
  let fetchTimer = null;
  let fetching = false;
  let currentImage = '';
  let watchtowerWasActive = false;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  function clearTimer(ref) { if (ref) clearTimeout(ref); }
  function scheduleFetch(ms = 30000, resync = false) {
    clearTimer(fetchTimer);
    fetchTimer = setTimeout(() => refresh({ resync }), Math.max(5000, ms));
  }
  function safeMs(data, fallback = 30000) {
    const next = Date.parse(data?.stream?.next_retry_at || '');
    if (Number.isFinite(next)) return Math.max(5000, Math.min(300000, next - Date.now() + 1000));
    return fallback;
  }
  function preload(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }
  function makeNode(asset) {
    const node = document.createElement('div');
    node.className = 'world__asset';
    node.dataset.continuousSourceAsset = 'true';
    node.dataset.assetId = String(asset.id || '');
    node.dataset.source = served || source;
    node.style.backgroundImage = `url("${String(asset.image).replace(/"/g, '%22')}")`;
    world.appendChild(node);
    return node;
  }
  function removeOldContinuousNodes() {
    world.querySelectorAll('[data-continuous-source-asset="true"]').forEach(n => n.remove());
  }
  function activate(i) {
    if (!nodes.length || !nodes[i]) return;
    nodes.forEach((n, j) => n.classList.toggle('is-active', j === i));
    index = i;
    const asset = nodes[i];
    currentImage = asset.style.backgroundImage || currentImage;
  }
  function nextDelay(data) {
    return Math.max(8000, Number(data?.daily_settings?.rotation_seconds || 18) * 1000);
  }
  function runBatch(data) {
    clearTimer(rotateTimer);
    if (reduce || nodes.length <= 1) {
      activate(0);
      scheduleFetch(Math.min(60000, Math.max(15000, Number(data?.daily_settings?.refresh_seconds || 600) * 1000)));
      return;
    }
    const delay = nextDelay(data);
    const tick = () => {
      if (!nodes.length) return;
      if (index >= nodes.length - 1) {
        activate(nodes.length - 1);
        scheduleFetch(8000);
        return;
      }
      activate(index + 1);
      if (index >= nodes.length - 4) refresh().catch(() => {});
      rotateTimer = setTimeout(tick, delay);
    };
    rotateTimer = setTimeout(tick, delay);
  }
  async function render(data) {
    const assets = Array.isArray(data?.assets) ? data.assets.filter(a => /^https:\/\//i.test(a?.image || '')) : [];
    if (!assets.length) throw new Error('Continuous source returned no usable assets');

    source = String(data.scheduled_source || source || '');
    served = String(data.served_source || source || '');

    if (data?.stream?.hold_last_asset && currentImage) {
      scheduleFetch(safeMs(data));
      return;
    }

    const newGeneration = data?.stream?.generation ?? null;
    if (generation !== null && newGeneration === generation && nodes.length) {
      scheduleFetch(Math.min(30000, safeMs(data, 30000)));
      return;
    }

    const usable = [];
    for (const asset of assets) {
      if (await preload(asset.image)) usable.push(asset);
      if (usable.length >= 60) break;
    }
    if (!usable.length) throw new Error('Continuous source images failed preload');

    clearTimer(rotateTimer);
    removeOldContinuousNodes();
    nodes = usable.map(makeNode);
    generation = newGeneration;
    index = 0;
    activate(0);
    runBatch(data);
  }
  async function refresh({ resync = false } = {}) {
    if (!enabled || fetching) return;
    fetching = true;
    try {
      const url = resync ? `${ENDPOINT}?resync=1` : ENDPOINT;
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) throw new Error(`Daily stream HTTP ${r.status}`);
      const data = await r.json();
      await render(data);
    } catch (error) {
      console.warn('BarbPH continuous source:', error);
      scheduleFetch(30000);
    } finally {
      fetching = false;
    }
  }
  async function boot() {
    try {
      const r = await fetch(PRIORITY, { cache: 'no-store' });
      if (!r.ok) return;
      const priority = await r.json();
      if (priority?.selected_mode !== 'daily_discover') return;
      enabled = true;
      await refresh();
    } catch (error) {
      console.warn('BarbPH continuous source boot:', error);
    }
  }
  function observeWatchtower() {
    const attach = overlay => {
      watchtowerWasActive = overlay.classList.contains('is-active');
      const observer = new MutationObserver(() => {
        const active = overlay.classList.contains('is-active');
        if (watchtowerWasActive && !active && enabled) refresh({ resync: true });
        watchtowerWasActive = active;
      });
      observer.observe(overlay, { attributes: true, attributeFilter: ['class'] });
    };
    const existing = document.getElementById('barbph-watchtower-interlude');
    if (existing) return attach(existing);
    const bodyObserver = new MutationObserver(() => {
      const overlay = document.getElementById('barbph-watchtower-interlude');
      if (!overlay) return;
      bodyObserver.disconnect();
      attach(overlay);
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });
  }

  window.BarbPHContinuousSource = Object.freeze({ refresh: () => refresh({ resync: true }), endpoint: ENDPOINT });
  observeWatchtower();
  boot();
})();
