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
                prevSlide = $('<a class="left carousel-control" href="#viewer-carousel" role="button" data-slide="prev" tabindex="1"><i class="fa fa-angle-left"></i></a>'),
                nextSlide = $('<a class="right carousel-control" href="#viewer-carousel" role="button" data-slide="next" tabindex="1"><i class="fa fa-angle-right"></i></a>'),
                // preload 1 neigboring slides
                slidesToPreload = 1,
                slidesCount = this.collection.length,
                displayerTopOffset = $('.viewer-toolbar').outerHeight(),
                startIndex = data.index;

            // create a Bootstrap carousel slide
            function createSlide (model, modelIndex) {
                var slide = $('<div class="item">'),
                    image = $('<img class="viewer-displayer-image">'),
                    caption = $('<div class="viewer-displayer-caption">'),
                    previewUrl = model && model.getPreviewUrl(),
                    filename = model && model.get('filename') || '';
                if (previewUrl) {
                    image.attr({ 'data-src': _.unescapeHTML(previewUrl), alt: filename })
                        .css({ maxHeight: window.innerHeight - displayerTopOffset });
                    caption.text(modelIndex + 1 + ' ' + gt('of') + ' ' + slidesCount);
                    slide.append(image, caption);
                }
                slide.attr('data-slide', modelIndex);
                return slide;
            }

            // load the given slide index and additionally number of neigboring slides in the given direction.
            function preloadSlide(slideToLoad, preloadOffset, preloadDirection) {
                var preloadOffset = preloadOffset || 0,
                    step = preloadDirection === 'left' ? 1 : -1,
                    slideToLoad = slideToLoad || 0,
                    loadRange = _.range(slideToLoad, (preloadOffset + 1) * step + slideToLoad, step);
                // load a single slide with the given slide index
                function loadSlide (slideIndex) {
                    if (typeof slideIndex !== 'number' || isNaN(slideIndex) || Math.abs(slideIndex) >= slidesCount) {
                        return;
                    }
                    var slideIndex = slideIndex % slidesCount,
                        slideEl = slidesList.eq(slideIndex),
                        imageToLoad = slideEl.find('img');
                    if (imageToLoad.attr('src')) { return ;}
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
            }

            // create slides from file collection and append them to the carousel
            this.collection.each(function (model, modelIndex) {
                carouselInner.append(createSlide(model, modelIndex));
            });

            // set the first selected file active and preload its neighbours
            var slidesList = carouselInner.children();
            slidesList.eq(startIndex).addClass('active');
            preloadSlide(startIndex, slidesToPreload, 'left');
            preloadSlide(startIndex, slidesToPreload, 'right');

            // init the carousel and preload neighboring slides on next/prev
            carouselRoot.append(carouselInner, prevSlide, nextSlide)
                .carousel({ keyboard: false })
                .on('slid.bs.carousel', function (event) {
                    var activeSlideIndex = $(event.relatedTarget).data('slide');
                    preloadSlide(activeSlideIndex, slidesToPreload, event.direction);
                });

            // append carousel to view
            this.$el.append(carouselRoot);
            return this;
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
