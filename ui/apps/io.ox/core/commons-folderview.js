/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/commons-folderview',
    ['io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'io.ox/core/notifications',
     'io.ox/core/api/folder',
     'settings!io.ox/core',
     'settings!io.ox/caldav',
     'io.ox/core/capabilities',
     'gettext!io.ox/core'
    ], function (ext, links, notifications, api, coreConfig, caldavConfig, capabilities, gt) {

    'use strict';

    function initExtensions(POINT, app) {

        // mobile quirks
        /* our product gets designed by others, turn this on again
        if (_.device('small')) {
            //nobody needs options and create in folder tree on mobile
            ext.point(POINT + '/sidepanel/toolbar').disable('add');
            ext.point(POINT + '/sidepanel/toolbar').disable('options');
        }
        */

        // default options
        ext.point(POINT + '/options').extend({
            id: 'defaults',
            index: 100,
            rootFolderId: '1',
            type: undefined,
            view: 'ApplicationFolderTree',
            // disable folder popup as it takes to much space for startup on small screens
            visible: _.device('small') ? false : app.settings.get('folderview/visible/' + _.display(), true)
        });

        // draw container
        ext.point(POINT + '/sidepanel').extend({
            index: 100,
            draw: function (baton) {
                this.prepend(
                    // sidepanel
                    baton.$.sidepanel = $('<div class="abs border-right foldertree-sidepanel">')
                    .attr({
                        'role': 'navigation',
                        'aria-label': gt('Folders')
                    })
                    .append(
                        // container
                        $('<div class="abs foldertree-container">').append(
                            baton.$.container = $('<div class="foldertree">'),
                            baton.$.links = $('<div class="foldertree-links">')
                        )
                    )
                );

                ext.point(POINT + '/sidepanel/links').invoke('draw', baton.$.links, baton);
            }
        });

        ext.point(POINT + '/sidepanel').extend({
            id: 'context-menu',
            index: 200,
            draw: function (baton) {

                var ul;

                baton.$.sidepanel.append(
                    $('<div class="context-dropdown dropdown" data-action="context-menu">').append(
                        $('<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true">'),
                        $('<div class="abs context-dropdown-overlay">'),
                        ul = $('<ul class="dropdown-menu" role="menu">')
                    )
                );

                ext.point(POINT + '/sidepanel/context-menu').invoke('draw', ul, baton);

                function openContextMenu(e) {

                    // return early if not up, down, escape, enter, click or contextmenu
                    if (!/(27|13|38|40|9)/.test(e.keyCode) && e.type !== 'click' && e.type !== 'contextmenu') return;

                    var current = $(e.currentTarget),
                        dropdown = baton.$.sidepanel.find('.context-dropdown');

                    // get node of cog button if opened via contextmenu
                    if (current.hasClass('folder')) current = current.find('a.folder-options-badge');

                    // close dropdown when shift tabbing from button
                    if (/(9)/.test(e.keyCode)) {
                        if (e.shiftKey) {
                            dropdown.removeClass('open');
                            current.removeClass('dropdown-opened');
                        }
                        if (dropdown.hasClass('open')) dropdown.find('ul > li:first > a').focus();
                        return;
                    }

                    // to refocus button on dropdown close
                    ul.off('keydown.foldertreecontext')
                      .on('keydown.foldertreecontext', 'a', function (e) {
                        if (/(27)/.test(e.keyCode)) {
                            dropdown.removeClass('open');
                            current.removeClass('dropdown-opened').focus();
                            return false;
                        }
                    });

                    e.preventDefault();

                    // close dropdown when still focussing button
                    if (/(27)/.test(e.keyCode)) {
                        dropdown.removeClass('open');
                        current.removeClass('dropdown-opened');
                        return;
                    }

                    // up
                    if (/(38)/.test(e.keyCode)) {
                        dropdown.find('ul > li:last > a').focus();
                        return;
                    }
                    // down
                    if (/(40)/.test(e.keyCode)) {
                        dropdown.find('ul > li:first > a').focus();
                        return;
                    }

                    setTimeout(function () {
                        var offset, top, left, menu, height, maxHeight;
                        // show first to get proper dimensions
                        dropdown.find('.dropdown-toggle').dropdown('toggle');
                        current.addClass('dropdown-opened');
                        // exceeds window?
                        if (e.type !== 'contextmenu') {
                            offset = current.offset();
                            top = offset.top - 4;
                            left = offset.left + current.parent().width();
                        } else {
                            top = e.pageY - 15;
                            left = e.pageX + 15;
                        }
                        menu = dropdown.find('.dropdown-menu');
                        height = menu.outerHeight();
                        maxHeight = $(document).height();

                        if ((top + height) > maxHeight) top = Math.max(10, maxHeight - height - 10);
                        // update position
                        menu.css({ top: top, left: left });
                    }, 0);
                }

                function closeContextMenu(e) {
                    e.preventDefault();
                    $(this).closest('.dropdown.open').removeClass('open');
                }

                baton.$.sidepanel
                    .on('click keydown', '.folder-options-badge', openContextMenu)
                    .on('contextmenu', '.folder', openContextMenu)
                    .on('contextmenu', '.context-dropdown-overlay', closeContextMenu);
            }
        });

        // draw click intercept-div which intercepts
        // clicks on the visible rest of the grids on mobile
        // when folder tree is expanded
        ext.point(POINT + '/sidepanel/mobile').extend({
            id: 'spacer',
            draw: function (baton) {
                this.prepend(
                    // sidepanel
                    baton.$.spacer = $('<div class="mobile-clickintercept">')
                        .addClass('foldertree-click-intercept')
                        .on('touchstart', {baton: baton}, function (e) {
                            e.preventDefault();
                            e.stopImmediatePropagation();
                            e.data.baton.app.toggleFolderView();
                        }).hide()
                );
            }
        });

        function addTopLevelFolder(e) {
            e.preventDefault();
            ox.load(['io.ox/core/folder/add']).done(function (add) {
                add('1', { module: 'mail' });
            });
        }

        function addFolder(e) {
            e.preventDefault();
            ox.load(['io.ox/core/folder/add']).done(function (add) {
                add(e.data.folder, { module: e.data.module });
            });
        }

        // toolbar actions
        ext.point(POINT + '/sidepanel/links').extend({
            id: 'add-toplevel-folder',
            index: 100,
            draw: function (baton) {

                if (baton.options.type !== 'mail') return;

                // only show for mail
                this.append($('<div>').append(
                    $('<a href="#" data-action="add-toplevel-folder" tabindex="1" role="button">').text(gt('New folder'))
                    .on('click', addTopLevelFolder)
                ));
            }
        });

        ext.point(POINT + '/sidepanel/context-menu').extend({
            id: 'add-folder',
            index: 90,
            draw: function (baton) {

                if (/^(contacts|calendar|tasks)$/.test(baton.options.type)) return;
                if (!api.can('create', baton.data)) return;

                // only mail and infostore show hierarchies
                this.append(
                    $('<li>').append(
                        $('<a href="#" tabindex="1" data-action="add-subfolder" role="menuitem">')
                        .text(gt('New subfolder'))
                        .on('click', { app: baton.app, folder: baton.data.id, module: baton.options.type }, addFolder)
                    ),
                    $('<li class="divider">')
                );
            }
        });

        // flat folder view

        ext.point('io.ox/foldertree/section/links').extend({
            index: 200,
            id: 'private',
            draw: function (baton) {

                if (baton.id !== 'private') return;
                if (baton.options.dialogmode) return;

                this.append($('<div>').append(
                    $('<a href="#" tabindex="1" data-action="add-subfolder" role="menuitem">')
                    .text(gt('New private folder'))
                    .on('click', { folder: api.getDefaultFolder(baton.options.type), module: baton.options.type }, addFolder)
                ));
            }
        });

        ext.point('io.ox/foldertree/section/links').extend({
            index: 300,
            id: 'public',
            draw: function (baton) {

                // yep, show this below private section.
                // cause there might be no public folders, and in this case
                // the section would be hidden
                if (baton.id !== 'private') return;
                if (!capabilities.has('edit_public_folders')) return;
                if (baton.options.dialogmode) return;

                var node = $('<div>');
                this.append(node);

                api.get({ folder: 2 }).then(function (public_folder) {
                    if (!api.can('create', public_folder)) return;
                    node.append(
                        $('<a href="#" tabindex="1" data-action="add-subfolder" role="menuitem">')
                        .text(gt('New public folder'))
                        .on('click', { folder: '2', module: baton.options.type }, addFolder)
                    );
                });
            }
        });

        function publish(e) {
            e.preventDefault();
            require(['io.ox/core/pubsub/publications'], function (publications) {
                publications.buildPublishDialog(e.data.baton);
            });
        }

        ext.point(POINT + '/sidepanel/context-menu').extend({
            id: 'publications',
            index: 150,
            draw: function (baton) {

                if (!capabilities.has('publication') || !api.can('publish', baton.data)) return;

                this.append(
                    $('<li>').append(
                        $('<a href="#" data-action="publications" role="menuitem" tabindex="1">')
                        .text(gt('Share this folder'))
                        .on('click', { baton: baton }, publish)
                    )
                );
            }
        });

        function subscribe(e) {
            e.preventDefault();
            require(['io.ox/core/pubsub/subscriptions'], function (subscriptions) {
                subscriptions.buildSubscribeDialog(e.data);
            });
        }

        ext.point(POINT + '/sidepanel/context-menu').extend({
            id: 'subscribe',
            index: 200,
            draw: function (baton) {

                if (!capabilities.has('subscription') || !api.can('subscribe', baton.data)) return;

                this.append(
                    $('<li>').append(
                        $('<a href="#" data-action="subscriptions" role="menuitem" tabindex="1">')
                        .text(gt('New subscription'))
                        .on('click', { folder: baton.data.folder_id, module: baton.data.module, app: baton.app }, subscribe)
                    )
                );
            }
        });

        ext.point(POINT + '/sidepanel/context-menu').extend({
            id: 'pubsub-divider',
            after: 'subscribe',
            draw: function (baton) {
                if ((!capabilities.has('publication') ||
                    !api.can('publish', baton.data)) &&
                    (!capabilities.has('subscription') ||
                    !api.can('subscribe', baton.data)))
                {
                    return;
                }

                this.append($('<li class="divider">'));
            }
        });

        function renameFolder(e) {
            e.preventDefault();
            e.data.app.folderView.rename();
        }

        // here

        ext.point(POINT + '/sidepanel/context-menu').extend({
            id: 'rename',
            index: 100,
            draw: function (baton) {
                if (api.can('rename', baton.data)) {
                    this.append(
                        $('<li>').append(
                            $('<a href="#" tabindex="1" data-action="rename" role="menuitem">')
                            .text(gt('Rename'))
                            .on('click', { app: baton.app }, renameFolder)
                        )
                    );
                }
            }
        });

        function deleteFolder(e) {
            e.preventDefault();
            e.data.app.folderView.remove();
        }

        ext.point(POINT + '/sidepanel/context-menu').extend({
            id: 'delete',
            index: 500,
            draw: function (baton) {
                if (api.can('deleteFolder', baton.data)) {
                    var divider = (baton.options.type !== 'mail' && this.find('a[data-action="hide"]').length === 0);//not in mail and no hideshow action
                    this.append(
                        (divider ? $('<li class="divider" role="presentation" aria-hidden="true">'): ''),
                        $('<li>').append(
                            $('<a href="#" tabindex="1" data-action="delete" role="menuitem">')
                            .text(gt('Delete'))
                            .on('click', { app: baton.app }, deleteFolder)
                        )
                    );
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

        ext.point(POINT + '/sidepanel/context-menu').extend({
            id: 'export',
            index: 250,
            draw: function (baton) {
                if (_.device('!ios && !android')) {
                    if (api.can('export', baton.data)) {
                        this.append(
                            $('<li>').append(
                                $('<a href="#" tabindex="1" data-action="export">')
                                .text(gt('Export'))
                                .on('click', { baton: baton }, exportData)
                            )
                        );
                    }
                }
            }
        });

        function importData(e) {
            e.preventDefault();
            require(['io.ox/core/import/import'], function (importer) {
                importer.show(e.data.baton.data.module, String(e.data.baton.app.folderView.selection.get()));
            });
        }

        ext.point(POINT + '/sidepanel/context-menu').extend({
            id: 'import',
            index: 245,
            draw: function (baton) {
                if (_.device('!ios && !android')) {
                    if (api.can('import', baton.data)) {
                        this.append(
                            $('<li>').append(
                                $('<a href="#" tabindex="1" data-action="import">')
                                .text(gt('Import'))
                                .on('click', { baton: baton }, importData)
                            )
                        );
                    }
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

        ext.point(POINT + '/sidepanel/context-menu').extend({
            id: 'permissions',
            index: 300,
            draw: function (baton) {
                if (capabilities.has('!alone') && capabilities.has('gab') && _.device('!smartphone')) {
                    this.append(
                        $('<li class="divider" aria-hidden="true" role="presentation">'),
                        $('<li>').append(
                            $('<a href="#" tabindex="1" data-action="permissions" role="menuitem">')
                            .text(gt('Permissions'))
                            .on('click', { app: baton.app }, setFolderPermissions)
                        )
                    );
                }
            }
        });

        function showFolderProperties(e) {

            e.preventDefault();

            // get current folder id
            var baton = e.data.baton, id = baton.app.folder.get();

            api.get({ folder: id }).done(function (folder) {
                require(['io.ox/core/tk/dialogs'], function (dialogs) {
                    var title = gt('Properties'),
                    dialog = new dialogs.ModalDialog()
                    .header(
                        api.getBreadcrumb(folder.id, { prefix: title }).css({ margin: '0' })
                    )
                    .build(function () {
                        function ucfirst(str) {
                            return str.charAt(0).toUpperCase() + str.slice(1);
                        }
                        var node = this.getContentNode().append(
                            $('<div class="form-group">').append(
                                $('<label class="control-label">')
                                    .text(gt('Folder type')),
                                $('<input class="form-control">', { type: 'text' })
                                    .prop('readonly', true)
                                    .val(ucfirst(folder.module))
                            )
                        );
                        // show CalDAV URL for calendar folders
                        // users requires "caldav" capability
                        if (folder.module === 'calendar' && capabilities.has('caldav')) {
                            node.append(
                                $('<div class="form-group">').append(
                                    $('<label class="control-label">')
                                        .text(gt('CalDAV URL')),
                                    $('<input class="form-control">', { type: 'text' })
                                        .prop('readonly', true)
                                        .val(
                                            _.noI18n(caldavConfig.get('url')
                                                .replace('[hostname]', location.host)
                                                .replace('[folderId]', id)
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

        ext.point(POINT + '/sidepanel/context-menu').extend({
            id: 'properties',
            index: 400,
            draw: function (baton) {
                if (_.device('!smartphone')) {
                    if (!capabilities.has('gab')) {
                        //workaround: add divider if not set by permissions yet
                        this.append(
                            $('<li class="divider" aria-hidden="true" role="presentation">')
                        );
                    }
                    this.append(
                        $('<li>').append(
                            $('<a href="#" tabindex="1" data-action="properties" role="menuitem">')
                            .text(gt('Properties'))
                            .on('click', { baton: baton }, showFolderProperties)
                        )
                    );
                }
            }
        });

        function moveFolder(e) {

            e.preventDefault();

            // get current folder id
            var baton = e.data.baton, id = baton.app.folder.get();

            api.get({ folder: id }).done(function (folder) {
                require(['io.ox/core/tk/dialogs', 'io.ox/core/tk/folderviews'], function (dialogs, views) {
                    var title = gt('Move folder'),
                        dialog = new dialogs.ModalDialog()
                            .header(
                                api.getBreadcrumb(folder.id, { prefix: title }).css({ margin: '0' })
                            )
                            .addPrimaryButton('ok', title)
                            .addButton('cancel', gt('Cancel'));
                    dialog.getBody().css('height', '250px');
                    var type = baton.options.type,
                        tree = new views.FolderTree(dialog.getBody(), {
                            type: type,
                            rootFolderId: type === 'infostore' ? '9' : '1',
                            skipRoot: true,
                            tabindex: 0,
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
                            // open the foldertree to the current folder
                            tree.select(folder.id).done(function () {
                                // select first active element
                                tree.selection.updateIndex().selectFirst();
                                // focus
                                dialog.getBody().focus();
                            });
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

        ext.point(POINT + '/sidepanel/context-menu').extend({
            id: 'move',
            index: 200,
            draw: function (baton) {

                if (!/^(mail|infostore)$/.test(baton.options.type)) return;
                if (_.device('smartphone')) return;

                if (api.can('deleteFolder', baton.data)) {
                    this.append(
                        $('<li>').append(
                            $('<a href="#" tabindex="1" data-action="delete" role="menuitem">')
                            .text(gt('Move'))
                            .on('click', { baton: baton }, moveFolder)
                        )
                    );
                }
            }
        });

        function hideShowFolder(e) {//move folder to hidden folders section or removes it from there
            e.preventDefault();

            var baton = e.data.baton,
                data = baton.data,
                appSettings = e.data.appSettings,
                blacklist = appSettings.get('folderview/blacklist', {});
            
            //update blacklist
            if (e.data.hide) {
                blacklist[data.id] = true;
            } else {
                delete blacklist[data.id];
            }
            appSettings.set('folderview/blacklist', blacklist);
            appSettings.save();

            //repaint tree but keep scrollposition
            var node = baton.tree.container.parents('.foldertree-container'),
                pos = node.scrollTop();
            
            baton.tree.repaint().done(function () {
                node.scrollTop(pos);//apply old scrollposition
            });

            //dropdown menu needs a redraw too
            var ul = baton.$.sidepanel.find('.context-dropdown ul');
            ext.point(POINT + '/sidepanel/context-menu').invoke('draw', ul.empty(), baton);
        }

        ext.point(POINT + '/sidepanel/context-menu').extend({
            id: 'hideAndShow',
            index: 450,
            draw: function (baton) {
                if (baton.options.view === 'FolderList' &&
                    !_.device('smartphone') &&
                    baton.data.id) {//if data is empty we have nothing to do here

                    var appSettings = baton.app.settings,
                    hide = !appSettings.get('folderview/blacklist', {})[baton.data.id];//apps have their own blacklists for hidden folders
                    if (!baton.data.standard_folder || !hide) {//always show unhide function (we don't want to loose folders here) but hide only when it's not a standard folder
                        this.append(
                            $('<li class="divider" role="presentation" aria-hidden="true">'),
                            $('<li>').append(
                                $('<a href="#" tabindex="1" data-action="hide" role="menuitem">')
                                .text(hide ? gt('Hide'): gt('Show'))
                                .on('click', { baton: baton, appSettings: appSettings, hide: hide}, hideShowFolder)
                            )
                        );
                    }
                    
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
            fnHide, fnShow, fnResize, fnShowSml, fnHideSml, initResize, restoreWidth, makeResizable,
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

        onChangeFolder = (function () {

            var current = null;

            return function (e, selection) {

                var id = _(selection).first(),
                    previous = current;

                current = id;

                api.get({ folder: id }).done(function (data) {
                    if (_.device('small') && previous !== null) {
                        // close tree
                        fnHideSml();
                    }

                    if (data.module === options.type) {
                        if (id !== current) return;
                        changeFolderOff();
                        app.folder.set(id)
                            .done(function () {
                                if (id !== current) return;
                                app.folderView.selection.set(id);
                            })
                            .always(changeFolderOn);
                    }
                });
            };
        }());

        restoreWidth = $.noop;

        makeResizable = function () {

            var resizeBar, minSidePanelWidth, windowContainer, maxSidePanelWidth;

            sidepanel.append(resizeBar = $('<div class="resizebar">'));
            // needs to match min-width!
            minSidePanelWidth = 170;

            function resetWidths() {
                if ($(window).width() < 700) {
                    app.getWindow().nodes.body.css('left', '');
                    sidepanel.removeAttr('style');
                }
            }

            function getWidths() {
                windowContainer = sidepanel.closest('.window-container-center');
                maxSidePanelWidth = windowContainer.width() / 2;
                restoreWidth();
            }

            function applyWidth(width) {
                var nodes = app.getWindow().nodes;
                nodes.body.css('left', width + 'px');
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
                        app.trigger('folderview:resize');
                        applyWidth(newWidth);
                    }
                });
            });

            getWidths();

            windowContainer.on('mouseup', function () {
                windowContainer.off('mousemove');
                var width = $(this).data('resize-width') || 250;
                app.settings.set('folderview/width/' + _.display(), width).save();
            });

            //don't hide foldertree on orientationchange on desktops
            //event is triggered when resizing the window and width becomes smaller than height and vice versa
            //see Bug 31055
            if (_.device('!desktop')) {
                $(window).off('orientationchange.folderview').on('orientationchange.folderview', fnHide);
            }
        };

        fnResize = function () {
            var nodes = app.getWindow().nodes;
            if ($(document).width() > 700) {
                nodes.body.css('left', '50px');
            } else {
                nodes.body.css('left', '0px');
            }
        };

        fnHide = function () {
            app.settings.set('folderview/visible/' + _.display(), visible = false).save();
            top = container.scrollTop();
            var nodes = app.getWindow().nodes;
            fnResize();
            nodes.sidepanel.removeClass('visible').css('width', '');
            app.trigger('folderview:close');
            if (app.getGrid) {
                app.getGrid().focus();
            }
        };

        fnShow = function (resized) {
            app.settings.set('folderview/visible/' + _.display(), visible = true).save();
            var nodes = app.getWindow().nodes;
            fnResize();
            nodes.sidepanel.addClass('visible');
            restoreWidth();
            if (!resized) {
                baton.$.container.focus();
            }
            app.trigger('folderview:open');
            return $.when();
        };

        fnHideSml = function () {
            app.settings.set('folderview/visible/' + _.display(), visible = false).save();
            top = container.scrollTop();
            var nodes = app.getWindow().nodes;
            $('.window-container-center', nodes.outer).removeClass('animate-moveright').addClass('animate-moveleft');
            baton.$.spacer.hide();
            app.trigger('folderview:close');
        };

        fnShowSml = function () {
            app.settings.set('folderview/visible/' + _.display(), visible = true).save();
            var nodes = app.getWindow().nodes;
            $('.window-container-center', nodes.outer).removeClass('animate-moveleft').addClass('animate-moveright');
            baton.$.spacer.show();
            app.trigger('folderview:open');
            return $.when();
        };

        toggle = function () {
            if (_.device('smartphone')) {
                if (visible) { fnHideSml(); } else { fnShowSml();  }
            } else {
                if (visible) { fnHide(); } else { fnShow();  }
            }
        };

        initResize = function () {

            // no resize in either touch devices or small devices
            if (_.device('smartphone')) return;

            makeResizable();
            restoreWidth();
        };

        initTree = function (views) {
            // work with old non-device specific setting (<= 7.2.2) and new device-specific approach (>= 7.4)
            var open = app.settings.get('folderview/open', {});
            if (open && open[_.display()]) open = open[_.display()];
            open = _.isArray(open) ? open : [];

            // init tree before running toolbar extensions
            var tree = baton.tree = app.folderView = new views[options.view](container, {
                    app: app,
                    type: options.type,
                    rootFolderId: String(options.rootFolderId),
                    open: open,
                    toggle: function (open) {
                        app.settings.set('folderview/open/' + _.display(), open).save();
                    }
                });

            // draw toolbar
            tree.selection.on('change', function (e, selection) {
                if (selection.length) {
                    var id = selection[0];
                    api.get({ folder: id }).done(function (data) {
                        baton.data = data;
                        // update toolbar
                        ext.point(POINT + '/sidepanel/links').invoke('draw', baton.$.links.empty(), baton);
                        // update context menu
                        var ul = baton.$.sidepanel.find('.context-dropdown ul');
                        ext.point(POINT + '/sidepanel/context-menu').invoke('draw', ul.empty(), baton);
                        // reload tree node
                        tree.reloadNode(id);
                    });
                }
            });

            // mobile quirks, cannot be applied to css class
            // because it would be applied to desktop clients using
            // a small screen, too
            if (_.device('smartphone')) {
                // mobile stuff
                $('.window-sidepanel').css({
                    'width': '90%',
                    'left': '-90%',
                    'right': 'intial'
                });
                // listen to swipe
                // TODO: works not reliable on android stock browsers, add a manual close button also
                sidepanel.on('swipeleft', toggle);

            }

            tree.selection.on('change', onChangeFolder);
            changeFolderOn();

            // paint now
            return tree.paint().then(function () {

                if (options.visible === false) {
                    initResize();
                }

                return tree.select(app.folder.get()).done(function () {

                    toggleTree = toggle;
                    sidepanel.idle();

                    api.on('create', function (e, data) {
                        tree.repaint().done(function () {
                            tree.select(data.id);
                        });
                    });

                    api.on('delete:prepare', function (e, data) {
                        var folder = data.folder_id, id = data.id;
                        if (folder === '1') {
                            folder = api.getDefaultFolder(data.module) || '1';
                        }
                        tree.select(folder);
                        tree.removeNode(id);
                    });

                    api.on('delete', _.throttle(function (e, id) {
                        app.trigger('folder:delete', id);
                    }, 100));

                    api.on('refresh', function () {
                        tree.repaint();
                    });

                    api.on('update', function (e, id, newId) {
                        // this is used by folder rename, since the id might change (mail folders)
                        var sel = tree.selection.get();
                        if (_.isEqual(sel, [id])) {
                            tree.repaint().done(function () {
                                tree.idle();
                                if (newId !== id) tree.select(newId);
                            });
                        } else {
                            if (!id && !newId && sel.length === 0) {
                                String(tree.select(coreConfig.get('folder/' + options.type)));
                            }
                            tree.repaint();
                        }
                    });

                    api.on('delete:fail update:fail create:fail', function (e, error) {
                        notifications.yell(error);
                        tree.repaint();
                    });

                    api.on('update:unread', function (e, id) {
                        tree.reloadNode(id);
                    });

                    // just a delveopment hack - turning off - no right click menus!
                    // sidepanel.on('contextmenu', '.folder', function (e) {
                    //     e.preventDefault();
                    //     $(this).closest('.foldertree-sidepanel').find('.foldertree-toolbar > [data-action="options"]').addClass('open');
                    //     return false;
                    // });

                    initTree = loadTree = null;
                });
            });
        };

        loadTree = function () {
            toggle();
            app.showFolderView = _.device('smartphone') ? fnShowSml : fnShow;
            app.hideFolderView = _.device('smartphone') ? fnHideSml : fnHide;
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

        if (_.device('smartphone')) {
            ext.point(POINT + '/sidepanel/mobile').invoke('draw', app.getWindow().nodes.outer, baton);
        }

        sidepanel = baton.$.sidepanel;
        container = baton.$.container;

        var icon = $('<i class="fa fa-folder">').attr('aria-label', gt('Toggle folder'));

        app.on('folderview:open', function () {
            icon.attr('class', 'fa fa-folder-open');
            icon.addClass('fa-folder-open').removeClass('fa-folder');
        });

        app.on('folderview:close', function () {
            icon.addClass('fa-folder').removeClass('fa-folder-open');
        });

        new links.ActionGroup(TOGGLE, {
            id: 'folder',
            index: 200,
            icon: function () {
                return icon;
            }
        });

        new links.Action(ACTION, {
            action: function () {
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
