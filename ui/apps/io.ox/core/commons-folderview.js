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
     'io.ox/core/notifications',
     'io.ox/core/api/folder',
      'gettext!io.ox/core'], function (ext, notifications, api, gt) {

    'use strict';

    function initExtensions(POINT) {

        // default options
        ext.point(POINT + '/options').extend({
            id: 'defaults',
            index: 100,
            rootFolderId: '1',
            type: undefined,
            view: 'ApplicationFolderTree',
            visible: false,
            permanent: false
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
                            $('<li class="dropdown-header">')
                        )
                    )
                );
                ext.point(POINT + '/sidepanel/toolbar/options').invoke('draw', ul, baton);
                // listen to selection event to update dropdown header
                baton.tree.selection.on('change', function (e, selection) {
                    if (selection.length) {
                        api.get({ folder: selection[0].id }).done(function (data) {
                            ul.find('.dropdown-header').text(_.noI18n(data.title));
                        });
                    }
                });
            }
        });

        ext.point(POINT + '/sidepanel/toolbar').extend({
            id: 'toggle',
            index: 300,
            draw: function (baton) {
                var className = baton.options.permanent ? 'icon-chevron-right' : 'icon-chevron-left';
                this.append(
                    $('<a href="#" class="toolbar-action pull-right"><i class="' + className + '"></a>')
                    .on('click', function (e) {
                        e.preventDefault();
                        $(this).find('i').attr('class', baton.app.togglePermanentFolderView() ? 'icon-chevron-right' : 'icon-chevron-left');
                    })
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
                    $('<a href="#">').text(gt('Add subfolder'))
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
                        $('<a href="#">').text(gt('Add mail account')).on('click', addAccount)
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
                this.append($('<li>').append(
                    $('<a href="#">').text(gt('Rename'))
                    .on('click', { app: baton.app }, renameFolder)
                ));
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
                this.append(
                    $('<li>').append(
                        $('<a href="#">').text(gt('Delete'))
                        .on('click', { app: baton.app }, deleteFolder)
                    )
                );
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
            fnToggle, toggle, loadTree, initTree,
            name = app.getName(),
            POINT = name + '/folderview',
            baton = new ext.Baton({ app: app });

        fnChangeFolder = function (e, selection) {
            var folder = selection[0];
            if (folder.module === options.type) {
                app.folder.unset();
                if (options.permanent) {
                    app.folder.set(folder.id);
                } else {
                    top = container.scrollTop();
                    sidepanel.fadeOut('fast', function () {
                        app.folder.set(folder.id);
                    });
                    visible = false;
                }
            }
        };

        disablePermanent = function () {
            app.getWindow().nodes.body.css('left', '0px');
            sidepanel.css({ width: '', left: '0px' });
        };

        enablePermanent = function () {
            var width = 250; //sidepanel.outerWidth();
            app.getWindow().nodes.body.css('left', width + 'px');
            sidepanel.css({ width: width + 'px', left: -width + 'px' });
        };

        togglePermanent = function () {
            if (options.permanent) { disablePermanent(); } else { enablePermanent(); }
            return (options.permanent = !options.permanent);
        };

        fnHide = function () {
            app.getWindow().nodes.title.find('.' + UP).removeClass(UP).addClass(DOWN);
            top = container.scrollTop();
            disablePermanent();
            sidepanel.hide();
            visible = false;
        };

        fnShow = function () {
            if (!visible) {
                app.getWindow().nodes.title.find('.' + DOWN).removeClass(DOWN).addClass(UP);
                if (options.permanent) { enablePermanent(); }
                sidepanel.show();
                container.scrollTop(top);
                visible = true;
            }
            return $.when();
        };

        toggle = function (e) {
            if (visible) { fnHide(); } else { fnShow(); }
        };

        fnToggle = function (e) {
            if (!e.isDefaultPrevented()) {
                toggle(e);
            }
        };

        initTree = function (views) {

            // init tree before running toolbar extensions
            var tree = baton.tree = app.folderView = new views[options.view](container, {
                    type: options.type,
                    rootFolderId: options.rootFolderId
                });

            // draw toolbar
            ext.point(POINT + '/sidepanel/toolbar').invoke('draw', baton.$.toolbar, baton);

            // paint now
            return tree.paint().pipe(function () {
                return tree.select(app.folder.get()).done(function () {
                    tree.selection.on('change', fnChangeFolder);
                    app.getWindow().nodes.title.on('click', fnToggle);
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
                        tree.repaintNode(data.folder_id).done(function () {
                            tree.idle();
                            tree.select(newId);
                        });
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

        initExtensions(POINT);

        // apply all options
        _(ext.point(POINT + '/options').all()).each(function (obj) {
            options = _.extend(obj, options || {});
        });

        baton.options = options;

        // draw sidepanel & container
        ext.point(POINT + '/sidepanel').invoke('draw', app.getWindow().nodes.body, baton);
        sidepanel = baton.$.sidepanel;
        container = baton.$.container;

        app.getWindow().nodes.title
            .css('cursor', 'pointer')
            .on('click', loadTree);

        if (options.visible === true) {
            loadTree();
        }
    }

    return {
        add: add
    };
});
