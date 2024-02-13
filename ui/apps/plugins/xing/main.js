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

define('plugins/xing/main', [
    'io.ox/core/extPatterns/stage',
    'io.ox/core/extensions',
    'io.ox/xing/api',
    'io.ox/backbone/views/actions/util',
    'io.ox/core/notifications',
    'io.ox/keychain/api',
    'gettext!plugins/portal'
], function (Stage, ext, api, actionsUtil, notifications, keychain, gt) {

    'use strict';

    var Action = actionsUtil.Action,
        XING_NAME = gt('XING'),
        isAlreadyOnXing,
        hasXingAccount;

    hasXingAccount = function () {
        return keychain.isEnabled('xing') && keychain.hasStandardAccount('xing');
    };

    isAlreadyOnXing = function (emailArray) {
        return api.findByMail(emailArray).then(function (data) {
            if (!data.results) return false;
            return _(data.results.items).some(function (inquiry) {
                return !!inquiry.user;
            });
        });
    };

    new Action('io.ox/xing/actions/invite', {
        id: 'invite-xing',
        capabilities: 'xing',
        requires: function (e) {
            var contact = e.baton.data,
                arr = _.compact([contact.email1, contact.email2, contact.email3]),
                def = $.Deferred();

            if (!hasXingAccount() || !e.collection.has('one') || contact.mark_as_distributionlist) {
                def.resolve(false);
                return def;
            }

            isAlreadyOnXing(arr).done(function (isPresent) {
                def.resolve(!isPresent);
            }).fail(function () {
                def.resolve(false);
            });

            return def;
        },
        action: function (baton) {
            var contact = baton.data;
            api.invite({
                email: contact.email1 || contact.email2 || contact.email3
            })
            .fail(function (response) {
                notifications.yell('error', gt('There was a problem with %s. The error message was: "%s"', XING_NAME, response.error));
            })
            .done(function () {
                notifications.yell('success', gt('Invitation sent'));
            });
        }
    });

    new Action('io.ox/xing/actions/add', {
        id: 'add-on-xing',
        capabilities: 'xing',
        requires: function (e) {
            var contact = e.baton.data,
                arr = _.compact([contact.email1, contact.email2, contact.email3]),
                def = $.Deferred();

            if (!hasXingAccount()) {
                def.resolve(false);
                return def;
            }

            isAlreadyOnXing(arr).done(function (isPresent) {
                def.resolve(isPresent);
            }).fail(function () {
                def.resolve(false);
            });
            return def;
        },
        action: function (baton) {
            var contact = baton.data;
            api.initiateContactRequest({
                email: contact.email1 || contact.email2 || contact.email3
            })
            .fail(function (response) {
                notifications.yell('error', gt('There was a problem with %s. The error message was: "%s"', XING_NAME, response.error));
            })
            .done(function () {
                notifications.yell('success', gt('Contact request sent'));
            });
        }
    });

    new Stage('io.ox/core/stages', {
        id: 'xing-toolbar-addons',
        index: 1001,
        run: function () {

            /* invite to xing actions in toolbars */
            ext.point('io.ox/contacts/links/inline').extend({
                id: 'invite-contact-to-xing',
                index: 610,
                title: gt('Invite to %s', XING_NAME),
                ref: 'io.ox/xing/actions/invite'
            });

            ext.point('io.ox/mail/all/actions').extend({
                id: 'invite-email-to-xing',
                index: 310, /* Preferably closely following 300, "invite to appointment" */
                title: gt('Invite to %s', XING_NAME),
                ref: 'io.ox/xing/actions/invite'
            });

            ext.point('io.ox/contacts/toolbar/links').extend({
                id: 'invite-contact-to-xing-classic',
                prio: 'lo',
                mobile: 'lo',
                title: gt('Invite to %s', XING_NAME),
                ref: 'io.ox/xing/actions/invite'
            });

            /* add on xing actions in toolbars */
            ext.point('io.ox/contacts/links/inline').extend({
                id: 'add-on-xing-by-contact',
                index: 610, /* same index as 'invite to XING', because it is mutually exclusive */
                title: gt('Add on %s', XING_NAME),
                ref: 'io.ox/xing/actions/add'
            });

            ext.point('io.ox/mail/all/actions').extend({
                id: 'add-on-xing-by-e-mail',
                index: 310, /* same index as 'invite to XING', because it is mutually exclusive */
                title: gt('Add on %s', XING_NAME),
                ref: 'io.ox/xing/actions/add'
            });

            ext.point('io.ox/contacts/toolbar/links').extend({
                id: 'add-on-xing-by-contact-classic',
                prio: 'lo',
                mobile: 'lo',
                title: gt('Add on %s', XING_NAME),
                ref: 'io.ox/xing/actions/add'
            });

            return $.when();
        }
    });
});
