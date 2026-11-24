/* ==========================================================================
   YT No Blur v3.0.0 - ISOLATED World Storage Bridge
   - Unico ponte tra chrome.storage.local (SSOT) e la cache L1 / MAIN world
   - Flusso strettamente unidirezionale ISOLATED -> MAIN
   - Broadcast automatico live su tutte le tab/iframe via storage.onChanged
   ========================================================================== */
(() => {
  'use strict';

  const STORAGE_KEY = 'ytnbSettings';
  const CACHE_KEY = '__ytnb_cfg_v3';
  const SYNC_EVENT = 'ytnb:sync';
  const KEYS = ['noBlur', 'noAmbient', 'noHover', 'domVirt', 'fastAnim'];
  const DEFAULTS = Object.freeze({
    noBlur: true,
    noAmbient: true,
    noHover: true,
    domVirt: true,
    fastAnim: true
  });

  const normalize = (raw) => {
    const out = { ...DEFAULTS };
    if (raw && typeof raw === 'object') {
      for (const k of KEYS) {
        if (typeof raw[k] === 'boolean') out[k] = raw[k];
      }
    }
    return out;
  };

  const readCache = () => {
    try {
      return window.localStorage.getItem(CACHE_KEY);
    } catch {
      return null;
    }
  };

  const writeCache = (json) => {
    try {
      window.localStorage.setItem(CACHE_KEY, json);
    } catch {
      // Ignora SecurityError su iframe sandboxed / storage bloccato
    }
  };

  const pushToMain = (json) => {
    document.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: json }));
  };

  // 1. Reidratazione all'avvio: riconcilia SSOT con la cache L1.
  //    Se la cache L1 era già aggiornata, evita qualunque dispatch ridondante.
  const initialCache = readCache();

  chrome.storage.local.get(STORAGE_KEY, (data) => {
    if (chrome.runtime.lastError) return;
    const settings = normalize(data?.[STORAGE_KEY]);
    const json = JSON.stringify(settings);

    if (json !== initialCache) {
      writeCache(json);
      pushToMain(json);
    }
  });

  // 2. Aggiornamento live istantaneo su TUTTE le schede e iframe YouTube
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes[STORAGE_KEY]) return;
    const settings = normalize(changes[STORAGE_KEY].newValue);
    const json = JSON.stringify(settings);
    writeCache(json);
    pushToMain(json);
  });
})();
