/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 * @author Edy Haryono <edy.haryono@open-xchange.com>
 */
define('io.ox/presenter/views/sidebarview', [
    'io.ox/backbone/disposable',
    'io.ox/presenter/views/sidebar/participantsview',
    'io.ox/presenter/views/sidebar/slidepeekview'
], function (DisposableView, ParticipantsView, SlidePeekView) {

    'use strict';

    /**
     * The SidebarView is responsible for displaying additional information
     * for the presenter.
     * This includes sections for the listeners and the next slide.
     * Triggers 'presenter:sidebar:change:state' event when the sidebar opens / closes.
     */
    var SidebarView = DisposableView.extend({

        className: 'presenter-sidebar',

        attributes: { tabindex: -1, role: 'tablist' },

        // the visible state of the side bar, hidden per default.
        opened: false,

        initialize: function (options) {
            _.extend(this, options);

            this.listenTo(this.presenterEvents, 'presenter:presentation:start', this.onPresentationStart);
            this.listenTo(this.presenterEvents, 'presenter:presentation:end', this.onPresentationEnd);
            this.listenTo(this.presenterEvents, 'presenter:presentation:pause', this.onPresentationPause);
            this.listenTo(this.presenterEvents, 'presenter:presentation:continue', this.onPresentationContinue);
            this.listenTo(this.presenterEvents, 'presenter:local:slide:change', this.renderSections);

            this.on('dispose', this.disposeView.bind(this));
        },

        /**
         * Presentation start handler.
         * - renders the next slide peek view for the presenter.
         */
        onPresentationStart: function () {
            var rtModel = this.app.rtModel,
                userId = this.app.rtConnection.getRTUuid();
            if (!rtModel.isPresenter(userId)) {
                return;
            }
            this.$el.addClass('presenting');
            this.toggleSidebar(true);
        },

        /**
         * Presentation end handler.
         * - closes the next slide peek for the presenter.
         */
        onPresentationEnd: function () {
            this.$el.removeClass('presenting');
            this.toggleSidebar(false);
        },

        /**
         * Handles presentation pause invoked by the real-time framework.
         */
        onPresentationPause: function () {
            console.info('Presenter - sidebarview - pause');
            var rtModel = this.app.rtModel,
                userId = this.app.rtConnection.getRTUuid();
            if (!rtModel.isPresenter(userId)) {
                return;
            }
            this.$el.removeClass('presenting');
            this.toggleSidebar(true);
        },

        /**
         * Handles presentation continue invoked by the real-time framework.
         */
        onPresentationContinue: function () {
            console.info('Presenter - sidebarview - continue');
            var rtModel = this.app.rtModel,
                userId = this.app.rtConnection.getRTUuid();
            if (!rtModel.isPresenter(userId)) {
                return;
            }
            this.$el.addClass('presenting');
            this.toggleSidebar(true);
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
            var prevState = this.opened;
            // determine current state if undefined
            this.opened = _.isUndefined(state) ? !this.opened : Boolean(state);
            this.$el.toggleClass('opened', this.opened);
            this.renderSections();
            if (prevState !== this.opened) {
                this.presenterEvents.trigger('presenter:sidebar:change:state', this.opened);
            }
        },

        /**
         * Renders the sections for file meta information, file description
         * and version history.
         */
        renderSections: function () {
            // remove previous sections
            this.$el.empty();

            // render sections only if side bar is open
            if (!this.opened) {
                return;
            }

            var sectionViewParams = { model: this.model, presenterEvents: this.presenterEvents, app: this.app },
                rtModel = this.app.rtModel,
                userId = this.app.rtConnection.getRTUuid();

            // show next slide peek if the current user is currently presenting, otherwise show the presentation participants
            if (rtModel.isPresenter(userId) && !rtModel.isPaused()) {
                var slidepeekView = new SlidePeekView(sectionViewParams);
                this.$el.append(slidepeekView.render().el);
            } else {
                var participantsView = new ParticipantsView(sectionViewParams);
                this.$el.append(participantsView.render().el);
            }
        },

        /**
         * Renders the sidebar container.
         *
         * @param {FilesAPI.Model} model.
         *  The initial model.
         */
        render: function () {
            // attach the touch handlers
            if (this.$el.enableTouch) {
                this.$el.enableTouch({ selector: null, horSwipeHandler: this.onHorizontalSwipe.bind(this) });
            }
            return this;
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
            if (distance > 0) {
                this.toggleSidebar();
            }
        },

        /**
         * Destructor function of this view.
         */
        disposeView: function () {
            if (this.$el.disableTouch) {
                this.$el.disableTouch();
            }
            this.model = null;
        }
    });

    return SidebarView;
});
