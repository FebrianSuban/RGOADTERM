const {
    contextBridge,
    ipcRenderer
} = require("electron");


contextBridge.exposeInMainWorld(
    "kaliterm",
    {

        createTerminal:
            (
                profile,
                cols,
                rows
            ) => {

                return ipcRenderer.invoke(
                    "terminal:create",
                    {
                        profile,
                        cols,
                        rows
                    }
                );

            },


        write:
            (
                id,
                data
            ) => {

                ipcRenderer.send(
                    "terminal:input",
                    {
                        id,
                        data
                    }
                );

            },


        resize:
            (
                id,
                cols,
                rows
            ) => {

                ipcRenderer.send(
                    "terminal:resize",
                    {
                        id,
                        cols,
                        rows
                    }
                );

            },


        closeTerminal:
            id => {

                ipcRenderer.send(
                    "terminal:close",
                    id
                );

            },


        onData:
            callback => {

                ipcRenderer.on(
                    "terminal:data",
                    (
                        _event,
                        payload
                    ) => {

                        callback(payload);

                    }
                );

            },


        onExit:
            callback => {

                ipcRenderer.on(
                    "terminal:exit",
                    (
                        _event,
                        payload
                    ) => {

                        callback(payload);

                    }
                );

            },


        minimize:
            () => {

                ipcRenderer.send(
                    "window:minimize"
                );

            },


        maximize:
            () => {

                ipcRenderer.send(
                    "window:maximize"
                );

            },


        close:
            () => {

                ipcRenderer.send(
                    "window:close"
                );

            }

    }
);