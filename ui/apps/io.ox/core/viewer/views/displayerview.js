/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Edy Haryono <edy.haryono@open-xchange.com>
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/core/viewer/views/displayerview', [

    'io.ox/files/api',
    'io.ox/core/viewer/views/types/typesregistry',
    'io.ox/backbone/disposable',
    'io.ox/core/viewer/util',

    'static/3rd.party/bigscreen/bigscreen.min.js',

    'gettext!io.ox/core',

    'static/3rd.party/swiper/swiper.jquery.js',
    'css!3rd.party/swiper/swiper.css'

], function (FilesAPI, TypesRegistry, DisposableView, Util, BigScreen, gt) {

    'use strict';

    function rerenderButtonAutoPlayModeDoRun($button) {
        var
            $icon = $button.children().eq(0);

        $icon.addClass('fa-play');
        $icon.removeClass('fa-pause');

        $button.attr({
            /*#. tooltip for getting auto-play mode ready for running. */
            'title':      gt('Run auto-play mode'),
            'aria-label': gt('Run auto-play mode')
        });
    }
    function rerenderButtonAutoPlayModeDoPause($button) {
        var
            $icon = $button.children().eq(0);

        $icon.addClass('fa-pause');
        $icon.removeClass('fa-play');

        $button.attr({
            /*#. tooltip for getting auto-play mode ready for pausing. */
            'title':      gt('Pause auto-play mode'),
            'aria-label': gt('Pause auto-play mode')
        });
    }

    function setAutoplayControlStateToWillPlay(displayerView) {
        rerenderButtonAutoPlayModeDoRun(displayerView.carouselRoot.children('.autoplay-button').eq(0));
    }
    function setAutoplayControlStateToWillPause(displayerView) {
        rerenderButtonAutoPlayModeDoPause(displayerView.carouselRoot.find('.autoplay-button').eq(0));
    }

    function setVisibilityOfAutoplayControl(displayerView, isForceDisableVisibility) {
        displayerView.carouselRoot.toggleClass('autoplay-controls-disabled', isForceDisableVisibility);
    }

    function handleToggleAutoplayMode(event, displayerView, mode) {
        mode = (
            ((mode === 'running') || (mode === 'pausing') && mode) ||

            ((displayerView.autoplayMode === 'pausing') && 'running') ||
            ((displayerView.autoplayMode === 'running') && 'pausing') ||

            'pausing'
        );
        if (mode === 'pausing') {
            if (displayerView.hasAutoplayStartAlreadyBeenTriggered()) { // only in case of autoplay start has already been triggered.

                if (displayerView.fullscreen) {

                    window.clearTimeout(displayerView.timeoutIdAutoplay);
                } else {

                    deregisterAutoplayEventHandlingForPreviousNextControl(displayerView);
                    displayerView.onAutoplayStop();
                }
            }
            setAutoplayControlStateToWillPlay(displayerView);
        } else {
            setAutoplayControlStateToWillPause(displayerView);

            if (displayerView.fullscreen) {

                triggerDisplayNextAutoplaySlide(displayerView, 0, AUTOPLAY_DELAY__WHILE_STARTING);
            } else {

                displayerView.onAutoplayStart();
                registerAutoplayEventHandlingForPreviousNextControl(displayerView);

                displayerView.toggleFullscreen(true);
            }
        }
        displayerView.autoplayMode = mode;
    }

    function handleInitialStateForEnabledAutoplayMode(displayerView, slideIndex) {
        if (displayerView.canAutoplayImages && !displayerView.hasAutoplayStartAlreadyBeenTriggered()) { // only in case autoplay start has not yet been triggered.
            var
                isForceDisableVisibilityOfAutoplayControl = !displayerView.imageFileRegistry[slideIndex];

            setVisibilityOfAutoplayControl(displayerView, isForceDisableVisibilityOfAutoplayControl);

            handleToggleAutoplayMode({}, displayerView, 'pausing');
        }
    }
    function handleSlideChangeForEnabledAutoplayMode(displayerView, slideIndex) {
        if (displayerView.canAutoplayImages) {
            if (displayerView.autoplayMode !== 'running') { // only in case of autoplay is not running at all.
                var
                    isForceDisableVisibilityOfAutoplayControl = !displayerView.imageFileRegistry[slideIndex];

                setVisibilityOfAutoplayControl(displayerView, isForceDisableVisibilityOfAutoplayControl);
            } else {
                triggerDisplayNextAutoplaySlide(displayerView, slideIndex, AUTOPLAY_DELAY__WHILST_RUNNING);
            }
        }
    }

    function triggerDisplayNextAutoplaySlide(displayerView, slideIndex, delay) {
        var
            displayNextAutoplaySlide = (function (swiper) {
                return function () {
                                                      // - for [s.slideNext] see "swiper.js" line 1586.
                    swiper.slideNext(true, 0, false); // - params{runCallbacks, speed, internal} ... for what {internal} does see "swiper.js" line 1513.
                };
            }(displayerView.swiper));

        displayerView.timeoutIdAutoplay = window.setTimeout(displayNextAutoplaySlide, delay);
    }

    function handleDisplayerItemEnter(/*event*/) {
        this.carouselRoot.addClass('autoplay-controls-visible');
    }
    function handleDisplayerItemLeave(event) {
        var
            $toElement = $(event.toElement);

        if (!$toElement.hasClass('autoplay-button') && !$toElement.hasClass('fa-play') && !$toElement.hasClass('fa-pause')) {
            this.carouselRoot.removeClass('autoplay-controls-visible');
        }
    }

    function handlePreviousNextControlClickWhileRunningAutoplay(/*event*/) {
        window.clearTimeout(this.timeoutIdAutoplay);
    }

    function registerAutoplayEventHandlingForUpdatedCarouselView(displayerView) {
        if (displayerView.autoplayMode !== 'running') { // only in case of autoplay is not running at all.

            // register:
            // blend in navigation by user activity
            displayerView.$el.on('mousemove click', displayerView.displayerviewMousemoveClickHandler);

        } else if (displayerView.hasAutoplayStartAlreadyBeenTriggered()) { // only in case of autoplay start has already been triggered.

            // deregister:
            // blend in navigation by user activity
            displayerView.$el.off('mousemove click', displayerView.displayerviewMousemoveClickHandler);
        }

        // one way registering since the view that gets operated on will be build always from scratch.
        var
            $carouselInner  = displayerView.carouselInner,

            enterHandler    = handleDisplayerItemEnter.bind(displayerView),
            leaveHandler    = handleDisplayerItemLeave.bind(displayerView);

        $carouselInner.on('mouseenter', '.viewer-displayer-item-container', enterHandler);
        $carouselInner.on('mouseleave', '.viewer-displayer-item-container', leaveHandler);

      //$carouselInner.on('mousemove click', '.viewer-displayer-item-container', displayerView.displayerviewMousemoveClickHandler);
    }

    function registerAutoplayEventHandlingForPreviousNextControl(displayerView) {
        var
            $carouselRoot = displayerView.carouselRoot,

            $buttonPrev   = $carouselRoot.children('.swiper-button-prev'),
            $buttonNext   = $carouselRoot.children('.swiper-button-next'),

            clickHandler  = handlePreviousNextControlClickWhileRunningAutoplay.bind(displayerView);

        displayerView.previousNextControlClickWhileRunningAutoplayHandler = clickHandler;

        $buttonPrev.on('click', clickHandler);
        $buttonNext.on('click', clickHandler);
    }
    function deregisterAutoplayEventHandlingForPreviousNextControl(displayerView) {
        var
            $carouselRoot = displayerView.carouselRoot,

            $buttonPrev   = $carouselRoot.children('.swiper-button-prev'),
            $buttonNext   = $carouselRoot.children('.swiper-button-next'),

            clickHandler  = displayerView.previousNextControlClickWhileRunningAutoplayHandler;

        $buttonPrev.off('click', clickHandler);
        $buttonNext.off('click', clickHandler);
    }

    function hideViewerControlsInCaseOfRunningAutoplayHasBeenTriggered(displayerView) {
        if (displayerView.hasAutoplayStartAlreadyBeenTriggered()) { // only in case of autoplay start has already been triggered.

            window.clearTimeout(displayerView.captionTimeoutId);
            window.clearTimeout(displayerView.navigationTimeoutId);

            var
                $viewElement = displayerView.$el,

                $slideCaption = $viewElement.find('.viewer-displayer-caption'),
                $navigationArrows = $viewElement.find('.swiper-button-control');

            $slideCaption.hide();
            $navigationArrows.hide();
        }
    }

    function handleEnterFullscreen(displayerView) {
        displayerView.fullscreen = true;
        displayerView.$el.addClass('fullscreen-mode');
    }
    function handleExitFullscreen(displayerView) {
        displayerView.fullscreen = false;
        displayerView.$el.removeClass('fullscreen-mode');

        handleToggleAutoplayMode({}, displayerView, 'pausing');
        handleDisplayerItemLeave.call(displayerView, {});

        displayerView.$el.focus();
    }

    function requireAutoplayDelayLazily() {
        if (!AUTOPLAY_DELAY__WHILST_RUNNING) {
            AUTOPLAY_DELAY__WHILST_RUNNING = 5000; // from user settings or by default/fallback according to https://jira.open-xchange.com/browse/DOCS-670
        }
    }
    var
        AUTOPLAY_DELAY__WHILST_RUNNING,
        AUTOPLAY_DELAY__WHILE_STARTING = 1000;

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
            // object to store the currently loading slides.
            this.loadingSlides = {};
            // object to store slides that are removed while loading (prevent errors)
            this.delayedRemove = {};
            // limit of how much slides are loaded simultaniously
            this.loadingLimit = 3;

            // a backup of the current collection of every displayer file object
            this.collectionBackup = null;
            // whether or not displayerview is able of auto-play mode that will display image-type file-items exclusively.
            this.canAutoplayImages = false;
            // key value object (map/index/registry) of all of a file-object collection's image-type's stored by theirs collection's index.
            this.imageFileRegistry = {};
            // if able of auto-play mode, the current state of it, either "pausing" or "running".
            this.autoplayMode = '';
            // reference for setting and clearing autoplay timeout values.
            this.timeoutIdAutoplay = null;
            // a reference to the currently used method that handles click events on a swiper's previous/next controls while it is running in autoplay mode.
            this.previousNextControlClickWhileRunningAutoplayHandler = null;
            // with autoplay mode comes fullscreen mode too
            this.fullscreen = false;

            // array to store dummys in use
            this.dummyList = [];
            // listen to blend caption events
            this.listenTo(this.viewerEvents, 'viewer:blendcaption', this.blendCaption);
            this.listenTo(this.viewerEvents, 'viewer:blendnavigation', this.blendNavigation);   // - directly access this view's navigation blend method.
            // listen to delete event propagation from FilesAPI
            this.listenTo(FilesAPI, 'remove:file', this.onFileRemoved.bind(this));

            // a reference to a very own throttled and bound variant of this view's "mousemove" and "click" handler
            // in order to also use it for deregistering purposes while running the autoplay mode.
            this.displayerviewMousemoveClickHandler = _.throttle(this.blendNavigation.bind(this), 500);
            // blend in navigation by user activity
            //this.$el.on('mousemove click', this.displayerviewMousemoveClickHandler);          // - handle register/deregister in a more centralized way.

            // listen to version change events
            this.listenTo(this.collection, 'change:version', this.onModelChangeVersion.bind(this));
            // listen to version display events
            this.listenTo(this.viewerEvents, 'viewer:display:version', this.onDisplayVersion.bind(this));

            // listen to full screen mode changes
            BigScreen.onchange = this.onChangeFullScreen.bind(this);
        },

        initializeAutoplayImageModeData: function () {
            var
                fileObjectCollection  = this.collection,
                imageFileRegistry     = fileObjectCollection.reduce(function (map, fileItem, idx/*, list*/) {
                    if (fileItem.isImage()) {

                        map[idx] = fileItem;
                    }
                    return map;

                }, {});

            if (Object.keys(imageFileRegistry).length >= 2) {

                this.canAutoplayImages = true;
                this.imageFileRegistry = imageFileRegistry;
            }
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
                prevSlide = $('<a href="#" role="button" class="swiper-button-prev swiper-button-control left" aria-controls="viewer-carousel"><i class="fa fa-angle-left" aria-hidden="true"></i></a>'),
                nextSlide = $('<a href="#" role="button" class="swiper-button-next swiper-button-control right" aria-controls="viewer-carousel"><i class="fa fa-angle-right" aria-hidden="true"></i></a>'),
                autoplay,
                fullscreen,
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
                },
                handleToggleAutoplayControl,
                handleToggleFullscreenControl;

            // if the index is we want to start with is preloaded, we can use it.
            if (startIndex < this.preloadOffset || this.collection.length < 2 * this.preloadOffset + 1) {
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
            prevSlide.attr({ title: gt('Previous'), 'aria-label': gt('Previous') });
            nextSlide.attr({ title: gt('Next'), 'aria-label': gt('Next') });
            carouselRoot.attr('aria-label', gt('Use left/right arrow keys to navigate and escape key to exit the viewer.'));
            carouselRoot.append(carouselInner);

            if (this.collection.length > 1) {
                carouselRoot.append(prevSlide, nextSlide);

                this.initializeAutoplayImageModeData();
                if (this.canAutoplayImages) {

                    autoplay = $('<a href="#" role="button" class="autoplay-button"><i class="fa" aria-hidden="true"></i></a>');
                    fullscreen = $('<a href="#" role="button" class="fullscreen-button"><i class="fa fa-arrows-alt" aria-hidden="true"></i></a>');
                    carouselRoot.append(autoplay);
                    carouselRoot.append(fullscreen);

                    handleToggleAutoplayControl = (function (displayerView) {
                        return function (event) {

                            handleToggleAutoplayMode(event, displayerView);
                        };
                    }(this));

                    handleToggleFullscreenControl = (function (displayerView) {
                        return function (/*event*/) {

                            displayerView.toggleFullscreen();
                        };
                    }(this));

                    autoplay.on('click', handleToggleAutoplayControl);
                    fullscreen.on('click', handleToggleFullscreenControl);

                    requireAutoplayDelayLazily();
                }
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
                if (self.collection.length > 1) {
                    //no need to show anything if only one item available

                    //#. information about position of the current item in viewer
                    //#. this will only be shown for more than one item
                    //#. %1$d - position of current item
                    //#. %2$d - total amount of items
                    self.blendCaption(gt.ngettext(
                        '%1$d of %2$d item',
                        '%1$d of %2$d items',
                        self.collection.length,
                        startIndex + 1,
                        self.collection.length
                    ));
                }
                self.blendNavigation();
                // focus first active slide initially
                self.focusActiveSlide();
            }, function fail() {
                console.warn('DisplayerView.createSlides() - some errors occured:', arguments);
            });
            // append bottom toolbar (used to diplay upload progress bars)
            this.$el.append($('<div class="bottom toolbar">'));
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
                self.createDummy(el.get[0], model);
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

            handleInitialStateForEnabledAutoplayMode(this, index);

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
                registerAutoplayEventHandlingForUpdatedCarouselView(self);

                hideViewerControlsInCaseOfRunningAutoplayHasBeenTriggered(self);
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
        createView: function (index, options) {
            var collection = this.collection,
                self = this,
                model = collection.at(index);
            options = options || {};

            function get() {
                if (self.slideViews[index] && !self.slideViews[index].isDummy) return $.when(self.slideViews[index]);

                return TypesRegistry.getModelType(model).then(function success(ModelTypeView) {
                    var view = new ModelTypeView({
                        model: model,
                        collection: collection,
                        viewerEvents: self.viewerEvents
                    });
                    // if this function is called to replace a dummy, we need to make sure it is still in use, so we don't add it again accidentally
                    if (!options.onlyReplace || (options.onlyReplace && self.slideViews[index])) {
                        // render view and append index
                        self.slideViews[index] = view.render();
                        view.$el.attr('data-index', index);
                        var active = false;
                        if (self.swiper) {
                            var additionalClasses = '';
                            if (self.swiper.wrapper.find('*[data-index=' + index + '].swiper-slide-active').length) {
                                additionalClasses = 'swiper-slide-active';
                                active = true;
                            }
                            var slide = self.swiper.wrapper.find('*[data-index=' + index + ']:not(.swiper-slide-duplicate)'),
                                swiperIndex = slide.data('swiper-slide-index');
                            if (slide.hasClass('swiper-slide-prev')) {
                                additionalClasses = additionalClasses + 'swiper-slide-prev';
                            }
                            if (slide.hasClass('swiper-slide-next')) {
                                additionalClasses = additionalClasses + 'swiper-slide-next';
                            }
                            self.swiper.wrapper.find('*[data-index=' + index + ']:not(.swiper-slide-duplicate)').replaceWith(view.$el);
                            view.$el.attr('data-swiper-slide-index', swiperIndex);
                            view.$el.addClass(additionalClasses);
                            if (active) {
                                view.$el.focus();
                            }

                            if (self.swiper.wrapper.find('*[data-index=' + index + '].swiper-slide-duplicate').length) {
                                // there is a swiper duplicate of this. let's replace this as well.
                                var duplicateView = new ModelTypeView({
                                    el: self.swiper.wrapper.find('*[data-index=' + index + '].swiper-slide-duplicate').removeClass('dummy-slide').get(0),
                                    model: model,
                                    collection: collection,
                                    viewerEvents: self.viewerEvents
                                }).render();

                                duplicateView.$el.attr('data-swiper-slide-index', swiperIndex);

                                // only load duplicate slides which are not processed by the document converter
                                if (!model.isOffice() && !model.isPDF() && !view.model.isVideo() && !view.model.isAudio()) duplicateView.prefetch({ priority: 1 });
                            }
                        }
                    }

                    return view;
                }, function fail() {
                    return gt('Cannot require a view type for %1$s', model.get('filename'));
                });
            }
            return get().done(function (view) {
                // prefetch data according to priority
                if (!view.isPrefetched) {
                    view.prefetch({ priority: self.getPrefetchPriority(index) });
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
                view.prefetch({ priority: self.getPrefetchPriority(index) });
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
         * creates a dummyslide, that is used if we switch slides too fast.
         * can be used with 1 argument (index) or 2 arguments, (el and model) this is used for the duplicates
         */
        createDummy: function (index) {
            var self = this,
                duplicate = arguments.length > 1,
                dummy = {
                    $el: duplicate ? arguments[0] : $('<div class="dummy-slide swiper-slide scrollable">').attr('data-index', index).attr('data-index', index),
                    show: function () {
                        // allow chaining
                        return this;
                    },
                    prefetch: function () {
                        return this;
                    },
                    unload: function (removeIndex) {
                        self.dummyList = _(self.dummyList).filter(function (view) { return view.index !== removeIndex; });
                        return this;
                    },
                    load: duplicate ? _.noop : function () {
                        return self.createView(index, { onlyReplace: true });
                    },
                    dispose: function () {
                        return this;
                    },
                    isDummy: true,
                    index: duplicate ? null : index,
                    model: duplicate ? arguments[1] : this.collection.at(index),
                    collection: this.collection
                };
            if (!duplicate) {
                this.slideViews[index] = dummy;
                this.dummyList.push(dummy);
            }
            return dummy;
        },

        // loads the next dummy
        loadDummy: function () {
            var self = this,
                keys = _(this.loadingSlides).keys();
            // free to load a dummy if we still have them
            if (this.dummyList[0] && keys.length <= this.loadingLimit) {
                var index = index = self.dummyList[0].index;

                if (index !== null) {
                    this.loadingSlides[index] = true;

                    this.dummyList[0].load()
                        .done(function (view) {
                            if (self.swiper) {
                                self.swiper.updateSlidesSize();
                            }
                            if (self.delayedRemove[index]) {
                                self.delayedRemove[index].view.unload(index).dispose();
                                self.delayedRemove[index].node.remove();
                            } else if (view.$el.hasClass('swiper-slide-active')) {
                                // show if active
                                view.show();
                            }

                            delete self.loadingSlides[index];
                            self.loadDummy();
                        });
                    this.dummyList.shift();
                }
            }
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
                removeIndex = this.normalizeSlideIndex(this.activeIndex + removeOffset),
                insertSlide = function (view) {
                    var swiper = self.swiper,
                        neighbour;

                    swiper.destroyLoop();

                    // remove old slide
                    if (self.loadingSlides[removeIndex]) {
                        //don't remove currently loading files to prevent errors
                        self.delayedRemove[removeIndex] = { view: self.slideViews[removeIndex], node: swiper.wrapper.find('*[data-index=' + removeIndex + ']') };
                        swiper.wrapper.find('*[data-index=' + removeIndex + ']').detach();
                    } else {
                        self.slideViews[removeIndex].unload(removeIndex).dispose();
                        swiper.wrapper.find('*[data-index=' + removeIndex + ']').remove();
                    }
                    delete self.slideViews[removeIndex];

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
                    self.isBusy = false;
                    self.slideViews[self.activeIndex].show();
                    self.handleDuplicatesSlides.bind(self);

                    self.loadDummy();
                };

            // we do not have to load any slides if the slide to insert already exists
            if (this.slideViews[insertIndex]) {
                var swiper = self.swiper;

                // recalculate swiper index
                swiper.activeIndex = parseInt(self.slideViews[self.activeIndex].$el.data('swiper-slide-index'), 10) + 1;
                swiper.update(true);

                this.updatePriorities();
                this.slideViews[this.activeIndex].show();
                return $.when();
            }

            insertSlide(this.createDummy(insertIndex));
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
            this.displayVersion(model);
        },

        /**
         * Handles display file version events.
         * Loads the type model and renders the new slide content.
         *
         * @param {Object} versionData
         *   The version data.
         */
        onDisplayVersion: function (versionData) {
            if (!versionData) { return; }

            var id = versionData.id;
            var folder_id = versionData.folder_id;
            var modified = versionData.last_modified;
            var isToday = moment().isSame(moment(modified), 'day');
            var dateString = modified ? moment(modified).format(isToday ? 'LT' : 'l LT') : '-';
            var model = this.collection.find(function (m) {
                return (m.get('id') === id) && (m.get('folder_id') === folder_id);
            });

            this.displayVersion(model, versionData.version);

            //#. information about the currently displayed file version in viewer
            //#. %1$d - version date
            this.blendCaption(gt('Version of %1$s', dateString), 5000);
        },

        /**
         * Renders the slide content for the given file version.
         * Uses the given version if present, otherwise the version defined within the model.
         *
         * @param {Object} model
         *   The file model object.
         *
         * @param {String} [version]
         *  The file version to display (optional).
         */
        displayVersion: function (model, version) {
            if (!model) { return; }

            var index = this.collection.indexOf(model);
            var slideNode = this.slideViews[index].$el;
            var versionParam = _.isEmpty(version) ? null : { version: version };
            var prefetchParam = _.extend({ priority: 1 }, versionParam);

            // unload current slide content and dispose the view instance
            // the DOM node is re-used, so the dispose function won't be called automatically.
            this.slideViews[index].unload().dispose();
            // load model and create new slide slide content
            TypesRegistry.getModelType(model)
            .then(function (ModelType) {
                var view = new ModelType({ model: model, collection: this.collection, el: slideNode, viewerEvents: this.viewerEvents });
                view.render().prefetch(prefetchParam).show(versionParam);
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
                this.loadSlide(preloadDirection);
            }
            handleSlideChangeForEnabledAutoplayMode(this, this.activeIndex);

            if (this.autoplayMode !== 'running') {  // - only in case of autoplay is not running at all.

                //#. information about position of the current item in viewer
                //#. this will only be shown for more than one item
                //#. %1$d - position of current item
                //#. %2$d - total amount of item
                this.blendCaption(gt.ngettext(      // - directly access this view's caption blend method.
                    '%1$d of %2$d item',
                    '%1$d of %2$d items',
                    this.collection.length,
                    this.activeIndex + 1,
                    this.collection.length
                ));
                this.blendNavigation();             // - directly access this view's navigation blend method.
            }
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

        onAutoplayStart: function () {
            var
                self = this,
                swiper = this.swiper,

                imageFileModels = Object.keys(this.imageFileRegistry).map(function (key) {
                    return self.imageFileRegistry[key];
                });

            this.collectionBackup = this.collection.clone();
            this.collection.reset(imageFileModels);

            this.slideViews = {};

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

        onAutoplayStop: function () {
            window.clearTimeout(this.timeoutIdAutoplay);

            var
                swiper = this.swiper,
                self = this;

            this.collection.reset(this.collectionBackup.models);
            this.collectionBackup = null;

            this.slideViews = {};

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

        hasAutoplayStartAlreadyBeenTriggered: function () {
            return !!this.collectionBackup; // autoplay start has already been triggered.
        },

        // copied directly from 'io.ox/presenter/views/mainview.js' ... see line 402
        //
        /**
         * Toggles full screen mode of the main view depending on the given state.
         *  A state of 'true' starts full screen mode, 'false' exits the full screen mode and
         *  'undefined' toggles the full screen state.
         *
         * You can only call this from a user-initiated event (click, key, or touch event),
         * otherwise the browser will deny the request.
         */
        toggleFullscreen: function (state) {
            if (BigScreen.enabled && _.device('!iOS')) {

                if (_.isUndefined(state)) {
                    BigScreen.toggle(this.carouselRoot[0]);
                } else if (state) {
                    BigScreen.request(this.carouselRoot[0]);
                } else {
                    BigScreen.exit();
                }
            }
        },

        // copied directly from 'io.ox/presenter/views/mainview.js' ... see line 423
        //
        /**
         * Handle full screen mode change event.
         *
         * Note: BigScreen.onchange is the only event that works correctly with current Firefox.
         *
         * @param {DOM|null} element
         *  The element that is currently displaying in full screen or null.
         */
        onChangeFullScreen: function (element) {
            var
                displayerView = this;

            if (_.isNull(element)) {

                handleExitFullscreen(displayerView);

            } else if (element === this.carouselRoot[0]) {

                handleEnterFullscreen(displayerView);
            }
        },

        disposeView: function () {
            window.clearTimeout(this.captionTimeoutId);
            window.clearTimeout(this.navigationTimeoutId);
            window.clearTimeout(this.timeoutIdAutoplay);

            if (this.swiper) {
                this.swiper.removeAllSlides();
                this.swiper.destroy();
                this.swiper = null;
            }
            this.captionTimeoutId = null;
            this.navigationTimeoutId = null;
            this.loadedSlides = null;
            this.slideViews = null;

            this.canAutoplayImages = null;
            this.imageFileRegistry = null;
            this.autoplayMode = null;
            this.timeoutIdAutoplay = null;
            this.previousNextControlClickWhileRunningAutoplayHandler = null;

            this.displayerviewMousemoveClickHandler = null;

            return this;
        }
    });

    return DisplayerView;
});
