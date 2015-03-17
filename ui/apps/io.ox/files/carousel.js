/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/files/carousel',
    ['io.ox/core/commons',
     'io.ox/core/capabilities',
     'gettext!io.ox/files',
     'io.ox/files/api',
     'io.ox/preview/main',
     'io.ox/core/folder/breadcrumb',
     'less!io.ox/files/carousel'
    ], function (commons, capabilities, gt, api, preview, getBreadcrumb) {

    'use strict';

    var regIsImage = /\.(gif|tiff|jpe?g|bmp|png)$/i,
        //list from our text preview renderer
        regIsPlainText = /\.(txt|asc|js|md|json)$/i,
        regIsDocument = /\.(csv|pdf|docx?|xlsx?|pptx?)$/i;

    var guid = _.uniqueId('carousel-');

    var carouselSlider = {

        app: null,
        win: null,
        lastfocused: null,

        defaults: {
            start: 0,
            end: 0,
            cur: 0,
            direction: 'next'
        },

        pos: {},

        firstStart: true,
        list: [],
        container:      $('<div class="abs carousel slide">').attr({ 'tabIndex': 1, 'data-ride': 'carousel', 'aria-describedby': guid }),
        inner:          $('<div class="abs carousel-inner" role="listbox">'),
        prevControl:    $('<a class="left carousel-control">')
                            .attr({
                                'data-slide': 'prev',
                                role: 'button'
                            })
                            .append(
                                $('<i class="icon-prev fa fa-angle-left"aria-hidden="true" >'),
                                $('<span class="sr-only">').text(gt('Prev'))
                            ),
        nextControl:    $('<a class="right carousel-control">')
                            .attr({
                                'data-slide': 'next',
                                role: 'button'
                            })
                            .append(
                                $('<i class="icon-next fa fa-angle-right"aria-hidden="true" >'),
                                $('<span class="sr-only">').text(gt('Next'))
                            ),
        closeControl:   $('<button type="button" class="btn btn-link closecarousel">')
                            .append(
                                $('<i class="fa fa-times" aria-hidden="true" >'),
                                $('<span class="sr-only">').text(gt('Close'))
                            ),
        //#. helper text for slideshow widget navigation
        info:           $('<div class="sr-only">').attr('id', guid).text(gt('Use left/right arrow keys to navigate and escape key to exit view.')),

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
        config: {},
        defaultconfig: {
            fullScreen: false,
            baton: null,
            step: 3,
            attachmentMode: false,
            useSelectionAsStart: false
        },
        /**
         * returns index of a possible startitem in the current selection or 0
         * @param baton baton with data of current selection
         * @param list list of images in this folder
         */
        findStartItem: function (baton, list) {
            var startIndex = 0,
                idsList = _(list).map(_.ecid),
                idsSelection = _([].concat(baton.data)).map(_.ecid);

            if (idsList && idsSelection) {
                var item = _.intersection(idsList, idsSelection)[0];
                if (item) {
                    startIndex = _(idsList).indexOf(item);
                }
            }
            return startIndex;
        },

        init: function (config) {
            this.inner.empty();
            this.container.empty().remove();
            this.config = $.extend({}, this.defaultconfig, config);

            this.app = config.baton.app;
            if (config.attachmentMode) {
                this.win = $('.window-container.io-ox-mail-window');
            } else if (config.selector) {
                this.win = $(config.selector);
            } else {
                this.win = this.app.getWindow();
            }
            this.list = this.filterImagesList(config.baton.allIds);
            if (config.useSelectionAsStart) {
                var index;
                if (config.baton.startIndex !== undefined && config.baton.startIndex !== null) {
                    index = config.baton.startIndex;
                } else {
                    index = this.findStartItem (config.baton, this.list);
                }
                this.pos = _.defaults({cur: index}, this.defaults );
            } else {
                // get a fresh copy
                this.pos = _.extend({}, this.defaults);
            }
            // should have a better name
            this.firstStart = true;

            // fill with proper amount of DIVs (need to be fast here)
            var frag = document.createDocumentFragment(), i = 0, $i = this.list.length;
            for (; i < $i; i++) {
                frag.appendChild($('<div class="item" data-index="' + i + '" role="option">').get(0));
            }
            this.inner.get(0).appendChild(frag);

            // Prevent default on click behaviour of Bootstraps carousel
            this.inner.on('click', function () { return false; });

            this.show();
            this.eventHandler();

            // set focus
            this.lastfocused = $(document.activeElement);
            this.container.focus();

            // no automatic animation
            this.container.carousel({ interval: false });
        },

        eventHandler: function () {
            var self = this;
            var pos = this.pos;

            pos.first = parseInt(this.inner.find('.item:first').attr('data-index'), 10);
            pos.last = parseInt(this.inner.find('.item:last').attr('data-index'), 10);
            // Hide controls if we are at one end of the list
            if (pos.cur === pos.first) {
                this.prevControl.hide();
            } else {
                this.prevControl.show();
            }
            if (pos.cur === pos.last) {
                this.nextControl.hide();
            } else {
                this.nextControl.show();
            }
            // before transition
            this.container.on('slide.bs.carousel', function () {
                self.pos.sliding = true;
            });

            // after transition
            this.container.on('slid.bs.carousel', function () {
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

            this.container.keyup(function (e) {
                if (e.keyCode === 27) self.close();
                if (e.keyCode === 39) self.nextItem();
                if (e.keyCode === 37) self.prevItem();
            });

            // TODO: Replace Images when resizing window
            //$(window).resize(_.debounce(this.replaceImages, 300));
        },

        filterImagesList: function (list) {
            var supportsDocuments = capabilities.has('document_preview');
            if (this.config.attachmentMode) {
                return _(list).filter(function (o) {
                    return regIsImage.test(o.filename) || (supportsDocuments && regIsDocument.test(o.filename));
                });
            } else {
                return _(list).filter(function (o) {
                    return regIsImage.test(o.filename) || regIsPlainText.test(o.filename) || (supportsDocuments && regIsDocument.test(o.filename));
                });
            }
        },

        urlFor: function (file) {
            return file.url || api.getUrl(file, 'thumbnail', {
                scaleType: 'contain',
                thumbnailWidth: $(window).width(),
                thumbnailHeight: $(window).height()
            });
        },

        imgError: function () {
            $(this).parent().idle();
            $(this).replaceWith($('<i>').addClass('fa fa-picture-o file-type-ppt'));
        },

        imgLoad: function () {
            $(this).parent().idle();
        },

        // if we start in the middle of our slideshow we need to preload both directions
        getItems: function (loadBoth) {

            var self = this;
            var pos = this.pos,
                // work with local changes first
                start = pos.start,
                end   = pos.end;

            if (loadBoth) {
                start = Math.max(pos.cur - this.config.step, 0);
                end = Math.min(pos.cur + this.config.step, this.list.length);
            } else if (pos.direction === 'next') {
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

        drawItem: function (file, index) {

            var item = this.inner.find('[data-index=' + index + ']'), self = this;

            function hChangeFolder(folder_id) {
                self.app.folder.set(folder_id);
                self.close();
                self = null;
            }

            // support starting the slideshow in the middle
            if (this.firstStart && this.pos.cur === index) {
                item.addClass('active');
                this.firstStart = false;
            }

            function parseArguments(file) {
                if (!file.filename) {
                    return null;
                }
                return {
                    name: file.filename,
                    filename: file.filename,
                    mimetype: file.file_mimetype,
                    size: file.file_size,
                    dataURL: api.getUrl(file, 'thumbnail', {
                        scaleType: 'contain',
                        thumbnailWidth: $(window).width(),
                        thumbnailHeight: $(window).height()
                    }),
                    version: file.version,
                    id: file.id,
                    folder_id: file.folder_id
                };
            }

            if (item.children().length === 0) {
                if (!this.config.attachmentMode) {
                    var prev = new preview.Preview(parseArguments(file), { resize: false });
                    prev.appendTo(item);
                    item.append(
                        $('<div class="carousel-caption">').append(
                            $('<h4>').text(gt.noI18n(file.filename)),
                            file.folder_id ? getBreadcrumb(file.folder_id, { exclude: ['9'], handler: hChangeFolder, subfolder: false, last: false }) : $()
                        )
                    );
                } else {
                    item.busy().append(
                        $('<img>', { alt: '', src: this.urlFor(file) })
                            .on('load', this.imgLoad)
                            .on('error', this.imgError), /* error doesn't seem to bubble */
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
                win = $('.window-container:visible');
            } else if (this.config.selector) {
                win = $(this.config.selector);
            } else {
                win = this.win.nodes.outer;
            }
            ox.trigger('slideshow:start', {
                controller: this,
                window: win,
                container: this.container
            });
            win.busy();
            win.append(
                this.container.append(
                    this.info,
                    this.inner,
                    this.prevControl,
                    this.nextControl,
                    this.closeControl
                )
                .on('click', '.breadcrumb li a', $.proxy(this.close, this))
            );
            if (this.list.length === 1) this.nextControl.hide();
            win.idle();
            // if we start in the middle we need to preload both directions
            this.getItems(this.pos.cur !== 0);
        },

        close: function () {
            ox.trigger('slideshow:end', {
                controller: this,
                container: this.container
            });
            this.container
                .off('slid.bs.carousel')
                .off('slide.bs.carousel')
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
            this.lastfocused.focus();
        }
    };

    return carouselSlider;
});
