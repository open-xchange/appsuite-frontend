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

define('io.ox/core/commons', ['io.ox/core/extPatterns/links'], function (extLinks) {

    'use strict';

    var commons = {

        /**
         * Common show window routine
         */
        showWindow: function (win, grid) {
            return function () {
                var def = $.Deferred();
                win.show(function () {
                    if (grid) {
                        grid.paint();
                    }
                    def.resolve();
                });
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

        wireGridAndSelectionChange: function (grid, id, draw, node) {
            var last = '';
            grid.selection.on('change', function (e, selection) {
                var len = selection.length,
                    // work with reduced string-based set
                    flat = JSON.stringify(selection);
                // has anything changed?
                if (flat !== last) {
                    if (len === 1) {
                        draw(selection[0]);
                    } else if (len > 1) {
                        commons.multiSelection(id, node, this.unfold());
                    } else {
                        node.idle().empty();
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
                    grid.refresh();
                },
                refreshList = function () {
                    grid.repaint().done(function () {
                        grid.selection.retrigger();
                    });
                };
            win.on('show', function () {
                    api.on('refresh.all', refreshAll).on('refresh.list', refreshList);
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
            app.folder
                .updateTitle(app.getWindow())
                .updateGrid(grid)
                .setType(type);
            // add visual caret
            app.getWindow().nodes.title.append($('<b>').addClass('caret'));
            // hash support
            app.getWindow().on('show', function () {
                grid.selection.retriggerUnlessEmpty();
                _.url.hash('folder', app.folder.get());
            });
            defaultFolderId = _.url.hash('folder') || defaultFolderId;
            // explicit vs. default
            if (defaultFolderId !== undefined) {
                return app.folder.set(defaultFolderId);
            } else {
                return app.folder.setDefault();
            }
        },

        /**
         * Add folder view
         */
        addFolderView: function (app, options) {

            options = $.extend({
                width: 330,
                rootFolderId: '1',
                type: undefined,
                view: 'ApplicationFolderTree'
            }, options);

            var container,
                visible = false,
                top = 0,
                fnChangeFolder, fnShow, fnToggle, toggle, loadTree, initTree;

            container = $('<div>')
                .addClass('abs border-right')
                .css({
                    backgroundColor: 'white',
                    right: 'auto',
                    width: options.width + 'px',
                    zIndex: 3
                })
                .hide()
                .appendTo(app.getWindow().nodes.main);

            fnChangeFolder = function (e, selection) {
                var folder = selection[0];
                if (folder.module === options.type) {
                    app.folder.unset();
                    top = container.scrollTop();
                    container.fadeOut('fast', function () {
                        app.folder.set(folder.id);
                    });
                    visible = false;
                }
            };

            fnShow = function () {
                if (!visible) {
                    container.show().scrollTop(top);
                    visible = true;
                }
                return $.when();
            };

            toggle = function () {
                if (visible) {
                    top = container.scrollTop();
                    container.hide();
                    visible = false;
                } else {
                    fnShow();
                }
            };

            fnToggle = function (e) {
                if (!e.isDefaultPrevented()) {
                    toggle();
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
                if (!e.isDefaultPrevented()) {
                    container.busy();
                    toggle();
                    app.showFolderView = fnShow;
                    app.getWindow().nodes.title.off('click', loadTree);
                    return require(['io.ox/core/tk/folderviews']).pipe(initTree);
                }
            };

            app.showFolderView = loadTree;
            app.folderView = null;

            app.getWindow().nodes.title
                .css('cursor', 'pointer')
                .on('click', loadTree);
        }
    };

    return commons;
});
