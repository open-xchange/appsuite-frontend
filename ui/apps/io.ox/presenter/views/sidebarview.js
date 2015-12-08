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

            this.listenTo(this.presenterEvents, 'presenter:presentation:start', this.onPresentationStartEnd);
            this.listenTo(this.presenterEvents, 'presenter:presentation:end', this.onPresentationStartEnd);
            this.listenTo(this.presenterEvents, 'presenter:presentation:pause', this.onPresentationPauseContinue);
            this.listenTo(this.presenterEvents, 'presenter:presentation:continue', this.onPresentationPauseContinue);
            this.listenTo(this.presenterEvents, 'presenter:local:slide:change', this.renderSections);

            this.on('dispose', this.disposeView.bind(this));
        },

        /**
         * Presentation start/end handler.
         * - renders or hides the next slide peek view for the presenter.
         */
        onPresentationStartEnd: function (presenter) {
            var rtModel = this.app.rtModel;
            var userId = this.app.rtConnection.getRTUuid();

            // check if user currently is, or was the presenter
            if (presenter && presenter.presenterId === userId) {
                this.toggleSidebar(rtModel.isPresenting(userId));
            }
        },

        /**
         * Handles presentation paused state invoked by the real-time framework.
         * - renders or hides the next slide peek view for the presenter.
         */
        onPresentationPauseContinue: function () {
            var rtModel = this.app.rtModel;
            var userId = this.app.rtConnection.getRTUuid();

            if (rtModel.isPresenter(userId)) {
                this.toggleSidebar(true);
            }
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
         * Renders the sections for participants and slide peek.
         */
        renderSections: function () {
            var rtModel = this.app.rtModel;
            var userId = this.app.rtConnection.getRTUuid();
            var isPresenting = rtModel.isPresenting(userId);

            // remove previous sections
            this.$el.empty();
            // handle the next slide peek view class for the presenter
            this.$el.toggleClass('presenting', isPresenting);

            // render sections only if side bar is open
            if (!this.opened) {
                return;
            }

            var sectionViewParams = { model: this.model, presenterEvents: this.presenterEvents, app: this.app };
            // show next slide peek if the current user is currently presenting, otherwise show the presentation participants
            if (isPresenting) {
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
