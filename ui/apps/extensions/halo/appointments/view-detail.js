define("extensions/halo/appointments/view-detail", ["io.ox/calendar/view-detail", "css!io.ox/calendar/style.css"], function (viewer) {
    function show(data) {
        
        var app = ox.ui.createApp({
            title: data.title
        });
        
        app.setLauncher(function () {
            
            var win = ox.ui.createWindow({});
            win.nodes.main.css("overflow", "auto");
            
            app.setWindow(win);
            win.setQuitOnClose(true);
            
            win.nodes.main.append(viewer.draw(data));
            
            win.show();
        });
        
        
        app.launch();
    }
    
    return {
        show: show
    };
});