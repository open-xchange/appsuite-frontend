define("plugins/liberty/generic/main", function () {
    "use strict";

    // application object
    var app = ox.ui.createApp({ name: 'plugins/liberty/generic' }),
        // app window
        win;
    // launcher
    app.setLauncher(function (entry) {
        if (!entry) {
            return;
        }
        // get window
        app.setWindow(win = ox.ui.createWindow({
            name: entry.url,
            title: entry.name,
            toolbar: false,
            search: false
        }));

        win.nodes.title.hide();

        win.show(function () {
            console.log("NODES:", win.nodes, "ENTRY", entry);
            win.nodes.body.css({
                top: '0px'
            });
            win.nodes.head.hide();

            win.nodes.main.append(
                $("<iframe>", {
                    src: entry.url,
                    width: "100%",
                    height: "100%",
                    frameBorder: 0
                })
            );
        });
    });

    return {
        getApp: app.getInstance
    };
});