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
    'io.ox/files/api',
    'io.ox/core/viewer/eventdispatcher',
    'io.ox/core/viewer/views/types/typesregistry',
    'io.ox/backbone/disposable',
    'io.ox/core/viewer/util',
    'gettext!io.ox/core',
    'static/3rd.party/swiper/swiper.jquery.js',
    'css!3rd.party/swiper/swiper.css'
], function (FilesAPI, EventDispatcher, TypesRegistry, DisposableView, Util, gt) {

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
            // run own disposer function at global dispose
            this.on('dispose', this.disposeView.bind(this));
            // timeout object for the slide caption
            this.captionTimeoutId = null;
            // array of all slide content Backbone Views
            this.slideViews = [];
            // local array of loaded slide indices.
            this.loadedSlides = [];
            // local cache of scroll positions of documents
            this.documentScrollPositions = [];
            // number of slides to be prefetched in the left/right direction of the active slide
            this.preloadOffset = 3;
            // number of slides to be kept loaded at one time in the browser.
            this.slidesToCache = 7;
            // instance of the swiper plugin
            this.swiper = null;
            // listen to blend caption events
            this.listenTo(EventDispatcher, 'viewer:blendcaption', this.blendCaption);
            // listen to delete event propagation from FilesAPI
            this.listenTo(FilesAPI, 'remove:file', this.onFileRemoved.bind(this));
        },

        /**
         * Renders this DisplayerView with the supplied model.
         *
         *  @param {Object} model
         *   The file model object.
         *
         * @returns {DisplayerView}
         */
        render: function (model) {
            //console.warn('DisplayerView.render() data', data);
            if (!model) {
                console.error('Core.Viewer.DisplayerView.render(): no file to render');
                return;
            }

            var carouselRoot = $('<div id="viewer-carousel" class="swiper-container" role="listbox">'),
                carouselInner = $('<div class="swiper-wrapper">'),
                prevSlide = $('<a href="#" class="swiper-button-prev swiper-button-control left" role="button" aria-controls="viewer-carousel"><i class="fa fa-angle-left" aria-hidden="true"></i></a>'),
                nextSlide = $('<a href="#" class="swiper-button-next swiper-button-control right" role="button" aria-controls="viewer-carousel"><i class="fa fa-angle-right" aria-hidden="true"></i></a>'),
                caption = $('<div class="viewer-displayer-caption">'),
                startIndex = this.collection.getStartIndex(),
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
                    onSlideChangeEnd: this.onSlideChangeEnd.bind(this),
                    onSlideChangeStart: this.onSlideChangeStart.bind(this)
                };

            // enable touch and swiping for 'smartphone' devices
            if (_.device('smartphone') || _.device('tablet')) {
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
            this.$el.append(carouselRoot, caption).attr({ tabindex: -1, role: 'main' });
            this.carouselRoot = carouselRoot;

            // create slides from file collection and append them to the carousel
            this.createSlides(carouselInner)
            .done(function () {
                // initiate swiper
                self.swiper = new window.Swiper('#viewer-carousel', swiperParameter);
                // overwrite the original removeSlide function because its buggy
                self.swiper.removeSlide = self.removeSlide;
                // always load duplicate slides of the swiper plugin.
                self.handleDuplicatesSlides();
                // preload selected file and its neighbours initially
                self.loadSlide(startIndex, 'both');
                self.blendCaption(gt('%1$d of %2$d', startIndex + 1, self.collection.length));
                // focus first active slide initially
                self.focusActiveSlide();
            })
            .fail(function () {
                console.warn('DisplayerView.createSlides() - some errors occured:', arguments);
            });

            return this;
        },

        /**
         * Creates the corresponding type view for duplicate slides of the swiper plugin and render them.
         */
        handleDuplicatesSlides: function () {
            var self = this;
            this.$el.find('.swiper-slide-duplicate').each(function (index, element) {
                var slideNode = $(element),
                    slideIndex = slideNode.data('swiper-slide-index'),
                    slideModel = self.collection.at(slideIndex);

                TypesRegistry.getModelType(slideModel)
                    .then(function (ModelType) {
                        var view = new ModelType({ model: slideModel, collection: self.collection, el: element });
                        view.render().prefetch().show();
                    },
                    function () {
                        console.warn('Cannot require a view type for', slideModel.get('filename'));
                    });
            });
        },

        /**
         * Creates the Swiper slide elements.
         * For each Viewer model in the Viewer collection the model type
         * is required asynchronously and the slide content is created.
         * After all slides where successfully created, they are appended
         * to the given DOM node.
         *
         * @param {jQuery} node
         *  the jQuery element to attach the created slides to.
         *
         * @returns {jQuery.Promise}
         *  a Promise of a Deferred object that will be resolved with an array
         *  of jQuery slide elements; or rejected with an array of error strings,
         *  in case of an error.
         */
        createSlides: function (node) {
            var promises = [],
                collection = this.collection,
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
                    return def.reject('Cannot require a view type for ', model.get('filename'));
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
         * Load the given slide index and additionally number of neigboring slides in the given direction.
         *
         * @param {Number} slideToLoad
         *  The index of the current active slide to be loaded.
         *
         * @param {String} [prefetchDirection = 'right']
         *  Direction of the prefetch: 'left', 'right' or 'both' are supported.
         *  Example: if slideToLoad is 7 with a preloadOffset of 3, the range to load would be for
         *      'left': [4,5,6,7]
         *      'right':      [7,8,9,10]
         *      'both': [4,5,6,7,8,9,10]
         */
        loadSlide: function (slideToLoad, prefetchDirection) {
            //console.warn('DisplayerView.loadSlide()', slideToLoad, preloadDirection);

            var self = this,
                slideToLoad = slideToLoad || 0,
                slidesCount = this.collection.length,
                activeModel = this.collection.at(slideToLoad),
                previousModel = this.collection.at(this.swiper.previousIndex - 1) || null,
                rightRange,
                leftRange,
                loadRange;

            switch (prefetchDirection) {
            case 'left':
                loadRange = _.range(slideToLoad, slideToLoad - (this.preloadOffset + 1), -1);
                break;

            case 'right':
                loadRange = _.range(slideToLoad, slideToLoad + this.preloadOffset + 1, 1);
                break;

            case 'both':
                rightRange = _.range(slideToLoad, slideToLoad + this.preloadOffset + 1, 1);
                leftRange = _.range(slideToLoad, slideToLoad - (this.preloadOffset + 1), -1);
                loadRange = _.union(leftRange, rightRange);
                break;

            default:
                loadRange = [slideToLoad];
                break;
            }

            // prefetch data of the slides within the preload offset range
            _.each(loadRange, function (index) {
                var slideIndex = index;
                if (slideIndex < 0) {
                    slideIndex = slideIndex + slidesCount;
                } else if (slideIndex >= slidesCount) {
                    slideIndex = slideIndex % slidesCount;
                }

                if ((slideIndex >= 0) && !self.isSlideLoaded(slideIndex)) {
                    self.slideViews[slideIndex].prefetch();
                    self.loadedSlides.push(slideIndex);
                }
            });

            // show active slide
            this.slideViews[slideToLoad].show();

            // remove listener from previous and attach to current model
            if (previousModel) {
                this.stopListening(previousModel, 'change:version', this.onModelChangeVersion);
            }
            this.listenTo(activeModel, 'change:version', this.onModelChangeVersion.bind(this));
        },

        /**
         * Returns true if the slide has been loaded (by prefetching it's data or showing the slide).
         * Otherwise false.
         *
         * @return {Boolean}
         *  returns true if the slide is loaded.
         */
        isSlideLoaded: function (slideIndex) {
            return _.contains(this.loadedSlides, slideIndex);
        },

        /**
         * Handles file version change events.
         * Loads the type model and renders the new slide content.
         *
         * @param {Object} model
         *   The changed model.
         */
        onModelChangeVersion: function (model) {
            //console.log('DisplayerView.onModelChangeVersion()', 'changed:', model.changed);
            var index = this.collection.indexOf(model),
                slideNode = this.slideViews[index].$el;

            // unload current slide content
            this.slideViews[index].unload();
            // load model and create new slide slide content
            TypesRegistry.getModelType(model)
            .then(function (ModelType) {
                var view = new ModelType({ model: model, collection: this.collection, el: slideNode });
                view.render().prefetch().show();
                this.slideViews[index] = view;
            }.bind(this),
            function () {
                console.warn('Cannot require a view type for', model.get('filename'));
            });
        },
        /**
         * Blends in the passed content element in a caption for a specific duration.
         *
         * @param {String} text
         *  Text to be displayed in the caption.
         *
         * @param {Number} duration
         *  Duration of the blend-in in milliseconds. Defaults to 3000 ms.
         */
        blendCaption: function (text, duration) {
            //console.warn('BlendslideCaption', slideIndex);
            var duration = duration || 3000,
                slideCaption = this.$el.find('.viewer-displayer-caption'),
                captionContent = $('<div class="caption-content">').text(text);
            slideCaption.empty().append(captionContent);
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
            //#. text of a viewer slide caption
            //#. Example result: "1 of 10"
            //#. %1$d is the slide index of the current
            //#. %2$d is the total slide count
            this.blendCaption(gt('%1$d of %2$d', activeSlideIndex + 1, this.collection.length));
            this.loadSlide(activeSlideIndex, preloadDirection);
            // a11y
            swiper.slides[swiper.activeIndex].setAttribute('aria-selected', 'true');
            swiper.slides[swiper.previousIndex].setAttribute('aria-selected', 'false');
            // pause playback on audio and video slides
            mediaSlide = $(swiper.slides[swiper.previousIndex]).find('audio, video');
            if (mediaSlide.length > 0) {
                mediaSlide[0].pause();
            }
            EventDispatcher.trigger('viewer:displayeditem:change', this.collection.at(activeSlideIndex));
            this.unloadDistantSlides(activeSlideIndex);
            // scroll to last position, if exists
            var lastScrollPosition = this.documentScrollPositions[activeSlideIndex] || 0,
                activeView = this.slideViews[activeSlideIndex],
                displayerEl = this.$el;
            if (activeView.pdfDocument && displayerEl) {
                activeView.pdfDocument.getLoadPromise().done(function () {
                    displayerEl.find('[data-swiper-slide-index="' + activeSlideIndex + '"]').scrollTop(lastScrollPosition);
                });
            }
        },

        /**
         * Slide change start handler:
         * - save scroll positions of each slide while leaving it.
         *
         * @param {Swiper} swiper
         *  the instance of the swiper plugin
         */
        onSlideChangeStart: function (swiper) {
            var previousIndex = swiper.previousIndex - 1,
                activeSlideView = this.slideViews[previousIndex],
                scrollPosition = activeSlideView.$el.scrollTop();
            this.documentScrollPositions[previousIndex] = scrollPosition;
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
                cachedRange = getCachedRange(activeSlideIndex),
                slidesToUnload;

            function getCachedRange(activeSlideIndex) {
                var cachedRange = [],
                    rightRange = _.range(activeSlideIndex, activeSlideIndex + cacheOffset + 1, 1),
                    leftRange = _.range(activeSlideIndex, activeSlideIndex - cacheOffset - 1, -1),
                    rangeUnion = _.union(leftRange, rightRange);
                _.each(rangeUnion, function (index) {
                    if (index < 0) { index = Math.abs(slidesCount + index); }
                    if (index > (slidesCount - 1)) { index = index % slidesCount; }
                    cachedRange.push(index);
                });
                return cachedRange;
            }

            slidesToUnload = _.difference(self.loadedSlides, cachedRange);
            _.each(slidesToUnload, function (index) {
                self.slideViews[index].unload();
            });
            this.loadedSlides = cachedRange;
        },

        /**
         * File remove handler.
         *
         * @param {jQueryEvent} event
         *  a jQuery Event object
         *
         * @param {Array} removedFiles
         *  an array consisting of objects representing file models.
         */
        onFileRemoved: function (event, removedFiles) {
            //console.warn('DisplayerView.onFileRemoved()', removedFiles);
            if (!_.isArray(removedFiles) || removedFiles.length < 1) {
                return;
            }
            // identify removed models
            var removedFileCid = removedFiles[0].cid,
                removedFileModel = this.collection.get(removedFileCid),
                removedFileModelIndex = this.collection.indexOf(removedFileModel);
            // remove the deleted file(s) from Viewer collection
            this.collection.remove(removedFileModel);
            // reset the invalidated local loaded slides array
            this.loadedSlides = [];
            // reset document scroll positions
            this.documentScrollPositions = [];
            // remove corresponding view type of the file
            this.slideViews.splice(removedFileModelIndex, 1);
            // remove slide from the swiper plugin
            this.swiper.removeSlide(removedFileModelIndex + 1);
            // render the duplicate slides
            this.handleDuplicatesSlides();
            // close viewer we don't have any files to show
            if (this.collection.length === 0) {
                EventDispatcher.trigger('viewer:close');
                return;
            }
            // do a swiper change end manually, because the plugin is not doing it (maybe a bug)
            this.onSlideChangeEnd(this.swiper);
        },

        /**
         * This remove slide function overwrites the original function from the swiper plugin,
         * because it is buggy. (v.3.0.6, slide duplicates are not restored after removing slides)
         *
         * @param {Number | Array } slidesIndexes
         *  the index of the slide to be removed, as a Number or Array.
         */
        removeSlide: function (slidesIndexes) {
            //console.warn('Custom removeSlide()', slidesIndexes);
            if (this.params.loop) {
                this.destroyLoop();
            }
            var newActiveIndex = this.activeIndex,
                indexToRemove;
            if (typeof slidesIndexes === 'object' && slidesIndexes.length) {
                for (var i = 0; i < slidesIndexes.length; i++) {
                    indexToRemove = slidesIndexes[i];
                    if (this.slides[indexToRemove]) this.slides.eq(indexToRemove).remove();
                    if (indexToRemove < newActiveIndex) newActiveIndex--;
                }
                newActiveIndex = Math.max(newActiveIndex, 0);
            } else {
                indexToRemove = slidesIndexes;
                if (this.slides[indexToRemove]) this.slides.eq(indexToRemove).remove();
                if (indexToRemove < newActiveIndex) newActiveIndex--;
                newActiveIndex = Math.max(newActiveIndex, 0);
            }
            if (this.params.loop) {
                this.createLoop();
            }
            if (!(this.params.observer && this.support.observer)) {
                this.update(true);
            }
            var slidesCount = this.slides.not('.swiper-slide-duplicate').length;
            if (newActiveIndex >= slidesCount) {
                newActiveIndex = slidesCount;
            }
            this.slideTo(newActiveIndex, 0, true);
        },

        disposeView: function () {
            //console.info('DisplayerView.disposeView()', this.swiper);
            this.swiper.removeAllSlides();
            this.swiper.destroy();
            this.swiper = null;
            this.captionTimeoutId = null;
            this.loadedSlides = null;
            this.slideViews = null;
            return this;
        }
    });

    return DisplayerView;
});
