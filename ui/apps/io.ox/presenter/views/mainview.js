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
    'io.ox/core/notifications',
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/actions',
    'io.ox/core/tk/sessionrestore',
    'io.ox/presenter/views/presentationview',
    'io.ox/presenter/views/sidebarview',
    'io.ox/presenter/views/toolbarview',
    'io.ox/presenter/views/thumbnailview',
    'static/3rd.party/bigscreen/bigscreen.min.js',
    'gettext!io.ox/presenter',
    'io.ox/core/tk/nodetouch'
], function (DisposableView, Notifications, Ext, ActionsPattern, SessionRestore, PresentationView, SidebarView, ToolbarView, ThumbnailView, BigScreen, gt) {

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

            // show navigation panel on user activity
            this.$el.on('mousemove', _.throttle(this.onMouseMove.bind(this), 500));

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
            console.info('Presenter - MainView - onRTUpdatertData - RTModel - change', rtModel);

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

            //always focus in navigation for keyboard stuff
            this.presentationView.focusActiveSlide();
        },

        /**
         * Handles remote presentation start invoked by the real-time framework.
         */
        onPresentationStart: function () {
            var rtModel = this.app.rtModel,
                userId = this.app.rtConnection.getRTUuid();

            if (rtModel.isPresenter(userId)) {
                // store presenter state and slide id to restore presentation on browser reload
                SessionRestore.state('presenter~' + this.model.get('id'), { isPresenter: true, slideId: this.getActiveSlideIndex() });
            }

            // show presentation start notification to all participants.
            this.notifyPresentationStart();
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
            var rtModel = this.app.rtModel,
                userId = this.app.rtConnection.getRTUuid();

            // leave full screen mode for all participants.
            if (!rtModel.hasPresenter() && (userId !== formerPresenter.presenterId)) {
                this.toggleFullscreen(false);
            }
            // remove presenter id from session store
            SessionRestore.state('presenter~' + this.model.get('id'), null);
            // show presentation end notification to all participants.
            this.notifyPresentationEnd();
        },

        /**
         * Handle OX Presenter keyboard events
         */
        onKeydown: function (event) {
            event.stopPropagation();

            var self = this,
                rtModel = this.app.rtModel,
                rtConnection = this.app.rtConnection,
                userId = rtConnection.getRTUuid();

            function togglePause() {
                if (rtModel.canPause(userId)) {
                    rtConnection.pausePresentation();
                    self.toggleFullscreen(false);
                } else if (rtModel.canContinue(userId)) {
                    rtConnection.continuePresentation();
                }
            }

            function endOrLeavePresentation () {
                if (rtModel.isPresenter(userId)) {
                    rtConnection.endPresentation();
                } else if (rtModel.canLeave(userId)) {
                    rtConnection.leavePresentation();
                }
            }

            function startOrJoinPresentation () {
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
         * Shows an alert banner.
         *
         * @param {Object} yellOptions
         *  The settings for the alert banner:
         *  @param {String} [yellOptions.type='info']
         *      The type of the alert banner. Supported types are 'success',
         *      'info', 'warning', and 'error'.
         *  @param {String} [yellOptions.headline]
         *      An optional headline shown above the message text.
         *  @param {String} yellOptions.message
         *      The message text shown in the alert banner.
         *  @param {Number} [yellOptions.duration]
         *      The time to show the alert banner, in milliseconds; or -1 to
         *      show a permanent alert.
         *  @param {Object} [yellOptions.action]
         *      An arbitrary action button that will be shown below the
         *      message text, with the following properties:
         *      @param {String} yellOptions.action.label
         *          The display text for the button.
         *      @param {String} yellOptions.action.ref
         *          The action reference id.
         *      @param {Baton} [yellOptions.action.baton=null]
         *          The baton to hand over to the action.
         */
        showNotification: function (yellOptions) {
            var // the notification DOM element
                yellNode = null;

            function onNotificationAppear() {
                // add action button to the message
                var // the button label
                    label = yellOptions.action.label,
                    // the action ref the button invokes
                    ref = yellOptions.action.ref,
                    // the baton to hand over to the action
                    baton = yellOptions.action.baton || null,
                    // the message node as target for additional contents
                    messageNode = yellNode.find('.message'),
                    // the button node to add to the message
                    button = $('<a role="button" class="presenter-notification-btn" tabindex="1">').attr('title', label).text(label);

                button.on('click', function () {
                    ActionsPattern.invoke(ref, null, baton);
                    Notifications.yell.close();
                });

                messageNode.append($('<div>').append(button));
            }

            // add default options
            yellOptions = _.extend({ type: 'info' }, yellOptions);
            // create and show the notification DOM node
            yellNode = Notifications.yell(yellOptions);
            // register event handlers

            if (_.isObject(yellOptions.action)) {
                yellNode.one('notification:appear', onNotificationAppear);
            }
        },

        /**
         * Shows a notification for the participants when the presenter starts the presentation.
         */
        notifyPresentationStart: function () {
            var rtModel = this.app.rtModel,
                userId = this.app.rtConnection.getRTUuid();

            if (rtModel.isPresenter(userId) || rtModel.isJoined(userId)) { return; }

            var baton = Ext.Baton({ context: this, model: this.model, data: this.model.toJSON() });
            var yellOptions = {
                //#. headline of a presentation start alert
                headline: gt('Presentation start'),
                //#. message text of of a presentation start alert
                //#. %1$d is the presenter name
                message: gt('%1$s has started the presentation.', this.app.rtModel.get('presenterName')),
                duration: -1,
                focus: true,
                action: {
                    //#. link button to join the currently running presentation
                    label: gt('Join Presentation'),
                    ref: 'io.ox/presenter/actions/join',
                    baton: baton
                }
            };

            this.showNotification(yellOptions);
        },

        /**
         * Shows a notification to all participants when the presenter ends the presentation.
         */
        notifyPresentationEnd: function () {
            var rtModel = this.app.rtModel,
                userId = this.app.rtConnection.getRTUuid(),
                presenterId,
                presenterName;

            if (_.isEmpty(rtModel.get('presenterId'))) {
                // the presenter has already been reset, look for previous data
                presenterId = rtModel.previous('presenterId');
                presenterName = rtModel.previous('presenterName');

            } else {
                // use current presenter
                presenterId = rtModel.get('presenterId');
                presenterName = rtModel.get('presenterName');
            }

            if (userId === presenterId) { return; }

            this.showNotification({
                //#. headline of a presentation end alert
                headline: gt('Presentation end'),
                //#. message text of a presentation end alert
                //#. %1$d is the presenter name
                message: gt('%1$s has ended the presentation.', presenterName),
                duration: 6000
            });
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
            //console.info('Presenter - mainview - onEnterFullscreen()');
            this.fullscreen = true;
            this.sidebarBeforeFullscreen = this.sidebarView.opened;
            this.sidebarView.toggleSidebar(false);
            this.presenterEvents.trigger('presenter:fullscreen:enter');
        },

        /**
         * Handle main view leaving full screen mode
         */
        onExitFullscreen: function () {
            //console.info('Presenter - mainview - onExitFullscreen()');
            this.fullscreen = false;
            this.sidebarView.toggleSidebar(this.sidebarBeforeFullscreen);

            this.presenterEvents.trigger('presenter:fullscreen:exit');
        },

        /**
         * Handle main view full screen toggle errors
         */
        onErrorFullscreen: function (foo) {
            console.info('Presenter - mainview - onErrorFullscreen()', foo);
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
                    this.showNotification({
                        type: 'error',
                        //#. message text of an alert box if joining a presentation fails
                        //#. %1$d is the name of the user who started the presentation
                        //#, c-format
                        message: gt('The limit of participants has been reached. Please contact the presenter %1$s.', this.app.rtModel.get('presenterName')),
                        focus: true
                    });
                }
            }.bind(this));

            return promise;
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
