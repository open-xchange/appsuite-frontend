/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Edy Haryono <edy.haryono@open-xchange.com>
 */
define('io.ox/presenter/views/thumbnailview', [
    'io.ox/backbone/disposable',
    'io.ox/presenter/util'
], function (DisposableView, Util) {

    'use strict';

    var ThumbnailView = DisposableView.extend({

        className: 'presenter-thumbnails',

        events: {
            'click .presenter-thumbnail-link': 'onThumbnailClicked',
            'keydown .presenter-thumbnail-link': 'onThumbnailKeydown'
        },

        initialize: function (options) {
            _.extend(this, options);
            this.listenTo(this.presenterEvents, 'presenter:local:slide:change', this.selectThumbnail);
            // listen to sidebar scroll
            this.listenTo(this.presenterEvents, 'presenter:thumbnail:scroll', this.refreshThumbnails);
            // listen to window resize
            this.listenTo(this.presenterEvents, 'presenter:resize', this.refreshThumbnails);

            this.listenTo(this.presenterEvents, 'presenter:presentation:start', this.onToggleVisibility);
            this.listenTo(this.presenterEvents, 'presenter:presentation:end', this.onToggleVisibility);
            this.listenTo(this.presenterEvents, 'presenter:presentation:pause', this.onToggleVisibility);
            this.listenTo(this.presenterEvents, 'presenter:presentation:continue', this.onToggleVisibility);
            this.listenTo(this.presenterEvents, 'presenter:participants:change', this.onToggleVisibility);

            this.listenTo(this.presenterEvents, 'presenter:fullscreen:enter', this.onEnterFullScreen);
            this.listenTo(this.presenterEvents, 'presenter:fullscreen:exit', this.onExitFullScreen);

            // dispose view on global dispose
            this.on('dispose', this.disposeView.bind(this));
            this.thumbnailLoadDef = Util.createAbortableDeferred($.noop);
            this.thumbnailImages = [];
            // thumbnail size defaults
            this.thumbnailPaneHeight = 140;
            this.thumbnailWidthLandscape = 100;
            this.thumbnailWidthPortrait = 75;
        },

        render: function () {
            var self = this;
            this.$el.addClass('io-ox-busy');
            function beginConvertSuccess(convertData) {
                self.convertData = convertData;
                _.times(convertData.pageCount, function (pageNumber) {
                    var thumbnailNode = self.createThumbnailNode(pageNumber);
                    self.$el.append(thumbnailNode);
                });
                self.loadThumbnails(convertData);
                return convertData;
            }
            function beginConvertError(response) {
                return $.Deferred().reject(response);
            }
            function beginConvertFinished() {
                self.$el.removeClass('io-ox-busy');
            }

            this.app.mainView.presentationView.$el.addClass('thumbnails-opened');

            this.thumbnailLoadDef = Util.beginConvert(this.model.toJSON())
                .done(beginConvertSuccess)
                .fail(beginConvertError)
                .always(beginConvertFinished);
            return this;
        },

        /**
         * Creates a complete thumbnail node.
         *
         * @param {Number} pageNumber
         *  the page that should be shown in the thumbnail.
         *
         * @returns {jQuery} thumbnailLink
         */
        createThumbnailNode: function (pageNumber) {
            var thumbnailLink = $('<a class="presenter-thumbnail-link" tabindex="1">'),
                thumbnailWrapper = $('<div class="wrapper">'),
                thumbnail = $('<div class="presenter-thumbnail">'),
                thumbnailImage = this.createDocumentThumbnailImage('thumbnail-image'),
                thumbnailPageNumber = $('<div class="page-number">').text(pageNumber + 1);
            thumbnail.append(thumbnailImage).addClass('io-ox-busy');
            this.thumbnailImages.push(thumbnailImage);
            thumbnailWrapper.append(thumbnail, thumbnailPageNumber);
            thumbnailLink.append(thumbnailWrapper).attr({
                'role': 'button',
                'aria-selected': false,
                'data-page': pageNumber + 1
            });
            return thumbnailLink;
        },

        /**
         * Loads thumbnail images, which are visible in the browser window.
         *
         * @param {Object} convertData
         *  a response object from document converter containing
         *  the convert jobID and the total page count.
         */
        loadThumbnails: function (convertData) {
            var params = {
                    action: 'convertdocument',
                    convert_action: 'getpage',
                    target_format: 'png',
                    target_width: 200,
                    target_zoom: 1,
                    job_id: convertData.jobID,
                    page_number: convertData.pageNumber,
                    id: encodeURIComponent(this.model.get('id')),
                    folder_id: this.model.get('folder_id'),
                    filename: encodeURIComponent(this.model.get('filename')),
                    version: this.model.get('version')
                },
                thumbnailNodes = this.$('.presenter-thumbnail'),
                thumbnailsToLoad = Util.getVisibleNodes(thumbnailNodes);
            _.each(thumbnailsToLoad, function (pageNumber) {
                var image = this.thumbnailImages[pageNumber - 1];
                if (image.src) {
                    return;
                }
                params.page_number = pageNumber;
                var thumbnailUrl = Util.getConverterUrl(params);
                image.src = thumbnailUrl;
            }.bind(this));
        },

        /**
         * Creates thumbnail image of a document page.
         *
         * @returns {HTMLImageElement} image
         *  the image HTML element.
         */
        createDocumentThumbnailImage: function (className) {
            var image = new Image(),
                self = this;
            image.className = className;
            image.onload = function () {
                var ratio = this.width / this.height,
                    defaultWidth = this.width > this.height ? self.thumbnailWidthLandscape : self.thumbnailWidthPortrait;
                $(this.parentNode).css({
                    width: defaultWidth,
                    height: defaultWidth / ratio
                });
                $(image.parentNode).removeClass('io-ox-busy');
            };
            return image;
        },

        /**
         * Thumbnail click handler:
         * - selects/highlights the clicked thumbnail.
         * - triggers 'presenter:showslide' event.
         * @param {jQueryEvent} event
         */
        onThumbnailClicked: function (event) {
            var clickedThumbnail = $(event.currentTarget),
                clickedPageNumber = clickedThumbnail.data('page');
            this.selectThumbnail(clickedPageNumber - 1);
            this.presenterEvents.trigger('presenter:showslide', clickedPageNumber - 1);
        },

        /**
         * Thumbnail keydown handler.
         * - selects a thumbnail with ENTER or SPACE key.
         * @param {jQuery.Event} event
         */
        onThumbnailKeydown: function (event) {
            switch (event.which || event.keyCode) {
                case 13: // enter
                    event.stopPropagation();
                    this.onThumbnailClicked(event);
                    break;
                case 32: // space
                    event.stopPropagation();
                    this.onThumbnailClicked(event);
                    break;
            }
        },

        /**
         * Handles updates to the real-time message data and set the visibility of this view accordingly.
         */
        onToggleVisibility: function () {
            var rtModel = this.app.rtModel,
                userId = this.app.rtConnection.getRTUuid();

            this.toggleVisibility(rtModel.canShowThumbnails(userId));
        },

        /**
         * Toggles the visibility of the thumbnail view.
         *
         * @param {Boolean} visibility
         */
        toggleVisibility: function (visibility) {
            if (typeof visibility !== 'boolean') {
                return;
            }
            var presentationView = this.app.mainView.presentationView;
            this.$el.toggle(visibility);
            presentationView.$el.toggleClass('thumbnails-opened', visibility);
            presentationView.onResize();
        },

        /**
         * Enter fullscreen handler.
         * - hides this thumbnail view
         */
        onEnterFullScreen: function () {
            this.toggleVisibility(false);
        },

        /**
         * Exit fullscreen handler.
         * - shows this thumbnail view
         */
        onExitFullScreen: function () {
            var rtModel = this.app.rtModel,
                userId = this.app.rtConnection.getRTUuid();

            this.toggleVisibility(rtModel.canShowThumbnails(userId));
        },

        /**
         * Selects a thumbnail of a particular page number.
         * @param {Number} pageNumber
         *  page number to be selected, 0-based.
         */
        selectThumbnail: function (pageNumber) {
            var thumbnail = this.$el.find('.presenter-thumbnail-link[data-page=' + (pageNumber + 1) + ']');
            if ((thumbnail.length > 0) && (!thumbnail.hasClass('selected'))) {
                thumbnail.addClass('selected').attr('aria-selected', true);
                thumbnail.siblings().removeClass('selected').attr('aria-selected', false);
                // scroll if the selected thumbnail is not wholly visible
                var thumbnailPane = this.$el,
                    thumbnailPaneScrollLeft = thumbnailPane.scrollLeft(),
                    thumbnailRightEdge = thumbnailPaneScrollLeft + thumbnail.offset().left + thumbnail.width(),
                    thumbnailPaneRightEdge = thumbnailPane.scrollLeft() + window.innerWidth,
                    thumbnailLeftEdge = thumbnail.offset().left,
                    marginOffset = 10;
                if (thumbnailRightEdge > thumbnailPaneRightEdge) {
                    thumbnailPane.scrollLeft(thumbnailPaneScrollLeft + thumbnailRightEdge - thumbnailPaneRightEdge + marginOffset);
                }
                if (thumbnailLeftEdge < 0) {
                    thumbnailPane.scrollLeft(thumbnailPaneScrollLeft + thumbnailLeftEdge - marginOffset);
                }
            }
        },

        /**
         * Refresh thumbnails by loading visible ones.
         */
        refreshThumbnails: function () {
            this.thumbnailLoadDef.done(function (convertData) {
                this.loadThumbnails(convertData);
            }.bind(this));
        },

        disposeView: function () {
            var def = this.thumbnailLoadDef;
            // cancel any pending thumbnail loading
            if (def.state() === 'pending') {
                def.abort();
            }
            // close convert jobs while quitting
            def.done(function (response) {
                Util.endConvert(this.model.toJSON(), response.jobID);
            }.bind(this));
            // unbind image on load handlers
            _.each(this.thumbnailImages, function (image) {
                image.onload = null;
            });
            this.thumbnailImages = null;
        }

    });

    return ThumbnailView;

});

