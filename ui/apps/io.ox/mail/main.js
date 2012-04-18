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

        hToolbarOptions = function (e) {
            e.preventDefault();
            var option = $(this).attr('data-option'),
                grid = e.data.grid;
            if (/^(603|607|610|102)$/.test(option)) {
                grid.prop('sort', option);
            } else if (/^(asc|desc)$/.test(option)) {
                grid.prop('order', option);
            } else if (option === 'unread') {
                grid.prop('unread', !grid.prop('unread'));
            }
            grid.refresh();
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
        commons.addFolderView(app, { width: GRID_WIDTH, type: 'mail' });

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

        // add grid options
        grid.prop('sort', '610')
            .prop('order', 'desc')
            .prop('unread', false);

        commons.wireGridAndAPI(grid, api, 'getAllThreads', 'getThreads');
        commons.wireGridAndSearch(grid, win, api);

        function updateGridOptions() {
            var dropdown = grid.getToolbar().find('.grid-options'),
                list = dropdown.find('ul'),
                props = grid.prop();
            // uncheck all
            list.find('i').attr('class', 'icon-none');
            // sort
            list.find(
                    '[data-option="' + props.sort + '"], ' +
                    '[data-option="' + props.order + '"], ' +
                    '[data-option="' + (props.unread ? 'unread' : '~unread') + '"]'
                )
                .find('i').attr('class', 'icon-ok');
            // unread
            dropdown.find('.icon-envelope')[props.unread ? 'show' : 'hide']();
            // order
            var opacity = [1, 0.4][props.order === 'desc' ? 'slice' : 'reverse']();
            dropdown.find('.icon-arrow-down').css('opacity', opacity[0]).end()
                .find('.icon-arrow-up').css('opacity', opacity[1]).end();
        }

        var option = '<li><a data-option="%s"><i/> %s</a></li>';

        grid.getToolbar().prepend(
            $('<div>').addClass('grid-options dropdown').css({ display: 'inline-block', 'float': 'right' })
            .append(
                $('<a>', { href: '#' })
                .attr('data-toggle', 'dropdown')
                .append(
                    $('<i class="icon-envelope">').css('marginRight', '0.5em').hide(),
                    $('<i class="icon-arrow-down">'), $('<i class="icon-arrow-up">')
                )
                .dropdown(),
                $('<ul>').addClass("dropdown-menu")
                .css({ top: 'auto', bottom: '110%', right: 0, left: 'auto' })
                .append(
                    $(_.printf(option, 610, gt('Date'))),
                    $(_.printf(option, 603, gt('From'))),
                    $(_.printf(option, 102, gt('Label'))),
                    $(_.printf(option, 607, gt('Subject'))),
                    $('<li class="divider">'),
                    $(_.printf(option, 'asc', gt('Ascending'))),
                    $(_.printf(option, 'desc', gt('Descending'))),
                    $('<li class="divider">'),
                    $(_.printf(option, 'unread', gt('Unread only')))
                )
                .on('click', 'a', { grid: grid }, hToolbarOptions)
            )
        );

        grid.on('change:prop', updateGridOptions);
        updateGridOptions();

        grid.setAllRequest(function () {
            var sort = this.prop('sort'), unread = this.prop('unread');
            return api[sort === '610' ? 'getAllThreads' : 'getAll']({
                    folder: this.prop('folder'),
                    sort: sort,
                    order: this.prop('order')
                })
                .pipe(function (data) {
                    return !unread ? data : _(data).filter(function (obj) {
                        return (obj.flags & 32) === 0;
                    });
                });
        });

        win.nodes.title.on('click', '.badge', function (e) {
            e.preventDefault();
            grid.prop('unread', !grid.prop('unread')).refresh();
        });


        // custom all request

        /*
         * Thread summary
         */
        (function () {

            var openThreads = {};

            // add label template
            grid.addLabelTemplate(tmpl.thread);
            grid.requiresLabel = function (i, data, current) {
                return openThreads[i] !== undefined;
            };

            function refresh(list, index) {
                grid.repaintLabels().done(function () {
                    grid.repaint();
                    if (list) {
                        grid.selection.insertAt(list.slice(1), index + 1);
                    }
                });
            }

            function open(index, cid) {
                if (openThreads[index + 1] === undefined) {
                    var thread = api.getThread(cid);
                    if (thread.length > 1) {
                        openThreads[index + 1] = cid;
                        api.getList(thread).done(function (list) {
                            refresh(list, index);
                        });
                    }
                }
            }

            function close(index, cid) {
                if (openThreads[index + 1] !== undefined) {
                    var thread = api.getThread(cid);
                    delete openThreads[index + 1];
                    api.getList(thread).done(function (list) {
                        grid.selection.remove(list.slice(1));
                        refresh();
                    });
                }
            }

            function toggle(index, cid) {
                if (openThreads[index + 1] === undefined) {
                    open(index, cid);
                } else {
                    close(index, cid);
                }
            }

            grid.getContainer().on('click', '.thread-size', function () {
                var cell = $(this).closest('.vgrid-cell'),
                    index = parseInt(cell.attr('data-index'), 10),
                    cid = cell.attr('data-obj-id');
                toggle(index, cid);
            });

            grid.getContainer().on('click', '.thread-summary-item', function () {
                var cid = $(this).attr('data-obj-id');
                grid.selection.set(cid);
            });

            grid.selection.on('keyboard', function (evt, e) {
                var sel = grid.selection.get(), cid, index, key;
                if (sel.length === 1) {
                    cid = grid.selection.serialize(sel[0]);
                    index = grid.selection.getIndex(cid);
                    key = e.which;
                    // cursor right? (open)
                    if (key === 39) {
                        open(index, cid);
                    } else if (key === 37) {
                        close(index, cid);
                    } else if (key === 13) {
                        toggle(index, cid);
                    }
                }
            });

        }());

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
        commons.wireGridAndRefresh(grid, api, win);

        app.on('folder:change folder:refresh', function (e) {
            app.folder.getData().done(function (data) {
                var unread = data.unread, badge;
                if ((badge = win.nodes.title.find('.badge')).length === 0) {
                    badge = $('<span class="badge badge-error">').appendTo(win.nodes.title);
                }
                if (unread > 0) {
                    badge.text(unread).show();
                } else {
                    badge.hide();
                }
            });
        });

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
