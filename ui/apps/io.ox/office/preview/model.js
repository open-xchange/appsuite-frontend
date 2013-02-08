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

    // class PreviewModel =====================================================

    /**
     * The model of the Preview application.
     *
     * @constructor
     *
     * @extends Model
     */
    function PreviewModel(app) {

        var // the root node containing the previewed document
            node = $('<div>', { tabindex: 0 }).addClass('page');

        // base constructor ---------------------------------------------------

        Model.call(this, app);

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

    } // class PreviewModel

    // exports ================================================================

    // derive this class from class Model
    return Model.extend({ constructor: PreviewModel });

});
