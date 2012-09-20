define("plugins/liberty/photoshop/main", function () {
    "use strict";
    
    // application object
    var app = ox.ui.createApp({ name: 'plugins/liberty/photoshop' }),
        // app window
        win;
    // launcher
    app.setLauncher(function () {

        // get window
        app.setWindow(win = ox.ui.createWindow({
            name: 'plugins/liberty/photoshop',
            title: "Photoshop",
            toolbar: false,
            search: false
        }));
        
        app.images = [
            ox.base + '/apps/plugins/liberty/images/Photoshop1.png',
            ox.base + '/apps/plugins/liberty/images/Photoshop2.png',
            ox.base + '/apps/plugins/liberty/images/Photoshop3.png'
        ];
        
        app.index = -1;
        
        app.nextImage = function () {
            app.index = app.index + 1;
            if (app.index === app.images.length) {
                app.index = 0;
            }
            win.nodes.main.empty();
            $("<img>", {src: app.images[app.index]}).appendTo(win.nodes.main);
        };
        

        win.show(function () {
            app.nextImage();
            win.nodes.main.on("click", function () {
                app.nextImage();
            });
        });
    });

    return {
        getApp: app.getInstance
    };
});