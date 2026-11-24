/* ==========================================================================
   YT No Blur v3.0.0 - Popup Controller
   Scrive nella SSOT (chrome.storage.local); Chrome propaga live a tutte
   le schede e iframe YouTube tramite chrome.storage.onChanged (zero permessi tabs)
   ========================================================================== */
(() => {
  'use strict';

  const STORAGE_KEY = 'ytnbSettings';
  const KEYS = ['noBlur', 'noAmbient', 'noHover', 'domVirt', 'fastAnim'];
  const DEFAULTS = Object.freeze({
    noBlur: true,
    noAmbient: true,
    noHover: true,
    domVirt: true,
    fastAnim: true
  });

  const inputs = Array.from(document.querySelectorAll('input[data-key]'));
  const badgeEl = document.getElementById('status-badge');
  const ambientHintEl = document.getElementById('ambient-hint');
  const resetBtn = document.getElementById('btn-reset');

  let current = { ...DEFAULTS };
  let resetTimer = null;

  const normalize = (raw) => {
    const out = { ...DEFAULTS };
    if (raw && typeof raw === 'object') {
      for (const k of KEYS) {
        if (typeof raw[k] === 'boolean') out[k] = raw[k];
      }
    }
    return out;
  };

  const render = (settings) => {
    current = settings;
    let activeCount = 0;

    for (const input of inputs) {
      const val = Boolean(settings[input.dataset.key]);
      input.checked = val;
      if (val) activeCount++;
    }

    badgeEl.textContent = `${activeCount}/${KEYS.length} attivi`;
    badgeEl.classList.toggle('is-off', activeCount === 0);

    // Mostra il promemoria solo quando l'utente ha riattivato l'Ambient Mode
    ambientHintEl.hidden = settings.noAmbient;

    const isMaxPerf = activeCount === KEYS.length;
    resetBtn.disabled = isMaxPerf;
    if (!resetTimer) {
      resetBtn.textContent = isMaxPerf
        ? 'Prestazioni Massime attive'
        : 'Ripristina Prestazioni Massime';
    }
  };

  const save = (next) => {
    render(next);
    chrome.storage.local.set({ [STORAGE_KEY]: next });
  };

  // Caricamento iniziale sincronizzato con chrome.storage.local
  chrome.storage.local.get(STORAGE_KEY, (data) => {
    render(normalize(data?.[STORAGE_KEY]));
  });

  // Cambio live sui singoli toggle
  for (const input of inputs) {
    input.addEventListener('change', () => {
      const next = { ...current, [input.dataset.key]: input.checked };
      save(next);
    });
  }

  // Ripristino "Prestazioni Massime"
  resetBtn.addEventListener('click', () => {
    if (resetTimer) clearTimeout(resetTimer);
    save({ ...DEFAULTS });
    resetBtn.textContent = 'Prestazioni Massime ripristinate ✓';
    resetTimer = setTimeout(() => {
      resetTimer = null;
      render(current);
    }, 1200);
  });

  // Mantiene il popup allineato se lo storage cambia da un'altra finestra
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[STORAGE_KEY]) {
      render(normalize(changes[STORAGE_KEY].newValue));
    }
  });
})();
