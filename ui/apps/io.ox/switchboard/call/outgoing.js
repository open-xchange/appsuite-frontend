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
    'io.ox/switchboard/views/zoom-call',
    'gettext!io.ox/switchboard',
    'less!io.ox/switchboard/style'
], function (Modal, presence, contactsAPI, ringtone, ZoomCall, gt) {

    'use strict';

    return {
        openDialog: function (call) {
            new Modal({ title: gt('Call'), autoClose: false })
                .inject({
                    renderCallees: function () {
                        var callees = call.getCallees();
                        var $photo = $('<div class="photo">');
                        if (callees.length === 1) {
                            $photo.append(
                                contactsAPI.pictureHalo($('<div class="contact-photo">'), { email: callees[0] }, { width: 80, height: 80 }),
                                presence.getPresenceIcon(callees[0])
                            );
                        } else {
                            $photo.append(
                                $('<div class="contact-photo">').append('<i class="fa fa-group fa-3x" aria-hidden="true">')
                            );
                        }
                        this.$body.empty().append(
                            $photo,
                            $('<div class="name">').append(
                                callees.length === 1 ? call.getCalleeName(callees[0]) : gt('Conference call')
                            ),
                            $('<div class="email">').text(callees.join(', '))
                        );
                    },
                    renderService: function () {
                        // this must be made flexible, i.e. support for Zoom, Jitsi, etc.
                        this.conference = new ZoomCall();
                        this.$body.append(this.conference.render().$el);
                    },
                    renderButtons: function () {
                        var state = this.conference.model.get('state');
                        this.$footer.empty();
                        switch (state) {
                            case 'unauthorized':
                                this.renderConnectButtons();
                                break;
                            case 'authorized':
                            case 'done':
                                this.renderCallButtons();
                            // no default
                        }
                    },
                    renderConnectButtons: function () {
                        this.$footer.append(
                            this.createButton('default', 'cancel', 'times', gt('Cancel')),
                            this.createButton('primary', 'connect', 'plug', gt('Connect'))
                        );
                    },
                    renderCallButtons: function () {
                        this.$footer.append(
                            this.createButton('default', 'cancel', 'times', gt('Cancel')),
                            this.createButton('success', 'call', 'phone', gt('Call'))
                        );
                        this.toggleCallButton();
                        this.$('button[data-action="call"]').focus();
                    },
                    createButton: function (type, action, icon, title) {
                        return $('<div class="button">').append(
                            $('<button class="btn btn-' + type + '" data-action="' + action + '"><i class="fa fa-' + icon + '"></i></button'),
                            $.txt(title)
                        );
                    },
                    toggleCallButton: function () {
                        var link = this.conference.model.get('joinLink');
                        this.getButton('call').prop('disabled', !link);
                    },
                    getButton: function (action) {
                        return this.$('button[data-action="' + action + '"]');
                    }
                })
                .build(function () {
                    this.$header.hide();
                    this.$el.addClass('call-dialog');
                    this.renderCallees();
                    this.renderService();
                    this.renderButtons();
                    this.listenTo(this.conference.model, 'change:state', this.renderButtons);
                    this.listenTo(this.conference.model, 'change:joinLink', this.toggleCallButton);
                    this.listenTo(this.conference.model, 'done', this.close);
                })
                .on('connect', function () {
                    this.conference.startOAuthHandshake();
                })
                .on('call', function () {
                    var link = this.conference.model.get('joinLink');
                    console.log('call', link);
                    if (!link) return;
                    window.open(link, 'call');
                    call.set('telco', link).propagate();
                    ringtone.outgoing.play();
                    this.getButton('cancel').parent().remove();
                    this.getButton('call').parent().replaceWith(
                        this.createButton('danger', 'hangup', 'phone', gt('Hang up'))
                    );
                    call.addToHistory();
                })
                .on('hangup', function () {
                    this.close();
                })
                .on('close', function () {
                    ringtone.outgoing.stop();
                    call.hangup();
                })
                .open();
        }
    };
});
