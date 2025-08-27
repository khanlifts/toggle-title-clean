// content.js – Schritt 2: Shadow-Container + Button ohne Funktion
(function () {
    // CSS-Selektor, um den Titel zu finden (z. B. "Chrome for Developers")
    const TITLE_SEL = '#global-nav-search';
    const HIDE_SELECTORS = [
        '.notification-badge',
        '.msg-convo-wrapper',
        '.msg-overlay-bubble-header__unread-count',
        '.msg-overlay-container'
    ];

    const HIDDEN_CLASS = 'myext-hidden-mode';

    // Sicherstellen, dass document.head existiert
    function waitForHeadAndInjectStyles() {
        if (document.head) {
            injectPageStyles();
        } else {
            requestAnimationFrame(waitForHeadAndInjectStyles);
        }
    }

    waitForHeadAndInjectStyles(); // ✅ Neuer, sicherer Aufruf

    // Neuer: Klasse möglichst früh setzen, aber nur wenn <body> existiert
    function waitForBodyAndApplyState() {
        if (document.body) {
            if (localStorage.getItem('myext-hidden-mode') === '1') {
                document.body.classList.add('myext-hidden-mode');
            }
        } else {
            requestAnimationFrame(waitForBodyAndApplyState);
        }
    }
    waitForBodyAndApplyState();

    function placeOnce() {
        // 1. Versuchen, den Titel im DOM zu finden
        const titleEl = document.querySelector(TITLE_SEL);

        // 2. Wenn kein Titel gefunden wurde oder unser Button-Host schon existiert, nichts tun
        if (!titleEl || document.getElementById('myext-host')) return;

        // Zustand aus localStorage lesen
        const wasHidden = localStorage.getItem('myext-hidden-mode') === '1';
        if (wasHidden) {
            document.body.classList.add(HIDDEN_CLASS);
        }

        // 3. Einen "Host" erzeugen:
        //    - Das ist ein <span>, den wir künstlich direkt neben den Titel einfügen
        //    - In diesen <span> setzen wir gleich einen Shadow Root (eine Art Mini-DOM-Insel)
        const host = document.createElement('span');
        host.id = 'myext-host';
        host.style.display = 'inline-block';   // damit der Button nicht verrutscht
        host.style.verticalAlign = 'middle';   // optisch mittig am Titel ausgerichtet
        host.style.marginLeft = '8px';         // kleiner Abstand zum Titel
        titleEl.insertAdjacentElement('afterend', host); // direkt nach dem Titel einfügen

        // 4. Shadow DOM erzeugen:
        //    - attachShadow() kapselt HTML/CSS vom Rest der Seite ab
        //    - mode: 'open' bedeutet, dass wir von außen (JS-Konsole) zugreifen können
        //      (bei 'closed' wäre der Shadow DOM versteckt)
        const root = host.attachShadow({ mode: 'open' });

        // 5. Eigenes Stylesheet ins Shadow DOM einfügen
        //    - So verhindern wir, dass das CSS der Seite unseren Button beeinflusst
        //    - Alles innerhalb von root ist isoliert
        const style = document.createElement('style');
        style.textContent = `
      button {
        all: initial;                      /* alle Standard-Styles zurücksetzen */
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        font-size: 18px;
        border-radius: 6px;
        border: 1px solid rgba(0,0,0,.12);
        background: rgba(0,0,0,.04);
        cursor: pointer;
        user-select: none;
      }
      button:hover { background: rgba(0,0,0,.08); }
    `
        root.appendChild(style);

        // 6. Den eigentlichen Button erzeugen und ins Shadow DOM setzen
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.title = 'Ansicht umschalten'; // Tooltip bei Hover
        btn.textContent = '👀';           // Unser Emoji (vorerst nur statisch)
        btn.addEventListener('click', () => {
            const isNowHidden = document.body.classList.toggle(HIDDEN_CLASS);
            btn.textContent = isNowHidden ? '🙈' : '👀';

            // Zustand speichern
            try {
                localStorage.setItem('myext-hidden-mode', isNowHidden ? '1' : '0');
            } catch (e) {
                console.warn('[myext] localStorage not available', e);
            }
        });
        root.appendChild(btn);

        btn.textContent = document.body.classList.contains(HIDDEN_CLASS) ? '🙈' : '👀';
    }

    // Initialer Aufruf, wenn DOM fertig ist
    function init() {
        placeOnce();
    }

    function injectPageStyles() {
        if (document.getElementById('myext-page-style')) return;

        const style = document.createElement('style');
        style.id = 'myext-page-style';

        const combinedSelectors = HIDE_SELECTORS
            .map(sel => `body.${HIDDEN_CLASS} ${sel}`)
            .join(',\n');

        style.textContent = `${combinedSelectors} { display: none !important; }`;
        document.head.appendChild(style);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Extra-Sicherung: Falls der Header erst später nachgeladen wird,
    // beobachten wir das DOM und rufen placeOnce() erneut auf.
    const mo = new MutationObserver(placeOnce);
    mo.observe(document.documentElement, { childList: true, subtree: true });
})();