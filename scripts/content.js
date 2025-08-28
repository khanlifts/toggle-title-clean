const HIDE_MESSAGES_CLASS = 'myext-hide-messages';
const TITLE_SEL = '#global-nav-search';

const TIMELINE_SELECTORS = [
    '.scaffold-finite-scroll'
];

const MESSAGE_SELECTORS = [
    '.msg-convo-wrapper',
    '.msg-overlay-container'
];

const HIDDEN_CLASS = 'myext-hidden-mode';
const STYLE_ID = 'myext-page-style';
const HOST_ID = 'myext-host';

const HIDE_NOTIFICATIONS_CLASS = 'myext-hide-notifications';
const NOTIFICATION_SELECTORS = [
    '.notification-badge',
    '.msg-overlay-bubble-header__unread-count'
];

// Sicherstellen, dass document.head existiert
function waitForHeadAndInjectStyles() {
    if (document.head) {
        injectPageStyles();
    } else {
        requestAnimationFrame(waitForHeadAndInjectStyles);
    }
}

// Neuer: Klasse möglichst früh setzen, aber nur wenn <body> existiert
function waitForBodyAndApplyState() {
    if (document.body) {
        if (localStorage.getItem('myext-hidden-mode') === '1') {
            document.body.classList.add('myext-hidden-mode');
        }
        if (localStorage.getItem(HIDE_NOTIFICATIONS_CLASS) === '1') {
            document.body.classList.add(HIDE_NOTIFICATIONS_CLASS);
        }
        if (localStorage.getItem(HIDE_MESSAGES_CLASS) === '1') {
            document.body.classList.add(HIDE_MESSAGES_CLASS);
        }
    } else {
        requestAnimationFrame(waitForBodyAndApplyState);
    }
}

// Initialer Aufruf, wenn DOM fertig ist
function init() {
    placeOnce();
}

function injectPageStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;

    const messageSelectors = MESSAGE_SELECTORS
        .map(sel => `body.${HIDE_MESSAGES_CLASS} ${sel}`)
        .join(',\n');

    const notifSelectors = NOTIFICATION_SELECTORS
        .map(sel => `body.${HIDE_NOTIFICATIONS_CLASS} ${sel}`)
        .join(',\n');

    const timelineSelectors = TIMELINE_SELECTORS
        .map(sel => `body.${HIDDEN_CLASS} ${sel}`)
        .join(',\n');

    style.textContent = `
    ${messageSelectors} {
        display: none !important;
    }
    ${notifSelectors} {
        display: none !important;
    }
    ${timelineSelectors} {
        display: none !important;
    }
    `;
    document.head.appendChild(style);
}

function createSimpleButton(root, emoji = '❓', title = 'Zweiter Button') {
    // 6. Den eigentlichen Button erzeugen und ins Shadow DOM setzen
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = title; // Tooltip bei Hover
    btn.textContent = emoji;           // Unser Emoji (vorerst nur statisch)
    root.appendChild(btn);
}

function createButtonStyleElement() {
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
    return style;
}

function createNotificationToggleButton(root) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = 'Benachrichtigungen umschalten';
    btn.textContent = '🔔';
    btn.addEventListener('click', () => {
        const isNowHidden = document.body.classList.toggle(HIDE_NOTIFICATIONS_CLASS);
        btn.textContent = isNowHidden ? '🔕' : '🔔';

        try {
            localStorage.setItem('myext-hide-notifications', isNowHidden ? '1' : '0');
        } catch (e) {
            console.warn('[myext] localStorage not available', e);
        }
    });

    // Zustand initial setzen (richtiges Emoji)
    btn.textContent = document.body.classList.contains(HIDE_NOTIFICATIONS_CLASS) ? '🔕' : '🔔';

    root.appendChild(btn);
}

function createMessageToggleButton(root) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = 'Nachrichten umschalten';
    btn.textContent = '💬';
    btn.addEventListener('click', () => {
        const isNowHidden = document.body.classList.toggle(HIDE_MESSAGES_CLASS);
        btn.textContent = isNowHidden ? '🚫' : '💬';

        try {
            localStorage.setItem('myext-hide-messages', isNowHidden ? '1' : '0');
        } catch (e) {
            console.warn('[myext] localStorage not available', e);
        }
    });

    btn.textContent = document.body.classList.contains(HIDE_MESSAGES_CLASS) ? '🚫' : '💬';

    root.appendChild(btn);
}


function createTimelineToggleButton(root) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = 'Timeline umschalten';
    btn.textContent = '👀';
    btn.addEventListener('click', () => {
        const isNowHidden = document.body.classList.toggle(HIDDEN_CLASS);
        btn.textContent = isNowHidden ? '🙈' : '👀';

        try {
            localStorage.setItem(HIDDEN_CLASS, isNowHidden ? '1' : '0');
        } catch (e) {
            console.warn('[myext] localStorage not available', e);
        }
    });

    btn.textContent = document.body.classList.contains(HIDDEN_CLASS) ? '🙈' : '👀';

    root.appendChild(btn);
}

function placeOnce() {
    // 1. Versuchen, den Titel im DOM zu finden
    const titleEl = document.querySelector(TITLE_SEL);

    // 2. Wenn kein Titel gefunden wurde oder unser Button-Host schon existiert, nichts tun
    if (!titleEl || document.getElementById(HOST_ID)) return;

    // Zustand aus localStorage lesen
    const wasHidden = localStorage.getItem('myext-hidden-mode') === '1';
    if (wasHidden) {
        document.body.classList.add(HIDDEN_CLASS);
    }

    // 3. Einen "Host" erzeugen:
    //    - Das ist ein <span>, den wir künstlich direkt neben den Titel einfügen
    //    - In diesen <span> setzen wir gleich einen Shadow Root (eine Art Mini-DOM-Insel)
    const host = document.createElement('span');
    host.id = HOST_ID;
    host.style.display = 'inline-block';   // damit der Button nicht verrutscht
    host.style.verticalAlign = 'middle';   // optisch mittig am Titel ausgerichtet
    host.style.marginLeft = '8px';         // kleiner Abstand zum Titel
    titleEl.insertAdjacentElement('afterend', host); // direkt nach dem Titel einfügen

    // 4. Shadow DOM erzeugen:
    //    - attachShadow() kapselt HTML/CSS vom Rest der Seite ab
    //    - mode: 'open' bedeutet, dass wir von außen (JS-Konsole) zugreifen können
    //      (bei 'closed' wäre der Shadow DOM versteckt)
    const root = host.attachShadow({ mode: 'open' });

    root.appendChild(createButtonStyleElement());

    createNotificationToggleButton(root);
    createMessageToggleButton(root);
    createTimelineToggleButton(root);
}


(function () {
    waitForHeadAndInjectStyles();

    waitForBodyAndApplyState();

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