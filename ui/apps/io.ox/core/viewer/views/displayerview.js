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
            this.slidesToCache = 3;
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
                prevSlide = $('<a href="#" class="swiper-button-prev swiper-button-control left" role="button" aria-controls="viewer-carousel"><i class="fa fa-angle-left" aria-hidden="true"></i></a>'),
                nextSlide = $('<a href="#" class="swiper-button-next swiper-button-control right" role="button" aria-controls="viewer-carousel"><i class="fa fa-angle-right" aria-hidden="true"></i></a>'),
                startIndex = data.index,
                self = this,
                swiperParameter = {
                    nextButton: '.swiper-button-next',
                    prevButton: '.swiper-button-prev',
                    loop: true,
                    loopedSlides: 0,
                    followFinger: false,
                    simulateTouch: false,
                    noSwiping: true,
                    speed: 0,
                    initialSlide: startIndex,
                    runCallbacksOnInit: false,
                    onSlideChangeEnd: this.onSlideChangeEnd.bind(this)
                };
            // enable touch and swiping for iOS and Android first
            if (_.browser.iOS || _.browser.Android) {
                swiperParameter = _.extend(swiperParameter, {
                    followFinger: true,
                    simulateTouch: true,
                    speed: 300,
                    spaceBetween: 100
                });
            }

            // disable swiping and hide navigation if there is only one slide.
            if (this.collection.length === 1) {
                swiperParameter.onlyExternal = true;
                prevSlide.hide();
                nextSlide.hide();
            }

            // create slides from file collection and append them to the carousel
            this.collection.each(function (model, modelIndex) {
                carouselInner.append(self.createSlide(model, modelIndex));
            });

            // init the carousel and preload neighboring slides on next/prev
            prevSlide.attr({ title: gt('Previous'), tabindex: '1', role: 'button', 'aria-label': gt('Previous') });
            nextSlide.attr({ title: gt('Next'), tabindex: '1', role: 'button', 'aria-label': gt('Next') });
            carouselRoot.attr('aria-label', gt('Use left/right arrow keys to navigate and escape key to exit the viewer.'));
            carouselRoot.append(carouselInner);

            // dont show next and prev buttons on iOS and Android
            if (!(_.browser.iOS || _.browser.Android)) {
                carouselRoot.append(prevSlide, nextSlide);
            }

            // append carousel to view
            this.$el.append(carouselRoot).attr({ tabindex: -1, role: 'main' });
            this.carouselRoot = carouselRoot;

            // deferred render actions
            _.defer(function () {
                // initiate swiper
                self.swiper = new window.Swiper('#viewer-carousel', swiperParameter);

                // always load duplicate slides of the swiper plugin.
                self.$el.find('.swiper-slide-duplicate').each(function (index, element) {
                    var slideNode = $(element),
                        slideIndex = slideNode.data('swiper-slide-index'),
                        slideModel = self.collection.at(slideIndex);

                    TypesRegistry.getModelType(slideModel)
                    .done(function (modelType) {
                        // when the duplicate slide is copied, the original slide consist only of an empty <div> element.
                        // so we need to add the slide content before loading the slide.
                        slideNode.empty().append(modelType.createSlide(slideModel, slideIndex).children());
                        // now load the slide.
                        modelType.loadSlide(slideModel, slideNode);
                    })
                    .fail(function () {
                        console.error('cannot require a model type for', slideModel.get('filename'));
                    });
                });

                // preload selected file and its neighbours initially
                self.blendSlideCaption(startIndex);
                self.preloadSlide(startIndex, 'left');
                self.preloadSlide(startIndex, 'right');
                // focus first active slide initially
                self.focusActiveSlide();
            });
            return this;
        },

        /**
         * Create a Swiper slide element.
         * The root node is returned immediately, but the content
         * is applied asynchronously.
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

            var slide = $('<div class="swiper-slide" tabindex="-1" role="option" aria-selected="false">');

            TypesRegistry.getModelType(model)
            .done(function (modelType) {
                slide.append(modelType.createSlide(model, modelIndex).children());
            })
            .fail(function () {
                console.error('Displayerview.createSlide() - cannot require a model type for', model.get('filename'));
            });

            return slide;
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
            var slideIndex = slideElement.data('swiper-slide-index');
            //slideElement.addClass('loaded');
            TypesRegistry.getModelType(model)
            .done(function (modelType) {
                if (_.contains(this.loadedSlides, slideIndex)) { return; }
                this.loadedSlides.push(slideIndex);
                modelType.loadSlide(model, slideElement);
                //slideElement.addClass('loaded');
            }.bind(this))
            .fail(function () {
                console.error('Displayerview.loadSlide() - cannot require a model type for', model.get('filename'));
            });
        },

        /**
         * Load the given slide index and additionally number of neigboring slides in the given direction.
         *
         * @param {Number} slideToLoad
         *  The current active slide to be loaded.
         *
         * @param {String} preloadDirection
         *  Direction of the preload: 'left' or 'right' are supported.
         *
         * @param {Number} preloadOffset
         *  Number of neighboring slides to preload. Defaults to 2.
         *
         */
        preloadSlide: function (slideToLoad, preloadDirection, preloadOffset) {
            //console.warn('DisplayerView.preloadSlide()', slideToLoad, preloadOffset, preloadDirection);
            var preloadOffset = preloadOffset || 3,
                step = preloadDirection === 'right' ? 1 : -1,
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
                slideCaption = this.$el.find('.swiper-slide[data-swiper-slide-index=' + slideIndex + '] .viewer-displayer-caption');
            window.clearTimeout(this.captionTimeoutId);
            slideCaption.show();
            this.captionTimeoutId = window.setTimeout(function () {
                slideCaption.fadeOut();
            }, duration);
        },

        /**
         * Focuses the swiper's current active slide.
         */
        focusActiveSlide: function () {
            this.$el.find('.swiper-slide-active').focus();
        },

        /**
         * Handler for the slideChangeEnd event of the swiper plugin.
         * - preload neighboring slides
         * - broadcast 'viewer:displayeditem:change' event
         * - add a11y attributes
         *
         * @param swiper
         */
        onSlideChangeEnd: function (swiper) {
            var activeSlideIndex = swiper.activeIndex - 1,
                collectionLength = this.collection.length,
                preloadDirection = (swiper.previousIndex < swiper.activeIndex) ? 'right' : 'left',
                mediaSlide;
            // recalculate swiper active slide index, disregarding duplicate slides.
            if (activeSlideIndex < 0) { activeSlideIndex = activeSlideIndex + collectionLength; }
            if (activeSlideIndex >= collectionLength) { activeSlideIndex = activeSlideIndex % collectionLength; }
            this.blendSlideCaption(activeSlideIndex);
            this.preloadSlide(activeSlideIndex, preloadDirection);
            // a11y
            swiper.slides[swiper.activeIndex].setAttribute('aria-selected', 'true');
            swiper.slides[swiper.previousIndex].setAttribute('aria-selected', 'false');
            // pause playback on audio and video slides
            mediaSlide = $(swiper.slides[swiper.previousIndex]).find('audio, video');
            if (mediaSlide.length > 0) {
                mediaSlide[0].pause();
            }
            EventDispatcher.trigger('viewer:displayeditem:change', {
                index: activeSlideIndex,
                model: this.collection.at(activeSlideIndex)
            });
            this.unloadDistantSlides(activeSlideIndex);
        },

        /**
         * Unloads slides that are outside of a 'cached' slide range, to prevent bloating of OX Viewer
         * DOM Elements if we encounter a folder with a lot of files.
         *
         * The cached slide range is a array of slide indexes built from the current active slide index
         * plus the preload offset in both directions.
         * Example: if active slide is 7 with a preload offset of 3, the range would be: [4,5,6,7,8,9,10]
         *
         * @param activeSlideIndex
         *  Current active swiper slide index
         */
        unloadDistantSlides: function (activeSlideIndex) {
            //console.warn('DisplayerView.unloadDistantSlides() start', JSON.stringify(this.loadedSlides.sort()), activeSlideIndex);
            var self = this,
                slidesToCache = this.slidesToCache,
                slidesCount = this.collection.length,
                cachedRange = getCachedRange(activeSlideIndex),
                slidesWrapper = this.swiper.wrapper;
            function getCachedRange(activeSlideIndex) {
                var cachedRange = [],
                    rightRange = _.range(activeSlideIndex, activeSlideIndex + slidesToCache + 1, 1),
                    leftRange = _.range(activeSlideIndex, activeSlideIndex - slidesToCache - 1, -1),
                    rangeUnion = _.union(leftRange, rightRange);
                _.each(rangeUnion, function (index) {
                    if (index < 0) { index = slidesCount + index; }
                    if (index > (slidesCount - 1)) { index = index - slidesCount;}
                    cachedRange.push(index);
                });
                return cachedRange;
            }
            _.each(self.loadedSlides, function (index) {
                if (_.contains(cachedRange, index)) { return; }
                var slideToUnload = slidesWrapper.find('[data-swiper-slide-index="' + index + '"]'),
                    model = self.collection.at(index);
                TypesRegistry.getModelType(model).done(function (modelType) {
                    modelType.unloadSlide(slideToUnload);
                    self.loadedSlides = _.without(self.loadedSlides, index);
                });
            });
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
