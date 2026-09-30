const Terminal = window.Terminal;
const FitAddon = window.FitAddon.FitAddon;


/* =========================================================
   ELEMENTS
========================================================= */

const terminalContainer =
    document.getElementById("terminal-container");

const tabsContainer =
    document.getElementById("tabs");

const newTabButton =
    document.getElementById("new-tab");

const profileSelect =
    document.getElementById("profile");

const settingsButton =
    document.getElementById("settings-button");

const settingsOverlay =
    document.getElementById("settings-overlay");

const settingsClose =
    document.getElementById("settings-close");

const usageGuideOpen =
    document.getElementById("usage-guide-open");

const usageGuideOverlay =
    document.getElementById("usage-guide-overlay");

const usageGuideClose =
    document.getElementById("usage-guide-close");

const modeSelect =
    document.getElementById("mode-select");

const layoutSelect =
    document.getElementById("terminal-layout");

const resetSettingsButton =
    document.getElementById("reset-settings");

const minimizeButton =
    document.getElementById("minimize");

const maximizeButton =
    document.getElementById("maximize");

const closeButton =
    document.getElementById("close");

const clockElement =
    document.getElementById("clock");

const terminalSizeElement =
    document.getElementById("terminal-size");


/* =========================================================
   STATE
========================================================= */

let nextWorkspaceId = 1;

const workspaces = [];

const closingWorkspaceIds =
    new Set();

const prefersReducedMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)");


function animateIn(element, keyframes) {

    if (
        !element ||
        prefersReducedMotion.matches ||
        typeof element.animate !== "function"
    ) {
        return;
    }

    const animation =
        element.animate(
            keyframes || [
                { opacity: 0, transform: "translateY(8px) scale(.985)" },
                { opacity: 1, transform: "translateY(0) scale(1)" }
            ],
            {
                duration: 180,
                easing: "cubic-bezier(.2, .8, .2, 1)"
            }
        );

    animation.onfinish =
        () => animation.cancel();
}


function animateOut(element, keyframes) {

    if (
        !element ||
        prefersReducedMotion.matches ||
        typeof element.animate !== "function"
    ) {
        return Promise.resolve();
    }

    return element.animate(
        keyframes || [
            { opacity: 1, transform: "translateY(0) scale(1)" },
            { opacity: 0, transform: "translateY(-5px) scale(.985)" }
        ],
        {
            duration: 150,
            easing: "cubic-bezier(.4, 0, 1, 1)"
        }
    ).finished.catch(() => {});
}

function normalizePaneCount(layout) {

    if (layout === "tabs") {
        return 1;
    }

    if (layout === "split4") {
        return 4;
    }

    const paneCount =
        Number(layout);

    if (!Number.isInteger(paneCount)) {
        return 1;
    }

    return Math.max(
        1,
        Math.min(4, paneCount)
    );
}


function createWorkspaceState(layout = 1) {

    const workspace = {
        id: nextWorkspaceId,
        title: `Tab ${nextWorkspaceId}`,
        terminals: [],
        activeTerminalId: null,
        layout: normalizePaneCount(layout),
        animateIn: false
    };

    nextWorkspaceId += 1;
    workspaces.push(workspace);

    return workspace;
}


let activeWorkspace =
    createWorkspaceState(
        localStorage.getItem("rigorago-layout") || 1
    );

let terminals =
    activeWorkspace.terminals;

let activeTerminalId =
    activeWorkspace.activeTerminalId;

let currentLayout =
    activeWorkspace.layout;

let defaultFontSize =
    Math.max(
        8,
        Math.min(
            32,
            parseInt(
                localStorage.getItem("rigorago-font-size"),
                10
            ) || 14
        )
    );

const RESET_FONT_SIZE = 14;


function syncActiveWorkspace() {

    if (!activeWorkspace) {
        return;
    }

    activeWorkspace.terminals =
        terminals;

    activeWorkspace.activeTerminalId =
        activeTerminalId;

    activeWorkspace.layout =
        currentLayout;
}


function getAllTerminals() {

    return workspaces.reduce(
        (allTerminals, workspace) =>
            allTerminals.concat(workspace.terminals),
        []
    );
}

const storedTheme =
    localStorage.getItem("rigorago-theme");

let currentMode =
    localStorage.getItem("rigorago-mode") ||
    (storedTheme === "light" ? "light" : "dark");

const themes = {

    dark: {
        accent: "#f2f2f2",
        accentSoft: "rgba(255, 255, 255, .08)",
        accentBorder: "rgba(255, 255, 255, .22)",
        accentGlow: "rgba(255, 255, 255, .08)",
        appBg: "#111111",
        panel: "#1b1b1b",
        text: "#f2f2f2",
        muted: "#a3a3a3",
        danger: "#f2f2f2"
    },

    light: {
        accent: "#171717",
        accentSoft: "rgba(0, 0, 0, .06)",
        accentBorder: "rgba(0, 0, 0, .20)",
        accentGlow: "rgba(0, 0, 0, .08)",
        appBg: "#f1f1f1",
        panel: "#ffffff",
        text: "#171717",
        muted: "#666666",
        danger: "#171717"
    }
};


/* =========================================================
   APPLY THEME
========================================================= */

