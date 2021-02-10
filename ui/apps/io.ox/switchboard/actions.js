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
