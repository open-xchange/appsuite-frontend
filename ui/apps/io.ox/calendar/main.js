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
    ["io.ox/calendar/api", "io.ox/calendar/base", "io.ox/core/config", "io.ox/core/tk/vgrid",
     "css!io.ox/calendar/style.css"], function (api, base, config, VGrid) {
    
    // application object
    var app = ox.ui.createApp(),
        // app window
        win,
        // grid
        grid,
        gridWidth = 310,
        // nodes
        left,
        right;
    
    // launcher
    app.setLauncher(function () {
    
        // get window
        app.setWindow(win = ox.ui.createWindow({
            title: "Calendar",
            subtitle: new Date() + "",
            search: true
        }));
        
        win.addClass("io-ox-calendar-main");
        
        // DOM scaffold
        
        // left panel
        left = $("<div/>")
            .addClass("leftside border-right")
            .css({
                width: gridWidth + "px",
                overflow: "auto"
            })
            .appendTo(win.nodes.main);
        
        // right panel
        right = $("<div/>")
            .css({ left: gridWidth + 1 + "px", overflow: "auto" })
            .addClass("rightside calendar-detail-pane")
            .appendTo(win.nodes.main);
        
        // grid
        grid = new VGrid(left);
        
        // fix selection's serialize
        grid.selection.serialize = function (obj) {
            return typeof obj === "object" ? (obj.folder_id || 0) + "." + obj.id + "." + (obj.recurrence_position || 0) : obj;
        };
        
        // add template
        grid.addTemplate({
            build: function () {
                var title, location, date, shown_as;
                this.addClass("calendar")
                    .append(date = $("<div>").addClass("date"))
                    .append(title = $("<div>").addClass("title"))
                    .append(location = $("<div>").addClass("location"))
                    .append(shown_as = $("<div/>").addClass("abs shown_as"));
                return { title: title, location: location, date: date, shown_as: shown_as };
            },
            set: function (data, fields, index) {
                fields.title.text(data.title);
                fields.location.text(data.location);
                fields.date.text(base.getTimeInterval(data));
                fields.shown_as.get(0).className = "abs shown_as " + base.getShownAsClass(data);
            }
        });
        
        // add label template
        grid.addLabelTemplate({
            build: function () {
                this.addClass("calendar-label");
            },
            set: function (data, fields, index) {
                var d = base.getDate(data.start_date);
                this.text(d);
            }
        });
        
        // requires new label?
        grid.requiresLabel = function (i, data, current) {
            var d = base.getDate(data.start_date);
            return (i === 0 || d !== current) ? d : false;
        };
        
        // all request
        grid.setAllRequest(function () {
            return api.getAll();
        });
        
        // list request
        grid.setListRequest(function (ids) {
            return api.getList(ids);
        });
        
        // search: all request
        grid.setAllRequest("search", function () {
            return api.search(win.search.query);
        });
        
        // search: list request
        grid.setListRequest("search", function (ids) {
            return $.Deferred().resolve(ids);
        });
        
        /*
         * Search handling
         */
        win.bind("search", function (q) {
            grid.setMode("search");
        });
        
        win.bind("cancel-search", function () {
            grid.setMode("all");
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
            right.idle().empty().append(base.draw(data));
        };
        
        drawFail = function (obj) {
            right.idle().empty().append(
                $.fail("Connection lost.", function () {
                    showAppointment(obj);
                })
            );
        };
        
        /*
         * Selection handling
         */
        grid.selection.bind("change", function (selection) {
            if (selection.length === 1) {
                showAppointment(selection[0]);
            } else {
                right.empty();
            }
        });
        
        win.bind("show", function () {
            grid.selection.keyboard(true);
        });
        win.bind("hide", function () {
            grid.selection.keyboard(false);
        });
        
        // bind all refresh
        api.bind("refresh.all", function (data) {
            grid.refresh();
        });
        
        // bind list refresh
        api.bind("refresh.list", function (data) {
            grid.repaint();
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