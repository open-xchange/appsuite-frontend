/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

// based on jQuery.lazyload (https://github.com/tuupola/jquery_lazyload)
// but completely refactored und reduced to our use-cases:

(function ($) {

    $.fn.lazyload = function () {
        this.each(function () {
            _.defer(function () {
                // look for potential scrollpane
                this.closest('.scrollpane, .scrollable, .list-view').lazyloadScrollpane();
                this.trigger('scroll');
            }.bind($(this).addClass('lazyload')));
        });
        return this;
    };

    // no need to call this directly
    $.fn.lazyloadScrollpane = function (options) {

        // don't add twice
        if (this.prop('lazyload')) return this; else this.prop('lazyload', true);

        var scrollpane = this;
        options = _.extend({ effect: 'show' }, options);

        function update() {
            // might be disposed
            if (!scrollpane) return;
            // get viewport dimensions once
            var viewport = getViewport(scrollpane);
            // loop over all elements with class="lazyload"
            scrollpane.find('.lazyload').each(function () {
                // skip if already loaded
                if (this.loaded) return;
                // get offset for each element
                var element = $(this), offset = element.offset();
                // checks
                if (aboveViewport(viewport, offset, element.height())) return;
                if (leftOfViewport(viewport, offset, element.width())) return;
                // we assume that elements are in order, i.e. we can stop the loop if we are below or right of the viewport
                if (belowViewport(viewport, offset) || rightOfViewport(viewport, offset)) return false;
                // otherwise
                element.trigger('appear').removeClass('lazyload');
            });
        }

        // respond to resize event; some elements might become visible
        $(window).on('resize.lazyload', _.debounce(update, 100));

        this.on('appear.lazyload', '.lazyload', function (e) {
                // response to appear event
                onAppear.call(this, options);
            })
            .on({
                // response to add.lazyload event
                'add.lazyload': _.debounce(update, 10),
                // update on scroll stop
                'scroll.lazyload': _.debounce(update, 300),
                // clean up on dispose
                'dispose': function () {
                    $(window).off('resize.lazyload');
                    $(this).off('add.lazyload scroll.lazyload appear.lazyload');
                    scrollpane = options = null;
                }
            });

        return this;
    };

    // central appear event

    function onAppear(options) {

        if (this.loaded) return;

        var node = $(this);

        $('<img>').on({
            'load': function () {

                var original = node.attr('data-original');

                if (options.effect !== 'show') node.hide();

                if (node.is('img')) {
                    node.attr('src', original);
                } else {
                    node.css('background-image', 'url("' + original + '")');
                }

                // show / fade-in
                node[options.effect]();
                node.prop('loaded', true);

                node.trigger('load.lazyload', this, options);
                $(this).off();
                node = options = null;
            },
            'error': function () {
                node.trigger('error.lazyload', this, options);
                $(this).off();
                node = options = null;
            }
        })
        .attr('src', node.attr('data-original'));
    }

    // helper

    function getViewport(scrollpane) {
        var offset = scrollpane.offset();
        return {
            top: offset.top,
            right: offset.left + scrollpane.width(),
            bottom: offset.top + scrollpane.height(),
            left: offset.left
        };
    }

    function belowViewport(viewport, offset) {
        return viewport.bottom <= offset.top;
    }

    function rightOfViewport(viewport, offset) {
        return viewport.right <= offset.left;
    }

    function aboveViewport(viewport, offset, height) {
        return viewport.top >= offset.top + height;
    }

    function leftOfViewport(viewport, offset, width) {
        return viewport.left >= offset.left + width;
    }

}(jQuery));
