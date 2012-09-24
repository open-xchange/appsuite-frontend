define("io.ox/demo/main", ["io.ox/core/tk/keys"], function (KeyListener) {
    
    "use strict";
    
    var demos = {
        "open sesame": function () {
            require(["plugins/liberty/register"]);
            return "Fujitsu Demo loaded.";
        }
    };
    
    
    // application object
    var app = ox.ui.createApp({ name: 'io.ox/demo' }),
        // app window
        win,
        formPane,
        // TextField
        input;
        
    // launcher
    app.setLauncher(function () {

        // get window
        app.setWindow(win = ox.ui.createWindow({
            name: 'io.ox/demo/main',
            title: "Demo Launcher",
            toolbar: false,
            search: false
        }));
        
        var loadDemo = function () {
            var demoKey = input.val();
            if (demos[demoKey]) {
                win.nodes.main.append($('<div class="row" style="padding-top:2em">')
                    .append($('<div class="span4">&nbsp;</div>'), $("<div class='span4 alert alert-info'>").text(demos[demoKey]()).fadeIn(), $('<div class="span4">&nbsp;</div>')));
            }
        };
        
        
        $('<div class="row">').append($('<div class="span4">&nbsp;</div>'), $('<div class="span4">').append($("<h1 style='padding-bottom:2em'>").text("Set up demo"))).appendTo(win.nodes.main);
        
        $('<div class="row">').append($('<div class="span4">&nbsp;</div>'), formPane = $('<div class="span4">')).appendTo(win.nodes.main);
        
        formPane.append(input = $('<input type="password">'), $("<br/>"), $('<button class="btn btn-primary">').text("Set up").on("click", loadDemo));
        
        new KeyListener(input).on("enter", loadDemo).include();

        win.show(function () {
            input.focus();
        });
    });

    return {
        getApp: app.getInstance
    };
    
    
});