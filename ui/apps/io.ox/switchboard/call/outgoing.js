/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/switchboard/call/outgoing', [
    'io.ox/backbone/views/modal',
    'io.ox/switchboard/presence',
    'io.ox/contacts/api',
    'io.ox/switchboard/call/ringtone',
    'gettext!io.ox/switchboard',
    'less!io.ox/switchboard/style'
], function (Modal, presence, contactsAPI, ringtone, gt) {

    'use strict';

    return {
        openDialog: function (call) {
            return new Modal({ autoClose: false })
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
                                callees.length === 1 ? call.getCalleeName(callees[0]) : $.txt(gt('Conference call'))
                            ),
                            $('<div class="email">').text(gt.noI18n(callees.join(', ')))
                        );
                    },
                    renderService: function () {
                        return require(['io.ox/switchboard/views/' + call.getType() + '-call'], function (View) {
                            this.conference = new View({ model: call });
                            this.$body.append(this.conference.render().$el);
                        }.bind(this));
                    },
                    renderButtons: function () {
                        var state = this.conference.model.get('state');
                        this.$footer.empty();
                        switch (state) {
                            case 'offline':
                                this.renderCancelButton();
                                break;
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
                        var renderFn;
                        if (_.isFunction(this.conference.createConnectButtons)) {
                            renderFn = this.conference.createConnectButtons.bind(this);
                        } else {
                            renderFn = function () {
                                return $('<div class="action-button-rounded">').append(
                                    this.createButton('default', 'cancel', 'times', gt('Cancel')),
                                    this.createButton('primary', 'connect', 'plug', gt('Connect'))
                                );
                            };
                        }
                        this.$footer.append(renderFn());
                    },
                    renderCallButtons: function () {
                        this.$footer.append($('<div class="action-button-rounded">').append(
                            this.createButton('default', 'cancel', 'times', gt('Cancel')),
                            this.createButton('success', 'call', 'phone', gt.pgettext('verb', 'Call'))
                        ));
                        this.toggleCallButton();
                        this.$('button[data-action="call"]').focus();
                    },
                    renderCancelButton: function () {
                        this.$footer.append($('<div class="action-button-rounded">').append(
                            this.createButton('default', 'cancel', 'times', gt('Cancel'))
                        ));
                        this.$('button[data-action="cancel"]').focus();
                    },
                    createButton: function (type, action, icon, title) {
                        return $('<button type="button" class="btn btn-link">')
                            .addClass(type && ('btn-' + type))
                            .attr('data-action', action)
                            .append(
                                $('<i class="fa" aria-hidden="true">').addClass('fa-' + icon),
                                $('<div>').text(title)
                            );
                    },
                    toggleCallButton: function () {
                        var url = this.conference.model.get('joinURL');
                        this.getButton('call').prop('disabled', !url);
                    },
                    getButton: function (action) {
                        return this.$('button[data-action="' + action + '"]');
                    },
                    getJoinURL: function () {
                        return this.conference.model.get('joinURL');
                    }
                })
                .build(function () {
                    this.$header.hide();
                    this.$el.addClass('call-dialog');
                    this.renderCallees();
                    this.renderService().done(function () {
                        this.renderButtons();
                        this.listenTo(this.conference.model, 'change:state', this.renderButtons);
                        this.listenTo(this.conference.model, 'change:joinURL', this.toggleCallButton);
                        this.listenTo(this.conference.model, 'done', this.close);
                    }.bind(this));
                })
                .on('connect', function () {
                    this.conference.trigger('connect');
                })
                .on('call', function () {
                    var url = this.getJoinURL();
                    if (!url) return;
                    window.open(url, 'call');
                    call.set('joinURL', url).propagate();
                    ringtone.outgoing.play();
                    this.getButton('cancel').remove();
                    this.getButton('call').replaceWith(
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
