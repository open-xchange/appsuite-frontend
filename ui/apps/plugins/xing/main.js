/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 */

define('plugins/xing/main', [
    'io.ox/core/extPatterns/stage',
    'io.ox/core/extensions',
    'io.ox/xing/api',
    'io.ox/core/extPatterns/links',
    'io.ox/core/notifications',
    'io.ox/keychain/api',
    'gettext!plugins/portal'
], function (Stage, ext, api, links, notifications, keychain, gt) {

    'use strict';

    var XING_NAME = gt('XING'),
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

    new links.Action('io.ox/xing/actions/invite', {
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

    new links.Action('io.ox/xing/actions/add', {
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
            ext.point('io.ox/contacts/links/inline').extend(new links.Link({
                id: 'invite-contact-to-xing',
                index: 610,
                label: gt('Invite to %s', XING_NAME),
                ref: 'io.ox/xing/actions/invite'
            }));

            ext.point('io.ox/mail/all/actions').extend(new links.Link({
                id: 'invite-email-to-xing',
                index: 310, /* Preferably closely following 300, "invite to appointment" */
                label: gt('Invite to %s', XING_NAME),
                ref: 'io.ox/xing/actions/invite'
            }));

            ext.point('io.ox/contacts/classic-toolbar/links').extend(new links.Link({
                id: 'invite-contact-to-xing-classic',
                prio: 'lo',
                mobile: 'lo',
                label: gt('Invite to %s', XING_NAME),
                ref: 'io.ox/xing/actions/invite'
            }));

            /* add on xing actions in toolbars */
            ext.point('io.ox/contacts/links/inline').extend(new links.Link({
                id: 'add-on-xing-by-contact',
                index: 610, /* same index as 'invite to XING', because it is mutually exclusive */
                label: gt('Add on %s', XING_NAME),
                ref: 'io.ox/xing/actions/add'
            }));

            ext.point('io.ox/mail/all/actions').extend(new links.Link({
                id: 'add-on-xing-by-e-mail',
                index: 310, /* same index as 'invite to XING', because it is mutually exclusive */
                label: gt('Add on %s', XING_NAME),
                ref: 'io.ox/xing/actions/add'
            }));

            ext.point('io.ox/contacts/classic-toolbar/links').extend(new links.Link({
                id: 'add-on-xing-by-contact-classic',
                prio: 'lo',
                mobile: 'lo',
                label: gt('Add on %s', XING_NAME),
                ref: 'io.ox/xing/actions/add'
            }));
            return $.when();
        }
    });
});
