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

define("io.ox/officePreview/main",
    ["io.ox/core/tk/keys",
     "less!io.ox/officePreview/style.css"], function (tkKeys) {

    'use strict';
    
    // -----------------
    // - class Preview -
    // -----------------

    /**
     * The preview.
     */
    function Preview(previewNode) {

        // previewDocument as jQuery object
        var childs = previewNode.children;
        
        // setting the preview document
        this.setPreviewDocument = function (previewDocument) {
            if (previewDocument) {
                
                previewNode[0].innerHTML = '<html><p>Success inner HTML</p></html>';
                
                childs
                .append("<div>").text("Success children append 1")
                .append("<div>").text("Success children append 2");
            }
            else {
                
                previewNode[0].innerHTML = '<html><p>Failure inner HTML</p></html>';

                childs
                .append("<div>").text("Failure children append 1")
                .append("<div>").text("Failure children append 2");
            }
        };
        
        /**
         * Navigating to the next page
         */
        this.nextPage = function () {
        };

        /**
         * Navigating to the previous page
         */
        this.nextPage = function () {
        };
        
        // global preview settings ---------------------------------------------

        /**
         * Returns the root DOM element representing this editor.
         */
        this.getNode = function () {
            return previewNode;
        };

    } // end of Preview()

    // exports ================================================================

    return Preview;
});
