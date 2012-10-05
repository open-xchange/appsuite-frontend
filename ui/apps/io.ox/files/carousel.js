/**
 *
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 *
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

        pos: {
            start: 0,
            end: 0,
            counter: 0,
            cur: 0,
            first: 0,
            last: 0,
            direction: 'next'
        },

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
            this.list = config.list;

            if (this.config.fullScreen === true)
            {
                if (window.BigScreen.enabled) {
                    window.BigScreen.toggle(this.win.nodes.outer.get(0));
                }
            }
            this.pos.cur = 0;
            this.filterImagesList();
            this.show();
            this.eventHandler();
        },

        eventHandler: function ()
        {
            var self = this;
            var pos = this.pos;

            pos.first = parseInt($('.carousel .item:first').attr('data-index'), 10);
            pos.last = parseInt($('.carousel .item:last').attr('data-index'), 10);
            // Hide left control on start
            $('.carousel-control.left').hide();

            $('.carousel').on('slid', function () {
                var oldpos = pos.cur;
                pos.cur = parseInt($('.carousel .item.active').attr('data-index'), 10);
                pos.first = parseInt($('.carousel .item:first').attr('data-index'), 10);
                pos.last = parseInt($('.carousel .item:last').attr('data-index'), 10);

                if (oldpos < pos.cur)
                {
                    pos.direction = 'next';
                }
                else
                {
                    pos.direction = 'prev';
                }
                if (pos.cur === 0)
                {
                    $('.carousel-control.left').hide();
                }
                else
                {
                    if ($('.carousel-control.left').is(':hidden'))
                    {
                        $('.carousel-control.left').show();
                    }
                }
                if (pos.cur === (self.list.length - 1))
                {
                    $('.carousel-control.right').hide();
                }
                else
                {
                    if ($('.carousel-control.right').is(':hidden'))
                    {
                        $('.carousel-control.right').show();
                    }
                }
                if (pos.direction === 'next' && pos.cur === (pos.end - 1) && (pos.cur + 1) < self.list.length)
                {
                    self.getItems();
                    if (pos.cur > self.config.step)
                    {
                        var del = '.carousel .item[data-index="' + (pos.cur - self.config.step + 1) + '"]';
                        $(del).prevAll().remove();
                    }
                }



                if (pos.direction === 'prev' && pos.cur === pos.first && pos.cur !== 0)
                {
                    self.getItems();
                    var del = '.carousel .item[data-index="' + (pos.cur + self.config.step + 1) + '"]';
                    $(del).nextAll().remove();
                }
            });

            $('.carousel-control.left').on('click', this.prevItem);
            $('.carousel-control.right').on('click', this.nextItem);

            $('.closecarousel').on('click', this.close);

            $(document).keyup(function (e) {
                if (e.keyCode === 27) self.close();
                if (e.keyCode === 39) self.nextItem();
                if (e.keyCode === 37) self.prevItem();
            });

            // TODO: Replace Images when resizing window
            $(window).resize(_.debounce(this.replaceImages, 300));

            $('.carousel-inner').on('img', 'error', this.imgError);
        },

        replaceImages: function ()
        {

        },

        filterImagesList: function ()
        {
            this.list = $.grep(this.list, function (o) {
                return (/^((?![.]_?).)*\.(gif|tiff|jpe?g|gmp|png)$/i).test(o.filename);
            });
        },

        addURL: function (file) {
            return api.getUrl(file, 'open') + '&scaleType=contain&width=' + $(window).width() + '&height=' + $(window).height();
        },

        imgError: function () {
            $(this).replaceWith($('<i>').addClass('icon-picture file-type-ppt'));
        },

        removeItems: function ()
        {

        },

        getItems: function ()
        {
            var self = this;
            var pos = this.pos;

            if (pos.direction === 'next') {
                if (this.list.length >= (this.config.step + this.pos.end))
                {
                    pos.end = pos.last + this.config.step;
                }
                else
                {
                    pos.end = this.list.length;
                }
            }
            else {
                pos.end = pos.first;
                pos.start = pos.first - this.config.step;
            }


            api.getList(this.list.slice(pos.start, pos.end)).done(function (files) {
                var nodes = [];
                var i = pos.start;
                _(files).each(function (file, index) {
                    var isfirst = false;
                    if (index === 0 && pos.start === 0) isfirst = true;
                    nodes.push(self.addItem(file, i, isfirst));
                    i++;
                });
                if (pos.direction === 'prev')
                {
                    $('.carousel-inner').idle().prepend(nodes);
                }
                else
                {
                    $('.carousel-inner').idle().append(nodes);
                    pos.start = pos.end;
                }
                $('.carousel .item .breadcrumb li a').off('click').on('click', self.close);
            });
        },

        addItem: function (file, index, isfirst) {
            var self = this,
                item = $('<div class="item">').attr('data-index', index),
                img = $('<img>', { alt: file.title, src: this.addURL(file) }),
                caption = $('<div class="carousel-caption">'),
                breadcrumb = folderAPI.getBreadcrumb(file.folder_id, { handler: self.app.folder.set, subfolder: false, last: false });

            if (isfirst)
            {
                item.addClass('active');
            }

            caption.append($('<h4>').text(file.title))
                   .append(breadcrumb);

            item.append(img)
                .append(caption);

            return item;
        },

        prevItem: function () {
            if (this.pos.cur !== 0)
            {
                $('.carousel').carousel('prev');
            }
        },

        nextItem: function () {
            if (carouselSlider.pos.cur !== (carouselSlider.list.length - 1))
            {
                $('.carousel').carousel('next');
            }
            else
            {
                $('.carousel').carousel('pause');
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
                this.container
                    .empty()
                    .append(this.inner.busy())
                    .append(this.prevControl)
                    .append(this.nextControl)
                    .append(this.closeControl)
            );
            this.win.idle();
            this.getItems(0, this.config.step);
        },

        close: function () {
            if (window.BigScreen.enabled) {
                window.BigScreen.exit();
            }
            $('.carousel').remove();
        }
    };

    return carouselSlider;
});