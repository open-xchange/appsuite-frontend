/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */

define('io.ox/presenter/views/presentationview', [
    'io.ox/backbone/disposable',
    'io.ox/core/pdf/pdfdocument',
    'io.ox/core/pdf/pdfview',
    'io.ox/presenter/views/navigationview',
    'io.ox/core/tk/doc-converter-utils',
    'io.ox/core/tk/doc-utils/pageloader',
    'io.ox/presenter/util',
    'gettext!io.ox/presenter',
    'static/3rd.party/swiper/swiper.jquery.js',
    'css!3rd.party/swiper/swiper.css'
], function (DisposableView, PDFDocument, PDFView, NavigationView, DocConverterUtils, PageLoader, Util, gt) {

    'use strict';

    var SWIPER_PARAMS_DEFAULT = {
        loop: false,
        loopedSlides: 0,
        followFinger: false,
        simulateTouch: false,
        onlyExternal: false,
        noSwiping: true,
        speed: 0,
        spaceBetween: 0,
        runCallbacksOnInit: false
    };

    var SWIPER_PARAMS_BUTTONS_ENABLED = {
        onlyExternal: false
    };

    var SWIPER_PARAMS_BUTTONS_DISABLED = {
        onlyExternal: true
    };

    var SWIPER_PARAMS_SWIPING_ENABLED = {
        followFinger: true,
        simulateTouch: true,
        onlyExternal: false,
        speed: 300,
        spaceBetween: 100
    };

    var SWIPER_PARAMS_SWIPING_DISABLED = {
        followFinger: false,
        simulateTouch: false,
        onlyExternal: true,
        speed: 0,
        spaceBetween: 0
    };

    // defines how many pages are loaded before and after the visible pages
    var NON_VISIBLE_PAGES_TO_LOAD_BESIDE = 1;

    var PDF_ERROR_NOTIFICATIONS = {
        importError: { msg: gt('An error occurred loading the document so it cannot be displayed.'), icon: 'fa fa-exclamation-triangle' },
        filterError: { msg: gt('An error occurred converting the document so it cannot be displayed.'), icon: 'fa fa-exclamation-triangle' },
        passwordProtected: { msg: gt('This document is password protected and cannot be displayed.'), icon: 'fa fa-lock' }
    };

    /**
     * Creates the HTML mark-up for a slide navigation button.
     *
     * @param {String} type='left'|'right'
     *  the button type to create, could be 'left' or 'right'.
     *
     * @param {String} id
     *  the CSS id for the button.
     *
     * @returns {jQuery}
     *  the button node.
     */
    function createNavigationButton(type, id) {
        var button = $('<a href="#" class="swiper-button-control" tabindex="1" role="button" aria-controls="presenter-carousel">'),
            icon = $('<i class="fa" aria-hidden="true">');

        button.attr('id', id);
        button.addClass((type === 'left') ? 'swiper-button-prev  left' : 'swiper-button-next right');
        button.attr((type === 'left') ? {
            //#. button tooltip for 'go to previous presentation slide' action
            title: gt('Previous slide'),
            'aria-label': gt('Previous slide')
        } : {
            //#. button tooltip for 'go to next presentation slide' action
            title: gt('Next slide'),
            'aria-label': gt('Next slide')
        });
        icon.addClass((type === 'left') ? 'fa-angle-left' : 'fa-angle-right');

        return button.append(icon);
    }

    /**
     * The presentation view is responsible for displaying the presentation slides.
     */
    var PresentationView = DisposableView.extend({

        className: 'presenter-presentation',

        attributes: { tabindex: -1, role: 'main' },

        initialize: function (options) {
            _.extend(this, options);

            // the RT connection
            this.rtConnection = this.app.rtConnection;
            // amount of page side margins in pixels
            this.PAGE_SIDE_MARGIN = _.device('desktop') ? 30 : 15;
            // run own disposer function at global dispose
            this.on('dispose', this.disposeView.bind(this));
            // timeout object for the slide caption
            this.captionTimeoutId = null;
            // the swiper carousel root node
            this.carouselRoot = null;
            // instance of the swiper plugin
            this.swiper = null;
            // the PDFView instance
            this.pdfView = null;
            // the PDFDocument instance
            this.pdfDocument = null;
            // the PDF page rendering queue
            this.pageLoader = null;
            // a Deferred object indicating the load process of this document view.
            this.documentLoad = $.Deferred();
            // all page nodes with contents, keyed by one-based page number
            this.loadedPageNodes = {};
            // the timer that loads more pages above and below the visible ones
            this.loadMorePagesTimerId = null;
            // predefined zoom factors.
            // iOS Limits are handled by pdfview.js
            this.ZOOM_FACTORS = [25, 35, 50, 75, 100, 125, 150, 200, 300, 400];
            // current zoom factor, defaults to 100%
            this.currentZoomFactor = 100;
            // the pdf document container
            this.documentContainer = null;
            // create a debounced version of zoom function
            this.setZoomLevelDebounced = _.debounce(this.setZoomLevel.bind(this), 500);
            // create a debounced version of the resize handler
            this.onResizeDebounced = _.debounce(this.onResize.bind(this), 500);
            // create a debounced version of refresh function
            this.refreshDebounced = _.debounce(this.refresh.bind(this), 500);
            // the index of the current slide, defaults to the first slide
            this.currentSlideIndex = 0;
            // the slide count, defaults to 1
            this.numberOfSlides = 1;
            // the index of the slide to start the presentation with
            // TODO: check if needed here
            this.startIndex = 0;
            // the slide navigation view
            this.navigationView = new NavigationView(options);
            // register resize handler
            this.listenTo(this.presenterEvents, 'presenter:resize', this.onResizeDebounced);
            // bind zoom events
            this.listenTo(this.presenterEvents, 'presenter:zoomin', this.onZoomIn);
            this.listenTo(this.presenterEvents, 'presenter:zoomout', this.onZoomOut);
            // register slide change handler
            this.listenTo(this.presenterEvents, 'presenter:remote:slide:change', this.onRemoteSlideChange);
            // register participants change handler
            this.listenTo(this.presenterEvents, 'presenter:participants:change', this.onParticipantsChange);
            // register presentation pause /continue handler
            this.listenTo(this.presenterEvents, 'presenter:presentation:pause', this.onPresentationPause);
            this.listenTo(this.presenterEvents, 'presenter:presentation:continue', this.onPresentationContinue);
            // register thumbnail view slide select handler
            this.listenTo(this.presenterEvents, 'presenter:showslide', this.showSlide);
            // register presentation start/end handler
            this.listenTo(this.presenterEvents, 'presenter:presentation:start', this.onPresentationStartEnd);
            this.listenTo(this.presenterEvents, 'presenter:presentation:end', this.onPresentationStartEnd);
        },

        /**
         * Renders the PresentationView.
         *
         * @returns {PresentationView}
         */
        render: function () {
            //console.info('Presenter - render()');

            var documentUrl = DocConverterUtils.getEncodedConverterUrl(this.model),
                carouselRoot = $('<div id="presenter-carousel" class="swiper-container" role="listbox">'),
                carouselInner = $('<div class="swiper-wrapper document-container io-ox-core-pdf">'),
                caption = $('<div class="presentation-caption">');

            // append carousel to view
            carouselRoot.append(carouselInner);
            this.$el.append(
                carouselRoot,
                caption,
                this.navigationView.render().el
            );

            // create pause overlay
            this.renderPauseOverlay();

            this.carouselRoot = carouselRoot;
            this.documentContainer = carouselInner;
            // create pdf document
            this.pdfDocument = new PDFDocument(documentUrl);
            // display loading animation
            this.documentContainer.busy();

            // enable touch events
            if (this.documentContainer.enableTouch) {
                this.documentContainer.enableTouch({
                    tapHandler: this.onTap.bind(this),
                    pinchHandler: this.onPinch.bind(this)
                });
            }

            // wait for PDF document to finish loading
            $.when(this.pdfDocument.getLoadPromise())
            .then(this.pdfDocumentLoadSuccess.bind(this), this.pdfDocumentLoadError.bind(this))
            .always(this.pdfDocumentLoadFinished.bind(this));

            return this;
        },

        /**
         * Creates the presentation pause overlay.
         */
        renderPauseOverlay: function () {
            var overlay = $('<div class="pause-overlay">');

            var infoBox = $('<div class="pause-infobox">');
            var pauseNotification = $('<span class="pause-message">')
                .text(
                    //#. Info text that says the presentation is paused.
                    gt('Presentation is paused.')
                );
            var leaveButton = $('<button class="btn btn-default pause-leave" role="button" type="button" tabindex="1">')
                .attr({
                    //#. tooltip for the leave presentation button
                    'title': gt('Leave presentation'),
                    'aria-label': gt('Leave presentation')
                })
                //#. label for the leave presentation button
                .text(gt('Leave'));

            var pauseButton = $('<a href="#" class="pause-continue" tabindex="1" role="button"><i class="fa fa-pause" aria-hidden="true"></i></a>')
                .attr({
                    //#. tooltip for the continue presentation button
                    'title': gt('Continue presentation'),
                    'aria-label': gt('Continue presentation')
                });

            // leave the paused remote presentation
            function onPauseLeave() {
                this.togglePauseOverlay();
                this.app.rtConnection.leavePresentation();
                this.app.mainView.toggleFullscreen(false);
            }
            // continue the paused local presentation
            function onPauseContinue() {
                var localModel = this.app.localModel;
                var userId = this.rtConnection.getRTUuid();
                localModel.continuePresentation(userId);
                this.togglePauseOverlay();
            }

            leaveButton.on('click', onPauseLeave.bind(this));
            infoBox.append(pauseNotification, leaveButton);
            pauseButton.on('click', onPauseContinue.bind(this));
            overlay.append(pauseButton, infoBox);
            this.$el.append(overlay);
        },

        /**
         * Tap event handler.
         * - switches to the next slide.
         * - zooms the presentation slides to fit on screen in case of a double tap.
         *
         * @param {jQuery.Event} event
         *  The jQuery event object.
         *
         * @param {Number} taps
         *  The count of taps, indicating a single or double tap.
         */
        onTap: function (event, tapCount) {
            // on hybrid devices onSlideClick() handles click and tap
            if (_.device('desktop')) { return; }

            if (tapCount === 1) {
                this.showNextSlide();

            } else if (tapCount === 2) {
                this.setZoomLevel(this.getFitScreenZoomFactor());
            }
        },

        /**
         * Handles pinch events.
         *
         * @param {String} phase
         * The current pinch phase ('start', 'move', 'end' or 'cancel')
         *
         * @param {jQuery.Event} event
         *  The jQuery tracking event.
         *
         * @param {Number} distance
         * The current distance in px between the two fingers
         *
         * @param {Point} midPoint
         * The current center position between the two fingers
         */
        onPinch: (function () {
            var startDistance = 0,
                transformScale = 0,
                zoomFactor;

            return function pinchHandler(phase, event, distance /*, midPoint*/) {

                var documentPages = this.documentContainer.find('.document-page'),
                    rtModel = this.app.rtModel,
                    userId = this.rtConnection.getRTUuid();

                // no zoom for the presenter
                if (rtModel.isPresenter(userId)) {
                    return;
                }

                switch (phase) {
                    case 'start':
                        startDistance = distance;
                        break;

                    case 'move':
                        transformScale = distance / startDistance;
                        //transformOriginX = midPoint.x;
                        //transformOriginY = midPoint.y;
                        documentPages.css({
                            //'transform-origin': transformOriginX + 'px ' + transformOriginY + 'px',
                            'transform': 'scale(' + transformScale + ')'
                        });
                        break;

                    case 'end':
                        zoomFactor = transformScale * this.currentZoomFactor;
                        zoomFactor = Util.minMax(zoomFactor, this.getMinZoomFactor(), this.getMaxZoomFactor());
                        documentPages.css({
                            //'transform-origin': '50% 50% 0',
                            'transform': 'scale(1)'
                        });
                        this.setZoomLevel(zoomFactor);
                        break;

                    case 'cancel':
                        documentPages.css({
                            //'transform-origin': '50% 50% 0',
                            'transform': 'scale(1)'
                        });
                        break;

                    default:
                        break;
                }
            };
        })(),

        /**
         * Handles Swiper slide change end events
         *
         * @param {Object} swiper
         *  the Swiper instance
         */
        onSlideChangeEnd: function (swiper) {
            var activeSlideIndex = swiper.activeIndex,
                activeSlideNode = swiper.slides.eq(activeSlideIndex),
                previousSlideNode = swiper.slides.eq(swiper.previousIndex);

            this.currentSlideIndex = activeSlideIndex;

            // a11y
            activeSlideNode.attr('aria-selected', 'true');
            previousSlideNode.attr('aria-selected', 'false');

            console.info('Presenter - onSlideChangeEnd', 'slide-index', activeSlideIndex);

            this.loadVisiblePages();

            //#. text of a presentation slide caption
            //#. Example result: "1 of 10"
            //#. %1$d is the slide index of the current
            //#. %2$d is the total slide count
            this.showCaption(gt('%1$d of %2$d', activeSlideIndex + 1, this.numberOfSlides));

            this.presenterEvents.trigger('presenter:local:slide:change', activeSlideIndex);
        },

        /**
         * Handles Swiper slide change start events
         *
         * @param {Object} swiper
         *  the Swiper instance
         */
        onSlideChangeStart: function (swiper) {
            console.info('Presenter - onSlideChangeStart');
            this.rtConnection.updateSlide({ activeSlide: swiper.activeIndex });
        },

        /**
         * Handles presentation start and end.
         */
        onPresentationStartEnd: function () {
            this.updateNavigationArrows();
            this.updateSwiperParams();
        },

        /**
         * Handles remote slide changes invoked by the real-time framework.
         *
         * @param {Number} index
         *  the index of the slide to be shown.
         */
        onRemoteSlideChange: function (index) {
            var rtModel = this.app.rtModel,
                userId = this.app.rtConnection.getRTUuid();

            if (rtModel.isJoined(userId) && !rtModel.isPresenter(userId)) {
                this.internalShowSlide(index);
            }
        },

        /**
         * Handles remote participants changes invoked by the real-time framework.
         *
         * @param {Array} participants
         *  An array of the participants.
         */
        onParticipantsChange: function (participants) {
            console.info('Presenter - participants - change', participants);
            this.updateNavigationArrows();
            this.updateSwiperParams();
            this.togglePauseOverlay();
        },

        /**
         * Handles presentation pause invoked by the real-time framework.
         */
        onPresentationPause: function () {
            var rtModel = this.app.rtModel;
            var localModel = this.app.localModel;
            var userId = this.app.rtConnection.getRTUuid();

            console.info('Presenter - presentation - pause');
            this.updateNavigationArrows();
            this.updateSwiperParams();
            this.togglePauseOverlay();

            if (localModel.canContinue(userId) || rtModel.canContinue(userId)) {
                this.hideNavigation(0);
            }
        },

        /**
         * Handles presentation continue invoked by the real-time framework.
         */
        onPresentationContinue: function () {
            console.info('Presenter - presentation - continue');
            this.updateNavigationArrows();
            this.updateSwiperParams();
            this.togglePauseOverlay();
        },

        /**
         * Toggles the visibility of the pause overlay for presentation participants.
         */
        togglePauseOverlay: function () {
            var rtModel = this.app.rtModel;
            var localModel = this.app.localModel;
            var userId = this.app.rtConnection.getRTUuid();

            // to see the pause overlay the presentation needs to be paused and the user needs to be
            // the presenter of a local presentation or joined in a remote presentation.
            if (localModel.canShowPauseOverlay(userId)) {
                this.$('.pause-overlay').addClass('local-presenation').removeClass('remote-presenation').show();
            } else if (rtModel.canShowPauseOverlay(userId)) {
                this.$('.pause-overlay').addClass('remote-presenation').removeClass('local-presenation').show();
            } else {
                this.$('.pause-overlay').hide();
            }
        },

        /**
         * Returns the active Swiper slide node.
         *
         * @returns {jQuery}
         *  the active node.
         */
        getActiveSlideNode: function () {
            if (!this.swiper || !this.swiper.slides) {
                return $();
            }
            return this.swiper.slides.eq(this.swiper.activeIndex);
        },

        /**
         * Focuses the swiper's current active slide.
         */
        focusActiveSlide: function () {
            this.getActiveSlideNode().focus();
        },

        /**
         * Returns the active slide index.
         *
         * @returns {Number}
         *  the active slide index.
         */
        getActiveSlideIndex: function () {
            return (this.swiper) ? this.swiper.activeIndex : 0;
        },

        /**
         * Returns the slide count.
         *
         * @returns {Number}
         *  the slide count.
         */
        getSlideCount: function () {
            return this.numberOfSlides || 0;
        },

        /**
         * Returns all Swiper slide nodes.
         *
         * @returns {jQuery}
         *  the slide nodes.
         */
        getSlides: function () {
            if (!this.swiper || !this.swiper.slides) {
                return $();
            }
            return this.swiper.slides;
        },

        /**
         * Switches Swiper to the slide with the given index.
         *
         * @param {Number} index
         *  the index of the slide to be shown.
         */
        internalShowSlide: function (index) {
            if (this.swiper && _.isNumber(index)) {
                this.swiper.slideTo(index, 0);
            }
        },

        /**
         * Switches Swiper to the slide with the given index,
         * but only if the user is presenter or has not joined the presentation.
         *
         * @param {Number} index
         *  the index of the slide to be shown.
         */
        showSlide: function (index) {
            var rtModel = this.app.rtModel,
                userId = this.app.rtConnection.getRTUuid();

            if (!rtModel.isJoined(userId) || rtModel.isPresenter(userId)) {
                this.internalShowSlide(index);
            }
        },

        /**
         * Switches Swiper to the next slide,
         * but only if the user is presenter or has not joined the presentation.
         *
         * @param {jQuery.Event} [event]
         *  the optional event.
         */
        showNextSlide: function (event) {
            var rtModel = this.app.rtModel,
                userId = this.app.rtConnection.getRTUuid();

            if (event) {
                event.preventDefault();
            }

            if (this.swiper && (!rtModel.isJoined(userId) || rtModel.isPresenter(userId))) {
                this.swiper.slideNext(true, 0);
            }
        },

        /**
         * Switches Swiper to the previous slide,
         * but only if the user is presenter or has not joined the presentation.
         *
         * @param {jQuery.Event} [event]
         *  the optional event.
         */
        showPreviousSlide: function (event) {
            var rtModel = this.app.rtModel,
                userId = this.app.rtConnection.getRTUuid();

            if (event) {
                event.preventDefault();
            }

            if (this.swiper && (!rtModel.isJoined(userId) || rtModel.isPresenter(userId))) {
                this.swiper.slidePrev(true, 0);
            }
        },

        /**
         * Updates the navigation arrow buttons visible state according to the RTModel data.
         *  Show the buttons in the following cases:
         *  - the presentation has not been started
         *  - the current user is a participant and has not (yet) joined the presentation
         *  - the current user is the presenter and the presentation is paused
         */
        updateNavigationArrows: function () {
            var rtModel = this.app.rtModel;
            var localModel = this.app.localModel;
            var userId = this.app.rtConnection.getRTUuid();
            var navigationArrows = this.$el.find('.swiper-button-control');

            if (!localModel.isPresenter(userId) && (!rtModel.isJoined(userId) || (rtModel.isPresenter(userId) && rtModel.isPaused()))) {
                navigationArrows.show();
            } else {
                navigationArrows.hide();
            }
        },

        /**
         * Updates the Swiper parameters according to the RTModel data.
         *  Swiping is enabled if:
         *  - the presentation has not yet been started
         *  - the current user is a participant and has not (yet) joined the presentation
         *  - the current user is the presenter
         */
        updateSwiperParams: function () {
            var rtModel = this.app.rtModel;
            //var localModel = this.app.localModel;
            var userId = this.app.rtConnection.getRTUuid();
            //var enable = !rtModel.isJoined(userId) || rtModel.isPresenter(userId) || localModel.isPresenter(userId);
            var enable = !rtModel.isJoined(userId) || rtModel.isPresenter(userId);

            if (!this.swiper) { return; }

            if (_.device('touch')) {
                // on touch devices enable or disable swiping and the buttons
                this.swiper.params = _.extend(this.swiper.params, (enable ? SWIPER_PARAMS_SWIPING_ENABLED : SWIPER_PARAMS_SWIPING_DISABLED));

            } else {
                // on non touch devices enable or disable the buttons only
                this.swiper.params = _.extend(this.swiper.params, (enable ? SWIPER_PARAMS_BUTTONS_ENABLED : SWIPER_PARAMS_BUTTONS_DISABLED));
            }
        },

        /**
         * Shows the passed text in a caption for a specific duration.
         *
         * @param {String} text
         *  the text to be displayed in the caption.
         *
         * @param {[Number = 3000]} duration
         *  the display duration of the caption in milliseconds. Defaults to 3000 ms.
         */
        showCaption: function (text, duration) {
            var slideCaption = this.$el.find('.presentation-caption'),
                captionContent = $('<div class="caption-content">').text(text);

            slideCaption.empty().append(captionContent);
            window.clearTimeout(this.captionTimeoutId);
            slideCaption.show();
            this.captionTimeoutId = window.setTimeout(function () {
                slideCaption.fadeOut();
            }, (duration || 3000));
        },

        /**
         * Show navigation panel,
         * but only if the current user is the presenter and the presentation is no paused.
         */
        showNavigation: function () {
            var userId = this.app.rtConnection.getRTUuid();
            var localModel = this.app.localModel;
            var rtModel = this.app.rtModel;

            if (localModel.isPresenting(userId) || rtModel.isPresenting(userId)) {
                this.navigationView.$el.show();
            }
        },

        /**
         * Hide navigation panel
         *
         * @param {[Number = 1000]} duration
         *  the duration of the fade out animation in milliseconds. Defaults to 1000 ms.
         */
        hideNavigation: function (duration) {
            this.navigationView.$el.fadeOut(duration || 1000);
        },

        /**
         * Returns the page node for the given page number.
         *
         * @param {Number} pageNumber
         *  The 1-based number of the page node to return.
         *
         * @returns {jquery.Node} pageNode
         *  The jQuery page node for the requested page number.
         */
        getPageNode: function (pageNumber) {
            return ((pageNumber > 0) && this.documentContainer) ?
                this.documentContainer.children().eq(pageNumber - 1).find('.document-page') : $();
        },

        /**
         * Returns the active page node.
         *
         * @returns {jquery.Node} pageNode
         *  The active jQuery page node.
         */
        getActivePageNode: function () {
            return this.getPageNode(this.getActiveSlideIndex() + 1);
        },

        /**
         * Loads all pages that are currently visible in the DocumentView plus
         * one page before the visible pages and one page after the visible pages;
         * the non visible pages are loaded with lower priority, if necessary.
         */
        loadVisiblePages: function () {

            var currentPage = this.currentSlideIndex + 1;

            // abort old requests not yet running
            this.pageLoader.abortQueuedRequests();
            this.cancelMorePagesTimer();

            // load visible page with high priority
            this.loadPage(currentPage, 'high');

            // load the invisible pages above and below the visible area with medium priority after a short delay
            this.loadMorePagesTimerId = window.setTimeout(function () {
                for (var i = 1; i <= NON_VISIBLE_PAGES_TO_LOAD_BESIDE; i++) {
                    // pages before the visible pages
                    if ((currentPage - i) > 0) {
                        this.loadPage(currentPage - i, 'medium');
                    }
                    // pages after the visible pages
                    if ((currentPage + i) <= this.numberOfSlides) {
                        this.loadPage(currentPage + i, 'medium');
                    }
                }
            }.bind(this), 50);

            // clear all other pages
            _.each(this.loadedPageNodes, function (pageNode, pageNumber) {
                if ((pageNumber < (currentPage - NON_VISIBLE_PAGES_TO_LOAD_BESIDE)) || (pageNumber > (currentPage + NON_VISIBLE_PAGES_TO_LOAD_BESIDE))) {
                    this.emptyPageNode(pageNode);
                    delete this.loadedPageNodes[pageNumber];
                }
            }, this);
        },

        /**
         * Loads the specified page, and stores the original page size at the
         * page node.
         *
         * @param {Number} pageNumber
         *  The 1-based page number.
         *
         * @param {String} priority
         *  The priority to load the page with.
         *  Supported are 'high', 'medium' and 'low'.
         */
        loadPage: function (pageNumber, priority) {
            var // the page node of the specified page
                pageNode = this.getPageNode(pageNumber),
                // the slide node of the specified page
                slideNode = pageNode.parent(),
                // the page load options
                options = {
                    format: 'pdf',
                    priority: priority,
                    pageZoom: this.currentZoomFactor / 100
                };

            // to prevent mobile Safari crashing due to rendering overload
            // only the rendered slides are set to visible, all others are hidden.
            slideNode.css({ visibility: 'visible' });

            // do not load correctly initialized page again
            if (pageNode.children().length === 0) {
                // render the PDF via the PDF.js library onto HTML5 canvas elements
                this.pageLoader.loadPage(pageNode, pageNumber, options).done(function () {
                    this.loadedPageNodes[pageNumber] = pageNode;
                    this.refresh(pageNumber);
                    this.presenterEvents.trigger('presenter:page:loaded', pageNumber);

                }.bind(this)).fail(function () {
                    pageNode.append(
                        $('<div>').addClass('error-message').text(gt('Sorry, this page is not available at the moment.'))
                    );
                });
            }
        },

        /**
         * Refreshes the specified page or all pages.
         *
         * @param {Number} [pageNumberToRefresh]
         *  The 1-based page number to refresh.
         *  If not set all pages were refreshed.
         */
        refresh: function (pageNumberToRefresh) {
            if (this.numberOfSlides > 0) {

                var self = this,
                    pageZoom = this.currentZoomFactor / 100;

                if (_.isNumber(pageNumberToRefresh)) {
                    // Process the page node
                    var pageNode = this.getPageNode(pageNumberToRefresh);
                    this.pageLoader.setPageZoom(pageNode, pageZoom);

                } else {
                    // empty all pages in case of a complete refresh request
                    _.each(this.getSlides(), function (slide) {
                        var // get page node from slide node
                            page = $(slide).children(':first');

                        // detach page node
                        page.detach();
                        // empty page node and set zoom
                        self.emptyPageNode(page);
                        self.pageLoader.setPageZoom(page, pageZoom);
                        // re-attach page node to slide node again
                        page.appendTo(slide);

                    }, this);

                    this.loadVisiblePages();
                }
            }
        },

        /**
         * Cancels all running background tasks regarding updating the page
         * nodes in the visible area.
         */
        cancelMorePagesTimer: function () {
            // cancel the timer that loads more pages above and below the visible
            // area, e.g. to prevent (or defer) out-of-memory situations on iPad
            if (this.loadMorePagesTimerId) {
                window.clearTimeout(this.loadMorePagesTimerId);
                this.loadMorePagesTimerId = null;
            }
        },

        /**
         * Clears a page node
         *
         * @param {jquery.Node} pageNode
         *  The jQuery page node to clear.
         */
        emptyPageNode: function (pageNode) {
            if (pageNode) {
                // to prevent mobile Safari crashing due to rendering overload
                // set slides with empty pages to hidden, only rendered slides
                // are set to visible.
                pageNode.parent().css({ visibility: 'hidden' });
                pageNode.data('data-rendertype', '').empty();
            }
        },

        /**
         * Actions which always have to be done after pdf document loading process
         */
        pdfDocumentLoadFinished: function () {
            console.info('Presenter - pdfDocumentLoadFinished()');
            if (this.documentContainer) { this.documentContainer.idle(); }
        },

        /**
         * PDF document load handler
         *
         * @param {Number | Object} pageCount
         *  page count of the pdf document delivered by the PDF.js library,
         *  or an error object.
         */
        pdfDocumentLoadSuccess: function (pageCount) {
            // do nothing and quit if a document is already disposed.
            console.info('Presenter - pdfDocumentLoadSuccess()', 'page-count:', pageCount);
            if (!this.pdfDocument) {
                return;
            }
            // forward 'resolved' errors to error handler
            if (_.isObject(pageCount) && (pageCount.cause.length > 0)) {
                this.pdfDocumentLoadError(pageCount);
                return;
            }

            var swiperNextButtonId = _.uniqueId('presenter-button-next-'),
                swiperPrevButtonId = _.uniqueId('presenter-button-prev-');

            // configure Swiper
            //
            // listen to onTransitionEnd instead of onSlideChangeEnd. Swiper doesn't trigger the onSlideChangeEnd event
            // when a resize events occurs during the processing of a swiper.slideTo() call.
            var swiperParameter = {
                initialSlide: this.startIndex,
                nextButton: '#' + swiperNextButtonId,
                prevButton: '#' + swiperPrevButtonId,
                onSlideChangeStart: this.onSlideChangeStart.bind(this),
                onTransitionEnd: this.onSlideChangeEnd.bind(this)
            };
            swiperParameter = _.extend(swiperParameter, SWIPER_PARAMS_DEFAULT);
            // enable swiping on touch devices
            if (_.device('touch')) {
                swiperParameter = _.extend(swiperParameter, SWIPER_PARAMS_SWIPING_ENABLED);
            }

            this.numberOfSlides = pageCount;
            // create the PDF view after successful loading;
            this.pdfView = new PDFView(this.pdfDocument, { textOverlay: false });
            // the PDF page rendering queue
            this.pageLoader = new PageLoader(this.pdfDocument, this.pdfView);
            // set scale/zoom according to device's viewport
            this.currentZoomFactor = this.getFitScreenZoomFactor();

            // add navigation buttons
            if (pageCount > 1) {
                this.carouselRoot.append(
                    createNavigationButton('left', swiperPrevButtonId),
                    createNavigationButton('right', swiperNextButtonId)
                );
            }

            // draw page nodes and apply css sizes
            var docContainerHeight = this.documentContainer.height();
            var pdfPageZoom = this.currentZoomFactor / 100;

            _.times(pageCount, function (index) {
                // to prevent mobile Safari crashing due to rendering overload default the slide 'visibility' to 'hidden'
                // and set only the rendered slides to 'visible'.
                var pageNumber = index + 1;
                var pageSize = this.pdfView.getRealPageSize(pageNumber, pdfPageZoom);
                var pageWidth = pageSize.width;
                var pageHeight = pageSize.height;
                // create DOM from strings to optimize performance for presentations with lots of slides
                var swiperSlide = '<div class="swiper-slide" tabindex="-1" role="option" aria-selected="false" style="visibility: hidden; line-height: ' + docContainerHeight + 'px;">';
                var documentPage = '<div class="document-page" data-page="' + pageNumber + '" width="' + pageWidth + '" height="' + pageHeight + '" style="width: ' + pageWidth + 'px; height: ' + pageHeight + 'px;"></div>';

                this.documentContainer.append(swiperSlide + documentPage + '</div>');

            }, this);

            // initiate swiper
            this.swiper = new window.Swiper(this.carouselRoot[0], swiperParameter);
            this.pages = this.$el.find('.document-page');

            // render visible PDF pages
            this.loadVisiblePages();

            // trigger initial slide change event
            this.presenterEvents.trigger('presenter:local:slide:change', this.startIndex);

            // bind slide click handler
            if (_.device('desktop')) {
                this.pages.on('mousedown mouseup', this.onSlideClick.bind(this));
            }
            // resolve the document load Deferred: this document view is fully loaded.
            this.documentLoad.resolve();
            // focus first active slide initially
            this.focusActiveSlide();
        },

        /**
         * Error handler for the PDF loading process.
         *
         * @param {Object} error
         *  the error data
         */
        pdfDocumentLoadError: function (error) {
            console.warn('Presenter - failed loading PDF document. Cause: ', error.cause);
            this.showErrorNotification(error);
            // reject the document load Deferred.
            this.documentLoad.reject();
        },

        /**
         * Displays an error notification for the given PDF load error.
         *
         * @param {Object} error
         *  the PDF load error data.
         */
        showErrorNotification: function (error) {
            var errorData = PDF_ERROR_NOTIFICATIONS[error && error.cause];
            var iconClass = errorData && errorData.icon || PDF_ERROR_NOTIFICATIONS.importError.icon;
            var msg = errorData && errorData.msg || PDF_ERROR_NOTIFICATIONS.importError.msg;

            var notificationNode = $('<div class="presenter-error-notification">').append(
                                        $('<i>').addClass(iconClass),
                                        $('<p class="apology">').text(msg)
                                   );

            this.$el.append(notificationNode);
        },

        /**
         * Calculates a default scale number for documents, taking
         * current viewport width and the document's default size
         * into account.
         *
         * @returns {Number} scale
         *  Document zoom scale in floating point number.
         */
        getDefaultScale: function () {
            var maxWidth = this.$el.innerWidth() - (this.PAGE_SIDE_MARGIN * 2),
                pageDefaultSize = this.pdfDocument && this.pdfDocument.getDefaultPageSize(),
                pageDefaultWidth = pageDefaultSize && pageDefaultSize.width;

            if ((!pageDefaultWidth) || (maxWidth >= pageDefaultWidth)) {
                return 1;
            }
            return PDFView.round(maxWidth / pageDefaultWidth, 1 / 100);
        },

        /**
         * Calculates the 'fit to page' zoom factor of this document.
         * @returns {Number} zoom factor
         */
        getFitScreenZoomFactor: function () {
            var offset = 40,
                slideHeight = this.$el.height(),
                slideWidth = this.$el.width(),
                originalPageSize = this.pdfDocument.getOriginalPageSize(),
                fitWidthZoomFactor = (slideWidth - offset) / originalPageSize.width * 100,
                fitHeightZoomFactor = (slideHeight - offset) / originalPageSize.height * 100;
            return Math.min(fitWidthZoomFactor, fitHeightZoomFactor);
        },

        /**
         * Zooms in of a document.
         */
        onZoomIn: function () {
            this.pdfDocument.getLoadPromise().done(this.changeZoomLevel.bind(this, 'increase'));
        },

        /**
         * Zooms out of the document.
         */
        onZoomOut: function () {
            this.pdfDocument.getLoadPromise().done(this.changeZoomLevel.bind(this, 'decrease'));
        },

        /**
         *  Changes the zoom level of a document.
         *
         * @param {String} action
         *  Supported values: 'increase' or 'decrease'.
         */
        changeZoomLevel: function (action) {
            var currentZoomFactor = this.currentZoomFactor,
                nextZoomFactor;
            // search for next bigger/smaller zoom factor in the avaliable zoom factors
            switch (action) {
                case 'increase':
                    nextZoomFactor = _.find(this.ZOOM_FACTORS, function (factor) {
                        return factor > currentZoomFactor;
                    }) || this.getMaxZoomFactor();
                    break;
                case 'decrease':
                    var lastIndex = _.findLastIndex(this.ZOOM_FACTORS, function (factor) {
                        return factor < currentZoomFactor;
                    });
                    nextZoomFactor = this.ZOOM_FACTORS[lastIndex] || this.getMinZoomFactor();
                    break;
                default:
                    return;
            }

            // apply zoom level
            this.setZoomLevel(nextZoomFactor);
        },

        /**
         * Applies passed zoom level to the document.
         *
         * @param {Number} zoomLevel
         *  zoom level numbers between 25 and 400 (supported zoom factors)
         */
        setZoomLevel: function (zoomLevel) {
            if (!_.isNumber(zoomLevel) || !this.pdfView) {
                return;
            }

            zoomLevel = Util.minMax(zoomLevel, this.getMinZoomFactor(), this.getMaxZoomFactor());

            var documentTopPosition = this.documentContainer.scrollTop();

            // set page zoom to all pages and apply the new size to all page wrappers
            this.currentZoomFactor = zoomLevel;
            this.refreshDebounced();

            // adjust document scroll position according to new zoom
            this.documentContainer.scrollTop(documentTopPosition * zoomLevel / this.currentZoomFactor);

            //#. text of a presentation zoom level caption
            //#. Example result: "100 %"
            //#. %1$d is the zoom level
            this.showCaption(gt('%1$d %', Math.round(zoomLevel)));
        },

        /**
         *  Gets the maximum zoom factor of a document.
         */
        getMaxZoomFactor: function () {
            return _.last(this.ZOOM_FACTORS);
        },

        /**
         *  Gets the minimum zoom factor of a document.
         */
        getMinZoomFactor: function () {
            return _.first(this.ZOOM_FACTORS);
        },

        /**
         * Resize handler of the PresentationView.
         * - calculates and sets a new initial zoom factor
         */
        onResize: function () {
            if (ox.ui.App.getCurrentApp().getName() !== 'io.ox/presenter') {
                return;
            }
            this.documentLoad.done(function () {
                var fitScreenZoomFactor = this.getFitScreenZoomFactor(),
                    swiperSlide = this.getActiveSlideNode();

                this.setZoomLevelDebounced(fitScreenZoomFactor);

                console.info('Presenter - onResize()', 'defaultZoomFactor', fitScreenZoomFactor);

                if (this.swiper) {
                    this.swiper.onResize();
                    // workaround for a possible bug from swiper plugin that happens sporadically:
                    // After an on resize call, the plugin 'resets' the active slide to the beginning.
                    //this.swiper.slideTo(this.currentSlideIndex);
                }
                this.getSlides().css('line-height', swiperSlide.height() + 'px');

            }.bind(this));
        },

        /**
         * Presentation slide click handler.
         * - detects if a user is doing a text selection or a click
         * - show next slide on clicks.
         */
        onSlideClick: (function () {

            var x, y;

            return function (event) {
                //only allow left click
                if (event.button) { return; }

                switch (event.type) {
                    case 'mousedown':
                        x = event.clientX;
                        y = event.clientY;
                        break;
                    case 'mouseup':
                        if (event.clientX === x && event.clientY === y) {
                            this.showNextSlide();
                        }
                        break;
                    // no default
                }
            };
        })(),

        /**
         * Destructor function of the PresentationView.
         */
        disposeView: function () {
            console.info('Presenter - dispose PresentationView');

            // remove touch events
            if (this.documentContainer.disableTouch) {
                this.documentContainer.disableTouch();
            }

            // destroy the page loader instance
            if (this.pageLoader) {
                this.pageLoader.abortQueuedRequests();
                this.cancelMorePagesTimer();
                this.pageLoader.destroy();
                this.pageLoader = null;
            }

            // destroy the swiper instance
            if (this.swiper) {
                this.swiper.removeAllSlides();
                this.swiper.destroy();
                this.swiper = null;
            }

            // destroy the pdf view and model instances
            if (this.pdfView) {
                this.pdfView.destroy();
                this.pdfView = null;
            }
            if (this.pdfDocument) {
                this.pdfDocument.destroy();
                this.pdfDocument = null;
            }

            this.model = null;
            this.captionTimeoutId = null;
            this.carouselRoot = null;
            this.documentContainer = null;
        }
    });

    return PresentationView;
});
