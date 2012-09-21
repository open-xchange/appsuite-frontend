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
     "io.ox/core/tk/upload",
     "io.ox/core/extPatterns/dnd",
     "io.ox/core/notifications",
     "io.ox/mail/actions",
     "less!io.ox/mail/style.css"
    ], function (util, api, ext, commons, config, VGrid, viewDetail, tmpl, gt, upload, dnd, notifications) {

    'use strict';

    var draftFolderId = config.get('modules.mail.defaultFolder.drafts'),

        hToolbarOptions = function (e) {
            e.preventDefault();
            var option = $(this).attr('data-option'),
                grid = e.data.grid;
            if (/^(603|607|610|102|thread)$/.test(option)) {
                grid.prop('sort', option).refresh();
            } else if (/^(asc|desc)$/.test(option)) {
                grid.prop('order', option).refresh();
            } else if (option === 'unread') {
                grid.prop('unread', !grid.prop('unread'));
            }
        },

        // application object
        app = ox.ui.createApp({ name: 'io.ox/mail' }),

        // app window
        win,
        // grid
        grid,
        GRID_WIDTH = 330,
        // nodes
        audio,
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
            search: true,
            fullscreen: true
        });

        win.addClass("io-ox-mail-main");
        app.setWindow(win);

        // folder tree
        commons.addFolderView(app, { width: GRID_WIDTH, type: 'mail' });

        // sound
        audio = $('<audio>', { src: ox.base + '/apps/io.ox/mail/images/ping.mp3' })
            .hide().prop('volume', 0.40).appendTo(win.nodes.main);

        api.on('new-mail', function (e, mails) {
            audio.get(0).play();
        });

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
        var options = ext.point('io.ox/mail/vgrid/options').options();
        grid = new VGrid(left, options);

        // add template
        grid.addTemplate(tmpl.main);

        // customize selection
        grid.selection.unfold = function () {
            return _(this.get()).inject(function (memo, o) {
                return memo.concat(api.getThread(o));
            }, []);
        };

        // add grid options
        grid.prop('sort', options.threadView !== false ? 'thread' : '610')
            .prop('order', 'desc')
            .prop('unread', false);

        commons.wireGridAndAPI(grid, api, 'getAllThreads', 'getThreads'); // getAllThreads is redefined below!
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

        ext.point('io.ox/mail/vgrid/toolbar').extend({
            id: 'dropdown',
            index: 100,
            draw: function () {
                this.prepend(
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
                        .append(
                            options.threadView !== false ? $(_.printf(option, 'thread', gt('Conversations'))) : $(),
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
            }
        });

        ext.point('io.ox/mail/vgrid/toolbar').extend({
            id: 'count',
            index: 200,
            draw: function () {
                this.append(
                    $('<div>').addClass('grid-count').css({ textAlign: 'center', color: '#888' })
                );
            }
        });

        grid.on('change:prop:unread', function (e, value) {
            if (value === true) {
                grid.refresh().done(grid.pause);
            } else {
                grid.resume().refresh();
            }
        });

        grid.on('change:prop', updateGridOptions);
        updateGridOptions();

        ext.point('io.ox/mail/vgrid/toolbar').invoke('draw', grid.getToolbar());

        grid.on('change:ids', function (e, all) {
            // get node & clear now
            var node = grid.getToolbar().find('.grid-count').text(''),
                total = grid.prop('total'),
                set = function (count) {
                    node.text(count + ' ' + gt.ngettext('mail', 'mails', count));
                };
            if (total !== undefined) {
                set(total);
            } else {
                // be lazy
                setTimeout(function () {
                    // loop over all top-level items (=threads) to get total number of mails
                    var count = _(all).reduce(function (memo, obj) {
                        return memo + (obj.thread ? obj.thread.length : 1);
                    }, 0);
                    set(count);
                }, 10);
            }
        });

        grid.setAllRequest(function () {
            var sort = this.prop('sort'),
                unread = this.prop('unread');
            return api[sort === 'thread' ? 'getAllThreads' : 'getAll']({
                    folder: this.prop('folder'),
                    sort: sort,
                    order: this.prop('order')
                }, 'auto')
                .pipe(function (data) {
                    return !unread ? data : _(data).filter(function (obj) {
                        return (obj.flags & 32) === 0;
                    });
                });
        });

        grid.setListRequest(function (ids) {
            var sort = this.prop('sort');
            return api[sort === 'thread' ? 'getThreads' : 'getList'](ids);
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

            function refresh(list, index, order) {
                grid.repaintLabels().done(function () {
                    grid.repaint();
                    if (list) {
                        grid.selection.insertAt(order === 'desc' ? list.slice(1) : list.slice(0, -1), index + 1);
                    }
                });
            }

            function open(index, cid) {
                if (openThreads[index + 1] === undefined) {
                    var thread = api.getThread(cid),
                        order = api.getThreadOrder(cid);
                    if (thread.length > 1) {
                        openThreads[index + 1] = cid;
                        api.getList(thread).done(function (list) {
                            refresh(list, index, order);
                        });
                    }
                }
            }

            function close(index, cid) {
                if (openThreads[index + 1] !== undefined) {
                    var thread = api.getThread(cid),
                        order = api.getThreadOrder(cid);
                    delete openThreads[index + 1];
                    api.getList(thread).done(function (list) {
                        grid.selection.remove(order === 'desc' ? list.slice(1) : list.slice(0, -1));
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

        var showMail, drawMail, drawFail;

        showMail = function (obj) {
            // be busy
            right.busy(true);
            // which mode?
            if (grid.getMode() === "all" && grid.prop('sort') === 'thread') {
                // get thread
                var thread = api.getThread(obj);
                // get first mail first
                api.get(thread[0])
                    .done(_.lfo(viewDetail.drawThread, right, thread))
                    .fail(_.lfo(drawFail, obj));
            } else {
                api.get(obj)
                    .done(_.lfo(drawMail))
                    .fail(_.lfo(drawFail, obj));
            }
        };

        drawMail = function (data) {
            right.idle().empty().append(viewDetail.draw(data).addClass('page'));
        };

        drawFail = function (obj) {
            right.idle().empty().append(
                $.fail(gt("Oops, couldn't load that email."), function () {
                    showMail(obj);
                })
            );
        };

        var repaint = function () {
            var sel = grid.selection.get();
            if (sel.length === 1) {
                right.css('height', '');
                showMail(sel[0]);
            }
        };

        api.on('delete', repaint);

        commons.wireGridAndSelectionChange(grid, 'io.ox/mail', showMail, right);
        commons.wireGridAndWindow(grid, win);
        commons.wireFirstRefresh(app, api);
        commons.wireGridAndRefresh(grid, api, win);

        app.on('folder:change folder:refresh', function (e) {
            app.folder.getData().done(function (data) {
                var unread = data.unread, badge;
                if ((badge = win.nodes.title.find('.badge')).length === 0) {
                    badge = $('<span class="badge badge-important">').appendTo(win.nodes.title);
                }
                if (unread > 0) {
                    badge.text(unread).show();
                } else {
                    badge.hide();
                }
            });
        });

        grid.setEmptyMessage(function (mode) {
            return mode === 'search' ?
                gt('No mails found for "%s"', win.search.query) :
                gt('No mails in this folder');
        });

        // Uploads
        app.queues = {
            'importEML': upload.createQueue({
                processFile: function (file) {
                    win.busy();
                    return api.importEML({ file: file, folder: app.folder.get() })
                        .done(function (data) {
                            var first = _(data.data || []).first() || {};
                            if ('Error' in first) {
                                notifications.yell('error', first.Error);
                            } else {
                                grid.selection.set(first);
                                notifications.yell('success', gt('Mail has been imported'));
                            }
                        })
                        .always(win.idle);
                }
            })
        };

        // drop zone
        var dropZone = new dnd.UploadZone({ ref: "io.ox/mail/dnd/actions" }, app);
        win.on("show", dropZone.include).on('hide', dropZone.remove);

        // go!
        commons.addFolderSupport(app, grid, 'mail')
            .pipe(commons.showWindow(win, grid));
    });

    return {
        getApp: app.getInstance
    };
});
