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

define("io.ox/mail/main",
    ["io.ox/mail/util",
     "io.ox/mail/api",
     "io.ox/core/extensions",
     "io.ox/core/tk/vgrid",
     "io.ox/mail/view-detail",
     "io.ox/mail/view-grid-template",
     "io.ox/mail/actions",
     "less!io.ox/mail/style.css"
    ], function (util, api, ext, VGrid, viewDetail, tmpl) {

    'use strict';

    var autoResolveThreads = function (e) {
        var self = $(this);
        api.get(e.data).done(function (data) {
            // replace placeholder with mail content
            self.replaceWith(viewDetail.draw(data));
        });
    };

    // application object
    var app = ox.ui.createApp(),
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
        win = ox.ui.createWindow({
            name: 'io.ox/mail',
            title: "Inbox",
            titleWidth: (GRID_WIDTH + 27) + "px",
            toolbar: true,
            search: true
        });

        win.addClass("io-ox-mail-main");
        app.setWindow(win);

        // left panel
        left = $("<div/>")
            .addClass("leftside border-right")
            .css({
                width: GRID_WIDTH + "px"
            })
            .appendTo(win.nodes.main);

        // right panel
        $("<div/>")
            .css({ left: GRID_WIDTH + 1 + "px" })
            .addClass("rightside mail-detail-pane")
            .append(
                right = $("<div/>").addClass("abs")
            )
            .appendTo(win.nodes.main);

        // grid
        grid = new VGrid(left);

        // add template
        grid.addTemplate(tmpl.main);

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
                    frag.appendChild(viewDetail.draw(mail).get(0));
                } else {
                    frag.appendChild(viewDetail.drawScaffold(obj, autoResolveThreads).get(0));
                }
            }
            right.scrollTop(0).idle().empty().get(0).appendChild(frag);
            // show many to resolve?
            var nodes = right.find(".mail-detail"),
                numVisible = (right.parent().height() / nodes.eq(0).outerHeight(true) >> 0) + 1;
            // resolve visible
            nodes.slice(0, numVisible).trigger("resolve");
            // look for scroll
            var autoResolve = function (e) {
                // determine visible nodes
                e.data.nodes.each(function () {
                    var self = $(this), bottom = right.scrollTop() + (2 * right.parent().height());
                    if (bottom > self.position().top) {
                        self.trigger('resolve');
                    }
                });
            };
            right.off("scroll").on("scroll", { nodes: nodes }, _.debounce(autoResolve, 250));
            nodes = frag = null;
        };

        drawMail = function (data) {
            right.idle().empty().append(viewDetail.draw(data));
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

        win.bind("show", function () {
            grid.selection.keyboard(true);
        });
        win.bind("hide", function () {
            grid.selection.keyboard(false);
        });

        // bind all refresh
        api.bind("refresh.all", function () {
            grid.refresh();
        });

        // bind list refresh
        api.bind("refresh.list", function () {
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
