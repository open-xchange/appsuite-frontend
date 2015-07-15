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

    /**
     * Creates the HTML mark-up for a slide navigation button.
     *
     * @param {String} type='left'|'right'
     *  the button type to create, could be 'left' or 'right'.
     *
     * @returns {jQuery}
     *  the button node.
     */
    function createNavigationButton (type) {
        var button = $('<a href="#" class="swiper-button-control" tabindex="1" role="button" aria-controls="presenter-carousel">'),
            icon = $('<i class="fa" aria-hidden="true">');

        button.addClass((type === 'left') ? 'swiper-button-prev  left' : 'swiper-button-next right');
        button.attr((type === 'left') ? { title: gt('Previous'), 'aria-label': gt('Previous') } : { title: gt('Next'), 'aria-label': gt('Next') });
        icon.addClass((type === 'left') ? 'fa-angle-left' : 'fa-angle-right');

        return button.append(icon);
    }

    /**
     * The presentation view is responsible for displaying the presentation slides.
     */
    var PresentationView = DisposableView.extend({

        className: 'presenter-presentation',

        attributes: { tabindex: -1, role: 'main' },

        events: {
            'click .swiper-button-next': 'showNextSlide',
            'click .swiper-button-prev': 'showPreviousSlide'
        },

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
            this.captionTimeoutId = null;
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
            this.ZOOM_FACTORS = _.device('iOS') ? [25, 35, 50, 75, 100] : [25, 35, 50, 75, 100, 125, 150, 200, 300, 400, 600, 800];
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
                pauseNotification = $('<span class="pause-message">').text(gt('Presentation is paused.')),
                leaveButton = $('<button class="btn btn-default pause-leave" role="button" type="button" tabindex="1">')
                    .attr({
                        'title': gt('Leave presentation'),
                        'aria-label': gt('Leave presentation')
                    })
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
            this.togglePauseOverlay();
        },

        /**
         * Handles presentation pause invoked by the real-time framework.
         */
        onPresentationPause: function () {
            console.info('Presenter - presentation - pause');
            this.updateNavigationArrows();
            this.togglePauseOverlay();
        },

        /**
         * Handles presentation continue invoked by the real-time framework.
         */
        onPresentationContinue: function () {
            console.info('Presenter - presentation - continue');
            this.updateNavigationArrows();
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
            if (this.swiper && _.isNumber(index) && (index !== this.currentSlideIndex) ) {
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
         */
        hideNavigation: function () {
            this.navigationView.$el.fadeOut(1000);
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
            return (_.isNumber(pageNumber) && (pageNumber >= 1) && this.documentContainer) ? this.documentContainer.children().eq(pageNumber - 1) : null;
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
           var pdfDocument = this.pdfDocument;
           var swiperParameter = {
               loop: false,
               loopedSlides: 0,
               followFinger: false,
               simulateTouch: false,
               noSwiping: true,
               speed: 0,
               initialSlide: this.startIndex,
               runCallbacksOnInit: false,
               onSlideChangeEnd: this.onSlideChangeEnd.bind(this),
               onSlideChangeStart: this.onSlideChangeStart.bind(this)
           };

           this.numberOfSlides = pageCount;
           // create the PDF view after successful loading;
           this.pdfView = new PDFView(pdfDocument, { textOverlay: true });

           // add navigation buttons
           if (pageCount > 1) {
               this.carouselRoot.append(
                   createNavigationButton('left'),
                   createNavigationButton('right')
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
           // focus first active slide initially
           this.focusActiveSlide();
           // resolve the document load Deferred: this document view is fully loaded.
           this.documentLoad.resolve();
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

            //#. text of a presentation zoom level caption
            //#. Example result: "100 %"
            //#. %1$d is the zoom level
            this.showCaption(gt('%1$d %', nextZoomFactor));

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
                    this.swiper.slideTo(this.currentSlideIndex);
                }
            }.bind(this));
        },

        /**
         * Destructor function of the PresentationView.
         */
        disposeView: function () {
            console.info('Presenter - dispose PresentationView');

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
