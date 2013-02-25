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
     'gettext!io.ox/core'], function (ext, links, notifications, api, config, gt) {

    'use strict';

    function initExtensions(POINT, app) {

        // default options
        ext.point(POINT + '/options').extend({
            id: 'defaults',
            index: 100,
            rootFolderId: '1',
            type: undefined,
            view: 'ApplicationFolderTree',
            // disable folder popup as it takes to much space for startup on small screens
            visible: _.device('!small') ? app.settings.get('folderview/visible', false): false,
            permanent: app.settings.get('folderview/permanent', true)
        });

        // draw container
        ext.point(POINT + '/sidepanel').extend({
            draw: function (baton) {
                this.append(
                    // sidepanel
                    baton.$.sidepanel = $('<div class="abs border-right foldertree-sidepanel">')
                    .css({ right: 'auto', zIndex: 3 })
                    .hide()
                    .append(
                        // container
                        baton.$.container = $('<div class="abs foldertree-container">'),
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
                        $('<a href="#" class="dropdown-toggle" data-toggle="dropdown"><i class="icon-plus"></a>'),
                        ul = $('<ul class="dropdown-menu">')
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
                        $('<a href="#" class="dropdown-toggle" data-toggle="dropdown"><i class="icon-cog accent-color"></a>'),
                        ul = $('<ul class="dropdown-menu">').append(
                            $('<li class="dropdown-header">').text(_.noI18n(baton.data.title))
                        )
                    )
                );
                ext.point(POINT + '/sidepanel/toolbar/options').invoke('draw', ul, baton);
            }
        });

        function fnClose(e) {
            e.preventDefault();
            e.data.app.toggleFolderView();
        }

        ext.point(POINT + '/sidepanel/toolbar').extend({
            id: 'close',
            index: 900,
            draw: function (baton) {
                this.append(
                    $('<a href="#" class="toolbar-action pull-right" data-action="close"><i class="icon-remove"></a>')
                    .on('click', { app: baton.app }, fnClose)
                );
            }
        });

        function fnToggle(e) {
            e.preventDefault();
            $(this).find('i').attr('class', e.data.app.togglePermanentFolderView() ? 'icon-pushpin enabled' : 'icon-pushpin');
        }

        ext.point(POINT + '/sidepanel/toolbar').extend({
            id: 'toggle',
            index: 1000,
            draw: function (baton) {
                var className = baton.options.permanent ? 'icon-pushpin enabled' : 'icon-pushpin';
                this.append(
                    $('<a href="#" class="toolbar-action pull-right"><i class="' + className + '"></a>')
                    .on('click', { app: baton.app }, fnToggle)
                );
            }
        });

        function addSubFolder(e) {
            e.preventDefault();
            e.data.app.folderView.add();
        }

        // toolbar actions
        ext.point(POINT + '/sidepanel/toolbar/add').extend({
            id: 'add-folder',
            index: 100,
            draw: function (baton) {
                this.append($('<li>').append(
                    $('<a href="#" data-action="add-subfolder">').text(gt('Add subfolder'))
                    .on('click', { app: baton.app }, addSubFolder)
                ));
            }
        });

        function createPublicFolder(e) {
            e.preventDefault();
            //public folder has the magic id 2
            e.data.app.folderView.add("2", {module: e.data.module});
        }

        ext.point(POINT + '/sidepanel/toolbar/add').extend({
            id: 'add-public-folder',
            index: 50,
            draw: function (baton) {
                var type = baton.options.type;
                if (!(type === 'contacts' || type === 'calendar' || type === 'tasks')) return;

                this.append($('<li>').append(
                    $('<a href="#" data-action="add-public-folder">').text(gt('Add public folder'))
                    .on('click', {app: baton.app, module: type}, createPublicFolder)
                ));
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
                var link = $('<a href="#" data-action="rename">').text(gt('Rename'));
                this.append($('<li>').append(link));
                if (api.can('rename', baton.data)) {
                    link.on('click', { app: baton.app }, renameFolder);
                } else {
                    link.addClass('disabled').on('click', $.preventDefault);
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
                var link = $('<a href="#" data-action="delete">').text(gt('Delete'));
                this.append(
                    (baton.options.type === 'mail' ? '' : $('<li class="divider">')),
                    $('<li>').append(link)
                );
                if (api.can('deleteFolder', baton.data)) {
                    link.on('click', { app: baton.app }, deleteFolder);
                } else {
                    link.addClass('disabled').on('click', $.preventDefault);
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
                var link = $('<a href="#" data-action="export">').text(gt('Export'));
                this.append(
                    $('<li>').append(link)
                );
                if (api.can('export', baton.data)) {
                    link.on('click', { baton: baton }, exportData);
                } else {
                    link.addClass('disabled').on('click', $.preventDefault);
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
                var link = $('<a href="#" data-action="import">').text(gt('Import'));
                this.append(
                    $('<li>').append(link)
                );

                if (api.can('import', baton.data)) {
                    link.on('click', { baton: baton }, importData);
                } else {
                    link.addClass('disabled').on('click', $.preventDefault);
                }
            }
        });

        function setFolderPermissions(e) {
            e.preventDefault();
            require(['io.ox/core/permissions/permissions'], function (permissions) {
                permissions.show(String(e.data.app.folderView.selection.get()));
            });
        }

        ext.point(POINT + '/sidepanel/toolbar/options').extend({
            id: 'permissions',
            index: 300,
            draw: function (baton) {
                var link = $('<a href="#" data-action="permissions">').text(gt('Permissions'));
                this.append(
                    $('<li class="divider">'),
                    $('<li>').append(link.on('click', { app: baton.app }, setFolderPermissions))
                );
            }
        });

        function showFolderProperties(e) {
            e.preventDefault();
            var baton = e.data.baton,
                id = _(baton.app.folderView.selection.get()).first();
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
                var link = $('<a href="#" data-action="properties">').text(gt('Properties'));
                this.append($('<li>').append(link));
                link.on('click', { baton: baton }, showFolderProperties);
            }
        });

        function moveFolder(e) {
            e.preventDefault();
            var baton = e.data.baton,
                id = _(baton.app.folderView.selection.get()).first();
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
                        tree.destroy();
                        tree = dialog = null;
                    });
                });
            });
        }

        ext.point(POINT + '/sidepanel/toolbar/options').extend({
            id: 'move',
            index: 200,
            draw: function (baton) {
                var link = $('<a href="#" data-action="delete">').text(gt('Move'));
                this.append($('<li>').append(link));
                if (api.can('deleteFolder', baton.data)) {
                    link.on('click', { baton: baton }, moveFolder);
                } else {
                    link.addClass('disabled').on('click', $.preventDefault);
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
            top = 0, UP = 'icon-chevron-up', DOWN = 'icon-chevron-down',
            fnChangeFolder, fnHide, fnShow, togglePermanent,
            disablePermanent, enablePermanent, enableResize,
            toggle, toggleTree, loadTree, initTree,
            name = app.getName(),
            POINT = name + '/folderview',
            TOGGLE = name + '/links/toolbar',
            ACTION = name + '/actions/toggle-folderview',
            baton = new ext.Baton({ app: app });

        fnChangeFolder = function (e, selection) {
            var id = _(selection).first();
            api.get({ folder: id }).done(function (data) {
                if (data.module === options.type) {
                    if (options.permanent) {
                        app.folder.set(id);
                    } else {
                        top = container.scrollTop();
                        sidepanel.fadeOut('fast', function () {
                            app.folder.set(id);
                        });
                        visible = false;
                    }
                }
            });
        };

        disablePermanent = function () {
            app.getWindow().nodes.body.removeClass('side-shift').attr('style', '');
            sidepanel.removeClass('side-shift').attr('style', '');//css({ width: '', left: '0px' });

        };

        enablePermanent = function () {
            //var width = 250; //sidepanel.outerWidth();
            app.getWindow().nodes.body.addClass('side-shift');
            sidepanel.addClass('side-shift').attr('style', '');//css({ width: width + 'px', left: -width + 'px' });
        };

        togglePermanent = function () {
            if (options.permanent) { disablePermanent(); } else { enablePermanent(); }
            options.permanent = !options.permanent;
            app.settings.set('folderview/permanent', options.permanent).save();
            return options.permanent;
        };

        enableResize = function () {
            var resizeBar, minSidePanelWidth, windowContainer, maxSidePanelWidth, windowHeadWidth;

            sidepanel.append(resizeBar = $('<div>').addClass('resizebar'));
            minSidePanelWidth = sidepanel.width() - resizeBar.width();

            function getWidths() {
                windowContainer   = sidepanel.closest('.window-container-center');
                maxSidePanelWidth = windowContainer.width() / 2;
                windowHeadWidth   = windowContainer.find('.window-head').width();
            }

            getWidths();

            resizeBar.off('mousedown').on('mousedown', function (e) {
                e.preventDefault();
                windowContainer.on('mousemove', function (e) {
                    var newpos = e.pageX - windowHeadWidth - resizeBar.width(),
                    sideShift = $(sidepanel).hasClass('side-shift');
                    if (sideShift && newpos < maxSidePanelWidth && newpos > minSidePanelWidth) {
                        sidepanel.css({width: newpos + resizeBar.width(), left: -newpos - resizeBar.width()})
                            .closest('.window-body.side-shift').css('left', e.pageX);
                    } else if (!sideShift && newpos < maxSidePanelWidth && newpos > minSidePanelWidth) {
                        sidepanel.css({width: newpos})
                            .closest('.window-body.side-shift').css('left', e.pageX);

                    }
                });
            });

            windowContainer.on('mouseup', function (e) {
                windowContainer.off('mousemove');
            });

            $(window).on('resize', _.debounce(getWidths, 200));
        };

        fnHide = function () {
            app.getWindow().nodes.title.find('.' + UP).removeClass(UP).addClass(DOWN);
            top = container.scrollTop();
            disablePermanent();
            if (options.permanent) {
                sidepanel.hide();
            } else {
                app.getWindow().off('search:open', fnHide);
                sidepanel.fadeOut();
            }
            if (visible) {

                app.settings.set('folderview/visible', visible = false).save();
            }
        };

        fnShow = function () {
            if (!visible) {
                app.getWindow().nodes.title.find('.' + DOWN).removeClass(DOWN).addClass(UP);
                if (options.permanent) {
                    enablePermanent();
                    sidepanel.show();
                } else {
                    app.getWindow().on('search:open', fnHide);
                    sidepanel.fadeIn();
                }
                container.scrollTop(top);
                app.settings.set('folderview/visible', visible = true).save();
            }
            return $.when();
        };

        toggle = function () {
            if (visible) { fnHide(); } else { fnShow(); }
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
                return tree.select(app.folder.get()).done(function () {

                    tree.selection.on('change', fnChangeFolder);
                    toggleTree = toggle;
                    sidepanel.idle();

                    api.on('delete:prepare', function (e, id, folder_id) {
                        tree.select(folder_id);
                        tree.busy();
                    });

                    api.on('delete', function (e, id) {
                        tree.removeNode(id);
                        tree.idle();
                    });

                    api.on('update:prepare', function () {
                        tree.busy();
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
                            tree.idle();
                        }
                    });

                    api.on('delete:fail update:fail create:fail', function (e, error) {
                        tree.idle();
                        notifications.yell(error);
                    });

                    api.on('update:unread', function (e, id, data) {
                        tree.reloadNode(id);
                    });

                    sidepanel.on('contextmenu', '.folder', function (e) {
                        e.preventDefault();
                        $(this).closest('.foldertree-sidepanel').find('.foldertree-toolbar > [data-action="options"]').addClass('open');
                        return false;
                    });

                    if (!Modernizr.touch) {
                        enableResize();
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
        app.togglePermanentFolderView = togglePermanent;
        app.folderView = null;

        initExtensions(POINT, app);

        // apply all options
        _(ext.point(POINT + '/options').all()).each(function (obj) {
            options = _.extend(obj, options || {});
        });

        baton.options = options;

        // draw sidepanel & container
        ext.point(POINT + '/sidepanel').invoke('draw', app.getWindow().nodes.body, baton);
        sidepanel = baton.$.sidepanel;
        container = baton.$.container;

        new links.ActionGroup(TOGGLE, {
            id: 'folder',
            index: 200,
            icon: function () {
                return $('<i class="icon-folder-close">');
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
