(() => {
  'use strict';

  /*
    SYSTEMS compatibility bootstrap.
    The homepage still references this historical filename so we can replace the
    obsolete Satellite UI without editing the large, launch-hardened index.html.
  */
  const oldStyle = document.querySelector('link[href="/satellite-tab.css"]');
  oldStyle?.remove();
  document.getElementById('barbph-transmission-register-v2')?.remove();

  const oldHandle = document.querySelector('[data-satellite-handle]');
  const oldDrawer = document.getElementById('barb-satellite-drawer');
  oldDrawer?.remove();

  if (oldHandle) {
    const systems = document.createElement('a');
    systems.className = 'folder-tab folder-tab--systems';
    systems.href = '/systems';
    systems.dataset.tabKey = 'systems';
    systems.dataset.route = '/systems';
    systems.setAttribute('aria-label', 'Systems');
    systems.title = 'Systems';
    systems.innerHTML = `
      <span class="visually-hidden">Systems</span>
      <span class="folder-tab__surface folder-tab__icon">
        <img class="final-tab-art systems-tab-art"
             src="/systems-machine-tab.webp?v=20260830-1"
             alt=""
             aria-hidden="true"
             decoding="async">
      </span>
      <span class="folder-tab__hint" aria-hidden="true">Systems</span>`;
    oldHandle.replaceWith(systems);
  }

  if (!document.getElementById('barbph-systems-tab-final')) {
    const style = document.createElement('style');
    style.id = 'barbph-systems-tab-final';
    style.textContent = `
      .folder-tab--systems{
        --tab-w:148px !important;
        --tab-h:60px !important;
        width:148px !important;
        height:60px !important;
        flex:0 0 148px !important;
        z-index:7 !important;
      }
      .folder-tab--systems .systems-tab-art{
        left:3px !important;
        right:3px !important;
        top:2px !important;
        bottom:2px !important;
        width:calc(100% - 6px) !important;
        height:calc(100% - 4px) !important;
        object-fit:contain !important;
      }
      @media(max-width:720px){
        .folder-tab--systems{
          --tab-w:126px !important;
          --tab-h:54px !important;
          width:126px !important;
          height:54px !important;
          flex-basis:126px !important;
        }
      }`;
    document.head.appendChild(style);
  }

  function loadScript(src, marker) {
    if (document.querySelector(`script[${marker}]`)) return;
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    script.setAttribute(marker, 'true');
    document.head.appendChild(script);
  }

  if (!window.BarbPHWatchtowerInterlude) {
    loadScript('/watchtower-interlude.js?v=20260830-systems-1', 'data-watchtower-interlude-loader');
  }
  if (!window.BarbPHContinuousSource) {
    loadScript('/continuous-source-controller.js?v=20260830-systems-1', 'data-continuous-source-loader');
  }
})();
