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
 define("io.ox/internal/ajaxDebug/main", [ "io.ox/core/tk/vgrid", "io.ox/internal/ajaxDebug/callHandling"], function (VGrid) {

    // application object
    var app = ox.ui.createApp(),
        // app window
        win,
        // vgrid
        grid,
        // nodes
        left,
        right,
        statusBar;
    
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
            
    // Grid
    grid = new VGrid(left);
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
    
    // all request
    grid.setAllRequest(function () {
        return api.getAll();
    });
      
    // list request
    grid.setListRequest(function (ids) {
        return api.getList(ids);
    });
    
    
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
            api.get(selection[0]).done(_.lfo(drawDetail));
        } else {
            right.empty();
        }
    });
    
    // explicit keyboard support
    win.bind("show", function () { grid.selection.keyboard(true); });
    win.bind("hide", function () { grid.selection.keyboard(false); });
            
    // go!
    win.show(function () {
        grid.paint();
    });
    
    return {
        getApp: app.getInstance
    };
});
