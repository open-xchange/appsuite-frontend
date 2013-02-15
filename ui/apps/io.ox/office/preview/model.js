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
 * @author Kai Ahrens <kai.ahrens@open-xchange.com>
 */

define('io.ox/office/preview/model',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/app/model'
    ], function (Utils, Model) {

    'use strict';

    var // maximum number of pages in page cache
        CACHE_SIZE = 100;

    // class PreviewModel =====================================================

    /**
     * The model of the Preview application. Stores and provides the HTML
     * representation of the document pages.
     *
     * @constructor
     *
     * @extends Model
     */
    function PreviewModel(app) {

        var // the total page count of the document
            pageCount = 0,

            // the page cache, mapped by one-based page number
            pageCache = {},

            // last shown pages, in order of visiting
            lastPages = [];

        // base constructor ---------------------------------------------------

        Model.call(this, app);

        // methods ------------------------------------------------------------

        /**
         * Sets the number of pages contained in the document and clears the
         * page cache.
         *
         * @param {Number} count
         *  The number of pages in the document currently previewed.
         */
        this.setPageCount = function (count) {
            pageCount = count;
            pageCache = {};
            lastPages = [];
        };

        /**
         * Returns the number of pages contained in the document.
         *
         * @returns {Number}
         *  The number of pages in the document currently previewed.
         */
        this.getPageCount = function () {
            return pageCount;
        };

        /**
         * Returns the Promise of a Deferred object that will be resolved with
         * the HTML contents of the specified page.
         *
         * @param {Number} page
         *  The one-based index of the requested page.
         *
         * @returns {jQuery.Promise}
         *  The Promise of a Deferred object that will be resolved with the
         *  HTML snippet representing the specified page, or rejected on error.
         */
        this.loadPage = function (page) {

            // first, try the page cache (returns a resolved Deferred object)
            if (page in pageCache) {
                return $.Deferred().resolve(pageCache[page]);
            }

            // load page from server
            return app.sendPreviewRequest({
                params: {
                    convert_format: 'html',
                    convert_action: 'getpage',
                    page_number: page
                },
                resultFilter: function (data) {
                    // extract HTML source, returning undefined will reject the entire request
                    return Utils.getStringOption(data, 'HTMLPages');
                }
            })
            .done(function (html) {
                // store page in cache
                pageCache[page] = html;
                lastPages = _(lastPages).without(page);
                lastPages.push(page);
                if (lastPages.length > CACHE_SIZE) {
                    delete pageCache[lastPages.shift()];
                }
            });
        };

    } // class PreviewModel

    // exports ================================================================

    // derive this class from class Model
    return Model.extend({ constructor: PreviewModel });

});
