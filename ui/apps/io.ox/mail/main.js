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

define("io.ox/mail/main",
    ["io.ox/mail/base", "io.ox/mail/api", "css!io.ox/mail/style.css"], function (base, api) {

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
        win = ox.ui.createWindow({
            title: "E-Mail",
            subtitle: "Inbox",
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
            .appendTo(win.nodes.content);
        
        // right panel
        right = $("<div/>")
            .css({ left: gridWidth + 1 + "px", overflow: "auto" })
            .addClass("rightside mail-detail-pane")
            .appendTo(win.nodes.content);
        
        // grid
        grid = window.mailgrid = new ox.ui.tk.VGrid(left);
        
        // add template
        grid.addTemplate({
            build: function () {
                var from, date, subject;
                this.addClass("mail").append(
                    $("<table/>", { border: 0, cellpadding: 0, cellspacing: 0 })
                    .css({ tableLayout: "fixed", width: "100%" })
                    .append(
                        $("<tbody/>")
                            .append(
                                $("<tr/>")
                                    .append(from = $("<td/>").addClass("from"))
                                    .append(date = $("<td/>").addClass("date"))
                                )
                            )
                            .append(
                                $("<tr/>").append(
                                    subject = $("<td/>", { colspan: 2}).addClass("subject")
                                )
                            )
                        );
                return { from: from, date: date, subject: subject };
            },
            set: function (data, fields, index) {
                fields.from.text(base.serializeList(data.from));
                fields.date.text(base.getTime(data.received_date));
                fields.subject.text(data.subject);
            }
        });
        
        // all request
        grid.setAllRequest(function (cont) {
            api.getAll().done(cont);
        });
        
        // list request
        grid.setListRequest(function (ids, cont) {
            api.getList(ids).done(cont);
        });
        
        // LFO callback
        function drawMail(data) {
            right.idle().empty().append(base.draw(data));
        }
        
        /*
         * Selection handling
         */
        grid.selection.bind("change", function (selection) {
            if (selection.length === 1) {
                // get mail
                right.busy();
                api.get({
                    folder: selection[0].folder_id,
                    id: selection[0].id
                })
                .done(ox.util.lfo(drawMail));
            } else {
                right.empty();
            }
        });
        
        // go!
        grid.paint();
        win.show();
    });
    
    return {
        app: app
    };
});