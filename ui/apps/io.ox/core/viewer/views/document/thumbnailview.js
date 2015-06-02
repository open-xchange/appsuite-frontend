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
define('io.ox/core/viewer/views/document/thumbnailview', [
    'io.ox/backbone/disposable',
    'io.ox/core/viewer/util',
    'gettext!io.ox/core'
], function (DisposableView, Util) {

    'use strict';

    var ThumbnailView = DisposableView.extend({

        className: 'document-thumbnails-view',

        events: {
            'click .document-thumbnail-link': 'onThumbnailClicked'
        },

        initialize: function (options) {
            //console.warn('ThumbnailView.initialize()');
            _.extend(this, options);
            this.listenTo(this.viewerEvents, 'viewer:document:selectthumbnail', this.selectThumbnail);
        },

        render: function () {
            //console.warn('ThumbnailView.render()');
            _.times(this.convertData.pageCount, function (pageNumber) {
                // temporary limit thumbnails to 20 for testing
                if (pageNumber > 20) return;
                var thumbnailLink = $('<a class="document-thumbnail-link">'),
                    thumbnail = $('<div class="document-thumbnail">'),
                    thumbnailImage = this.createDocumentThumbnailImage({
                        jobID: this.convertData.jobID,
                        pageNumber: pageNumber + 1
                    }),
                    thumbnailPageNumber = $('<div class="page-number">').text(pageNumber + 1);
                thumbnail.append(thumbnailImage);
                thumbnailLink.append(thumbnail, thumbnailPageNumber).attr({
                    'role': 'button',
                    'aria-selected': false,
                    'data-page': pageNumber + 1
                });
                this.$el.append(thumbnailLink);
            }.bind(this));
            return this;
        },

        /**
         * Creates thumbnail image of a document page.
         *
         * @param {Object} params
         *  @param {String} params.jobID
         *   conversion job ID from the document converter.
         *  @param {String} params.pageNumber
         *   a document page number
         *
         * @returns {jQuery} image
         *  the image node as jQuery element.
         */
        createDocumentThumbnailImage: function (params) {
            //console.warn('ThumbnailView.createDocumentThumbnailImage()', params);
            var file = this.model.toJSON(),
                defaultParams = {
                    action: 'convertdocument',
                    convert_action: 'getpage',
                    target_format: 'png',
                    target_width: 160,
                    target_height: 200,
                    target_zoom: 1,
                    id: encodeURIComponent(file.id),
                    folder_id: file.folder_id,
                    filename: file.filename,
                    version: file.version
                },
                imageUrlParams = _.extend(defaultParams, {
                    job_id: params.jobID,
                    page_number: params.pageNumber
                }),
                image = $('<img class="thumbnail-image">'),
                imageUrl = Util.getConverterUrl(imageUrlParams);
            image.attr('src', imageUrl);
            return image;
        },

        /**
         * Thumbnail click handler:
         * - selects/highlights the clicked thumbnail.
         * - triggers 'viewer:document:scrolltopage' event, so that the document is scrolled to the requested page.
         * @param {jQueryEvent} event
         */
        onThumbnailClicked: function (event) {
            //console.warn('ThumbnailView.onThumbnailClicked()');
            var clickedThumbnail = $(event.currentTarget),
                clickedPageNumber = clickedThumbnail.data('page');
            this.selectThumbnail(clickedPageNumber);
            this.viewerEvents.trigger('viewer:document:scrolltopage', clickedPageNumber);
        },

        /**
         * Selects a thumbnail of a particular page number.
         * @param {Number} pageNumber
         */
        selectThumbnail: function (pageNumber) {
            //console.warn('ThumbnailView.selectThumbnail()');
            var thumbnail = this.$el.find('.document-thumbnail-link[data-page=' + pageNumber + ']');
            thumbnail.siblings().removeClass('selected').attr('aria-selected', false);
            thumbnail.addClass('selected').attr('aria-selected', true);
        },

        getVisibleThumbnails: function () {
            //console.warn('ThumbnailView.getVisibileThumbnails()');
        },

        disposeView: function () {
            //console.warn('ThumbnailView.disposeView()');
            Util.endConvertJob(this.model.toJSON(), this.convertData.jobID);
            this.remove();
        }

    });

    return ThumbnailView;

});