function applyTheme(mode) {

    if (mode !== "light" && mode !== "dark") {
        mode = "dark";
    }

    currentMode = mode;

    const theme =
        themes[mode];

    const root =
        document.documentElement;

    root.dataset.mode =
        mode;

    root.style.setProperty(
        "--accent",
        theme.accent
    );

    root.style.setProperty(
        "--accent-soft",
        theme.accentSoft
    );

    root.style.setProperty(
        "--accent-border",
        theme.accentBorder
    );

    root.style.setProperty(
        "--accent-glow",
        theme.accentGlow
    );

    root.style.setProperty(
        "--app-bg",
        theme.appBg
    );

    root.style.setProperty(
        "--panel",
        theme.panel
    );

    root.style.setProperty(
        "--text",
        theme.text
    );

    root.style.setProperty(
        "--muted",
        theme.muted
    );

    root.style.setProperty(
        "--danger",
        theme.danger
    );


    if (modeSelect) {
        modeSelect.value =
            mode;
    }


    localStorage.setItem(
        "rigorago-mode",
        mode
    );

    localStorage.removeItem("rigorago-theme");
    localStorage.removeItem("rigorago-theme-dark");
    localStorage.removeItem("rigorago-theme-light");


    updateTerminalThemes();
}


/* =========================================================
   TERMINAL THEME
========================================================= */

function getTerminalTheme() {

    const isLight =
        currentMode === "light";

    const theme =
        themes[currentMode];


    return {

        background:
            isLight ? "#ffffff" : "#111111",

        foreground:
            theme.text,

        cursor:
            theme.accent,

        selectionBackground:
            theme.accentSoft,

        black:
            isLight ? "#171717" : "#111111",

        brightBlack:
            theme.muted,

        red:
            theme.text,

        brightRed:
            theme.text,

        green:
            theme.accent,

        brightGreen:
            theme.accent,

        yellow:
            theme.text,

        brightYellow:
            theme.text,

        blue:
            theme.text,

        brightBlue:
            theme.text,

        magenta:
            theme.text,

        brightMagenta:
            theme.text,

        cyan:
            theme.text,

        brightCyan:
            theme.text,

        white:
            theme.text,

        brightWhite:
            theme.text

    };
}


/* =========================================================
   UPDATE TERMINAL THEMES
========================================================= */

function updateTerminalThemes() {

    const terminalTheme =
        getTerminalTheme();


    getAllTerminals().forEach(
        tab => {

            if (
                !tab ||
                !tab.terminal
            ) {
                return;
            }

            try {

                tab.terminal.options.theme =
                    terminalTheme;

            } catch {}

        }
    );
}


function resizeActiveFont(direction) {

    const active =
        terminals.find(
            tab => tab.id === activeTerminalId
        );

    if (!active) {
        return;
    }

    const nextSize =
        Math.max(
            8,
            Math.min(
                32,
                direction === 0
                    ? RESET_FONT_SIZE
                    : (active.fontSize || defaultFontSize) + direction * 2
            )
        );

    const buffer =
        active.terminal.buffer.active;

    const previousScroll = {
        atBottom:
            buffer.viewportY >= buffer.baseY,
        rowsFromBottom:
            buffer.baseY - buffer.viewportY
    };

    active.fontSize =
        nextSize;

    defaultFontSize =
        nextSize;

    localStorage.setItem(
        "rigorago-font-size",
        String(nextSize)
    );

    active.terminal.options.fontSize =
        nextSize;

    requestAnimationFrame(
        () => {
            fitTerminal(active);

            const nextBuffer =
                active.terminal.buffer.active;

            if (previousScroll.atBottom) {
                active.terminal.scrollToBottom();
            } else {
                active.terminal.scrollToLine(
                    Math.min(
                        nextBuffer.baseY,
                        Math.max(
                            0,
                            nextBuffer.baseY - previousScroll.rowsFromBottom
                        )
                    )
                );
            }

            active.terminal.focus();
        }
    );
}


function getFontSizeShortcut(event) {

    if (!event.ctrlKey || event.altKey || event.metaKey) {
        return null;
    }

    if (
        event.key === "+" ||
        event.key === "=" ||
        event.code === "NumpadAdd"
    ) {
        return 1;
    }

    if (
        event.key === "-" ||
        event.key === "_" ||
        event.code === "NumpadSubtract"
    ) {
        return -1;
    }

    if (
        event.key === "0" ||
        event.code === "Numpad0"
    ) {
        return 0;
    }

    return null;
}


/* =========================================================
   FOCUS TERMINAL
========================================================= */

function focusTerminal(tab) {

    if (
        !tab ||
        !tab.terminal
    ) {
        return;
    }


    try {

        tab.terminal.focus();

    } catch {}


    /*
     * Scroll dilakukan satu kali setelah
     * terminal mendapatkan fokus.
     */

    requestAnimationFrame(
        () => {

            try {

                tab.terminal.scrollToBottom();

            } catch {}

        }
    );
}


/* =========================================================
   CREATE TERMINAL
========================================================= */

