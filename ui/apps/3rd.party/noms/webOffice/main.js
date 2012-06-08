define("3rd.party/noms/webOffice/main", function () {
    "use strict";
    
    // application object
    var app = ox.ui.createApp({ name: '3rd.party/noms/webOffice' }),
        // app window
        win;
    // launcher
    app.setLauncher(function () {

        // get window
        app.setWindow(win = ox.ui.createWindow({
            name: '3rd.party/noms/webOffice',
            title: "Trve Office",
            toolbar: false,
            search: false
        }));
        
        app.images = [
            ox.base + '/apps/3rd.party/noms/images/office1.png',
            ox.base + '/apps/3rd.party/noms/images/office2.png'
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
            win.nodes.head.hide();
        });
    });

    return {
        getApp: app.getInstance
    };
});