/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/mail/folderview-extensions', [
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'gettext!io.ox/mail'
], function (ext, capabilities, gt) {

    'use strict';

    var POINT = 'io.ox/mail/folderview';

    function addAccount(e) {
        e.preventDefault();
        require(['io.ox/mail/accounts/settings'], function (m) {
            m.mailAutoconfigDialog(e);
        });
    }

    if (capabilities.has('multiple_mail_accounts')) {
        ext.point(POINT + '/sidepanel/links').extend({
            id: 'add-account',
            index: 300,
            draw: function () {
                if (_.device('!smartphone')) {
                    this.append($('<div>').append(
                        $('<a href="#" data-action="add-mail-account" tabindex="1" role="button">')
                        .text(gt('Add mail account'))
                        .on('click', addAccount)
                    ));
                }
            }
        });
    }
});
