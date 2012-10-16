define("plugins/liberty/generic/main", function () {
    "use strict";

    var counter = 0;
    
    return {
        getApp: function () {
            // application object
            counter++;
            var app = ox.ui.createApp({ name: 'plugins/liberty/generic/' + counter }),
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
            return app.getInstance.apply(app, $.makeArray(arguments));
        }
    };
});