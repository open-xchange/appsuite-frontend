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
     "gettext!io.ox/mail",
     "io.ox/core/tk/upload",
     "io.ox/core/extPatterns/dnd",
     "io.ox/core/notifications",
     "io.ox/core/api/folder",
     "io.ox/core/api/account",
     "settings!io.ox/mail",
     "io.ox/mail/actions",
     "less!io.ox/mail/style.css"
    ], function (util, api, ext, commons, config, VGrid, viewDetail, tmpl, gt, upload, dnd, notifications, folderAPI, account, settings) {

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
        app = ox.ui.createApp({
            name: 'io.ox/mail',
            title: 'Mail'
        }),

        // app window
        win,
        // grid
        grid,
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
            search: true
        });

        app.setWindow(win);
        app.settings = settings;

        // folder tree
        commons.addFolderView(app, { type: 'mail' });

// TODO: re-enable once we have a proper sound and a user setting
//        // sound
//        audio = $('<audio>', { src: ox.base + '/apps/io.ox/mail/images/ping.mp3' })
//            .hide().prop('volume', 0.40).appendTo(win.nodes.main);
//
//        api.on('new-mail', function (e, mails) {
//            audio.get(0).play();
//        });

        var vsplit = commons.vsplit(win.nodes.main, app);
        left = vsplit.left.addClass('border-right');
        right = vsplit.right.addClass('mail-detail-pane').scrollable();

        ext.point('io.ox/mail/vgrid/options').extend({
            threadView: settings.get('threadView') !== 'off',
            selectFirstItem: settings.get('selectFirstMessage', true)
        });

        // grid
        var options = ext.point('io.ox/mail/vgrid/options').options();
        grid = new VGrid(left, options);

        // add template
        grid.addTemplate(tmpl.main);

        // add grid options
        grid.prop('sort', options.threadView !== false ? 'thread' : '610')
            .prop('order', 'desc')
            .prop('unread', false);

        commons.wireGridAndAPI(grid, api, 'getAllThreads', 'getThreads'); // getAllThreads is redefined below!
        commons.wireGridAndSearch(grid, win, api);

        // ignore thread as sort param on search requests
        grid.setAllRequest('search', function () {
            var options = win.search.getOptions();
            options.folder = grid.prop('folder');
            options.sort = grid.prop('sort') === 'thread' ? '610' : grid.prop('sort');
            options.order = grid.prop('order');
            return api.search(win.search.query, options);
        });

        function drawGridOptions(e, type) {
            var ul = grid.getToolbar().find('ul.dropdown-menu'),
                threadView = settings.get('threadView'),
                isInbox = account.is('inbox', grid.prop('folder')),
                isOn = threadView === 'on' || (threadView === 'inbox' && isInbox);
            // some auto toggling
            if (grid.prop('sort') === 'thread' && !isOn) {
                grid.prop('sort', '610');
            } else if (grid.prop('sort') === '610' && type === 'folder' && isOn && isInbox) {
                grid.prop('sort', 'thread');
            }
            // draw list
            ul.empty().append(
                isOn ? buildOption('thread', gt('Conversations')) : $(),
                buildOption(610, gt('Date')),
                buildOption(603, gt('From')),
                buildOption(102, gt('Label')),
                buildOption(607, gt('Subject')),
                $('<li class="divider">'),
                buildOption('asc', gt('Ascending')),
                buildOption('desc', gt('Descending')),
                $('<li class="divider">'),
                buildOption('unread', gt('Unread only'))
            );
            updateGridOptions();
        }

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

        var option = $('<li><a href="#"><i/></a></li>');

        function buildOption(value, text) {
            return option.clone().find('a').attr('data-option', value).append($.txt(text)).end();
        }

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
                        .on('click', 'a', { grid: grid }, hToolbarOptions)
                    )
                );
            }
        });

        grid.on('change:prop:unread', function (e, value) {
            if (value === true) {
                grid.refresh().done(grid.pause);
            } else {
                grid.resume().refresh(true);
            }
        });

        grid.on('change:prop', drawGridOptions);
        drawGridOptions();

        commons.addGridToolbarFolder(app, grid);

        grid.on('change:ids', function (e, all) {
            // get node & clear now
            var node = grid.getToolbar().find('.grid-count').text(_.noI18n('')),
                total = grid.prop('total'),
                set = function (count) {
                    var str = gt.ngettext('%1$d mail', '%1$d mails', count);
                    node.text(gt.format(str, _.noI18n(count)));
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

            var sort = this.prop('sort'), unread = this.prop('unread');

            return api[sort === 'thread' ? 'getAllThreads' : 'getAll']({
                    folder: this.prop('folder'),
                    sort: sort,
                    order: this.prop('order')
                }, 'auto')
                .pipe(function (response) {
                    if (unread) {
                        response.data = _(response.data).filter(util.isUnseen);
                    }
                    return response;
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

        var isInOpenThreadSummary;

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
                        grid.selection.insertAt(list.slice(1), index);
                    }
                });
            }

            function open(index, cid) {
                if (openThreads[index] === undefined) {
                    var thread = api.getThread(cid);
                    if (thread.length > 1) {
                        openThreads[index] = cid;
                        api.getList(thread).done(function (list) {
                            refresh(list, index);
                        });
                    }
                }
            }

            function close(index, cid) {
                if (openThreads[index] !== undefined) {
                    var thread = api.getThread(cid);
                    delete openThreads[index];
                    api.getList(thread).done(function (list) {
                        grid.selection.remove(list.slice(1));
                        refresh();
                    });
                }
            }

            function toggle(index, cid) {
                if (openThreads[index] === undefined) {
                    open(index, cid);
                } else {
                    close(index, cid);
                }
            }

            grid.getContainer().on('click', '.thread-size', function () {
                var cell = $(this).closest('.vgrid-cell'),
                    index = parseInt(cell.attr('data-index'), 10) + 1,
                    cid = cell.attr('data-obj-id');
                toggle(index, cid);
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

            isInOpenThreadSummary = function (obj) {
                var cid = _.cid(obj),
                    index = grid.selection.getIndex(cid) + 1;
                return openThreads[index] !== undefined;
            };

        }());

        // customize selection
        grid.selection.unfold = function () {
            return [].concat(_(this.get()).map(function (o) {
                return isInOpenThreadSummary(o) ? o : api.getThread(o);
            }));
        };

        var showMail, drawMail, drawFail, drawThread;

        showMail = function (obj) {
            // be busy
            right.idle().busy(true);
            // which mode?
            if (grid.getMode() === "all" && grid.prop('sort') === 'thread' && !isInOpenThreadSummary(obj)) {
                // get thread
                var thread = api.getThread(obj),
                    baton = ext.Baton({ data: thread, app: app });
                // get first mail first
                api.get(api.reduce(thread[0]))
                    .done(_.lfo(drawThread, baton))
                    .fail(_.lfo(drawFail, obj));
            } else {
                api.get(api.reduce(obj))
                    .done(_.lfo(drawMail))
                    .fail(_.lfo(drawFail, obj));
            }
        };

        drawThread = function (baton) {
            viewDetail.drawThread.call(right.idle().empty(), baton.set('options', {
                failMessage: gt('Couldn\'t load that email.'),
                retry: drawThread
            }));
        };

        drawMail = function (data) {
            var baton = ext.Baton({ data: data, app: app });
            right.idle().empty().append(
                viewDetail.draw(baton)
            );
        };

        drawFail = function (obj) {
            right.idle().empty().append(
                $.fail(gt("Couldn't load that email."), function () {
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

        commons.wireGridAndSelectionChange(grid, 'io.ox/mail', showMail, right, api);
        commons.wireGridAndWindow(grid, win);
        commons.wireFirstRefresh(app, api);
        commons.wireGridAndRefresh(grid, api, win);

        grid.setEmptyMessage(function (mode) {
            return mode === 'search' ?
                gt('No mails found for "%s"', win.search.query) :
                gt('No mails in this folder');
        });

        // Uploads
        app.queues = {
            'importEML': upload.createQueue({
                start: function () {
                    win.busy();
                },
                progress: function (file) {
                    return api.importEML({ file: file, folder: app.folder.get() })
                        .done(function (data) {
                            var first = _(data.data || []).first() || {};
                            if ('Error' in first) {
                                notifications.yell('error', first.Error);
                            } else {
                                grid.selection.set(first);
                                notifications.yell('success', gt('Mail has been imported'));
                            }
                        });
                },
                stop: function () {
                    win.idle();
                }
            })
        };

        // drop zone
        var dropZone = new dnd.UploadZone({ ref: "io.ox/mail/dnd/actions" }, app);
        win.on("show", dropZone.include).on('hide', dropZone.remove);

        // search
        (function () {

            var translations = { from: gt('From'), to: gt('To'), cc: gt('CC'), subject: gt('Subject'), text: gt('Mail text') },
                ids = 'from to cc subject text'.split(' '),
                state = { from: true, cc: true, subject: true };

            win.nodes.search.find('form').append(
                _(ids).map(function (name) {
                    return $('<label class="checkbox margin-right">').append(
                        $('<input type="checkbox" value="on">').attr({ name: name, checked: state[name] ? 'checked' : null }),
                        $.txt(translations[name])
                    );
                })
            );

        }());

        // go!
        commons.addFolderSupport(app, grid, 'mail', options.folder)
            .pipe(commons.showWindow(win, grid));
    });

    return {
        getApp: app.getInstance
    };
});
