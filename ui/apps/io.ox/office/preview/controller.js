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
 * @author Daniel Rentz <daniel.rentz@open-xchange.com>
 */

define('io.ox/office/preview/controller',
    ['io.ox/office/tk/app/controller',
     'gettext!io.ox/office/main'
    ], function (Controller, gt) {

    'use strict';

    // class PreviewController ================================================

    /**
     * The controller of the OX Preview application.
     *
     * @constructor
     *
     * @extends Controller
     *
     * @param {PreviewApplication} app
     *  The OX Preview application that has created this controller instance.
     */
    function PreviewController(app) {

        var // all the little controller items
            items = {

                'pages/first': {
                    enable: function () { return app.getPage() > 1; },
                    set: function () { app.firstPage(); }
                },
                'pages/previous': {
                    enable: function () { return app.getPage() > 1; },
                    set: function () { app.previousPage(); }
                },
                'pages/next': {
                    enable: function () { return app.getPage() < app.getPageCount(); },
                    set: function () { app.nextPage(); }
                },
                'pages/last': {
                    enable: function () { return app.getPage() < app.getPageCount(); },
                    set: function () { app.lastPage(); }
                },

                'pages/current': {
                    enable: function () { return app.getPageCount() > 0; },
                    get: function () {
                        // the gettext comments must be located directly before gt(), but
                        // 'return' cannot be the last token in a line
                        // -> use a temporary variable to store the result
                        var label =
                            //#. %1$s is the current page index in office document preview
                            //#. %2$s is the number of pages in office document preview
                            //#, c-format
                            gt('%1$s of %2$s', app.getPage(), app.getPageCount());
                        return label;
                    }
                }
            };

        // base constructor ---------------------------------------------------

        Controller.call(this, app);

        // initialization -----------------------------------------------------

        // register item definitions
        this.registerDefinitions(items);

    } // class PreviewController

    // exports ================================================================

    // derive this class from class Controller
    return Controller.extend({ constructor: PreviewController });

});
