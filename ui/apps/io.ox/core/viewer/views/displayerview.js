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

            this.listenTo(EventDispatcher, 'viewer:displayeditem:change', function (data) {
                console.warn('SidebarbarView viewer:displayeditem:change', data);
            });
        },

        render: function () {
            console.warn('DisplayerView.render()');

            // init carousel with  dummy slides.
            var carouselRoot = $('<div id="viewer-carousel" class="carousel">'),
                carouselInner = $('<div class="carousel-inner">');
//                slide1 = $('<div class="item active"><img src="http://localhost:8337/appsuite/api/files?action=document&folder=135&id=135/657&delivery=view&scaleType=contain&content_type=image/jpeg">'),
//                slide2 = $('<div class="item"><img src="http://localhost:8337/appsuite/api/files?action=document&folder=135&id=135/658&delivery=view&scaleType=contain&content_type=image/jpeg">'),
//                slide3 = $('<div class="item"><img src="http://localhost:8337/appsuite/api/files?action=document&folder=135&id=135/659&delivery=view&scaleType=contain&content_type=image/jpeg">'),
//                slide4 = $('<div class="item"><img src="http://localhost:8337/appsuite/api/files?action=document&folder=135&id=135/660&delivery=view&scaleType=contain&content_type=image/jpeg">'),
//                slide5 = $('<div class="item"><img src="http://localhost:8337/appsuite/api/files?action=document&folder=135&id=135/661&delivery=view&scaleType=contain&content_type=image/jpeg">');

            var prevSlide = $('<a class="left carousel-control" href="#viewer-carousel" role="button" data-slide="prev"><i class="fa fa-angle-left"></i></a>'),
                nextSlide = $('<a class="right carousel-control" href="#viewer-carousel" role="button" data-slide="next"><i class="fa fa-angle-right"></i></a>');

            function createSlide (model) {
                var slide = $('<div>').addClass('item'),
                    image = $('<img>'),
                    previewUrl = model && model.getPreviewUrl(),
                    filename = model && model.get('filename') || '';

                if (previewUrl) {
                    image.attr({ src: previewUrl, alt: filename });
                    slide.append(image);
                }

                return slide;
            }

            this.collection.each(function (model) {
                carouselInner.append(createSlide(model));
            });

            // set first item active, to be change when we handle selected drive items
            carouselInner.find('div.item').first().addClass('active');

//            carouselInner.append(slide1, slide2, slide3, slide4, slide5);
            carouselRoot.append(carouselInner, prevSlide, nextSlide);

            carouselRoot.carousel();

            this.$el.append(carouselRoot);

            return this;
        },

        onPreviousSlide: function () {
            console.warn('DisplayerView.onPreviousSlide()');
            EventDispatcher.trigger('viewer:display:previous');
        },

        onNextSlide: function () {
            console.warn('DisplayerView.onNextSlide()');
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
