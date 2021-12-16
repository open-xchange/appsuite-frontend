/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define('io.ox/core/viewer/views/document/thumbnailview', [
    'io.ox/backbone/views/disposable',
    'io.ox/core/capabilities',
    'io.ox/core/tk/doc-converter-utils',
    'io.ox/core/viewer/views/types/typesutil',
    'io.ox/core/viewer/util',
    'io.ox/files/api'
], function (DisposableView, Capabilities, DocConverterUtils, TypesUtil, Util, FilesAPI) {

    'use strict';

    var ThumbnailView = DisposableView.extend({

        events: {
            'click .document-thumbnail-link': 'onThumbnailClicked',
            'keydown .document-thumbnail-link': 'onThumbnailKeydown'
        },

        initialize: function (options) {
            _.extend(this, options);
            this.listenTo(this.viewerEvents, 'viewer:document:selectthumbnail', this.selectThumbnail);
            // listen to render thumbnails call
            this.listenTo(this.viewerEvents, 'viewer:sidebar:renderthumbnails', this.render);
            // listen to sidebar scroll
            this.listenTo(this.viewerEvents, 'viewer:sidebar:scroll', this.refreshThumbnails);
            // listen to window resize
            this.listenTo(this.viewerEvents, 'viewer:resize', this.refreshThumbnails);
            // listen to version display events
            this.listenTo(this.viewerEvents, 'viewer:display:version', this.onDisplayTempVersion.bind(this));
            // listen to display item change
            this.listenTo(this.viewerEvents, 'viewer:displayeditem:change', this.setModel);

            this.thumbnailLoadDef = Util.createAbortableDeferred($.noop);
            this.thumbnailImages = [];
        },

        render: function () {
            var self = this;

            if (!Capabilities.has('document_preview')) { return this; }
            if (!TypesUtil.isDocumentType(this.model)) { return this; }

            this.$el.empty().busy({ immediate: true });
            function beginConvertSuccess(convertData) {
                self.convertData = convertData;
                self.thumbnailImages = [];
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
                self.$el.idle();
            }
            this.thumbnailLoadDef = DocConverterUtils.beginConvert(this.model)
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
            var thumbnailLink = $('<a class="document-thumbnail-link">'),
                thumbnail = $('<div class="document-thumbnail">'),
                thumbnailImage = this.createDocumentThumbnailImage('thumbnail-image'),
                thumbnailPageNumber = $('<div class="page-number">').text(pageNumber + 1);
            thumbnail.append(thumbnailImage).busy({ immediate: true });
            this.thumbnailImages.push(thumbnailImage);
            thumbnailLink.append(thumbnail, thumbnailPageNumber).attr({
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
                    id: this.model.get('id'),
                    folder_id: this.model.get('folder_id'),
                    filename: this.model.get('filename'),
                    version: this.model.get('version')
                },
                thumbnailNodes = this.$('.document-thumbnail'),
                thumbnailsToLoad = Util.getVisibleNodes(thumbnailNodes);

            _.each(thumbnailsToLoad, function (pageNumber) {
                var image = this.thumbnailImages[pageNumber - 1];
                if (image.src) {
                    return;
                }
                params.page_number = pageNumber;
                var thumbnailUrl = DocConverterUtils.getConverterUrl(params, { encodeUrl: true });
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
            var image = new Image();
            image.className = className;
            image.onload = function () {
                var $image = $(this),
                    $documentThumbnail = $image.parent(),
                    landscape = ($image.width() > $image.height());

                $documentThumbnail.idle().toggleClass('landscape', landscape);
            };
            image.style.width = '100%';
            image.style.height = 'auto';
            image.style.maxWidth = '100%';
            image.style.maxHeight = '100%';
            return image;
        },

        /**
         * Thumbnail click handler:
         * - selects/highlights the clicked thumbnail.
         * - triggers 'viewer:document:scrolltopage' event, so that the document is scrolled to the requested page.
         * @param {jQueryEvent} event
         */
        onThumbnailClicked: function (event) {
            var clickedThumbnail = $(event.currentTarget),
                clickedPageNumber = clickedThumbnail.data('page');
            this.selectThumbnail(clickedPageNumber);
            this.viewerEvents.trigger('viewer:document:scrolltopage', clickedPageNumber);
        },

        /**
         * Thumbnail keydown handler.
         * - selects a thumbnail with ENTER or SPACE key.
         * @param {jQuery.Event} event
         */
        onThumbnailKeydown: function (e) {
            switch (e.which) {
                case 13: // enter
                    e.stopPropagation();
                    this.onThumbnailClicked(e);
                    break;
                case 32: // space
                    e.stopPropagation();
                    this.onThumbnailClicked(e);
                    break;
                // no default
            }
        },

        /**
         * Selects a thumbnail of a particular page number.
         * @param {Number} pageNumber
         */
        selectThumbnail: function (pageNumber) {
            var thumbnail = this.$el.find('.document-thumbnail-link[data-page=' + pageNumber + ']');
            if (thumbnail.length > 0) {
                thumbnail.siblings().removeClass('selected').attr('aria-selected', false);
                thumbnail.addClass('selected').attr('aria-selected', true);
                // scroll if the selected thumbnail is not wholly visible
                var thumbnailRect = thumbnail[0].getBoundingClientRect(),
                    sidebar = this.$el.parent('.viewer-sidebar'),
                    thumbnailTopOffset = thumbnail[0].offsetTop,
                    marginOffset = 10;
                if (thumbnailRect.bottom > window.innerHeight) {
                    sidebar.scrollTop(thumbnailTopOffset + thumbnail.outerHeight() - sidebar.outerHeight() + marginOffset);
                }
                if (thumbnailRect.top < sidebar.scrollTop()) {
                    sidebar.scrollTop(thumbnailTopOffset - marginOffset);
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

        /**
         * Sets a new model and renders accordingly.
         *
         * @param {FilesAPI.Model} model.
         *  The new model.
         */
        setModel: function (model) {
            this.model = model || null;
            this.$el.parent().find('.viewer-sidebar-tabs').toggleClass('hidden', !TypesUtil.isDocumentType(this.model));
            this.render();
        },

        /**
         * Handles display temporary file version events.
         *
         * @param {Object} versionData
         *   The JSON representation of the version.
         */
        onDisplayTempVersion: function (versionData) {
            var model = (versionData) ? new FilesAPI.Model(versionData) : null;
            this.setModel(model);
        },

        onDispose: function () {
            var def = this.thumbnailLoadDef;
            // cancel any pending thumbnail loading
            if (def.state() === 'pending') {
                def.abort();
            }
            // close convert jobs while quitting
            def.done(function (response) {
                DocConverterUtils.endConvert(this.model, response.jobID);
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
