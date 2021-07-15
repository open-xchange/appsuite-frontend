/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
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
                        $('<button type="button" class="btn btn-link ">')
                            .addClass('btn-danger')
                            .attr('data-action', 'decline')
                            .append(
                                $('<i class="fa" aria-hidden="true">').addClass('fa-close'),
                                $('<div>').text(gt('Decline'))
                            ),
                        $('<button type="button" class="btn btn-link ">')
                            .addClass('btn-success')
                            .attr('data-action', 'answer')
                            .append(
                                $('<i class="fa" aria-hidden="true">').addClass('fa-phone'),
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
