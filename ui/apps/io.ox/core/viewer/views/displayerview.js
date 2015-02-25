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
    'io.ox/core/viewer/types/typesregistry',
    'gettext!io.ox/core',
    'static/3rd.party/swiper/swiper.jquery.js',
    'css!3rd.party/swiper/swiper.css'
], function (EventDispatcher, TypesRegistry, gt) {

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
            this.displayedFileIndex = this.collection.getStartIndex();
            this.$el.on('dispose', this.dispose.bind(this));
            this.captionTimeoutId = null;
            this.loadedSlides = [];
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

            var carouselRoot = $('<div id="viewer-carousel" class="swiper-container" role="listbox">'),
                carouselInner = $('<div class="swiper-wrapper">'),
                prevSlide = $('<a class="swiper-button-prev swiper-button-control left" role="button"><i class="fa fa-angle-left" aria-hidden="true"></i></a>'),
                nextSlide = $('<a class="swiper-button-next swiper-button-control right" role="button"><i class="fa fa-angle-right" aria-hidden="true"></i></a>'),
                slidesToPreload = 2,
                startIndex = data.index,
                self = this,
                swiperParameter = {
                    nextButton: '.swiper-button-next',
                    prevButton: '.swiper-button-prev',
                    loop: true,
                    loopedSlides: 0,
                    followFinger: false,
                    simulateTouch: false,
                    speed: 0,
                    initialSlide: startIndex,
                    onSlideChangeEnd: onSlideChangeEnd
                };
            // on slide change end handler of the swiper plugin
            function onSlideChangeEnd(swiper) {
                var activeSlideIndex = swiper.activeIndex - 1,
                    collectionLength = self.collection.length;
                if (activeSlideIndex < 0) { activeSlideIndex = activeSlideIndex + collectionLength; }
                if (activeSlideIndex >= collectionLength) { activeSlideIndex = activeSlideIndex % collectionLength; }
                self.blendSlideCaption(activeSlideIndex);
                self.preloadSlide(activeSlideIndex, slidesToPreload, 'left');
                self.preloadSlide(activeSlideIndex, slidesToPreload, 'right');
                // a11y
                swiper.slides[swiper.activeIndex].setAttribute('aria-selected', 'true');
                swiper.slides[swiper.previousIndex].setAttribute('aria-selected', 'false');
                EventDispatcher.trigger('viewer:displayeditem:change', {
                    index: activeSlideIndex,
                    model: self.collection.at(activeSlideIndex)
                });
            }

            // enable touch and swiping for iOS and Android first
            if (_.browser.iOS || _.browser.Android) {
                swiperParameter = _.extend(swiperParameter, {
                    followFinger: true,
                    simulateTouch: true,
                    speed: 300,
                    spaceBetween: 100
                });
            }

            // create slides from file collection and append them to the carousel
            this.collection.each(function (model, modelIndex) {
                carouselInner.append(self.createSlide(model, modelIndex));
            });

            // init the carousel and preload neighboring slides on next/prev
            prevSlide.attr({ title: gt('Previous'), tabindex: '1', role: 'button' });
            nextSlide.attr({ title: gt('Next'), tabindex: '1', role: 'button' });
            carouselRoot.attr('aria-label', gt('Use left/right arrow keys to navigate and escape key to exit the viewer.'));
            carouselRoot.append(carouselInner);

            // dont show next and prev buttons on iOS and Android
            if (!(_.browser.iOS || _.browser.Android)) {
                carouselRoot.append(prevSlide, nextSlide);
            }

            // append carousel to view
            this.$el.append(carouselRoot).attr({ tabindex: -1, role: 'main' });
            this.carouselRoot = carouselRoot;

            // initiate swiper deferred
            _.defer(function () {
                self.swiper = new window.Swiper('#viewer-carousel', swiperParameter);
                // always load duplicate slides of the swiper plugin.
                self.$el.find('.swiper-slide-duplicate').each(function (index, element) {
                    var slideIndex = $(element).data('swiper-slide-index'),
                        slideModel = self.collection.at(slideIndex);
                    TypesRegistry.getModelType(slideModel).loadSlide(slideModel, $(element));
                });
                // focus first active slide initially
                self.focusActiveSlide();
            });
            return this;
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
            if (!model) { return; }
            var modelType = TypesRegistry.getModelType(model);
            return modelType.createSlide(model, modelIndex);
        },

        /**
         * Loads a slide with calling loader implementations of passed
         * file type. If a slide is already loaded, it will be skipped.
         *
         * @param {Object} model
         *  the Viewer model.
         * @param {jQuery} slideElement
         *  the current slide element to be loaded.
         *
         * @returns {jQuery}
         */
        loadSlide: function (model, slideElement) {
            if (!model || slideElement.length === 0) { return; }
            var slideIndex = slideElement.data('swiper-slide-index'),
                modelType = TypesRegistry.getModelType(model);
            if (_.contains(this.loadedSlides, slideIndex)) { return; }
            this.loadedSlides.push(slideIndex);
            modelType.loadSlide(model, slideElement);
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
            //console.warn('DisplayerView.preloadSlide()', slideToLoad, preloadOffset, preloadDirection);
            var preloadOffset = preloadOffset || 0,
                step = preloadDirection === 'left' ? 1 : -1,
                slideToLoad = slideToLoad || 0,
                loadRange = _.range(slideToLoad, (preloadOffset + 1) * step + slideToLoad, step),
                collection = this.collection,
                slidesCount = collection.length,
                // filter out slide duplicates -> this looks like a bug in the swiper plugin.
                slidesList = this.$el.find('.swiper-slide').not('.swiper-slide-duplicate'),
                self = this;
            // load the load range, containing the requested slide and preload slides
            _.each(loadRange, function (index) {
                var slideIndex = index;
                if (slideIndex < 0) { slideIndex = slideIndex + slidesCount; }
                if (slideIndex >= slidesCount) { slideIndex = slideIndex % slidesCount; }
                var slideModel = collection.at(slideIndex),
                    slideElement = slidesList.eq(slideIndex);
                self.loadSlide(slideModel, slideElement);
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
            //console.warn('BlendslideCaption', slideIndex);
            var duration = duration || 3000,
                // filter swiper slide duplicates -> likely a bug from swiper plugin
                slideCaption = this.$el.find('.swiper-slide').not('.swiper-slide-duplicate').eq(slideIndex).find('.viewer-displayer-caption');
            window.clearTimeout(this.captionTimeoutId);
            slideCaption.show();
            this.captionTimeoutId = window.setTimeout(function () {
                slideCaption.fadeOut();
            }, duration);
        },

        // focuses the swiper's current active slide
        focusActiveSlide: function () {
            this.$el.find('.swiper-slide-active').focus();
        },

        dispose: function () {
            //console.info('DisplayerView.dispose()', this.swiper);
            this.swiper.destroy();
            this.stopListening();
            return this;
        }
    });

    return DisplayerView;
});
