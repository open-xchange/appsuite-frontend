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
    ['io.ox/office/tk/utils',
     'io.ox/office/framework/app/basecontroller',
     'gettext!io.ox/office/main'
    ], function (Utils, BaseController, gt) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes;

    // class PreviewController ================================================

    /**
     * The controller of the OX Preview application.
     *
     * @constructor
     *
     * @extends BaseController
     *
     * @param {PreviewApplication} app
     *  The OX Preview application that has created this controller instance.
     */
    function PreviewController(app) {

        var // the model instance
            model = null,

            // the view instance
            view = null,

            // all the little controller items
            items = {

                // view -------------------------------------------------------

                // toggle the main side pane
                'app/view/sidepane': {
                    get: function () { app.getView().isSidePaneVisible(); },
                    set: function (state) { app.getView().toggleSidePane(state); }
                },

                // pages ------------------------------------------------------

                'document/valid': {
                    enable: function () { return model.getPageCount() > 0; }
                },

                'pages/first': {
                    parent: 'document/valid',
                    enable: function () { return view.getPage() > 1; },
                    set: function () { view.showFirstPage(); },
                    shortcut: { keyCode: KeyCodes.HOME, altKey: null, ctrlKey: null, metaKey: null }
                },

                'pages/previous': {
                    parent: 'document/valid',
                    enable: function () { return view.getPage() > 1; },
                    set: function () { view.showPreviousPage(); },
                    shortcut: { keyCode: KeyCodes.PAGE_UP, altOrMetaKey: true }
                },

                'pages/next': {
                    parent: 'document/valid',
                    enable: function () { return view.getPage() < model.getPageCount(); },
                    set: function () { view.showNextPage(); },
                    shortcut: { keyCode: KeyCodes.PAGE_DOWN, altOrMetaKey: true }
                },

                'pages/last': {
                    parent: 'document/valid',
                    enable: function () { return view.getPage() < model.getPageCount(); },
                    set: function () { view.showLastPage(); },
                    shortcut: { keyCode: KeyCodes.END, altKey: null, ctrlKey: null, metaKey: null }
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
                            gt('%1$s of %2$s', view.getPage(), model.getPageCount());
                        return label;
                    }
                },

                // zoom -------------------------------------------------------

                'zoom/dec': {
                    parent: 'document/valid',
                    enable: function () { return view.getZoomLevel() > view.getMinZoomLevel(); },
                    set: function () { view.decreaseZoomLevel(); },
                    shortcut: { charCode: '-' }
                },

                'zoom/inc': {
                    parent: 'document/valid',
                    enable: function () { return view.getZoomLevel() < view.getMaxZoomLevel(); },
                    set: function () { view.increaseZoomLevel(); },
                    shortcut: { charCode: '+' }
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

        BaseController.call(this, app);

        // initialization -----------------------------------------------------

        // register item definitions
        this.registerDefinitions(items);

        // initialization after construction
        app.on('docs:init', function () {
            // model and view are not available at construction time
            model = app.getModel();
            view = app.getView();
        });

    } // class PreviewController

    // exports ================================================================

    // derive this class from class BaseController
    return BaseController.extend({ constructor: PreviewController });

});
