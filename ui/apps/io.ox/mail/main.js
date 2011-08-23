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
            toolbar: true,
            search: true
        });
        
        // toolbar
        win.addButton({
            label: "New Mail",
            action: base.createNewMailDialog
        })
        .css("marginRight", "20px");
        
        win.addButton({
            label: "Delete"
        })
        .css("marginRight", "20px");
        
        win.addButton({
            label: "Reply"
        });
        
        win.addButton({
            label: "Reply All"
        });

        win.addButton({
            label: "Forward"
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
        $("<div/>")
            .css({ left: gridWidth + 1 + "px", overflow: "auto" })
            .addClass("rightside mail-detail-pane")
            .append(
                right = $("<div/>").addClass("abs")
            )
            .appendTo(win.nodes.content);
        
        // grid
        grid = new ox.ui.tk.VGrid(left);
        
        // add template
        grid.addTemplate({
            build: function () {
                var from, date, subject;
                this.addClass("mail")
                    .append(
                        subject = $("<div/>").addClass("subject")
                    )
                    .append(
                        from = $("<div/>").addClass("from")
                    )
                    .append(
                        date = $("<div/>").addClass("date")
                    );
                return { from: from, date: date, subject: subject };
            },
            set: function (data, fields, index) {
                fields.from.text(base.serializeList(data.from));
                fields.date.text(base.getTime(data.received_date));
                fields.subject.text(data.subject);
                if (base.isUnread(data)) {
                    this.addClass("unread");
                }
                if (base.isMe(data)) {
                    this.addClass("me");
                }
            }
        });
        
        // all request
        grid.setAllRequest(function (cont) {
            api.getAll().done(cont);
        });
        
        // search request
        grid.setAllRequest("search", function (cont) {
            api.search(win.search.query).done(cont);
        });
        
        // list request
        grid.setListRequest(function (ids, cont) {
            api.getList(ids).done(cont);
        });
        
        /*
         * Search handling
         */
        win.bind("search", function (q) {
            grid.refresh("search");
        });
        
        win.bind("cancel-search", function () {
            grid.refresh("all");
        });
        
        // LFO callback
        function drawMail(data) {
            console.log("data", data);
            var mail = base.draw(data);
            right.idle().empty().append(mail);
            right.parent().scrollTop(0);
        }
        
        /*
         * Selection handling
         */
        grid.selection.bind("change", function (selection) {
            if (selection.length === 1) {
                // get mail
                right.busy(true);
                api.get({
                    folder: selection[0].folder_id,
                    id: selection[0].id
                })
                .done(ox.util.lfo(drawMail))
                .fail(function () { right.idle().empty(); });
            } else {
                right.empty();
            }
        });
        
        win.bind("show", function () { grid.selection.keyboard(true); });
        win.bind("hide", function () { grid.selection.keyboard(false); });
        
        // go!
        grid.paint();
        win.show();
    });
    
    return {
        getApp: app.getInstance
    };
});