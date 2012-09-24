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

define('io.ox/office/editor/dialog/error',
    ['gettext!io.ox/office/main'
    ], function (gt) {

    'use strict';

    var ErrorDialogs = {};

    /**
     * Shows an UI in case the resource could not be inserted as image
     */
    ErrorDialogs.insertImageError = function () {
        alert(gt("Sorry, image could not be inserted."));
    };

    // exports ================================================================

    return ErrorDialogs;
});
