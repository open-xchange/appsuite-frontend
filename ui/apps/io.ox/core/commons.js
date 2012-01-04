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
                fnChangeFolder, fnToggle, initTree, fnFirstShow;

            container = $("<div>")
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

            fnToggle = function () {
                container[visible ? 'hide' : 'show']();
                visible = !visible;
            };

            initTree = function (FolderTree) {
                var tree = new FolderTree(container, { type: type });
                tree.selection.bind('change', fnChangeFolder);
                tree.paint();
                fnToggle();
                app.getWindow().nodes.title.on('click', fnToggle);
                fnFirstShow = initTree = null;
            };

            fnFirstShow = function () {
                $(this).off('click', fnFirstShow);
                require(['io.ox/core/tk/foldertree'], initTree);
            };

            app.getWindow().nodes.title.on('click', fnFirstShow);
        }
    };
});