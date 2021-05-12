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

    var faClassHash = {
        'fa-address-book': '\uf2b9',
        'fa-address-book-o': '\uf2ba',
        'fa-align-justify': '\uf039',
        'fa-android': '\uf17b',
        'fa-angle-double-down': '\uf103',
        'fa-angle-double-left': '\uf100',
        'fa-angle-double-right': '\uf101',
        'fa-angle-double-up': '\uf102',
        'fa-angle-down': '\uf107',
        'fa-angle-left': '\uf104',
        'fa-angle-right': '\uf105',
        'fa-apple': '\uf179',
        'fa-archive': '\uf187',
        'fa-arrow-down': '\uf063',
        'fa-arrow-up': '\uf062',
        'fa-arrows-alt': '\uf0b2',
        'fa-ban': '\uf05e',
        'fa-bars': '\uf0c9',
        'fa-birthday-cake': '\uf1fd',
        'fa-bookmark': '\uf02e',
        'fa-bookmark-o': '\uf097',
        'fa-calendar': '\uf073',
        'fa-calendar-o': '\uf133',
        'fa-calendar-plus-o': '\uf271',
        'fa-camera-retro': '\uf083',
        'fa-caret-down': '\uf0d7',
        'fa-caret-right': '\uf0da',
        'fa-caret-up': '\uf0d8',
        'fa-check': '\uf00c',
        'fa-check-circle': '\uf058',
        'fa-check-square': '\uf14a',
        'fa-check-square-o': '\uf046',
        'fa-chevron-down': '\uf078',
        'fa-chevron-left': '\uf053',
        'fa-chevron-right': '\uf054',
        'fa-chevron-up': '\uf077',
        'fa-circle': '\uf111',
        'fa-circle-thin': '\uf1db',
        'fa-clipboard': '\uf0ea',
        'fa-clock-o': '\uf017',
        'fa-close': '\uf00d',
        'fa-cloud': '\uf0c2',
        'fa-cloud-download': '\uf0ed',
        'fa-cloud-upload': '\uf0ee',
        'fa-code-fork': '\uf126',
        'fa-cog': '\uf013',
        'fa-comment': '\uf075',
        'fa-comment-o': '\uf0e5',
        'fa-download': '\uf019',
        'fa-edit': '\uf044',
        'fa-envelope': '\uf0e0',
        'fa-envelope-o': '\uf003',
        'fa-exclamation': '\uf12a',
        'fa-exclamation-circle': '\uf06a',
        'fa-exclamation-triangle': '\uf071',
        'fa-external-link': '\uf08e',
        'fa-external-link-square': '\uf14c',
        'fa-eye': '\uf06e',
        'fa-eye-slash': '\uf070',
        'fa-file': '\uf15b',
        'fa-file-audio-o': '\uf1c7',
        'fa-file-code-o': '\uf1c9',
        'fa-file-excel-o': '\uf1c3',
        'fa-file-image-o': '\uf1c5',
        'fa-file-o': '\uf016',
        'fa-file-pdf-o': '\uf1c1',
        'fa-file-powerpoint-o': '\uf1c4',
        'fa-file-text-o': '\uf0f6',
        'fa-file-video-o': '\uf1c8',
        'fa-file-word-o': '\uf1c2',
        'fa-film': '\uf008',
        'fa-filter': '\uf0b0',
        'fa-folder': '\uf07b',
        'fa-folder-o': '\uf114',
        'fa-folder-open-o': '\uf115',
        'fa-font': '\uf031',
        'fa-google': '\uf1a0',
        'fa-group': '\uf0c0',
        'fa-hashtag': '\uf292',
        'fa-id-badge': '\uf2c1',
        'fa-image': '\uf03e',
        'fa-inbox': '\uf01c',
        'fa-info-circle': '\uf05a',
        'fa-laptop': '\uf109',
        'fa-level-up': '\uf148',
        'fa-link': '\uf0c1',
        'fa-list': '\uf03a',
        'fa-list-alt': '\uf022',
        'fa-list-ul': '\uf0ca',
        'fa-lock': '\uf023',
        'fa-magic': '\uf0d0',
        'fa-mail-forward': '\uf064',
        'fa-microchip': '\uf2db',
        'fa-minus': '\uf068',
        'fa-minus-circle': '\uf056',
        'fa-mobile': '\uf10b',
        'fa-paper-plane': '\uf1d8',
        'fa-paperclip': '\uf0c6',
        'fa-pencil': '\uf040',
        'fa-pencil-square-o': '\uf044',
        'fa-phone': '\uf095',
        'fa-play': '\uf04b',
        'fa-play-circle-o': '\uf01d',
        'fa-plus': '\uf067',
        'fa-plus-circle': '\uf055',
        'fa-power-off': '\uf011',
        'fa-question': '\uf128',
        'fa-question-circle': '\uf059',
        'fa-refresh': '\uf021',
        'fa-repeat': '\uf01e',
        'fa-reply': '\uf112',
        'fa-reply-all': '\uf122',
        'fa-retweet': '\uf079',
        'fa-rotate-left': '\uf0e2',
        'fa-rotate-right': '\uf01e',
        'fa-search': '\uf002',
        'fa-search-minus': '\uf010',
        'fa-search-plus': '\uf00e',
        'fa-share': '\uf064',
        'fa-shopping-cart': '\uf07a',
        'fa-sign-in': '\uf090',
        'fa-sign-out': '\uf08b',
        'fa-smile-o': '\uf118',
        'fa-square-o': '\uf096',
        'fa-star': '\uf005',
        'fa-star-o': '\uf006',
        'fa-stop': '\uf04d',
        'fa-table': '\uf0ce',
        'fa-tablet': '\uf10a',
        'fa-tag': '\uf02b',
        'fa-th': '\uf00a',
        'fa-th-large': '\uf009',
        'fa-thumbs-down': '\uf165',
        'fa-thumbs-up': '\uf164',
        'fa-times': '\uf00d',
        'fa-times-circle': '\uf057',
        'fa-tint': '\uf043',
        'fa-toggle-on': '\uf205',
        'fa-trash': '\uf1f8',
        'fa-trash-o': '\uf014',
        'fa-twitter': '\uf099',
        'fa-user': '\uf007',
        'fa-user-circle': '\uf2bd',
        'fa-user-o': '\uf2c0',
        'fa-user-plus': '\uf234',
        'fa-users': '\uf0c0',
        'fa-video-camera': '\uf03d',
        'fa-volume-up': '\uf028',
        'fa-warning': '\uf071',
        'fa-window-maximize': '\uf2d0',
        'fa-window-minimize': '\uf2d1',
        'fa-window-compress': '\uf066',
        'fa-window-expand': '\uf065',
        'fa-windows': '\uf17a',
        'fa-wrench': '\uf0ad',
        'fa-xing': '\uf168'
    };

    // some icons are not aligned correctly, default is y=86
    var faAlignmentHash = {
        'fa-check-square-o': 89,
        'fa-cloud': 88,
        'fa-comment': 80,
        'fa-comment-o': 80,
        'fa-envelope-o': 80,
        'fa-phone': 90,
        'fa-th': 90,
        'fa-th-large': 89
    };

    $.icon = function (name, title, classList) {
        var icon = faClassHash[name] || '';
        // give notice so devs can add missing icons
        if (ox.debug && name && !faClassHash[name]) console.error('Svg icon not found. Please add it to the list', name, title, classList);
        title = title ? '<title>' + title + '</title>' : '';
        classList = classList ? ' ' + classList : '';
        return '<svg viewbox="0 0 100 100" class="fa fasvg' + classList + '" aria-hidden="true">' + title + '<text x="50" y="' + (faAlignmentHash[name] || 86) + '" text-anchor="middle">' + icon + '</text></svg>';
    };

    $.checkbox = function () {
        return '<svg viewbox="0 0 100 100" class="fa fa-checkmark fasvg" aria-hidden="true"><text x="50" y="86" text-anchor="middle" class="checkmark">\uf14a</text><text x="50" y="86" text-anchor="middle" class="checkbox">\uf096</text></svg>';
    };

    $.mobileCheckbox = function () {
        return '<svg viewbox="0 0 100 100" class="fa fa-checkmark fasvg" aria-hidden="true"><text x="50" y="86" text-anchor="middle" class="checkmark">\uf058</text><text x="50" y="86" text-anchor="middle" class="checkbox">\uf1db</text></svg>';
    };

    $.fn.scrollable = function () {
        return $('<div class="scrollable-pane">').appendTo(this.addClass('scrollable'));
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
