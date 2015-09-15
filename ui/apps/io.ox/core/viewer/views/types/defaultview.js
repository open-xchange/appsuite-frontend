/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Edy Haryono <edy.haryono@open-xchange.com>
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/core/viewer/views/types/defaultview',  [
    'io.ox/core/viewer/views/types/baseview',
    'gettext!io.ox/core'
], function (BaseView, gt) {

    'use strict';

    /**
     * Default file type for OX Viewer. Displays a generic file icon
     * and the file name. This type acts as a fallback in cases if the
     * current file is not supported by OX Viewer.
     *
     * Implements the ViewerType interface.
     *
     * interface ViewerType {
     *    function render();
     *    function load();
     *    function unload();
     * }
     *
     */
    var DefaultView = BaseView.extend({

        initialize: function () {
            this.isPrefetched = false;
        },

        /**
         * Creates and renders the default slide.
         *
         * @returns {DefaultView}
         *  the DefaultView instance.
         */
        render: function () {

            this.$el.empty().append(
                this.createNotificationNode(gt('There is no preview for this file type'))
            );

            return this;
        },

        /**
         * "Prefetches" the default slide.
         *
         * @returns {DefaultView}
         *  the DefaultView instance.
         */
        prefetch: function () {
            this.isPrefetched = true;
            return this;
        },

        /**
         * "Shows" the default slide.
         *
         * @returns {DefaultView}
         *  the DefaultView instance.
         */
        show: function () {
            return this;
        },

        /**
         * "Unloads" the default slide.
         *
         * @returns {DefaultView}
         *  the DefaultView instance.
         */
        unload: function () {
            this.isPrefetched = false;
            return this;
        }

    });

    // returns an object which inherits BaseView
    return DefaultView;
});
