/**
 *
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/files/carousel',
    ['io.ox/core/commons',
     'gettext!io.ox/files/files',
     'io.ox/files/api',
     'io.ox/core/api/folder',
     'io.ox/files/actions',
     'less!io.ox/files/carousel-style.css'
    ], function (commons, gt, api, folderAPI) {

    "use strict";

    var carouselSlider = {

        app: null,
        win: null,

        defaults: {
            start: 0,
            end: 0,
            cur: 0,
            direction: 'next'
        },

        pos: {},

        firstStart: true,

        container: $('<div class="carousel slide">'),

        inner: $('<div class="carousel-inner">'),

        config: {
            fullScreen: false,
            list: [],
            app: null,
            step: 3
        },

        init: function (config) {

            $.extend(this.config, config);

            this.app = config.app;
            this.win = this.app.getWindow();
            this.list = this.filterImagesList(config.list);
            this.pos = _.extend({}, this.defaults); // get a fresh copy
            this.firstStart = true; // should have a better name

            if (this.config.fullScreen === true && BigScreen.enabled) {
                BigScreen.request(this.win.nodes.outer.get(0));
            }

            // no automatic animation
            this.container.carousel({ interval: false });

            // fill with proper amount of DIVs (need to be fast here)
            var frag = document.createDocumentFragment(), i = 0, $i = this.list.length;
            for (; i < $i; i++) {
                frag.appendChild($('<div class="item" data-index="' + i + '">').get(0));
            }
            this.inner.get(0).appendChild(frag);

            this.show();
            this.eventHandler();
        },

        eventHandler: function () {

            var self = this;
            var pos = this.pos;

            pos.first = parseInt($('.carousel .item:first').attr('data-index'), 10);
            pos.last = parseInt($('.carousel .item:last').attr('data-index'), 10);
            // Hide left control on start
            $('.carousel-control.left').hide();

            // before transition
            this.container.on('slide', function () {
                self.pos.sliding = true;
            });

            // after transition
            this.container.on('slid', function () {

                var oldpos = pos.cur;
                pos.cur = parseInt(self.container.find('.item.active').attr('data-index'), 10);

                pos.direction = oldpos < pos.cur ? 'next' : 'prev';

                if (pos.cur > 0) {
                    $('.carousel-control.left').show();
                } else {
                    $('.carousel-control.left').hide();
                }

                if (pos.cur < (self.list.length - 1)) {
                    $('.carousel-control.right').show();
                } else {
                    $('.carousel-control.right').hide();
                }

                if (pos.direction === 'next' && pos.cur === (pos.end - 1) && (pos.cur + 1) < self.list.length) {
                    self.getItems();
                    self.container.find('.item[data-index="' + (pos.start - self.config.step - 1) + '"]').prevAll().empty();
                } else if (pos.direction === 'prev' && pos.cur <= pos.start && pos.cur > 0) {
                    self.getItems();
                    self.container.find('.item[data-index="' + (pos.start + self.config.step) + '"]').nextAll().empty();
                }

                self.pos.sliding = false;
            });

            $('.carousel-control.left').on('click', this.prevItem);
            $('.carousel-control.right').on('click', this.nextItem);
            $('.closecarousel').on('click', $.proxy(this.close, this));

            $(document).keyup(function (e) {
                if (e.keyCode === 27) self.close();
                if (e.keyCode === 39) self.nextItem();
                if (e.keyCode === 37) self.prevItem();
            });

            // TODO: Replace Images when resizing window
            //$(window).resize(_.debounce(this.replaceImages, 300));
        },

        filterImagesList: function (list) {
            return $.grep(list, function (o) {
                return (/^((?![.]_?).)*\.(gif|tiff|jpe?g|gmp|png)$/i).test(o.filename);
            });
        },

        addURL: function (file) {
            return api.getUrl(file, 'open') + '&scaleType=contain&width=' + $(window).width() + '&height=' + $(window).height();
        },

        imgError: function () {
            $(this).replaceWith($('<i>').addClass('icon-picture file-type-ppt'));
        },

        getItems: function () {

            var self = this;
            var pos = this.pos,
                // work with local changes first
                start = pos.start,
                end = pos.end;

            if (pos.direction === 'next') {
                start = pos.cur;
                end = Math.min(start + this.config.step, this.list.length);
            } else {
                end = pos.cur;
                start = Math.max(end - this.config.step, 0);
            }

            // get proper slice
            var files = this.list.slice(start, end);
            // update values
            pos.start = start;
            pos.end = end;
            // draw items
            _(files).each(function (file, i) {
                self.drawItem(file, start + i);
            });
        },

        drawItem: function (file, index, isfirst) {

            var item = this.inner.find('[data-index=' + index + ']');

            if (this.firstStart) {
                item.addClass('active');
                this.firstStart = false;
            }

            if (item.children().length === 0) {
                item.append(
                    $('<img>', { alt: '', src: this.addURL(file) })
                        .on('error', this.imgError) /* error doesn't seem to bubble */,
                    $('<div class="carousel-caption">').append(
                        $('<h4>').text(file.filename),
                        folderAPI.getBreadcrumb(file.folder_id, { handler: this.app.folder.set, subfolder: false, last: false })
                    )
                );
            }
        },

        prevItem: function () {
            if (!carouselSlider.pos.sliding && carouselSlider.pos.cur > 0) {
                $('.carousel').carousel('prev');
            }
        },

        nextItem: function () {
            if (!carouselSlider.pos.sliding && carouselSlider.pos.cur < (carouselSlider.list.length - 1)) {
                $('.carousel').carousel('next');
            }
        },

        prevControl: function () {
            return $('<a class="carousel-control left">').text('‹').attr('data-slide', 'prev');
        },

        nextControl: function () {
            return $('<a class="carousel-control right">').text('›').attr('data-slide', 'next');
        },

        closeControl: function () {
            return $('<button class="btn btn-primary closecarousel">').text(gt('Close'));
        },

        show: function () {
            this.win.busy().nodes.outer.append(
                this.container.append(
                    this.inner,
                    this.prevControl(),
                    this.nextControl(),
                    this.closeControl()
                )
                .on('click', '.breadcrumb li a', $.proxy(this.close, this))
            );
            this.win.idle();
            this.getItems();
        },

        close: function () {
            if (BigScreen.enabled) {
                BigScreen.exit();
            }
            this.inner.empty().remove();
            this.container.empty().remove();
            this.list = [];
        }
    };

    return carouselSlider;
});
