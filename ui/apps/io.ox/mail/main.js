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

define('io.ox/mail/main',
    ['io.ox/mail/util',
     'io.ox/mail/api',
     'io.ox/core/extensions',
     'io.ox/core/commons',
     'io.ox/core/config',
     'io.ox/core/tk/vgrid',
     'io.ox/mail/view-detail',
     'io.ox/mail/view-grid-template',
     'gettext!io.ox/mail',
     'io.ox/core/tk/upload',
     'io.ox/core/extPatterns/dnd',
     'io.ox/core/extPatterns/actions',
     'io.ox/core/notifications',
     'io.ox/core/api/folder',
     'io.ox/core/api/account',
     'settings!io.ox/mail',
     'io.ox/mail/actions',
     'less!io.ox/mail/style.less',
     'io.ox/mail/folderview-extensions'
    ], function (util, api, ext, commons, config, VGrid, viewDetail, tmpl, gt, upload, dnd, actions, notifications, folderAPI, account, settings) {

    'use strict';

    var draftFolderId = config.get('modules.mail.defaultFolder.drafts'),

        hToolbarOptions = function (e) {
            e.preventDefault();
            var option = $(this).attr('data-option'),
                grid = e.data.grid,
                folder;
            if (/^(603|607|610|102|thread|from-to)$/.test(option)) {
                grid.prop('sort', option).refresh();
                // sort must not react to the prop change event because autotoggle uses this too and would mess up the persistent settings
                grid.updateSettings('sort', option);
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

    // for saving the persistent settings
    // app.updateGridSettings = function (type, value) {
    //     settings.set('vgrid/' + type, value).save();
    // };

    // launcher
    app.setLauncher(function () {

        // get window
        win = ox.ui.createWindow({
            name: 'io.ox/mail',
            title: "Inbox",
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
            max: settings.get('threadMax', 500),
            selectFirst: false,
            threadView: settings.get('threadView') !== 'off',
            //adjust for custom default sort
            sort: settings.get('sort', 'thread'),
            unread: settings.get('unread', false),
            order: settings.get('order', 'desc')
        });

        // grid
        var originalOptions = ext.point('io.ox/mail/vgrid/options').options(),
            options = _.extend({}, originalOptions);

        options.maxChunkSize = options.maxChunkSize || 50;
        options.minChunkSize = options.minChunkSize || 10;
        options.settings = settings;

        // threadview is based on a 500 (default) mail limit
        // in order to view all mails in a folder we offer a link
        options.tail = function (all) {
            var threadSort = this.prop('sort') === 'thread',
                inAllMode = this.getMode() === 'all',
                isUnreadOnly = this.prop('unread'),
                hideTail = !threadSort || !inAllMode || isUnreadOnly,
                count = 0;
            // hide?
            if (hideTail) return $();
            // complex count
            count = _(all).reduce(function (sum, obj) {
                return sum + obj.thread.length;
            }, 0);
            if (count < this.option('max')) return $();
            // show tail
            return $('<div class="vgrid-cell tail">').append(
                $('<a href="#">').text(gt('Show all mails. Note: Mails are no longer grouped by conversation.'))
            );
        };

        grid = new VGrid(left, options);

        // tail click
        left.on('click', '.vgrid-cell.tail', function (e) {
            e.preventDefault();
            grid.prop('sort', 610).refresh();
        });

        // add template
        grid.addTemplate(tmpl.main);

        // folder change
        grid.on('change:prop:folder', function (e, folder) {
            // reset "unread only"
            grid.prop('unread', false);
            // template changes for unified mail
            var unified = folderAPI.is('unifiedfolder', folder);
            if (unified !== tmpl.unified) {
                tmpl.unified = unified;
                grid.updateTemplates();
            }
        });

        //get sorting settings with fallback for extpoint
        var sortSettings = {};
        sortSettings.sort = options.sort || settings.get('sort', 'thread');
        sortSettings.unread = options.unread || settings.get('unread', false);
        sortSettings.order = options.desc || settings.get('order', 'desc');

        //check if folder actually supports threadview
        if (sortSettings.sort === 'thread' && options.threadView === false) {
            sortSettings.sort = '610';
        }

        // add grid options
        grid.prop('sort', sortSettings.sort)
            .prop('order', sortSettings.order)
            .prop('unread', sortSettings.unread);
        // temp variable not needed anymore
        sortSettings = null;

        // sort property is special and needs special handling because of the auto toggling if threadview is not uspported
        // look into hToolbarOptions function for this
        grid.on('change:prop:unread', function (e, value) {
            grid.updateSettings('unread', value);
        });
        grid.on('change:prop:order', function (e, value) {
            grid.updateSettings('order', value);
        });

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
            } //jump back only if thread was the original setting
            else if (grid.prop('sort') === '610' && type === 'folder' && isOn && isInbox && settings.get('sort') === 'thread') {
                grid.prop('sort', 'thread');
            }

            // draw list
            ul.empty().append(
                isOn ? buildOption('thread', gt('Conversations')) : $(),
                buildOption(610, gt('Date')),
                buildOption('from-to', gt('From')),
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
            // sent folder?
            list.find('[data-option="from-to"] span').text(
                account.is('sent', props.folder) ? gt('To') : gt('From')
            );
            // unread
            dropdown.find('.icon-envelope')[props.unread ? 'show' : 'hide']();
            // order
            var opacity = [1, 0.4][props.order === 'desc' ? 'slice' : 'reverse']();
            dropdown.find('.icon-arrow-down').css('opacity', opacity[0]).end()
                .find('.icon-arrow-up').css('opacity', opacity[1]).end();
        }

        function buildOption(value, text) {
            return $('<li>').append(
                $('<a href="#">').attr('data-option', value).append(
                    $('<i>'), $('<span>').text(text)
                )
            );
        }

        /**
         * @param  {event} e
         * @param  {string} path     (key)
         * @param  {string} value    (value t0)
         * @param  {string} previous (value t-1)
         * @return {undefined}
         */
        function handleSettingsChange(e, path, value, previous) {
            /**
             * update grid 'sort' property if necessary
             * @param  {string} key
             * @return {undefined}
             */
            var opt = options,

                sortby = function (key) {
                    var isInbox = account.is('inbox', grid.prop('folder')),
                        ignored =  isInbox ? (value + previous).replace('inbox', '').replace('on', '') === ''
                                           : (value + previous).replace('inbox', '').replace('off', '') === '';

                    if (!ignored) {
                        grid.prop('sort', key)
                            .refresh()
                            .pipe(function () {
                                //called manually cause call skipped within refresh (sort property doesn't change)
                                if (grid.prop('sort') === key)
                                    drawGridOptions(undefined, 'sort');
                                //sort must not react to the prop change event because autotoggle
                                //uses this too and would mess up the persistent settings
                                grid.updateSettings('sort', key);
                            });
                    }
                },

                //switch object
                switcher = {
                    threadView: {
                        on: function () { sortby('thread'); },
                        inbox: function () { sortby('thread'); },
                        off: function () { sortby(opt.sort || '610'); }
                    }
                };

            //switch
            if (switcher[path] && switcher[path][value]) {
                switcher[path][value]();
            }
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

        grid.on('change:prop', drawGridOptions);
        settings.on('change', handleSettingsChange);
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

        var unseenHash = {};

        function isUnseen(obj) {
            return api.tracker.isUnseen(obj);
        }

        function updateUnseenHash(list) {
            _(list).each(function (obj) {
                var cid = _.cid(obj);
                if (isUnseen(cid)) {
                    unseenHash[cid] = true;
                }
            });
        }

        function resetUnseenHash() {
            unseenHash = {};
        }

        function filterUnread(data) {
            // return all mails that are either unseen or in unseenHash
            return _(data).filter(function (obj) {
                var cid = _.cid(obj);
                if (cid in unseenHash) return true;
                if (isUnseen(cid)) {
                    unseenHash[cid] = true;
                    return true;
                }
                return false;
            });
        }

        grid.setAllRequest(function () {

            var sort = this.prop('sort'),
                unread = this.prop('unread'),
                call = sort === 'thread' ? 'getAllThreads' : 'getAll',
                options = {
                    folder: this.prop('folder'),
                    max: this.option('max'),
                    order: this.prop('order'),
                    sort: sort
                };

            return api[call](options, 'auto').then(function (response) {
                var data = response.data || response;
                return unread ? filterUnread(data) : data;
            });
        });

        grid.setAllRequest('search', function () {
            var options = win.search.getOptions(),
                unread = grid.prop('unread');
            options.folder = grid.prop('folder');
            options.sort = grid.prop('sort');
            options.order = grid.prop('order');
            return api.search(win.search.query, options).then(function (data) {
                return unread ? filterUnread(data) : data;
            });
        });

        grid.setListRequest(function (ids) {
            var sort = this.prop('sort');
            return api[sort === 'thread' ? 'getThreads' : 'getList'](ids);
        });

        grid.on('change:prop:unread', function (e, value) {
            var state = grid.prop('unread');
            if (value === true) {
                // turn on
                grid.prop('unread', true);
                // add all unread mails to hash
                updateUnseenHash(grid.getIds());
                // refresh now
                grid.refresh();
            } else {
                // turn off
                grid.prop('unread', false).refresh();
                resetUnseenHash();
            }
        });

        win.nodes.title.on('click', '.badge', function (e) {
            e.preventDefault();
            grid.prop('unread', !grid.prop('unread'));
        });


        // custom all request

        /*
         * Thread summary
         */

        var isInOpenThreadSummary;

        (function () {

            var openThreads = tmpl.openThreads = {};

            // add label template
            grid.addLabelTemplate(tmpl.thread);
            grid.requiresLabel = function (i, data, current) {
                return openThreads[i] !== undefined;
            };

            function refresh(list, index) {
                grid.repaintLabels().done(function () {
                    grid.repaint();
                });
            }

            function icon(cid, type) {
                grid.getContainer()
                    .find('.vgrid-cell[data-obj-id="' + cid + '"]')
                    .find('.thread-size i')
                    .attr('class', 'icon-caret-' + type);
            }

            function open(index, cid) {
                if (openThreads[index] === undefined) {
                    var thread = api.getThread(cid);
                    if (thread.length > 1) {
                        openThreads[index] = cid;
                        icon(cid, 'down');
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
                    icon(cid, 'right');
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

            // reset on folder change
            grid.on('change:prop:folder', function () {
                openThreads = tmpl.openThreads = {};
            });

            // close if deleted
            api.on('beforedelete', function (e, ids) {
                var hash = {};
                _(ids).each(function (obj) {
                    hash[_.cid(obj)] = true;
                });
                _(openThreads).each(function (cid, index) {
                    if (cid in hash) delete openThreads[index];
                });
            });

            isInOpenThreadSummary = function (obj) {
                var cid = _.cid(obj),
                    index = grid.selection.getIndex(cid) + 1;
                return openThreads[index] !== undefined;
            };

        }());

        // customize selection
        grid.selection.unfold = function () {
            return _.flatten(_(this.get()).map(function (o) {
                return isInOpenThreadSummary(o) ? o : api.getThread(o);
            }), true);
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

        showMail.cancel = function () {
            _.lfo(drawThread);
            _.lfo(drawMail);
            _.lfo(drawFail);
        };

        drawThread = function (baton) {
            viewDetail.drawThread.call(right.idle(), baton.set('options', {
                failMessage: gt('Couldn\'t load that email.'),
                retry: drawThread
            }));
        };

        drawMail = function (data) {
            var baton = ext.Baton({ data: data, app: app }),
                mail = viewDetail.draw(baton);
            right.idle().empty().append(mail);
        };

        drawFail = function (obj, e) {
            right.idle().empty().append(
                // not found?
                e && e.code === 'MSG-0032' ?
                    $.fail(gt('The requested email no longer exists')) :
                    // general error
                    $.fail(gt('Couldn\'t load that email.'), function () {
                        showMail(obj);
                    })
            );
        };

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


        //if viewSetting ins changed redraw detailviews and grid
        api.on('viewChanged', function () {
            grid.selection.retrigger(true);//to refresh detailviews and grid
        });

        // search
        (function () {

            ext.point('io.ox/mail/search/defaults').extend({
                from: true,
                cc: true,
                subject: true
            });

            var translations = { from: gt('From'), to: gt('To'), cc: gt('CC'), subject: gt('Subject'), text: gt('Mail text') },
                ids = 'from to cc subject text'.split(' '),
                defaults = ext.point('io.ox/mail/search/defaults').options();

            win.nodes.search.find('.input-append').append(
                _(ids).map(function (name) {
                    return $('<label class="checkbox margin-right">').append(
                        $('<input type="checkbox" value="on">').attr({ name: name, checked: defaults[name] ? 'checked' : null }),
                        $.txt(translations[name])
                    );
                })
            );

        }());

        // drag & drop
        win.nodes.outer.on('selection:drop', function (e, baton) {
            actions.invoke('io.ox/mail/actions/move', null, baton);
        });

        // go!
        commons.addFolderSupport(app, grid, 'mail', options.folder)
            .pipe(commons.showWindow(win, grid));
    });

    return {
        getApp: app.getInstance
    };
});
