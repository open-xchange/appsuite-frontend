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

define('io.ox/switchboard/actions', [
    'io.ox/switchboard/api',
    'io.ox/core/extensions',
    'io.ox/backbone/views/modal',
    'io.ox/backbone/views/actions/util',
    'io.ox/switchboard/call/api'
], function (api, ext, Modal, actionsUtil, call) {

    'use strict';

    var Action = actionsUtil.Action;

    new Action('io.ox/switchboard/call-user', {
        collection: 'some',
        matches: function (baton) {
            // you cannot call yourself
            if (justMyself(baton)) return false;
            if (!baton.type) return false;
            return api.isGAB(baton);
        },
        action: function (baton) {
            var recipients = _(baton.array()).pluck('email1');
            call.start(baton.type, recipients);
        }
    });

    // new Action('io.ox/switchboard/wall-user', {
    //     collection: 'some',
    //     matches: function (baton) {
    //         return api.isGAB(baton);
    //     },
    //     action: function (baton) {
    //         var recipients = getRecipients(baton);
    //         new Modal({ title: 'Send message' })
    //             .addCancelButton()
    //             .addButton({ label: 'Send', action: 'send' })
    //             .build(function () {
    //                 this.$body.append('<textarea class="form-control message" rows="3" placeholder="Message"></textarea>');
    //                 this.$el.on('keypress', 'textarea', function (e) {
    //                     if (e.which === 13 && e.ctrlKey) this.invokeAction('send');
    //                 }.bind(this));
    //             })
    //             .on('send', function () {
    //                 var message = this.$('textarea.message').val();
    //                 api.propagate('wall', recipients, { message: message });
    //             })
    //             .open();
    //     }
    // });

    function justMyself(baton) {
        return baton.array().every(function (data) { return data.email1 === api.userId; });
    }

    // // add links to toolbar
    // ext.point('io.ox/contacts/toolbar/links').extend(
    //     {
    //         id: 'call',
    //         before: 'send',
    //         prio: 'hi',
    //         mobile: 'hi',
    //         title: 'Call',
    //         ref: 'io.ox/switchboard/call-user'
    //     },
    //     {
    //         id: 'wall',
    //         before: 'call',
    //         prio: 'hi',
    //         mobile: 'hi',
    //         title: 'Chat',
    //         ref: 'io.ox/switchboard/wall-user'
    //     }
    // );
});
