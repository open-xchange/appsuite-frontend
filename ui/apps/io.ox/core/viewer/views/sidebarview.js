/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Edy Haryono <edy.haryono@open-xchange.com>
 */
define('io.ox/core/viewer/views/sidebarview', function () {

    'use strict';

    /**
     * The SidebarView is responsible for displaying the detail sidebar.
     * This view should show file meta information, versions, sharing/permissions
     * etc. This view should have children views (TBD)
     */
    var SidebarView = Backbone.View.extend({

        className: 'viewer-sidebar',

        events: {

        },

        initialize: function (options) {
            //console.info('SidebarView.initialize()');
            this.$el.on('dispose', this.dispose.bind(this));
            this.parent = options.parent;
            this.render();
        },

        render: function () {
            //console.info('SidebarView.render()');
            var sidebar = this.$el;
            sidebar.html('sidebar');
            return this;
        },

        dispose: function () {
            //console.info('SidebarView.dispose()');
            this.stopListening();
            return this;
        }
    });

    return SidebarView;
});
