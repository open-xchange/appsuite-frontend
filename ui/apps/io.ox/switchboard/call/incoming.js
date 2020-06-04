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
    'gettext!io.ox/switchboard',
    'less!io.ox/switchboard/style'
], function (presence, Modal, contactsAPI, ringtone, gt) {

    'use strict';

    return {
        openDialog: function (model) {
            new Modal({ title: gt('Incoming call') })
                .build(function () {
                    var caller = model.getCaller();
                    this.listenTo(model, 'hangup', function () {
                        ringtone.incoming.stop();
                        this.close();
                    });
                    this.$el.addClass('call-dialog');
                    this.$body.append(
                        $('<div class="photo">').append(
                            contactsAPI.pictureHalo($('<div class="contact-photo">'), { email: caller }, { width: 80, height: 80 }),
                            presence.getPresenceIcon(caller)
                        ),
                        $('<div class="name">').text(model.getCallerName()),
                        $('<div class="email">').text(caller)
                    );
                    this.$footer.append(
                        $('<div class="button">').append(
                            $('<button class="btn btn-danger" data-action="decline"><i class="fa fa-close"></i></button'),
                            $.txt(gt('Decline'))
                        ),
                        $('<div class="button">').append(
                            $('<button class="btn btn-success" data-action="answer"><i class="fa fa-phone"></i></button'),
                            $.txt(gt('Answer'))
                        )
                    );
                })
                .on('open', function () {
                    if (window.Notification) {
                        new Notification('Incoming call', {
                            body: gt('%1$s is calling', model.getCaller())
                        });
                    }
                    ringtone.incoming.play();
                })
                .on('decline', function () {
                    ringtone.incoming.stop();
                    model.decline();
                })
                .on('answer', function () {
                    ringtone.incoming.stop();
                    model.answer();
                    window.open(model.getTelcoLink());
                })
                .open();
        }
    };
});
