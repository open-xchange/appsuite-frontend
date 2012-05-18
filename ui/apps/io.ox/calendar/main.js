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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define("io.ox/calendar/main",
    ["io.ox/calendar/api",
     "io.ox/calendar/util",
     "io.ox/calendar/view-detail",
     "io.ox/core/config",
     "io.ox/core/commons",
     "io.ox/core/tk/vgrid",
     "io.ox/calendar/view-grid-template",
     "io.ox/calendar/actions",
     "less!io.ox/calendar/style.css"], function (api, util, viewDetail, config, commons, VGrid, tmpl) {

    "use strict";

    // application object
    var app = ox.ui.createApp({ name: 'io.ox/calendar' }),
        // app window
        win,
        // grid
        grid,
        GRID_WIDTH = 330,
        // nodes
        left,
        right;

    // launcher
    app.setLauncher(function () {

        // get window
        app.setWindow(win = ox.ui.createWindow({
            name: 'io.ox/calendar',
            titleWidth: (GRID_WIDTH + 27) + "px",
            toolbar: true,
            search: true
        }));

        win.addClass("io-ox-calendar-main");

        // folder tree
        commons.addFolderView(app, { width: GRID_WIDTH, type: 'calendar', view: 'FolderList' });

        // DOM scaffold

        // left panel
        left = $("<div>")
            .addClass("leftside border-right")
            .css({
                width: GRID_WIDTH + "px",
                overflow: "auto"
            })
            .appendTo(win.nodes.main);

        // right panel
        right = $("<div>")
            .css({ left: GRID_WIDTH + 1 + "px", overflow: "auto" })
            .addClass("rightside default-content-padding calendar-detail-pane")
            .appendTo(win.nodes.main);

        // grid
        grid = new VGrid(left);

        // fix selection's serialize
        grid.selection.serialize = function (obj) {
            return typeof obj === "object" ? (obj.folder_id || obj.folder || 0) + "." + obj.id + "." + (obj.recurrence_position || 0) : obj;
        };

        // add template
        grid.addTemplate(tmpl.main);

        // add label template
        grid.addLabelTemplate(tmpl.label);

        // requires new label?
        grid.requiresLabel = tmpl.requiresLabel;

        commons.wireGridAndAPI(grid, api);
        commons.wireGridAndSearch(grid, win, api);

        // special search: list request
        grid.setListRequest("search", function (ids) {
            return $.Deferred().resolve(ids);
        });

        var showAppointment, drawAppointment, drawFail;

        showAppointment = function (obj) {
            // be busy
            right.busy(true);
            // get appointment
            api.get(obj)
                .done(_.lfo(drawAppointment))
                .fail(_.lfo(drawFail, obj));
        };

        drawAppointment = function (data) {
            right.idle().empty().append(viewDetail.draw(data));
        };

        drawFail = function (obj) {
            right.idle().empty().append(
                $.fail("Oops, couldn't load appointment data.", function () {
                    showAppointment(obj);
                })
            );
        };

        commons.wireGridAndSelectionChange(grid, 'io.ox/calendar', showAppointment, right);
        commons.wireGridAndWindow(grid, win);
        commons.wireFirstRefresh(app, api);
        commons.wireGridAndRefresh(grid, api, win);

        // go!
        commons.addFolderSupport(app, grid, 'calendar')
            .done(commons.showWindow(win, grid));
    });

    return {
        getApp: app.getInstance
    };
});