async function createTerminal(
    profile = "powershell",
    fontSize = defaultFontSize
) {

    if (!Terminal) {

        console.error(
            "Xterm Terminal tidak ditemukan."
        );

        return null;
    }


    if (!FitAddon) {

        console.error(
            "Xterm FitAddon tidak ditemukan."
        );

        return null;
    }


    const terminal =
        new Terminal({

            cursorBlink:
                true,

            cursorStyle:
                "block",

            fontFamily:
                'Cascadia Mono, Consolas, "Courier New", monospace',

            fontSize:
                fontSize,

            convertEol:
                true,

            scrollback:
                5000,

            theme:
                getTerminalTheme()

        });


    const fitAddon =
        new FitAddon();


    terminal.loadAddon(
        fitAddon
    );


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "terminal-wrapper";


    terminalContainer.appendChild(
        wrapper
    );

    terminal.open(wrapper);

    const paneCloseButton =
        document.createElement("button");

    paneCloseButton.className =
        "terminal-pane-close";

    paneCloseButton.type =
        "button";

    paneCloseButton.title =
        "Close pane";

    paneCloseButton.setAttribute(
        "aria-label",
        "Close pane"
    );

    paneCloseButton.textContent =
        "×";

    paneCloseButton.addEventListener(
        "click",
        event => {
            event.preventDefault();
            event.stopPropagation();
            closePane(id);
        }
    );

    wrapper.appendChild(paneCloseButton);

    try {
        fitAddon.fit();
    } catch {}

    const cols =
        Math.max(20, terminal.cols || 100);

    const rows =
        Math.max(5, terminal.rows || 30);

    let id;

    try {
        id = await window.kaliterm.createTerminal(
            profile,
            cols,
            rows
        );
    } catch (error) {
        console.error("Gagal membuat terminal:", error);

        try {
            terminal.dispose();
        } catch {}

        wrapper.remove();
        return null;
    }

    const tab = {
        id,
        terminal,
        fitAddon,
        wrapper,
        profile,
        fontSize,
        resizeObserver: null
    };

    terminals.push(tab);

    tab.resizeObserver =
        new ResizeObserver(
            () => {
                if (
                    !tab.wrapper.classList.contains("active")
                ) {
                    return;
                }

                const bounds =
                    tab.wrapper.getBoundingClientRect();

                if (bounds.width <= 0 || bounds.height <= 0) {
                    return;
                }

                requestAnimationFrame(
                    () => fitTerminal(tab)
                );
            }
        );

    tab.resizeObserver.observe(
        wrapper
    );


    /* =====================================================
       TERMINAL INPUT
    ===================================================== */

    terminal.onData(
        data => {

            /*
             * Kirim input ke PTY.
             */

            window.kaliterm.write(
                id,
                data
            );


            /*
             * Hanya ENTER yang menyebabkan
             * terminal mengikuti prompt terbaru.
             */

            const isEnter =
                data.includes("\r") ||
                data.includes("\n");


            if (!isEnter) {

                try {

                    terminal.focus();

                } catch {}

                return;
            }


        }
    );


    /* =====================================================
       TERMINAL RESIZE
    ===================================================== */

    terminal.onResize(
        size => {

            window.kaliterm.resize(
                id,
                Math.max(
                    20,
                    size.cols
                ),
                Math.max(
                    5,
                    size.rows
                )
            );


            updateTerminalSize(
                tab
            );

        }
    );


    /* =====================================================
       CUSTOM KEYBOARD
    ===================================================== */

    terminal.attachCustomKeyEventHandler(
        event => {

            if (getFontSizeShortcut(event) !== null) {
                event.preventDefault();
                return false;
            }

            /*
             * Ctrl + Shift + T
             */

            if (
                event.ctrlKey &&
                event.shiftKey &&
                (event.key === "ArrowRight" ||
                    event.key === "ArrowLeft")
            ) {

                event.preventDefault();
                return false;
            }


            if (
                event.ctrlKey &&
                event.shiftKey &&
                event.key.toLowerCase() ===
                    "t"
            ) {

                event.preventDefault();

                return false;
            }


            /*
             * Ctrl + W
             */

            if (
                event.ctrlKey &&
                event.key.toLowerCase() ===
                    "w"
            ) {

                event.preventDefault();

                return false;
            }


            /*
             * Ctrl + Tab
             */

            if (
                event.ctrlKey &&
                event.key === "Tab"
            ) {

                event.preventDefault();

                return false;
            }


            return true;

        }
    );


    /* =====================================================
       TERMINAL CLICK
    ===================================================== */

    wrapper.addEventListener(
        "click",
        () => {

            activateTerminal(
                id
            );

        }
    );

    wrapper.addEventListener(
        "pointerenter",
        () => {
            activateTerminal(id);
        }
    );


    activateTerminal(
        id
    );


    updateTabs();


    /*
     * Tunggu sampai layout stabil.
     */

    setTimeout(
        () => {

            fitTerminal(
                tab
            );

            focusTerminal(
                tab
            );

        },
        100
    );


    return tab;
}


/* =========================================================
   DATA FROM PTY
========================================================= */

window.kaliterm.onData(
    payload => {

        if (!payload) {
            return;
        }


        const tab =
            getAllTerminals().find(
                item =>
                    item.id ===
                    payload.id
            );


        if (!tab) {
            return;
        }


        try {

            /*
             * Hanya tulis output.
             *
             * JANGAN scroll di sini.
             */

            tab.terminal.write(
                payload.data
            );

        } catch {}

    }
);


/* =========================================================
   TERMINAL EXIT
========================================================= */

