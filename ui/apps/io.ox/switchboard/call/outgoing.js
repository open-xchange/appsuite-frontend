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
 */

define('io.ox/switchboard/call/outgoing', [
    'io.ox/backbone/views/modal',
    'io.ox/switchboard/presence',
    'io.ox/contacts/api',
    'io.ox/switchboard/call/ringtone',
    'less!io.ox/switchboard/style'
], function (Modal, presence, contactsAPI, ringtone) {

    'use strict';

    return {
        openDialog: function (model) {
            ringtone.outgoing.play();
            new Modal({ title: 'Outgoing Call' })
                .inject({
                    renderCallees: function () {
                        var link = model.getTelcoLink();
                        this.$body.empty().append(
                            $('<div class="callees">').append(
                                model.getCallees().map(this.renderCallee, this)
                            ),
                            $('<div class="telco-link">').append(
                                $.txt('Please click the following link if the service does not open automatically: '),
                                $('<a target="blank" rel="noopener">').attr('href', link).text(link)
                            )
                        );
                    },
                    renderCallee: function (callee) {
                        return $('<div class="callee">').append(
                            contactsAPI.pictureHalo($('<div class="contact-photo">'), { email: callee }, { width: 40, height: 40 }),
                            presence.getPresenceIcon(callee),
                            this.getState(callee),
                            $('<div class="name">').text(model.getCalleeName(callee)),
                            $('<div class="email">').text(callee)
                        );
                    },
                    getState: function (callee) {
                        var state = model.getCalleeState(callee);
                        if (state === 'declined') return $('<span style="color: #a00"><i class="fa fa-close"></i> Declined</span>');
                        if (state === 'answered') return $('<span style="color: #0a0"><i class="fa fa-check"></i> Answered</span>');
                        return $('<span>Calling ...</span>');
                    }
                })
                .build(function () {
                    this.$el.addClass('outgoing-call');
                    this.listenTo(model, 'hangup', this.close);
                    this.listenTo(model, 'change:state', this.renderCallees);
                    this.renderCallees();
                })
                // simple button! not primary! hang up is not a default action.
                .addButton({ action: 'hangup', label: 'Hang up', className: 'btn-default' })
                .on('hangup', function () {
                    ringtone.outgoing.stop();
                    model.hangup();
                })
                .on('close', function () {
                    ringtone.outgoing.stop();
                })
                .open();
        }
    };
});
