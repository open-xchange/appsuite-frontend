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
     'gettext!io.ox/core'], function (ext, links, notifications, api, gt) {

    'use strict';

    function initExtensions(POINT, app) {

        // default options
        ext.point(POINT + '/options').extend({
            id: 'defaults',
            index: 100,
            rootFolderId: '1',
            type: undefined,
            view: 'ApplicationFolderTree',
            visible: app.settings.get('folderview/visible', false),
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
                    $('<div class="toolbar-action pull-left dropdown dropup">').append(
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
                    $('<div class="toolbar-action pull-left dropdown dropup">').append(
                        $('<a href="#" class="dropdown-toggle" data-toggle="dropdown"><i class="icon-cog"></a>'),
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
                    $('<a h ef="#" class="toolbar-action pull-right"><i class="icon-remove"></a>')
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

        function addAccount(e) {
            e.preventDefault();
            require(['io.ox/mail/accounts/settings'], function (m) {
                m.mailAutoconfigDialog(e);
            });
        }

        ext.point(POINT + '/sidepanel/toolbar/add').extend({
            id: 'add-account',
            index: 200,
            draw: function (baton) {
                if (baton.options.type === 'mail') {
                    this.append($('<li>').append(
                        $('<a href="#" data-action="add-mail-account">').text(gt('Add mail account')).on('click', addAccount)
                    ));
                }
            }
        });

        function subscribeIMAPFolder(e) {
            e.preventDefault();
            e.data.app.folderView.subscribe(e.data);
        }

        ext.point(POINT + '/sidepanel/toolbar/add').extend({
            id: 'subscribe-folder',
            index: 200,
            draw: function (baton) {
                if (baton.options.type === 'mail') {
                    this.append($('<li>').append(
                        $('<a href="#" data-action="subscribe">').text(gt('Subscribe IMAP folders'))
                        .on('click', { app: baton.app, selection: baton.tree.selection }, subscribeIMAPFolder)
                    ));
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
            index: 1000,
            draw: function (baton) {
                var link = $('<a href="#" data-action="delete">').text(gt('Delete'));
                this.append($('<li>').append(link));

                if (api.can('deleteFolder', baton.data)) {
                    link.on('click', { app: baton.app }, deleteFolder);
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
            index: 200,
            draw: function (baton) {
                var link = $('<a href="#" data-action="permissions">').text(gt('Permissions'));
                this.append($('<li>').append(link.on('click', { app: baton.app }, setFolderPermissions)));
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
                        rootFolderId: '9',
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
            top = 0, UP = 'icon-chevron-up', DOWN = 'icon-chevron-down',
            fnChangeFolder, fnHide, fnShow, togglePermanent,
            disablePermanent, enablePermanent,
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
                    app.folder.unset();
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
            app.getWindow().nodes.body.removeClass('side-shift');
            sidepanel.removeClass('side-shift');//css({ width: '', left: '0px' });
        };

        enablePermanent = function () {
            //var width = 250; //sidepanel.outerWidth();
            app.getWindow().nodes.body.addClass('side-shift');
            sidepanel.addClass('side-shift');//css({ width: width + 'px', left: -width + 'px' });
        };

        togglePermanent = function () {
            if (options.permanent) { disablePermanent(); } else { enablePermanent(); }
            options.permanent = !options.permanent;
            app.settings.set('folderview/permanent', options.permanent).save();
            return options.permanent;
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
                    rootFolderId: options.rootFolderId,
                    open: app.settings.get('folderview/open', []),
                    toggle: function (open) {
                        app.settings.set('folderview/open', open).save();
                    }
                });

            // draw toolbar

            tree.selection.on('change', function (e, selection) {
                if (selection.length) {
                    api.get({ folder: selection[0] }).done(function (data) {
                        baton.data = data;
                        ext.point(POINT + '/sidepanel/toolbar').invoke('draw', baton.$.toolbar.empty(), baton);
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
                        if (_.isEqual(tree.selection.get(), [id])) {
                            tree.repaintNode(data.folder_id).done(function () {
                                tree.idle();
                                if (newId !== id) tree.select(newId);
                            });
                        } else {
                            tree.root.repaint();
                            tree.idle();
                        }
                    });

                    api.on('delete:fail update:fail create:fail', function (e, error) {
                        tree.idle();
                        notifications.yell(error);
                    });
                    initTree = loadTree = null;
                });
            });
        };

        loadTree = function (e) {
            toggle();
            app.showFolderView = fnShow;
            app.toggleFolderView = toggle;
            loadTree = toggleTree = $.noop;
            return require(['io.ox/core/tk/folderviews']).pipe(initTree);
        };

        toggleTree = loadTree;

        app.showFolderView = loadTree;
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
    }

    return {
        add: add
    };
});
