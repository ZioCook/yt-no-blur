# YT No Blur 🚀 (v3.0.1)

Estensione Chromium (Manifest V3) modulare e ad alte prestazioni progettata per massimizzare le prestazioni di YouTube eliminando tutti i colli di bottiglia computazionali e visivi: **Ambient Mode**, **effetti blur**, **backdrop-filter**, **animazioni JS/CSS pesanti** e **anteprime video hover nei feed**, introducendo la **virtualizzazione del DOM via CSS** (`content-visibility: auto`) e un **menu popup con interruttori (toggles) ON/OFF in tempo reale**.

---

## ⚡ Novità della v3.0.1: Architettura a 2 Scope e Zero-RAF Loop

La v3.0.1 consolida le prestazioni estreme eliminando ogni instabilità residua:
- **Zero Loop RAF ($O(1)$ WAAPI):** eliminato qualsiasi monkeypatch su `document.timeline` e `Element.prototype.animate`. Le animazioni pesanti di YouTube (like animati Lottie, feedback touch Ink) vengono disattivate nativamente a monte dai flag in `window.ytcfg` (`ANIM_FLAGS`), preservando al 100% l'integrità del motore temporale del browser.
- **Architettura a 2 soli `@scope`:** i moduli a regole universali (`ytnb-no-blur` e `ytnb-fast-anim`) usano `@scope`, mentre i moduli mirati (2, 3 e 4) usano selettori di classe radice (`html.ytnb-* <tag/id>`), sfruttando l'indicizzazione nativa `id_rules_`/`tag_rules_` di Blink e i filtri di Bloom per azzerare l'overhead di `UpdateLayoutTree`.
- **Donut Scope puro a ID:** il confine delle animazioni del player video è esteso a tutti i player YouTube:
  ```css
  @scope (:root.ytnb-fast-anim) to (#movie_player, #c4-player, #shorts-player, #player-control-overlay)
  ```
  Grazie al fast-reject `!HasID()` sul ~90% dei nodi del DOM, il controllo di confine si arresta in un singolo ciclo CPU, lasciando intatti slider volume, dissolvenza controlli e menu impostazioni.

---

## 🏛️ Architettura Tecnica: Pattern "L1 Sync Cache + SSOT Async Reconciliation"

In Manifest V3 `chrome.storage.local` è asincrono. Per evitare qualsiasi race condition e garantire **zero FOUC (Flash of Unstyled Content)** fin da `t = 0 ns`:

```text
popup.js ──► chrome.storage.local.set() (SSOT)
                 │ (broadcast automatico Chromium a tutte le tab)
                 ▼
bridge.js (ISOLATED) ──► aggiorna cache L1 window.localStorage
                     ──► document.dispatchEvent(new CustomEvent('ytnb:sync', { detail: json }))
                 │ (sincrono cross-world)
                 ▼
content.js (MAIN)    ──► aggiorna state in memoria (hook JS live)
                     ──► toggle classi :root.ytnb-* (Light DOM live)
                     ──► shadowSheet.replaceSync() (TUTTI gli Shadow DOM live in O(1)!)
```

---

## 📂 Struttura File

```
yt-no-blur/
├── manifest.json   # Manifest V3 (Chrome 118+), action popup e storage
├── popup.html      # Interfaccia grafica popup adattiva Dark/Light
├── popup.css       # Stili nativi YouTube per il popup
├── popup.js        # Controller popup (scrittura su chrome.storage.local)
├── bridge.js       # Script ISOLATED: ponte storage SSOT -> cache L1 e live sync
├── styles.css      # CSS modulare a 2 scope con boundary ID puro
├── content.js      # Motore MAIN world (cache sincrona L1, Shadow DOM hook, ytcfg)
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
