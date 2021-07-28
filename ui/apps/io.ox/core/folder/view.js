/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/core/folder/view', [
    'io.ox/core/extensions',
    'io.ox/core/folder/api',
    'settings!io.ox/core',
    'gettext!io.ox/core'
], function (ext, api, settings, gt) {

    'use strict';

    function initialize(options) {

        options = _.extend({
            firstResponder: 'listView',
            autoHideThreshold: 700
        }, options);

        var app = options.app,
            tree = options.tree,
            module = tree.options.module,
            POINT = app.get('name') + '/folderview',
            visible = false,
            open = app.settings.get('folderview/open', {}),
            nodes = app.getWindow().nodes,
            sidepanel = nodes.sidepanel,
            hiddenByWindowResize = false,
            forceOpen = false,
            DEFAULT_WIDTH = 280;

        // smart defaults for flat folders
        if (!open) {
            open = {};
            // open private and public by default
            if (/^(contacts|calendar|event|tasks)$/.test(module)) {
                open[_.display()] = ['virtual/flat/' + module + '/private', 'virtual/flat/' + module + '/public'];
            }
        }

        //
        // Utility functions
        //

        function storeVisibleState() {
            app.settings.set('folderview/visible/' + _.display(), visible).save();
        }

        function storeWidth(width) {
            if (width === undefined) {
                app.settings.remove('folderview/width/' + _.display());
            } else {
                app.settings.set('folderview/width/' + _.display(), width);
            }
            app.settings.save();
        }

        function getWidth() {
            return app.settings.get('folderview/width/' + _.display(), DEFAULT_WIDTH);
        }

        function applyWidth(x) {
            var width = x === undefined ? '' : x + 'px';
            nodes.body.css('left', width);
            nodes.sidepanel.css('width', width);
        }

        function applyInitialWidth() {
            applyWidth(getWidth());
        }

        function resetLeftPosition() {
            var win = app.getWindow(),
                chromeless = win.options.chromeless,
                tooSmall = $(document).width() <= app.folderView.resize.autoHideThreshold;
            nodes.body.css('left', chromeless || tooSmall ? 0 : 50);
        }

        var populateResize = function () {
            // trigger generic resize event so that other components can respond to it
            $(document).trigger('resize');
        };

        //
        // Add API
        //

        app.folderView = {

            tree: tree,
            forceOpen: forceOpen,

            isVisible: function () {
                return visible;
            },

            show: function () {
                visible = true;
                if (!hiddenByWindowResize) storeVisibleState();
                applyInitialWidth();
                sidepanel.addClass('visible');
                app.trigger('folderview:open');
                populateResize();
                sidepanel.css('display', 'flex');
            },

            hide: function () {
                visible = false;
                forceOpen = false;
                if (!hiddenByWindowResize) storeVisibleState();
                resetLeftPosition();
                sidepanel.removeClass('visible').css('width', '');
                app.trigger('folderview:close');
                populateResize();
            },

            toggle: function (state) {
                if (state === undefined) state = !visible;
                if (state) this.show(); else this.hide();
            },

            resize: (function () {

                var maxSidePanelWidth = 0,
                    minSidePanelWidth = 240,
                    base, width;

                function mousemove(e) {
                    var x = e.pageX - base;
                    if (x > maxSidePanelWidth || x < minSidePanelWidth) return;
                    app.trigger('folderview:resize');
                    applyWidth(width = x);
                    populateResize();
                }

                function mouseup(e) {
                    $(this).off('mousemove.resize mouseup.resize');
                    populateResize();
                    // auto-close?
                    if (e.pageX - base < minSidePanelWidth * 0.75) {
                        app.folderView.hide();
                    } else {
                        storeWidth(width || DEFAULT_WIDTH);
                    }
                }

                function mousedown(e) {
                    e.preventDefault();
                    base = e.pageX - sidepanel.width();
                    maxSidePanelWidth = $(document).width() / 2;
                    $(document).on({
                        'mousemove.resize': mousemove,
                        'mouseup.resize': mouseup
                    });
                }

                return {
                    enable: function () {
                        sidepanel.append(
                            $('<div class="resizebar">').on('mousedown.resize', mousedown)
                        );
                    },
                    autoHideThreshold: options.autoHideThreshold
                };
            }())
        };

        app.folderViewIsVisible = function () {
            return visible;
        };

        // reverted for 7.10
        // app.addPrimaryAction = function (options) {

        //     var baton = ext.Baton({ app: this });

        //     var $button = $('<button class="btn btn-primary">')
        //         .prop('disabled', true)
        //         .text(options.label)
        //         .on('click', { baton: baton }, onClick);

        //     ext.point(options.point).extend({
        //         id: 'primary-action',
        //         index: 10,
        //         draw: function () {

        //             this.append(
        //                 $('<div class="primary-action">').append($button)
        //             );

        //             updateState();
        //         }
        //     });

        //     function onClick(e) {
        //         actions.invoke(options.action, null, e.data.baton);
        //     }

        //     function updateState() {
        //         actions.check(options.action, baton).always(function (bool) {
        //             $button.prop('disabled', !bool);
        //         });
        //     }

        //     this.on('folder:change', updateState);

        //     this.listenTo(this.props, 'change:folderview', function (model, value) {
        //         // bad style; look for toolbar via selector
        //         // better: solve this in tolbar locally; however, it's no view yet; no listenTo
        //         this.getWindow().nodes.outer.find('.classic-toolbar-container .io-ox-action-link[data-action="' + options.toolbar + '"]').parent().toggle(!value);
        //     });
        // };

        //
        // Respond to window resize
        //

        function handleWindowResize() {
            // get current width
            var width = $(document).width();
            // skip if window is invisible
            if (!nodes.outer.is(':visible')) return;
            // respond to current width
            var threshold = app.folderView.resize.autoHideThreshold;
            if (!app.folderView.forceOpen && !hiddenByWindowResize && visible && width <= threshold) {
                app.folderView.hide();
                hiddenByWindowResize = true;
            } else if (hiddenByWindowResize && width > threshold) {
                app.folderView.show();
                hiddenByWindowResize = false;
            }
        }

        $(window).on('resize', _.throttle(handleWindowResize, 200));

        //
        // Extensions
        //

        // default options
        ext.point(POINT + '/options').extend({
            id: 'defaults',
            index: 100,
            rootFolderId: '1',
            type: undefined,
            view: 'ApplicationFolderTree',
            // disable folder popup as it takes to much space for startup on small screens
            visible: _.device('smartphone') ? false : app.settings.get('folderview/visible/' + _.display(), true)
        });

        //
        // Initialize
        //

        // migrate hidden folders
        if (module) {
            // yep, folder/hidden is one key
            var hidden = settings.get(['folder/hidden']);
            if (hidden === undefined) {
                hidden = app.settings.get('folderview/blacklist', {});
                if (_.isObject(hidden)) settings.set(['folder/hidden'], hidden).save();
            }
        }

        // work with old non-device specific setting (<= 7.2.2) and new device-specific approach (>= 7.4)
        if (open && open[_.display()]) open = open[_.display()];
        open = _.isArray(open) ? open : [];

        // apply
        tree.open = open;

        // set initial folder?
        var id = app.folder.get();

        if (_.device('smartphone')) {
            // due to needed support for older androids we use click here
            tree.$el.on('click', '.folder', _.debounce(function (e) {
                // use default behavior for arrow

                if (tree.module === 'calendar') {
                    if ($(e.target).is('.folder-arrow, .fa, .color-label')) {
                        return;
                    } else if (!mobileSelectMode) {
                        $(e.target).siblings().click();
                        return;
                    }
                }
                // use default behavior for non-selectable virtual folders
                var targetFolder = $(e.target).closest('.folder'),
                    mobileSelectMode = app.props.get('mobileFolderSelectMode');
                // edit mode?
                if (!!mobileSelectMode) {
                    // ignore selection of non-labels in mobile edit mode
                    if (!$(e.target).parent().hasClass('folder-label') || !$(e.target).closest('.folder').attr('data-contextmenu')) return;
                    return tree.dropdown.$('.dropdown-toggle').trigger('click', 'foldertree');
                }

                // return here as we can not change the page to a virtual folder with the exception of a selectable virtual folder
                if (targetFolder.is('.virtual') && tree.selection.selectableVirtualFolders[targetFolder.data().id] !== true) return;

                // default 'listView'
                if (options.firstResponder) app.pages.changePage(options.firstResponder);
                // callback for custom actions after pagechange
                if (options.respondCallback) options.respondCallback();

            }, 10));

            if (id) {
                // defer so that favorite folders are drawn already
                _.defer(tree.selection.preselect.bind(tree.selection, id));
            }

        } else if (id) {
            // defer so that favorite folders are drawn already
            _.defer(function () {
                api.path(id).done(function (path) {
                    // get all ids except the folder itself, therefore slice(0, -1);
                    var ids = _(path).pluck('id').slice(0, -1),
                        folder = _(path).where({ 'id': id })[0],
                        // in our apps folders are organized in virtual folders, we need to open the matching section too (private, shared, public)
                        // folder 6 is special, it's the global addressbook and the only system folder under public section. Folderdata alone does not give this info.
                        section = folder.id === '6' ? 'public' : api.getSection(folder.type, folder.id);

                    if (section && /(mail|contacts|calendar|tasks|infostore)/.test(tree.module) && tree.flat && tree.context === 'app') {
                        var module = tree.module === 'calendar' ? 'event' : tree.module;
                        ids.push('virtual/flat/' + module + '/' + section);
                    }
                    tree.open = _(tree.open.concat(ids)).uniq();
                })
                .always(function () {
                    // defer selection; might be too fast otherwise
                    tree.onAppear(id, function () {
                        _.defer(function () {
                            tree.selection.preselect(id);
                            tree.selection.scrollIntoView(id);
                            // trigger change event manually for virtual folders, needed for someviews to update correctly after initializing (myshares folder for example)
                            if (api.isVirtual(id)) {
                                tree.selection.triggerChange();
                            }
                        });
                    });
                    // render now
                    tree.render();
                });
            });
        } else {
            tree.render();
        }

        // a11y adjustments
        tree.$('.tree-container').attr({
            'aria-label': gt('Folders')
        });

        // add "flat" class to allow specific CSS rules
        tree.$('.tree-container').toggleClass('flat-tree', api.isFlat(tree.options.module));

        // apply all options
        _(ext.point(POINT + '/options').all()).each(function (obj) {
            options = _.extend(obj, options || {});
        });

        function showFolder(id, index, path) {
            // ignore system root
            if (index === 0) return;
            // expand parents
            if (index !== (path.length - 1)) {
                return this.onAppear(id, function (node) {
                    if (!node.isOpen()) node.toggle(true);
                });
            }
            // scroll leaf into view
            this.onAppear(id, function (node) {
                // cause folder node contains all sub folder nodes and can become quite large
                node.$el.intoView(this.$el, { ignore: 'bottom:partial' });
            });
        }

        // respond to folder change events

        (function folderChangeEvents() {

            var ignoreChangeEvent = false;

            // on change via app.folder.set
            app.on('folder:change', function (id, data, favorite) {
                if (ignoreChangeEvent) return;
                tree.traversePath(id, showFolder);

                if (tree.$el.find('[data-id="' + id + '"]').length) {
                    // check before selection if node is inside tree
                    tree.selection.set(id, favorite);
                } else {
                    // wait for node to appear inside tree before selection
                    tree.on('appear:' + id, function () {
                        tree.selection.set(id, favorite);
                        tree.off('appear:' + id);
                    });
                }
            });

            // on selection change
            tree.on('change', function (id) {
                // updates folder manager
                ignoreChangeEvent = true;
                app.folder.set(id);
                ignoreChangeEvent = false;
            });

            // on selection change
            tree.on('virtual', function (id) {
                app.trigger('folder-virtual:change', id);
            });

            api.on('create', _.debounce(function (data) {
                // compare folder/node.js onSort delay
                tree.traversePath(data.id, showFolder);
            }, 15));

        }());

        // respond to folder removal
        api.on('before:remove', function (data) {
            // select parent or default folder
            var id = /^(1|2)$/.test(data.folder_id) ? api.getDefaultFolder(data.module) || '1' : data.folder_id;
            tree.selection.set(id);
        });

        // respond to folder move
        api.on('move', function (id, newId) {
            tree.traversePath(newId, showFolder);
            tree.selection.set(newId);
        });

        // respond to open/close
        tree.on('open close', function () {
            var open = this.getOpenFolders();
            app.settings.set('folderview/open/' + _.display(), open).save();
        });

        // debug
        window.tree = tree;

        // show
        if (options.visible) app.folderView.show();
    }

    return {
        initialize: initialize
    };
});
