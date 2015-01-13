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
    'gettext!io.ox/core'
], function (EventDispatcher, gt) {

    'use strict';

    /**
     * The displayer view is responsible for displaying preview images,
     * launching music or video players, or displaying pre-rendered OX Docs
     * document previews (TBD)
     */
    var DisplayerView = Backbone.View.extend({

        className: 'viewer-displayer',

        events: {
            'click a.left.carousel-control': 'onPreviousSlide',
            'click a.right.carousel-control': 'onNextSlide',
            'keydown': 'onKeydown'
        },

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
                prevSlide = $('<a class="left carousel-control" href="#viewer-carousel"><i class="fa fa-angle-left"></i></a>'),
                nextSlide = $('<a class="right carousel-control" href="#viewer-carousel"><i class="fa fa-angle-right"></i></a>'),
                // preload 1 neigboring slides
                slidesToPreload = 1,
                startIndex = data.index,
                self = this;

            // create slides from file collection and append them to the carousel
            this.collection.each(function (model, modelIndex) {
                carouselInner.append(self.createSlide(model, modelIndex));
            });

            // init the carousel and preload neighboring slides on next/prev
            prevSlide.attr({ title: gt('Previous'), 'data-slide': 'prev', tabindex: '1', role: 'button' });
            nextSlide.attr({ title: gt('Next'), 'data-slide': 'next', tabindex: '1', role: 'button' });
            carouselRoot.append(carouselInner, prevSlide, nextSlide)
                .carousel({ keyboard: false })
                .on('slid.bs.carousel', function (event) {
                    var activeSlideIndex = $(event.relatedTarget).data('slide'),
                        captionShowDuration = 3000;
                    self.preloadSlide(activeSlideIndex, slidesToPreload, event.direction);
                    self.blendSlideCaption(activeSlideIndex, captionShowDuration);
                });

            // append carousel to view and blend the slide caption in
            this.$el.append(carouselRoot);

            // set the first selected file active, blend its caption, and preload its neighbours
            carouselInner.children().eq(startIndex).addClass('active');
            this.blendSlideCaption(startIndex, 3000);
            this.preloadSlide(startIndex, slidesToPreload, 'left');
            this.preloadSlide(startIndex, slidesToPreload, 'right');

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
            var slide = $('<div class="item">'),
                image = $('<img class="viewer-displayer-image">'),
                caption = $('<div class="viewer-displayer-caption">'),
                previewUrl = model && model.getPreviewUrl(),
                filename = model && model.get('filename') || '',
                slidesCount = this.collection.length,
                displayerTopOffset = $('.viewer-toolbar').outerHeight();
            if (previewUrl) {
                image.attr({ 'data-src': _.unescapeHTML(previewUrl), alt: filename })
                    .css({ maxHeight: window.innerHeight - displayerTopOffset });
                caption.text(modelIndex + 1 + ' ' + gt('of') + ' ' + slidesCount);
                slide.append(image, caption);
            }
            slide.attr('data-slide', modelIndex);
            return slide;
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
                slidesCount = this.collection.length,
                slidesList = this.$el.find('.item');
            // load a single slide with the given slide index
            function loadSlide (slideIndex) {
                if (typeof slideIndex !== 'number' || isNaN(slideIndex) || Math.abs(slideIndex) >= slidesCount) {
                    return;
                }
                var slideIndex = slideIndex % slidesCount,
                    slideEl = slidesList.eq(slideIndex),
                    imageToLoad = slideEl.find('img');
                if (imageToLoad.length === 0 || imageToLoad.attr('src')) { return ;}
                slideEl.busy();
                imageToLoad.attr('src', imageToLoad.attr('data-src'));
                imageToLoad[0].onload = function () {
                    slideEl.idle();
                    imageToLoad.show();
                };
                imageToLoad[0].onerror = function () {
                    var notification = $('<p class="viewer-displayer-notification">')
                        .text(gt('Sorry, there is no preview available for this file.'));
                    slideEl.idle().append(notification);
                };
            }
            // load the load range, containing the requested slide and preload slides
            _.each(loadRange, loadSlide);
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

        onPreviousSlide: function () {
            //console.warn('DisplayerView.onPreviousSlide()');
            EventDispatcher.trigger('viewer:display:previous');
            this.focusDisplayerDeferred();
        },

        onNextSlide: function () {
            //console.warn('DisplayerView.onNextSlide()');
            EventDispatcher.trigger('viewer:display:next');
            this.focusDisplayerDeferred();
        },

        onKeydown: function (event) {
            //console.warn('DisplayerView.onKeydown()', event, event.which);
            switch (event.which || event.keyCode) {
                case 39: // right arrow
                    this.onNextSlide();
                    break;
                case 37: // left arrow
                    this.onPreviousSlide();
                    break;
            }
        },

        focusDisplayerDeferred: function () {
            var self = this;
            _.defer(function () {
                self.$el.find('.active').focus();
            });
        },

        dispose: function () {
            //console.info('DisplayerView.dispose()');
            this.stopListening();
            return this;
        }
    });

    return DisplayerView;
});
