(() => {
  'use strict';
  function loadStyle(href,marker){if(document.querySelector(`link[${marker}]`))return;const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.setAttribute(marker,'true');document.head.appendChild(link)}
  function loadScript(src,marker){if(document.querySelector(`script[${marker}]`))return;const script=document.createElement('script');script.src=src;script.defer=true;script.setAttribute(marker,'true');document.head.appendChild(script)}
  loadStyle('/systems-rollout.css?v=20260831-vellum-v18','data-systems-rollout-style');
  loadScript('/systems-rollout.js?v=20260831-vellum-v18','data-systems-rollout-loader');
})();
