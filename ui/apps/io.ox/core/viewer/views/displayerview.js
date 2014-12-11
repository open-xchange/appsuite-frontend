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
    'io.ox/core/viewer/eventdispatcher'
], function (EventDispatcher) {

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
            'click a.right.carousel-control': 'onNextSlide'
        },

        initialize: function () {
            //console.warn('DisplayerView.initialize()');
            this.$el.on('dispose', this.dispose.bind(this));
        },

        render: function () {
            //console.warn('DisplayerView.render()');
            var carouselRoot = $('<div id="viewer-carousel" class="carousel">'),
                carouselInner = $('<div class="carousel-inner">'),
                prevSlide = $('<a class="left carousel-control" href="#viewer-carousel" role="button" data-slide="prev"><i class="fa fa-angle-left"></i></a>'),
                nextSlide = $('<a class="right carousel-control" href="#viewer-carousel" role="button" data-slide="next"><i class="fa fa-angle-right"></i></a>'),
                slideToLoad = 0;

            function createSlide (model, modelIndex) {
                var slide = $('<div>').addClass('item'),
                    image = $('<img>').addClass('viewer-carousel-image'),
                    previewUrl = model && model.getPreviewUrl(),
                    filename = model && model.get('filename') || '';
                if (previewUrl) {
                    image.attr({ 'data-src': _.unescapeHTML(previewUrl), alt: filename })
                        .css({ maxHeight: window.innerHeight - carouselRoot.offset().top });
                    slide.append(image);
                }
                slide.attr('data-slide', modelIndex);
                return slide;
            }

            function loadSlide (slideIndex) {
                //console.warn('DisplayerView.render.loadSlide()', slideIndex);
                if (Math.abs(slideIndex) >= slidesList.length) { return; }
                var slide = slidesList.eq(slideIndex),
                    imageToLoad = slide.find('img');
                slide.busy();
                imageToLoad.attr('src', imageToLoad.attr('data-src'));
                imageToLoad[0].onload = function () {
                    slide.idle();
                    imageToLoad.show();
                };
            }

            // create slides from file collection and append them to the carousel
            this.collection.each(function (model, modelIndex) {
                carouselInner.append(createSlide(model, modelIndex));
            });

            // set first item active, load first item and its neighbors initially
            // TODO load selected file from OX Drive/Mail
            var slidesList = carouselInner.children();
            slidesList.first().addClass('active');
            loadSlide(slideToLoad);
            loadSlide(slideToLoad + 1);
            loadSlide(slideToLoad - 1);

            // init the carousel
            carouselRoot.append(carouselInner, prevSlide, nextSlide)
                .carousel()
                .on('slid.bs.carousel', function (event) {
                    var activeSlideIndex = $(event.relatedTarget).data('slide'),
                        preloadOffset = event.direction === 'left' ? 1 : -1;
                    loadSlide(activeSlideIndex + preloadOffset);
                });

            // append carousel to view
            this.$el.append(carouselRoot);
            return this;
        },

        onPreviousSlide: function () {
            //console.warn('DisplayerView.onPreviousSlide()');
            EventDispatcher.trigger('viewer:display:previous');
        },

        onNextSlide: function () {
            //console.warn('DisplayerView.onNextSlide()');
            EventDispatcher.trigger('viewer:display:next');
        },

        dispose: function () {
            //console.info('DisplayerView.dispose()');
            this.stopListening();
            return this;
        }
    });

    return DisplayerView;
});
