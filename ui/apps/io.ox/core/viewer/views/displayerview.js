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
    'io.ox/core/viewer/views/types/typesregistry',
    'io.ox/backbone/disposable',
    'io.ox/core/viewer/util',
    'gettext!io.ox/core',
    'static/3rd.party/swiper/swiper.jquery.js',
    'css!3rd.party/swiper/swiper.css'
], function (EventDispatcher, TypesRegistry, DisposableView, Util, gt) {

    'use strict';

    /**
     * The displayer view is responsible for displaying preview images,
     * launching music or video players, or displaying pre-rendered OX Docs
     * document previews (TBD)
     */
    var DisplayerView = DisposableView.extend({

        className: 'viewer-displayer',

        initialize: function () {
            //console.warn('DisplayerView.initialize()');
            // The slide index which this view should display at start.
            // This index originates from the selected file in OX Drive folder.
            this.displayedFileIndex = this.collection.getStartIndex();
            // run own disposer function at global dispose
            this.on('dispose', this.disposeView.bind(this));
            // timeout object for the slide caption
            this.captionTimeoutId = null;
            // array of all slide content Backbone Views
            this.slideViews = [];
            // local array of loaded slide indices.
            this.loadedSlides = [];
            // number of slides to be preloaded in the left/right direction of the active slide
            this.preloadOffset = 3;
            // number of slides to be kept loaded at one time in the browser.
            this.slidesToCache = 7;
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

            // enable touch and swiping for 'smartphone' devices
            if (Util.COMPACT_DEVICE) {
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

            // init the carousel and preload neighboring slides on next/prev
            prevSlide.attr({ title: gt('Previous'), tabindex: '1', role: 'button', 'aria-label': gt('Previous') });
            nextSlide.attr({ title: gt('Next'), tabindex: '1', role: 'button', 'aria-label': gt('Next') });
            carouselRoot.attr('aria-label', gt('Use left/right arrow keys to navigate and escape key to exit the viewer.'));
            carouselRoot.append(carouselInner);

            // only show next and prev buttons on desktop
            if (_.device('desktop')) {
                carouselRoot.append(prevSlide, nextSlide);
            }

            // append carousel to view
            this.$el.append(carouselRoot).attr({ tabindex: -1, role: 'main' });
            this.carouselRoot = carouselRoot;

            // create slides from file collection and append them to the carousel
            this.createSlides(this.collection, carouselInner)
            .done(function () {
                // initiate swiper
                self.swiper = new window.Swiper('#viewer-carousel', swiperParameter);

                // always load duplicate slides of the swiper plugin.
                self.$el.find('.swiper-slide-duplicate').each(function (index, element) {
                    var slideNode = $(element),
                        slideIndex = slideNode.data('swiper-slide-index'),
                        slideModel = self.collection.at(slideIndex);

                    TypesRegistry.getModelType(slideModel)
                    .then(function (ModelType) {
                        var view = new ModelType({ model: slideModel, collection: self.collection, el: element });
                        view.render().load();
                    },
                    function () {
                        console.warn('Cannot require a view type for', slideModel.get('filename'));
                    });

                });

                // preload selected file and its neighbours initially
                self.blendSlideCaption(startIndex);
                self.preloadSlide(startIndex, 'left', self.preloadOffset);
                self.preloadSlide(startIndex, 'right', self.preloadOffset);
                // focus first active slide initially
                self.focusActiveSlide();

            }.bind(this))

            .fail(function () {
                console.warn('DisplayerView.createSlides() - some errors occured:', arguments);
            });

            return this;
        },

        /**
         * Creates the Swiper slide elements.
         * For each Viewer model in the Viewer collection the model type
         * is required asynchronously and the slide content is created.
         * After all slides where successfully created, they are appended
         * to the given DOM node.
         *
         * @param {Object} collection
         *  the Viewer collection to create the slides from.
         *
         * @param {jQuery} node
         *  the jQuery element to attach the created slides to.
         *
         * @returns {jQuery.Promise}
         *  a Promise of a Deferred object that will be resolved with an array
         *  of jQuery slide elements; or rejected with an array of error strings,
         *  in case of an error.
         */
        createSlides: function (collection, node) {
            var promises = [],
                resultDef;

            collection.each(function (model) {
                var def = new $.Deferred();

                TypesRegistry.getModelType(model)
                .then(function (ModelType) {
                    var view = new ModelType({ model: model, collection: collection });
                    view.render();
                    return def.resolve(view);
                },
                function () {
                    return def.reject('Cannot require a view type for', model.get('filename'));
                });

                promises.push(def);
            });

            resultDef = $.when.apply(null, promises);

            resultDef.done(function () {
                // in case of 'done' the arguments array contains the View instances
                for (var i = 0; i < arguments.length; i++) {
                    var view = arguments[i];
                    this.slideViews.push(view);
                    node.append(view.el);
                }
            }.bind(this));

            return resultDef;
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
        loadSlide: function (slideIndex, model, slideElement) {
            if (!model || slideElement.length === 0) { return; }
            if (_.contains(this.loadedSlides, slideIndex)) { return; }

            this.slideViews[slideIndex].load();
            this.loadedSlides.push(slideIndex);
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
                self.loadSlide(slideIndex, slideModel, slideElement);
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
            this.preloadSlide(activeSlideIndex, preloadDirection, this.preloadOffset);
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
                cacheOffset = Math.floor(this.slidesToCache / 2),
                slidesCount = this.collection.length,
                cachedRange = getCachedRange(activeSlideIndex);

            function getCachedRange(activeSlideIndex) {
                var cachedRange = [],
                    rightRange = _.range(activeSlideIndex, activeSlideIndex + cacheOffset + 1, 1),
                    leftRange = _.range(activeSlideIndex, activeSlideIndex - cacheOffset - 1, -1),
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

                self.slideViews[index].unload();
                self.loadedSlides = _.without(self.loadedSlides, index);
            });
        },

        disposeView: function () {
            //console.info('DisplayerView.disposeView()', this.swiper);
            this.swiper.removeAllSlides();
            this.swiper.destroy();
            this.swiper = null;
            this.displayedFileIndex = null;
            this.captionTimeoutId = null;
            this.loadedSlides = null;
            return this;
        }
    });

    return DisplayerView;
});
