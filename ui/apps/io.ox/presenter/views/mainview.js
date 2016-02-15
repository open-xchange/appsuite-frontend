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
    'io.ox/core/extensions',
    'io.ox/core/tk/sessionrestore',
    'io.ox/presenter/views/presentationview',
    'io.ox/presenter/views/sidebarview',
    'io.ox/presenter/views/toolbarview',
    'io.ox/presenter/views/thumbnailview',
    'io.ox/presenter/views/notification',
    'static/3rd.party/bigscreen/bigscreen.min.js',
    'io.ox/core/tk/nodetouch'
], function (DisposableView, Ext, SessionRestore, PresentationView, SidebarView, ToolbarView, ThumbnailView, Notification, BigScreen) {

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
            this.thumbnailView = new ThumbnailView(childViewParams);
            // remember the sidebar open state for fullscreen
            this.sidebarBeforeFullscreen = null;

            // handle DOM events
            $(window).on('resize.presenter', this.onWindowResize.bind(this));

            // clean stuff on dispose event from core/commons.js
            this.on('dispose', this.disposeView.bind(this));

            // listen to sidebar toggle events
            this.listenTo(this.presenterEvents, 'presenter:toggle:sidebar', this.onToggleSidebar);
            this.listenTo(this.presenterEvents, 'presenter:sidebar:change:state', this.onSideBarToggled);
            // listen to presentation start, end events
            this.listenTo(this.presenterEvents, 'presenter:presentation:start', this.onPresentationStart);
            this.listenTo(this.presenterEvents, 'presenter:presentation:end', this.onPresentationEnd);
            // listen to presenter close evemts
            this.listenTo(this.presenterEvents, 'presenter:close', this.closePresenter);

            // show navigation panel on user activity
            this.$el.on('mousemove', _.throttle(this.onMouseMove.bind(this), 500));

            // listen to RTModel updates
            //this.listenTo(this.app.rtModel, 'change:presenterId change:activeSlide change:paused change:participants', this.onRTModelUpdate);
            this.listenTo(this.app.rtModel, 'change', this.onRTModelUpdate);

            // listen to local model updates
            this.listenTo(this.app.localModel, 'change', this.onLocalModelUpdate);
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
                this.presentationView.render().el,
                this.thumbnailView.render().el
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
            var currentPresenterId,
                previousPresenterId,
                localSlideId = this.getActiveSlideIndex(),
                remoteSlideId = rtModel.get('activeSlide');

            if (rtModel.hasChanged('activeSlide') || (localSlideId !== remoteSlideId)) {
                this.presenterEvents.trigger('presenter:remote:slide:change', remoteSlideId);
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
                    this.presenterEvents.trigger('presenter:presentation:end', { presenterId: previousPresenterId, presenterName: rtModel.previous('presenterName') });
                }
            }
            if (rtModel.hasChanged('paused')) {
                // compare current with previous presentation pause state
                var eventType = (rtModel.get('paused') && !rtModel.previous('paused')) ? 'presenter:presentation:pause' : 'presenter:presentation:continue';
                this.presenterEvents.trigger(eventType);
            }

            // always focus in navigation for keyboard stuff
            this.presentationView.focusActiveSlide();
        },

        /**
         * Handles local model data changes.
         *
         * @param {LocalModel} localModel
         *  The local model instance.
         */
        onLocalModelUpdate: function (localModel) {
            if (localModel.hasChanged('presenterId')) {
                // compare current with previous presenter id
                var currentPresenterId = localModel.get('presenterId');
                var previousPresenterId = localModel.previous('presenterId');

                if (!_.isEmpty(currentPresenterId) && _.isEmpty(previousPresenterId)) {
                    this.presenterEvents.trigger('presenter:presentation:start', { presenterId: currentPresenterId, presenterName: localModel.get('presenterName') });

                } else if (_.isEmpty(currentPresenterId) && !_.isEmpty(previousPresenterId)) {
                    this.presenterEvents.trigger('presenter:presentation:end', { presenterId: previousPresenterId, presenterName: localModel.previous('presenterName') });
                }
            }
            if (localModel.hasChanged('paused')) {
                // compare current with previous presentation pause state
                var eventType = (localModel.get('paused') && !localModel.previous('paused')) ? 'presenter:presentation:pause' : 'presenter:presentation:continue';
                this.presenterEvents.trigger(eventType);
            }

            // always focus in navigation for keyboard stuff
            this.presentationView.focusActiveSlide();
        },

        /**
         * Handles remote presentation start invoked by the real-time framework.
         */
        onPresentationStart: function () {
            var rtModel = this.app.rtModel;
            var localModel = this.app.localModel;
            var userId = this.app.rtConnection.getRTUuid();

            if (rtModel.isPresenter(userId)) {
                // store presenter state and slide id to restore presentation on browser reload
                SessionRestore.state('presenter~' + this.model.get('id'), { isPresenter: true, slideId: this.getActiveSlideIndex() });
            }

            if (!localModel.isPresenter(userId)) {
                // show presentation start notification to all participants in case of a remote presentation.
                var baton = Ext.Baton({ context: this, model: this.model, data: this.model.toJSON() });
                Notification.notifyPresentationStart(this.app.rtModel, this.app.rtConnection, baton);
            }
        },

        /**
         * Handles remote presentation end invoked by the real-time framework.
         *  Note: since the event is not a key, click or touch event,
         *  leaving full screen may not work on all browsers.
         *
         * @param {Object} formerPresenter
         *  @param {String} presenter.presenterId
         *   the user id of the former presenter
         *  @param {String} presenter.presenterName
         *   the display name of the former presenter
         */
        onPresentationEnd: function (formerPresenter) {
            var rtModel = this.app.rtModel;
            var localModel = this.app.localModel;
            var userId = this.app.rtConnection.getRTUuid();

            function wasParticipant(userId) {
                return !rtModel.wasPresenter(userId) && _.some(rtModel.previous('participants'), function (user) {
                    return (userId === user.userId);
                }, this);
            }

            // handle end of a remote / local presentation
            if (rtModel.wasPresenter(formerPresenter.presenterId)) {

                // show presentation end notification to all participants that joined the remote presentation.
                if (wasParticipant(userId)) {
                    Notification.notifyPresentationEnd(this.app.rtModel, this.app.rtConnection);
                }

                // leave full screen mode
                this.toggleFullscreen(false);

                // remove presenter id from session store
                SessionRestore.state('presenter~' + this.model.get('id'), null);

            } else if (localModel.wasPresenter(formerPresenter.presenterId)) {
                this.toggleFullscreen(false);
            }
        },

        /**
         * Handle OX Presenter keyboard events
         */
        onKeydown: function (event) {
            event.stopPropagation();

            var self = this;
            var rtModel = this.app.rtModel;
            var localModel = this.app.localModel;
            var rtConnection = this.app.rtConnection;
            var userId = rtConnection.getRTUuid();

            function togglePause() {
                if (rtModel.canPause(userId)) {
                    rtConnection.pausePresentation();
                    self.toggleFullscreen(false);
                } else if (localModel.canPause(userId)) {
                    localModel.pausePresentation(userId);
                } else if (rtModel.canContinue(userId)) {
                    rtConnection.continuePresentation();
                } else if (localModel.canContinue(userId)) {
                    localModel.continuePresentation(userId);
                }
            }

            function endOrLeavePresentation() {
                if (rtModel.isPresenter(userId)) {
                    rtConnection.endPresentation();
                } else if (localModel.isPresenter(userId)) {
                    localModel.endPresentation(userId);
                } else if (rtModel.canLeave(userId)) {
                    rtConnection.leavePresentation();
                }
            }

            function startOrJoinPresentation() {
                if (rtModel.canStart(userId)) {
                    var slideId = self.getActiveSlideIndex();
                    rtConnection.startPresentation({ activeSlide: slideId });
                } else if (rtModel.canJoin(userId)) {
                    self.joinPresentation();
                }
            }

            switch (event.which || event.keyCode) {

                case 37: // left arrow : show previous slide
                case 38: // up arrow : show previous slide
                case 33: // page up : show previous slide
                    this.showPreviousSlide();
                    break;

                case 39: // right arrow : show next slide
                case 40: // down arrow : show next slide
                case 34: // page down : show next slide
                    this.showNextSlide();
                    break;

                case 8: // ctrl + backspace : ends or leaves the presentation. backspace : show previous slide
                    if (event.ctrlKey) {
                        endOrLeavePresentation();
                    } else {
                        event.preventDefault();
                        this.showPreviousSlide();
                    }
                    break;

                case 13: // ctrl + enter :  starts or joins a presentation.
                    if (event.ctrlKey) {
                        startOrJoinPresentation();
                    } else { // enter: show next slide
                        this.showNextSlide();
                    }
                    break;

                case 36: // home : show first slide
                    this.showFirstSlide();
                    break;

                case 35: // end : show last slide
                    this.showLastSlide();
                    break;

                case 190: // period : pause / continue presentation
                case 188: // comma : pause / continue presentation
                    togglePause();
                    break;

                case 70: // ctrl + shift + f : go into fullscreen for presenters
                    if (event.ctrlKey && event.shiftKey && rtModel.isPresenter(userId)) {
                        this.toggleFullscreen();
                    }
                    break;
                // no default
            }
        },

        /**
         * Handles mouse move events.
         * Show navigation panel if mouse location is in the lower part of the window.
         */
        onMouseMove: (function () {
            var x = 0, y = 0;
            return function (event) {
                if (!this.$el) { return; }

                var //max bottom postion relative to the document
                    // since height of the main view will be null in full screen mode, we need to take height and offset from the presentation view
                    maxY = this.presentationView.$el.height() + this.presentationView.$el.offset().top,
                    // the lower 10% or the last 40 pixel of the window
                    showY = Math.min((maxY * 0.90), (maxY - 40));

                // for Chrome's bug: it fires mousemove events without mouse movements
                if (event && event.type === 'mousemove') {
                    if (event.clientX === x && event.clientY === y) {
                        return;
                    }
                    x = event.clientX;
                    y = event.clientY;
                }

                // show navigation panel when mouse is inside the lower 10% or the last 40 pixel of the window
                //console.info('ON MOUSE MOVE', event.type, 'x:', x, 'y:', y, (y > showY) ? 'SHOW' : 'HIDE', showY);
                if (y > showY) {
                    this.presentationView.showNavigation();
                } else {
                    this.presentationView.hideNavigation();
                }
            };
        })(),

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

            this.thumbnailView.$el.css({ width: window.innerWidth - rightOffset });

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
            if (BigScreen.enabled && _.device('!iOS')) {

                if (_.isUndefined(state)) {
                    BigScreen.toggle(
                        this.presentationView.el,
                        this.onEnterFullscreen.bind(this),
                        this.onExitFullscreen.bind(this),
                        this.onErrorFullscreen.bind(this)
                    );
                } else if (state) {
                    BigScreen.request(
                        this.presentationView.el,
                        this.onEnterFullscreen.bind(this),
                        this.onExitFullscreen.bind(this),
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
            this.fullscreen = true;
            this.sidebarBeforeFullscreen = this.sidebarView.opened;
            this.sidebarView.toggleSidebar(false);
            this.presenterEvents.trigger('presenter:fullscreen:enter');
        },

        /**
         * Handle main view leaving full screen mode
         */
        onExitFullscreen: function () {
            this.fullscreen = false;
            this.sidebarView.toggleSidebar(this.sidebarBeforeFullscreen);
            this.presenterEvents.trigger('presenter:fullscreen:exit');
        },

        /**
         * Handle main view full screen toggle errors
         */
        onErrorFullscreen: function (foo) {
            console.info('Presenter - error toggle fullscreen, reason:', foo);
        },

        /**
         * Returns the active slide index.
         *
         * @returns {Number}
         *  the active slide index.
         */
        getActiveSlideIndex: function () {
            return this.presentationView.getActiveSlideIndex();
        },

        /**
         * Returns the slide count.
         *
         * @returns {Number}
         *  the slide count.
         */
        getSlideCount: function () {
            return this.presentationView.getSlideCount();
        },

        /**
         * Show the slide with the given index, but only if the user is presenter or has not joined the presentation.
         *
         * @param {Number} index
         *  the index of the slide to be shown.
         */
        showSlide: function (index) {
            this.presentationView.showSlide(index);
        },

        /**
         * Show the next slide, but only if the user is presenter or has not joined the presentation.
         */
        showNextSlide: function () {
            this.presentationView.showNextSlide();
            this.presentationView.focusActiveSlide();
        },

        /**
         * Show the previous slide, but only if the user is presenter or has not joined the presentation.
         */
        showPreviousSlide: function () {
            this.presentationView.showPreviousSlide();
            this.presentationView.focusActiveSlide();
        },

        /**
         * Show the first slide, but only if the user is presenter or has not joined the presentation.
         */
        showFirstSlide: function () {
            this.showSlide(0);
            this.presentationView.focusActiveSlide();
        },

        /**
         * Show the last slide, but only if the user is presenter or has not joined the presentation.
         */
        showLastSlide: function () {
            var slideCount = this.getSlideCount();

            if (slideCount > 0) {
                this.showSlide(slideCount - 1);
            }

            this.presentationView.focusActiveSlide();
        },

        /**
         * Tries to join the presentation. Shows an error alert on failure.
         */
        joinPresentation: function () {

            // full-screen mode MUST be started synchronously (security)
            this.toggleFullscreen(true);

            // try to join the presentation (may fail due to participants limit)
            var promise = this.app.rtConnection.joinPresentation();

            // handle failed attempt to join the presentation
            promise.fail(function (error) {

                // ugly, but no better solution: leave full-screen mode started above
                this.toggleFullscreen(false);

                // show an alert box for known errors
                if (_.isObject(error) && (error.error === 'PRESENTER_MAX_PARTICIPANTS_FOR_PRESENTATION_REACHED_ERROR')) {
                    Notification.notifyMaxParticipantsReached(this.app.rtModel.get('presenterName'));
                }
            }.bind(this));

            return promise;
        },

        /**
         * Presenter close handler.
         */
        closePresenter: function () {
            this.app.quit();
        },

        /**
         * Destructor function of the MainView.
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
