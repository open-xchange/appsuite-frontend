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
        return api.get(_.pick(data, 'id', 'folder_id'), { cache: true }).done(function (data) {
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
            dialog.find('textarea.mail-source-view').val(src || '').scrollTop();
            dialog.find('.modal-body').css({ visibility: 'visible' });
        });
    }

    return function (baton) {
        var data = baton.first();
        require(['io.ox/backbone/views/modal'], function (ModalDialog) {
            new ModalDialog({ title: gt('Mail source') + ': ' + (data.subject || ''), width: 700, autoFocusOnIdle: false, addClass: 'mail-source-dialog' })
                .addButton({ label: gt('Close'), action: 'close' })
                .build(function () {
                    var self = this;
                    this.$el.addClass('mail-source-dialog');
                    this.$body.append(
                        this.$source = $('<textarea class="form-control mail-source-view" readonly="readonly" aria-labelledby="mail-source">')
                        .on('keydown', function (e) {
                            if (e.which !== 27) e.stopPropagation();
                        }),
                        $('<h2 id="mail-authenticity-headline" class="hidden">').text(gt('Authentication details')),
                        this.$auth = $('<textarea class="form-control mail-authenticity-view hidden" readonly="readonly" aria-labelledby="mail-authenticity-headline">')
                    );
                    $.when(
                        setSource(data, this.$el),
                        setAuthentification(data, this.$el)
                    ).done(function () {
                        self.idle();
                        self.$el.find('textarea.mail-source-view').focus();
                        // use defer here. Firefox has a very odd focus mechanic. Focussing the textarea causes it to scroll to the bottom. Scrolltop directly after this is ignored, so use defer
                        _.defer(function () {
                            self.$el.find('textarea.mail-source-view').scrollTop(0);
                        });
                    });
                })
                .busy(true)
                .open();
        });
    };
});
