/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/switchboard/call/incoming', [
    'io.ox/switchboard/presence',
    'io.ox/backbone/views/modal',
    'io.ox/contacts/api',
    'io.ox/switchboard/call/ringtone',
    'settings!io.ox/switchboard',
    'gettext!io.ox/switchboard',
    'less!io.ox/switchboard/style'
], function (presence, Modal, contactsAPI, ringtone, settings, gt) {

    'use strict';

    return {
        openDialog: function (call) {
            new Modal({ title: gt('Incoming call') })
                .build(function () {
                    var caller = call.getCaller();
                    this.listenTo(call, 'hangup', function () {
                        ringtone.incoming.stop();
                        this.close();
                    });
                    this.$el.addClass('call-dialog');
                    this.$body.append(
                        $('<div class="photo">').append(
                            contactsAPI.pictureHalo($('<div class="contact-photo">'), { email: caller }, { width: 80, height: 80 }),
                            presence.getPresenceIcon(caller)
                        ),
                        $('<div class="name">').append(call.getCallerName()),
                        $('<div class="email">').text(caller)
                    );
                    this.$footer.append($('<div class="action-button-rounded">').append(
                        $('<button type="button" class="btn btn-link btn-danger" data-action="decline">').append(
                            $('<i class="fa fa-close" aria-hidden="true">'),
                            $('<div>').text(gt('Decline'))
                        ),
                        $('<button type="button" class="btn btn-link btn-success" data-action="answer">').append(
                            $('<i class="fa fa-phone" aria-hidden="true">'),
                            $('<div>').text(gt('Answer'))
                        )
                    ));
                })
                .on('open', function () {
                    if (window.Notification && settings.get('call/showNativeNotifications', true)) {
                        new Notification('Incoming call', {
                            body: gt('%1$s is calling', call.getCaller())
                        });
                    }
                    ringtone.incoming.play();
                })
                .on('decline', function () {
                    ringtone.incoming.stop();
                    call.decline();
                })
                .on('answer', function () {
                    ringtone.incoming.stop();
                    call.answer();
                    call.addToHistory();
                    window.open(call.getJoinURL());
                })
                .open();
        }
    };
});
