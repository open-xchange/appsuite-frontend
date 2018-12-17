/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/mail/settings/defaults', [], function () {

    'use strict';

    var settingsDefaults = {
        'removeDeletedPermanently': false,
        'contactCollectOnMailTransport': false,
        'contactCollectOnMailAccess': false,
        'useFixedWidthFont': false,
        'appendVcard': false,
        'sendDispositionNotification': false,
        'appendMailTextOnReply': true,
        'forwardMessageAs': 'Inline',
        'messageFormat': 'html',
        'lineWrapAfter': '0',
        'defaultSendAddress': '',
        'allowHtmlMessages': true,
        'allowHtmlImages': false,
        'isColorQuoted': false,
        'defaultSignature': false,
        'defaultReplyForwardSignature': false,
        'mobileSignature': undefined,
        // one of 'none', 'custom'
        'mobileSignatureType': 'none',
        'threadSupport': true,
        //for persistent sort
        'sort': 'thread',
        'order': 'desc',
        'unread': false,
        'notificationSoundName': 'bell',
        'playSound': true,
        'confirmReplyToMailingLists': true,
        'unseenMessagesFolder': true,
        'showCheckboxes': true,  // show checkboxes in mail list as default
        'authenticity': {
            // none, fail, fail_trusted, fail_trusted_pass, all, silly
            level: 'fail_trusted',
            domains: ''
        }
    };

    return settingsDefaults;
});
