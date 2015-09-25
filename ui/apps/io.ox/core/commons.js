/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/commons', [
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'gettext!io.ox/core',
    'io.ox/core/folder/api',
    'io.ox/core/api/account'
], function (ext, links, gt, /*FolderView,*/ folderAPI, accountAPI) {

    'use strict';

    var commons = {

        /**
         * Common show window routine
         */
        showWindow: function (win) {
            return function () {
                var def = $.Deferred();
                win.show(def.resolve);
                return def;
            };
        },

        simpleMultiSelection: function (node, selection, grid) {
            var length = selection.length;

            if (length <= 1) return;

            node.idle().empty().append(
                $('<div class="io-ox-center multi-selection-message">').append(
                    $('<div class="message" id="' + grid.multiselectId + '">').append(
                        gt.format(
                            //#. number of selected item
                            //#. %1$s is the number surrounded by a tag
                            gt.ngettext('%1$s item selected', '%1$s items selected', length), $('<span class="number">').text(length).prop('outerHTML')
                        )
                    )
                )
            );
        },

        mobileMultiSelection: (function () {
            var points = {};

            // counter is always shown
            ext.point('io.ox/core/commons/mobile/multiselect').extend({
                id: 'selectCounter',
                index: '100',
                draw: function (data) {
                    this.append(
                        $('<div class="toolbar-button select-counter">')
                            .text(data.count)
                    );
                }
            });

            function draw(id, selection, grid) {
                var node = $('<div>');

                ext.point('io.ox/core/commons/mobile/multiselect').invoke('draw', node, { count: selection.length });

                (points[id] || (points[id] = ext.point(id + '/mobileMultiSelect/toolbar')))
                    .invoke('draw', node, { data: selection, grid: grid });
                return node;
            }

            return function (id, node, selection, api, grid) {

                // get current app's window container as context
                var context = $(node).closest('.window-container'),
                    buttons = $('.window-toolbar .toolbar-button', context),
                    toolbar = $('.window-toolbar', context),
                    toolbarID = 'multi-select-toolbar',
                    container;

                if ($('#' + toolbarID).length > 0) {
                    // reuse old toolbar
                    container = $('#' + toolbarID);
                } else {
                    // or creaet a new one
                    container = $('<div>', { id: toolbarID });
                }
                _.defer(function () {
                    if (selection.length > 0) {
                        // update selection in toolbar
                        buttons.hide();
                        $('#' + toolbarID).remove();
                        toolbar.append(container.append(draw(id, selection, grid)));
                    } else {
                        // selection empty
                        $('#' + toolbarID).remove();
                        buttons.show();
                    }
                }, 10);
            };
        }()),

        wireGridAndSelectionChange: function (grid, id, draw, node, api) {
            var last = '', label;
            grid.selection.on('change', function (e, selection) {

                var len = selection.length,
                    // work with reduced string-based set
                    flat = JSON.stringify(_([].concat(selection)).map(function (o) {
                        return { folder_id: String(o.folder_id || o.folder), id: String(o.id), recurrence_position: String(o.recurrence_position || 0) };
                    }));

                function updateLabel() {
                    var parent = node.parent();
                    if (len <= 1 && label) {
                        //reset label
                        parent.attr('aria-label', _.escape(label));
                    } else if (len > 1) {
                        //remember label
                        label = label || parent.attr('aria-label');
                        //overwrite
                        parent.attr('aria-label', gt('Selection Details'));
                    }
                }

                // has anything changed?
                if (flat !== last) {
                    if (len === 1) {
                        // single selection
                        node.css('height', '');
                        draw(selection[0]);
                    } else if (len > 1) {
                        // multi selection
                        if (draw.cancel) draw.cancel();
                        node.css('height', '100%');
                        commons.simpleMultiSelection(node, this.unique(this.unfold()), grid);
                    } else {
                        // empty
                        if (draw.cancel) draw.cancel();
                        node.css('height', '100%').idle().empty().append(
                            $('<div class="io-ox-center">').append(
                                $('<div class="io-ox-multi-selection">').append(
                                    $('<div class="summary empty">').text(gt('No elements selected'))
                                )
                            )
                        );
                        if (_.device('smartphone')) {
                            //don't stay in empty detail view
                            var vsplit = node.closest('.vsplit');
                            //only click if in detail view to prevent infinite loop
                            if (!vsplit.hasClass('vsplit-reverse')) {
                                //trigger back button
                                vsplit.find('.rightside-navbar a>i').last().trigger('click');
                            }
                        }
                    }
                    //landmark label
                    updateLabel();
                    // remember current selection
                    last = flat;
                }
            });

            grid.selection.on('_m_change', function () {
                commons.mobileMultiSelection(id, node, this.unique(this.unfold()), api, grid);
            });

            // look for id change
            if (api) {
                api.on('change:id', function (e, data, former_id) {
                    var list = grid.selection.get();
                    if (list.length && list[0].id === former_id) {
                        grid.selection.set({ id: data.id, folder_id: data.folder_id });
                    }
                });
            }
        },

        /**
         * Wire grid & API
         */
        wireGridAndAPI: function (grid, api, getAll, getList) {
            // all request
            grid.setAllRequest(function () {
                return api[getAll || 'getAll']({ folder: this.prop('folder') });
            });
            // list request
            grid.setListRequest(function (ids) {
                return api[getList || 'getList'](ids);
            });
            // clean up selection index on delete
            api.on('beforedelete', function (e, ids) {

                grid.selection.removeFromIndex(ids);

                var list = grid.selection.get(), index;
                if (list.length > 0) {
                    if (_.device('smartphone')) {
                        //preparation to return to vgrid
                        grid.selection.clear(true);
                    } else {
                        index = grid.selection.getIndex(list[0]);
                        grid.selection.clear(true).selectIndex(index + 1);
                        if (grid.getIds().length === list.length) {
                            grid.selection.trigger('change', []);
                        }
                    }
                }
            });
        },

        /**
         * Wire grid & window
         */
        wireGridAndWindow: function (grid, win) {
            var top = 0, on = function () {
                grid.keyboard(true);
                if (grid.selection.get().length) {
                    // only retrigger if selection is not empty; hash gets broken if caches are empty
                    // TODO: figure out why this was important
                    grid.selection.retriggerUnlessEmpty();
                }
            };

            grid.setApp(win.app);
            // show
            win.on('show idle', on)
                // hide
                .on('hide busy', function () {
                    grid.keyboard(false);
                })
                .on('beforeshow', function () {
                    if (top !== null) { grid.scrollTop(top); }
                })
                .on('beforehide', function () {
                    top = grid.scrollTop();
                });
            // publish grid
            if (win.app) {
                win.app.getGrid = function () {
                    return grid;
                };
            }
            // already visible?
            if (win.state.visible) { on(); }
        },

        /**
         * [ description]
         * @param  {Object}  app           application object
         * @param  {Object}  grid          grid object
         * @return void
         */
        addGridToolbarFolder: function (app, grid) {

            ext.point(app.get('name') + '/vgrid/toolbar').extend({
                id: 'info',
                index: 200,
                draw: function () {
                    this.append(
                        $('<div class="grid-info">')
                    );
                }
            });

            var name = app.get('name'),
                // right now, only mail folders supports "total" properly
                countGridData = name !== 'io.ox/mail';

            function getInfoNode() {
                var visible = app.getWindow && app.getWindow().state.visible;
                return visible ? grid.getToolbar().find('.grid-info') : $();
            }

            function drawFolderInfo(folder_id) {

                if (!folder_id) return;

                var node = getInfoNode();

                node.empty()
                .attr('data-folder-id', folder_id)
                .append(
                    $('<span class="folder-name">'),
                    $.txt(' '),
                    $('<span class="folder-count">')
                );

                folderAPI.get(folder_id).done(function success(data) {

                    var total = countGridData ? grid.getIds().length : data.total,
                        node = grid.getToolbar().find('[data-folder-id="' + folder_id + '"]');
                    grid.getContainer().attr('aria-setsize', total);
                    grid.meta = {
                        total: total,
                        title: data.title
                    };
                    grid.trigger('meta:update');
                    node.find('.folder-name').text(data.title);

                    if (total > 0) {
                        node.find('.folder-count').text('(' + total + ')');
                    }
                });
            }

            grid.on({
                'change:prop:folder change:mode change:ids': function () {

                    var folder_id = grid.prop('folder'), mode = grid.getMode();
                    if (mode === 'all') {
                        // non-search; show foldername
                        drawFolderInfo(folder_id);
                    } else if (mode === 'search') {
                        var node = getInfoNode();
                        node.find('.folder-name')
                            .text(gt('Results'));
                        node.find('.folder-count')
                            .text('(' + grid.getIds().length + ')');
                    }
                }
            });

            // unread counter for mail
            folderAPI.on('update:total', function (id) {
                // check for current folder (otherwise we get cross-app results! see bug #28558)
                if (id === app.folder.get()) drawFolderInfo(id);
            });

            ext.point(app.get('name') + '/vgrid/toolbar').invoke('draw', grid.getToolbar());

            // try to set initial value
            $.when(
                app.folder.initialized,
                app.getWindow().shown
            )
            .done(function (result) {
                drawFolderInfo(result[0]);
            });
        },

        /**
         * Wire first refresh
         */
        wireFirstRefresh: function (app, api) {
            // don't need first refresh if persistence=false
            if (ox.serverConfig.persistence === false) return;
            // open (first show)
            app.getWindow().on('open', function () {
                if (api.needsRefresh(app.folder.get())) {
                    api.trigger('refresh^', app.folder.get());
                }
            });
        },

        /**
         * Wire grid and API refresh
         */
        wireGridAndRefresh: function (grid, api, win) {
            var refreshAll = function () {
                    grid.refresh(true);
                    if (_.device('smartphone')) grid.selection.retrigger();
                },
                refreshList = function () {
                    grid.repaint();
                    grid.selection.retrigger();
                },
                pending = function () {
                    grid.pending();
                },
                off = function () {
                    api.off('refresh.all refresh:all:local', refreshAll)
                        .off('refresh.pending', pending)
                        .off('refresh.list', refreshList);
                },
                on = function () {
                    off();
                    api.on('refresh.all refresh:all:local', refreshAll)
                        .on('refresh.pending', pending)
                        .on('refresh.list', refreshList)
                        .trigger('refresh.all');
                };
            win.on({ show: on, hide: off });
            // already visible?
            if (win.state.visible) { on(); }
        },

        wirePerspectiveEvents: function (app) {
            var win = app.getWindow();
            var oldPerspective = null;
            win.on('show', function () {
                oldPerspective = win.currentPerspective;
                if (win.currentPerspective) {
                    app.trigger('perspective:' + win.currentPerspective + ':show');
                }
            });

            win.on('hide', function () {
                oldPerspective = win.currentPerspective;
                if (win.currentPerspective) {
                    app.trigger('perspective:' + win.currentPerspective + ':hide');
                }
            });

            win.on('change:perspective', function (e, newPerspective) {
                if (oldPerspective) {
                    app.trigger('perspective:' + oldPerspective + ':hide');
                }
                oldPerspective = newPerspective;
                app.trigger('perspective:' + newPerspective + ':show');
            });

            win.on('change:initialPerspective', function (e, newPerspective) {
                oldPerspective = newPerspective;
                app.trigger('perspective:' + newPerspective + ':show');
            });
        },

        /**
         * Add folder support
         */
        addFolderSupport: function (app, grid, type, defaultFolderId) {

            app.folder
                .updateTitle(app.getWindow())
                .setType(type);
            if (grid) {
                app.folder.updateGrid(grid);
            }

            // hash support
            app.getWindow().on('show', function () {
                if (grid) {
                    grid.selection.retriggerUnlessEmpty();
                }
                _.url.hash('folder', app.folder.get());
            });

            defaultFolderId = _.url.hash('folder') || defaultFolderId;

            function apply(id) {
                return app.folder.set(id).then(null, function () {
                    // fallback to default on error
                    return app.folder.setDefault();
                });
            }

            // explicit vs. default
            if (defaultFolderId !== undefined) {
                return apply(defaultFolderId);
            } else if (type === 'mail') {
                return accountAPI.getUnifiedInbox().then(function (id) {
                    if (id === null) return app.folder.setDefault();
                    return apply(id);
                });
            } else {
                return app.folder.setDefault();
            }
        },

        /**
         * stores state of propery collection for a specfied key property
         * @param {object} grid
         * @param {object} options
         * @param {string} options.keyprop  cache id / changes on this trigger cache set
         * @param {array}  options.props    cached properties
         */
        addPropertyCaching: function (grid, options) {
            //be robust
            grid = grid || { prop: $.noop() };

            var mapping = {},
                superprop = grid.prop,
                opt = $.extend({
                    keyprop: 'folder',
                    props: ['sort', 'order']
                }, options || {}),
                //fluent cache
                storage = {},
                cache = {
                    set: function (id, key, value) {
                        storage[id] = storage[id] || {};
                        storage[id][key] = value;
                    },
                    get: function (id, key) {
                        //return specific/all prop(s)
                        return !key ? storage[id] || {} : (storage[id] || {})[key];
                    },
                    remove: function (id) {
                        storage[id] = {};
                    },
                    clear: function () {
                        storage = {};
                    }
                };

            //ensure array
            opt.props = [].concat(opt.props);

            //register props
            _.each(opt.props, function (key) {
                mapping[key] = true;
            });

            //save state if key property is changed
            function process(key, value) {
                var id,
                    fulfilled = key === opt.keyprop &&
                               typeof value !== 'undefined' &&
                               value !== superprop(opt.keyprop);
                //condition fulfilled
                if (fulfilled) {
                    //current key property value valid (used as cache id)
                    id = superprop(opt.keyprop);
                    if (id) {
                        //collect and store current props
                        cache.remove(id);
                        _.each(opt.props, function (prop) {
                            cache.set(id, prop, superprop(prop));
                        });
                    }
                }
            }
            if (_.isUndefined(grid.propcache)) {
                //access property cache via grid
                grid.propcache = function (key, fallback, id) {
                    id = id || superprop(opt.keyprop);
                    return mapping[key] ? cache.get(id, key) || fallback : fallback;
                };

                //overwrite prop method
                grid.prop = function (key, value) {
                    process(key, value);
                    return superprop.call(grid, key, value);
                };
            }
        },

        addGridFolderSupport: function (app, grid) {
            app.folder.updateGrid(grid);
            app.getWindow().on('show', function () {
                grid.selection.retriggerUnlessEmpty();
            });
        },

        vsplit: (function () {
            var selectionInProgress = false;

            var click = function (e) {
                e.preventDefault();
                if (selectionInProgress) {
                    //prevent execution of selection to prevent window from flipping back
                    selectionInProgress = false;
                }
                $(this).parent().find('.rightside-inline-actions').empty();
                $(this).closest('.vsplit').addClass('vsplit-reverse').removeClass('vsplit-slide');
                if (e.data.app && e.data.app.getGrid) {
                    if (_.device('smartphone')) {
                        e.data.app.getGrid().selection.trigger('changeMobile');
                    }
                    e.data.app.getGrid().selection.clear();
                }

                if (_.device('smartphone')) {
                    $(this).closest('.vsplit').find('.leftside .tree-container').trigger('changeMobile');
                }
            };

            var select = function () {
                var node = $(this);
                selectionInProgress = true;
                setTimeout(function () {
                    if (selectionInProgress) {
                        // still valid
                        node.closest('.vsplit').addClass('vsplit-slide').removeClass('vsplit-reverse');
                        selectionInProgress = false;
                    }
                }, 100);
            };

            return function (parent, app) {
                var sides = {};
                parent.addClass('vsplit').append(
                    // left
                    sides.left = $('<div class="leftside">')
                    .attr({
                        'role': 'navigation',
                        'aria-label': gt('Item list')
                    })
                    .on('select', select),
                    // navigation
                    $('<div class="rightside-navbar">').append(
                        $('<div class="rightside-inline-actions">'),
                        $('<a href="#" tabindex="-1">').append(
                            $('<i class="fa fa-chevron-left">'), $.txt(' '), $.txt(gt('Back'))
                        ).on('click', { app: app }, click)
                    ),
                    // right
                    sides.right = $('<div class="rightside">')
                );
                //
                return sides;
            };
        }()),

        mediateFolderView: function (app) {

            function toggleFolderView(e) {
                e.preventDefault();
                e.data.app.folderView.toggle(e.data.state);
            }

            function onFolderViewOpen(app) {
                app.getWindow().nodes.main.find('.vgrid').removeClass('bottom-toolbar');
            }

            function onFolderViewClose(app) {
                app.getWindow().nodes.main.find('.vgrid').addClass('bottom-toolbar');
            }

            // create extension point for second toolbar
            ext.point(app.get('name') + '/vgrid/second-toolbar').extend({
                id: 'default',
                index: 100,
                draw: function () {
                    this.addClass('visual-focus').append(
                        $('<a href="#" class="toolbar-item" tabindex="1">')
                        .attr('title', gt('Open folder view'))
                        .append($('<i class="fa fa-angle-double-right">'))
                        .on('click', { app: app, state: true }, toggleFolderView)
                    );
                }
            });

            var side = app.getWindow().nodes.sidepanel.addClass('bottom-toolbar');

            side.append(
                $('<div class="generic-toolbar bottom visual-focus">').append(
                    $('<a href="#" class="toolbar-item" role="button" tabindex="1">')
                    .append(
                        $('<i class="fa fa-angle-double-left" aria-hidden="true">'),
                        $('<span class="sr-only">').text(gt('Close folder view'))
                    )
                    .on('click', { app: app, state: false }, toggleFolderView)
                )
            );

            app.on({
                'folderview:open': onFolderViewOpen.bind(null, app),
                'folderview:close': onFolderViewClose.bind(null, app)
            });

            var grid = app.getGrid(), topbar = grid.getTopbar();
            ext.point(app.get('name') + '/vgrid/second-toolbar').invoke('draw', topbar, ext.Baton({ grid: grid }));
            onFolderViewClose(app);

            if (app.folderViewIsVisible()) _.defer(onFolderViewOpen, app);
        }
    };

    /*
     * View container
     */

    // view container with dispose capability
    var originalCleanData = $.cleanData,
        triggerDispose = function (elem) {
            $(elem).triggerHandler('dispose');
        };

    $.cleanData = function (list) {
        _(list).map(triggerDispose);
        return originalCleanData.call(this, list);
    };

    // factory
    $.createViewContainer = function (baton, api, getter) {

        var data = baton instanceof ext.Baton ? baton.data : baton,
            cid = _.cid(data),
            ecid = _.ecid(data),
            shortecid = 'recurrence_position' in data ? _.ecid({ id: data.id, folder: (data.folder_id || data.folder) }) : null,
            node = $('<div>').attr('data-cid', _([].concat(data)).map(_.cid).join(',')),

            update = function (e, changed) {
                // id change?
                if (changed && (changed.former_id || changed.id !== data.id)) {
                    data = changed;
                }

                if (getter = (getter || (api ? api.get : null))) {
                    // fallback for create trigger
                    if (!data.id) {
                        data.id = arguments[1].id;
                    }
                    // get fresh object
                    getter(api.reduce(data)).done(function (data) {
                        if (baton instanceof ext.Baton) {
                            baton.data = data;
                        } else {
                            baton = data;
                        }
                        if (node) node.triggerHandler('redraw', baton);
                    });
                }
            },

            move = function (e, targetFolderId) {
                if (data) data.folder_id = targetFolderId;
                if (update) update();
            },

            // we use redraw directly if we're in multiple mode
            // each redraw handler must get the data on its own
            redraw = _.debounce(function () {
                if (node) node.triggerHandler('redraw', baton);
            }, 10),

            remove = function () {
                if (node) node.trigger('view:remove').remove();
            },

            // checks if folder permissions etc. have changed, and triggers redraw.
            // Important to update inline links
            checkFolder = function (folder) {
                var data = this;
                if (folder === data.folder.toString() && api) {
                    api.trigger('update:' + data.cid);
                }
            };

        if (_.isArray(data)) {
            // multiple items - just listen to generic events.
            // otherweise "select all" of some thousands items freezes browser
            folderAPI.on('update',  redraw);
            // ignore move case for multiple
            api.on('delete update', redraw);
        } else {
            // single item
            folderAPI.on('update', checkFolder, { cid: cid, folder: data.folder_id });
            api.on('delete:' + ecid + (shortecid ? ' delete:' + shortecid : ''), remove);
            api.on('create update:' + ecid + (shortecid ? ' update:' + shortecid : ''), update);
            api.on('move:' + ecid, move);
        }

        return node.one('dispose', function () {
            if (_.isArray(data)) {
                folderAPI.off('update', redraw);
                api.off('delete update', redraw);
            } else {
                folderAPI.off('update', checkFolder);
                api.off('delete:' + ecid, remove);
                api.off('create update:' + ecid + (shortecid ? ' update:' + shortecid : ''), update);
                api.off('move:' + ecid, move);
            }
            api = update = data = node = getter = cid = ecid = null;
        });
    };

    // located here since we need a translation for 'Retry'

    $.fail = function (msg, retry) {
        var tmp = $('<div>')
            .addClass('io-ox-fail')
            .append(
                $('<span>').text(msg)
            );
        if (retry) {
            tmp.append(
                $('<span>').text(' ')
            )
            .append(
                $('<a>', { href: '#' }).text(gt('Retry'))
                .on('click', function (e) {
                    e.preventDefault();
                    $(this).closest('.io-ox-center').remove();
                    retry.apply(this, arguments);
                })
            );
        }
        return tmp.center();
    };

    // Accessibility F6 jump
    var macos = _.device('macos');
    // do not focus nodes with negative tabindex, or hidden nodes
    var tabindexSelector = '[tabindex]:not([tabindex^="-"]):visible';
    $(document).on('keydown.f6', function (e) {

        if (e.which === 117 && (macos || e.ctrlKey)) {

            e.preventDefault();

            var items = $('#io-ox-core .f6-target:visible'),
                closest = $(document.activeElement).closest('.f6-target'),
                oldIndex = items.index(closest) || 0,
                newIndex = oldIndex,
                nextItem;

            // find next f6-target that is focusable or contains a focusable node
            do {
                newIndex += (e.shiftKey ? -1 : +1);
                if (newIndex >= items.length) newIndex = 0;
                if (newIndex < 0) newIndex = items.length - 1;
                nextItem = items.eq(newIndex);

                if (nextItem.is(tabindexSelector)) {
                    nextItem.focus();
                    break;
                }

                nextItem = nextItem.find(tabindexSelector).first();
                if (nextItem.length) {
                    nextItem.focus();
                    break;
                }
            } while (oldIndex !== newIndex);
        }
    });

    return commons;
});
