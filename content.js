/* YT No Blur v1.5 */
const S=new CSSStyleSheet();
S.replaceSync(`*,*::before,*::after{backdrop-filter:none!important}[style*="blur("]{filter:none!important}:is([style*="backdrop-filter"],ytd-masthead,#masthead,#masthead-container,ytd-feed-filter-chip-bar-renderer,ytd-feed-filter-chip-bar-renderer #chips-wrapper,ytd-feed-filter-chip-bar-renderer #container){background:var(--yt-spec-base-background,#fff)!important}html[dark] :is([style*="backdrop-filter"],ytd-masthead,#masthead,#masthead-container,ytd-feed-filter-chip-bar-renderer,ytd-feed-filter-chip-bar-renderer #chips-wrapper,ytd-feed-filter-chip-bar-renderer #container){background:var(--yt-spec-base-background,#0f0f0f)!important}:is(ytd-popup-container,tp-yt-paper-dialog,tp-yt-paper-toast,ytd-menu-popup-renderer,ytd-multi-page-menu-renderer){background:var(--yt-spec-raised-background,#f2f2f2)!important}html[dark] :is(ytd-popup-container,tp-yt-paper-dialog,tp-yt-paper-toast,ytd-menu-popup-renderer,ytd-multi-page-menu-renderer){background:var(--yt-spec-raised-background,#212121)!important}:is(#cinematics,ytd-cinematics),:is(#cinematics,ytd-cinematics) *{display:none!important}:is(#movie_player,#player,#player-container) canvas{display:none!important}`);
const W=new WeakSet();
const p=r=>{if(W.has(r))return;W.add(r);r.adoptedStyleSheets=[...r.adoptedStyleSheets,S];};
const w=r=>{for(const n of r.querySelectorAll('*'))if(n.shadowRoot){p(n.shadowRoot);w(n.shadowRoot);}};
const _a=Element.prototype.attachShadow;
Element.prototype.attachShadow=function(o){const sr=_a.call(this,o);if(o.mode==='open')p(sr);return sr;};
w(document.documentElement);
new MutationObserver(ms=>{for(const{addedNodes:ns}of ms)for(const n of ns){if(n.nodeType!==1)continue;if(n.shadowRoot){p(n.shadowRoot);w(n.shadowRoot);}if(n.childElementCount)w(n);if(n.matches('#cinematics,ytd-cinematics'))n.style.setProperty('display','none','important');}}).observe(document.documentElement,{childList:true,subtree:true});
const ka=()=>document.querySelector('#cinematics,ytd-cinematics')?.style.setProperty('display','none','important');
const nv=()=>setTimeout(ka,300);
document.addEventListener('yt-navigate-finish',nv);
window.addEventListener('popstate',nv);
