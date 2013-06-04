/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/commons-folderview',
    ['io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'io.ox/core/notifications',
     'io.ox/core/api/folder',
     'io.ox/core/config',
     'io.ox/core/capabilities',
     'gettext!io.ox/core'], function (ext, links, notifications, api, config, capabilities, gt) {

    'use strict';

    function initExtensions(POINT, app) {

        // mobile quirks
        if (_.device('small')) {
            //nobody needs options and create in folder tree on mobile
            ext.point(POINT + '/sidepanel/toolbar').disable('add');
            ext.point(POINT + '/sidepanel/toolbar').disable('options');
        }

        // default options
        ext.point(POINT + '/options').extend({
            id: 'defaults',
            index: 100,
            rootFolderId: '1',
            type: undefined,
            view: 'ApplicationFolderTree',
            // disable folder popup as it takes to much space for startup on small screens
            visible: _.device('!small') ? app.settings.get('folderview/visible/' + _.display(), false): false
        });

        // draw container
        ext.point(POINT + '/sidepanel').extend({
            draw: function (baton) {
                this.prepend(
                    // sidepanel
                    baton.$.sidepanel = $('<div class="abs border-right foldertree-sidepanel">')
                    .append(
                        // container
                        baton.$.container = $('<div class="abs foldertree-container" tabindex="1">'),
                        // toolbar
                        baton.$.toolbar = $('<div class="abs foldertree-toolbar">')
                    )
                );
            }
        });

        // toolbar
        ext.point(POINT + '/sidepanel/toolbar').extend({
            id: 'add',
            index: 100,
            draw: function (baton) {
                var ul;
                this.append(
                    $('<div class="toolbar-action pull-left dropdown dropup" data-action="add">').append(
                        $('<a href="#" class="dropdown-toggle">')
                            .attr({
                                'data-toggle': 'dropdown',
                                tabindex: 1,
                                role: 'menuitem',
                                'aria-haspopup': true,
                                title: gt('Add folder menu'),
                                'aria-label': gt('Add folder menu')
                            })
                            .append($('<i class="icon-plus">')),
                        ul = $('<ul class="dropdown-menu" role="menu">')
                    )
                );
                ext.point(POINT + '/sidepanel/toolbar/add').invoke('draw', ul, baton);
            }
        });

        ext.point(POINT + '/sidepanel/toolbar').extend({
            id: 'options',
            index: 200,
            draw: function (baton) {
                var ul;
                this.append(
                    $('<div class="toolbar-action pull-left dropdown dropup" data-action="options">').append(
                        $('<a href="#" class="dropdown-toggle">')
                            .attr({
                                'data-toggle': 'dropdown',
                                tabindex: 1,
                                role: 'menuitem',
                                title: gt('Folder actions'),
                                'aria-label': gt('Folder actions'),
                                'aria-haspopup': true
                            })
                            .append($('<i class="icon-cog" aria-hidden="true" role="presentation">')),
                        ul = $('<ul class="dropdown-menu" role="menu">').append(
                            $('<li class="dropdown-header" role="presentation" aria-hidden="true">').text(_.noI18n(baton.data.title))
                        )
                    )
                );
                ext.point(POINT + '/sidepanel/toolbar/options').invoke('draw', ul, baton);
            }
        });

        function addTopLevelFolder(e) {
            e.preventDefault();
            e.data.app.folderView.add('1', { module: 'mail' });
        }

        function addSubFolder(e) {
            e.preventDefault();
            // set explicit folder?
            if (/^(contacts|calendar|tasks)$/.test(e.data.type)) {
                e.data.app.folderView.add(api.getDefaultFolder(e.data.type));
            } else {
                e.data.app.folderView.add();
            }
        }

         // toolbar actions
        ext.point(POINT + '/sidepanel/toolbar/add').extend({
            id: 'add-toplevel-folder',
            index: 100,
            draw: function (baton) {
                if (baton.options.type === 'mail') {
                    // only show for mail
                    this.append($('<li>').append(
                        $('<a href="#" data-action="add-toplevel-folder" tabindex="1" role="menuitem">').text(gt('Add new folder'))
                        .on('click', { app: baton.app }, addTopLevelFolder)
                    ));
                }
            }
        });

        ext.point(POINT + '/sidepanel/toolbar/add').extend({
            id: 'add-folder',
            index: 200,
            draw: function (baton) {
                // only mail and infostore show hierarchies
                var label = /^(contacts|calendar|tasks)$/.test(baton.options.type) ? gt('Add private folder') : gt('Add subfolder'),
                    link = $('<a href="#" data-action="add-subfolder" role="menuitem">').text(label);
                if (api.can('create', baton.data)) {
                    link.attr('tabindex', 1).on('click', { app: baton.app, type: baton.options.type }, addSubFolder);
                } else {
                    link.attr('aria-disabled', true).addClass('disabled');
                }
                this.append($('<li>').append(link));
            }
        });

        function createPublicFolder(e) {
            e.preventDefault();
            // public folder has the magic id 2
            e.data.app.folderView.add('2', { module: e.data.module });
        }

        ext.point(POINT + '/sidepanel/toolbar/add').extend({
            id: 'add-public-folder',
            index: 200,
            draw: function (baton) {
                var type = baton.options.type,
                    link = $('<a href="#" data-action="add-public-folder" role="menuitem">').text(gt('Add public folder'));
                if (!(type === 'contacts' || type === 'calendar' || type === 'tasks')) return;

                api.get({folder: 2}).then(function (public_folder) {
                    if (api.can('create', public_folder)) {
                        link.attr('tabindex', 1).on('click', {app: baton.app, module: type}, createPublicFolder);
                    } else {
                        link.attr('aria-disabled', true).addClass('disabled');
                    }
                });
                this.append($('<li>').append(link));
            }
        });

        function publish(e) {
            e.preventDefault();
            require(['io.ox/core/pubsub/publications'], function (publications) {
                publications.buildPublishDialog(e.data.baton);
            });
        }

        ext.point(POINT + '/sidepanel/toolbar/add').extend({
            id: 'publications',
            index: 500,
            draw: function (baton) {
                var link = $('<a href="#" data-action="publications" role="menuitem">').text(gt('Publication')),
                    contacts = baton.data.module === 'contacts',
                    files = baton.data.module === 'infostore';
                this.append($('<li class="divider" aria-hidden="true" role="presentation">'), $('<li>').append(link));
                if (capabilities.has('publication') &&  (contacts || (files && api.can('publish', baton.data)))) {
                    link.attr('tabindex', 1).on('click', { baton: baton }, publish);
                } else {
                    link.attr('aria-disabled', true).addClass('disabled').on('click', $.preventDefault);
                }
            }
        });

        function subscribe(e) {
            e.preventDefault();
            require(['io.ox/core/pubsub/subscriptions'], function (subscriptions) {
                subscriptions.buildSubscribeDialog(e.data.baton);
            });
        }

        ext.point(POINT + '/sidepanel/toolbar/add').extend({
            id: 'subscribe',
            index: 600,
            draw: function (baton) {
                var link = $('<a href="#" data-action="subscriptions" role="menuitem">').text(gt('Subscription'));
                this.append(
                    $('<li>').append(link)
                );
                if (api.can('write', baton.data) && capabilities.has('subscription') &&
                    (baton.data.module === 'contacts' || baton.data.module === 'infostore' || baton.data.module === 'calendar')
                ) {
                    link.attr('tabindex', 1).on('click', { baton: baton }, subscribe);
                } else {
                    link.attr('aria-disabled', true).addClass('disabled').on('click', $.preventDefault);
                }
            }
        });

        function renameFolder(e) {
            e.preventDefault();
            e.data.app.folderView.rename();
        }

        ext.point(POINT + '/sidepanel/toolbar/options').extend({
            id: 'rename',
            index: 100,
            draw: function (baton) {
                var link = $('<a href="#" data-action="rename" role="menuitem">').text(gt('Rename'));
                this.append($('<li>').append(link));
                if (api.can('rename', baton.data)) {
                    link.attr('tabindex', 1).on('click', { app: baton.app }, renameFolder);
                } else {
                    link.attr('aria-disabled', true).addClass('disabled').on('click', $.preventDefault);
                }
            }
        });

        function deleteFolder(e) {
            e.preventDefault();
            e.data.app.folderView.remove();
        }

        ext.point(POINT + '/sidepanel/toolbar/options').extend({
            id: 'delete',
            index: 500,
            draw: function (baton) {
                var link = $('<a href="#" data-action="delete" role="menuitem">').text(gt('Delete'));
                this.append(
                    (baton.options.type === 'mail' ? '' : $('<li class="divider" role="presentation" aria-hidden="true">')),
                    $('<li>').append(link)
                );
                if (api.can('deleteFolder', baton.data)) {
                    link.attr('tabindex', 1).on('click', { app: baton.app }, deleteFolder);
                } else {
                    link.attr('aria-disabled', true).addClass('disabled').on('click', $.preventDefault);
                }
            }
        });

        function exportData(e) {
            e.preventDefault();
            require(['io.ox/core/export/export'], function (exporter) {
                //module,folderid
                exporter.show(e.data.baton.data.module, String(e.data.baton.app.folderView.selection.get()));
            });
        }

        ext.point(POINT + '/sidepanel/toolbar/options').extend({
            id: 'export',
            index: 250,
            draw: function (baton) {
                var link = $('<a href="#" data-action="export" role="menuitem">').text(gt('Export'));
                this.append(
                    $('<li>').append(link)
                );
                if (api.can('export', baton.data)) {
                    link.attr('tabindex', 1).on('click', { baton: baton }, exportData);
                } else {
                    link.attr('aria-disabled', true).addClass('disabled').on('click', $.preventDefault);
                }
            }
        });

        function importData(e) {
            e.preventDefault();
            require(['io.ox/core/import/import'], function (importer) {
                importer.show(e.data.baton.data.module, String(e.data.baton.app.folderView.selection.get()));
            });
        }

        ext.point(POINT + '/sidepanel/toolbar/options').extend({
            id: 'import',
            index: 245,
            draw: function (baton) {
                var link = $('<a href="#" data-action="import" role="menuitem">').text(gt('Import'));
                this.append(
                    $('<li>').append(link)
                );
                if (api.can('import', baton.data)) {
                    link.attr('tabindex', 1).on('click', { baton: baton }, importData);
                } else {
                    link.attr('aria-disabled', true).addClass('disabled').on('click', $.preventDefault);
                }
            }
        });


        function setFolderPermissions(e) {
            e.preventDefault();
            var app = e.data.app,
                folder = String(app.folder.get());
            require(['io.ox/core/permissions/permissions'], function (permissions) {
                permissions.show(folder);
            });
        }

        ext.point(POINT + '/sidepanel/toolbar/options').extend({
            id: 'permissions',
            index: 300,
            draw: function (baton) {
                if (capabilities.has('!alone')) {
                    var link = $('<a href="#" data-action="permissions" tabindex="1" role="menuitem">').text(gt('Permissions'));
                    this.append(
                        $('<li class="divider" aria-hidden="true" role="presentation">'),
                        $('<li>').append(link.on('click', { app: baton.app }, setFolderPermissions))
                    );
                }
            }
        });

        function showFolderProperties(e) {

            e.preventDefault();

            // get current folder id
            var baton = e.data.baton, id = baton.app.folder.get();

            api.get({ folder: id }).done(function (folder) {
                require(['io.ox/core/tk/dialogs', 'io.ox/core/tk/folderviews'], function (dialogs, views) {
                    var title = gt('Properties'),
                    dialog = new dialogs.ModalDialog({
                        easyOut: true
                    })
                    .header(
                        api.getBreadcrumb(folder.id, { prefix: title }).css({ margin: '0' })
                    )
                    .build(function () {
                        function ucfirst(str) {
                            return str.charAt(0).toUpperCase() + str.slice(1);
                        }
                        var node = this.getContentNode().append(
                            $('<div class="row-fluid">').append(
                                $('<label>')
                                    .css({'padding-top': '5px', 'padding-left': '5px'})
                                    .addClass('span3')
                                    .text(gt('Folder type')),
                                $('<input>', { type: 'text' })
                                    .addClass('span9')
                                    .attr('readonly', 'readonly')
                                    .val(ucfirst(folder.module))
                            )
                        );
                        if (config.get('modules.caldav.active') && folder.module === 'calendar') {
                            node.append(
                                $('<div class="row-fluid">').append(
                                    $('<label>')
                                        .css({'padding-top': '5px', 'padding-left': '5px'})
                                        .addClass('span3')
                                        .text(gt('CalDAV URL')),
                                    $('<input>', { type: 'text' })
                                        .addClass('span9')
                                        .attr('readonly', 'readonly')
                                        .val(
                                            _.noI18n(config.get('modules.caldav.url')
                                                .replace("[hostname]", location.host)
                                                .replace("[folderId]", id)
                                        )
                                    )
                                )
                            );
                        }
                    })
                    .addPrimaryButton('ok', gt('Close'))
                    .show().done(function () { dialog = null; });
                });
            });
        }

        ext.point(POINT + '/sidepanel/toolbar/options').extend({
            id: 'properties',
            index: 400,
            draw: function (baton) {
                var link = $('<a href="#" data-action="properties" tabindex="1" role="menuitem">').text(gt('Properties'));
                this.append($('<li>').append(link));
                link.on('click', { baton: baton }, showFolderProperties);
            }
        });

        function moveFolder(e) {

            e.preventDefault();

            // get current folder id
            var baton = e.data.baton, id = baton.app.folder.get();

            api.get({ folder: id }).done(function (folder) {
                require(['io.ox/core/tk/dialogs', 'io.ox/core/tk/folderviews'], function (dialogs, views) {
                    var title = gt('Move folder'),
                        dialog = new dialogs.ModalDialog({ easyOut: true })
                            .header(
                                api.getBreadcrumb(folder.id, { prefix: title }).css({ margin: '0' })
                            )
                            .addPrimaryButton('ok', title)
                            .addButton('cancel', gt('Cancel'));
                    dialog.getBody().css('height', '250px');
                    var tree = new views.FolderTree(dialog.getBody(), {
                        type: baton.options.type,
                        rootFolderId: '1',
                        skipRoot: true,
                        cut: folder.id,
                        customize: function (data) {
                            var canMove = api.can('moveFolder', folder, data);
                            if (!canMove) {
                                this.removeClass('selectable').addClass('disabled');
                            }
                        }
                    });
                    dialog.show(function () {
                        tree.paint().done(function () {
                            tree.select(folder.id);
                        });
                    })
                    .done(function (action) {
                        if (action === 'ok') {
                            var selectedFolder = tree.selection.get();
                            if (selectedFolder.length === 1) {
                                // move action
                                api.move(folder.id, selectedFolder[0]).fail(notifications.yell);
                            }
                        }
                        tree.destroy().done(function () {
                            tree = dialog = null;
                        });
                    });
                });
            });
        }

        ext.point(POINT + '/sidepanel/toolbar/options').extend({
            id: 'move',
            index: 200,
            draw: function (baton) {
                var link = $('<a href="#" data-action="delete" role="menuitem">').text(gt('Move'));
                this.append($('<li>').append(link));
                if (api.can('deleteFolder', baton.data)) {
                    link.attr('tabindex', 1).on('click', { baton: baton }, moveFolder);
                } else {
                    link.attr('aria-disabled', true).addClass('disabled').on('click', $.preventDefault);
                }
            }
        });
    }

    /**
     * Add folder view
     */
    function add(app, options) {

        var container = $(),
            sidepanel = $(),
            visible = false,
            tmpVisible = false,
            top = 0,
            onChangeFolder, changeFolder, changeFolderOff, changeFolderOn,
            fnHide, fnShow, fnShowSml, fnHideSml, initResize, restoreWidth, makeResizable,
            toggle, toggleTree, loadTree, initTree,
            name = app.getName(),
            POINT = name + '/folderview',
            TOGGLE = name + '/links/toolbar',
            ACTION = name + '/actions/toggle-folderview',
            baton = new ext.Baton({ app: app });

        changeFolder = function (e, folder) {
            app.folderView.selection.set(folder.id);
        };

        changeFolderOn = function () {
            app.on('folder:change', changeFolder);
        };

        changeFolderOff = function () {
            app.off('folder:change', changeFolder);
        };

        onChangeFolder = function (e, selection) {
            var id = _(selection).first();

            api.get({ folder: id }).done(function (data) {
                if (_.device('small')) {
                    // close tree
                    toggle();
                }
                if (data.module === options.type) {
                    changeFolderOff();
                    app.folder.set(id);
                    changeFolderOn();
                }
            });
        };

        restoreWidth = $.noop;

        makeResizable = function () {

            var resizeBar, minSidePanelWidth, windowContainer, maxSidePanelWidth;

            sidepanel.append(resizeBar = $('<div class="resizebar">'));
            // needs to match min-width!
            minSidePanelWidth = 170;

            function resetWidths() {
                if ($(window).width() < 700) {
                    app.getWindow().nodes.panel.css('left', '');
                    sidepanel.attr('style', '');
                }
            }

            function getWidths() {
                windowContainer   = sidepanel.closest('.window-container-center');
                maxSidePanelWidth = windowContainer.width() / 2;
                resetWidths();
            }

            function applyWidth(width) {
                var nodes = app.getWindow().nodes;
                nodes.panel.css('left', width + 'px');
                nodes.sidepanel.css('width', width + 'px');
                windowContainer.data('resize-width', width);
            }

            restoreWidth = function () {
                var width = app.settings.get('folderview/width/' + _.display(), 250);
                applyWidth(width);
                resetWidths();
            };

            resizeBar.off('mousedown').on('mousedown', function (e) {
                e.preventDefault();
                windowContainer.on('mousemove', function (e) {
                    var newWidth = e.pageX;
                    if (newWidth < maxSidePanelWidth && newWidth > minSidePanelWidth) {
                        applyWidth(newWidth);
                    }
                });
            });

            getWidths();

            windowContainer.on('mouseup', function (e) {
                windowContainer.off('mousemove');
                var width = $(this).data('resize-width') || 250;
                app.settings.set('folderview/width/' + _.display(), width).save();
            });

            $(window).on('resize', _.debounce(getWidths, 200));
        };

        fnHide = function () {
            app.settings.set('folderview/visible/' + _.display(), visible = false).save();
            top = container.scrollTop();
            var nodes = app.getWindow().nodes;
            nodes.panel.css('left', '0px');
            nodes.sidepanel.removeClass('visible').css('width', '');
            if (app.getGrid) {
                app.getGrid().focus();
            }
        };

        fnShow = function () {
            app.settings.set('folderview/visible/' + _.display(), visible = true).save();
            var nodes = app.getWindow().nodes;
            nodes.sidepanel.addClass('visible');
            restoreWidth();
            baton.$.container.focus();
            return $.when();
        };

        fnHideSml = function () {
            app.settings.set('folderview/visible/' + _.display(), visible = false).save();
            top = container.scrollTop();
            $('.window-container-center').removeClass('animate-moveright').addClass('animate-moveleft');
        };

        fnShowSml = function () {
            app.settings.set('folderview/visible/' + _.display(), visible = true).save();
            $('.window-container-center').removeClass('animate-moveleft').addClass('animate-moveright');
            return $.when();
        };

        toggle = function () {
            if (_.device('small')) {
                if (visible) { fnHideSml(); } else { fnShowSml();  }
            } else {
                if (visible) { fnHide(); } else { fnShow();  }
            }
        };

        initResize = function () {

            // no resize in either touch devices or small devices
            if (_.device('touch || small')) return;

            makeResizable();
            restoreWidth();
        };

        initTree = function (views) {

            // init tree before running toolbar extensions
            var tree = baton.tree = app.folderView = new views[options.view](container, {
                    type: options.type,
                    rootFolderId: String(options.rootFolderId),
                    open: app.settings.get('folderview/open', []),
                    toggle: function (open) {
                        app.settings.set('folderview/open', open).save();
                    }
                });

            // draw toolbar
            tree.selection.on('change', function (e, selection) {
                if (selection.length) {
                    var id = selection[0];
                    api.get({ folder: id }).done(function (data) {
                        baton.data = data;
                        // update toolbar
                        ext.point(POINT + '/sidepanel/toolbar').invoke('draw', baton.$.toolbar.empty(), baton);
                        // reload tree node
                        tree.reloadNode(id);
                    });
                }
            });

            // paint now
            return tree.paint().pipe(function () {

                if (options.visible === false) {
                    initResize();
                }

                return tree.select(app.folder.get()).done(function () {

                    tree.selection.on('change', onChangeFolder);
                    toggleTree = toggle;
                    sidepanel.idle();

                    changeFolderOn();

                    api.on('create', function (e, data) {
                        tree.repaint().done(function () {
                            tree.select(data.id);
                        });
                    });

                    api.on('delete:prepare', function (e, id, folder_id) {
                        tree.select(folder_id);
                        tree.removeNode(id);
                    });

                    api.on('delete', function (e, id) {
                        app.trigger('folder:delete', id);
                    });

                    api.on('refresh', function () {
                        tree.repaint();
                    });

                    api.on('update', function (e, id, newId, data) {
                        // this is used by folder rename, since the id might change (mail folders)
                        var sel = tree.selection.get();
                        if (_.isEqual(sel, [id])) {
                            tree.repaint().done(function () {
                                tree.idle();
                                if (newId !== id) tree.select(newId);
                            });
                        } else {
                            if (!id && !newId && sel.length === 0) {
                                tree.select(config.get('folder.' + options.type) + '');
                            }
                            tree.repaint();
                        }
                    });

                    api.on('delete:fail update:fail create:fail', function (e, error) {
                        notifications.yell(error);
                        tree.repaint();
                    });

                    api.on('update:unread', function (e, id, data) {
                        tree.reloadNode(id);
                    });

                    // just a delveopment hack - turning off - no right click menus!
                    // sidepanel.on('contextmenu', '.folder', function (e) {
                    //     e.preventDefault();
                    //     $(this).closest('.foldertree-sidepanel').find('.foldertree-toolbar > [data-action="options"]').addClass('open');
                    //     return false;
                    // });

                    if (_.device('smartphone')) {
                        // mobile stuff
                        $('.foldertree-sidepanel').on('swipeleft', function (e) {
                            toggle();
                        });
                    }

                    initTree = loadTree = null;
                });
            });
        };

        loadTree = function (e) {
            toggle();
            app.showFolderView = fnShow;
            app.hideFolderView = fnHide;
            app.toggleFolderView = toggle;
            loadTree = toggleTree = $.noop;
            return require(['io.ox/core/tk/folderviews']).pipe(initTree);
        };

        toggleTree = loadTree;

        app.showFolderView = loadTree;
        app.hideFolderView = $.noop;
        app.toggleFolderView = loadTree;
        app.folderView = null;

        app.folderViewIsVisible = function () {
            return visible;
        };

        initExtensions(POINT, app);

        // apply all options
        _(ext.point(POINT + '/options').all()).each(function (obj) {
            options = _.extend(obj, options || {});
        });

        baton.options = options;

        // draw sidepanel & container
        ext.point(POINT + '/sidepanel').invoke('draw', app.getWindow().nodes.sidepanel, baton);
        sidepanel = baton.$.sidepanel;
        container = baton.$.container;

        new links.ActionGroup(TOGGLE, {
            id: 'folder',
            index: 200,
            icon: function () {
                return $('<i class="icon-folder-close">').attr('aria-label', gt('Toggle folder'));
            }
        });

        new links.Action(ACTION, {
            action: function (baton) {
                toggleTree();
            }
        });

        new links.ActionLink(TOGGLE + '/folder', {
            index: 100,
            id: 'toggle',
            label: gt('Toggle folder'),
            addClass: 'folderview-toggle',
            ref: ACTION
        });

        if (options.visible === true) {
            toggleTree();
            app.getWindow().on('open', initResize);
        }

        // auto-open on drag
        app.getWindow().nodes.body
            .on('selection:dragstart', function () {
                tmpVisible = !visible;
                app.showFolderView();
            })
            .on('selection:dragstop', function () {
                if (tmpVisible) {
                    app.hideFolderView();
                }
            });
    }

    return {
        add: add
    };
});
