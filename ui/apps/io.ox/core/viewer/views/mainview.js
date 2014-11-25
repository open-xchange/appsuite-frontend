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
define('io.ox/core/viewer/views/mainview', [
    'io.ox/core/viewer/views/toolbarview',
    'io.ox/core/viewer/views/displayerview',
    'io.ox/core/viewer/views/sidebarview',
    'less!io.ox/core/viewer/style'
], function (ToolbarView, DisplayerView, SidebarView) {

    'use strict';

    /**
     * The MainViewer is the base view for the OX Viewer.
     * This view imports, manage and  renders these children views:
     * - ToolbarView
     * - DisplayerView
     * - SidebarView
     */
    var MainView = Backbone.View.extend({

        className: 'io-ox-viewer abs',

        events: {
            'click': 'onClick'
        },

        onClick: function () {
            //console.info('MainView.onClick()');
        },

        initialize: function () {
            //console.info('MainView.initialize()');
            this.toolbarView = new ToolbarView({ parent: this });
            this.displayerView = new DisplayerView({ parent: this });
            this.sidebarView = new SidebarView({ parent: this });
            this.displayedFileIndex = 0;
            this.render();
        },

        render: function () {
            //console.info('MainView.render()');
            // append children views
            var viewer = this.$el;
            viewer.append(this.toolbarView.render().el)
                .append(this.displayerView.render().el)
                .append(this.sidebarView.render().el);
            return this;
        }
    });
    return MainView;
});
