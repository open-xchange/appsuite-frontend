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
                prevSlide = $('<a href="#" class="swiper-button-prev swiper-button-control left" role="button" aria-controls="viewer-carousel"><i class="fa fa-angle-left" aria-hidden="true"></i></a>'),
                nextSlide = $('<a href="#" class="swiper-button-next swiper-button-control right" role="button" aria-controls="viewer-carousel"><i class="fa fa-angle-right" aria-hidden="true"></i></a>'),
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
                self.blendSlideCaption(data.index);
                self.preloadSlide(data.index, slidesToPreload, 'left');
                self.preloadSlide(data.index, slidesToPreload, 'right');
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
            //console.warn('DisplayerView.loadSlide()', this.loadedSlides);
            if (!model || slideElement.length === 0) { return; }

            var slideIndex = slideElement.data('swiper-slide-index');
            if (_.contains(this.loadedSlides, slideIndex)) { return; }

            TypesRegistry.getModelType(model)
            .done(function (modelType) {
                this.loadedSlides.push(slideIndex);
                modelType.loadSlide(model, slideElement);

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
         * @param {Number} preloadOffset
         *  Number of neighboring slides to preload. Defaults to 2.
         *
         * @param {String} preloadDirection
         *  Direction of the preload: 'left' or 'right' are supported.
         *
         */
        preloadSlide: function (slideToLoad, preloadOffset, preloadDirection) {
            //console.warn('DisplayerView.preloadSlide()', slideToLoad, preloadOffset, preloadDirection);
            var preloadOffset = preloadOffset || 2,
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
            //console.warn('onSlideChangeEnd()', swiper.activeIndex);
            var activeSlideIndex = swiper.activeIndex - 1,
                collectionLength = this.collection.length;
            // recalculate swiper active slide index, disregarding duplicate slides.
            if (activeSlideIndex < 0) { activeSlideIndex = activeSlideIndex + collectionLength; }
            if (activeSlideIndex >= collectionLength) { activeSlideIndex = activeSlideIndex % collectionLength; }
            this.blendSlideCaption(activeSlideIndex);
            this.preloadSlide(activeSlideIndex, null, 'left');
            this.preloadSlide(activeSlideIndex, null, 'right');
            // a11y
            swiper.slides[swiper.activeIndex].setAttribute('aria-selected', 'true');
            swiper.slides[swiper.previousIndex].setAttribute('aria-selected', 'false');
            EventDispatcher.trigger('viewer:displayeditem:change', {
                index: activeSlideIndex,
                model: this.collection.at(activeSlideIndex)
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
