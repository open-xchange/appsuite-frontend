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
    ['io.ox/core/event',
     'io.ox/office/tk/utils',
     'less!io.ox/office/preview/style.css'
    ], function (Events, Utils) {

    'use strict';

    // class PreviewModel =====================================================

    /**
     * The preview model. Triggers a 'showpage' event passing the current page
     * number (one-based) when the visible page has been changed.
     */
    function PreviewModel(app) {

        var // self reference
            self = this,

            // the root node containing the previewed document
            node = $('<div>').addClass('page'),

            // the job id to be used for future page requests
            jobID = 0,

            // the total page count of the document
            pageCount = 0,

            // current page index (one-based!)
            curPage = 0;

        // private methods ----------------------------------------------------

        function showPage(page) {
            if ((page !== curPage) && (page >= 1) && (page <= pageCount)) {

                // do not try to load, if file descriptor is missing
                if (app.hasFileDescriptor()) {
                    // load the file
                    app.sendAjaxRequest({
                        url: app.getDocumentFilterUrl('importdocument', { filter_format: 'html', filter_action: 'getpage', job_id: jobID, page_number: page })
                    })
                    .pipe(function (response) {
                        // return a deferred that will be resolved with a string
                        return app.extractAjaxResultValue(response, function (data) {
                            return Utils.getStringOption(data, 'HTMLPages', '');
                        });
                    })
                    .done(function (htmlPage) {
                        node[0].innerHTML = htmlPage;
                    });
                }

                self.trigger('showpage', curPage = page);
            }
        }

        // methods ------------------------------------------------------------

        /**
         * Returns the root DOM element representing this previewer.
         */
        this.getNode = function () {
            return node;
        };

        this.setPreviewDocument = function (_jobID, _pageCount) {

            jobID = _jobID;
            pageCount = _pageCount;
            curPage = 0;

            if (_.isNumber(jobID) && _.isNumber(pageCount)) {
                showPage(1);
            } else {
                node.empty();
            }

            this.trigger('showpage', curPage);
        };

        this.getPage = function () {
            return curPage;
        };

        this.getPageCount = function () {
            return pageCount;
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
            showPage(pageCount);
        };

        this.destroy = function () {
            this.events.destroy();

            if (jobID !== 0) {
                app.sendAjaxRequest({
                    url: app.getDocumentFilterUrl('importdocument', { filter_format: 'html', filter_action: 'endconvert', job_id: jobID })
                });
            }
        };

        // initialization -----------------------------------------------------

        // add event hub
        Events.extend(this);

    } // class PreviewModel

    // exports ================================================================

    return PreviewModel;

});
