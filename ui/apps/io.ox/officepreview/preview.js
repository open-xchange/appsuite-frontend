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

define("io.ox/officepreview/preview",
    ["io.ox/core/tk/keys",
     "less!io.ox/officepreview/style.css"], function (tkKeys) {

    'use strict';
    
    // -----------------
    // - class Preview -
    // -----------------

    /**
     * The preview.
     */
    function Preview(previewNode) {
        
        var pageCount = 0,
            curPage = 0,
            idArray = [];
            
        previewNode.addClass('io-ox-officepreview-page');

        // setting the preview document
        this.setPreviewDocument = function (htmlPreview) {
            
            pageCount = curPage = 0;
            
            if (htmlPreview) {
                previewNode.html(htmlPreview);

                // remove in backend, so we don't need to
                // remove it here for cost reasons
                $("hr").hide();
                
                // count number of pages (SVG elements) and
                // create a named ID Array out of this value;
                // hide all but the first elements during this
                // iteration, too
                if (0 < (pageCount = $("svg").length)) {
                    idArray = _.range(1, pageCount + 1).map(function (pageNumber) {
                        var id = "#pres_page_" + pageNumber;
                        
                        if (pageNumber > 1) {
                            $(id).hide();
                        }
                        
                        return id;
                    });
                    
                    curPage = 1;
                }
            }
            else {
                previewNode.append('<p>Sorry, preview is not available</p>');
            }
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
         * Navigating to the next page
         */
        this.lastPage = function () {
            showPage(pageCount);
        };
        
        // ------------------
        // - status methods -
        // ------------------
        
        this.firstAvail = function () {
            return (curPage > 1);
        };

        this.previousAvail = function () {
            return this.firstAvail();
        };

        this.nextAvail = function () {
            return this.lastAvail();
        };

        this.lastAvail = function () {
            return (curPage < pageCount);
        };

        // global preview settings ---------------------------------------------

        /**
         * Returns the root DOM element representing this editor.
         */
        this.getNode = function () {
            return previewNode;
        };
        
        // -------------------
        // - private methods -
        // -------------------

        function showPage(pageNum) {
            if (pageNum !== curPage && pageNum <= pageCount && pageNum >= 1) {
                $(idArray[curPage - 1]).hide();
                $(idArray[(curPage = pageNum) - 1]).show();
            }
        }

        
    } // end of Preview()

    // exports ================================================================

    return Preview;
});
