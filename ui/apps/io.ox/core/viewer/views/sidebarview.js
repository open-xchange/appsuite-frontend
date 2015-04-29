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
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/core/viewer/views/sidebarview', [
    'io.ox/core/extensions',
    'io.ox/backbone/disposable',
    'io.ox/core/viewer/eventdispatcher',
    'io.ox/core/viewer/util',
    'io.ox/files/api',
    'io.ox/core/viewer/views/sidebar/fileinfoview',
    'io.ox/core/viewer/views/sidebar/filedescriptionview',
    'io.ox/core/viewer/views/sidebar/fileversionsview',
    'io.ox/core/viewer/views/sidebar/uploadnewversionview'
], function (Ext, DisposableView, EventDispatcher, Util, FilesAPI, FileInfoView, FileDescriptionView, FileVersionsView, UploadNewVersionView) {

    'use strict';

    // define extension points for this SidebarView
    Ext.point('io.ox/core/viewer/sidebar').extend({
        attributes: {},
        classes: '',
        index: 200,
        id: 'sidebar'
    });

    /**
     * The SidebarView is responsible for displaying the detail side bar.
     * This includes sections for file meta information, file description
     * and version history.
     */
    var SidebarView = DisposableView.extend({

        className: 'viewer-sidebar',

        // the visible state of the side bar, hidden per default.
        opened: false,

        initialize: function () {
            //console.info('SidebarView.initialize()');
            this.model = null;

            this.on('dispose', this.disposeView.bind(this));

            this.listenTo(EventDispatcher, 'viewer:displayeditem:change', function (model) {
                //console.warn('SidebarbarView viewer:displayeditem:change', data);
                if (model) {
                    this.model = model;
                    this.renderSections();
                }
            });
        },

        /**
         * Toggles the side bar depending on the state.
         *  A state of 'true' opens the panel, 'false' closes the panel and
         *  'undefined' toggles the side bar.
         *
         * @param {Boolean} [state].
         *  The panel state.
         */
        toggleSidebar: function (state) {
            // determine current state if undefined
            this.opened = _.isUndefined(state) ? !this.opened : Boolean(state);
            this.$el.toggleClass('opened', this.opened);
            EventDispatcher.trigger('viewer:sidebar:change:state', this.opened);
            this.renderSections();
        },

        /**
         * Renders the sections for file meta information, file description
         * and version history.
         */
        renderSections: function () {
            //console.info('SidebarView.renderSections()', 'sidebar open', this.opened);
            // remove previous sections
            this.$el.empty();
            // render sections only if side bar is open
            if (!this.model || !this.opened) {
                return;
            }
            // load file details
            this.loadFileDetails();

            this.$el.append(
                new FileInfoView({ model: this.model }).render().el,
                new FileDescriptionView({ model: this.model }).render().el,
                new UploadNewVersionView({ model: this.model }).render().el,
                new FileVersionsView({ model: this.model }).render().el
            );
        },

        render: function (model) {
            //console.info('SidebarView.render()', data);
            // a11y
            this.$el.attr({ tabindex: -1, role: 'complementary' }); // TODO: check if we need to set role 'tablist' now instead
            // set device type
            Util.setDeviceClass(this.$el);
            // attach the touch handlers
            this.$el.enableTouch({ selector: null, horSwipeHandler: this.onHorizontalSwipe });
            // initially set model
            this.model = model;
            return this;
        },

        /**
         * Loads the file details, especially needed for the file description
         * and the number of versions.
         */
        loadFileDetails: function () {
            //console.info('SidebarView.loadFileDetails()');
            if (!this.model) {
                return;
            }

            FilesAPI.get(this.model.toJSON())
            .done(function (file) {
                //console.info('SidebarView.loadFileDetails()', 'done', file);
                // after loading the file details we set at least an empty string as description.
                // in order to distinguish between 'the file details have been loaded but the file has no description'
                // and 'the file details have not been loaded yet so we don't know if it has a description'.
                if (this.model && this.model.isFile()) {
                    var description = (file && _.isString(file.description)) ? file.description : '';
                    this.model.set('description', description);
                }
            }.bind(this));
        },

        /**
         * Handles horizontal swipe events.
         *
         * @param {String} phase
         *  The current swipe phase (swipeStrictMode is true, so we only get the 'end' phase)
         *
         * @param {jQuery.Event} event
         *  The jQuery tracking event.
         *
         * @param {Number} distance
         *  The swipe distance in pixel, the sign determines the swipe direction (left to right or right to left)
         *
         */
        onHorizontalSwipe: function (phase, event, distance) {
            //console.info('SidebarView.onHorizontalSwipe()', 'event phase:', phase, 'distance:', distance);

            if (distance > 0) {
                EventDispatcher.trigger('viewer:toggle:sidebar');
            }
        },

        /**
         * Destructor function of this view.
         */
        disposeView: function () {
            //console.info('SidebarView.disposeView()');
            this.$el.disableTouch();
            this.model = null;
        }
    });

    return SidebarView;
});
