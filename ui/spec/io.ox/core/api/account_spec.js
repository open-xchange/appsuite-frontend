/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define([
    'io.ox/core/api/account',
    'io.ox/mail/sender',
    'fixture!io.ox/core/api/user.json',
    'fixture!io.ox/mail/compose/accounts.json'
], function (api, sender, fixtureUser, fixtureAccounts) {

    'use strict';

    describe('Core account API', function () {

        beforeEach(function () {

            this.server.respondWith('GET', /api\/user\?action=get/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(fixtureUser.current));
            });

            this.server.respondWith('GET', /api\/account\?action=all/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(fixtureAccounts));
            });
        });

        var account0 = {
            addresses: 'otto.xentner@OPEN-XCHANGE.COM', // uppercase!
            confirmed_ham: 'confirmed-ham',
            confirmed_ham_fullname: 'default0/INBOX/confirmed-ham',
            confirmed_spam: 'confirmed-spam',
            confirmed_spam_fullname: 'default0/INBOX/confirmed-spam',
            drafts: 'Entwürfe',
            drafts_fullname: 'default0/INBOX/Entwürfe',
            id: 0,
            login: 'otto.xentner',
            mail_port: 143,
            mail_protocol: 'imap',
            mail_secure: false,
            mail_server: 'ox.open-xchange.com',
            mail_url: 'imap://ox.open-xchange.com:143',
            meta: null,
            name: 'Email',
            password: null,
            personal: 'Otto Xentner', // just last_name
            pop3_delete_write_through: false,
            pop3_expunge_on_quit: false,
            pop3_path: 'INBOX/EMail',
            pop3_refresh_rate: null,
            pop3_storage: null,
            primary_address: 'otto.xentner@OPEN-XCHANGE.COM', // uppercase!
            reply_to: null,
            sent: 'Gesendete Objekte',
            sent_fullname: 'default0/INBOX/Gesendete Objekte',
            spam: 'Spam',
            spam_fullname: 'default0/INBOX/Spam',
            spam_handler: 'NoSpamHandler',
            transport_login: 'otto.xentner',
            transport_password: null,
            transport_port: 25,
            transport_protocol: 'smtp',
            transport_secure: false,
            transport_server: 'ox.open-xchange.com',
            transport_url: 'smtp://ox.open-xchange.com:25',
            trash: 'Papierkorb',
            trash_fullname: 'default0/INBOX/Papierkorb',
            unified_inbox_enabled: false
        };

        it('sets custom account data', function () {

            // clear
            api.cache = {};
            expect(_(api.cache).size()).to.equal(0);
            // now add custom data
            api.cache[account0.id] = account0;
            // get all -- NO CLUE why we need that wait; without wait() the server is not yet up
            return api.all().then(function (accounts) {
                expect(accounts.length).to.equal(1);
            });
        });

        it('returns proper account data', function () {
            return api.get(0).then(function (data) {
                expect(data.id).to.equal(0);
                expect(data.login).to.equal('otto.xentner');
            });
        });

        it('is account', function () {
            expect(api.isAccount(0)).to.equal(true);
            expect(api.isAccount(1)).to.equal(false);
        });

        it('is primary account', function () {
            expect(api.isPrimary('default0/yeah')).to.equal(true);
            expect(api.isPrimary('default1/nope')).to.equal(false);
        });

        it('is "inbox" folder', function () {
            expect(api.is('inbox', 'default0/INBOX')).to.be.true;
            expect(api.is('inbox', 'default0/XOBNI')).to.be.false;
        });

        it('is "sent" folder', function () {
            expect(api.is('sent', 'default0/INBOX/Gesendete Objekte')).to.be.true;
            expect(api.is('sent', 'default0/INBOX/nope')).to.be.false;
        });

        it('parses account id', function () {

            var id;

            id = api.parseAccountId('default0');
            expect(id).to.equal(0);

            id = api.parseAccountId('default01337', true);
            expect(id).to.equal(1337);

            id = api.parseAccountId(0);
            expect(id).to.equal(0);
        });

        it('returns correct primary address', function () {
            return require(['settings!io.ox/mail']).then(function (settings) {

                // overwrite settings. white-space
                settings.set('defaultSendAddress', ' otto.xentner@open-xchange.com ');

                return api.getPrimaryAddress(0);
            }).then(function (address) {
                expect(address).to.deep.equal(['Otto Xentner', 'otto.xentner@open-xchange.com']);
            });
        });

        it('returns default display name', function () {
            return api.getDefaultDisplayName().then(function (name) {
                expect(name).to.equal('Otto Xentner');
            });
        });

        it('uses default display_name as fallback (personal)', function () {
            // clear "personal" first
            account0.personal = '';
            api.cache[account0.id] = account0;

            return $.when(
                api.getDefaultDisplayName(),
                api.getPrimaryAddress(0)
            ).then(function (name, address) {
                expect(address).to.deep.equal([name, 'otto.xentner@open-xchange.com']);
            });
        });

        it('returns correct sender addresses', function () {
            // add some addresses. with some falsy white-space and upper-case
            account0.addresses = ' otto.xentner@open-xchange.com ,ALL@open-xchange.com, alias@open-xchange.com,another.alias@open-xchange.com ';
            api.cache[0] = account0;

            return api.getSenderAddresses(0).then(function (addresses) {
                expect(addresses).to.deep.equal([
                    ['Otto Xentner', 'alias@open-xchange.com'],
                    ['Otto Xentner', 'all@open-xchange.com'],
                    ['Otto Xentner', 'another.alias@open-xchange.com'],
                    ['Otto Xentner', 'otto.xentner@open-xchange.com']
                ]);
            });
        });

        it('returns all sender addresses across all accounts', function () {
            // add second account
            var account1 = _.extend({}, account0, {
                addresses: ' test@gmail.com,   FOO@gmail.com, yeah@gmail.com',
                id: 1,
                personal: 'Test',
                primary_address: 'FOO@gmail.com'
            });

            api.cache[1] = account1;

            return api.getAllSenderAddresses().then(function (addresses) {
                var expected = [
                    ['Otto Xentner', 'alias@open-xchange.com'],
                    ['Otto Xentner', 'all@open-xchange.com'],
                    ['Otto Xentner', 'another.alias@open-xchange.com'],
                    ['Otto Xentner', 'otto.xentner@open-xchange.com'],
                    ['Test', 'foo@gmail.com'],
                    ['Test', 'test@gmail.com'],
                    ['Test', 'yeah@gmail.com']
                ];
                expect(addresses).to.deep.equal(expected);
            });
        });

        it('returns correct primary address for folder_id', function () {
            return api.getPrimaryAddressFromFolder('default1/INBOX/test').then(function (address) {
                expect(address).to.deep.equal(['Test', 'foo@gmail.com']);
            });
        });

        it('returns correct primary address for account_id', function () {
            return api.getPrimaryAddressFromFolder(1).then(function (address) {
                expect(address).to.deep.equal(['Test', 'foo@gmail.com']);
            });
        });

        it('returns correct default sender address', function () {
            var defaultAddress = sender.getDefaultSendAddress();
            expect(defaultAddress).to.equal('otto.xentner@open-xchange.com');
        });

        // tidy up

        it('resets account data', function () {
            api.cache = {};

            return $.when(
                require(['settings!io.ox/mail']),
                api.all()
            ).then(function (settings, accounts) {
                expect(accounts.length).to.equal(1);
                settings.set('defaultSendAddress');
                api.cache = {};
            });
        });
    });
});
