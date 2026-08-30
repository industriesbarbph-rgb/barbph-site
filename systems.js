(() => {
  'use strict';

  const endpoint = '/.netlify/functions/systems-public';
  const storageKey = 'barbph_systems_last_visit';
  const launchYear = 2026;
  const state = {
    range: 'today',
    date: manilaDate(),
    data: null,
    allYear: Number(manilaDate().slice(0, 4)),
    allLoading: false,
    allDone: false,
    allEvents: [],
    allSources: []
  };

  const $ = sel => document.querySelector(sel);
  const $$ = sel => [...document.querySelectorAll(sel)];
  const eventsEl = $('[data-events]');
  const dateInput = $('[data-ledger-date]');
  const sourcesEl = $('[data-systems-sources]');
  const returnPanel = $('[data-return-panel]');
  const lastVisitEl = $('[data-last-visit]');
  const newCountEl = $('[data-new-count]');
  const away = $('[data-away]');
  const awayCopy = $('[data-away-copy]');

  function manilaDate(date = new Date()) {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(date);
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }

  function fmtTime(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).format(date);
  }

  function eventDate(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return manilaDate(date);
  }

  function fmtDay(dateString) {
    const date = new Date(`${dateString}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }).format(date).toUpperCase();
  }

  function fmtVisit(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return 'FIRST VISIT';
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    }).format(date).toUpperCase();
  }

  function fmtGenerated(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return 'SYNCED';
    return `SYNCED ${fmtVisit(iso)}`;
  }

  function cell(label, value, cls = '') {
    return `<div class="${cls}"><span class="systems-event__cell-label">${esc(label)}</span><span>${esc(value)}</span></div>`;
  }

  function uniqueEvents(events) {
    const seen = new Set();
    return (events || []).filter(event => {
      const key = event.id || `${event.at}|${event.type}|${event.system}|${event.happened}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => String(b.at).localeCompare(String(a.at)));
  }

  function renderEvents(events, { append = false } = {}) {
    const rows = uniqueEvents(events);
    if (!rows.length && !append) {
      eventsEl.innerHTML = '<div class="systems-empty">NO RECORDED SYSTEM EVENTS FOR THIS PERIOD.</div>';
      return;
    }

    let lastDate = '';
    const html = rows.map(event => {
      const day = event.date_manila || eventDate(event.at);
      const divider = day && day !== lastDate
        ? `<div class="systems-date-divider" data-ledger-day="${esc(day)}"><span>${esc(fmtDay(day))}</span></div>`
        : '';
      lastDate = day;
      return `${divider}<article class="systems-grid systems-event" data-event-id="${esc(event.id)}">
        ${cell('Time', fmtTime(event.at), 'systems-event__time')}
        ${cell('System', event.system, 'systems-event__system')}
        ${cell('Expected', event.expected)}
        ${cell('What happened', event.happened)}
        ${cell('Engine action', event.action)}
        <div><span class="systems-event__cell-label">Result</span><span><span class="systems-result" data-result="${esc(event.result)}">${esc(event.result)}</span></span></div>
      </article>`;
    }).join('');

    if (append) eventsEl.insertAdjacentHTML('beforeend', html);
    else eventsEl.innerHTML = html;
  }

  function summarize(events) {
    const rows = uniqueEvents(events);
    const count = type => rows.filter(event => event.type === type).length;
    const results = rows.reduce((acc, event) => {
      acc[event.result] = (acc[event.result] || 0) + 1;
      return acc;
    }, {});
    const unresolved = results.UNRESOLVED || 0;
    const incidents = (results.INCIDENT || 0) + unresolved;
    const fallback = results.FALLBACK || 0;
    return {
      transmissions: count('BATCH_REFRESHED') + count('SOURCE_SELECTED'),
      incidents,
      recoveries: results.RECOVERED || 0,
      barb_originals_activations: count('BARB_ORIGINALS_ENGAGED') + count('BARB_ORIGINALS_ADMIN_HOLD'),
      watchtower_sessions: count('WATCHTOWER_STARTED'),
      unresolved,
      overall_status: unresolved ? 'UNRESOLVED' : incidents ? 'INCIDENT' : fallback ? 'FALLBACK' : 'NORMAL'
    };
  }

  function renderSummary(summary = {}) {
    $('[data-summary-transmissions]').textContent = Number(summary.transmissions) || 0;
    $('[data-summary-incidents]').textContent = Number(summary.incidents) || 0;
    $('[data-summary-recoveries]').textContent = Number(summary.recoveries) || 0;
    $('[data-summary-reserve]').textContent = Number(summary.barb_originals_activations) || 0;
    $('[data-summary-watchtower]').textContent = Number(summary.watchtower_sessions) || 0;
    $('[data-summary-unresolved]').textContent = Number(summary.unresolved) || 0;
    $('[data-summary-status]').textContent = summary.overall_status || 'NORMAL';
  }

  function renderSources(sources = []) {
    const names = Array.isArray(sources) ? sources.filter(Boolean) : [];
    sourcesEl.textContent = names.length
      ? `${names.join(' · ')} · and an ever-expanding list of verified public and open sources…`
      : 'An ever-expanding list of verified public and open sources…';
  }

  function renderSinceLast(data, events = data.events || []) {
    const previous = localStorage.getItem(storageKey);
    const previousMs = Date.parse(previous || '');
    const newEvents = Number.isFinite(previousMs)
      ? uniqueEvents(events).filter(event => Date.parse(event.at) > previousMs)
      : [];

    returnPanel.hidden = false;
    lastVisitEl.textContent = previous ? fmtVisit(previous) : 'FIRST VISIT';
    newCountEl.textContent = `${newEvents.length} NEW SYSTEM EVENT${newEvents.length === 1 ? '' : 'S'}`;

    if (previous && newEvents.length) {
      const incidents = newEvents.filter(event => ['INCIDENT','UNRESOLVED'].includes(event.result)).length;
      const recovered = newEvents.filter(event => event.result === 'RECOVERED').length;
      const fallback = newEvents.filter(event => event.result === 'FALLBACK').length;
      away.hidden = false;
      awayCopy.textContent = `${newEvents.length} new events were recorded. ${incidents} incident${incidents === 1 ? '' : 's'}, ${recovered} recover${recovered === 1 ? 'y' : 'ies'}, and ${fallback} fallback activation${fallback === 1 ? '' : 's'} occurred in the loaded period.`;
    } else {
      away.hidden = true;
    }

    localStorage.setItem(storageKey, data.generated_at || new Date().toISOString());
  }

  function updateMeta(data) {
    $('[data-ledger-note]').textContent = data.ledger_note || '';
    $('[data-generated]').textContent = fmtGenerated(data.generated_at);
    $('[data-period-label]').textContent = state.range === 'today'
      ? `MANILA DATE · ${data.date_manila || state.date}`
      : state.range === 'all'
        ? `ALL HISTORY · CONTINUOUS LEDGER`
        : `${state.range.toUpperCase()} VIEW · ${data.date_manila || state.date}`;
  }

  function render(data) {
    state.data = data;
    renderSources(data.sources);
    renderEvents(data.events || []);
    renderSummary(data.summary || summarize(data.events || []));
    renderSinceLast(data);
    updateMeta(data);
  }

  async function fetchData(params) {
    const query = new URLSearchParams(params);
    const response = await fetch(`${endpoint}?${query}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async function loadAllYear({ reset = false } = {}) {
    if (state.allLoading || state.allDone) return;
    state.allLoading = true;
    if (reset) {
      state.allYear = Number(manilaDate().slice(0, 4));
      state.allDone = false;
      state.allEvents = [];
      state.allSources = [];
      eventsEl.innerHTML = '<div class="systems-loading">OPENING CONTINUOUS SYSTEMS RECEIPT…</div>';
    }
    try {
      const data = await fetchData({ range: 'all', date: state.date, year: String(state.allYear) });
      state.allEvents = uniqueEvents([...state.allEvents, ...(data.events || [])]);
      state.allSources = data.sources || state.allSources;
      renderSources(state.allSources);
      renderEvents(state.allEvents);
      renderSummary(summarize(state.allEvents));
      if (reset) renderSinceLast(data, state.allEvents);
      updateMeta(data);
      const nextYear = Number(data.next_year);
      if (Number.isFinite(nextYear) && nextYear >= launchYear) state.allYear = nextYear;
      else state.allDone = true;
    } catch (error) {
      if (!state.allEvents.length) eventsEl.innerHTML = '<div class="systems-empty">SYSTEMS LEDGER TEMPORARILY UNAVAILABLE.</div>';
    } finally {
      state.allLoading = false;
    }
  }

  async function load() {
    if (state.range === 'all') return loadAllYear({ reset: true });
    eventsEl.innerHTML = '<div class="systems-loading">SYNCING SYSTEMS LEDGER…</div>';
    try {
      render(await fetchData({ range: state.range, date: state.date }));
    } catch (error) {
      eventsEl.innerHTML = '<div class="systems-empty">SYSTEMS LEDGER TEMPORARILY UNAVAILABLE.</div>';
    }
  }

  function shiftDay(delta) {
    const d = new Date(`${state.date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + delta);
    state.date = d.toISOString().slice(0, 10);
    dateInput.value = state.date;
    state.range = 'today';
    $$('.systems-range button').forEach(btn => btn.classList.toggle('is-active', btn.dataset.range === 'today'));
    load();
  }

  dateInput.value = state.date;
  dateInput.max = manilaDate();
  dateInput.addEventListener('change', () => {
    if (!dateInput.value) return;
    state.date = dateInput.value;
    state.range = 'today';
    $$('.systems-range button').forEach(btn => btn.classList.toggle('is-active', btn.dataset.range === 'today'));
    load();
  });

  $$('.systems-range button').forEach(btn => btn.addEventListener('click', () => {
    state.range = btn.dataset.range;
    $$('.systems-range button').forEach(node => node.classList.toggle('is-active', node === btn));
    load();
  }));

  $('[data-prev-day]').addEventListener('click', () => shiftDay(-1));
  $('[data-next-day]').addEventListener('click', () => {
    if (state.date >= manilaDate()) return;
    shiftDay(1);
  });
  $('[data-refresh]').addEventListener('click', load);
  $('[data-pdf]').addEventListener('click', () => window.print());

  window.addEventListener('scroll', () => {
    if (state.range !== 'all' || state.allLoading || state.allDone) return;
    const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 900;
    if (nearBottom) loadAllYear();
  }, { passive: true });

  load();
})();
