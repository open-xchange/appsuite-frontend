/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/folder/view',
    ['io.ox/core/extensions',
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
            hiddenByWindowResize = false;

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
            return app.settings.get('folderview/width/' + _.display());
        }

        function applyWidth(x) {
            var width = x === undefined ? '' :  x + 'px';
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

        //
        // Add API
        //

        app.folderView = {

            tree: tree,

            isVisible: function () {
                return visible;
            },

            show: function () {
                visible = true;
                if (!hiddenByWindowResize) storeVisibleState();
                applyInitialWidth();
                sidepanel.addClass('visible');
                app.trigger('folderview:open');
            },

            hide: function () {
                visible = false;
                if (!hiddenByWindowResize) storeVisibleState();
                resetLeftPosition();
                sidepanel.removeClass('visible').css('width', '');
                app.trigger('folderview:close');
            },

            toggle: function (state) {
                if (state === undefined) state = !visible;
                if (state) this.show(); else this.hide();
            },

            resize: (function () {

                var bar = $(),
                    maxSidePanelWidth = 0,
                    minSidePanelWidth = 150,
                    base, width;

                function mousemove(e) {
                    var x = e.pageX - base;
                    if (x > maxSidePanelWidth || x < minSidePanelWidth) return;
                    app.trigger('folderview:resize');
                    applyWidth(width = x);
                }

                function mouseup(e) {
                    $(this).off('mousemove.resize mouseup.resize');
                    // auto-close?
                    if (e.pageX - base < minSidePanelWidth * 0.75) {
                        app.folderView.hide();
                    } else {
                        storeWidth(width);
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
                            bar = $('<div class="resizebar">').on('mousedown.resize', mousedown)
                        );
                    },
                    autoHideThreshold: options.autoHideThreshold
                };
            }())
        };

        app.folderViewIsVisible = function () {
            return visible;
        };

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
            if (!hiddenByWindowResize && visible && width <= threshold) {
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
            visible: _.device('small') ? false : app.settings.get('folderview/visible/' + _.display(), true)
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
            // respond to tab event for better responsiveness
            // does not work reliable on iOS, use click instead
            // Safari removes the 300ms click delay, so it's fine to use
            // click on iOS
            tree.$el.on(_.device('ios') ? 'click' : 'tap', '.folder', _.debounce(function (e) {
                // use default behavior for arrow
                if ($(e.target).is('.folder-arrow, .fa')) return;
                // edit mode?
                if (app.props.get('mobileFolderSelectMode') === true) {
                    return tree.$dropdown.find('.dropdown-toggle').click();
                }
                // otherwise
                // default 'listView'
                app.pages.changePage(options.firstResponder);
                // callback for custom actions after pagechange
                if (options.respondCallback) options.respondCallback();
            }, 10));

            if (id) {
                // defer so that favorite folders are drawn already
                _.defer(tree.selection.preselect.bind(tree.selection, id));
            }

        } else {

            // add border & render tree and add to DOM
            sidepanel.addClass('border-right').append(tree.$el);

            if (id) {
                // defer so that favorite folders are drawn already
                _.defer(function () {
                    api.path(id).done(function (path) {
                        // get all ids except the folder itself, therefore slice(0, -1);
                        var ids = _(path).pluck('id').slice(0, -1);
                        tree.open = _(tree.open.concat(ids)).uniq();
                    })
                    .always(function () {
                        // try now
                        if (tree.selection.preselect(id)) {
                            tree.selection.scrollIntoView(id);
                            return;
                        }
                        // and on appear
                        tree.once('appear:' + id, function () {
                            tree.selection.preselect(id);
                            tree.selection.scrollIntoView(id);
                        });
                        // render now
                        tree.render();
                    });
                });
            } else {
                tree.render();
            }
        }

        // a11y adjustments
        tree.$('.tree-container').attr({
            'aria-label': gt('Folders')
        });

        // apply all options
        _(ext.point(POINT + '/options').all()).each(function (obj) {
            options = _.extend(obj, options || {});
        });

        // respond to folder change events

        (function folderChangeEvents() {

            var ignoreChangeEvent = false;

            tree.on('change', function (id) {
                ignoreChangeEvent = true;
                app.folder.set(id);
                ignoreChangeEvent = false;
            });

            app.on('folder:change', function (id) {
                if (ignoreChangeEvent) return;
                tree.selection.set(id);
            });

        }());

        // respond to folder removal
        api.on('remove:prepare', function (e, data) {
            // select parent or default folder
            var id = data.folder_id === '1' ? api.getDefaultFolder(data.module) || '1' : data.folder_id;
            tree.selection.set(id);
        });

        // respond to folder move
        api.on('move', function (e, id, newId) {
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
