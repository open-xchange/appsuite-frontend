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
    'io.ox/core/viewer/views/types/typesregistry',
    'io.ox/backbone/disposable',
    'io.ox/core/viewer/util',
    'gettext!io.ox/core',
    'static/3rd.party/swiper/swiper.jquery.js',
    'css!3rd.party/swiper/swiper.css'
], function (FilesAPI, TypesRegistry, DisposableView, Util, gt) {

    'use strict';

    /**
     * The displayer view is responsible for displaying preview images,
     * launching music or video players, or displaying pre-rendered OX Docs
     * document previews (TBD)
     */
    var DisplayerView = DisposableView.extend({

        className: 'viewer-displayer',

        initialize: function (options) {
            _.extend(this, options);
            // run own disposer function at global dispose
            this.on('dispose', this.disposeView.bind(this));
            // timeout object for the slide caption
            this.captionTimeoutId = null;
            // timeout object for navigation items
            this.navigationTimeoutId = null;
            // array of all slide content Backbone Views
            this.slideViews = {};
            // array of slide duplicate views
            this.slideDuplicateViews = [];
            // local array of loaded slide indices.
            this.loadedSlides = [];
            // number of slides to be prefetched in the left/right direction of the active slide (minimum of 1 required)
            this.preloadOffset = 3;
            // number of slides to be kept loaded at one time in the browser.
            this.slidesToCache = 7;
            // instance of the swiper plugin
            this.swiper = null;
            // listen to blend caption events
            this.listenTo(this.viewerEvents, 'viewer:blendcaption', this.blendCaption);
            this.listenTo(this.viewerEvents, 'viewer:blendnavigation', this.blendNavigation);
            // listen to delete event propagation from FilesAPI
            this.listenTo(FilesAPI, 'remove:file', this.onFileRemoved.bind(this));
            // blend in navigation by user activity
            this.$el.on('mousemove click', _.throttle(this.blendNavigation.bind(this), 500));
            // listen to version change events
            this.listenTo(this.collection, 'change:version', this.onModelChangeVersion.bind(this));
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
                    loop: !this.standalone,
                    loopedSlides: 0,
                    followFinger: false,
                    simulateTouch: false,
                    noSwiping: true,
                    speed: 0,
                    runCallbacksOnInit: false,
                    onSlideChangeEnd: this.onSlideChangeEnd.bind(this),
                    onSlideChangeStart: this.onSlideChangeStart.bind(this)
                };

            if (startIndex < this.preloadOffset) {
                swiperParameter.initialSlide = startIndex;
            } else if (startIndex >= this.collection.length - this.preloadOffset) {
                swiperParameter.initialSlide = 2 * this.preloadOffset - this.collection.length + startIndex + 1;
            } else {
                swiperParameter.initialSlide = this.preloadOffset;
            }

            // enable touch and swiping for mobile devices
            if (_.device('smartphone') || _.device('tablet')) {
                swiperParameter = _.extend(swiperParameter, {
                    followFinger: true,
                    simulateTouch: true,
                    speed: 300,
                    spaceBetween: 100
                });
            }

            // save model to view
            this.model = model;

            // init the carousel and preload neighboring slides on next/prev
            prevSlide.attr({ title: gt('Previous'), tabindex: '1', role: 'button', 'aria-label': gt('Previous') });
            nextSlide.attr({ title: gt('Next'), tabindex: '1', role: 'button', 'aria-label': gt('Next') });
            carouselRoot.attr('aria-label', gt('Use left/right arrow keys to navigate and escape key to exit the viewer.'));
            carouselRoot.append(carouselInner);
            if (this.collection.length > 1) {
                carouselRoot.append(prevSlide, nextSlide);
            }

            // append carousel to view
            this.$el.append(carouselRoot, caption).attr({ tabindex: -1, role: 'main' });
            this.carouselRoot = carouselRoot;
            this.carouselInner = carouselInner;
            this.activeIndex = startIndex;

            // create slides from file collection and append them to the carousel
            this.createSlides(startIndex).then(function success() {
                if (self.disposed) {
                    return;
                }
                // initiate swiper
                self.swiper = new window.Swiper(self.carouselRoot[0], swiperParameter);
                if (self.collection.length <= 1) self.swiper.lockSwipes();
                // always load duplicate slides of the swiper plugin.
                self.handleDuplicatesSlides();
                // preload selected file and its neighbours initially
                self.slideViews[self.activeIndex].show();
                self.blendCaption(gt('%1$d of %2$d', startIndex + 1, self.collection.length));
                self.blendNavigation();
                // focus first active slide initially
                self.focusActiveSlide();
            }, function fail() {
                console.warn('DisplayerView.createSlides() - some errors occured:', arguments);
            });

            return this;
        },

        /**
         * Creates the corresponding type view for duplicate slides of the swiper plugin and render them.
         */
        handleDuplicatesSlides: function () {
            var self = this,
                first = this.$el.find('.swiper-slide-duplicate[data-index="0"]'),
                last = this.$el.find('.swiper-slide-duplicate[data-index="' + (this.collection.length - 1) + '"]');

            function handle(el, model) {
                TypesRegistry.getModelType(model).then(function success(ModelTypeView) {
                    var view = new ModelTypeView({
                        el: el.get(0),
                        model: model,
                        collection: self.collection,
                        viewerEvents: self.viewerEvents
                    }).render();

                    // only load duplicate slides which are not processed by the document converter
                    if (!model.isOffice() && !model.isPDF()) view.prefetch(1).show();
                }, function fail() {
                    return gt('Cannot require a view type for %1$s', model.get('filename'));
                });
            }

            if (first.length > 0) handle(first, this.collection.first());
            if (last.length > 0) handle(last, this.collection.last());
        },

        /**
         * Creates the Swiper slide elements in a range around the active slide.
         *
         * @param {int} index
         *  the start index
         *
         * @returns {jQuery.Promise}
         *  a Promise of a Deferred object that will be resolved with a jQuery object
         */
        createSlides: function (index) {
            var self = this,
                indices = this.getSlideLoadRange(index, this.preloadOffset, 'both');

            return $.when.apply(this, _(indices).map(this.createView.bind(this))).then(function () {
                // order slides according to index
                self.carouselInner.append(
                    _(arguments)
                        .chain()
                        .map(function (view) {
                            return view.$el;
                        })
                        .sortBy(function ($el) {
                            return parseInt($el.data('index'), 10);
                        })
                        .value()
                );
            });
        },

        /**
         * Create a view with appropriate settings according to the loaded content
         *
         * @param {int} index
         *  the index of the model in the collection where the view should be created for
         *
         * @ returns {jquery.Promise}
         *  a Promise which is resolved after the view is rendered and prefetched
         */
        createView: function (index) {
            var collection = this.collection,
                self = this,
                model = collection.at(index);

            function get() {
                if (self.slideViews[index]) return $.when(self.slideViews[index]);

                return TypesRegistry.getModelType(model).then(function success(ModelTypeView) {
                    var view = new ModelTypeView({
                        model: model,
                        collection: collection,
                        viewerEvents: self.viewerEvents
                    });

                    // render view and append index
                    self.slideViews[index] = view.render();
                    view.$el.attr('data-index', index);

                    return view;
                }, function fail() {
                    return gt('Cannot require a view type for %1$s', model.get('filename'));
                });
            }

            return get().done(function (view) {
                // prefetch data according to priority
                if (!view.isPrefetched) {
                    view.prefetch(self.getPrefetchPriority(index));
                }
            });
        },

        getPrefetchPriority: function (index) {
            var size = this.collection.length,
                diff = Math.abs(this.activeIndex - index);

            return Math.max(1, diff < size / 2 ? diff : size - diff);
        },

        updatePriorities: function () {
            var self = this;

            _(this.slideViews).each(function (view, key) {
                if (view.isPrefetched) return;

                var index = parseInt(key, 10);
                view.prefetch(self.getPrefetchPriority(index));
            });
        },

        /**
         * Returns the range of neighboring slides for the given slide index depending on the given direction.
         *
         * @param {Number} slideIndex
         *  The slide index to create the range for.
         *
         * @param {Number} offset
         *  The number of neighboring slides to add to the range (Note: prefetchDirection='both' creates a duplicate slide amount).
         *
         * @param {String} [prefetchDirection = 'right']
         *  Direction of the pre-fetch: 'left', 'right' or 'both' are supported.
         *  Example: if activeSlide is 7 with an offset of 3, the range to load would be for
         *      'left': [4,5,6,7]
         *      'right':      [7,8,9,10]
         *      'both': [4,5,6,7,8,9,10]
         */
        getSlideLoadRange: function (slideIndex, offset, prefetchDirection) {
            var loadRange;

            slideIndex = slideIndex || 0;

            function getLeftRange() {
                return _.range(slideIndex, slideIndex - (offset + 1), -1);
            }

            function getRigthRange() {
                return _.range(slideIndex, slideIndex + offset + 1, 1);
            }

            switch (prefetchDirection) {
                case 'left':
                    loadRange = getLeftRange();
                    break;

                case 'right':
                    loadRange = getRigthRange();
                    break;

                case 'both':
                    loadRange = _.union(getLeftRange(), getRigthRange());
                    break;

                default:
                    loadRange = [slideIndex];
                    break;
            }

            return _(loadRange)
                .chain()
                .map(this.normalizeSlideIndex.bind(this))
                .uniq()
                .value();
        },

        /**
         * Load the given slide in the direction of movement. It automatically unloads the first of the loaded slides and apppends a new slide (both according to the direction of movement).
         *
         * @param {String} [direction = 'right']
         *  Direction of the prefetch: 'left' or 'right' are supported.
         */
        loadSlide: function (direction) {
            var self = this,
                insertOffset = direction === 'right' ? this.preloadOffset : -this.preloadOffset,
                removeOffset = direction === 'right' ? -this.preloadOffset - 1 : this.preloadOffset + 1,
                insertIndex = this.normalizeSlideIndex(this.activeIndex + insertOffset),
                removeIndex = this.normalizeSlideIndex(this.activeIndex + removeOffset);

            this.slideViews[this.activeIndex].show();

            // we do not have to load any slides if the slide to insert already exists
            if (this.slideViews[insertIndex]) {
                var swiper = self.swiper;

                // recalculate swiper index
                swiper.activeIndex = parseInt(self.slideViews[self.activeIndex].$el.data('swiper-slide-index'), 10) + 1;
                swiper.update(true);

                this.updatePriorities();

                return $.when();
            }

            return this.createView(insertIndex).done(function (view) {
                var swiper = self.swiper,
                    neighbour;
                swiper.destroyLoop();

                // remove old slide
                self.slideViews[removeIndex].unload().dispose();
                delete self.slideViews[removeIndex];
                swiper.wrapper.find('*[data-index=' + removeIndex + ']').remove();

                // add new slide at correct position
                if (direction === 'right') {
                    neighbour = swiper.wrapper.find('*[data-index=' + (insertIndex - 1) + ']');

                    if (neighbour.length > 0) {
                        neighbour.after(view.$el);
                    } else {
                        swiper.wrapper.prepend(view.$el);
                    }
                } else if (direction === 'left') {
                    neighbour = swiper.wrapper.find('*[data-index=' + (insertIndex + 1) + ']');

                    if (neighbour.length > 0) {
                        neighbour.before(view.$el);
                    } else {
                        swiper.wrapper.append(view.$el);
                    }
                }

                swiper.createLoop();

                // recalculate swiper index
                swiper.activeIndex = parseInt(self.slideViews[self.activeIndex].$el.data('swiper-slide-index'), 10) + 1;
                swiper.update(true);

                self.updatePriorities();
            });
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
            var index = this.collection.indexOf(model),
                slideNode = this.slideViews[index].$el;

            // unload current slide content and dispose the view instance
            // the DOM node is re-used, so the dispose function won't be called automatically.
            this.slideViews[index].unload().dispose();
            // load model and create new slide slide content
            TypesRegistry.getModelType(model)
            .then(function (ModelType) {
                var view = new ModelType({ model: model, collection: this.collection, el: slideNode, viewerEvents: this.viewerEvents });
                view.render().prefetch(1).show();
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
            duration = duration || 3000;

            var slideCaption = this.$el.find('.viewer-displayer-caption'),
                captionContent = $('<div class="caption-content">').text(text);

            slideCaption.empty().append(captionContent);
            window.clearTimeout(this.captionTimeoutId);
            slideCaption.show();
            this.captionTimeoutId = window.setTimeout(function () {
                slideCaption.fadeOut();
            }, duration);
        },

        /**
         * Blends in navigation elements after user activity events like mouseover.
         */
        blendNavigation: (function () {
            var x, y;
            return function (event) {
                // for Chrome's bug: it fires mousemove events without mouse movements
                if (event && event.type === 'mousemove') {
                    if (event.clientX === x && event.clientY === y) {
                        return;
                    }
                    x = event.clientX;
                    y = event.clientY;
                }
                if (!this.$el) {
                    return;
                }
                var duration = 3000,
                    navigationArrows = this.$el.find('.swiper-button-control');
                window.clearTimeout(this.navigationTimeoutId);
                navigationArrows.show();
                this.navigationTimeoutId = window.setTimeout(function () {
                    navigationArrows.fadeOut();
                }, duration);
            };
        })(),

        /**
         * Focuses the swiper's current active slide.
         */
        focusActiveSlide: function () {
            this.getActiveSlideNode().focus();
        },

        /**
         * Returns the active Swiper slide jQuery node.
         *
         * @returns {jQuery}
         *  The active node.
         */
        getActiveSlideNode: function () {
            if (!this.swiper || !this.swiper.slides) {
                return $();
            }
            return this.swiper.slides.eq(this.swiper.activeIndex);
        },

        /**
         * Returns the active slide index.
         *
         * @returns {Number}
         *  The index of the active slide.
         */
        getActiveSlideIndex: function () {
            return this.activeIndex;
        },

        /**
         * Returns the previous Swiper slide jQuery node,
         * including a possible Swiper duplicate node.
         *
         * Note: swiper.previousIndex is not correct, if the active slide was a duplicate slide.
         *       therefore we check the data-swiper-slide-index attribute.
         *
         * @returns {jQuery}
         *  The previous node.
         */
        getPreviousSlideNode: function () {
            if (!this.swiper || !this.swiper.slides) {
                return $();
            }
            var previousSlideIndex = this.normalizeSlideIndex(this.swiper.previousIndex - 1);

            return this.swiper.slides.filter('[data-swiper-slide-index="' + previousSlideIndex + '"]');
        },

        /**
         * Maps the given to the slide collection looping a negative index,
         * or an index the is greater that the collection length.
         *
         * @param {Number} slideIndex
         *  The slide index to normalize
         *
         * @returns {Number}
         *  The normalized slide index.
         */
        normalizeSlideIndex: function (slideIndex) {
            var collectionLength = this.collection.length;

            if (slideIndex < 0) {
                slideIndex = slideIndex + collectionLength;
                if (slideIndex < 0) {
                    slideIndex = 0;
                }

            } else if (slideIndex >= collectionLength) {
                slideIndex = slideIndex % collectionLength;
            }
            return slideIndex;
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
            var activeSlideNode = this.getActiveSlideNode(),
                previousSlideNode = this.getPreviousSlideNode();

            if (swiper) {
                var preloadDirection = (swiper.previousIndex < swiper.activeIndex) ? 'right' : 'left';

                // increment active index
                this.activeIndex = this.normalizeSlideIndex(this.activeIndex + (preloadDirection === 'right' ? 1 : -1));
                this.loadSlide(preloadDirection).done(this.handleDuplicatesSlides.bind(this));
            }

            //#. text of a viewer slide caption
            //#. Example result: "1 of 10"
            //#. %1$d is the slide index of the current
            //#. %2$d is the total slide count
            this.blendCaption(gt('%1$d of %2$d', this.activeIndex + 1, this.collection.length));
            this.blendNavigation();
            // a11y
            activeSlideNode.attr('aria-selected', 'true');
            previousSlideNode.attr('aria-selected', 'false');
            // pause playback on audio and video slides
            previousSlideNode.find('audio, video').each(function () {
                this.pause();
            });
            this.viewerEvents.trigger('viewer:displayeditem:change', this.collection.at(this.activeIndex));
            this.swiper.params.onlyExternal = false;
        },

        /**
         * Slide change start handler:
         * - save scroll positions of each slide while leaving it.
         * - save zoom level of each slide too
         *
         * @param {Swiper} swiper
         *  the instance of the swiper plugin
         */
        onSlideChangeStart: function () {
            var previousSlide = this.getPreviousSlideNode(),
                previousIndex = parseInt(previousSlide.data('index'), 10),
                activeSlideView = this.slideViews[previousIndex];
            if (activeSlideView) {
                var scrollPosition = activeSlideView.$el.scrollTop();
                if (activeSlideView.pdfDocument) {
                    activeSlideView.setInitialScrollPosition(activeSlideView.model.get('id'), scrollPosition);
                }
            }
            this.swiper.params.onlyExternal = true;
        },

        /**
         * File remove handler.
         *
         * @param {Array} removedFiles
         *  an array consisting of objects representing file models.
         */
        onFileRemoved: function (removedFiles) {
            var self = this,
                models = _.filter(removedFiles, function (file) {
                    var cid = file.cid || _.cid(file),
                        model = self.collection.get(cid),
                        index = self.collection.indexOf(model);

                    if (index > -1) {
                        self.slideViews[index].unload().dispose();
                        return true;
                    }

                    return false;
                }),
                swiper = this.swiper;

            if (_.isEmpty(models)) {
                // none of the removed files is currently present in the Viewer collection
                return;
            }

            this.collection.remove(models);
            this.slideViews = {};

            // close viewer we don't have any files to show
            if (this.collection.length === 0) {
                this.viewerEvents.trigger('viewer:close');
                return;
            }

            swiper.destroyLoop();
            swiper.wrapper.empty();

            // recalculate active index (can change due to overflow)
            this.activeIndex = this.normalizeSlideIndex(this.activeIndex);

            // create slides from file collection and append them to the carousel
            this.createSlides(this.activeIndex).done(function success() {
                swiper.createLoop();

                // recalculate swiper index
                swiper.activeIndex = parseInt(self.slideViews[self.activeIndex].$el.data('swiper-slide-index'), 10) + 1;

                swiper.update(true);

                self.onSlideChangeEnd(swiper);

                if (self.collection.length <= 1) {
                    swiper.destroyLoop();
                    swiper.params.loop = false;
                    swiper.fixLoop();
                    swiper.update(true);
                }
            });
        },

        disposeView: function () {
            if (this.swiper) {
                this.swiper.removeAllSlides();
                this.swiper.destroy();
                this.swiper = null;
            }
            this.captionTimeoutId = null;
            this.loadedSlides = null;
            this.slideViews = null;
            return this;
        }
    });

    return DisplayerView;
});
