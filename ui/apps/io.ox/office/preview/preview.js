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

define('io.ox/office/preview/preview',
    ['io.ox/core/event',
     'less!io.ox/office/preview/style.css'], function (Events) {

    'use strict';

    // class Preview ==========================================================

    /**
     * The preview.
     */
    function Preview() {

        var // self reference
            self = this,

            // the root node containing the previewed document
            node = $('<div>').addClass('abs io-ox-office-preview-page'),

            // all slides to be shown in the preview
            pages = $(),

            // current page index (one-based!)
            curPage = 0;

        // private methods ----------------------------------------------------

        function showPage(page) {
            if ((page !== curPage) && (1 <= page) && (page <= pages.length)) {
                pages.eq(curPage - 1).hide();
                curPage = page;
                pages.eq(curPage - 1).show();
                self.trigger('showpage', curPage);
            }
        }

        // methods ------------------------------------------------------------

        /**
         * Returns the root DOM element representing this previewer.
         */
        this.getNode = function () {
            return node;
        };

        this.setPreviewDocument = function (htmlPreview) {

            if (_.isString(htmlPreview)) {

                // import the passed HTML markup
                node.html(htmlPreview);

                // TODO: remove in backend, so we don't need to
                // remove it here for cost reasons
                node.children('hr').hide();

                // use all top-level svg elements as pages to be displayed
                // (initially, hide all pages)
                pages = node.children('svg').hide();
            } else {
                pages = $();
            }

            curPage = pages.length ? 1 : 0;
            self.trigger('showpage', curPage);
        };

        this.getPage = function () {
            return curPage;
        };

        this.getPageCount = function () {
            return pages.length;
        };

        this.firstAvail = function () {
            return curPage > 1;
        };

        this.previousAvail = function () {
            return this.firstAvail();
        };

        this.nextAvail = function () {
            return this.lastAvail();
        };

        this.lastAvail = function () {
            return curPage < pages.length;
        };

        /**
         * Navigating to the first page
         */
        this.firstPage = function () {
            showPage(1);
        };

        /**
         * Navigating to the previous page
         */
        this.previousPage = function () {
            showPage(curPage - 1);
        };

        /**
         * Navigating to the next page
         */
        this.nextPage = function () {
            showPage(curPage + 1);
        };

        /**
         * Navigating to the last page
         */
        this.lastPage = function () {
            showPage(pages.length);
        };

        // initialization -----------------------------------------------------

        // add event hub
        Events.extend(this);

    } // class Preview

    // exports ================================================================

    return Preview;

});
