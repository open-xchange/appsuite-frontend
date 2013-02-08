/**
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
 */

define("io.ox/dev/ajaxDebug/main",
    ["io.ox/core/tk/vgrid",
     "io.ox/dev/ajaxDebug/callHandling",
     "io.ox/dev/ajaxDebug/callViews",
     'io.ox/core/extensions',
     'io.ox/core/extPatterns/links'], function (VGrid, callHandler, callViews, ext, links) {

    "use strict";

    // toolbar actions

    new links.Action('io.ox/dev/ajaxDebug/actions/dump', {
        id: 'dump',
        action: function (app) {
            app.dump();
        }
    });

    ext.point('io.ox/dev/ajaxDebug/links/toolbar').extend(new links.Link({
        index: 100,
        id: 'dump',
        label: 'Dump to console',
        ref: 'io.ox/dev/ajaxDebug/actions/dump'
    }));

    new links.Action('io.ox/dev/ajaxDebug/actions/repeat', {
        id: 'repeat',
        action: function (app) {
            app.repeat();
        }
    });

    ext.point('io.ox/dev/ajaxDebug/links/toolbar').extend(new links.Link({
        index: 200,
        id: 'repeat',
        label: 'Auto repeat',
        ref: 'io.ox/dev/ajaxDebug/actions/repeat'
    }));

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
            name: 'io.ox/dev/ajaxDebug',
            title: "API debug",
            toolbar: true,
            search: false
        }));

        // left side
        left = $("<div>").addClass("leftside border-right")
            .appendTo(win.nodes.main);

        right = $("<div>")
            .addClass("rightside")
            .css({ padding: "20px 40px 20px 40px" })
            .appendTo(win.nodes.main);


        viewer = new callViews.CallView(right, callHandler);

        // Grid
        grid = new VGrid(left, { multiple: false });

        // fix selection's serialize
        grid.selection.serialize = function (obj) {
            console.log('yep', obj);
            return obj ? obj.id : '';
        };

        // add template
        grid.addTemplate({
            build: function () {
                var name;
                this.addClass("ajaxRequest")
                    .append(name = $("<div>").addClass("name"));
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

        grid.selection.on("change", function (e, selection) {
            if (selection.length === 1) {
                viewer.draw(selection[0]);
            }
        });

        callHandler.on("historychanged", function () {
            grid.refresh();
            grid.selection.set(_(callHandler.history).last());
        });

        // auto repeat
        var autorepeat = false,
            repeat = function () {
                if (autorepeat) {
                    callHandler.perform(viewer.getQuery()).deferred.always(repeat);
                }
            };

        app.autoRepeat = function () {
            autorepeat = !autorepeat;
            repeat();
        };

        app.dump = function () {
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
        };

        // go!
        win.show(function () {
            grid.paint();
        });
    });

    return {
        getApp: app.getInstance
    };
});
