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

    var allIds,
        pos = {
        begin: 0,
        end: 9,
        step: 10,
        cur: 0,
        direction: 'right',
        last: 0
    };

    function checkImage(file) {
        if ((/^((?![.]_?).)*\.(gif|tiff|jpe?g|gmp|png)$/i).test(file.filename) &&
        (/^(image\/(gif|png|jpe?g|gmp)|(application\/octet-stream))$/i).test(file.file_mimetype))
        {
            return true;
        }
        else
        {
            return false;
        }
    }

    function closeCarousel() {
        if (BigScreen.enabled) {
            BigScreen.exit();
        }
        $('.carousel').remove();
    }

    function iconError() {
        $(this).replaceWith($('<i>').addClass('icon-picture file-type-ppt'));
    }

    function carouselCaption(app, file) {
        return $('<div class="carousel-caption">')
        .append($('<h4>').text(file.title))
        .append(
            folderAPI.getBreadcrumb(file.folder_id, app.folder.set).on('click', closeCarousel)
        );
    }

    function carouselItem(app, file, i) {
        var url = api.getUrl(file, 'open') + '&scaleType=contain&width=' + $(window).width() + '&height=' + $(window).height();
        return $('<div class="item">').attr('data-index', i)
            .append($('<img>', { alt: file.title, src: url}).on('error', iconError))
            .append(carouselCaption(app, file));
    }

    function previousItem()
    {
        $('.carousel').carousel('prev');

    }

    function nextItem()
    {
        $('.carousel').carousel('next');
    }

    function previousControl()
    {
        return $('<a class="carousel-control left">').text('‹').attr('data-slide', 'prev')
            .on('click', previousItem);
    }

    function nextControl()
    {
        return $('<a class="carousel-control right">').text('›').attr('data-slide', 'next')
            .on('click', nextItem);
    }

    function closeControl()
    {
        return $('<button class="btn btn-primary closecarousel">').text(gt('Close'))
            .on('click', closeCarousel);
    }

    function nextImages(app, ids)
    {
        pos.cur = pos.end;
        pos.end = pos.end + pos.step;
        api.getList(allIds.slice(pos.cur + 1, pos.end)).done(function (files) {
            var i = parseInt($('.carousel-inner .item:last').attr('data-index'), 10);
            i++;
            _(files).each(function (file) {
                if (checkImage(file)) {
                    $('.carousel-inner').append(carouselItem(app, file, i));
                }
                i++;
            });
        });
    }

    function drawCarousel(app, ids) {
        var win = app.getWindow();
        allIds = ids;
        win.busy();

        var innerCarousel = $('<div class="carousel-inner">');

        api.getList(ids.slice(pos.begin, (pos.end + 1))).done(function (files) {
            var i = 0;
            _(files).each(function (file) {
                if (checkImage(file)) {
                    innerCarousel.append(carouselItem(app, file, i));
                }
                i++;
            });

            win.nodes.outer.append(
                $('<div class="carousel slide">')
                    .append(innerCarousel)
                    .append(previousControl)
                    .append(nextControl)
                    .append(closeControl)
            );

            $('.carousel .item:first').addClass('active');
            $('.carousel-control.left').hide();

            // TODO: Overwrite Bootstrap Stuff?

            $('.carousel').on('slide', function (e) {
                pos.last = pos.cur;
                pos.cur = parseInt($(e.relatedTarget).attr('data-index'), 10);
                if (pos.cur > pos.last)
                {
                    pos.direction = 'left';
                }
                if (pos.cur < pos.last)
                {
                    pos.direction = 'right';
                }
            });

            $('.carousel').on('slid', function (e) {
                if (pos.cur === 0)
                {
                    $('.carousel-control.left').hide();
                }
                else
                {
                    $('.carousel-control.left').show();
                }
                var pre = pos.end - 2;
                if (pos.cur === pre)
                {
                    nextImages(app, ids);
                }
                if (pos.cur === pos.end)
                {
                    $('.carousel-control.right').hide();
                }
                else
                {
                    $('.carousel-control.right').show();
                }
            });

            $(document).keyup(function (e) {
                if (e.keyCode === 27) closeCarousel();
            });

            // Deactivate Bootstraps Interval
            //$('.carousel').each(function () {
            //    $(this).carousel({
            //        interval: false
            //    });
            //});

            win.idle();
        });
    }

    function drawFullscreenCarousel(app, ids) {
        var win = app.getWindow();
        if (BigScreen.enabled) {
            BigScreen.request(win.nodes.outer.get(0));
            drawCarousel(app, ids);
        }
    }

    return {
        addLink: function (el, app, ids) {
            return el
                .append($('<div class="pull-left">')
                    .append(
                    $('<a class="pull-right slideshow">').text(gt('View Slideshow'))
                        .on('click', function () { drawCarousel(app, ids); }
                    )
                )
            );
        },
        addFullscreenLink: function (el, app, ids) {
            return el
                .append($('<div class="pull-left">')
                    .append($('<span>').html('&nbsp;('))
                    .append(
                    $('<a class="slideshow">').text(gt('Fullscreen'))
                        .on('click', function () { drawFullscreenCarousel(app, ids); })
                    )
                    .append($('<span>').text(')')
                )
            );
        }
    };

});
