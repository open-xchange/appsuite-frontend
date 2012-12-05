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
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/mail/settings/defaults',
       ['io.ox/mail/util'],

function (util) {

    'use strict';

    var settingsDefaults = {
            'removeDeletedPermanently': false,
            'contactCollectOnMailTransport': false,
            'contactCollectOnMailAccess': false,
            'appendVcard': false,
            'appendMailTextOnReply': false,
            'forwardMessageAs': 'Inline',
            'messageFormat': 'html',
            'lineWrapAfter': '',
            'defaultSendAddress': util.getInitialDefaultSender(),
            'autoSafeDraftsAfter': false,
            'allowHtmlMessages': true,
            'allowHtmlImages': false,
            'displayEmomticons': false,
            'isColorQuoted': false,
            'selectFirstMessage': true
        };

    return settingsDefaults;
});
