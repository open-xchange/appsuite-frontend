/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
*/

(function () {

    'use strict';

    // save some original jQuery methods
    $.original = { val: $.fn.val };

    $.preventDefault = function (e) {
        e.preventDefault();
    };

    $.escape = function (str) {
        // escape !"#$%&'()*+,./:;<=>?@[\]^`{|}~
        // see http://api.jquery.com/category/selectors/
        return String(str).replace(/([!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~])/g, '\\$1');
    };

    $.button = function (options) {

        // options
        var opt = $.extend({
            label: '',
            click: $.noop,
            enabled: true,
            data: {},
            css: {},
            primary: false,
            info: false,
            success: false,
            warning: false,
            danger: false,
            inverse: false

            // other options:
            // tabIndex, id, mousedown
        }, options || {});
        // class name
        var className;
        if (opt.purelink === true) {
            className = 'button io-ox-action-link';
        } else {
            className = 'btn' + (!opt.enabled ? ' btn-disabled' : '') + (opt.primary ? ' btn-primary' : '') + (opt.info ? ' btn-info' : '') + (opt.success ? ' btn-success' : '') + (opt.warning ? ' btn-warning' : '') + (opt.danger ? ' btn-danger' : '') + (opt.inverse ? ' btn-inverse' : '');

        }

        // create text node
        var text;
        if (opt.label.nodeType === 3) {
            // is text node!
            text = opt.label;
        } else {
            text = document.createTextNode(opt.label);
        }

        // create button
        var button;
        if (opt.purelink === true) {
            button = $('<a>').addClass(className).append(text);
        } else {
            button = $('<button>').addClass(className).append(
                $('<span>').append(text)
            );
        }
        button.on('click', opt.data, opt.click);

        // add id?
        if (opt.id !== undefined) {
            button.attr('id', opt.id);
        }

        button.attr('data-action', opt.dataaction || opt.data.action);

        // add tabindex?
        if (opt.tabIndex !== undefined) {
            button.attr('tabindex', opt.tabIndex);
        }

        return button;
    };

    $.fn.busy = function (empty) {
        return this.each(function () {
            var self = $(this);
            clearTimeout(self.data('busy-timeout'));
            self.data('busy-timeout', setTimeout(function () {
                self.addClass('io-ox-busy');
                if (empty) self.empty();
            }, 300));
        });
    };

    $.fn.idle = function () {
        return this.each(function () {
            var self = $(this);
            clearTimeout(self.data('busy-timeout'));
            self.removeClass('io-ox-busy');
        });
    };

    $.fn.intoViewport = function (node) {

        if (!node || this.length === 0) {
            return this;
        }

        try {

            // get pane
            var pane = $(node),
                // get visible area
                y1 = pane.scrollTop(),
                y2 = 0,
                // get top position
                top = this.offset().top + y1 - pane.offset().top,
                h = 0, left = 0;
            // out of visible area?
            if (top < y1) {
                // scroll up!
                top = top < 50 ? 0 : top;
                pane.scrollTop(top);
            } else {
                // scroll down!
                y2 = y1 + pane.height();
                h = this.outerHeight();
                if (top + h > y2) {
                    pane.scrollTop(y1 + top + h - y2);
                }
            }
            // custom offset?
            left = this.data('offset-left');
            if (left !== undefined) pane.scrollLeft(left);

        } catch (e) {
            // IE sometimes crashes
            // even Chrome might get in trouble during ultra fast scrolling
            console.error('$.fn.intoViewport', this, e);
        }

        return this;
    };

    // center content via good old stupid table stuff
    $.fn.center = function () {
        // probably does not run in IE properly
        return this.wrap($('<div>').addClass('io-ox-center')).parent();
    };

    $.txt = function (str) {
        return document.createTextNode(str !== undefined ? str : '');
    };

    $.fn.scrollable = function () {
        return $('<div>').addClass('scrollable-pane').appendTo(this.addClass('scrollable'));
    };

    $.alert = function (o) {
        o = _.extend({
            title: false,
            message: false,
            classes: 'alert-danger',
            dismissable: false
        }, o);

        var alert = $('<div class="alert fade in">')
            .addClass(o.classes)
            .addClass(o.dismissable ? 'alert-dismissable' : '');

        if (o.dismissable) {
            alert.append(
                $('<button type="button" class="close" data-dismiss="alert">').append(
                    $('<span aria-hidden="true">&times;</span>'),
                    $('<span class="sr-only">Close</span>')
                )
            );
        }

        if (o.title) {
            alert.append(
                $('<h4 class="alert-heading">').text(o.title)
            );
        }

        if (o.message) {
            alert.append(
                $('<p>').text(o.message)
            );
        }

        return alert.alert();
    };

    //
    // Queued image loader. Works with lazyload.
    //
    (function () {

        // need to do this manually because jQuery doesn't support request.responseType = 'blob';
        function xhr(def, url) {

            var request = new XMLHttpRequest();

            function cleanup() {
                request = request.onload = request.onerror = def = null;
            }

            request.onload = function () {
                if (request.status === 200) def.resolve(request.response); else def.reject();
                cleanup();
            };

            request.onerror = function () {
                def.reject();
                cleanup();
            };

            request.open('GET', url, true);
            request.responseType = 'blob';
            request.send(null);
        }

        var queue = [], pending = 0, MAX = 4;

        function tick() {
            if (!queue.length || pending > MAX) return;
            var item = queue.shift();
            pending++;
            xhr(item.def, item.url);
        }

        function load(url) {
            var def = $.Deferred();
            queue.push({ def: def, url: url });
            tick();
            return def.promise().always(function () {
                pending--;
                tick();
            });
        }

        $.fn.queueload = function (options) {

            return this.lazyload(options).each(function () {
                // re-define appear; we use "one" to try only once (don't need to track via this.loaded)
                $(this).off('appear').one('appear', function () {
                    var $self = $(this), original = $self.attr('data-original');
                    load(original).then(
                        function success(response) {
                            var url = window.URL.createObjectURL(response);
                            if ($self.is('img')) $self.attr('src', url); else $self.css('background-image', 'url("' + url + '")');
                            $self.trigger('queue:load', original, url);
                        },
                        function fail() {
                            $self.trigger('queue:error', original);
                        }
                    );
                });
            });
        };

        // window.testQueueLoad = function () {

        //     var container = $('<div class="abs">').css({ zIndex: 1000, background: 'white', border: '1px solid #ddd', padding: '10px', overflow: 'auto' });

        //     $('.window-content:visible').first().append(
        //         container.append(
        //             _(_.range(100)).map(function (i) {
        //                 return $('<div class="pull-left">')
        //                     .css({ width: 120, height: 120, margin: '0 10px 10px 0', background: '#ccc' })
        //                     .attr('data-original', 'lorempixel/lorempixel-' + (i % 20) + '.jpg')
        //                     .queueload({ container: container, event: 'scrollstop' })
        //                     .text(i);
        //             })
        //         )
        //     );

        //     _.defer(function () { container.trigger('scrollstop'); });
        // };

    }());

}());
