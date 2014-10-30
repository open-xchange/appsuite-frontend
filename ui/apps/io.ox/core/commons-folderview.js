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
     'io.ox/core/folder/api',
     'settings!io.ox/core',
     'io.ox/core/capabilities',
     'gettext!io.ox/core'
    ], function (ext, links, notifications, api, coreConfig, capabilities, gt) {

    'use strict';

    if (ox.debug) console.warn('Module "io.ox/core/commons-folderview" is deprecated.');

    function initExtensions(POINT, app) {

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
                    baton.$.sidepanel = $('<div class="abs foldertree-sidepanel">')
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

        ext.point(POINT + '/sidepanel').extend({
            id: 'inplace-search',
            index: 300,
            draw: function (baton) {
                // enabled for app?
                if (!baton.app.getWindow().options.facetedsearch || _.device('small')) return;
                // add space
                this.find('.foldertree-container')
                    .addClass('top-toolbar');
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

                api.get(2).done(function (public_folder) {
                    if (!api.can('create', public_folder)) return;
                    node.append(
                        $('<a href="#" tabindex="1" data-action="add-subfolder" role="menuitem">')
                        .text(gt('New public folder'))
                        .on('click', { folder: '2', module: baton.options.type }, addFolder)
                    );
                });
            }
        });
    }

    /**
     * Add folder view
     */
    function FolderView(app, options) {

        var container = $(),
            sidepanel = $(),
            visible = false,
            tmpVisible = false,
            top = 0,
            onChangeFolder, changeFolder, changeFolderOff, changeFolderOn,

            handleResize = $.noop, fnHide = $.noop, fnShow = $.noop, fnResize = $.noop,
            fnShowSml = $.noop, fnHideSml = $.noop, initResize = $.noop,
            applyInitialWidth, restoreWidth, makeResizable,
            toggle = $.noop, toggleTree, loadTree, initTree,
            name = app.getName(),
            POINT = name + '/folderview',
            TOGGLE = name + '/links/toolbar',
            ACTION = name + '/actions/toggle-folderview',
            baton = new ext.Baton({ app: app });

        this.handleFolderChange = function () {

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

                    api.get(id).done(function (data) {

                        if (_.device('smartphone') && previous !== null) {
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
        };

        this.resizable = function () {

            restoreWidth = $.noop;

            applyInitialWidth = function () {
                var width = app.settings.get('folderview/width/' + _.display(), 250);
                var nodes = app.getWindow().nodes;
                nodes.body.css('left', width + 'px');
                nodes.sidepanel.css('width', width + 'px');
            };

            makeResizable = function () {

                var resizeBar, minSidePanelWidth, windowContainer, maxSidePanelWidth;

                sidepanel.append(resizeBar = $('<div class="resizebar">'));

                // needs to match min-width!

                minSidePanelWidth = 150;

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
                    windowContainer.on({
                        'mousemove.resize': function (e) {
                            var newWidth = e.pageX;
                            if (newWidth < maxSidePanelWidth && newWidth > minSidePanelWidth) {
                                app.trigger('folderview:resize');
                                applyWidth(newWidth);
                            }
                        },
                        'mouseup.resize': function (e) {
                            $(this).off('mousemove.resize mouseup.resize');
                            // auto-close?
                            if (e.pageX < minSidePanelWidth) {
                                fnHide();
                            } else {
                                var width = $(this).data('resize-width') || 250;
                                app.settings.set('folderview/width/' + _.display(), width).save();
                            }
                        }
                    });
                });

                getWidths();

                $(window)
                    .off('resize.folderview', handleResize)
                    .on('resize.folderview', handleResize);

                if (_.device('!large')) {
                    $(window)
                        .off('orientationchange.folderview', fnHide)
                        .on('orientationchange.folderview', fnHide);
                }
            };

            var hiddenByResize = false;

            handleResize = _.throttle(function () {
                var width = $(document).width();
                // make sure view is properly shown/hidden
                if (!visible) fnHide(); else fnShow(true);
                // respond to current width
                if (!hiddenByResize && visible && width <= 700) {
                    fnHide();
                    hiddenByResize = true;
                } else if (hiddenByResize && width > 700) {
                    fnShow(true);
                    hiddenByResize = false;
                }
            }, 200);

            fnResize = function () {
                var win = app.getWindow(),
                    chromeless = win.options.chromeless,
                    tooSmall = $(document).width() <= 700;
                win.nodes.body.css('left', chromeless || tooSmall ? 0 : 50);
            };

            fnHide = function () {
                visible = false;
                if (!hiddenByResize) app.settings.set('folderview/visible/' + _.display(), visible).save();
                top = container.scrollTop();
                var nodes = app.getWindow().nodes;
                fnResize();
                nodes.sidepanel.removeClass('visible').css('width', '');
                app.trigger('folderview:close');
                if (app.getGrid) app.getGrid().focus();
            };

            fnShow = function (resized) {
                visible = true;
                if (!hiddenByResize) app.settings.set('folderview/visible/' + _.display(), visible).save();
                var nodes = app.getWindow().nodes;
                nodes.sidepanel.addClass('visible');
                restoreWidth();
                if (!resized) baton.$.container.focus();
                app.trigger('folderview:open');
                return $.when();
            };

            fnHideSml = function () {
                app.settings.set('folderview/visible/' + _.display(), visible = false).save();
                top = container.scrollTop();
                var nodes = app.getWindow().nodes;
                $('.window-container-center', nodes.outer).removeClass('animate-moveright').addClass('animate-moveleft');
                app.trigger('folderview:close');
                if (baton.$.spacer) baton.$.spacer.hide();
            };

            fnShowSml = function () {
                app.settings.set('folderview/visible/' + _.display(), visible = true).save();
                var nodes = app.getWindow().nodes;
                $('.window-container-center', nodes.outer).removeClass('animate-moveleft').addClass('animate-moveright');
                app.trigger('folderview:open');
                if (baton.$.spacer) baton.$.spacer.show();
                return $.when();
            };


            toggle = function (state) {
                if (state === undefined) state = !visible;

                if (_.device('smartphone')) {
                    if (state) fnShowSml(); else fnHideSml();
                } else {
                    if (state) fnShow(); else fnHide();
                }
            };

            initResize = function () {
                // no resize in either touch devices or small devices
                if (_.device('smartphone')) return;
                makeResizable();
                restoreWidth();
            };
        };

        this.init = function (views) {


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
                    api.get(id).done(function (data) {
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

                    api.on('remove:prepare', function (e, data) {
                        var folder = data.folder_id, id = data.id;
                        if (folder === '1') {
                            folder = api.getDefaultFolder(data.module) || '1';
                        }
                        tree.select(folder);
                        tree.removeNode(id);
                    });

                    api.on('remove', _.throttle(function (e, id) {
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

                    api.on('remove:fail update:fail create:fail', function (e, error) {
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

                    app.showFolderView = fnShow;
                    app.hideFolderView = fnHide;
                    app.toggleFolderView = toggle;

                    initTree = loadTree = null;
                });
            });
        };


        this.load = function () {

            app.showFolderView = _.device('smartphone') ? fnShowSml : fnShow;
            app.hideFolderView = _.device('smartphone') ? fnHideSml : fnHide;
            app.toggleFolderView = toggle;

            loadTree = toggleTree = $.noop;

            toggle();

            return require(['io.ox/core/tk/folderviews']).then(this.init.bind(this));
        };

        toggleTree = loadTree = this.load.bind(this);

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

        ext.point(POINT + '/sidepanel').invoke('draw', options.container || app.getWindow().nodes.sidepanel, baton);

        if (_.device('smartphone')) {
            ext.point(POINT + '/sidepanel/mobile').invoke('draw', app.getWindow().nodes.outer, baton);
        }

        sidepanel = baton.$.sidepanel;
        container = baton.$.container;

        this.actionLink = function () {

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
        };

        this.handleDrag = function () {
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
        };

        this.start = function () {
            if (options.visible !== true) return;
            applyInitialWidth();
            toggleTree();
            app.getWindow().on('open', initResize);
        };
    }

    return FolderView;
});
