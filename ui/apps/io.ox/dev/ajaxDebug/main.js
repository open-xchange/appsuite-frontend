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

define("io.ox/dev/ajaxDebug/main",
    ["io.ox/core/tk/vgrid", "io.ox/dev/ajaxDebug/callHandling",
     "io.ox/dev/ajaxDebug/callViews"], function (VGrid, callHandler, callViews) {

    "use strict";

    // application object
    var app = ox.ui.createApp({ name: 'io.ox/dev/ajaxDebug' }),
        // app window
        win,
        // vgrid
        grid,
        // nodes
        left,
        right,
        viewer;

    // launcher
    app.setLauncher(function () {

        // get window
        app.setWindow(win = ox.ui.createWindow({
            title: "AJAX Debugger",
            search: true
        }));

        // toolbar
        /*win.addButton({
            label: "Repeat",
            action: deleteItems
        }); */

        // left side
        left = $("<div/>").addClass("leftside border-right")
            .css({
                width: "309px",
                overflow: "auto"
            })
            .appendTo(win.nodes.main);

        right = $("<div/>")
            .css({ left: "310px", overflow: "auto", padding: "20px 40px 20px 40px" })
            .addClass("rightside")
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
                fields.name.text(data.query.module + "." + data.query.params.action);
            }
        });

        // all request
        grid.setAllRequest(function () {
            var ids = _(callHandler.history.slice().reverse()).map(function (entry) {
                return entry;
            });
            return new $.Deferred().resolve(ids);
        });

        // list request
        grid.setListRequest(function (ids) {
            var entries = _(ids).map(function (id) {
                return callHandler.history[id.id];
            });
            return new $.Deferred().resolve(entries);
        });



        grid.selection.bind("change", function (selection) {
            if (selection.length === 1) {
                viewer.draw(selection[0]);
            }
        });

        // explicit keyboard support
        //win.bind("show", function () { grid.selection.keyboard(true); });
        //win.bind("hide", function () { grid.selection.keyboard(false); });

        callHandler.bind("historychanged", function () {
            grid.refresh();
            grid.selection.set(_(callHandler.history).last());
        });

        // Buttons
        win.addButton({
            label: "Dump to Console",
            action: function () {
                if (viewer.dirty) {
                    console.debug({query: viewer.getQuery()});
                } else {
                    var selection = grid.selection.get();
                    if (selection.length === 1) {
                        console.debug(selection[0]);
                    } else {
                        console.debug(selection);
                    }
                }
            }
        });

        var autorepeat = false;
        function repeat() {
            if (autorepeat) {
                callHandler.perform(viewer.getQuery(), repeat);
            }
        }

        win.addButton({
            label: "Autorepeat",
            action: function () {
                autorepeat = !autorepeat;
                repeat();
            }
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
