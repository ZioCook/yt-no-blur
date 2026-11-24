/* ==========================================================================
   YT No Blur v3.0.1 - MAIN World Engine (run_at: document_start)
   - Startup sincrono 0 ns da cache L1 (zero FOUC, zero race con ytcfg/ShadowDOM)
   - Toggle live istantaneo per Light DOM, Shadow DOM (replaceSync O(1)) e hook JS
   - ZERO monkeypatch su WAAPI / document.timeline (elimina loop rAF polyfill)
   - 100% CSP & Trusted Types Safe | Zero Polling
   ========================================================================== */
(() => {
  'use strict';

  const GUARD = Symbol.for('yt-no-blur:v3');
  if (window[GUARD]) return;
  Object.defineProperty(window, GUARD, { value: true });

  const CACHE_KEY = '__ytnb_cfg_v3';
  const SYNC_EVENT = 'ytnb:sync';
  const KEYS = ['noBlur', 'noAmbient', 'noHover', 'domVirt', 'fastAnim'];
  const DEFAULTS = {
    noBlur: true,
    noAmbient: true,
    noHover: true,
    domVirt: true,
    fastAnim: true
  };

  const normalize = (raw) => {
    const out = { ...DEFAULTS };
    if (raw && typeof raw === 'object') {
      for (const k of KEYS) {
        if (typeof raw[k] === 'boolean') out[k] = raw[k];
      }
    }
    return out;
  };

  // Lettura SINCRONA a t = 0 ns dalla cache L1 (fallback sicuro su DEFAULTS)
  const loadSyncState = () => {
    try {
      const raw = window.localStorage.getItem(CACHE_KEY);
      if (raw) return normalize(JSON.parse(raw));
    } catch {}
    return { ...DEFAULTS };
  };

  const state = loadSyncState();

  /* ------------------------------------------------------------------------
     GESTIONE CLASSI SU <html> (sincrona prima del first paint + live toggle)
     ------------------------------------------------------------------------ */
  const CLASS_MAP = [
    ['noBlur', 'ytnb-no-blur'],
    ['noAmbient', 'ytnb-no-ambient'],
    ['noHover', 'ytnb-no-hover'],
    ['domVirt', 'ytnb-dom-virt'],
    ['fastAnim', 'ytnb-fast-anim']
  ];

  const applyRootClasses = () => {
    const root = document.documentElement;
    if (!root) return false;
    const cl = root.classList;
    for (let i = 0; i < CLASS_MAP.length; i++) {
      cl.toggle(CLASS_MAP[i][1], state[CLASS_MAP[i][0]]);
    }
    return true;
  };

  if (!applyRootClasses()) {
    const bootMo = new MutationObserver(() => {
      if (applyRootClasses()) bootMo.disconnect();
    });
    bootMo.observe(document, { childList: true });
  }

  /* ------------------------------------------------------------------------
     MODULO 1: Shadow DOM Constructable Stylesheet Dinamico O(1) (Lit-proof)
     ------------------------------------------------------------------------ */
  const buildShadowCss = (s) => {
    const parts = [];
    if (s.noBlur) {
      parts.push(
        '*,*::before,*::after{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}',
        ':where(:not(video,svg,g,path,use)),*::before,*::after{filter:none!important}',
        ':where(:not(video)){will-change:auto!important}',
        '#frosted-glass{display:none!important}'
      );
    }
    if (s.noAmbient) {
      parts.push(
        '#cinematics,#cinematics-container,ytd-cinematics,ytd-cinematic-container,.player-cinematics{display:none!important;pointer-events:none!important}'
      );
    }
    if (s.noHover) {
      parts.push(
        'ytd-video-preview,#mouseover-overlay,ytd-moving-thumbnail-renderer,animated-thumbnail-overlay-view-model{display:none!important;pointer-events:none!important}'
      );
    }
    if (s.fastAnim) {
      parts.push(
        '*,*::before,*::after{transition-duration:0.001ms!important;transition-delay:0s!important;animation-duration:0.001ms!important;animation-delay:0s!important;animation-iteration-count:1!important}',
        'tp-yt-paper-ripple,yt-interaction{display:none!important;pointer-events:none!important}'
      );
    }
    return parts.join('\n');
  };

  let shadowSheet = null;
  try {
    shadowSheet = new CSSStyleSheet();
    shadowSheet.replaceSync(buildShadowCss(state));
  } catch {
    shadowSheet = null;
  }

  if (shadowSheet) {
    const adoptedDesc = Object.getOwnPropertyDescriptor(
      ShadowRoot.prototype,
      'adoptedStyleSheets'
    );
    const nativeGet = adoptedDesc?.get;
    const nativeSet = adoptedDesc?.set;

    const ensureSheet = (sr, incoming) => {
      const current = incoming ?? (nativeGet ? nativeGet.call(sr) : sr.adoptedStyleSheets);
      const list = Array.from(current);
      const idx = list.indexOf(shadowSheet);
      if (idx === -1) {
        list.push(shadowSheet);
      } else if (idx !== list.length - 1) {
        list.splice(idx, 1);
        list.push(shadowSheet);
      }
      if (nativeSet) nativeSet.call(sr, list);
      else sr.adoptedStyleSheets = list;
    };

    if (adoptedDesc?.configurable && nativeGet && nativeSet) {
      Object.defineProperty(ShadowRoot.prototype, 'adoptedStyleSheets', {
        configurable: true,
        enumerable: true,
        get() {
          return nativeGet.call(this);
        },
        set(sheets) {
          try {
            ensureSheet(this, sheets);
          } catch {
            nativeSet.call(this, sheets);
          }
        }
      });
    }

    const origAttachShadow = Element.prototype.attachShadow;
    if (typeof origAttachShadow === 'function') {
      Element.prototype.attachShadow = function (init) {
        const sr = origAttachShadow.call(this, init);
        try {
          ensureSheet(sr);
        } catch {}
        return sr;
      };
    }
  }

  /* ------------------------------------------------------------------------
     RICEVITORE LIVE SYNC DAL BRIDGE ISOLATED (Zero Page Reload)
     ------------------------------------------------------------------------ */
  document.addEventListener(SYNC_EVENT, (e) => {
    if (typeof e.detail !== 'string') return;
    let next;
    try {
      next = normalize(JSON.parse(e.detail));
    } catch {
      return;
    }

    const shadowDirty =
      next.noBlur !== state.noBlur ||
      next.noAmbient !== state.noAmbient ||
      next.noHover !== state.noHover ||
      next.fastAnim !== state.fastAnim;

    Object.assign(state, next);
    applyRootClasses();

    if (shadowDirty && shadowSheet) {
      try {
        shadowSheet.replaceSync(buildShadowCss(state));
      } catch {}
    }
  });

  /* ------------------------------------------------------------------------
     MODULO 2: Flag nativi separati in ytcfg (Ambient Mode vs Animazioni)
     Disattiva Lottie/Ink/Cinematics a monte senza toccare WAAPI/timeline
     ------------------------------------------------------------------------ */
  const AMBIENT_FLAGS = {
    kevlar_watch_cinematics: false,
    kevlar_watch_cinematics_invisible: false,
    kevlar_measure_ambient_mode_idle: false,
    web_cinematic_theater_mode: false,
    web_cinematic_fullscreen: false,
    web_cinematic_masthead: false,
    enable_cinematic_blur_desktop_loading: false,
    web_player_cinematics: false
  };

  const ANIM_FLAGS = {
    web_animated_actions: false,
    web_animated_actions_v2: false,
    web_animated_like: false,
    web_animated_like_lazy_load: false,
    smartimation_background: false,
    kevlar_touch_feedback: false,
    kevlar_three_dot_ink: false
  };

  const patchFlags = (flags) => {
    if (!flags || typeof flags !== 'object') return;
    if (state.noAmbient) Object.assign(flags, AMBIENT_FLAGS);
    if (state.fastAnim) Object.assign(flags, ANIM_FLAGS);
  };

  const wrapYtcfg = (cfg) => {
    if (!cfg || typeof cfg !== 'object' || cfg.__ytnbWrapped) return cfg;
    Object.defineProperty(cfg, '__ytnbWrapped', { value: true });

    if (typeof cfg.set === 'function') {
      const origSet = cfg.set;
      cfg.set = function (...args) {
        if (args.length > 1 && args[0] === 'EXPERIMENT_FLAGS') {
          patchFlags(args[1]);
        } else if (args.length === 1 && args[0]?.EXPERIMENT_FLAGS) {
          patchFlags(args[0].EXPERIMENT_FLAGS);
        }
        const res = origSet.apply(this, args);
        try {
          patchFlags(cfg.d?.()?.EXPERIMENT_FLAGS);
        } catch {}
        return res;
      };
    }

    try {
      patchFlags(cfg.d?.()?.EXPERIMENT_FLAGS);
      patchFlags(cfg.data_?.EXPERIMENT_FLAGS);
    } catch {}

    return cfg;
  };

  if (window.ytcfg) {
    wrapYtcfg(window.ytcfg);
  } else {
    let _ytcfg;
    try {
      Object.defineProperty(window, 'ytcfg', {
        configurable: true,
        enumerable: true,
        get() {
          return _ytcfg;
        },
        set(val) {
          _ytcfg = wrapYtcfg(val);
        }
      });
    } catch {}
  }

  /* ------------------------------------------------------------------------
     MODULO 3: Segnale prefers-reduced-motion dinamico legato a state.fastAnim
     ------------------------------------------------------------------------ */
  const origMatchMedia = window.matchMedia;
  if (typeof origMatchMedia === 'function') {
    const REDUCED_RE = /\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/i;
    const NO_PREF_RE = /\(\s*prefers-reduced-motion\s*:\s*no-preference\s*\)/i;

    window.matchMedia = function (query) {
      const mql = origMatchMedia.call(this, query);
      if (typeof query !== 'string') return mql;
      const isReduce = REDUCED_RE.test(query);
      const isNoPref = !isReduce && NO_PREF_RE.test(query);
      if (!isReduce && !isNoPref) return mql;

      try {
        return new Proxy(mql, {
          get(target, prop) {
            if (prop === 'matches' && state.fastAnim) return isReduce;
            const val = Reflect.get(target, prop, target);
            return typeof val === 'function' ? val.bind(target) : val;
          }
        });
      } catch {
        return mql;
      }
    };
  }

  /* ------------------------------------------------------------------------
     MODULO 4: Fail-safe Ambient Mode su Canvas drawImage (toggle live O(1))
     ------------------------------------------------------------------------ */
  const origDrawImage = CanvasRenderingContext2D?.prototype?.drawImage;
  if (typeof origDrawImage === 'function') {
    const CINEMATIC_SEL =
      '#cinematics, #cinematics-container, #cinematics-full-bleed-container, ytd-cinematics, ytd-cinematic-container, .player-cinematics';
    const canvasCache = new WeakMap();

    CanvasRenderingContext2D.prototype.drawImage = function (source) {
      if (state.noAmbient && source instanceof HTMLVideoElement && this.canvas) {
        const c = this.canvas;
        const connected = c.isConnected;
        let entry = canvasCache.get(c);
        if (!entry || entry.connected !== connected) {
          const blocked = connected && !!c.closest(CINEMATIC_SEL);
          entry = { connected, blocked };
          canvasCache.set(c, entry);
        }
        if (entry.blocked) return;
      }
      return origDrawImage.apply(this, arguments);
    };
  }

  /* ------------------------------------------------------------------------
     MODULO 5: Blocco Anteprime Hover (toggle live O(1))
     ------------------------------------------------------------------------ */
  const PREVIEW_HOSTS = [
    'ytd-thumbnail',
    'yt-thumbnail-view-model',
    'yt-lockup-view-model',
    '.ytLockupViewModelHost',
    'ytm-shorts-lockup-view-model',
    'ytd-moving-thumbnail-renderer',
    'animated-thumbnail-overlay-view-model',
    'ytd-video-preview'
  ].join(',');

  const blockPreviewHover = (e) => {
    if (!state.noHover) return;
    const t = e.target;
    if (t instanceof Element && t.matches(PREVIEW_HOSTS) && !t.closest('#movie_player')) {
      e.stopImmediatePropagation();
    }
  };

  document.addEventListener('mouseenter', blockPreviewHover, { capture: true, passive: true });
  document.addEventListener('pointerenter', blockPreviewHover, { capture: true, passive: true });

  const origPlay = HTMLMediaElement.prototype.play;
  if (typeof origPlay === 'function') {
    HTMLMediaElement.prototype.play = function () {
      if (
        state.noHover &&
        this.closest &&
        this.closest('ytd-video-preview, #inline-preview-player')
      ) {
        try {
          this.pause();
        } catch {}
        return Promise.resolve();
      }
      return origPlay.apply(this, arguments);
    };
  }
})();
