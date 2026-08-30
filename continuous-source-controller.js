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
    fetchTimer = setTimeout(() => refresh({ resync }), Math.max(1000, ms));
  }
  function safeMs(data, fallback = 30000) {
    const retry = Date.parse(data?.stream?.next_retry_at || '');
    if (Number.isFinite(retry)) return Math.max(5000, Math.min(300000, retry - Date.now() + 1000));
    const due = Number(data?.stream?.refresh_due_at || 0);
    if (Number.isFinite(due) && due > 0) return Math.max(1000, Math.min(300000, due - Date.now() + 1000));
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
  function removeDailyAssetNodes() {
    world.querySelectorAll('.world__asset').forEach(n => n.remove());
  }
  function activate(i) {
    if (!nodes.length || !nodes[i]) return;
    nodes.forEach((n, j) => n.classList.toggle('is-active', j === i));
    index = i;
    currentImage = nodes[i].style.backgroundImage || currentImage;
  }
  function nextDelay(data) {
    return Math.max(8000, Number(data?.daily_settings?.rotation_seconds || 18) * 1000);
  }
  function runBatch(data) {
    clearTimer(rotateTimer);
    if (reduce || nodes.length <= 1) {
      activate(0);
      scheduleFetch(safeMs(data, 60000));
      return;
    }
    const delay = nextDelay(data);
    const tick = () => {
      if (!nodes.length) return;
      if (index >= nodes.length - 1) {
        activate(nodes.length - 1);
        scheduleFetch(1000);
        return;
      }
      activate(index + 1);
      rotateTimer = setTimeout(tick, delay);
    };
    rotateTimer = setTimeout(tick, delay);
  }
  async function render(data, { resync = false } = {}) {
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
      if (resync && nodes.length > 1) activate((index + 1) % nodes.length);
      scheduleFetch(safeMs(data, 30000));
      return;
    }

    const usable = [];
    for (const asset of assets) {
      if (await preload(asset.image)) usable.push(asset);
      if (usable.length >= 60) break;
    }
    if (!usable.length) throw new Error('Continuous source images failed preload');

    clearTimer(rotateTimer);
    removeDailyAssetNodes();
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
      const r = await fetch(url);
      if (!r.ok) throw new Error(`Daily stream HTTP ${r.status}`);
      const data = await r.json();
      await render(data, { resync });
    } catch (error) {
      console.warn('BarbPH continuous source:', error);
      scheduleFetch(30000);
    } finally {
      fetching = false;
    }
  }
  async function boot() {
    try {
      const r = await fetch(PRIORITY);
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