window.kaliterm.onExit(
    payload => {

        if (!payload) {
            return;
        }


        const workspace =
            workspaces.find(
                item =>
                    item.terminals.some(
                        tab => tab.id === payload.id
                    )
            );

        if (!workspace) {
            return;
        }

        const index =
            workspace.terminals.findIndex(
                item =>
                    item.id ===
                    payload.id
            );


        const tab =
            workspace.terminals[index];

        if (tab.resizeObserver) {
            tab.resizeObserver.disconnect();
        }


        try {

            tab.terminal.dispose();

        } catch {}


        if (tab.wrapper) {

            tab.wrapper.remove();

        }


        workspace.terminals.splice(
            index,
            1
        );

        if (workspace.activeTerminalId === payload.id) {
            workspace.activeTerminalId =
                workspace.terminals.length > 0
                    ? workspace.terminals[
                        Math.min(index, workspace.terminals.length - 1)
                    ].id
                    : null;
        }

        if (workspace !== activeWorkspace) {
            updateTabs();
            return;
        }

        terminals =
            workspace.terminals;

        activeTerminalId =
            workspace.activeTerminalId;


        /*
         * Jangan membuat terminal baru
         * ketika terminal terakhir keluar.
         */

        if (terminals.length === 0) {
            updateTabs();

            if (terminalSizeElement) {
                terminalSizeElement.textContent =
                    "0 × 0";
            }

            return;
        }


        /*
         * Jika terminal aktif keluar,
         * aktifkan terminal lain.
         */

        if (activeTerminalId !== null) {
            activateTerminal(activeTerminalId);
        }


        updateTabs();

    }
);


/* =========================================================
   SCROLL TO BOTTOM
========================================================= */

function scrollToBottom(tab) {

    if (
        !tab ||
        !tab.terminal
    ) {
        return;
    }


    try {

        tab.terminal.scrollToBottom();

    } catch {}
}


/* =========================================================
   FIT TERMINAL
========================================================= */

function fitTerminal(tab) {

    if (
        !tab ||
        !tab.terminal ||
        !tab.fitAddon
    ) {
        return;
    }

        const effectiveFontSize =
            tab.fontSize || defaultFontSize;

    if (
        tab.terminal.options.fontSize !==
        effectiveFontSize
    ) {
        tab.terminal.options.fontSize =
            effectiveFontSize;
    }

    try {

        tab.fitAddon.fit();

    } catch {}


    try {

        window.kaliterm.resize(
            tab.id,
            Math.max(
                20,
                tab.terminal.cols
            ),
            Math.max(
                5,
                tab.terminal.rows
            )
        );

    } catch {}


    updateTerminalSize(
        tab
    );
}


/* =========================================================
   RESIZE TERMINAL
========================================================= */

function resizeTerminal(tab) {

    if (
        !tab ||
        !tab.terminal
    ) {
        return;
    }


    try {

        window.kaliterm.resize(
            tab.id,
            Math.max(
                20,
                tab.terminal.cols
            ),
            Math.max(
                5,
                tab.terminal.rows
            )
        );

    } catch {}
}


/* =========================================================
   UPDATE TERMINAL SIZE
========================================================= */

function updateTerminalSize(tab) {

    if (
        !terminalSizeElement ||
        !tab ||
        !tab.terminal
    ) {
        return;
    }


    terminalSizeElement.textContent =
        `${tab.terminal.cols} × ${tab.terminal.rows}`;
}


/* =========================================================
   CREATE NEW TAB
========================================================= */

async function setTerminalLayout(layout) {

    const nextLayout =
        normalizePaneCount(layout);

    if (
        terminals.length > nextLayout
    ) {
        const keepId =
            terminals.some(
                tab => tab.id === activeTerminalId
            )
                ? activeTerminalId
                : terminals[0].id;

        while (terminals.length > nextLayout) {
            const tabToClose =
                terminals.slice().reverse().find(
                    tab => tab.id !== keepId
                );

            if (!tabToClose) {
                break;
            }

            await animateOut(tabToClose.wrapper);
            closeTab(tabToClose.id);
        }

        activeTerminalId =
            keepId;
    }

    currentLayout =
        nextLayout;

    activeWorkspace.layout =
        currentLayout;

    localStorage.setItem(
        "rigorago-layout",
        currentLayout
    );

    if (layoutSelect) {
        layoutSelect.value =
            currentLayout;
    }

    terminalContainer.classList.toggle(
        "pane-grid",
        currentLayout > 1
    );

    for (let paneCount = 1; paneCount <= 4; paneCount += 1) {
        terminalContainer.classList.toggle(
            `pane-count-${paneCount}`,
            currentLayout === paneCount
        );
    }

    if (currentLayout > 1) {
        const profile =
            profileSelect ? profileSelect.value : "powershell";

        const fontSize =
            terminals.find(
                tab => tab.id === activeTerminalId
            )?.fontSize || defaultFontSize;

        while (terminals.length < currentLayout) {
            const tab =
                await createTerminal(profile, fontSize);

            if (!tab) {
                break;
            }
        }
    }

    if (activeTerminalId === null && terminals.length > 0) {
        activeTerminalId =
            terminals[0].id;
    }

    if (activeTerminalId !== null) {
        activateTerminal(activeTerminalId);
    }
}


async function adjustPaneCount(amount) {

    const paneCount =
        Math.max(
            1,
            Math.min(4, currentLayout + amount)
        );

    if (paneCount !== currentLayout) {
        await setTerminalLayout(paneCount);
    }
}


