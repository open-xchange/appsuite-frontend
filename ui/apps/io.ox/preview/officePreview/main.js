/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/preview/officePreview/main', [
    'io.ox/core/tk/keys',
    'io.ox/core/util',
    'less!io.ox/preview/officePreview/style'
], function (KeyListener, util) {

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
                $childNode.css({ position: 'absolute' });
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

        var app, win, container = $('<div>');

        app = ox.ui.createApp({
            name: 'io.ox/preview/officePreview',
            title: 'Preview'
        });

        app.document = [];
        app.index = 0;
        // Unknown
        app.maxPages = -1;

        var $pageIndicator = $('<span>').addClass('io-ox-office-preview-page-indicator').text('1');

        var $nextButton = $('<button type="button">').addClass('btn btn-primary disabled')
            .append('<i class="icon-white fa fa-chevron-right">').on('click', function (e) {
                e.preventDefault();
                app.nextPage();
            });

        var $previousButton = $('<button type="button">').addClass('btn btn-primary disabled')
            .append('<i class="icon-white fa fa-chevron-left">').on('click', function (e) {
                e.preventDefault();
                app.previousPage();
            });

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
            }).then(function (response) {
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
                    img.attr('src', util.replacePrefix(src, ox.apiRoot));
                });

                container.empty().append($shownContent);

                var centerOffset = ($(window).width() / 2) - ($shownContent.width() / 2);

                $shownContent.addClass(documentTypeClasses(file));

                $shownContent.addClass('io-ox-office-preview-content').css({ position: 'relative', left: centerOffset, right: centerOffset });

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
                name: 'io.ox/preview/officepreview',
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
