(() => {
  'use strict';

  const cfg = window.BarbPHSystemsConfig || {};
  const API = cfg.api || '/.netlify/functions/systems-public';
    const ARCHIVE_START = cfg.archiveStart || '2026-08-30';
  const REVIEW = typeof cfg.fetchData === 'function';

  const oldStyle = document.querySelector('link[href="/satellite-tab.css"]');
  oldStyle?.remove();
  document.getElementById('barbph-transmission-register-v2')?.remove();
  document.getElementById('barb-satellite-drawer')?.remove();

  const oldHandle = document.querySelector('[data-satellite-handle]');
  const rail = oldHandle?.parentElement || document.querySelector('.folder-tabs');
  if (!rail) return;

  let systems = rail.querySelector('.folder-tab--systems');
  if (!systems) {
    systems = document.createElement('button');
    systems.type = 'button';
    systems.className = 'folder-tab folder-tab--systems';
    systems.dataset.tabKey = 'systems';
    systems.setAttribute('aria-label','SYSTEMS AND TRANSMISSION LOGS');
    systems.setAttribute('aria-expanded','false');
    systems.innerHTML = `<span class="visually-hidden">SYSTEMS AND TRANSMISSION LOGS</span><span class="folder-tab__surface" aria-hidden="true"></span><span class="folder-tab__hint" aria-hidden="true">SYSTEMS</span>`;
  }
  oldHandle?.remove();
  const ee = rail.querySelector('.folder-tab--mystery');
  if (ee) ee.insertAdjacentElement('afterend',systems); else rail.appendChild(systems);

  let panel = document.getElementById('barb-systems-rollout');
  if (!panel) {
    panel = document.createElement('aside');
    panel.id = 'barb-systems-rollout';
    panel.className = 'barb-systems-rollout';
    panel.setAttribute('aria-hidden','true');
    panel.innerHTML = `
      <article class="barb-systems-paper">
        <h1 class="bs-title">SYSTEMS AND<br>TRANSMISSION LOGS</h1>
        <aside class="bs-note" aria-label="About BARBPH live transmission">
          <span class="bs-staple-mini" aria-hidden="true">
            <svg viewBox="0 0 36 12" focusable="false" aria-hidden="true">
              <defs>
                <linearGradient id="bsStapleStraightMetal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stop-color="#ffffff"/>
                  <stop offset=".28" stop-color="#d7dbdd"/>
                  <stop offset=".58" stop-color="#8e9498"/>
                  <stop offset=".82" stop-color="#c8cdcf"/>
                  <stop offset="1" stop-color="#71777b"/>
                </linearGradient>
              </defs>
              <!-- tiny puncture shadows in the paper -->
              <ellipse cx="4.2" cy="8.7" rx="1.15" ry=".55" fill="#6d665e" opacity=".26"/>
              <ellipse cx="31.8" cy="8.7" rx="1.15" ry=".55" fill="#6d665e" opacity=".26"/>
              <!-- real staple: straight crown with very short bent legs -->
              <path d="M4.4 7.9 L5.2 4.0 L30.8 4.0 L31.6 7.9" fill="none" stroke="#747a7e" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M5.2 3.65 L30.8 3.65" fill="none" stroke="url(#bsStapleStraightMetal)" stroke-width="1.55" stroke-linecap="round"/>
              <path d="M5.8 3.18 L30.2 3.18" fill="none" stroke="#ffffff" stroke-width=".45" stroke-linecap="round" opacity=".92"/>
              <!-- tiny visible ends entering the paper -->
              <circle cx="4.25" cy="8.35" r=".43" fill="#5a5f63" opacity=".66"/>
              <circle cx="31.75" cy="8.35" r=".43" fill="#5a5f63" opacity=".66"/>
            </svg>
          </span>
          <p class="bs-live-line"><span>barbph is baked in live</span><span>transmission + <a class="bs-watchtower" href="https://watchtower.barbph.com/" target="_blank" rel="noopener">WATCHTOWER<span class="bs-click-cursor" aria-hidden="true"></span></a></span></p>
          <p class="bs-source-lines">(from NASA, The Met, noaa.gov and National Gallery of Art, National Heritage Board Singapore among others..)</p>
          <p class="bs-publication-row"><a class="bs-publication-link" href="/publications#PUB-0001">Read our Publication here to know more..</a></p>
        </aside>
        <div class="bs-dash"></div>
        <div class="bs-date-tools">
          <input type="date" data-bs-date aria-label="Find an archived SYSTEMS receipt by date">
          <button class="bs-pdf" type="button" data-bs-pdf>PDF</button>
        </div>
        <section class="bs-stats" aria-label="Daily totals">
          <div class="bs-stat">Transmissions<b data-bs-transmissions>0</b></div>
          <div class="bs-stat">Incidents<b data-bs-incidents>0</b></div>
          <div class="bs-stat">Recoveries<b data-bs-recoveries>0</b></div>
          <div class="bs-stat">Barb Originals<b data-bs-reserve>0</b></div>
          <div class="bs-stat">Watchtower<b data-bs-watchtower>0</b></div>
          <div class="bs-stat">Unresolved<b data-bs-unresolved>0</b></div>
          <div class="bs-stat">Overall status<b data-bs-status>NORMAL</b></div>
          <div class="bs-stat">Events<b data-bs-records>0</b></div>
        </section>
        <div class="bs-event-frame" data-bs-frame><div class="bs-message">OPEN SYSTEMS TO LOAD THE LEDGER.</div></div>
        <div class="bs-page" data-bs-page hidden>
          <button type="button" data-bs-newer>NEWER</button>
          <span class="bs-page-status" data-bs-page-status>1 / 1</span>
          <button type="button" data-bs-older>OLDER</button>
        </div>
      </article>`;
    document.body.appendChild(panel);
  }

  const q = sel => panel.querySelector(sel);
  const frame = q('[data-bs-frame]');
  const pageBox = q('[data-bs-page]');
  const dateInput = q('[data-bs-date]');

  const state = {open:false,loadedOnce:false,loading:false,date:manilaDate(),events:[],page:0};

  function manilaDate(){
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const m=Object.fromEntries(parts.map(p=>[p.type,p.value]));
    return `${m.year}-${m.month}-${m.day}`;
  }
  function fmtDay(date){return new Intl.DateTimeFormat('en-US',{timeZone:'UTC',weekday:'short',year:'numeric',month:'short',day:'2-digit'}).format(new Date(date+'T00:00:00Z')).toUpperCase()}
  function fmtTime(iso){try{return new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Manila',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(iso))}catch{return '--:--'}}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function unique(rows){const seen=new Set();return (rows||[]).filter(e=>{const k=e.id||`${e.at}|${e.type}|${e.system}|${e.happened}`;if(seen.has(k))return false;seen.add(k);return true}).sort((a,b)=>String(b.at).localeCompare(String(a.at)))}
  function summary(events){
    const ct=t=>events.filter(e=>e.type===t).length, cr=r=>events.filter(e=>e.result===r).length;
    const unresolved=cr('UNRESOLVED'),incidents=cr('INCIDENT')+unresolved,fallback=cr('FALLBACK');
    return {transmissions:ct('BATCH_REFRESHED')+ct('SOURCE_SELECTED'),incidents,recoveries:cr('RECOVERED'),reserve:ct('BARB_ORIGINALS_ENGAGED')+ct('BARB_ORIGINALS_ADMIN_HOLD'),watchtower:ct('WATCHTOWER_STARTED'),unresolved,status:unresolved?'UNRESOLVED':incidents?'INCIDENT':fallback?'FALLBACK':'NORMAL',records:events.length};
  }
  function field(label,value){return `<div class="bs-field"><span class="bs-key">${esc(label)}</span><span class="bs-value">${esc(value||'')}</span></div>`}

  async function fetchDay(date){
    if (REVIEW) return cfg.fetchData({range:'today',date});
    const url=new URL(API,location.href);url.searchParams.set('range','today');url.searchParams.set('date',date);
    const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw new Error(`HTTP ${response.status}`);return response.json();
  }

  function renderStats(){
    const s=summary(state.events);
    q('[data-bs-transmissions]').textContent=s.transmissions;q('[data-bs-incidents]').textContent=s.incidents;q('[data-bs-recoveries]').textContent=s.recoveries;q('[data-bs-reserve]').textContent=s.reserve;q('[data-bs-watchtower]').textContent=s.watchtower;q('[data-bs-unresolved]').textContent=s.unresolved;q('[data-bs-status]').textContent=s.status;q('[data-bs-records]').textContent=s.records;
  }
  function renderPage(){
    const rows=unique(state.events);renderStats();
    if(!rows.length){frame.innerHTML='<div class="bs-message">NO RECORDED SYSTEM EVENTS FOR THIS DATE.</div>';pageBox.hidden=true;return}
    state.page=Math.max(0,Math.min(state.page,rows.length-1));const event=rows[state.page],s=summary(rows);
    frame.innerHTML=`<div class="bs-day">${esc(fmtDay(state.date))}</div><section class="bs-event">${field('Time',fmtTime(event.at))}${field('System',event.system)}${field('Expected',event.expected)}${field('What happened',event.happened)}${field('Engine action',event.action)}<div class="bs-field"><span class="bs-key">Result</span><span class="bs-value"><span class="bs-result" data-result="${esc(event.result)}">${esc(event.result)}</span></span></div></section><section class="bs-day-summary"><strong>Day Summary</strong><br>${s.transmissions} transmissions · ${s.incidents} incidents · ${s.recoveries} recoveries · ${s.reserve} Barb Originals · ${s.watchtower} Watchtower · ${s.unresolved} unresolved · ${esc(s.status)}</section>`;
    pageBox.hidden=rows.length<=1;q('[data-bs-page-status]').textContent=`${state.page+1} / ${rows.length}`;q('[data-bs-newer]').disabled=state.page===0;q('[data-bs-older]').disabled=state.page===rows.length-1;
  }
  async function loadDate(){
    if(state.loading)return;state.loading=true;state.page=0;frame.innerHTML='<div class="bs-message">PRINTING SYSTEMS LOG…</div>';pageBox.hidden=true;
    try{const data=await fetchDay(state.date);state.events=unique(data.events||[]);renderPage()}catch{state.events=[];frame.innerHTML='<div class="bs-message">SYSTEMS LOG TEMPORARILY UNAVAILABLE.</div>';renderStats()}finally{state.loading=false}
  }
  function updateDateControls(){dateInput.value=state.date;dateInput.min=ARCHIVE_START;dateInput.max=manilaDate()}
  function closeOtherPanels(){
    const ticker=document.querySelector('[data-barb-ticker]'),tickerHandle=document.querySelector('[data-ticker-handle]');if(ticker?.classList.contains('is-open')&&tickerHandle)tickerHandle.click();
    const topbar=document.querySelector('[data-ticker-topbar]'),connectHandle=document.querySelector('[data-connect-handle]');if(topbar?.classList.contains('is-connect-open')&&connectHandle)connectHandle.click();
  }
  function positionPanel(){
    if(!state.open)return;const rect=systems.getBoundingClientRect();const width=rect.width;const left=Math.max(4,Math.min(rect.left,window.innerWidth-width-4));const top=Math.max(0,rect.bottom-3);
    panel.style.width=`${width}px`;panel.style.left=`${left}px`;panel.style.top=`${top}px`;panel.style.height='auto';panel.style.maxHeight=`${Math.max(180,window.innerHeight-top-4)}px`;
  }
  function setOpen(open){state.open=Boolean(open);if(state.open)closeOtherPanels();systems.setAttribute('aria-expanded',String(state.open));systems.classList.toggle('is-active',state.open);panel.classList.toggle('is-open',state.open);panel.setAttribute('aria-hidden',String(!state.open));if(state.open){positionPanel();if(!state.loadedOnce){state.loadedOnce=true;loadDate()}}}

  function buildPrintHtml(){
    const rows=unique(state.events),s=summary(rows);
    const events=rows.map(event=>`<section class="event"><b>${esc(fmtTime(event.at))} · ${esc(event.system)}</b><div><small>EXPECTED</small>${esc(event.expected)}</div><div><small>WHAT HAPPENED</small>${esc(event.happened)}</div><div><small>ENGINE ACTION</small>${esc(event.action)}</div><div><small>RESULT</small>${esc(event.result)}</div></section>`).join('');
    return `<!doctype html><html><head><meta charset="utf-8"><title>BARBPH SYSTEMS ${esc(state.date)}</title><style>body{margin:0;padding:20px;background:#fff;color:#111;font-family:'Courier New',monospace}.paper{width:280px;margin:auto;background:rgba(247,248,248,.94);padding:10px;box-shadow:inset 0 0 0 1px rgba(84,90,96,.10)}h1{font-size:16px;line-height:1.05;text-align:center;margin:0 0 10px}.note{position:relative;padding:18px 10px 10px;margin:0 0 10px;background:#ffffff;color:#555;border:1px solid rgba(62,62,62,.18);font-family:Arial,sans-serif;font-size:10px}.note p{margin:0}.note .sources{margin-top:8px;font-size:9px;line-height:1.3;text-align:left}.note .publication{margin-top:14px}.dash{border-top:1px dashed #555;margin:10px 0}.date{font-weight:bold;text-align:center}.event{padding:12px 0;border-bottom:1px dotted #777;font-size:11px;line-height:1.35}.event div{margin-top:6px}.event small{display:block;color:#666;font-size:8px}.summary{padding:12px 0;font-size:9px;text-transform:uppercase;border-top:2px solid #111}</style></head><body><main class="paper"><h1>SYSTEMS AND<br>TRANSMISSION LOGS</h1><div class="note"><p>barbph is baked in live</p><p>transmission + WATCHTOWER</p><p class="sources">(from NASA, The Met, noaa.gov and National Gallery of Art, National Heritage Board Singapore among others..)</p><p class="publication">Read our Publication here to know more..</p></div><div class="dash"></div><div class="date">${esc(fmtDay(state.date))}</div>${events}<div class="summary">${s.transmissions} transmissions · ${s.incidents} incidents · ${s.recoveries} recoveries · ${s.reserve} Barb Originals · ${s.watchtower} Watchtower · ${s.unresolved} unresolved · ${esc(s.status)}</div></main></body></html>`;
  }
  function printReceipt(){const popup=window.open('','_blank','width=420,height=760');if(!popup)return;popup.document.write(buildPrintHtml());popup.document.close();popup.focus();setTimeout(()=>popup.print(),150)}

  updateDateControls();

  /* Legacy /systems now redirects to /?systems=open. Open the new inline receipt once,
     then remove only the temporary systems query flag from the address bar. */
  function openFromLegacyRoute(){
    const url=new URL(location.href);
    const requested=url.searchParams.get('systems')==='open'||location.hash==='#systems';
    if(!requested)return;
    requestAnimationFrame(()=>{
      setOpen(true);
      if(url.searchParams.get('systems')==='open'){
        url.searchParams.delete('systems');
        history.replaceState(history.state,'',`${url.pathname}${url.search}${url.hash}`||'/');
      }
    });
  }

  systems.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();setOpen(!state.open)});
  dateInput.addEventListener('change',()=>{if(!dateInput.value)return;let picked=dateInput.value;if(picked<ARCHIVE_START)picked=ARCHIVE_START;if(picked>manilaDate())picked=manilaDate();state.date=picked;updateDateControls();loadDate()});
  q('[data-bs-pdf]').addEventListener('click',printReceipt);q('[data-bs-newer]').addEventListener('click',()=>{if(state.page>0){state.page--;renderPage()}});q('[data-bs-older]').addEventListener('click',()=>{if(state.page<state.events.length-1){state.page++;renderPage()}});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&state.open)setOpen(false)});document.addEventListener('pointerdown',event=>{if(!state.open)return;if(panel.contains(event.target)||systems.contains(event.target))return;setOpen(false)});window.addEventListener('resize',positionPanel,{passive:true});buttonScroll();
  function buttonScroll(){systems.closest('.folder-tabs')?.addEventListener('scroll',positionPanel,{passive:true})}

  function loadScript(src,marker){if(document.querySelector(`script[${marker}]`))return;const script=document.createElement('script');script.src=src;script.defer=true;script.setAttribute(marker,'true');document.head.appendChild(script)}
  if(!REVIEW){if(!window.BarbPHWatchtowerInterlude)loadScript('/watchtower-interlude.js?v=20260830-systems-1','data-watchtower-interlude-loader');if(!window.BarbPHContinuousSource)loadScript('/continuous-source-controller.js?v=20260830-systems-1','data-continuous-source-loader')}

  openFromLegacyRoute();

  window.BarbPHSystemsRollout=Object.freeze({open:()=>setOpen(true),close:()=>setOpen(false),loadDate:date=>{state.date=date;updateDateControls();return loadDate()}});
})();
