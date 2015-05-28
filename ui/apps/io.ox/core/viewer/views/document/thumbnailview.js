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
    'gettext!io.ox/core'
], function (DisposableView) {

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
            _.times(this.pageCount, function (pageNumber) {
                var thumbnailLink = $('<a class="document-thumbnail-link">'),
                    thumbnail = $('<div class="document-thumbnail">'),
                    thumbnailPageNumber = $('<div class="page-number">').text(pageNumber + 1);
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
        }

    });

    return ThumbnailView;

});
