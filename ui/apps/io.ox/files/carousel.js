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
        $('.carousel').remove();
    }

    function iconError() {
        $(this).parent().remove();
    }

    function carouselCaption(app, file) {
        var caption = $('<div class="carousel-caption">').append(
            folderAPI.getBreadcrumb(file.folder_id, app.folder.set).on('click', closeCarousel)
        );
        var title = $('<li class="active">').text(file.title);
        var separator = $('<span class="divider">').text(' / ');
        caption.find('li:last').parent().append(separator).append(title);
        return caption;
    }

    function carouselItem(app, file) {
        var url = api.getUrl(file, 'open') + '&scaleType=contain&width=' + $(window).width() + '&height=' + $(window).height();
        return $('<div class="item">')
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
        return $('<button class="btn btn-primary closecarousel">').text(gt('Close')).on('click', closeCarousel);
    }

    function addBreadcrumb(app)
    {
        if (!app.getWindow().search.active) {
            console.log(folderAPI.getBreadcrumb(app.folder.get(), app.folder.set));
        }
    }

    function drawCarousel(app, ids) {
        var win = app.getWindow();

        win.busy();

        var innerCarousel = $('<div class="carousel-inner">');

        api.getList(ids).done(function (files) {
            _(files).each(function (file) {
                if (checkImage(file)) {
                    innerCarousel.append(carouselItem(app, file));
                }
            });

            $(document).keyup(function (e) {
                if (e.keyCode === 27) closeCarousel();
            });

            win.nodes.outer.append(
                $('<div class="carousel slide">')
                    .append(innerCarousel)
                    .append(previousControl)
                    .append(nextControl)
                    .append(closeControl)
            );
            $('.carousel .item:first').addClass('active');
            win.idle();
        });
    }

    return {
        addLink: function (el, app, ids) {
            return el.append(
                $('<a class="pull-right slideshow">').text(gt('View Slideshow'))
                    .on('click', function () { drawCarousel(app, ids); })
            );
        }
    };

});