function getVisibleTerminals() {

    if (currentLayout === 1) {
        return terminals.filter(
            tab => tab.id === activeTerminalId
        );
    }

    return terminals.slice(
        0,
        currentLayout
    );
}


async function activateWorkspace(workspaceId) {

    const workspace =
        workspaces.find(
            item => item.id === workspaceId
        );

    if (!workspace) {
        return;
    }

    if (activeWorkspace?.id === workspace.id) {
        if (activeTerminalId !== null) {
            activateTerminal(activeTerminalId);
        }
        return;
    }

    syncActiveWorkspace();

    terminals.forEach(
        tab => tab.wrapper.remove()
    );

    activeWorkspace =
        workspace;

    terminals =
        workspace.terminals;

    activeTerminalId =
        workspace.activeTerminalId;

    currentLayout =
        workspace.layout;

    terminalContainer.classList.toggle(
        "pane-grid",
        currentLayout > 1
    );

    for (let paneCount = 1; paneCount <= 4; paneCount += 1) {
        terminalContainer.classList.toggle(
            `pane-count-${paneCount}`,
            currentLayout === paneCount
        );
    }

    if (layoutSelect) {
        layoutSelect.value =
            currentLayout;
    }

    terminals.forEach(
        tab => terminalContainer.appendChild(tab.wrapper)
    );

    updateTabs();

    const profile =
        profileSelect ? profileSelect.value : "powershell";

    if (currentLayout > 1) {
        const fontSize =
            terminals.find(
                tab => tab.id === activeTerminalId
            )?.fontSize || defaultFontSize;

        while (terminals.length < currentLayout) {
            const tab =
                await createTerminal(profile, fontSize);

            if (!tab) {
                break;
            }
        }
    } else if (terminals.length === 0) {
        await createTerminal(profile);
    }

    if (activeTerminalId === null && terminals.length > 0) {
        activeTerminalId =
            terminals[0].id;
    }

    if (activeTerminalId !== null) {
        activateTerminal(activeTerminalId);
    }

    const activeTab =
        terminals.find(
            tab => tab.id === activeTerminalId
        );

    if (activeTab && profileSelect) {
        profileSelect.value =
            activeTab.profile;
    }

    updateTabs();

    animateIn(
        terminalContainer,
        [
            { opacity: .55, transform: "translateX(8px)" },
            { opacity: 1, transform: "translateX(0)" }
        ]
    );
}


async function createNewTab() {

    const workspace =
        createWorkspaceState(1);

    workspace.animateIn =
        true;

    await activateWorkspace(workspace.id);
}


/* =========================================================
   ACTIVATE TERMINAL
========================================================= */

function activateTerminal(id) {

    activeTerminalId =
        id;

    const focusedTerminal =
        terminals.find(
            tab => tab.id === id
        );

    if (activeWorkspace) {
        activeWorkspace.activeTerminalId =
            id;
    }

    if (focusedTerminal && profileSelect) {
        profileSelect.value =
            focusedTerminal.profile;
    }

    const visibleIds =
        new Set(
            getVisibleTerminals().map(
                tab => tab.id
            )
        );


    terminals.forEach(
        tab => {

            const wasVisible =
                tab.wrapper.classList.contains("active");

            const visible =
                visibleIds.has(tab.id);


            tab.wrapper.classList.toggle(
                "active",
                visible
            );

            tab.wrapper.classList.toggle(
                "focused",
                tab.id === id
            );

            if (visible && !wasVisible) {
                animateIn(tab.wrapper);
            }


            if (visible) {

                fitTerminal(tab);


                if (tab.id === id) {
                    try {

                        tab.terminal.focus();

                    } catch {}
                }

            }

        }
    );


    updateTabs();
}


/* =========================================================
   CLOSE TAB
========================================================= */

function closeTab(id) {

    const index =
        terminals.findIndex(
            item =>
                item.id === id
        );


    if (index === -1) {
        return;
    }


    const tab =
        terminals[index];

    if (tab.resizeObserver) {
        tab.resizeObserver.disconnect();
    }


    const wasActive =
        activeTerminalId === id;


    try {

        window.kaliterm.closeTerminal(
            id
        );

    } catch {}


    try {

        tab.terminal.dispose();

    } catch {}


    if (tab.wrapper) {

        tab.wrapper.remove();

    }


    terminals.splice(
        index,
        1
    );


    /*
     * Semua tab ditutup.
     */

    if (
        terminals.length === 0
    ) {

        activeTerminalId =
            null;

        if (activeWorkspace) {
            activeWorkspace.activeTerminalId =
                null;
        }


        updateTabs();


        if (terminalSizeElement) {

            terminalSizeElement.textContent =
                "0 × 0";

        }


        return;
    }


    /*
     * Jika tab aktif ditutup,
     * pindahkan ke tab terdekat.
     */

    if (wasActive) {

        const nextIndex =
            Math.min(
                index,
                terminals.length - 1
            );


        activateTerminal(
            terminals[nextIndex].id
        );

    }


    updateTabs();
}


/* =========================================================
   CLOSE ACTIVE TAB
========================================================= */

function closeActiveTab() {

    if (!activeWorkspace) {
        return;
    }

    if (currentLayout > 1) {
        closePane(activeTerminalId);
        return;
    }

    closeWorkspace(activeWorkspace.id);
}


