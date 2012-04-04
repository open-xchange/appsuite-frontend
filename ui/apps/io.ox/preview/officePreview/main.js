define("io.ox/preview/officePreview/main", function () {
    "use strict";
    
    function createInstance() {
        var app, win;
        
        app = ox.ui.createApp({
            name: 'io.ox/preview/officePreview',
            title: 'Preview'
        });
        
        app.setLauncher(function () {
            win = ox.ui.createWindow({
                name: 'io.ox/mail/write',
                title: '',
                titleWidth: (app.getView().GRID_WIDTH + 10) + 'px',
                toolbar: true,
                close: true
            });
            
            app.setWindow(win);
        });
        
        return app;
    }
    
    return {
        getApp: createInstance
    };
});