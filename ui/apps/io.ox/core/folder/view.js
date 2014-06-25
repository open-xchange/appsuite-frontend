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
     // 'io.ox/core/extPatterns/links',
     // 'io.ox/core/notifications',
     // 'io.ox/core/api/folder',
     // 'settings!io.ox/core'
     // 'io.ox/core/capabilities',
     'gettext!io.ox/core'
    ], function (ext, gt) {

    'use strict';

    function initialize(app, options) {

        var POINT = app.get('name') + '/folderview',
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
            app.settings.set('folderview/width/' + _.display(), width).save();
        }

        function getWidth() {
            return app.settings.get('folderview/width/' + _.display(), 250);
        }

        function applyWidth(x) {
            nodes.body.css('left', x + 'px');
            nodes.sidepanel.css('width', x + 'px');
        }

        function applyInitialWidth() {
            applyWidth(getWidth());
        }

        function resetLeftPosition() {
            var win = app.getWindow(),
                chromeless = win.options.chromeless,
                tooSmall = $(document).width() <= 700;
            nodes.body.css('left', chromeless || tooSmall ? 0 : 50);
        }

        //
        // Add API
        //

        app.folderView = {

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
                    width = 0;

                function mousemove(e) {
                    var x = e.pageX;
                    if (x > maxSidePanelWidth || x < minSidePanelWidth) return;
                    app.trigger('folderview:resize');
                    applyWidth(width = x);
                }

                function mouseup(e) {
                    $(this).off('mousemove.resize mouseup.resize');
                    // auto-close?
                    if (e.pageX < minSidePanelWidth) app.folderView.hide();
                    else storeWidth(width || 250);
                }

                return {

                    enable: function () {
                        sidepanel.append(
                            bar = $('<div class="resizebar">').on('mousedown', function (e) {
                                e.preventDefault();
                                maxSidePanelWidth = $(document).width() / 2;
                                $(document).on({
                                    'mousemove.resize': mousemove,
                                    'mouseup.resize': mouseup
                                });
                            })
                        );
                    }
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
            if (!hiddenByWindowResize && visible && width <= 700) {
                app.folderView.hide();
                hiddenByWindowResize = true;
            } else if (hiddenByWindowResize && width > 700) {
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

        //
        // Initialize
        //

        // add border
        app.getWindow().nodes.sidepanel.addClass('border-right');

        // work with old non-device specific setting (<= 7.2.2) and new device-specific approach (>= 7.4)
        if (open && open[_.display()]) open = open[_.display()];
        open = _.isArray(open) ? open : [];

        // apply all options
        _(ext.point(POINT + '/options').all()).each(function (obj) {
            options = _.extend(obj, options || {});
        });

        // show
        if (options.visible) app.folderView.show();
    }

    return {
        initialize: initialize
    };
});
