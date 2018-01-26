/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/main/i18n', ['gettext!io.ox/core'], function (gt) {

    'use strict';

    // A list of all strings to be included in the POT file.
    /* eslint-disable no-unused-vars */
    function list() {
        gt.pgettext('app', 'Portal');
        gt.pgettext('app', 'Mail');
        gt.pgettext('app', 'Address Book');
        gt.pgettext('app', 'Calendar');
        gt.pgettext('app', 'Scheduling');
        gt.pgettext('app', 'Tasks');
        gt.pgettext('app', 'Drive');
        gt.pgettext('app', 'Conversations');
    }
    /* eslint-disable no-unused-vars */
});
