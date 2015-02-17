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
define('io.ox/core/viewer/views/displayerview', [
    'io.ox/core/viewer/eventdispatcher',
    'io.ox/core/viewer/types/typefactory',
    'gettext!io.ox/core'
], function (EventDispatcher, TypeFactory, gt) {

    'use strict';

    /**
     * The displayer view is responsible for displaying preview images,
     * launching music or video players, or displaying pre-rendered OX Docs
     * document previews (TBD)
     */
    var DisplayerView = Backbone.View.extend({

        className: 'viewer-displayer',

        initialize: function () {
            //console.warn('DisplayerView.initialize()');
            this.$el.on('dispose', this.dispose.bind(this));
            this.captionTimeoutId = null;
        },

        /**
         * Renders this DisplayerView with the supplied data model.
         *
         * @param {Object} data
         *  @param {Number} data.index
         *   The index of the model to render.
         *  @param {Object} data.model
         *   The model object itself.
         *
         * @returns {DisplayerView}
         */
        render: function (data) {
            //console.warn('DisplayerView.render() data', data);
            if (!data) {
                console.error('Core.Viewer.DisplayerView.render(): no file to render');
                return;
            }

            var carouselRoot = $('<div id="viewer-carousel" class="carousel">'),
                carouselInner = $('<div class="carousel-inner">'),
                prevSlide = $('<a class="left carousel-control"><i class="fa fa-angle-left"></i></a>'),
                nextSlide = $('<a class="right carousel-control"><i class="fa fa-angle-right"></i></a>'),
                // preload 1 neigboring slides
                slidesToPreload = 1,
                startIndex = data.index,
                self = this;

            // create slides from file collection and append them to the carousel
            this.collection.each(function (model, modelIndex) {
                carouselInner.append(self.createSlide(model, modelIndex));
            });

            // init the carousel and preload neighboring slides on next/prev
            prevSlide.attr({ title: gt('Previous'), tabindex: '1', role: 'button' });
            nextSlide.attr({ title: gt('Next'), tabindex: '1', role: 'button' });
            carouselRoot.append(carouselInner, prevSlide, nextSlide)
                .carousel({ keyboard: false })
                .on('slid.bs.carousel', function (event) {
                    var activeSlideIndex = $(event.relatedTarget).data('slide'),
                        captionShowDuration = 3000;
                    self.preloadSlide(activeSlideIndex, slidesToPreload, event.direction);
                    self.blendSlideCaption(activeSlideIndex, captionShowDuration);
                });

            // append carousel to view
            this.$el.append(carouselRoot).attr('tabindex', -1);
            this.carouselRoot = carouselRoot;

            // set the first selected file active, blend its caption, and preload its neighbours
            carouselInner.children().eq(startIndex).addClass('active');
            this.blendSlideCaption(startIndex, 3000);
            this.preloadSlide(startIndex, slidesToPreload, 'left');
            this.preloadSlide(startIndex, slidesToPreload, 'right');

            // attach the touch handlers
            this.$el.enableTouch({ selector: '.carousel', horSwipeHandler: this.onHorizontalSwipe });

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
            console.warn('DisplayerView.onHorizontalSwipe()', 'event phase:', phase, 'distance:', distance);

            if (distance > 0) {
                EventDispatcher.trigger('viewer:display:previous');
            } else if (distance < 0) {
                EventDispatcher.trigger('viewer:display:next');
            }
        },

        /**
         * Create a Bootstrap carousel slide element.
         *
         * @param {Object} model
         *  the Viewer model.
         * @param {Number} modelIndex
         *  the model index in the Viewer Collection.
         *
         * @returns {jQuery}
         */
        createSlide: function (model, modelIndex) {
            return TypeFactory.getModelType(model).createSlide(model, modelIndex);
        },

        /**
         * Load the given slide index and additionally number of neigboring slides in the given direction.
         *
         * @param {Number} slideToLoad
         *  The current active slide to be loaded.
         *
         * @param {Number} preloadOffset
         *  Number of neighboring slides to preload.
         *
         * @param {String} preloadDirection
         *  Direction of the preload: 'left' or 'right' are supported.
         *
         */
        preloadSlide: function (slideToLoad, preloadOffset, preloadDirection) {
            var preloadOffset = preloadOffset || 0,
                step = preloadDirection === 'left' ? 1 : -1,
                slideToLoad = slideToLoad || 0,
                loadRange = _.range(slideToLoad, (preloadOffset + 1) * step + slideToLoad, step),
                collection = this.collection,
                slidesCount = collection.length,
                slidesList = this.$el.find('.item');
            // load the load range, containing the requested slide and preload slides
            _.each(loadRange, function (slideIndex) {
                if (slideIndex < 0) { slideIndex += slidesCount; }
                if (slideIndex >= slidesCount) { slideIndex -= slidesCount; }
                var slideModel = collection.at(slideIndex),
                    slideElement = slidesList.eq(slideIndex);
                TypeFactory.getModelType(slideModel).loadSlide(slideIndex, slideElement);
            });
        },

        /**
         * Blends in the caption of the passed slide index for a specific duration in milliseconds.
         *
         * @param {Number} slideIndex
         *  index of the slide, which caption is to be blended in.
         *
         * @param {Number} duration
         *  Duration of the blend-in in milliseconds. Defaults to 3000 ms.
         *
         */
        blendSlideCaption: function (slideIndex, duration) {
            var duration = duration || 3000,
                slideCaption = this.$el.find('.item').eq(slideIndex).find('.viewer-displayer-caption');
            window.clearTimeout(this.captionTimeoutId);
            slideCaption.show();
            this.captionTimeoutId = window.setTimeout(function () {
                slideCaption.fadeOut();
            }, duration);
        },

        /**
         * Displays the next slide. Returns a promise that is:
         *  resolved when the sliding transition of the carousel item is completed, or
         *  rejected if the sliding transition didn't finish within the timeout.
         *
         * @param {Number} [timeout=2000]
         *  The sliding transition timeout in milliseconds
         *
         * @return {$.Deferred}
         *  The promise indicationg the sliding transition state.
         */
        prevSlideAsync: function (timeout) {
            var def = $.Deferred(),
                carouselRoot = this.carouselRoot;

            function prevSlideResolver () {
                def.resolve();
                carouselRoot.off('slid.bs.carousel', prevSlideResolver);
            }

            timeout = _.isNumber(timeout) ? timeout : 2000;
            carouselRoot.on('slid.bs.carousel', prevSlideResolver);
            this.carouselRoot.carousel('prev');

            _.delay(function () {
                if (def.state() === 'pending') {
                    def.reject();
                    carouselRoot.off('slid.bs.carousel', prevSlideResolver);
                }
            }, timeout);

            return def;
        },

        /**
         * Displays the next slide. Returns a promise that is:
         *  resolved when the sliding transition of the carousel item is completed, or
         *  rejected if the sliding transition didn't finish within the timeout.
         *
         * @param {Number} [timeout=2000]
         *  The sliding transition timeout in milliseconds
         *
         * @return {$.Deferred}
         *  The promise indicationg the sliding transition state.
         */
        nextSlideAsync: function (timeout) {
            var def = $.Deferred(),
                carouselRoot = this.carouselRoot;

            function nextSlideResolver () {
                def.resolve();
                carouselRoot.off('slid.bs.carousel', nextSlideResolver);
            }

            timeout = _.isNumber(timeout) ? timeout : 2000;
            carouselRoot.on('slid.bs.carousel', nextSlideResolver);
            carouselRoot.carousel('next');

            _.delay(function () {
                if (def.state() === 'pending') {
                    def.reject();
                    carouselRoot.off('slid.bs.carousel', nextSlideResolver);
                }
            }, timeout);

            return def;
        },

        prevSlide: function () {
            this.carouselRoot.carousel('prev');
        },

        nextSlide: function () {
            this.carouselRoot.carousel('next');
        },

        dispose: function () {
            //console.info('DisplayerView.dispose()');
            this.$el.disableTouch();
            this.stopListening();
            return this;
        }
    });

    return DisplayerView;
});
