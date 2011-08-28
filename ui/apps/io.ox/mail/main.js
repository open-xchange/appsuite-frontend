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

define("io.ox/mail/main", [
     "io.ox/mail/base", "io.ox/mail/api", "io.ox/core/tk/vgrid",
     "css!io.ox/mail/style.css"
    ], function (base, api, VGrid) {

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
            .css({ left: gridWidth + 1 + "px" })
            .addClass("rightside mail-detail-pane")
            .append(
                right = $("<div/>").addClass("abs")
            )
            .appendTo(win.nodes.content);
        
        // grid
        grid = new VGrid(left);
        
        // add template
        grid.addTemplate({
            build: function () {
                var from, date, subject;
                this.addClass("mail")
                    .append(
                        subject = $("<div/>").addClass("subject")
                    )
                    .append(
                        threadSize = $("<span/>").addClass("threadSize")
                    )
                    .append(
                        from = $("<div/>").addClass("from")
                    )
                    .append(
                        date = $("<div/>").addClass("date")
                    );
                return { from: from, date: date, subject: subject, threadSize: threadSize };
            },
            set: function (data, fields, index) {
                fields.subject.text(data.subject);
                fields.threadSize.text(
                    !data.threadSize || data.threadSize === 1 ? "" : data.threadSize
                );
                fields.from.text(base.serializeList(data.from));
                fields.date.text(base.getTime(data.received_date));
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
            api.getAllThreads().done(cont);
        });
        
        // list request
        grid.setListRequest(function (ids, cont) {
            api.getThreads(ids).done(cont);
        });
        
        // search: all request
        grid.setAllRequest("search", function (cont) {
            api.search(win.search.query).done(cont);
        });
        
        // search: list request
        grid.setListRequest("search", function (ids, cont) {
            api.getList(ids).done(cont);
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
        function drawThread (list, mail) {
            // loop over thread - use fragment to be fast for tons of mails
            var i = 0, obj, frag = document.createDocumentFragment();
            for (; obj = list[i]; i++) {
                if (i === 0) {
                    frag.appendChild(base.draw(mail).get(0));
                } else {
                    frag.appendChild(base.drawScaffold(obj).get(0));
                }
            }
            right.idle().empty().get(0).appendChild(frag);
            // show many to resolve?
            var nodes = right.find(".mail-detail"),
                numVisible = (right.parent().height() / nodes.eq(0).outerHeight(true) >> 0) + 1;
            // resolve visible
            nodes.slice(0, numVisible).trigger("resolve");
            // look for scroll
            var autoResolve = function () {
                nodes.trigger("resolve");
                right.unbind("scroll", autoResolve);
            };
            right.bind("scroll", autoResolve);
        }
        
        function drawMail (data) {
            right.idle().empty().append(base.draw(data));
        }
        
        /*
         * Selection handling
         */
        grid.selection.bind("change", function (selection) {
            if (selection.length === 1) {
                // be busy
                right.busy(true);
                // which mode?
                if (grid.getMode() === "all") {
                    // get thread
                    var thread = api.getThread(selection[0]);
                    // get first mail first
                    api.get(thread[0])
                        .done(_.lfo(drawThread, thread))
                        .fail(function () { right.idle().empty(); });
                } else {
                    api.get(selection[0])
                        .done(_.lfo(drawMail))
                        .fail(function () { right.idle().empty(); });
                }
            } else {
                right.empty();
            }
        });
        
        win.bind("show", function () { grid.selection.keyboard(true); });
        win.bind("hide", function () { grid.selection.keyboard(false); });
        
        // bind refresh
        ox.bind("refresh", function () {
            grid.refresh();
        });
        
        // bind list refresh
        api.bind("refresh.list", function (data) {
            grid.repaint();
        });
        
        // go!
        win.show();
        grid.paint();
        
    });
    
    return {
        getApp: app.getInstance
    };
});