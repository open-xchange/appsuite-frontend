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
     "io.ox/core/commons",
     "io.ox/core/config",
     "io.ox/core/tk/vgrid",
     "io.ox/mail/view-detail",
     "io.ox/mail/view-grid-template",
     "gettext!io.ox/mail/main",
     "io.ox/mail/actions",
     "less!io.ox/mail/style.css"
    ], function (util, api, ext, commons, config, VGrid, viewDetail, tmpl, gt) {

    'use strict';

    var draftFolderId = config.get('modules.mail.defaultFolder.drafts'),

        autoResolveThreads = function (e) {
            var self = $(this), parents = self.parents();
            api.get(e.data).done(function (data) {
                // replace placeholder with mail content
                self.replaceWith(viewDetail.draw(data).addClass('page'));
            });
        },

        // application object
        app = ox.ui.createApp({ name: 'io.ox/mail' }),

        // app window
        win,
        // grid
        grid,
        GRID_WIDTH = 330,
        // nodes
        left,
        right,
        scrollpane;

    // launcher
    app.setLauncher(function () {

        // get window
        win = ox.ui.createWindow({
            name: 'io.ox/mail',
            title: gt("Inbox"),
            titleWidth: (GRID_WIDTH + 27) + "px",
            toolbar: true,
            search: true
        });

        win.addClass("io-ox-mail-main");
        app.setWindow(win);

        // folder tree
        commons.addFolderTree(app, GRID_WIDTH, 'mail');

        // left panel
        left = $("<div>")
            .addClass("leftside border-right")
            .css({
                width: GRID_WIDTH + "px"
            })
            .appendTo(win.nodes.main);

        // right panel
        scrollpane = $("<div>")
            .css({ left: GRID_WIDTH + 1 + "px" })
            .addClass("rightside mail-detail-pane")
            .appendTo(win.nodes.main);

        right = scrollpane.scrollable();

        // grid
        grid = new VGrid(left);

        // add template
        grid.addTemplate(tmpl.main);

        // customize selection
        grid.selection.unfold = function () {
            return _(this.get()).inject(function (memo, o) {
                return memo.concat(api.getThread(o));
            }, []);
        };

        // add label template
        var openThreads = {};
        grid.addLabelTemplate(tmpl.thread);
        grid.requiresLabel = function (i, data, current) {
            return openThreads[i] !== undefined;
        };
        grid.getContainer().on('click', '.thread-size', { grid: grid }, function (e) {
            console.log('click', this);
            var cell = $(this).closest('.vgrid-cell'),
                index = parseInt(cell.attr('data-index'), 10),
                id,
                grid = e.data.grid,
                cont = function () {
                    // TODO: less heavy
                    grid.clear().done(function () {
                        grid.refresh();
                        grid = null;
                    });
                };
            // toggle
            console.log('mmmh', index, openThreads);
            if (openThreads[index + 1] === undefined) {
                id = cell.attr('data-obj-id');
                openThreads[index + 1] = id;
                console.log('Open', id, api.getThread(id));
                api.getList(api.getThread(id)).done(cont);
            } else {
                delete openThreads[index + 1];
                cont();
            }
        });

        grid.getContainer().on('click', '.thread-summary-item', { grid: grid }, function (e) {
            var key = $(this).attr('data-obj-id');
            e.data.grid.selection.set(key);
        });

        commons.wireGridAndAPI(grid, api, 'getAllThreads', 'getThreads');
        commons.wireGridAndSearch(grid, win, api);

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
                    frag.appendChild(viewDetail.draw(mail).addClass('page').get(0));
                } else {
                    frag.appendChild(viewDetail.drawScaffold(obj, autoResolveThreads).get(0));
                }
            }
            scrollpane.scrollTop(0);
            right.idle().empty().get(0).appendChild(frag);
            // show many to resolve?
            var nodes = right.find(".mail-detail"),
                numVisible = (right.parent().height() / nodes.eq(0).outerHeight(true) >> 0) + 1;
            // resolve visible
            nodes.slice(0, numVisible).trigger("resolve");
            // look for scroll
            var autoResolve = function (e) {
                // determine visible nodes
                e.data.nodes.each(function () {
                    var self = $(this), bottom = scrollpane.scrollTop() + (2 * right.parent().height());
                    if (bottom > self.position().top) {
                        self.trigger('resolve');
                    }
                });
            };
            scrollpane.off("scroll").on("scroll", { nodes: nodes }, _.debounce(autoResolve, 250));
            nodes = frag = null;
        };

        drawMail = function (data) {
            right.idle().empty().append(viewDetail.draw(data).addClass('page'));
        };

        drawFail = function (obj) {
            right.idle().empty().append(
                $.fail(gt("Couldn't load that email."), function () {
                    showMail(obj);
                })
            );
        };

        commons.wireGridAndSelectionChange(grid, 'io.ox/mail', showMail, right);
        commons.wireGridAndWindow(grid, win);
        commons.wireFirstRefresh(app, api);
        commons.wireGridAndRefresh(grid, api);

        window.mailApp = app;

        // go!
        commons.addFolderSupport(app, grid, 'mail')
            .pipe(commons.showWindow(win, grid))
            .done(function () {
                if (_.url.hash('lamp') === 'true') {
                    app.toggleLamp();
                }
            });
    });

    app.toggleLamp = (function () {
        var on = false,
            init = _.once(function () {
                var nodes = app.getWindow().nodes;
                nodes.outer.append(
                    $('<div>').addClass('spotlight-icon').css({
                        backgroundImage: 'url(' + ox.base + '/apps/themes/default/glyphicons_064_lightbulb.png)'
                    })
                    .on('click', app.toggleLamp)
                );
            });
        return function () {
            init();
            var nodes = app.getWindow().nodes;
            nodes.outer[on ? 'removeClass' : 'addClass']('spotlight');
            on = !on;
            _.url.hash('lamp', on ? 'true' : null);
        };
    }());

    return {
        getApp: app.getInstance
    };
});