async function closePane(id) {

    if (currentLayout <= 1 || id === null) {
        return;
    }

    const closingPane =
        terminals.find(
            tab => tab.id === id
        );

    if (!closingPane) {
        return;
    }

    await animateOut(closingPane.wrapper);

    closeTab(id);

    const paneCount =
        Math.max(
            1,
            Math.min(currentLayout, terminals.length)
        );

    setTerminalLayout(paneCount);
}


async function closeWorkspace(workspaceId) {

    if (
        workspaces.length <= 1 ||
        closingWorkspaceIds.has(workspaceId)
    ) {
        return;
    }

    const index =
        workspaces.findIndex(
            workspace => workspace.id === workspaceId
        );

    if (index === -1) {
        return;
    }

    const workspace =
        workspaces[index];

    closingWorkspaceIds.add(workspaceId);

    const workspaceTab =
        tabsContainer.querySelector(
            `[data-workspace-id="${workspaceId}"]`
        );

    const closingAnimations = [
        animateOut(workspaceTab)
    ];

    if (activeWorkspace?.id === workspaceId) {
        closingAnimations.push(
            animateOut(
                terminalContainer,
                [
                    { opacity: 1, transform: "translateX(0)" },
                    { opacity: 0, transform: "translateX(-8px)" }
                ]
            )
        );
    }

    await Promise.all(closingAnimations);

    workspace.terminals.forEach(
        tab => {
            if (tab.resizeObserver) {
                tab.resizeObserver.disconnect();
            }

            try {
                window.kaliterm.closeTerminal(tab.id);
            } catch {}

            try {
                tab.terminal.dispose();
            } catch {}

            tab.wrapper.remove();
        }
    );

    workspaces.splice(index, 1);
    closingWorkspaceIds.delete(workspaceId);

    if (activeWorkspace?.id === workspaceId) {
        activeWorkspace = null;
        terminals = [];
        activeTerminalId = null;

        const nextWorkspace =
            workspaces[
                Math.min(index, workspaces.length - 1)
            ];

        await activateWorkspace(nextWorkspace.id);
        return;
    }

    updateTabs();
}


/* =========================================================
   NEXT TAB
========================================================= */

function switchNextTab() {

    if (
        workspaces.length < 2
    ) {
        return;
    }


    const index =
        workspaces.findIndex(
            workspace =>
                workspace.id === activeWorkspace?.id
        );


    if (index === -1) {
        return;
    }


    const nextIndex =
        (index + 1) %
        workspaces.length;


    activateWorkspace(
        workspaces[nextIndex].id
    );
}


/* =========================================================
   SHELL NAME
========================================================= */

function getShellName(profile) {

    if (
        profile === "cmd"
    ) {

        return "CMD";

    }

    return "PowerShell";
}


/* =========================================================
   SHELL ICON
========================================================= */

function getShellIcon(profile) {

    if (
        profile === "cmd"
    ) {

        return "C:\\>";

    }

    return ">_";
}


/* =========================================================
   UPDATE TABS
========================================================= */

function updateTabs() {

    if (!tabsContainer) {
        return;
    }


    tabsContainer.innerHTML =
        "";


    workspaces.forEach(
        workspace => {

            const tabElement =
                document.createElement(
                    "div"
                );

            tabElement.dataset.workspaceId =
                String(workspace.id);


            tabElement.className =
                "tab";


            if (
                workspace.id ===
                activeWorkspace?.id
            ) {

                tabElement.classList.add(
                    "active"
                );

            }


            const dot =
                document.createElement(
                    "span"
                );


            dot.className =
                "tab-dot";


            const icon =
                document.createElement(
                    "span"
                );


            icon.className =
                "shell-icon";


            icon.textContent =
                workspace.layout > 1
                    ? `${workspace.layout}×`
                    : ">_";


            const title =
                document.createElement(
                    "span"
                );


            title.className =
                "tab-title";


            title.textContent =
                workspace.title;


            let closeButton = null;

            if (workspaces.length > 1) {
                closeButton =
                    document.createElement("button");

                closeButton.className =
                    "tab-close";

                closeButton.type =
                    "button";

                closeButton.title =
                    "Close workspace";

                closeButton.setAttribute(
                    "aria-label",
                    `Close ${workspace.title}`
                );

                closeButton.textContent =
                    "×";

                closeButton.addEventListener(
                    "click",
                    event => {
                        event.preventDefault();
                        event.stopPropagation();
                        closeWorkspace(workspace.id);
                    }
                );

            }

            tabElement.appendChild(
                dot
            );

            tabElement.appendChild(
                icon
            );

            tabElement.appendChild(
                title
            );

            if (closeButton) {
                tabElement.appendChild(closeButton);
            }


            tabElement.addEventListener(
                "click",
                () => activateWorkspace(workspace.id)
            );


            tabsContainer.appendChild(
                tabElement
            );

            if (workspace.animateIn) {
                workspace.animateIn =
                    false;

                animateIn(
                    tabElement,
                    [
                        { opacity: 0, transform: "translateY(7px) scale(.96)" },
                        { opacity: 1, transform: "translateY(0) scale(1)" }
                    ]
                );
            }

        }
    );
}


/* =========================================================
   PROFILE SELECT
========================================================= */

