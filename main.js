const {
    app,
    BrowserWindow,
    ipcMain
} = require("electron");

const path = require("path");
const pty = require("@lydell/node-pty");

let mainWindow = null;

const terminals = new Map();

let nextTerminalId = 1;

const hasSingleInstanceLock =
    app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
    app.quit();
} else {
    app.on(
        "second-instance",
        () => {
            if (!mainWindow) {
                return;
            }

            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }

            mainWindow.focus();
        }
    );
}


function createWindow() {

    mainWindow = new BrowserWindow({

        width: 1200,
        height: 760,

        minWidth: 800,
        minHeight: 500,

        frame: false,

        transparent: true,

        backgroundColor: "#00000000",

        resizable: true,

        webPreferences: {

            preload:
                path.join(
                    __dirname,
                    "preload.js"
                ),

            contextIsolation: true,

            nodeIntegration: false

        }

    });

    mainWindow.loadFile(
        path.join(
            __dirname,
            "renderer",
            "index.html"
        )
    );

    mainWindow.on(
        "closed",
        () => {

            for (
                const terminal
                of terminals.values()
            ) {

                try {
                    terminal.kill();
                } catch {}

            }

            terminals.clear();

            mainWindow = null;

        }
    );
}


function getShell(profile) {

    const systemRoot =
        process.env.SystemRoot ||
        "C:\\Windows";

    if (profile === "cmd") {

        return {

            command:
                path.join(
                    systemRoot,
                    "System32",
                    "cmd.exe"
                ),

            args: []

        };

    }

    return {

        command:
            path.join(
                systemRoot,
                "System32",
                "WindowsPowerShell",
                "v1.0",
                "powershell.exe"
            ),

        args: [
            "-NoLogo",
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass"
        ]

    };

}


function createTerminal(
    profile,
    cols = 100,
    rows = 30
) {

    const id =
        nextTerminalId++;

    const shell =
        getShell(profile);

    const terminal =
        pty.spawn(
            shell.command,
            shell.args,
            {

                name:
                    "xterm-256color",

                cols,

                rows,

                cwd:
                    process.env.USERPROFILE ||
                    process.cwd(),

                env: {
                    ...process.env,

                    TERM:
                        "xterm-256color",

                    COLORTERM:
                        "truecolor"
                }

            }
        );


    terminals.set(
        id,
        terminal
    );


    terminal.onData(
        data => {

            if (
                mainWindow &&
                !mainWindow.isDestroyed()
            ) {

                mainWindow.webContents.send(
                    "terminal:data",
                    {
                        id,
                        data
                    }
                );

            }

        }
    );


    terminal.onExit(
        event => {

            terminals.delete(id);

            if (
                mainWindow &&
                !mainWindow.isDestroyed()
            ) {

                mainWindow.webContents.send(
                    "terminal:exit",
                    {

                        id,

                        code:
                            event.exitCode,

                        signal:
                            event.signal

                    }
                );

            }

        }
    );


    return id;

}


ipcMain.handle(
    "terminal:create",
    (
        _event,
        payload
    ) => {

        const profile =
            payload?.profile ||
            "powershell";

        const cols =
            payload?.cols ||
            100;

        const rows =
            payload?.rows ||
            30;

        return createTerminal(
            profile,
            cols,
            rows
        );

    }
);


ipcMain.on(
    "terminal:input",
    (
        _event,
        payload
    ) => {

        if (!payload) {
            return;
        }

        const terminal =
            terminals.get(
                payload.id
            );

        if (!terminal) {
            return;
        }

        try {

            terminal.write(
                payload.data
            );

        } catch {}

    }
);


ipcMain.on(
    "terminal:resize",
    (
        _event,
        payload
    ) => {

        if (!payload) {
            return;
        }

        const terminal =
            terminals.get(
                payload.id
            );

        if (!terminal) {
            return;
        }

        try {

            terminal.resize(
                Math.max(
                    20,
                    payload.cols
                ),

                Math.max(
                    5,
                    payload.rows
                )
            );

        } catch {}

    }
);


ipcMain.on(
    "terminal:close",
    (
        _event,
        id
    ) => {

        const terminal =
            terminals.get(id);

        if (!terminal) {
            return;
        }

        try {

            terminal.kill();

        } catch {}

        terminals.delete(id);

    }
);


ipcMain.on(
    "window:minimize",
    () => {

        if (mainWindow) {
            mainWindow.minimize();
        }

    }
);


ipcMain.on(
    "window:maximize",
    () => {

        if (!mainWindow) {
            return;
        }

        if (
            mainWindow.isMaximized()
        ) {

            mainWindow.unmaximize();

        } else {

            mainWindow.maximize();

        }

    }
);


ipcMain.on(
    "window:close",
    () => {

        if (mainWindow) {
            mainWindow.close();
        }

    }
);


app.whenReady().then(
    () => {
        if (hasSingleInstanceLock) {
            createWindow();
        }
    }
);


app.on(
    "window-all-closed",
    () => {

        if (
            process.platform !==
            "darwin"
        ) {

            app.quit();

        }

    }
);