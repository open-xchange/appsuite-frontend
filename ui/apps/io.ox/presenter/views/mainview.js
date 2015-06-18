/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/presenter/views/mainview', [
    'io.ox/backbone/disposable',
    'io.ox/presenter/views/presentationview',
    'io.ox/presenter/views/sidebarview',
    'io.ox/presenter/rtconnection'
], function (DisposableView, PresentationView, SidebarView, RTConnection) {

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

            // init RT connection
            this.rtConnection = new RTConnection(this.model.toJSON());
            this.rtConnectPromise = this.rtConnection.connect();
            function rtConnectSuccess(response) {
                console.warn('ConnectSuccess()', response);
            }
            function rtConnectError(response) {
                console.warn('ConnectError', response);
            }
            this.rtConnectPromise.then(rtConnectSuccess, rtConnectError);

            // create the event dispatcher
            this.presenterEvents = _.extend({}, Backbone.Events);
            // create child view(s)
            this.presentationView = new PresentationView({ model: this.model, presenterEvents: this.presenterEvents, rtConnection: this.rtConnection });
            this.sidebarView = new SidebarView({ model: this.model, presenterEvents: this.presenterEvents });

            // handle DOM events
            $(window).on('resize.presenter', this.onWindowResize.bind(this));

            // clean stuff on dispose event from core/commons.js
            this.on('dispose', this.disposeView.bind(this));

            this.listenTo(this.presenterEvents, 'presenter:sidebar:change:state', this.onSideBarToggled);


        },

        /**
         * Renders the MainView.
         *
         * @returns {MainView}
         */
        render: function () {
            //var state = true;   // TODO: set according to user role (presenter, listener)

            // append toolbar view
            this.$el.append(
                //this.sidebarView.render().el,
                this.presentationView.render().el
            );

            // set initial sidebar state
            //this.sidebarView.toggleSidebar(state);

            return this;
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

        /**
         * Handle side-bar toggle
         */
        onSideBarToggled: function (/*state*/) {
            this.onWindowResize();
        },

        /**
         * Handle browser window resize.
         * Recalculate view dimensions after e.g. window resize events
         */
        onWindowResize: function () {
            console.info('Presenter - mainview - onWindowResize()');

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
            console.info('Presenter - mainview - onEnterFullscreen()');
            this.fullscreen = true;
        },

        /**
         * Handle main view leaving full screen mode
         */
        onExitFullscreen: function () {
            console.info('Presenter - mainview - onExitFullscreen()');
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
            console.log('Presenter - dispose MainView');

            $(window).off('resize.presenter');
            this.presentationView.remove();
            this.sidebarView.remove();
            this.model.off().stopListening();
            this.presentationView = null;
            this.sidebarView = null;

            // TODO handle rtConnection destroy

            //this.rtConnection.closeDocument().always(function (response) {
            //    console.warn('closeDpocument()', response);
            //    this.rtConnection.destroy();
            //}.bind(this));

        }
    });
    return MainView;
});
