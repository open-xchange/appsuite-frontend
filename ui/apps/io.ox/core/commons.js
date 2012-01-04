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

define('io.ox/core/commons', [], function () {

    'use strict';

    return {

        /**
         * Common show window routine
         */
        showWindow: function (win, grid) {
            return function () {
                win.show(function () {
                    if (grid) {
                        grid.paint();
                    }
                });
            };
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
            // show
            win.bind('show', function () {
                grid.selection.keyboard(true);
            });
            // hide
            win.bind('hide', function () {
                grid.selection.keyboard(false);
            });
        },

        /**
         * Wire first refresh
         */
        wireFirstRefresh: function (app, api) {
            // open (first show)
            app.getWindow().bind('open', function () {
                if (api.needsRefresh(app.folder.get())) {
                    api.trigger('refresh!', app.folder.get());
                }
            });
        },

        /**
         * Wire grid and API refresh
         */
        wireGridAndRefresh: function (grid, api) {
            // bind all refresh
            api.bind('refresh.all', function () {
                grid.refresh();
            });
            // bind list refresh
            api.bind('refresh.list', function () {
                grid.repaint();
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
            win.bind('search', function (q) {
                grid.setMode('search');
            });
            // on cancel search
            win.bind('cancel-search', function () {
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
            if (defaultFolderId !== undefined) {
                return app.folder.set(defaultFolderId);
            } else {
                return app.folder.setDefault();
            }
        },

        /**
         * Add visual folder tree
         */
        addFolderTree: function (app, width, type) {

            var container,
                visible = false,
                fnChangeFolder, fnShow, fnToggle, loadTree, initTree;

            container = $('<div>')
                .addClass('abs border-right')
                .css(
                {   backgroundColor: 'white',
                    right: 'auto',
                    width: width + 'px',
                    zIndex: 3
                })
                .hide()
                .appendTo(app.getWindow().nodes.main);

            fnChangeFolder = function (selection) {
                var folder = selection[0];
                if (folder.module === type) {
                    app.folder.unset();
                    container.fadeOut('fast', function () {
                        app.folder.set(folder.id);
                    });
                    visible = false;
                }
            };

            fnShow = function () {
                if (!visible) {
                    container.show();
                    visible = true;
                }
                return $.when();
            };

            fnToggle = function () {
                container[visible ? 'hide' : 'show']();
                visible = !visible;
            };

            initTree = function (FolderTree) {
                var tree = app.folderTree = new FolderTree(container, { type: type });
                tree.selection.bind('change', fnChangeFolder);
                return tree.paint()
                    .done(function () {
                        tree.selection.set(app.folder.get());
                        app.getWindow().nodes.title.on('click', fnToggle);
                        container.idle();
                        initTree = loadTree = null;
                    });
            };

            loadTree = function () {
                container.busy();
                fnToggle();
                app.showFolderTree = fnShow;
                app.getWindow().nodes.title.off('click', loadTree);
                return require(['io.ox/core/tk/foldertree']).pipe(initTree);
            };

            app.showFolderTree = loadTree;
            app.folderTree = null;

            app.getWindow().nodes.title
                .css('cursor', 'pointer')
                .on('click', loadTree);
        }
    };
});