if (profileSelect) {

    profileSelect.addEventListener(
        "change",
        async () => {

            const selectedProfile =
                profileSelect.value;


            /*
             * Belum ada terminal.
             */

            if (
                activeTerminalId === null
            ) {

                await createTerminal(
                    selectedProfile
                );

                return;
            }


            const index =
                terminals.findIndex(
                    item =>
                        item.id ===
                        activeTerminalId
                );


            if (index === -1) {
                return;
            }


            const oldTab =
                terminals[index];

            if (oldTab.resizeObserver) {
                oldTab.resizeObserver.disconnect();
            }


            const oldId =
                oldTab.id;


            /*
             * Tutup shell lama.
             */

            try {

                window.kaliterm.closeTerminal(
                    oldId
                );

            } catch {}


            try {

                oldTab.terminal.dispose();

            } catch {}


            if (oldTab.wrapper) {

                oldTab.wrapper.remove();

            }


            terminals.splice(
                index,
                1
            );


            /*
             * Buat shell baru.
             */

            const newTab =
                await createTerminal(
                    selectedProfile,
                    oldTab.fontSize
                );


            if (!newTab) {
                return;
            }


            /*
             * Pertahankan posisi tab.
             */

            const newIndex =
                terminals.findIndex(
                    item =>
                        item.id ===
                        newTab.id
                );


            if (
                newIndex !== -1 &&
                newIndex !== index
            ) {

                terminals.splice(
                    newIndex,
                    1
                );


                terminals.splice(
                    index,
                    0,
                    newTab
                );

            }


            activeTerminalId =
                newTab.id;


            updateTabs();


            activateTerminal(
                newTab.id
            );

        }
    );
}


/* =========================================================
   SETTINGS OPEN
========================================================= */

function openSettings() {

    if (!settingsOverlay) {
        return;
    }

    const wasHidden =
        settingsOverlay.classList.contains("hidden");

    settingsOverlay.classList.remove(
        "hidden"
    );

    if (wasHidden) {
        animateIn(
            settingsOverlay,
            [
                { opacity: 0 },
                { opacity: 1 }
            ]
        );

        animateIn(
            settingsOverlay.querySelector(".settings-panel"),
            [
                { opacity: 0, transform: "translateY(10px) scale(.97)" },
                { opacity: 1, transform: "translateY(0) scale(1)" }
            ]
        );
    }


    if (layoutSelect) {
        layoutSelect.value =
            currentLayout;
    }


}


/* =========================================================
   SETTINGS CLOSE
========================================================= */

async function closeSettings() {

    if (
        !settingsOverlay ||
        settingsOverlay.classList.contains("hidden") ||
        settingsOverlay.dataset.closing === "true"
    ) {
        return;
    }

    settingsOverlay.dataset.closing =
        "true";

    await Promise.all([
        animateOut(
            settingsOverlay,
            [{ opacity: 1 }, { opacity: 0 }]
        ),
        animateOut(
            settingsOverlay.querySelector(".settings-panel"),
            [
                { opacity: 1, transform: "translateY(0) scale(1)" },
                { opacity: 0, transform: "translateY(8px) scale(.98)" }
            ]
        )
    ]);

    settingsOverlay.classList.add(
        "hidden"
    );

    delete settingsOverlay.dataset.closing;


    const active =
        terminals.find(
            item =>
                item.id ===
                activeTerminalId
        );


    if (active) {

        try {

            active.terminal.focus();

        } catch {}

    }
}


function openUsageGuide() {

    if (!usageGuideOverlay) {
        return;
    }

    const wasHidden =
        usageGuideOverlay.classList.contains("hidden");

    usageGuideOverlay.classList.remove("hidden");

    if (wasHidden) {
        animateIn(
            usageGuideOverlay,
            [{ opacity: 0 }, { opacity: 1 }]
        );

        animateIn(
            usageGuideOverlay.querySelector(".guide-panel"),
            [
                { opacity: 0, transform: "translateY(10px) scale(.97)" },
                { opacity: 1, transform: "translateY(0) scale(1)" }
            ]
        );
    }

    if (usageGuideClose) {
        usageGuideClose.focus();
    }
}


async function closeUsageGuide() {

    if (
        !usageGuideOverlay ||
        usageGuideOverlay.classList.contains("hidden") ||
        usageGuideOverlay.dataset.closing === "true"
    ) {
        return;
    }

    usageGuideOverlay.dataset.closing =
        "true";

    await Promise.all([
        animateOut(
            usageGuideOverlay,
            [{ opacity: 1 }, { opacity: 0 }]
        ),
        animateOut(
            usageGuideOverlay.querySelector(".guide-panel"),
            [
                { opacity: 1, transform: "translateY(0) scale(1)" },
                { opacity: 0, transform: "translateY(8px) scale(.98)" }
            ]
        )
    ]);

    usageGuideOverlay.classList.add("hidden");
    delete usageGuideOverlay.dataset.closing;

    if (usageGuideOpen) {
        usageGuideOpen.focus();
    }
}


/* =========================================================
   SETTINGS BUTTON
========================================================= */

if (settingsButton) {

    settingsButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();

            openSettings();

        }
    );
}


/* =========================================================
   SETTINGS CLOSE BUTTON
========================================================= */

if (settingsClose) {

    settingsClose.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();

            closeSettings();

        }
    );
}


if (usageGuideOpen) {

    usageGuideOpen.addEventListener(
        "click",
        event => {
            event.preventDefault();
            openUsageGuide();
        }
    );
}


