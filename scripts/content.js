const TITLE_SEL = '#global-nav-search';
const STYLE_ID = 'myext-page-style';
const HOST_ID = 'myext-host';

const HIDE_TIMELINE_CLASS = 'myext-hidden-mode';
const HIDE_MESSAGES_CLASS = 'myext-hide-messages';
const HIDE_NOTIFICATIONS_CLASS = 'myext-hide-notifications';

const TIMELINE_SELECTORS = [
    '.scaffold-finite-scroll',
    '.feed-new-update-pill'
];

const NOTIFICATION_SELECTORS = [
    '.notification-badge',
    '.msg-overlay-bubble-header__unread-count'
];

const MESSAGE_SELECTORS = [
    '.msg-convo-wrapper',
    '.msg-overlay-container'
];

// Sicherstellen, dass document.head existiert
function waitForHeadAndInjectStyles() {
    if (document.head) {
        injectPageStyles();
    } else {
        requestAnimationFrame(waitForHeadAndInjectStyles);
    }
}

// Klasse möglichst früh setzen, aber nur wenn <body> existiert
function waitForBodyAndApplyState() {
    if (document.body) {
        if (localStorage.getItem(HIDE_TIMELINE_CLASS) === '1') {
            document.body.classList.add(HIDE_TIMELINE_CLASS);
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

function injectPageStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;

    const messageSelectors = MESSAGE_SELECTORS
        .map(sel => `body.${HIDE_MESSAGES_CLASS} ${sel}`)
        .join(',\n');

    const notificationSelectors = NOTIFICATION_SELECTORS
        .map(sel => `body.${HIDE_NOTIFICATIONS_CLASS} ${sel}`)
        .join(',\n');

    const timelineSelectors = TIMELINE_SELECTORS
        .map(sel => `body.${HIDE_TIMELINE_CLASS} ${sel}`)
        .join(',\n');

    style.textContent = `
    ${messageSelectors} {
        opacity: 0 !important;
    }
    ${notificationSelectors} {
        opacity: 0 !important;
    }
    ${timelineSelectors} {
        opacity: 0 !important;
    }
    `;
    document.head.appendChild(style);
}

function createButtonStyleElement() {
    // 5. Eigenes Stylesheet ins Shadow DOM einfügen
    //    - So verhindern wir, dass das CSS der Seite unseren Button beeinflusst
    //    - Alles innerhalb von root ist isoliert
    const style = document.createElement('style');
    style.textContent = `
      button {
        all: initial;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        font-size: 18px;
        border-radius: 6px;
        border: 1px solid rgba(0,0,0,.12);
        background: rgba(0,0,0,.04);
        margin-right: 5px;
        cursor: pointer;
        user-select: none;
      }
      button:hover { background: rgba(0,0,0,.08); }
    `
    return style;
}

function createToggleButton(root, { className, title, visibleIcon, hiddenIcon }) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = title;
    btn.textContent = document.body.classList.contains(className) ? hiddenIcon : visibleIcon;

    btn.addEventListener('click', () => {
        const isNowHidden = document.body.classList.toggle(className);
        btn.textContent = isNowHidden ? hiddenIcon : visibleIcon;

        try {
            localStorage.setItem(className, isNowHidden ? '1' : '0');
        } catch (e) {
            console.warn('[myext] localStorage not available', e);
        }
    });


    root.appendChild(btn);
}

function init() {
    // 1. Versuchen, den Titel im DOM zu finden
    const titleEl = document.querySelector(TITLE_SEL);

    // 2. Wenn kein Titel gefunden wurde oder unser Button-Host schon existiert, nichts tun
    if (!titleEl || document.getElementById(HOST_ID)) return;

    // 3. Einen "Host" erzeugen:
    //    - Das ist ein <span>, den wir künstlich direkt neben den Titel einfügen
    //    - In diesen <span> setzen wir gleich einen Shadow Root (eine Art Mini-DOM-Insel)
    const host = document.createElement('span');
    host.id = HOST_ID;
    host.style.display = 'inline-block';
    host.style.verticalAlign = 'middle';
    host.style.marginLeft = '8px';
    titleEl.insertAdjacentElement('afterend', host);

    // 4. Shadow DOM erzeugen:
    //    - attachShadow() kapselt HTML/CSS vom Rest der Seite ab
    //    - mode: 'open' bedeutet, dass wir von außen (JS-Konsole) zugreifen können
    //      (bei 'closed' wäre der Shadow DOM versteckt)
    const root = host.attachShadow({ mode: 'open' });

    root.appendChild(createButtonStyleElement());

    createToggleButton(root, {
        className: HIDE_TIMELINE_CLASS,
        title: 'Timeline umschalten',
        visibleIcon: '👀',
        hiddenIcon: '🙈'
    })
    createToggleButton(root, {
        className: HIDE_NOTIFICATIONS_CLASS,
        title: 'Benachrichtungen umschalten',
        visibleIcon: '🔔',
        hiddenIcon: '🔕'
    })
    createToggleButton(root, {
        className: HIDE_MESSAGES_CLASS,
        title: 'Nachrichten umschalten',
        visibleIcon: '💬',
        hiddenIcon: '🚫'
    })
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
    // beobachten wir das DOM und rufen init() erneut auf.
    const mo = new MutationObserver(init);
    mo.observe(document.documentElement, { childList: true, subtree: true });
})();