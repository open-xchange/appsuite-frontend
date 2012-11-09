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
     * Shows a hyperlink input dialog.
     *
     *  @param {String} text
     *      The optional text which represents the URL
     *  @param {String} url
     *      An optional URL which is set for the supplied text
     *
     * @returns {jQuery.Promise}
     *  The promise of a deferred object that will be resolved if the primary
     *  button has been activated, or rejected if the dialog has been canceled.
     *  The done handlers registered at the promise object will receive the
     *  entered text.
     */
    Hyperlink.showHyperlinkDialog = function (text, url) {

        return Dialogs.showHyperlinkDialog({
            title: gt('Insert/Edit Hyperlink'),
            valueURL: url,
            placeholderURL: gt('Enter URL'),
            valueText: text,
            placeholderText: gt('Enter visible text'),
            okLabel: gt('Insert')
        });
    };

    // exports ================================================================

    return Hyperlink;

});
