# YT No Blur 🚀 (v3.0.0)

Estensione Chromium (Manifest V3) modulare e ad alte prestazioni progettata per alleggerire al massimo YouTube eliminando tutti i colli di bottiglia computazionali e visivi: **Ambient Mode**, **effetti blur**, **backdrop-filter**, **animazioni JS/CSS pesanti** e **anteprime video hover nei feed**, introducendo la **virtualizzazione del DOM via CSS** (`content-visibility: auto`) e un **menu popup con interruttori (toggles) ON/OFF in tempo reale**.

---

## ⚡ Novità della v3.0.0: Menu Popup con Toggle Modulari

La v3.0.0 introduce il pieno controllo per l'utente tramite un menu popup nativo e accessibile:
- **Rimuovi Blur & Trasparenze:** neutralizza sfocature e `backdrop-filter`, sostituendoli con sfondi solidi opachi (~4,7s di compositing GPU risparmiati).
- **Disattiva Ambient Mode:** spegne a monte il bagliore cinematografico su `ytcfg` e canvas.
- **Blocca Anteprime Video Hover:** impedisce l'avvio del secondo player inline al mouseover (~650ms di blocchi CPU eliminati).
- **Virtualizzazione DOM:** salta il layout e l'HitTest di circa 9.000 nodi DOM fuori schermo tramite `content-visibility: auto`.
- **Riduci Animazioni e Transizioni:** azzera le animazioni di Polymer/Lit preservando con precisione chirurgica le micro-transizioni del player (slider volume, autohide controlli, slide impostazioni) tramite CSS `@scope` (Donut Scope).
- **Tasto "Ripristina Prestazioni Massime":** reimposta con un click tutti i 5 moduli al massimo risparmio.

---

## 🏛️ Architettura Tecnica: Pattern "L1 Sync Cache + SSOT Async Reconciliation"

In Manifest V3 `chrome.storage.local` è asincrono. Per evitare qualsiasi race condition e garantire **zero FOUC (Flash of Unstyled Content)** fin da `t = 0 ns`:

```text
popup.js ──► chrome.storage.local.set() (SSOT)
                 │ (broadcast automatico Chromium a tutte le tab/iframe)
                 ▼
bridge.js (ISOLATED) ──► aggiorna cache L1 window.localStorage
                     ──► document.dispatchEvent(new CustomEvent('ytnb:sync', { detail: json }))
                 │ (sincrono cross-world)
                 ▼
content.js (MAIN)    ──► aggiorna state in memoria (hook JS live)
                     ──► toggle classi :root.ytnb-* (Light DOM live)
                     ──► shadowSheet.replaceSync() (TUTTI gli Shadow DOM live in O(1)!)
```

1. **Avvio Sincrono (0 ns):** `content.js` legge la cache L1 `localStorage` istantaneamente all'avvio, applicando le classi su `<html>` e patchando `ytcfg` e `attachShadow` prima del primo script inline di YouTube.
2. **Aggiornamento Live (Zero Page Reload):** ogni modifica ai toggle nel popup si riflette istantaneamente su tutte le schede YouTube aperte senza ricaricare la pagina (`F5`).
3. **Blink Style Engine $O(1)$:** i moduli CSS usano `@scope (:root.ytnb-*)`, azzerando qualsiasi risalita sugli antenati (`ancestor-walk`) su quasi 10.000 nodi.

---

## 📂 Struttura File

```
yt-no-blur/
├── manifest.json   # Manifest V3 (Chrome 118+), action popup e storage
├── popup.html      # Interfaccia grafica popup adattiva Dark/Light
├── popup.css       # Stili nativi YouTube per il popup
├── popup.js        # Controller popup (scrittura su chrome.storage.local)
├── bridge.js       # Script ISOLATED: ponte storage SSOT -> cache L1 e live sync
├── styles.css      # CSS modulare con @scope (:root.ytnb-*) e Donut Scope
├── content.js      # Motore MAIN world (cache sincrona L1, Shadow DOM hook, WAAPI clamp)
└── README.md
```

---

## 📦 Installazione e Aggiornamento

1. Apri Google Chrome (o qualsiasi browser Chromium versione 118+).
2. Vai su **`chrome://extensions`**.
3. Attiva la **Modalità sviluppatore** in alto a destra.
4. Clicca su **Aggiorna** (oppure **Carica estensione non compressa** selezionando la cartella `yt-no-blur`).
5. Clicca sull'icona di **YT No Blur** nella barra delle estensioni per aprire il menu popup e personalizzare i moduli!

---

## 📄 Licenza

Distribuito sotto licenza MIT.
