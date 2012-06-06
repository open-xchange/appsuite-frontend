define("3rd.party/noms/generic/main", function () {
    "use strict";
    
    // application object
    var app = ox.ui.createApp({ name: '3rd.party/noms/generic' }),
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
        

        win.show(function () {
            win.nodes.main.append(
                $("<iframe>", {
                    src: entry.url,
                    width: "100%",
                    height: "100%",
                    noBorder: true
                })
            );
        });
    });

    return {
        getApp: app.getInstance
    };
});