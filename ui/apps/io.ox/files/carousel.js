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
     'gettext!io.ox/files',
     'io.ox/files/api',
     'io.ox/core/api/folder',
     'less!io.ox/files/carousel.less'
    ], function (commons, gt, api, folderAPI) {

    'use strict';

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
        list: [],
        container:      $('<div class="abs carousel slide">'),
        inner:          $('<div class="abs carousel-inner">'),
        prevControl:    $('<a class="carousel-control left">').text(gt.noI18n('‹')).attr('data-slide', 'prev'),
        nextControl:    $('<a class="carousel-control right">').text(gt.noI18n('›')).attr('data-slide', 'next'),
        closeControl:   $('<button class="btn btn-primary closecarousel">').text(gt('Close')),

       /**
        * The config parameter used to initialize a carousel.
        *
        * The fields are mostly self-explaining. Important field is baton.
        * It must contain an object that looks like this:
        * { allIds: [
        *     { filename: 'the filename.ext',
        *       url: 'an_url_ponting/to/the_file'
        *     }, …
        *   ]
        * }
        *
        * The url attribute for the items in allIds list is optional and can be used to provide
        * an user-defined url for the image. If this attribute is not defined, the files API getUrl
        * method is used to get the URL for the file.
        *
        */
        config: {
            fullScreen: false,
            baton: null,
            step: 3,
            attachmentMode: false
        },

        init: function (config) {
            this.inner.empty();
            this.container.empty().remove();
            $.extend(this.config, config);

            this.app = config.baton.app;
            if (config.attachmentMode) {
                this.win = $('.window-container.io-ox-mail-window');
            } else {
                this.win = this.app.getWindow();
            }
            this.list = this.filterImagesList(config.baton.allIds);
            this.pos = _.extend({}, this.defaults); // get a fresh copy
            this.firstStart = true; // should have a better name

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

            pos.first = parseInt(this.inner.find('.item:first').attr('data-index'), 10);
            pos.last = parseInt(this.inner.find('.item:last').attr('data-index'), 10);
            // Hide left control on start
            this.prevControl.hide();
            if (this.list.length > 1) {
                this.nextControl.show();
            }
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
                    self.prevControl.show();
                } else {
                    self.prevControl.hide();
                }
                if (pos.cur < (self.list.length - 1)) {
                    self.nextControl.show();
                } else {
                    self.nextControl.hide();
                }

                if (pos.direction === 'next' && pos.cur >= (pos.end - 1) && (pos.cur + 1) < self.list.length) {
                    self.getItems();
                    self.container.find('.item[data-index="' + (pos.start - self.config.step - 1) + '"]').prevAll().empty();
                } else if (pos.direction === 'prev' && pos.cur <= pos.start && pos.cur > 0) {
                    self.getItems();
                    self.container.find('.item[data-index="' + (pos.start + self.config.step) + '"]').nextAll().empty();
                }

                self.pos.sliding = false;
            });

            this.container.on('click swipeleft', '.item', function (e) {
                if (!self.pos.sliding) self.nextItem(e);
            });

            this.container.on('swiperight', '.item', function (e) {
                if (!self.pos.sliding) self.prevItem(e);
            });

            this.prevControl.on('click', $.proxy(this.prevItem, this));
            this.nextControl.on('click', $.proxy(this.nextItem, this));
            this.closeControl.on('click', $.proxy(this.close, this));

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
                return (/\.(gif|tiff|jpe?g|gmp|png)$/i).test(o.filename);
            });
        },

        urlFor: function (file) {
            var url = file.url || api.getUrl(file, 'open');
            return url + '&scaleType=contain&width=' + $(window).width() + '&height=' + $(window).height();
        },

        imgError: function () {
            $(this).replaceWith($('<i>').addClass('icon-picture file-type-ppt'));
        },

        getItems: function () {

            var self = this;
            var pos = this.pos,
                // work with local changes first
                start = pos.start,
                end   = pos.end;

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
                if (!this.config.attachmentMode) {
                    item.append(
                        $('<img>', { alt: '', src: this.urlFor(file) })
                            .on('error', this.imgError) /* error doesn't seem to bubble */,
                        $('<div class="carousel-caption">').append(
                            $('<h4>').text(gt.noI18n(file.filename)),
                            folderAPI.getBreadcrumb(file.folder_id, { handler: this.app.folder.set, subfolder: false, last: false })
                        )
                    );
                } else {
                    item.append(
                        $('<img>', { alt: '', src: file.url })
                            .on('error', this.imgError) /* error doesn't seem to bubble */,
                        $('<div class="carousel-caption">').append($('<h4>').text(gt.noI18n(file.filename)))
                    );
                }
            }
        },

        prevItem: function () {
            if (this.prevControl.is(':visible')) {
                if (!this.pos.sliding && this.pos.cur > 0) {
                    this.container.carousel('prev');
                }
            }
        },

        nextItem: function () {
            if (this.nextControl.is(':visible')) {
                if (!this.pos.sliding && this.pos.cur < (this.list.length - 1)) {
                    this.container.carousel('next');
                }
            }
        },

        show: function () {
            var win;
            if (this.config.attachmentMode) {
                win = $('.window-container.io-ox-mail-window');
            } else {
                win = this.win.nodes.outer;
            }
            win.busy();
            win.append(
                this.container.append(
                    this.inner,
                    this.prevControl,
                    this.nextControl,
                    this.closeControl
                )
                .on('click', '.breadcrumb li a', $.proxy(this.close, this))
            );
            if (this.list.length === 1) this.nextControl.hide();
            win.idle();
            this.getItems();
        },

        close: function () {
            this.container
                .off('slid')
                .off('slide')
                .off('click swipeleft', '.item')
                .off('click swiperight', '.item');

            this.prevControl.off('click');
            this.nextControl.off('click');
            this.closeControl.off('click');

            if (this.closeControl.is(':visible')) {
                this.inner.empty().remove();
                this.container.empty().remove();
                this.list = [];
            }
        }
    };

    return carouselSlider;
});
