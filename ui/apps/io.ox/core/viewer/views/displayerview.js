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
 */
define('io.ox/core/viewer/views/displayerview', function () {

    'use strict';

    /**
     * The displayer view is responsible for displaying preview images,
     * launching music or video players, or displaying pre-rendered OX Docs
     * document previews (TBD)
     */
    var DisplayerView = Backbone.View.extend({

        className: 'viewer-displayer',

        events: {

        },

        initialize: function () {
            //console.warn('DisplayerView.initialize()');
            this.$el.on('dispose', this.dispose.bind(this));
        },

        render: function () {
            // console.warn('DisplayerView.render()');
            // init carousel with  dummy slides.
            var carouselRoot = $('<div id="viewer-carousel" class="carousel">'),
                carouselInner = $('<div class="carousel-inner">'),
                slide1 = $('<div class="item active"><img src="http://localhost:8337/appsuite/api/files?action=document&folder=135&id=135/657&delivery=view&scaleType=contain&content_type=image/jpeg">'),
                slide2 = $('<div class="item"><img src="http://localhost:8337/appsuite/api/files?action=document&folder=135&id=135/658&delivery=view&scaleType=contain&content_type=image/jpeg">'),
                slide3 = $('<div class="item"><img src="http://localhost:8337/appsuite/api/files?action=document&folder=135&id=135/659&delivery=view&scaleType=contain&content_type=image/jpeg">'),
                slide4 = $('<div class="item"><img src="http://localhost:8337/appsuite/api/files?action=document&folder=135&id=135/660&delivery=view&scaleType=contain&content_type=image/jpeg">'),
                slide5 = $('<div class="item"><img src="http://localhost:8337/appsuite/api/files?action=document&folder=135&id=135/661&delivery=view&scaleType=contain&content_type=image/jpeg">');

            var prevSlide = $('<a class="left carousel-control" href="#viewer-carousel" role="button" data-slide="prev"><i class="fa fa-angle-left"></i></a>'),
                nextSlide = $('<a class="right carousel-control" href="#viewer-carousel" role="button" data-slide="next"><i class="fa fa-angle-right"></i></a>');

            carouselInner.append(slide1, slide2, slide3, slide4, slide5);
            carouselRoot.append(carouselInner, prevSlide, nextSlide);

            carouselRoot.carousel();

            this.$el.append(carouselRoot);

            return this;
        },

        dispose: function () {
            //console.info('DisplayerView.dispose()');
            this.stopListening();
            return this;
        }
    });

    return DisplayerView;
});
