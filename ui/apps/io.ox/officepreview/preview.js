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
        
        previewNode.addClass('io-ox-officepreview-page');

        // previewDocument as jQuery object
        
        // setting the preview document
        this.setPreviewDocument = function (previewDocument) {
            if (previewDocument) {
                previewNode.append("<h1>Success setting HTML to app pane</h1><h1>Success setting HTML to app pane</h1><h1>Success setting HTML to app pane</h1><h1>Success setting HTML to app pane</h1><h1>Success setting HTML to app pane</h1><h1>Success setting HTML to app pane</h1><h1>Success setting HTML to app pane</h1><h1>Success setting HTML to app pane</h1><h1>Success setting HTML to app pane</h1><h1>Success setting HTML to app pane</h1><h1>Success setting HTML to app pane</h1><h1>Success setting HTML to app pane</h1><h1>Success setting HTML to app pane</h1><h1>Success setting HTML to app pane</h1><h1>Success setting HTML to app pane</h1><h1>Success setting HTML to app pane</h1><h1>Success setting HTML to app pane</h1><h1>Success setting HTML to app pane</h1><h1>Success setting HTML to app pane</h1><h1>Success setting HTML to app pane</h1><h1>Success setting HTML to app pane</h1><h1>Success setting HTML to app pane</h1><h1>Success setting HTML to app pane</h1><h1>Success setting HTML to app pane</h1><h1>Success setting HTML to app pane</h1><h1>Success setting HTML to app pane</h1><h1>Success setting HTML to app pane</h1><h1>Success setting HTML to app pane</h1><h1>Success setting HTML to app pane</h1><h1>Success setting HTML to app pane</h1>");
            }
            else {
                previewNode.append('<p>Failure setting HTML to app pane</p>');
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
