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

        var // self reference
            self = this,

            // the view instance
            view = null,

            // all the little controller items
            items = {

                'document/valid': {
                    enable: function () { return app.getPageCount() > 0; }
                },

                'pages/first': {
                    parent: 'document/valid',
                    enable: function (enabled) { return enabled && (app.getPage() > 1); },
                    set: function () { app.firstPage(); }
                },
                'pages/previous': {
                    parent: 'document/valid',
                    enable: function (enabled) { return enabled && (app.getPage() > 1); },
                    set: function () { app.previousPage(); }
                },
                'pages/next': {
                    parent: 'document/valid',
                    enable: function (enabled) { return enabled && (app.getPage() < app.getPageCount()); },
                    set: function () { app.nextPage(); }
                },
                'pages/last': {
                    parent: 'document/valid',
                    enable: function (enabled) { return enabled && (app.getPage() < app.getPageCount()); },
                    set: function () { app.lastPage(); }
                },

                'pages/current': {
                    parent: 'document/valid',
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
                },

                'zoom/dec': {
                    parent: 'document/valid',
                    enable: function (enabled) { return enabled && (view.getZoomLevel() > view.getMinZoomLevel()); },
                    set: function () { view.decreaseZoom(); }
                },
                'zoom/inc': {
                    parent: 'document/valid',
                    enable: function (enabled) { return enabled && (view.getZoomLevel() < view.getMaxZoomLevel()); },
                    set: function () { view.increaseZoom(); }
                },
                'zoom/current': {
                    parent: 'document/valid',
                    get: function () {
                        // the gettext comments must be located directly before gt(), but
                        // 'return' cannot be the last token in a line
                        // -> use a temporary variable to store the result
                        var label =
                            //#. %1$d is the current zoom factor, in percent
                            //#, c-format
                            gt('%1$d%', view.getZoomFactor());
                        return label;
                    }
                }
            };

        // base constructor ---------------------------------------------------

        Controller.call(this, app);

        // initialization -----------------------------------------------------

        // register item definitions
        this.registerDefinitions(items)
            .registerDoneHandler(function () { view.grabFocus(); });

        // initialization after construction
        app.on('docs:init', function () {
            // view is not available at construction time
            view = app.getView();
        });

    } // class PreviewController

    // exports ================================================================

    // derive this class from class Controller
    return Controller.extend({ constructor: PreviewController });

});
