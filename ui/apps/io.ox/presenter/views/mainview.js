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
define('io.ox/presenter/views/mainview', [
    'io.ox/backbone/disposable',
    'io.ox/presenter/views/presentationview',
    'io.ox/presenter/views/sidebarview',
    'io.ox/presenter/views/toolbarview'
], function (DisposableView, PresentationView, SidebarView, ToolbarView) {

    'use strict';

    /**
     * The main view is the base view for the OX Presenter.
     * This view imports, manages and  renders these children views:
     * - PresentationView
     */
    var MainView = DisposableView.extend({

        className: 'io-ox-presenter abs',

        attributes: { tabindex: -1 },

        events: {
            'keydown': 'onKeydown'
        },

        // the full screen state of the main view, off by default.
        fullscreen: false,

        initialize: function (options) {

            _.extend(this, options);

            // create the event dispatcher
            this.presenterEvents = _.extend({}, Backbone.Events);
            // create child view(s)
            var childViewParams = { model: this.model, presenterEvents: this.presenterEvents, app: this.app };
            this.presentationView = new PresentationView(childViewParams);
            this.sidebarView = new SidebarView(childViewParams);
            this.toolbarView = new ToolbarView(childViewParams);

            // handle DOM events
            $(window).on('resize.presenter', this.onWindowResize.bind(this));

            // clean stuff on dispose event from core/commons.js
            this.on('dispose', this.disposeView.bind(this));

            // listen to sidebar toggle events
            this.listenTo(this.presenterEvents, 'presenter:toggle:sidebar', this.onToggleSidebar);
            this.listenTo(this.presenterEvents, 'presenter:sidebar:change:state', this.onSideBarToggled);

            // listen to RTModel updates
            //this.listenTo(this.app.rtModel, 'change:presenterId change:activeSlide change:paused change:participants', this.onRTModelUpdate);
            this.listenTo(this.app.rtModel, 'change', this.onRTModelUpdate);
        },

        /**
         * Renders the MainView.
         *
         * @returns {MainView}
         */
        render: function () {
            var state = false;   // TODO: set according to user role (presenter, listener)

            // append toolbar view
            this.$el.append(
                this.toolbarView.render().el,
                this.sidebarView.render().el,
                this.presentationView.render().el
            );

            // set initial sidebar state
            this.sidebarView.toggleSidebar(state);

            return this;
        },

        /**
         * Handles real-time model data changes that are triggered by
         * real-time update messages.
         *
         * @param {RTModel} rtModel
         *  The real-time model instance.
         */
        onRTModelUpdate: function (rtModel) {
            console.info('Presenter - MainView - onRTUpdatertData - RTModel - change', rtModel);

            var currentPresenterId, previousPresenterId;

            if (rtModel.hasChanged('activeSlide')) {
                this.presenterEvents.trigger('presenter:slide:change', rtModel.get('activeSlide'));
            }
            if (rtModel.hasChanged('participants')) {
                this.presenterEvents.trigger('presenter:participants:change', rtModel.get('participants'));
            }
            if (rtModel.hasChanged('presenterId')) {
                // compare current with previous presenter id
                currentPresenterId = rtModel.get('presenterId');
                previousPresenterId = rtModel.previous('presenterId');

                if (!_.isEmpty(currentPresenterId) && _.isEmpty(previousPresenterId)) {
                    this.presenterEvents.trigger('presenter:presentation:start', { presenterId: currentPresenterId, presenterName: rtModel.get('presenterName') });

                } else if (_.isEmpty(currentPresenterId) && !_.isEmpty(previousPresenterId)) {
                    this.presenterEvents.trigger('presenter:presentation:end', { presenterId: currentPresenterId, presenterName: rtModel.get('presenterName') });

                } else {
                    //
                    // TODO: check if this case is really needed / possible
                    //
                    this.presenterEvents.trigger('presenter:presenter:changed', { presenterId: currentPresenterId, presenterName: rtModel.get('presenterName') });
                }
            }
            if (rtModel.hasChanged('paused')) {
                // compare current with previous presentation pause state
                var eventType = (rtModel.get('paused') && !rtModel.previous('paused')) ? 'presenter:presentation:pause' : 'presenter:presentation:continue';
                this.presenterEvents.trigger(eventType);
            }
        },

        /**
         * Handle OX Presenter keyboard events
         */
        onKeydown: function (event) {
            //event.stopPropagation();

            // TODO: check if we need to handle TAB traversal ourselves.
            // manual TAB traversal handler. 'Traps' TAB traversal inside the viewer root component.
            function tabHandler(event) {
                var tabableActions = this.$el.find('[tabindex]:not([tabindex^="-"]):visible'),
                    tabableActionsCount = tabableActions.length;
                // quit immediately if no tabable actions are found
                if (tabableActionsCount === 0) { return; }
                var focusedElementIndex = tabableActions.index(document.activeElement),
                    traversalStep = event.shiftKey ? -1 : 1,
                    nextElementIndex = focusedElementIndex + traversalStep;
                // prevent default TAB traversal
                event.preventDefault();
                // traverse to prev/next action
                if (nextElementIndex >= tabableActionsCount) {
                    nextElementIndex = 0;
                }
                // focus next action candidate
                tabableActions.eq(nextElementIndex).focus();
            }

            console.info('event type: ', event.type, 'keyCode: ', event.keyCode, 'charCode: ', event.charCode);

            switch (event.which || event.keyCode) {
                case 9: // TAB key
                    // TODO: check if we need to handle TAB traversal ourselves.
                    if (false /*activate for manual tab traversal*/) {
                        event.stopPropagation();
                        tabHandler(event);
                    }
                    break;
                case 37: // left arrow
                    event.stopPropagation();
                    this.presentationView.swiper.slidePrev();
                    //this.presentationView.focusActiveSlide();
                    break;
                case 39: // right arrow
                    event.stopPropagation();
                    this.presentationView.swiper.slideNext();
                    //this.presentationView.focusActiveSlide();
                    break;
                // TODO: clarify which keyboard events to support
                case 107: // plus key
                    event.stopPropagation();
                    this.presentationView.changeZoomLevel('increase');
                    break;
                case 109: // minus key
                    event.stopPropagation();
                    this.presentationView.changeZoomLevel('decrease');
                    break;
                case 70: // F key
                    event.stopPropagation();
                    this.toggleFullscreen();
                    break;
            }
        },

        // toggle sidebar after the sidebar button is clicked
        onToggleSidebar: function () {
            //console.info('Presenter.mainView.onToggleSidebar()');
            this.sidebarView.toggleSidebar();
        },

        /**
         * Handle side-bar toggle
         */
        onSideBarToggled: function (/*state*/) {
            //console.info('Presenter.mainView.onSidebarToggled()');
            this.onWindowResize();
        },

        /**
         * Handle browser window resize.
         * Recalculate view dimensions after e.g. window resize events
         */
        onWindowResize: function () {
            //console.info('Presenter - mainview - onWindowResize()');

            var rightOffset = this.sidebarView.opened ? this.sidebarView.$el.outerWidth() : 0;

            this.presentationView.$el.css({ width: window.innerWidth - rightOffset });

            this.presenterEvents.trigger('presenter:resize');
        },

        /**
         * Toggles full screen mode of the main view depending on the given state.
         *  A state of 'true' starts full screen mode, 'false' exits the full screen mode and
         *  'undefined' toggles the full screen state.
         *
         * You can only call this from a user-initiated event (click, key, or touch event),
         * otherwise the browser will deny the request.
         */
        toggleFullscreen: function (state) {
            if (BigScreen.enabled) {

                if (_.isUndefined(state)) {
                    BigScreen.toggle(
                        this.el,
                        this.onEnterFullscreen.bind(this),
                        this.onEnterFullscreen.bind(this),
                        this.onErrorFullscreen.bind(this)
                    );
                } else if (state) {
                    BigScreen.request(
                        this.el,
                        this.onEnterFullscreen.bind(this),
                        this.onEnterFullscreen.bind(this),
                        this.onErrorFullscreen.bind(this)
                    );
                } else {
                    BigScreen.exit();
                }
            }
        },

        /**
         * Handle main view entering full screen mode
         */
        onEnterFullscreen: function () {
            //console.info('Presenter - mainview - onEnterFullscreen()');
            this.fullscreen = true;
        },

        /**
         * Handle main view leaving full screen mode
         */
        onExitFullscreen: function () {
            //console.info('Presenter - mainview - onExitFullscreen()');
            this.fullscreen = false;
        },

        /**
         * Handle main view full screen toggle errors
         */
        onErrorFullscreen: function (foo) {
            console.info('Presenter - mainview - onErrorFullscreen()', foo);
        },

        /**
         * Destructor function of the PresentationView.
         */
        disposeView: function () {
            //console.info('Presenter - dispose MainView');

            $(window).off('resize.presenter');
            this.presentationView.remove();
            this.sidebarView.remove();
            this.model.off().stopListening();
            this.presentationView = null;
            this.sidebarView = null;

        }
    });
    return MainView;
});
