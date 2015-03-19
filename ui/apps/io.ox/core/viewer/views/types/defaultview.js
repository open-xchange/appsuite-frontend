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
    /**
     * Default file type for OX Viewer. Displays a generic file icon
     * and the file name. This type acts as a fallback in cases if the
     * current file is not supported by OX Viewer.
     *
     * Implements the ViewerType interface.
     *
     * interface ViewerType {
     *    function render({model: model, modelIndex: modelIndex});
     *    function load();
     *    function unload();
     * }
     *
     */
    var DefaultView = BaseView.extend({

        initialize: function () {
            //console.warn('DefaultView.initialize()');
        },

        /**
         * Creates and renders a Default slide.
         *
         * @param {Object} data
         *  @param {Object} data.model
         *      An OX Viewer Model object.
         *  @param {Number} data.modelIndex
         *      Index of the model object in the collection.
         *
         * @returns {DefaultView}
         *  the DefaultView instance.
         */
        render: function (data) {
            //console.warn('DefaultView.render()');

            var slidesCount = this.collection.length,
                modelIndex = data && data.modelIndex || 0,
                notification = this.createNotificationNode(this.model, gt('Sorry, there is no preview available for this file.')),
                caption = this.createCaption(modelIndex, slidesCount);

            // remove content of the slide duplicates
            if (this.$el.hasClass('swiper-slide-duplicate')) {
                this.$el.empty();
            }

            this.$el.append(notification, caption);
            return this;
        },

        /**
         * "Loads" a default slide.
         *
         * @returns {DefaultView}
         *  the DefaultView instance.
         */
        load: function () {
            //console.warn('DefaultView.load()');
            return this;
        },

        /**
         * Unloads a default slide.
         *
         * @returns {DefaultView}
         *  the DefaultView instance.
         */
        unload: function () {
            //console.warn('DefaultView.unload()');
            return this;
        }

    });

    // returns an object which inherits BaseView
    return DefaultView;
});
