/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/preview/officePreview/main',
    ['io.ox/core/tk/keys',
     'gettext!io.ox/preview/officePreview',
     'less!io.ox/preview/officePreview/style.less'], function (KeyListener, gt) {

    'use strict';

    var BATCH_SIZE = 5;

    function documentTypeClasses(file) {
        if (/\.pptx?$/.test(file.name)) {
            return 'io-ox-office-preview-presentation ';
        }
        return 'io-ox-office-preview-page';
    }

    function turnFixedPositioningIntoAbsolutePositioning($node) {
        $node.find('*').each(function (index, $childNode) {
            $childNode = $($childNode);
            var position;
            // TODO: Respect nestings (if they are even used)
            position = $childNode.css('position');
            if (position && position.toLowerCase() === 'fixed') {
                $childNode.css({position: 'absolute'});
            }
        });
    }

    // TODO: Refactor: Look at mail
    function createInstance(file) {

        if (!file) {
            file = {
                name: _.url.hash('name'),
                dataURL: _.url.hash('dataURL')
            };
        } else {
            _.url.hash('name', file.name);
            _.url.hash('dataURL', file.dataURL);
        }

        var app, win, container;

        app = ox.ui.createApp({
            name: 'io.ox/preview/officePreview',
            title: 'Preview'
        });

        app.document = [];
        app.index = 0;
        app.maxPages = -1; // Unknown

        var $pageIndicator = $('<span>').addClass('io-ox-office-preview-page-indicator').text('1');

        var $nextButton = $('<button>').addClass('btn btn-primary disabled')
            .append('<i class="icon-white icon-chevron-right">').on('click', function (e) {
                e.preventDefault();
                app.nextPage();
            });

        var $previousButton = $('<button>').addClass('btn btn-primary disabled')
            .append('<i class="icon-white icon-chevron-left">').on('click', function (e) {
                e.preventDefault();
                app.previousPage();
            });

        var container = $('<div>');

        function loading() {
            win.busy();
        }

        function stoppedLoading() {
            win.idle();
        }

        function fetchPages(numberOfPages) {
            if (app.maxPages !== -1) {
                return new $.Deferred().resolve(app.document);
            }
            if (app.document.length >= numberOfPages) {
                return new $.Deferred().resolve(app.document);
            }
            loading();
            return $.ajax({
                url: file.dataURL + '&format=preview_filtered&pages=' + numberOfPages + '&previewForceDiv=true&view=html',
                dataType: 'json'
            }).pipe(function (response) {
                stoppedLoading();
                app.document = response.data.document.map(function ($page) {
                    $page = $($page);
                    turnFixedPositioningIntoAbsolutePositioning($page);
                    return $page;
                });
                if (!response.data.moreAvailable) {
                    app.maxPages = app.document.length - 1;
                }
                return app.document;
            });
        }

        app.nextPage = function () {
            app.showPage(app.index + 1);
        };

        app.previousPage = function () {
            app.showPage(app.index - 1);
        };

        app.showPage = function (pageNumber) {
            pageNumber = Math.max(0, pageNumber);

            if (app.maxPages !== -1 && pageNumber > app.maxPages) {
                pageNumber = app.maxPages;
            }
            var num = pageNumber + BATCH_SIZE - (pageNumber % BATCH_SIZE);
            fetchPages(num).done(function (doc) {

                var $shownContent = doc[pageNumber].clone();

                // TODO: remove once backend helps here
                // tmp. fix images
                $shownContent.find('img').each(function () {
                    var img = $(this), src = String(img.attr('src'));
                    img.attr('src', src.replace(/^\/ajax/, ox.apiRoot));
                });

                container.empty().append($shownContent);

                var centerOffset = ($(window).width() / 2) - ($shownContent.width() / 2);

                $shownContent.addClass(documentTypeClasses(file));


                $shownContent.addClass('io-ox-office-preview-content').css({position: 'relative', left: centerOffset, right: centerOffset});


                app.index = pageNumber;

                $pageIndicator.text(pageNumber + 1);

                if (pageNumber === 0) {
                    if (!$previousButton.hasClass('disabled')) {
                        $previousButton.addClass('disabled');
                    }
                } else {
                    $previousButton.removeClass('disabled');
                }
                if (pageNumber === app.maxPages) {
                    if (!$nextButton.hasClass('disabled')) {
                        $nextButton.addClass('disabled');
                    }
                } else {
                    $nextButton.removeClass('disabled');
                }
            });
        };

        app.setLauncher(function () {

            var keys = new KeyListener();

            win = ox.ui.createWindow({
                name: 'io.ox/mail/write',
                title: file.name,
                titleWidth: '40%',
                toolbar: true,
                close: true
            });

            app.setWindow(win);

            container = $('<div>').addClass('abs').css({ overflow: 'auto', zIndex: 2 })
                .appendTo(win.nodes.main);

            win.nodes.main.addClass('io-ox-office-preview-background').append($pageIndicator);

            win.show(function () {

                win.nodes.body.addClass('full-height-tablet full-height-phone');
                win.nodes.head.addClass('hidden-tablet hidden-phone');

                win.nodes.body.on('click', function (evt) {

                    // Which half was clicked?

                    if (evt.pageX > $(window).width() / 2) {
                        app.nextPage();
                    } else {
                        app.previousPage();
                    }

                });

                win.nodes.toolbar.append(
                    $('<div>').append($previousButton, $.txt(' '), $nextButton)).css({ left: '47%' }
                );
                app.showPage(0);
            });

            win.on('idle show', function () {
                keys.include();
            });

            win.on('hide busy', function () {
                keys.remove();
            });

            keys.on('leftarrow', function () {
                app.previousPage();
            });

            keys.on('uparrow', function () {
                app.previousPage();
            });

            keys.on('rightarrow', function () {
                app.nextPage();
            });

            keys.on('downarrow', function () {
                app.nextPage();
            });

            keys.on('space', function () {
                app.nextPage();
            });

            keys.on('esc', function () {
                app.quit();
            });
        });

        return app;
    }

    return {
        getApp: createInstance
    };
});