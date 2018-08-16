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
    'static/3rd.party/swiper.js',
    'static/3rd.party/bigscreen.min.js',
    'settings!io.ox/files',
    'gettext!io.ox/core',
    'css!3rd.party/swiper/swiper.css'
], function (FilesAPI, TypesRegistry, DisposableView, Util, Swiper, BigScreen, filesSettings, gt) {

    'use strict';

    /**
     * Toggle the autoplay icon and change the tooltip
     *
     * @param {DisplayerView} displayerView
     *   View of the displayer
     *
     * @param {String} mode
     *   the mode to switch the autoplay button
     *   Example: 'play' and 'pause' are supported
     *      play: show the play icon
     *      pause: show the pause icon
     */
    function updateAutoplayButton(displayerView, mode) {
        if (!mode) return;

        var button = displayerView.carouselRoot.children('.autoplay-button').eq(0);
        var icon = button.children().eq(0);
        var addClass;
        var removeClass;
        var title;

        if (mode === 'pause') {
            addClass = 'fa-pause';
            removeClass = 'fa-play';
            title = gt('Pause auto-play mode');
        } else {
            addClass = 'fa-play';
            removeClass = 'fa-pause';
            title = gt('Run auto-play mode');
        }

        icon.addClass(addClass);
        icon.removeClass(removeClass);

        button.attr({
            'title': title,
            'aria-label': title
        });
    }

    /**
     * Toggle the visibility of the autoplay button by setting a class in root node
     *
     * @param {DisplayerView} displayerView
     *   View of the displayer
     *
     * @param {Boolean} isForceDisableVisibility
     *   adds/removes class for disabling autoplay controls
     *   Example: true and false are supported
     *      true: adds disabling class
     *      false: removes disabling class
     */
    function setVisibilityOfAutoplayControl(displayerView, isForceDisableVisibility) {
        displayerView.carouselRoot.toggleClass('autoplay-controls-disabled', isForceDisableVisibility);
    }

    /**
     * Updates the visibility of the autoplay buttons based on a given slide
     *
     * @param {DisplayerView} displayerView
     *   View of the displayer
     *
     * @param {Int} slideIndex
     *   Index position of the slide
     */
    function updateVisibilityOfAutoplayControl(displayerView, slideIndex) {

        var model = displayerView.collection.models[slideIndex];
        var fileId = model && model.get('id');
        var imageFileRegistry = displayerView && displayerView.imageFileRegistry;
        var isForceDisableVisibilityOfAutoplayControl = fileId && imageFileRegistry && !imageFileRegistry[fileId];

        setVisibilityOfAutoplayControl(displayerView, isForceDisableVisibilityOfAutoplayControl);
    }

    /**
     * Sets the initial options for autoplay
     *
     * @param {DisplayerView} displayerView
     *   View of the displayer
     *
     * @param {String} fileId
     *  The file model id
     */
    function handleInitialStateForEnabledAutoplayMode(displayerView, fileId) {
        if (displayerView.canAutoplayImages && !displayerView.hasAutoplayStartAlreadyBeenTriggered()) { // only in case autoplay start has not yet been triggered.
            var isForceDisableVisibilityOfAutoplayControl = !displayerView.imageFileRegistry[fileId];

            setVisibilityOfAutoplayControl(displayerView, isForceDisableVisibilityOfAutoplayControl);
            displayerView.handleToggleAutoplayMode('pausing');
        }
    }

    /**
     * Add visible class on entering swiper container
     */
    function handleDisplayerItemEnter() {
        this.carouselRoot.addClass('autoplay-controls-visible');
    }

    /**
     * Removes visible class on leaving swiper container
     *
     * @param {Event} event
     *   Event which leaves the swiper container
     */
    function handleDisplayerItemLeave(event) {
        var $relatedTarget = $(event.relatedTarget); // chrome: `toElement` vs ffx: `relatedTarget`

        if (!$relatedTarget.hasClass('autoplay-button') && !$relatedTarget.hasClass('fa-play') && !$relatedTarget.hasClass('fa-pause')) {
            this.carouselRoot.removeClass('autoplay-controls-visible');
        }
    }

    /**
     * Register handler for entering and leaving the swiper container
     *
     * @param {DisplayerView} displayerView
     *   View of the displayer
     */
    function registerAutoplayEventHandlingForUpdatedCarouselView(displayerView) {
        // one way registering since the view that gets operated on will be build always from scratch.
        var $carouselInner = displayerView.carouselInner;
        var enterHandler = handleDisplayerItemEnter.bind(displayerView);
        var leaveHandler = handleDisplayerItemLeave.bind(displayerView);

        $carouselInner.on('mouseenter', '.viewer-displayer-item-container', enterHandler);
        $carouselInner.on('mouseleave', '.viewer-displayer-item-container', leaveHandler);
    }

    /**
     * Hide the viewer controls when autoplay is running
     *
     * @param {DisplayerView} displayerView
     *   View of the displayer
     */
    function hideViewerControlsInCaseOfRunningAutoplayHasBeenTriggered(displayerView) {
        if (displayerView.hasAutoplayStartAlreadyBeenTriggered()) { // only in case of autoplay start has already been triggered.
            window.clearTimeout(displayerView.captionTimeoutId);
            var $viewElement = displayerView.$el;
            var $slideCaption = $viewElement.find('.viewer-displayer-caption');

            $slideCaption.hide();
        }
    }

    /**
     * Adds classes and parameters for fullscreen mode
     *
     * @param {DisplayerView} displayerView
     *   View of the displayer
     */
    function handleEnterFullscreen(displayerView) {
        displayerView.fullscreen = true;
        displayerView.$el.addClass('fullscreen-mode');
    }

    /**
     * Removes classes and update parameters for leaving fullscreen mode. Autorun is stopped.
     *
     * @param {DisplayerView} displayerView
     *   View of the displayer
     */
    function handleExitFullscreen(displayerView) {
        displayerView.fullscreen = false;
        displayerView.$el.removeClass('fullscreen-mode');
        displayerView.handleToggleAutoplayMode('pausing');
        handleDisplayerItemLeave.call(displayerView, {});
        displayerView.$el.focus();
    }

    /**
     * Fetch the options from the user settings and stores into constants
     */
    function requireAutoplayUserSettings() {
        // from user settings or by default/fallback according to https://jira.open-xchange.com/browse/DOCS-670
        var IS_LOOP_ENDLESSLY = (String(filesSettings.get('autoplayLoopMode')).toLowerCase() === 'loopendlessly'); // default value equals true.
        IS_LOOP_ONCE_ONLY = !IS_LOOP_ENDLESSLY;

        AUTOPLAY_PAUSE__WHILST_RUNNING = (Number(filesSettings.get('autoplayPause')) * 1000); // value of 'autoplayPause' in seconds
        if (!isFinite(AUTOPLAY_PAUSE__WHILST_RUNNING)) {
            AUTOPLAY_PAUSE__WHILST_RUNNING = 5000; // default/fallback value.
        }
    }

    // show every image one time or repeat loop [loopEndlessly, loopOnceOnly]
    var IS_LOOP_ONCE_ONLY;
    // delay for autoplay between slides (milliseconds)
    var AUTOPLAY_PAUSE__WHILST_RUNNING;
    // in the autoplay mode show only images or the whole collection
    var AUTOPLAY_ONLY_IMAGES = true;

    /**
     * The displayer view is responsible for displaying preview images,
     * launching music or video players, or displaying pre-rendered OX Docs
     * document previews (TBD)
     */
    var DisplayerView = DisposableView.extend({

        className: 'viewer-displayer',

        events: {
            'click a.fullscreen-button': 'toggleFullscreen',
            'click a.autoplay-button': 'handleToggleAutoplayMode'
        },

        initialize: function (options) {
            _.extend(this, options);
            // run own disposer function at global dispose
            this.on('dispose', this.disposeView.bind(this));
            // timeout object for the slide caption
            this.captionTimeoutId = null;
            // timeout object for navigation items
            this.navigationTimeoutId = null;
            // array of all slide content Backbone Views
            this.slideViews = [];
            // local array of loaded slide indices.
            this.loadedSlides = [];
            // number of slides to be prefetched in the left/right direction of the active slide (minimum of 1 required)
            this.preloadOffset = 3;
            // number of slides to be kept loaded at one time in the browser.
            this.slidesToCache = 7;
            // instance of the swiper plugin
            this.swiper = null;

            // the full screen state of the view, off by default.
            this.fullscreen = false;
            // whether or not displayerview is able of auto-play mode that will display image-type file-items exclusively.
            this.canAutoplayImages = false;
            // if able of auto-play mode, the current state of it, either "pausing" or "running".
            this.autoplayMode = '';
            this.autoplayStarted = false;
            // if IS_LOOP_ONCE_ONLY is set, this is the index the autplay should stop
            this.autoplayStopAtIndex = false;

            // listen to blend caption events
            this.listenTo(this.viewerEvents, 'viewer:blendcaption', this.blendCaption);
            this.listenTo(this.viewerEvents, 'viewer:blendnavigation', this.blendNavigation);

            // listen to version change events
            this.listenTo(this.collection, 'change:version', this.onModelChangeVersion.bind(this));
            // listen to version display events
            this.listenTo(this.viewerEvents, 'viewer:display:version', this.onDisplayVersion.bind(this));

            // listen to autoplay events
            this.listenTo(this.viewerEvents, 'viewer:autoplay:toggle', this.handleToggleAutoplayMode.bind(this));

            // listen to delete event propagation from FilesAPI
            this.listenTo(FilesAPI, 'remove:file', this.onFileRemoved.bind(this));

            // a reference to a very own throttled and bound variant of this view's "mousemove" and "click" handler
            // in order to also use it for deregistering purposes while running the autoplay mode.
            this.displayerviewMousemoveClickHandler = _.throttle(this.blendNavigation.bind(this), 500);
            // blend in navigation by user activity
            this.$el.on('mousemove click', this.displayerviewMousemoveClickHandler);

            // Swiper zoom
            this.$el.on('dblclick', '.viewer-displayer-item-container', this.onToggleZoom.bind(this));

            // listen to full screen mode changes
            BigScreen.onchange = this.onChangeFullScreen.bind(this);
        },

        /**
         * Initial Parameter for autoplay mode. Copies all images into an array for the swiper
         */
        initializeAutoplayImageModeData: function () {
            var fileModelList = this.collection.models;
            var imageFileRegistry = fileModelList.reduce(function (map, fileModel) {
                if (fileModel.isImage()) {
                    map[fileModel.attributes.id] = fileModel;
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
         * @returns {DisplayerView|Boolean}
         */
        render: function (model) {
            if (!model) {
                console.error('Core.Viewer.DisplayerView.render(): no file to render');
                return false;
            }

            var self = this;
            var carouselRoot = $('<div id="viewer-carousel" class="swiper-container" role="listbox">');
            var carouselInner = $('<div class="swiper-wrapper">');
            var prevSlide = $('<a href="#" role="button" class="swiper-button-prev swiper-button-control left" aria-controls="viewer-carousel" tabindex="-1"><i class="fa fa-angle-left" aria-hidden="true"></i></a>');
            var nextSlide = $('<a href="#" role="button" class="swiper-button-next swiper-button-control right" aria-controls="viewer-carousel" tabindex="-1"><i class="fa fa-angle-right" aria-hidden="true"></i></a>');
            var caption = $('<div class="viewer-displayer-caption">');
            var autoplay;
            var fullscreen;
            var startIndex = this.collection.getStartIndex();

            var swiperParameter = {
                loop: !this.standalone,
                loopedSlides: 0,
                followFinger: false,
                simulateTouch: false,
                noSwiping: true,
                speed: 0,
                initialSlide: startIndex,
                runCallbacksOnInit: false,
                zoom: {
                    maxRatio: 3,
                    minRatio: 1,
                    toggle: true,
                    containerClass: 'viewer-displayer-item-container'
                },
                navigation: {
                    nextEl: nextSlide[0],
                    prevEl: prevSlide[0]
                },
                on: {
                    slideChangeTransitionStart: this.onSlideChangeStart.bind(this),
                    slideNextTransitionEnd: this.onSlideNextChangeEnd.bind(this),
                    slidePrevTransitionEnd: this.onSlidePrevChangeEnd.bind(this)
                }
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

            // save model to view
            this.model = model;

            // init the carousel and preload neighboring slides on next/prev
            prevSlide.attr({ title: gt('Previous'), 'aria-label': gt('Previous') });
            nextSlide.attr({ title: gt('Next'), 'aria-label': gt('Next') });
            carouselRoot.attr('aria-label', gt('Use left/right arrow keys to navigate and escape key to exit the viewer.'));
            carouselRoot.append(carouselInner);

            if (this.collection.length > 1) {
                // add navigation if there is more than one slide.
                carouselRoot.append(prevSlide, nextSlide);

                this.initializeAutoplayImageModeData();
                if (this.canAutoplayImages) {

                    autoplay = $('<a href="#" role="button" class="autoplay-button"><i class="fa" aria-hidden="true"></i></a>');
                    fullscreen = $('<a href="#" role="button" class="fullscreen-button"><i class="fa fa-arrows-alt" aria-hidden="true"></i></a>');
                    carouselRoot.append(autoplay, fullscreen);

                    requireAutoplayUserSettings(); // call every time for settings might have been changed.
                }
            }

            // append carousel to view
            this.$el.append(carouselRoot, caption).attr({ tabindex: -1, role: 'main' });
            this.carouselRoot = carouselRoot;
            this.carouselInner = carouselInner;

            // initiate swiper
            self.swiper = new Swiper(self.carouselRoot[0], swiperParameter);

            // create slides from file collection and append them to the carousel
            this.createSlides().then(function () {
                if (self.disposed) {
                    return;
                }
                self.carouselRoot.removeClass('initializing');

                // preload selected file and its neighbours initially
                self.loadSlide(startIndex, 'both');

                self.swiper.update();

                // always load duplicate slides of the swiper plugin.
                self.handleDuplicatesSlides();

                self.swiper.slideTo(startIndex + 1);

                self.swiper.autoplay.stop();

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

                var activeSlide = self.swiper ? self.swiper.realIndex : self.collection.getStartIndex();
                var fileId = self.collection.models[activeSlide].get('id');
                handleInitialStateForEnabledAutoplayMode(self, fileId);
                updateVisibilityOfAutoplayControl(self, self.swiper.realIndex);
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
                        var view = new ModelType({
                            model: slideModel,
                            collection: self.collection,
                            el: element,
                            viewerEvents: self.viewerEvents
                        });
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
         * to the carouselInner DOM node.
         *
         * @returns {jQuery.Promise}
         *  a Promise that will be resolved if all slides were created
         *  successfully; or rejected in case of an error.
         */
        createSlides: function () {
            var self = this;
            var promises = [];
            var resultDef;

            this.collection.each(function (model) {
                var def = new $.Deferred();

                TypesRegistry.getModelType(model)
                .then(function (ModelType) {
                    var view = new ModelType({
                        model: model,
                        collection: self.collection,
                        viewerEvents: self.viewerEvents
                    });
                    view.render();
                    return def.resolve(view);
                },
                function () {
                    return def.reject('Cannot require a view type for ', model.get('filename'));
                });

                promises.push(def);
            });

            resultDef = $.when.apply(null, promises);

            resultDef = resultDef.then(function () {
                // in case of success the arguments array contains the View instances
                self.slideViews = Array.from(arguments);
                self.swiper.appendSlide(_.pluck(arguments, 'el'));
            });

            return resultDef;
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
         *
         * @returns {Array} slideRange
         *  an array with all keys for the swiper
         *  Example: if activeSlide is 7 with an offset of 3, the range to load would be for
         *      'left': [4,5,6,7]
         *      'right':      [7,8,9,10]
         *      'both': [4,5,6,7,8,9,10]
         */
        getSlideLoadRange: function (slideIndex, offset, prefetchDirection) {
            var loadRange;

            slideIndex = slideIndex || 0;

            function getLeftRange() {
                return _.range(slideIndex, slideIndex - (offset + 1), -1).sort(function (a, b) {
                    return a - b;
                });
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
            var self = this;
            var activeModel = this.collection.at(slideToLoad);
            var previousModel = this.collection.at(this.swiper.previousIndex - 1) || null;
            var loadRange;

            slideToLoad = slideToLoad || 0;

            loadRange = this.getSlideLoadRange(slideToLoad, this.preloadOffset, prefetchDirection);

            // prefetch data of the slides within the preload offset range
            _.each(loadRange, function (slideIndex) {
                if (!self.isSlideLoaded(slideIndex)) {
                    self.slideViews[slideIndex].prefetch();
                    self.loadedSlides.push(slideIndex);
                }
            });

            // show active slide
            this.slideViews[slideToLoad].show();

            registerAutoplayEventHandlingForUpdatedCarouselView(self);

            hideViewerControlsInCaseOfRunningAutoplayHasBeenTriggered(self);

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
            if (!versionData) {
                return;
            }

            var id = versionData.id;
            var folder_id = versionData.folder_id;
            var modified = versionData.last_modified;
            var isToday = moment().isSame(moment(modified), 'day');
            var model = this.collection.find(function (m) {
                return (m.get('id') === id) && (m.get('folder_id') === folder_id);
            });
            var dateString = modified ? moment(modified).format(isToday ? 'LT' : 'l LT') : '-';

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
            if (!model) {
                return;
            }

            var index = this.collection.indexOf(model);
            var slideNode = this.slideViews[index].$el;
            var versionParam = _.isEmpty(version) ? null : { version: version };
            var prefetchParam = _.extend({ priority: 1 }, versionParam);

            // unload current slide content and dispose the view instance
            // the DOM node is re-used, so the dispose function won't be called automatically.
            this.slideViews[index].unload().dispose();
            // load model and create new slide slide content
            TypesRegistry.getModelType(model)
                .then(
                    function (ModelType) {
                        var view = new ModelType({
                            model: model,
                            collection: this.collection,
                            el: slideNode,
                            viewerEvents: this.viewerEvents
                        });
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

            var slideCaption = this.$el.find('.viewer-displayer-caption');
            var captionContent = $('<div class="caption-content">').text(text);

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
            var x;
            var y;
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
                var duration = 3000;
                var navigationArrows = this.$el.find('.swiper-button-control');
                window.clearTimeout(this.navigationTimeoutId);
                navigationArrows.show();
                this.navigationTimeoutId = window.setTimeout(function () {
                    // navigationArrows.fadeOut();
                    _.each(navigationArrows, function (arrow) {
                        var $arrow = $(arrow);
                        if ($arrow.is(':not(:hover)')) {
                            $arrow.fadeOut();
                        }
                    });
                }, duration);
            };
        })(),

        /**
         * Focuses the swiper's current active slide.
         */
        focusActiveSlide: function () {
            this.swiper.slides.attr({ tabindex: -1, 'aria-selected': 'false' });
            this.getActiveSlideNode().attr({ tabindex: 0, 'aria-selected': 'true' }).visibleFocus();
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

            var node = this.swiper.slides[this.swiper.activeIndex];
            return (node) ? $(node) : $();
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
            if (!this.swiper || !this.swiper.slides || !_.isNumber(this.swiper.previousIndex)) {
                return $();
            }

            var node = this.swiper.slides[this.swiper.previousIndex];
            return (node) ? $(node) : $();
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
         *  Example with 15 slides and start at 0:
         *      [-3,-2,-1,0,1,2,3,] => [12,13,14,0,1,2,3]
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
         * Swiper zoom handler
         */
        onToggleZoom: function () {
            if (this.swiper && this.swiper.zoom.enabled) {
                this.swiper.zoom.toggle();
            }
        },

        /**
         * Slide change start handler:
         * - save scroll positions of each slide while leaving it.
         * - save zoom level of each slide too
         */
        onSlideChangeStart: function () {
            var previousSlide = this.getPreviousSlideNode();
            var previousIndex = parseInt(previousSlide.data('swiper-slide-index'), 10);
            var activeSlideView = this.slideViews[previousIndex];
            var scrollPosition;

            if (activeSlideView) {
                scrollPosition = activeSlideView.$el.scrollTop();
                if (activeSlideView.pdfDocument) {
                    activeSlideView.setInitialScrollPosition(activeSlideView.model.get('id'), scrollPosition);
                }
            }
        },

        onSlideNextChangeEnd: function () {
            this.onSlideChangeEnd('right');
        },

        onSlidePrevChangeEnd: function () {
            this.onSlideChangeEnd('left');
        },

        /**
         * Handler for the slideChangeEnd event of the swiper plugin.
         * - preload neighboring slides
         * - broadcast 'viewer:displayeditem:change' event
         * - add a11y attributes
         */
        onSlideChangeEnd: function (preloadDirection) {
            var activeSlideNode = this.getActiveSlideNode();
            var previousSlideNode = this.getPreviousSlideNode();

            if (this.autoplayMode !== 'running') {  // - only in case of autoplay is not running at all.

                //#. information about position of the current item in viewer
                //#. this will only be shown for more than one item
                //#. %1$d - position of current item
                //#. %2$d - total amount of item
                this.blendCaption(gt.ngettext(      // - directly access this view's caption blend method.
                    '%1$d of %2$d item',
                    '%1$d of %2$d items',
                    this.collection.length,
                    this.swiper.realIndex + 1,
                    this.collection.length
                ));
                this.blendNavigation();             // - directly access this view's navigation blend method.

            } else if (IS_LOOP_ONCE_ONLY && this.autoplayStopAtIndex === this.swiper.realIndex) {
                this.toggleFullscreen();
            }

            this.loadSlide(this.swiper.realIndex, preloadDirection);

            // a11y
            activeSlideNode.attr({ 'aria-selected': 'true', tabindex: 0 });
            previousSlideNode.attr({ 'aria-selected': 'false', tabindex: -1 });

            // pause playback on audio and video slides
            previousSlideNode.find('audio, video').each(function () {
                this.pause();
            });

            this.viewerEvents.trigger('viewer:displayeditem:change', this.collection.at(this.swiper.realIndex));

            this.unloadDistantSlides(this.swiper.realIndex);
        },

        /**
         * File remove handler.
         *
         * @param {Array} removedFiles
         *  an array consisting of objects representing file models.
         */
        onFileRemoved: function (removedFiles) {
            if (!_.isArray(removedFiles) || removedFiles.length < 1) {
                return;
            }
            // identify removed models
            var removedFileCid = removedFiles[0].cid;
            var removedFileModel = this.collection.get(removedFileCid);
            var removedFileModelIndex = this.collection.indexOf(removedFileModel);

            // remove the deleted file(s) from Viewer collection
            this.collection.remove(removedFileModel);
            // unload removed slide
            self.slideViews[removedFileModelIndex].unload().dispose();
            // remove slide from the swiper plugin
            this.swiper.removeSlide(removedFileModelIndex);
            // render the duplicate slides
            this.handleDuplicatesSlides();
            // reset the invalidated local loaded slides array
            this.loadedSlides = [];
            // remove corresponding view type of the file
            this.slideViews.splice(removedFileModelIndex, 1);
            // close viewer we don't have any files to show
            if (this.collection.length === 0) {
                this.viewerEvents.trigger('viewer:close');
                return;
            }
        },

        /**
         * Handler for starting the autoplay. If AUTOPLAY_ONLY_IMAGES is set to true a copy of the current collection
         * is saved in the object. And only images are copied into the swiper.
         */
        onAutoplayStart: function () {
            if (!this.swiper) { return; }

            var SWIPER_AUTOPLAY = {
                autoplay: {
                    delay: AUTOPLAY_PAUSE__WHILST_RUNNING,
                    disableOnInteraction: false
                }
            };

            var self = this;
            var imageFileModelList = Object.keys(this.imageFileRegistry).map(function (key) {
                return self.imageFileRegistry[key];
            });

            var activeFileId = self.collection.models[self.swiper.realIndex].get('id');

            if (AUTOPLAY_ONLY_IMAGES) {
                // exchange collection data
                this.collectionBackup = this.collection.clone();
                this.collection.reset(imageFileModelList);
                var activeIndex = _.findIndex(imageFileModelList, function (fileModel) {
                    return (fileModel.attributes.id === activeFileId);
                });
                this.slideViews = [];
                this.loadedSlides = [];

                // remove old slides
                this.swiper.removeAllSlides();

                // add new slides
                this.createSlides().then(function success() {
                    if (self.disposed) {
                        return;
                    }
                    self.carouselRoot.removeClass('initializing');

                    // load content for active slide
                    self.loadSlide(activeIndex, 'both');
                    self.swiper.update();
                    // load the swiper duplicates
                    self.handleDuplicatesSlides();

                    self.swiper.slideTo(activeIndex + 1);

                    if (IS_LOOP_ONCE_ONLY) {
                        self.autoplayStopAtIndex = self.normalizeSlideIndex(self.swiper.realIndex - 1);
                    }

                    _.extend(self.swiper.params, SWIPER_AUTOPLAY);
                    self.swiper.autoplay.start();
                    self.autoplayStarted = true;
                    self.viewerEvents.trigger('viewer:autoplay:state:changed', { autoplayStarted: self.autoplayStarted });
                });
            }

        },

        /**
         * Handler for stopping the autoplay. if AUTOPLAY_ONLY_IMAGES is set to true the backup collection inside
         * the object is restored into the swiper
         */
        onAutoplayStop: function () {
            if (!this.swiper) { return; }

            var self = this;
            this.autoplayStarted = false;
            this.swiper.autoplay.stop();
            this.autoplayStopAtIndex = false;
            this.viewerEvents.trigger('viewer:autoplay:state:changed', { autoplayStarted: this.autoplayStarted });

            var activeFileModel = self.collection.models[self.swiper.realIndex];

            if (AUTOPLAY_ONLY_IMAGES && this.collectionBackup.length) {
                // remove old slides
                this.swiper.removeAllSlides();

                // exchange collection data
                this.collection.reset(this.collectionBackup.models);
                var activeIndex = this.collection.indexOf(activeFileModel);
                this.collectionBackup = false;
                this.slideViews = [];
                this.loadedSlides = [];

                // create new slides
                this.createSlides().then(function success() {

                    if (self.disposed) {
                        return;
                    }
                    self.carouselRoot.removeClass('initializing');

                    // load content for active slide
                    self.loadSlide(activeIndex, 'both');
                    self.swiper.update();
                    // load the swiper duplicates
                    self.handleDuplicatesSlides();

                    self.swiper.slideTo(activeIndex + 1);

                    self.autoplayStarted = false;
                });
            }
        },

        /**
         * Checks if the autoplay is already triggered
         *
         * @returns {boolean} autoplayStarted
         */
        hasAutoplayStartAlreadyBeenTriggered: function () {
            return this.autoplayStarted;
        },

        /**
         * Handles the autoplay options
         *
         * @param {String} mode
         *   the mode to switch the autoplay states
         *   Example: 'running', 'pausing' and 'undefined' are supported
         *      running: show the pause icon
         *      pausing: show the play icon
         *      undefined: if autorun is not run yet, the mode is pausing. else it switches the current mode
         */
        handleToggleAutoplayMode: function (mode) {
            mode = (
                ((mode === 'running') || (mode === 'pausing') && mode) ||

                ((this.autoplayMode === 'pausing') && 'running') ||
                ((this.autoplayMode === 'running') && 'pausing') ||

                'pausing'
            );
            if (mode === 'pausing') {
                if (this.hasAutoplayStartAlreadyBeenTriggered()) {
                    if (!this.fullscreen) {
                        this.onAutoplayStop();
                    } else {
                        this.toggleFullscreen(false);
                    }
                }
                updateAutoplayButton(this, 'play');

            } else {
                updateAutoplayButton(this, 'pause');
                this.onAutoplayStart();
                if (!this.fullscreen) {
                    this.toggleFullscreen(true);
                }

                this.$el.focus();
                this.carouselRoot.removeClass('autoplay-controls-visible');
            }
            this.autoplayMode = mode;
        },

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
                if (!_.isBoolean(state)) {
                    BigScreen.toggle(this.carouselRoot[0]);
                } else if (state) {
                    BigScreen.request(this.carouselRoot[0]);
                } else {
                    BigScreen.exit();
                }
            }
        },

        /**
         * Handle full screen mode change event.
         *
         * Note: BigScreen.onchange is the only event that works correctly with current Firefox.
         *
         * @param {DOM|null} element
         *  The element that is currently displaying in full screen or null.
         */
        onChangeFullScreen: function (element) {
            var displayerView = this;
            if (_.isNull(element)) {
                handleExitFullscreen(displayerView);
            } else if (element === this.carouselRoot[0]) {
                handleEnterFullscreen(displayerView);
            }
        },

        /**
         * Unloads slides that are outside of a 'cached' slide range, to prevent bloating of OX Viewer
         * DOM Elements if we encounter a folder with a lot of files.
         *
         * The cached slide range is an array of slide indexes built from the current active slide index
         * plus the preload offset in both directions.
         * Example: if active slide is 7 with a preload offset of 3, the range would be: [4,5,6,7,8,9,10]
         *
         * @param activeSlideIndex
         *  Current active swiper slide index
         */
        unloadDistantSlides: function (activeSlideIndex) {
            var self = this;
            var cachedRange = this.getSlideLoadRange(activeSlideIndex, this.preloadOffset, 'both');
            var slidesToUnload = _.difference(self.loadedSlides, cachedRange);

            _.each(slidesToUnload, function (index) {
                self.slideViews[index].unload();
            });

            this.loadedSlides = cachedRange;
        },

        disposeView: function () {
            window.clearTimeout(this.captionTimeoutId);
            window.clearTimeout(this.navigationTimeoutId);

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

            this.displayerviewMousemoveClickHandler = null;
            this.fullscreen = null;

            return this;
        }
    });

    return DisplayerView;
});
