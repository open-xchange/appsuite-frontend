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
            ox.base + '/apps/3rd.party/noms/images/noimg1.jpg',
            ox.base + '/apps/3rd.party/noms/images/noimg2.jpg',
            ox.base + '/apps/3rd.party/noms/images/noimg3.jpg',
            ox.base + '/apps/3rd.party/noms/images/noimg4.jpg',
            ox.base + '/apps/3rd.party/noms/images/noimg5.jpg'
        ];
        
        app.index = -1;
        
        app.nextImage = function () {
            app.index = app.index + 1;
            if (app.index === app.images.length) {
                app.index = 0;
            }
            win.nodes.main.empty();
            $("<img>", {src: app.images[app.index]}).appendTo(win.nodes.main);
            win.nodes.main.append("<br />");
            win.nodes.main.append($("<p>").text("Clicking anywhere will advance the mock picture. Please send Cisco some mock application pictures, though, if you want something more beautiful to look at than him..."));
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