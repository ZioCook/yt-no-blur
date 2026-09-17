# YT No Blur 🚀

Estensione per browser (Manifest V3) ultra-leggera (~3.7 KB) per Chrome/Chromium, progettata per disattivare tutti gli effetti di sfocatura (*blur*, *backdrop-filter*) e l'illuminazione cinematica (*Ambient Mode*) dall'interfaccia di YouTube. Sostituisce le trasparenze con sfondi solidi e opachi che si adattano dinamicamente sia al tema chiaro che al tema scuro.

Ottimizzata al massimo per PC datati e per chi desidera il minor consumo possibile di CPU, GPU e RAM durante l'utilizzo di YouTube.

---

## ✨ Caratteristiche principali

- **Zero effetti Blur & Backdrop-Filter**: neutralizza qualsiasi sfocatura (`backdrop-filter: none !important`) sia a livello di foglio di stile globale sia su stili inline.
- **Spegnimento totale Ambient Mode**: nasconde e blocca il calcolo di `#cinematics`, `ytd-cinematics` e canvas circostanti al player video, azzerando il carico GPU aggiuntivo.
- **Sfondi solidi & leggibili**:
  - Barra superiore (*masthead*) opaca e perfettamente leggibile.
  - Barra dei filtri/categorie (*chip bar*: "Tutti", "Musica", "Giochi", ecc.) con sfondo solido.
  - Menu e finestre di dialogo con colore di superficie elevata nativo.
- **Supporto automatico Dark / Light Mode**: sfrutta le variabili CSS native di YouTube (`--yt-spec-base-background`, `--yt-spec-raised-background`), garantendo coerenza estetica senza flickering.
- **Pieno supporto Fullscreen**: nessuna interferenza con la barra dei controlli video a schermo intero.
- **Compatibilità Shadow DOM**: inietta il foglio di stile in ogni componente Web e Shadow Root aperta via `adoptedStyleSheets` sincrono, con un unico `CSSStyleSheet` condiviso in memoria.
- **Resilienza SPA**: gestisce il passaggio da un video all'altro senza ricaricare la pagina (`yt-navigate-finish`, `popstate`).

---

## 🛠️ Architettura e File

L'estensione non ha dipendenze esterne ed è composta da soli 3 file:

- `manifest.json`: Manifest V3 minimale, permessi limitati esclusivamente a `youtube.com`.
- `styles.css`: Foglio di stile ad alte prestazioni con selettori universali e `:is()` per evitare dipendenze da classi CSS minificate o fragili.
- `content.js`: Script sincrono ultracompatto per Shadow DOM, hook su `attachShadow` e soppressione reattiva dell'Ambient Mode via MutationObserver.

---

## 📦 Installazione

1. Clona o scarica questa cartella:
   ```bash
   git clone https://github.com/ZioCook/yt-no-blur.git
   ```
2. Apri Google Chrome (o qualsiasi browser Chromium come Edge, Brave, Opera).
3. Vai all'indirizzo `chrome://extensions`.
4. Abilita la voce **Modalità sviluppatore** in alto a destra.
5. Clicca su **Carica estensione non compressa**.
6. Seleziona la cartella del progetto (`yt-no-blur`).
7. Apri [YouTube](https://www.youtube.com) e goditi un'interfaccia pulita, reattiva e senza sfocature!

---

## 📄 Licenza

Distribuito sotto licenza MIT. Libero per qualsiasi utilizzo e modifica.
