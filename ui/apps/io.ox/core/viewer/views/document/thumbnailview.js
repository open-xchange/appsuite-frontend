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

        initialize: function (options) {
            //console.warn('ThumbnailView.initialize()');
            _.extend(this, options);
        },

        render: function () {
            //console.warn('ThumbnailView.render()');
            _.times(this.pageCount, function (pageNumber) {
                var thumbnailLink = $('<a class="document-thumbnail-link">'),
                    thumbnail = $('<div class="document-thumbnail">'),
                    pageNumber = $('<div class="page-number">').text(pageNumber + 1);
                thumbnailLink.append(thumbnail, pageNumber);
                this.$el.append(thumbnailLink);
            }.bind(this));
            return this;
        }

    });

    return ThumbnailView;

});
