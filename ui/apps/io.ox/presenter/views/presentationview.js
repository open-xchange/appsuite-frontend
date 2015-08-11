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
    // TODO: move code to document converter utils
    'io.ox/presenter/util',
    'gettext!io.ox/presenter',
    'static/3rd.party/swiper/swiper.jquery.js',
    'css!3rd.party/swiper/swiper.css'
], function (DisposableView, PDFDocument, PDFView, NavigationView, Util, gt) {

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
    function createNavigationButton (type, id) {
        var button = $('<a href="#" class="swiper-button-control" tabindex="1" role="button" aria-controls="presenter-carousel">'),
            icon = $('<i class="fa" aria-hidden="true">');

        button.attr('id', id);
        button.addClass((type === 'left') ? 'swiper-button-prev  left' : 'swiper-button-next right');
        button.attr((type === 'left') ? {
            //#. button tooltip for 'go to previous presentation slide' action
            title: gt('Previous slide'),
            'aria-label': gt('Previous slide')
        } :
        {
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
            // the name of the document converter server module.
            this.CONVERTER_MODULE_NAME = 'oxodocumentconverter';
            // amount of page side margins in pixels
            this.PAGE_SIDE_MARGIN = _.device('desktop') ? 30 : 15;
            // run own disposer function at global dispose
            this.on('dispose', this.disposeView.bind(this));
            // timeout object for the slide caption
            // the swiper carousel root node
            this.carouselRoot = null;
            // instance of the swiper plugin
            this.swiper = null;
            // the PDFView instance
            this.pdfView = null;
            // the PDFDocument instance
            this.pdfDocument = null;
            // a Deferred object indicating the load process of this document view.
            this.documentLoad = $.Deferred();
            // predefined zoom factors.
            // Limit zoom factor on iOS because of canvas size restrictions.
            // https://github.com/mozilla/pdf.js/issues/2439
            this.ZOOM_FACTORS = _.device('!desktop') ? [25, 35, 50, 75, 100, 125] : [25, 35, 50, 75, 100, 125, 150, 200, 300, 400];
            // current zoom factor, defaults to 100%
            this.currentZoomFactor = 100;
            // the pdf document container
            this.documentContainer = null;
            // create a debounced version of zoom function
            this.setZoomLevelDebounced = _.debounce(this.setZoomLevel.bind(this), 500);
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
            this.listenTo(this.presenterEvents, 'presenter:resize', this.onResize);
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

            this.listenTo(this.presenterEvents, 'presenter:showslide', this.showSlide);
        },

        /**
         * Renders the PresentationView.
         *
         * @returns {PresentationView}
         */
        render: function () {
            console.info('Presenter - render()');

            // TODO: move to document converter utils
            var convertParams = Util.getConvertParams(this.model),
                documentUrl = Util.getConverterUrl(convertParams);

            var carouselRoot = $('<div id="presenter-carousel" class="swiper-container" role="listbox">'),
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
            var overlay = $('<div class="pause-overlay">'),
                infoBox = $('<div class="pause-infobox">'),
                pauseNotification = $('<span class="pause-message">').text(
                    //#. Info text that says the presentation is paused.
                    gt('Presentation is paused.')
                ),
                leaveButton = $('<button class="btn btn-default pause-leave" role="button" type="button" tabindex="1">')
                    .attr({
                        //#. tooltip for the leave presentation button
                        'title': gt('Leave presentation'),
                        'aria-label': gt('Leave presentation')
                    })
                    //#. label for the leave presentation button
                    .text(gt('Leave'));
            function onPauseLeave() {
                this.togglePauseOverlay();
                this.app.rtConnection.leavePresentation();
            }
            leaveButton.on('click', onPauseLeave.bind(this));
            infoBox.append(pauseNotification, leaveButton);
            overlay.append(infoBox);
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
         * Handles remote slide changes invoked by the real-time framework.
         *
         * @param {Number} index
         *  the index of the slide to be shown.
         */
        onRemoteSlideChange: function (index) {
            var rtModel = this.app.rtModel,
                userId = this.app.rtConnection.getRTUuid();

            if (rtModel.isJoined(userId)) {
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
            console.info('Presenter - presentation - pause');
            this.updateNavigationArrows();
            this.updateSwiperParams();
            this.togglePauseOverlay();
            this.hideNavigation(0);
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
            var userId = this.app.rtConnection.getRTUuid(),
                rtModel = this.app.rtModel;
            // presenter never gets the pause overlay
            if (rtModel.isPresenter(userId)) { return; }
            // to see the pause overlay the participant needs to be joined and the presentation needs to be paused
            if (rtModel.isJoined(userId) && rtModel.isPaused()) {
                this.$('.pause-overlay').show();
            } else {
                this.$('.pause-overlay').hide();
            }
        },

        /**
         * Returns the active Swiper slide jQuery node.
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
         * Switches Swiper to the slide with the given index.
         *
         * @param {Number} index
         *  the index of the slide to be shown.
         */
        internalShowSlide: function (index) {
            if (this.swiper && _.isNumber(index)) {
                this.swiper.slideTo(index);
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
                this.swiper.slideNext();
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
                this.swiper.slidePrev();
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
            var rtModel = this.app.rtModel,
                userId = this.app.rtConnection.getRTUuid(),
                navigationArrows = this.$el.find('.swiper-button-control');

            if (!rtModel.isJoined(userId) || (rtModel.isPresenter(userId) && rtModel.isPaused())) {
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
            var rtModel = this.app.rtModel,
                userId = this.app.rtConnection.getRTUuid(),
                enable = !rtModel.isJoined(userId) || rtModel.isPresenter(userId);

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
            var userId = this.app.rtConnection.getRTUuid(),
                rtModel = this.app.rtModel;

            if (rtModel.isPresenter(userId) && !rtModel.isPaused()) {
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
         * PDFjs render callback.
         *
         * Calculates document page numbers to render depending on
         * the current slide index.
         *
         * @returns {Array} pagesToRender
         *  an array of page numbers which should be rendered.
         */
        getPagesToRender: function () {
            var pagesToRender = [];

            // add previous slide
            if (this.currentSlideIndex > 0) {
                pagesToRender.push(this.currentSlideIndex - 1);
            }
            // add current slide
            pagesToRender.push(this.currentSlideIndex);
            // add next slide
            if (this.currentSlideIndex < (this.numberOfSlides - 1)) {
                pagesToRender.push(this.currentSlideIndex + 1);
            }

            //console.info('Presenter - getPagesToRender()', pagesToRender);
            return pagesToRender;
        },

        /**
         * PDFjs render callback
         *
         * Returns the pageNode with the given pageNumber.
         *
         * @param pageNumber
         *  The 1-based number of the page nod to return
         *
         * @returns {jquery.Node} pageNode
         *  The jquery page node for the requested page number.
         */
        getPageNode: function (pageNumber) {
            return (_.isNumber(pageNumber) && (pageNumber >= 1) && this.documentContainer) ?
                this.documentContainer.children().eq(pageNumber - 1).find('.document-page') : null;
        },

        /**
         * PDFjs render callback, called just before pages get rendered.
         *
         * @param pageNumbers
         *  The array of 1-based page numbers to be rendered
         */
        beginPageRendering: function (pageNumbers) {
            console.info('Presenter - Begin PDF rendering: ' + pageNumbers);
        },

        /**
         * PDFjs render callback, called just after pages are rendered.
         *
         * @param pageNumbers
         *  The array of 1-based page numbers that have been rendered
         */
        endPageRendering: function (pageNumbers) {
            console.info('Presenter - End PDF rendering: ' + pageNumbers);
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
                this.pdfDocumentLoadError.call(this, pageCount);
                return;
            }

            var swiperNextButtonId = _.uniqueId('presenter-button-next-'),
                swiperPrevButtonId = _.uniqueId('presenter-button-prev-');

            // configure Swiper
            var swiperParameter = {
                initialSlide: this.startIndex,
                nextButton: '#' + swiperNextButtonId,
                prevButton: '#' + swiperPrevButtonId,
                onSlideChangeEnd: this.onSlideChangeEnd.bind(this),
                onSlideChangeStart: this.onSlideChangeStart.bind(this)
            };
            swiperParameter = _.extend(swiperParameter, SWIPER_PARAMS_DEFAULT);
            // enable swiping on touch devices
            if (_.device('touch')) {
                swiperParameter = _.extend(swiperParameter, SWIPER_PARAMS_SWIPING_ENABLED);
            }

            this.numberOfSlides = pageCount;
            // create the PDF view after successful loading;
            this.pdfView = new PDFView(this.pdfDocument, { textOverlay: true });

            // add navigation buttons
            if (pageCount > 1) {
                this.carouselRoot.append(
                    createNavigationButton('left', swiperPrevButtonId),
                    createNavigationButton('right', swiperNextButtonId)
                );
            }

            // draw page nodes and apply css sizes
            _.times(pageCount, function (index) {
                var swiperSlide = $('<div class="swiper-slide" tabindex="-1" role="option" aria-selected="false">'),
                    documentPage = $('<div class="document-page">'),
                    pageSize = this.pdfView.getRealPageSize(index + 1);

                this.documentContainer.append(
                   swiperSlide.append(
                       documentPage.css(pageSize)
                   )
                );
            }, this);

            // initiate swiper
            this.swiper = new window.Swiper(this.carouselRoot[0], swiperParameter);
            this.pages = this.$el.find('.document-page');
            // trigger initial slide change event
            this.presenterEvents.trigger('presenter:local:slide:change', this.startIndex);

            // set callbacks at this.pdfView to start rendering
            var renderCallbacks = {
                getVisiblePageNumbers: this.getPagesToRender.bind(this),
                getPageNode: this.getPageNode.bind(this),
                beginRendering: this.beginPageRendering.bind(this),
                endRendering: this.endPageRendering.bind(this)
            };
            this.pdfView.setRenderCallbacks(renderCallbacks);
            // set scale/zoom according to device's viewport width
            this.setZoomLevel(this.getFitScreenZoomFactor());
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
            // reject the document load Deferred.
            this.documentLoad.reject();
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
            var offset = 80,
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
         *  zoom level numbers between 25 and 800 (supported zoom factors)
         */
        setZoomLevel: function (zoomLevel) {
            if (!_.isNumber(zoomLevel) || !this.pdfView ||
                (zoomLevel < this.getMinZoomFactor()) || (zoomLevel > this.getMaxZoomFactor())) {
                return;
            }
            var pdfView = this.pdfView,
                documentTopPosition = this.documentContainer.scrollTop();

            _.each(this.pages, function (page, pageIndex) {
                pdfView.setPageZoom(zoomLevel / 100, pageIndex + 1);
                var realPageSize = pdfView.getRealPageSize(pageIndex + 1);
                $(page).css(realPageSize);
            }, this);

            // adjust document scroll position according to new zoom
            this.documentContainer.scrollTop(documentTopPosition * zoomLevel / this.currentZoomFactor);
            // save new zoom level to view
            this.currentZoomFactor = zoomLevel;

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
                var fitScreenZoomFactor = this.getFitScreenZoomFactor();
                this.setZoomLevelDebounced(fitScreenZoomFactor);

                console.info('Presenter - onResize()', 'defaultZoomFactor', fitScreenZoomFactor);

                if (this.swiper) {
                    this.swiper.onResize();
                    // workaround for a possible bug from swiper plugin that happens sporadically:
                    // After an on resize call, the plugin 'resets' the active slide to the beginning.
                    //this.swiper.slideTo(this.currentSlideIndex);
                }
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
