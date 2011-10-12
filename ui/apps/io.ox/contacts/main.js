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
 *
 */

define("io.ox/contacts/main", ["io.ox/contacts/base", "io.ox/contacts/api", "io.ox/core/tk/vgrid", "io.ox/contacts/view-detail", "css!io.ox/contacts/style.css"], function (base, api, VGrid, viewDetail) {
        

    // application object
    var app = ox.ui.createApp(),
        // app window
        win,
        // grid
        grid,
        gridWidth = 290,
        // nodes
        left,
        thumbs,
        right;
    
    // launcher
    app.setLauncher(function () {
        
        // get window
        win = ox.ui.createWindow({
            title: "Global Address Book",
            search: true
        });
        
        app.setWindow(win);

        // left panel
        left = $("<div/>")
            .addClass("leftside border-right")
            .css({
                width: gridWidth + "px",
                overflow: "auto"
            })
            .appendTo(win.nodes.main);
        
        // thumb index
        thumbs = $("<div/>")
            .addClass("atb contact-grid-index border-left border-right")
            .css({
                left: gridWidth + 3 + "px",
                width: "34px"
            })
            .appendTo(win.nodes.main);
        
        // right panel
        right = $("<div/>")
            .css({ left: gridWidth + 39 + "px", overflow: "auto" })
            .addClass("rightside")
            .appendTo(win.nodes.main);

        // grid
        grid = new VGrid(left);
        
        // add template
        grid.addTemplate({
            build: function () {
                var name, email, job;
                this
                    .addClass("contact")
                    .append(name = $("<div/>").addClass("fullname"))
                    .append(email = $("<div/>"))
                    .append(job = $("<div/>").addClass("bright-text"));
                return { name: name, job: job, email: email };
            },
            set: function (data, fields, index) {
                if (data.mark_as_distributionlist === true) {
                    fields.name.text(data.display_name || "");
                    fields.email.text("");
                    fields.job.text("Distribution list");
                } else {
                    fields.name.text(base.getFullName(data));
                    fields.email.text(base.getMail(data));
                    fields.job.text(base.getJob(data));
                }
            }
        });
        
        // add label template
        grid.addLabelTemplate({
            build: function () {
            },
            set: function (data, fields, index) {
                var name = data.last_name || data.display_name || "#";
                this.text(name.substr(0, 1).toUpperCase());
            }
        });
        
        // requires new label?
        grid.requiresLabel = function (i, data, current) {
            var name = data.last_name || data.display_name || "#",
                prefix = name.substr(0, 1).toUpperCase();
            return (i === 0 || prefix !== current) ? prefix : false;
        };
        
        // all request
        grid.setAllRequest(function () {
            return api.getAll();
        });
        
        // search request
        grid.setAllRequest("search", function () {
            return api.search(win.search.query);
        });
        
        // list request
        grid.setListRequest(function (ids) {
            return api.getList(ids);
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
        
        // LFO callback
        var showContact, drawContact, drawFail;
        
        showContact = function (obj) {
            // get contact
            right.busy(true);
            api.get(obj)
                .done(_.lfo(drawContact))
                .fail(_.lfo(drawFail, obj));
        };
        
        drawContact = function (data) {
            //right.idle().empty().append(base.draw(data));
            right.idle().empty().append(viewDetail.draw(data));
        };
        
        drawFail = function (obj) {
            right.idle().empty().append(
                $.fail("Connection lost.", function () {
                    showContact(obj);
                })
            );
        };
        /*
         * Selection handling
         */
        grid.selection.bind("change", function (selection) {
            if (selection.length === 1) {
                showContact(selection[0]);
            } else {
                right.empty();
            }
        });

        /**
         * Thumb index
         */
        
        function drawThumb(char) {
            return $("<div/>").addClass("thumb-index border-bottom")
                .text(char)
                .bind("click", char, grid.scrollToLabelText);
        }
        
        // draw thumb index
        grid.bind("ids-loaded", function () {
            // get labels
            thumbs.empty();
            var textIndex = grid.getLabels().textIndex, char = "";
            for (char in textIndex) {
                // add thumb
                thumbs.append(drawThumb(char));
            }
        });
        
        win.bind("show", function () {
            grid.selection.keyboard(true);
        });
        win.bind("hide", function () {
            grid.selection.keyboard(false);
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