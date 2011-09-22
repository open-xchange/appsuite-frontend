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
        
        win.addClass("io-ox-mail-main");
        
        // toolbar
        win.addButton({
            label: "New Mail",
            action: base.createNewMailDialog
        })
        .css("marginRight", "20px");
        
        win.addButton({
            label: "Delete",
            action: function () {
                api.remove(grid.selection.get());
                grid.selection.selectNext();
            }
        })
        .css("marginRight", "20px");
        
        win.addButton({
            label: "Reply All"
        });
        
        win.addButton({
            label: "Reply"
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
            .appendTo(win.nodes.main);
        
        // right panel
        $("<div/>")
            .css({ left: gridWidth + 1 + "px" })
            .addClass("rightside mail-detail-pane")
            .append(
                right = $("<div/>").addClass("abs")
            )
            .appendTo(win.nodes.main);
        
        // grid
        grid = new VGrid(left);
        
        // add template
        grid.addTemplate({
            build: function () {
                var from, date, priority, subject, attachment, threadSize, flag;
                this.addClass("mail")
                    .append(
                        $("<div/>")
                            .append(date = $("<span/>").addClass("date"))
                            .append(from = $("<span/>").addClass("from"))
                    )
                    .append(
                        $("<div/>")
                            .append(threadSize = $("<div/>").addClass("threadSize"))
                            .append(attachment = $("<span/>").addClass("attachment"))
                            .append(priority = $("<span/>").addClass("priority"))
                            .append(subject = $("<span/>").addClass("subject"))
                    )
                    .append(flag = $("<div/>").addClass("flag abs"));
                return { from: from, date: date, priority: priority, subject: subject, attachment: attachment, threadSize: threadSize, flag: flag };
            },
            set: function (data, fields, index) {
                fields.priority.text(base.getPriority(data));
                fields.subject.text(_.prewrap(data.subject));
                if (!data.threadSize || data.threadSize === 1) {
                    fields.threadSize.text("").hide();
                } else {
                    fields.threadSize.text(data.threadSize).css("display", "");
                }
                fields.from.empty().append(base.getFrom(data.from), true);
                fields.date.text(base.getTime(data.received_date));
                fields.flag.get(0).className = "flag abs flag_" + data.color_label;
                fields.attachment.css("display", data.attachment ? "" : "none");
                if (base.isUnread(data)) {
                    this.addClass("unread");
                }
                if (base.isMe(data)) {
                    this.addClass("me");
                }
                if (base.isDeleted(data)) {
                    this.addClass("deleted");
                }
            }
        });
        
        // all request
        grid.setAllRequest(function () {
            return api.getAllThreads();
        });
        
        // list request
        grid.setListRequest(function (ids) {
            return api.getThreads(ids);
        });
        
        // search: all request
        grid.setAllRequest("search", function () {
            return api.search(win.search.query);
        });
        
        // search: list request
        grid.setListRequest("search", function (ids) {
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
        
        var showMail, drawThread, drawMail, drawFail;
        
        showMail = function (obj) {
            // be busy
            right.busy(true);
            // which mode?
            if (grid.getMode() === "all") {
                // get thread
                var thread = api.getThread(obj);
                // get first mail first
                api.get(thread[0])
                    .done(_.lfo(drawThread, thread))
                    .fail(_.lfo(drawFail, obj));
            } else {
                api.get(obj)
                    .done(_.lfo(drawMail))
                    .fail(_.lfo(drawFail, obj));
            }
        };
        
        drawThread = function (list, mail) {
            // loop over thread - use fragment to be fast for tons of mails
            var i = 0, obj, frag = document.createDocumentFragment();
            for (; (obj = list[i]); i++) {
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
        };
        
        drawMail = function (data) {
            right.idle().empty().append(base.draw(data));
        };
        
        drawFail = function (obj) {
            right.idle().empty().append(
                $.fail("Connection lost.", function () {
                    showMail(obj);
                })
            );
        };
        
        /*
         * Selection handling
         */
        grid.selection.bind("change", function (selection) {
            if (selection.length === 1) {
                showMail(selection[0]);
            } else {
                right.empty();
            }
        });
        
        win.bind("show", function () { grid.selection.keyboard(true); });
        win.bind("hide", function () { grid.selection.keyboard(false); });
        
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