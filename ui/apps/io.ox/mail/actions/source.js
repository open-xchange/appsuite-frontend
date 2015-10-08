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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/mail/actions/source', [
    'gettext!io.ox/mail',
    'io.ox/mail/api'
], function (gt, api) {

    'use strict';

    return function (baton) {
        var data = baton.first();
        require(['io.ox/core/tk/dialogs'], function (dialogs) {
            new dialogs.ModalDialog({ width: 700 })
                .addPrimaryButton('close', gt('Close'), 'close', { tabIndex: 1 })
                .header(
                    $('<h4>').text(gt('Mail source') + ': ' + (data.subject || ''))
                )
                .append(
                    $('<textarea class="form-control mail-source-view" rows="15" readonly="readonly">')
                    .on('keydown', function (e) {
                        if (e.which !== 27) e.stopPropagation();
                    })
                )
                .show(function () {
                    api.getSource(data).done(function (src) {
                        this.find('textarea').val(src || '').css({ visibility: 'visible', cursor: 'default' });
                        this.idle();
                    }.bind(this));
                });
        });
    };
});
