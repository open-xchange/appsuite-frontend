/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/core/commons', [
    'io.ox/core/extensions',
    'gettext!io.ox/core',
    'io.ox/core/folder/api',
    'io.ox/core/api/account',
    'io.ox/backbone/mini-views/helplink',
    'settings!io.ox/core',
    'io.ox/backbone/mini-views/upsell',
    'io.ox/backbone/views/actions/util',
    'io.ox/core/capabilities'
], function (ext, gt, folderAPI, accountAPI, HelpLinkView, coreSettings, UpsellView, actionsUtil, capabilities) {

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

            //#. %1$s is the number of selected items
            //#, c-format
            var pattern = gt.ngettext('%1$s item selected', '%1$s items selected', length);

            // create a <span> element with the number of items for the placeholder
            var nodes = _.noI18n.assemble(pattern, function () { return $('<span class="number">').text(_.noI18n(length)); }, $.txt);

            node.idle().empty().append(
                $('<div class="io-ox-center multi-selection-message">').append(
                    $('<div class="message" id="' + grid.multiselectId + '">').append(nodes)
                )
            );
        },


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
            var top = 0,
                on = function () {
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
                    var countGridData = !folderAPI.supports('count_total', data);
                    var total = countGridData ? grid.getIds().length : data.total,
                        node = grid.getToolbar().find('[data-folder-id="' + folder_id + '"]');

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

            function updateFolderInfo() {
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
            grid.on('change:prop:folder change:mode change:ids', updateFolderInfo);
            folderAPI.on('after:rename', updateFolderInfo);

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
                return app.folder.set(id).then(_.identity, function () {
                    // fallback to default on error
                    return $.when(app.folder.setDefault());
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
            }
            return app.folder.setDefault();
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
                        'role': 'complementary',
                        'aria-label': gt('Item list')
                    })
                    .on('select', select),
                    // navigation
                    $('<div class="rightside-navbar">').append(
                        $('<div class="rightside-inline-actions">'),
                        $('<a href="#" tabindex="-1">').append(
                            $('<i class="fa fa-chevron-left" aria-hidden="true">'), $.txt(' '), $.txt(gt('Back'))
                        ).on('click', { app: app }, click)
                    ),
                    // right
                    sides.right = $('<div class="rightside">')
                );
                //
                return sides;
            };
        }()),

        help: function (baton) {
            if (_.device('smartphone')) return;

            var helpLinkView = new HelpLinkView({
                href: getLink(baton && baton.app && baton.app.id)
            });
            this.find('.generic-toolbar.bottom:last-of-type').append(
                helpLinkView.render().$el
            );

            function getLink(id) {
                if (id === 'io.ox/mail') return 'ox.appsuite.user.sect.email.gui.foldertree.html';
                if (id === 'io.ox/files') return 'ox.appsuite.user.sect.drive.gui.foldertree.html';
                if (id === 'io.ox/contacts') return 'ox.appsuite.user.sect.contacts.gui.foldertree.html';
                if (id === 'io.ox/calendar') return 'ox.appsuite.user.sect.calendar.gui.foldertree.html';
                if (id === 'io.ox/tasks') return 'ox.appsuite.user.sect.tasks.gui.foldertree.html';
                return 'ox.appsuite.user.sect.dataorganisation.folder.html';
            }
        },

        mediateFolderView: function (app) {
            function toggleFolderView(e) {
                e.data.app.folderView.toggle(e.data.state);

                if (!!e.data.state) {
                    e.data.app.folderView.tree.getNodeView(e.data.app.folder.get()).$el.focus();
                } else {
                    var grid = e.data.app.grid;

                    if (grid.getIds().length === 0) return grid.getContainer().focus();
                    grid.selection.focus();
                }
            }

            function onFolderViewOpen(app) {
                app.getWindow().nodes.sidepanel.show();
                app.getWindow().nodes.main.find('.vgrid').removeClass('bottom-toolbar');
            }

            function onFolderViewClose(app) {
                // hide sidepanel so invisible objects are not tabbable
                app.getWindow().nodes.sidepanel.hide();
                app.getWindow().nodes.main.find('.vgrid').addClass('bottom-toolbar');
            }

            // create extension point for second toolbar
            ext.point(app.get('name') + '/vgrid/second-toolbar').extend({
                id: 'default',
                index: 100,
                draw: function () {
                    this.addClass('visual-focus').append(
                        $('<button type="button" class="btn btn-link toolbar-item" data-action="open-folder-view">')
                        .attr('aria-label', gt('Open folder view'))
                        .append($.icon('fa-angle-double-right', gt('Open folder view')))
                        .on('click', { app: app, state: true }, toggleFolderView)
                    );
                }
            });

            ext.point(app.get('name') + '/sidepanel').extend({
                id: 'toggle-folderview',
                index: 1000,
                draw: function () {
                    var guid = _.uniqueId('control');

                    this.addClass('bottom-toolbar').append(
                        $('<div class="generic-toolbar bottom visual-focus" role="region">').attr('aria-labelledby', guid).append(
                            $('<button type="button" class="btn btn-link toolbar-item" data-action="close-folder-view">').attr({ id: guid, 'aria-label': gt('Close folder view') })
                            .append(
                                $.icon('fa-angle-double-left', gt('Close folder view'))
                            )
                            .on('click', { app: app, state: false }, toggleFolderView)
                        )
                    );
                }
            });

            ext.point(app.get('name') + '/sidepanel').extend({
                id: 'help',
                index: 1100,
                draw: commons.help
            });

            app.on({
                'folderview:open': onFolderViewOpen.bind(null, app),
                'folderview:close': onFolderViewClose.bind(null, app)
            });

            var grid = app.getGrid(), topbar = grid.getTopbar();
            ext.point(app.get('name') + '/vgrid/second-toolbar').invoke('draw', topbar, ext.Baton({ grid: grid }));
            onFolderViewClose(app);

            if (app.folderViewIsVisible()) _.defer(onFolderViewOpen, app);
        },

        addFolderViewToggle: function (app) {
            if (_.device('smartphone')) return;
            app.toggleFolderView = function (e) {
                e.preventDefault();
                app.trigger('before:change:folderview');
                app.folderView.toggle(e.data.state);

                if (!!e.data.state) {
                    app.folderView.tree.getNodeView(app.folder.get()).$el.focus();
                } else {
                    var a11y = require('io.ox/core/a11y');
                    a11y.getTabbable(app.getWindow().nodes.body.find('.classic-toolbar'))[0].focus();
                }
            };

            ext.point(app.get('name') + '/sidepanel').extend({
                id: 'toggle-folderview',
                index: 1000,
                draw: function () {
                    if (_.device('smartphone')) return;
                    var guid = _.uniqueId('control');
                    this.addClass('bottom-toolbar').append(
                        $('<div class="generic-toolbar bottom visual-focus" role="region">').attr('aria-labelledby', guid).append(
                            $('<button type="button" class="btn btn-link toolbar-item" data-action="close-folder-view">').attr({ id: guid, 'aria-label': gt('Close folder view') })
                            .append(
                                $.icon('fa-angle-double-left', gt('Close folder view'))
                            )
                            .on('click', { state: false }, app.toggleFolderView)
                        )
                    );
                }
            });

            ext.point(app.get('name') + '/sidepanel').extend({
                id: 'help',
                index: 1100,
                draw: commons.help
            });

        },

        addPremiumFeatures: function (app, opt) {

            if (_.device('smartphone')) return;
            if (!capabilities.has('client-onboarding')) return;
            if (!coreSettings.get('upsell/premium/folderView/visible')) return;
            if (coreSettings.get('upsell/premium/folderView/closedByUser')) return;

            var container = $('<div class="premium-toolbar generic-toolbar bottom visual-focus in">').append(
                $('<div class="header">').append(
                    gt('Premium features'),
                    $('<a href="#" role="button" class="pull-right">').append(
                        $('<i class="fa fa-times" aria-hidden="true">'),
                        $('<span class="sr-only">').text(gt('Close premium features'))
                    )
                    .on('click', function (e) {
                        e.preventDefault();
                        $(this).closest('.premium-toolbar').collapse('hide');
                        coreSettings.set('upsell/premium/folderView/closedByUser', true).save();
                    })
                )
            );

            function renderActions(ref, baton) {
                return ext.point(ref).list().map(function (item) {
                    return $('<p>').append(
                        $('<a href="#" role="button">')
                            .attr('data-action', item.action)
                            .data({ baton: baton })
                            .text(item.title)
                    );
                });
            }

            var baton = actionsUtil.getBaton([], { app: app, renderActions: renderActions });
            ext.point(app.get('name') + '/folderview/premium-area').invoke('draw', container, baton);

            if (container.find('a[data-action]').length === 0) return;

            container.on('click', 'a[data-action]', actionsUtil.invokeByEvent);

            var upsellView = new UpsellView({
                id: opt.upsellId || 'folderview/' + app.get('name') + '/bottom',
                requires: opt.upsellRequires,
                icon: '',
                title: gt('Try now!'),
                customize: function () {
                    this.$('a').addClass('btn btn-default');
                }
            });

            if (upsellView.visible) {
                container.append(upsellView.render().$el);
                $('.header a', container).remove();
            }

            if (opt.append !== false) {
                app.getWindow().nodes.sidepanel.append(container);
            }

            return container;
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
    $.createViewContainer = function (baton, api, getter, options) {

        options = options || {};
        var cidGetter = options.cidGetter || _.ecid,
            data = baton instanceof ext.Baton ? baton.data : baton,
            cid = _.cid(data),
            ecid = cidGetter(data),
            shortecid = 'recurrenceID' in data ? cidGetter({ id: data.id, folder: (data.folder_id || data.folder) }) : null,
            node = $('<div>').attr('data-cid', _([].concat(data)).map(_.cid).join(',')),

            update = function (e, changed) {
                // id change?
                if (changed && (changed.former_id || (changed.id && changed.id !== data.id))) {
                    data = changed;
                }

                // folder change?
                if (e && ((e.folder && e.folder !== data.folder))) {
                    data = e;
                }

                if (getter = (getter || (api ? api.get : null))) {
                    // fallback for create trigger
                    if (!data.id) {
                        data.id = arguments[1].id;
                    }
                    // get fresh object
                    getter(api.reduce(data)).done(function (data) {
                        if (baton instanceof ext.Baton) {
                            if (data instanceof Backbone.Model && baton.model instanceof Backbone.Model) {
                                baton.model = data;
                                baton.data = data.toJSON();
                            } else {
                                baton.data = data;
                            }
                        } else {
                            baton = data;
                        }
                        // if we have some additional update data for this change provide them to the handler
                        if (changed && changed.updateData) {
                            baton.updateData = changed.updateData;
                        } else {
                            delete baton.updateData;
                        }
                        if (node) node.triggerHandler('redraw', baton);
                    });
                }
            },

            move = function (e, targetFolderId) {
                if (data) data.folder_id = targetFolderId;
                if (update) update(e);
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
            folderAPI.on('update', redraw);
            // ignore move case for multiple
            api.on('delete update', redraw);
        } else {
            // single item
            folderAPI.on('update', checkFolder, { cid: cid, folder: data.folder_id || data.folder });
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

    return commons;
});
