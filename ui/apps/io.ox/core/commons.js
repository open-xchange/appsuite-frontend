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
                    node.empty();
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
            grid.selection.on('change', function (e, selection) {
                var len = selection.length;
                if (len === 1) {
                    draw(selection[0]);
                } else if (len > 1) {
                    commons.multiSelection(id, node, this.unfold());
                } else {
                    node.empty();
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
            // show
            win.on('show', function () {
                grid.selection.keyboard(true);
                grid.selection.retrigger();
            });
            // hide
            win.on('hide', function () {
                grid.selection.keyboard(false);
            });
        },

        /**
         * Wire first refresh
         */
        wireFirstRefresh: function (app, api) {
            // open (first show)
            app.getWindow().on('open', function () {
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
            api.on('refresh.all', function () {
                grid.refresh();
            });
            // bind list refresh
            api.on('refresh.list', function () {
                grid.repaint().done(function () {
                    grid.selection.retrigger();
                });
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
                grid.selection.retrigger();
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
         * Add visual folder tree
         */
        addFolderTree: function (app, width, type, rootFolderId) {

            var container,
                visible = false,
                top = 0,
                fnChangeFolder, fnShow, fnToggle, loadTree, initTree;

            container = $('<div>')
                .addClass('abs border-right')
                .css({
                    backgroundColor: 'white',
                    right: 'auto',
                    width: width + 'px',
                    zIndex: 3
                })
                .hide()
                .appendTo(app.getWindow().nodes.main);

            fnChangeFolder = function (e, selection) {
                var folder = selection[0];
                if (folder.module === type) {
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

            fnToggle = function () {
                if (visible) {
                    top = container.scrollTop();
                    container.hide();
                    visible = false;
                } else {
                    fnShow();
                }
            };

            initTree = function (FolderTree) {
                var tree = app.folderTree = new FolderTree(container, {
                    type: type,
                    rootFolderId: rootFolderId
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

    return commons;
});
