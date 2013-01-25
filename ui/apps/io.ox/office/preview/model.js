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
     'less!io.ox/office/preview/style.css'
    ], function (Utils) {

    'use strict';

    // class PreviewModel =====================================================

    /**
     * The preview model.
     */
    function PreviewModel() {

        var // the root node containing the previewed document
            node = $('<div>').addClass('page');

        // methods ------------------------------------------------------------

        /**
         * Returns the root DOM element representing this previewer.
         */
        this.getNode = function () {
            return node;
        };

        /**
         * Inserts the passed HTML source code into the root node of this
         * document model.
         */
        this.renderPage = function (html) {
            node[0].innerHTML = html;
        };

        this.destroy = $.noop;

    } // class PreviewModel

    // exports ================================================================

    return PreviewModel;

});
