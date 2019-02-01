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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/mail/actions/source', [
    'gettext!io.ox/mail',
    'io.ox/mail/api'
], function (gt, api) {

    'use strict';

    function setAuthentification(data, dialog) {
        // ensure full auth data is available
        return api.get(_.pick(data, 'id', 'folder_id'), { cache: false }).done(function (data) {
            data = data.authenticity;
            if (!data || !(data.spf || data.dkim || data.dmarc)) return;

            var content = _.chain(['spf', 'dkim', 'dmarc'])
                .filter(function (key) { return data[key]; })
                .map(function (key) {
                    if (!data[key] || !data[key].reason) return;
                    return key.toUpperCase() + ': ' + data[key].reason;
                })
                .value()
                .join('\n')
                .trim();

            dialog.find('.mail-authenticity-view').val(content);
            dialog.find('#mail-authenticity-headline, .mail-authenticity-view').toggleClass('hidden', !content);
        });
    }

    function setSource(data, dialog) {
        return api.getSource(data).done(function (src) {
            dialog.find('textarea.mail-source-view').val(src || '');
            dialog.find('.modal-body').css({ visibility: 'visible' });
        });
    }

    return function (baton) {
        var data = baton.first();
        require(['io.ox/core/tk/dialogs'], function (dialogs) {
            new dialogs.ModalDialog({ width: 700, addClass: 'mail-source-dialog' })
                .addPrimaryButton('close', gt('Close'), 'close')
                .header(
                    $('<h1 class="modal-title" id="mail-source">').text(gt('Mail source') + ': ' + (data.subject || ''))
                )
                .append(
                    $('<textarea class="form-control mail-source-view" readonly="readonly" aria-labelledby="mail-source">')
                    .on('keydown', function (e) {
                        if (e.which !== 27) e.stopPropagation();
                    })
                )
                .append([
                    $('<h2 id="mail-authenticity-headline" class="hidden">').text(gt('Authentication details')),
                    $('<textarea class="form-control mail-authenticity-view hidden" readonly="readonly" aria-labelledby="mail-authenticity-headline">')
                ])
                .show(function () {
                    this.busy();
                    $.when(
                        setSource(data, this),
                        setAuthentification(data, this)
                    ).done(this.idle.bind(this));
                });
        });
    };
});