if (usageGuideClose) {

    usageGuideClose.addEventListener(
        "click",
        event => {
            event.preventDefault();
            closeUsageGuide();
        }
    );
}


if (usageGuideOverlay) {

    usageGuideOverlay.addEventListener(
        "click",
        event => {
            if (event.target === usageGuideOverlay) {
                closeUsageGuide();
            }
        }
    );
}


/* =========================================================
   SETTINGS OVERLAY CLICK
========================================================= */

if (settingsOverlay) {

    settingsOverlay.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                settingsOverlay
            ) {

                closeSettings();

            }

        }
    );
}


if (modeSelect) {

    modeSelect.addEventListener(
        "change",
        () => {
            const mode =
                modeSelect.value;

            applyTheme(mode);

        }
    );
}


if (layoutSelect) {

    layoutSelect.addEventListener(
        "change",
        () => {
            setTerminalLayout(layoutSelect.value);
        }
    );
}


/* =========================================================
   RESET SETTINGS
========================================================= */

if (resetSettingsButton) {

    resetSettingsButton.addEventListener(
        "click",
        () => {

            setTerminalLayout(1);

            applyTheme("dark");

            if (modeSelect) {

                modeSelect.value =
                    "dark";

            }


        }
    );
}


/* =========================================================
   WINDOW MINIMIZE
========================================================= */

if (minimizeButton) {

    minimizeButton.addEventListener(
        "click",
        () => {

            window.kaliterm.minimize();

        }
    );
}


/* =========================================================
   WINDOW MAXIMIZE
========================================================= */

if (maximizeButton) {

    maximizeButton.addEventListener(
        "click",
        () => {

            window.kaliterm.maximize();

        }
    );
}


/* =========================================================
   WINDOW CLOSE
========================================================= */

if (closeButton) {

    closeButton.addEventListener(
        "click",
        () => {

            window.kaliterm.close();

        }
    );
}


/* =========================================================
   NEW TAB
========================================================= */

if (newTabButton) {

    newTabButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();

            createNewTab();

        }
    );
}


/* =========================================================
   CLOCK
========================================================= */

function updateClock() {

    if (!clockElement) {
        return;
    }


    const now =
        new Date();


    const hours =
        String(
            now.getHours()
        ).padStart(
            2,
            "0"
        );


    const minutes =
        String(
            now.getMinutes()
        ).padStart(
            2,
            "0"
        );


    const seconds =
        String(
            now.getSeconds()
        ).padStart(
            2,
            "0"
        );


    clockElement.textContent =
        `${hours}:${minutes}:${seconds}`;
}


updateClock();


setInterval(
    updateClock,
    1000
);


/* =========================================================
   GLOBAL KEYBOARD SHORTCUTS
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        const fontSizeDirection =
            getFontSizeShortcut(event);

        const isTerminalTarget =
            event.target instanceof Element &&
            event.target.closest(".xterm");

        const isSettingsControl =
            !isTerminalTarget &&
            event.target instanceof Element &&
            event.target.closest(
                "input, select, textarea, [contenteditable='true']"
            );

        if (
            fontSizeDirection !== null &&
            !isSettingsControl
        ) {
            event.preventDefault();

            if (!event.repeat) {
                resizeActiveFont(fontSizeDirection);
            }

            return;
        }

        if (
            event.ctrlKey &&
            event.shiftKey &&
            (event.key === "ArrowRight" ||
                event.key === "ArrowLeft")
        ) {

            event.preventDefault();

            if (
                event.repeat
            ) {
                return;
            }

            adjustPaneCount(
                event.key === "ArrowRight" ? 1 : -1
            );

            return;
        }

        /*
         * Ctrl + Shift + T
         */

        if (
            event.ctrlKey &&
            event.shiftKey &&
            event.key.toLowerCase() ===
                "t"
        ) {

            event.preventDefault();

            if (event.repeat) {
                return;
            }

            createNewTab();

            return;
        }


        /*
         * Ctrl + W
         */

        if (
            event.ctrlKey &&
            event.key.toLowerCase() ===
                "w"
        ) {

            event.preventDefault();

            if (event.repeat) {
                return;
            }

            closeActiveTab();

            return;
        }


        /*
         * Ctrl + Tab
         */

        if (
            event.ctrlKey &&
            event.key === "Tab"
        ) {

            event.preventDefault();

            if (event.repeat) {
                return;
            }

            switchNextTab();

            return;
        }


        /*
         * Escape untuk Settings.
         */

        if (
            event.key === "Escape" &&
            usageGuideOverlay &&
            !usageGuideOverlay.classList.contains("hidden")
        ) {
            closeUsageGuide();
            return;
        }

        if (
            event.key === "Escape" &&
            settingsOverlay &&
            !settingsOverlay.classList.contains(
                "hidden"
            )
        ) {

            closeSettings();

        }

    }
);


/* =========================================================
   INITIALIZE
========================================================= */

async function initialize() {

    applyTheme(
        currentMode
    );


    if (layoutSelect) {
        layoutSelect.value =
            currentLayout;
    }


    /*
     * Buat terminal pertama.
     */

    await setTerminalLayout(currentLayout);

    if (terminals.length === 0) {
        const profile =
            profileSelect ? profileSelect.value : "powershell";

        await createTerminal(profile);
    }
}


/* =========================================================
   START
========================================================= */

initialize();