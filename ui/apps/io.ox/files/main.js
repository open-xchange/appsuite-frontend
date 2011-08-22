/**
 * 
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 * 
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * 
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com 
 * 
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 *
 */

 define("io.ox/files/main",
     ["io.ox/files/base", "io.ox/files/api", "css!io.ox/files/style.css"], function (base, api) {

    // application object
    var app = ox.ui.createApp(),
        // app window
        win;
    
    // launcher
    app.setLauncher(function () {
        // get window
        win = ox.ui.createWindow({
            title: "Files",
            search: true
        });
        app.setWindow(win);
        
        var currentFolder = null;

        // left side
        var left = $("<div/>").addClass("leftside border-right")
            .css({
                width: "309px",
                overflow: "auto"
            })
            .appendTo(win.nodes.content);

        var right = $("<div/>")
            .css({ left: "347px", overflow: "auto" })
            .addClass("rightside")
            .appendTo(win.nodes.content);

        // Grid
        var grid = window.grid = new ox.ui.tk.VGrid(left);
        // add template
        grid.addTemplate({
            build: function () {
                var name;
                this
                    .addClass("file")
                    .append(name = $("<div/>").addClass("name"));
                return { name: name };
            },
            set: function (data, fields, index) {
                fields.name.text(data.title);
            }
        });
       
        grid.setAllRequest(function (cont) {
            currentFolder.getAll()
                .done(cont);
        });

        // get header data
        grid.setListRequest(function (ids, cont) {
            api.getList(ids)
                .done(cont);
        });
        
        // go!
        api.defaultFolder().done(function (folder) {
            currentFolder = folder;
            grid.paint(function () {
                // select first item
                grid.selection.selectFirst();
            });
            win.show();
        });
        
        // hi cisco!
        // kleine Änderung von mir - das erkläre ich vor ort
        // es gibt die LFO function - Latest Function Only :)
        // die braucht man, wenn man schnell durch Grid läufts und Detais geladen werden.
        // Sonst ist es Lotto, welche Response als letztes malt.
        
        // LFO callback
        function drawDetail(data) {
            var detail = base.draw(data);
            right.idle().empty().append(detail);
            right.parent().scrollTop(0);
        }

        grid.selection.bind("change", function (selection) {
            if (selection.length === 1) {
                // get file
                right.busy(true);
                api.get(selection[0].folder_id, selection[0].id) // evil! :)
                .done(ox.util.lfo(drawDetail)); // LFO!
            } else {
                right.empty();
            }
        });
        
        // explicit keyboard support
        win.bind("show", function () { grid.selection.keyboard(true); });
        win.bind("hide", function () { grid.selection.keyboard(false); });
    });
    
    return {
        getApp: app.getInstance
    };
});
