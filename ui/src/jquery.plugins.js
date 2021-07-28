/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
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
        return String(str).replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
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
            // id, mousedown
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
            button = $('<button type="button">').addClass(className).append(
                $('<span>').append(text)
            );
        }
        button.on('click', opt.data, opt.click);

        // add id?
        if (opt.id !== undefined) {
            button.attr('id', opt.id);
        }

        button.attr('data-action', opt.dataaction || opt.data.action);

        return button;
    };

    $.fn.busy = function (options) {
        if (options === true) options = { empty: true };
        options = _.extend({
            empty: false,
            immediate: false
        }, options);

        return this.each(function () {
            var self = $(this);
            clearTimeout(self.data('busy-timeout'));

            // in case element has .immediate and it's not wanted -> remove it
            self.addClass('io-ox-busy').toggleClass('immediate', options.immediate);

            if (!options.empty) return;
            if (options.immediate) {
                self.empty();
            } else {
                self.data('busy-timeout', setTimeout(function () {
                    self.empty();
                }, 300));
            }
        });
    };

    $.fn.idle = function () {
        return this.each(function () {
            var self = $(this);
            clearTimeout(self.data('busy-timeout'));
            self.removeClass('io-ox-busy immediate');
        });
    };

    function isScrolledOut(node, parent) {
        var item = node.getBoundingClientRect(),
            container = parent.getBoundingClientRect(),
            visible = { topline: container.top, bottomline: container.top + parent.offsetHeight };
        if (item.bottom < visible.topline) return 'top';
        if (item.top < visible.topline) return 'top:partial';
        if (item.top > visible.bottomline) return 'bottom';
        if (item.bottom > visible.bottomline) return 'bottom:partial';
    }

    $.fn.intoView = function (parent, options) {
        parent = parent[0] || parent;
        var node = this[0],
            opt = _.extend({ ignore: '' }, options),
            scrolledOut = isScrolledOut(node, parent);
        // use case: ignore bottom:partial for really large nodes (e.g. folder node with subfolders)
        if (!scrolledOut || _(opt.ignore.split(',')).contains(scrolledOut)) return;
        // alignToTop: top vs. bottom
        node.scrollIntoView(/^(top|top:partial)$/.test(scrolledOut));
    };

    //
    // Unified and simplified solution
    // should cover all cases, i.e. $.fn.intoViewport AND (newer) $.fn.intoView
    //
    $.fn.scrollIntoViewIfNeeded = function () {
        var node = this[0], pane = $(node).closest('.scrollable-pane, .scrollpane')[0];
        if (!node || !pane) return;
        var outer = pane.getBoundingClientRect(), inner;
        // first: bottom up
        inner = node.getBoundingClientRect();
        if (inner.bottom > outer.bottom) pane.scrollTop += inner.bottom - outer.bottom;
        // second: top down
        inner = node.getBoundingClientRect();
        if (inner.top < outer.top) pane.scrollTop -= outer.top - inner.top;
    };

    $.fn.intoViewport = function (node) {

        if (!node) node = this.closest('.scrollable-pane,.scrollpane');

        if (node.length === 0 || this.length === 0) return this;

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
