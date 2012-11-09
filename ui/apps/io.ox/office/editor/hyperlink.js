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
 * @author Carsten Driesner <carsten.driesner@open-xchange.com>
 */

define('io.ox/office/editor/hyperlink',
    ['io.ox/office/tk/apphelper',
     'io.ox/office/tk/dialogs',
     'gettext!io.ox/office/main'
    ], function (AppHelper, Dialogs, gt) {
    

    'use strict';

    // static class Image =====================================================

    /**
     * Provides static helper methods for manipulation and calculation
     * of a hyperlink.
     */
    var Hyperlink = {};

    // static functions =======================================================

    /**
     * Shows the hyperlink dialog
     *
     * @param  app the current application
     */
    Hyperlink.insertHyperlinkDialog = function (app) {
        var editor = app.getEditor();
        
        Dialogs.showHyperlinkDialog({
            title: gt('Insert/Edit Hyperlink'),
            valueURL: 'http://',
            placeholderURL: gt('Enter URL'),
            valueText: null,
            placeholderText: gt('Enter visible text'),
            okLabel: gt('Insert')
        })
        .done(function (data) {
            Hyperlink.insertHyperlink(app, data.text, data.url, true);
        });
    };

    /**
     * Inserts the hyperlink into a document.
     *
     * @param {ox.ui.App} app
     *  The application object representing the edited document.
     *
     * @param {String} url
     *  The url describing the target of the hyperlink to be inserted.
     *
     * @param {Boolean} [showError]
     *  If set to true, an alert box is shown in case of an error. Otherwise,
     *  errors are silently ignored.
     */
    Hyperlink.insertHyperlink = function (app, text, url, showError) {

        app.getEditor().insertHyperlink(text, url);
    };

    // exports ================================================================

    return Hyperlink;

});
