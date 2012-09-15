/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) 2004-2012 Open-Xchange, Inc.
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/commons', ['io.ox/core/extensions', 'io.ox/core/extPatterns/links'], function (ext, extLinks) {

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

        /**
         * Handle multi-selection
         */
        multiSelection: (function () {

            var points = {};

            return function (id, node, selection) {
                if (selection.length > 1) {
                    // clear
                    node.idle().empty();
                    // inline links
                    var links = $('<div>');
                    (points[id] || (points[id] = new extLinks.InlineLinks({ id: 'inline-links', ref: id + '/links/inline' })))
                        .draw.call(links, selection);
                    // draw
                    node.append(
                        $('<div>')
                        .addClass('io-ox-multi-selection')
                        .append(
                            $('<div>').addClass('summary').html('<b>' + selection.length + '</b> elements selected'),
                            links.children().first()
                        )
                        .center()
                    );
                }
            };
        }()),

        wireGridAndSelectionChange: function (grid, id, draw, node, api) {
            var last = '',
                update = function (e, data) {
                    if (_.cid(e.data.item) === _.cid(data)) {
                        draw(e.data.item);
                    }
                };

            grid.selection.on('change', function (e, selection) {
                var len = selection.length,
                    // work with reduced string-based set
                    flat = JSON.stringify(_([].concat(selection)).map(function (o) {
                        return { folder_id: String(o.folder_id || o.folder), id: String(o.id), recurrence_position: String(o.recurrence_position || 0) };
                    }));
                // has anything changed?
                if (flat !== last) {
                    if (api) { api.off('update', update); }
                    if (len === 1) {
                        node.css('height', '');
                        draw(selection[0]);
                        if (api) { api.on('update', { item: selection[0] }, update); }
                    } else if (len > 1) {
                        node.css('height', '100%');
                        commons.multiSelection(id, node, this.unfold());
                    } else {
                        node.css('height', '').idle().empty();
                    }
                    // remember current selection
                    last = flat;
                }
            });
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
            // handle 'not-found'
            api.on('not-found', function () {
                grid.selection.selectFirst();
            });
        },

        /**
         * Wire grid & window
         */
        wireGridAndWindow: function (grid, win) {
            var top = 0;
            // show
            win.on('show idle', function () {
                    grid.selection.keyboard(true);
                    if (grid.selection.get().length) {
                        // only retrigger if selection is not empty; hash gets broken if caches are empty
                        // TODO: figure out why this was important
                        grid.selection.retriggerUnlessEmpty();
                    }
                })
                // hide
                .on('hide busy', function () {
                    grid.selection.keyboard(false);
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
        },

        /**
         * Wire first refresh
         */
        wireFirstRefresh: function (app, api) {
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
                },
                refreshList = function () {
                    grid.repaint().done(function () {
                        grid.selection.retrigger();
                    });
                };
            win.on('show', function () {
                    api.on('refresh.all', refreshAll)
                        .on('refresh.list', refreshList)
                        .trigger('refresh.all');
                })
                .on('hide', function () {
                    api.off('refresh.all', refreshAll).off('refresh.list', refreshList);
                });
        },

        /**
         * Wire Grid and window's search
         */
        wireGridAndSearch: function (grid, win, api) {
            // search: all request
            grid.setAllRequest('search', function () {
                return api.search(win.search.query);
            });
            // search: list request
            grid.setListRequest('search', function (ids) {
                return api.getList(ids);
            });
            // on search
            win.on('search', function () {
                grid.setMode('search');
            });
            // on cancel search
            win.on('cancel-search', function () {
                grid.setMode('all');
            });
        },

        /**
         * Add folder support
         */
        addFolderSupport: function (app, grid, type, defaultFolderId) {

            var name = app.getName(),
                POINT = name + '/folderview';

            app.folder
                .updateTitle(app.getWindow())
                .updateGrid(grid)
                .setType(type);
            if (grid) {
                app.folder.updateGrid(grid);
            }

            ext.point(POINT + '/toggle').extend({
                id: 'default',
                index: 100,
                draw: function () {
                    return $().add($.txt(' ')).add($('<button class="btn btn-inverse"><i class="icon-folder-open icon-white"></i></button>'));
                }
            });

            // add visual caret
            app.getWindow().nodes.title.append(
                ext.point(POINT + '/toggle').invoke('draw').value()
            );

            // hash support
            app.getWindow().on('show', function () {
                if (grid) {
                    grid.selection.retriggerUnlessEmpty();
                }
                _.url.hash('folder', app.folder.get());
            });
            defaultFolderId = _.url.hash('folder') || defaultFolderId;
            // explicit vs. default
            if (defaultFolderId !== undefined) {
                return app.folder.set(defaultFolderId);
            } else {
                return app.folder.setDefault();
            }
            // reset mode on folder change
            app.on('folder:change', function () {
                console.log('mmmh');
                //grid.setMode('all');
            });
        },

        addGridFolderSupport: function (app, grid) {
            app.folder.updateGrid(grid);
            app.getWindow().on('show', function () {
                grid.selection.retriggerUnlessEmpty();
            });
        },

        /**
         * Add folder view
         */
        addFolderView: function (app, options) {

            var container,
                visible = false,
                permanent = false,
                top = 0,
                fnChangeFolder, fnShow, togglePermanent,
                fnToggle, toggle, loadTree, initTree,
                name = app.getName(),
                POINT = name + '/folderview';

            ext.point(POINT + '/options').extend({
                id: 'defaults',
                index: 100,
                width: 330,
                rootFolderId: '1',
                type: undefined,
                view: 'ApplicationFolderTree',
                visible: false,
                permanent: false
            });

            // apply all options
            _(ext.point(POINT + '/options').all()).each(function (obj) {
                options = _.extend(obj, options || {});
            });

            // draw container
            ext.point(POINT + '/sidepanel').extend({
                id: 'default',
                index: 100,
                draw: function () {
                    return $('<div>')
                        .addClass('abs border-right foldertree-sidepanel')
                        .css({
                            right: 'auto',
                            width: options.width + 'px',
                            zIndex: 3
                        });
                }
            });

            // get container
            container = ext.point(POINT + '/sidepanel').invoke('draw').first().value() || $();
            container.hide().appendTo(app.getWindow().nodes.body);

            fnChangeFolder = function (e, selection) {
                var folder = selection[0];
                if (folder.module === options.type) {
                    app.folder.unset();
                    if (permanent) {
                        app.folder.set(folder.id);
                    } else {
                        top = container.scrollTop();
                        container.fadeOut('fast', function () {
                            app.folder.set(folder.id);
                        });
                        visible = false;
                    }
                }
            };

            fnShow = function () {
                if (!visible) {
                    container.show().scrollTop(top);
                    visible = true;
                }
                return $.when();
            };

            togglePermanent = function () {
                var width;
                if (permanent) {
                    app.getWindow().nodes.body.css('left', '0px');
                    container.css({ width: container.attr('data-width') + 'px', left: '0px' });
                } else {
                    // show permanent folder view
                    container.attr('data-width', container.width());
                    width = 250; //container.outerWidth();
                    app.getWindow().nodes.body.css('left', width + 'px');
                    container.css({ width: width + 'px', left: -width + 'px' });
                }
                permanent = !permanent;
            };

            toggle = function (e) {
                if (visible) {
                    top = container.scrollTop();
                    container.hide();
                    visible = false;
                    if (permanent || options.permanent) { togglePermanent(); }
                } else {
                    fnShow();
                    if (options.permanent || (e && e.altKey)) { togglePermanent(); }
                }
            };

            fnToggle = function (e) {
                if (!e.isDefaultPrevented()) {
                    toggle(e);
                }
            };

            initTree = function (views) {
                var tree = app.folderView = new views[options.view](container, {
                        type: options.type,
                        rootFolderId: options.rootFolderId
                    });
                tree.selection.on('change', fnChangeFolder);
                return tree.paint()
                    .done(function () {
                        tree.selection.set(app.folder.get(), true);
                        app.getWindow().nodes.title.on('click', fnToggle);
                        container.idle();
                        initTree = loadTree = null;
                    });
            };

            loadTree = function (e) {
                if (!e || !e.isDefaultPrevented()) {
                    toggle(e);
                    app.showFolderView = fnShow;
                    app.toggleFolderView = toggle;
                    app.getWindow().nodes.title.off('click', loadTree);
                    return require(['io.ox/core/tk/folderviews']).pipe(initTree);
                } else {
                    return $.when();
                }
            };

            app.showFolderView = loadTree;
            app.toggleFolderView = loadTree;
            app.togglePermanentFolderView = togglePermanent;
            app.folderView = null;

            app.getWindow().nodes.title
                .css('cursor', 'pointer')
                .on('click', loadTree);

            if (options.visible === true) {
                loadTree();
            }
        }
    };

    return commons;
});
