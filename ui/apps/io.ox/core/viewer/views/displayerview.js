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

            this.listenTo(EventDispatcher, 'viewer:displayeditem:change', function (/*data*/) {
                //console.warn('SidebarbarView viewer:displayeditem:change', data);
            });

            this.listenTo(EventDispatcher, 'viewer:toggle:sidebar', this.onToggleSidebar);

        },

        render: function () {
            //console.warn('DisplayerView.render()');

            // init carousel with  dummy slides.
            var carouselRoot = $('<div id="viewer-carousel" class="carousel">'),
                carouselInner = $('<div class="carousel-inner">'),
                prevSlide = $('<a class="left carousel-control" href="#viewer-carousel" role="button" data-slide="prev"><i class="fa fa-angle-left"></i></a>'),
                nextSlide = $('<a class="right carousel-control" href="#viewer-carousel" role="button" data-slide="next"><i class="fa fa-angle-right"></i></a>');

            function createSlide (model) {
                var slide = $('<div>').addClass('item'),
                    image = $('<img>'),
                    previewUrl = model && model.getPreviewUrl(),
                    filename = model && model.get('filename') || '';

                if (previewUrl) {
                    image.attr({ src: _.unescapeHTML(previewUrl), alt: filename });
                    slide.append(image);
                }

                return slide;
            }

            this.collection.each(function (model) {
                carouselInner.append(createSlide(model));
            });

            // set first item active, to be change when we handle selected drive items
            carouselInner.find('div.item').first().addClass('active');

            carouselRoot.append(carouselInner, prevSlide, nextSlide);

            carouselRoot.carousel();

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

        onToggleSidebar: function () {
            //console.warn('MainView.onToggleSidebar()');
            this.$el.toggleClass('sidebar-opened');
            if (this.$el.hasClass('sidebar-opened') && !_.device('small')) {
                this.$el.css({ width: window.innerWidth - 400 });
            } else {
                this.$el.css({ width: '100%' });
            }
        },

        dispose: function () {
            //console.info('DisplayerView.dispose()');
            this.stopListening();
            return this;
        }
    });

    return DisplayerView;
});
