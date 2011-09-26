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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 *
 */

// TODO: Break this up, this is becoming messy
 define("io.ox/internal/ajaxDebug/main", [ "io.ox/core/tk/vgrid", "io.ox/internal/ajaxDebug/callHandling", "io.ox/internal/ajaxDebug/callViews"], function (VGrid, callHandler, callViews) {

    // application object
    var app = ox.ui.createApp(),
        // app window
        win,
        // vgrid
        grid,
        // nodes
        left,
        right,
        statusBar,
        viewer;
    
    // launcher
    app.setLauncher(function () {
        
        // get window
        app.setWindow(win = ox.ui.createWindow({
            title: "AJAX Debugger"
        }));
    
        // toolbar
        /*win.addButton({
            label: "Repeat",
            action: deleteItems
        }); */
    
        // left side
        left = $("<div/>").addClass("leftside withStatusBar border-right")
            .css({
                width: "309px",
                overflow: "auto"
            })
            .appendTo(win.nodes.main);
    
        right = $("<div/>")
            .css({ left: "310px", overflow: "auto", padding: "0px 40px 20px 40px" })
            .addClass("rightside withStatusBar")
            .appendTo(win.nodes.main);
    
    
        statusBar = $("<div/>")
        .addClass("statusBar")
        .appendTo(win.nodes.main);
    
        viewer = new callViews.CallView(right, callHandler);
            
        // Grid
        grid = new VGrid(left);
        // add template
        grid.addTemplate({
            build: function () {
                var name;
                this
                    .addClass("ajaxRequest")
                    .append(name = $("<div/>").addClass("name"));
                return { name: name };
            },
            set: function (data, fields, index) {
                fields.name.text(data.query.module+"."+data.query.params.action);
            }
        });
    
        // all request
        grid.setAllRequest(function () {
            var ids = _(callHandler.history).map(function (entry) {
                return entry.id;
            });
            console.log(ids);
            return new $.Deferred().resolve(ids);
        });
      
        // list request
        grid.setListRequest(function (ids) {
            var entries = _(ids).map(function (id) {
               return callHandler.history[id];
            });
            console.log(entries);
            return new $.Deferred().resolve(entries);
        });
    
    
    
        grid.selection.bind("change", function (selection) {
            if (selection.length === 1) {
                // get file
                viewer.draw(selection[0]);
            }
        });
    
        // explicit keyboard support
        win.bind("show", function () { grid.selection.keyboard(true); });
        win.bind("hide", function () { grid.selection.keyboard(false); });
        
        callHandler.bind("historychanged", function () {
            grid.refresh();
        });
        
        // go!
        win.show(function () {
            grid.paint();
        });
    });
    
    return {
         getApp: app.getInstance
    };
});
