/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */
define([
    'io.ox/core/api/account',
    'io.ox/mail/sender',
    'fixture!io.ox/core/api/user.json',
    'fixture!io.ox/mail/compose/accounts.json'
], function (api, sender, fixtureUser, fixtureAccounts) {

    'use strict';

    describe('Core account API', function () {

        var select = $();

        function setValue(from) {
            sender.set(select, from);
        }

        function getValue() {
            return sender.get(select);
        }

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

        it('sets custom account data', function (done) {

            // clear
            api.cache = {};
            expect(_(api.cache).size()).to.equal(0);
            // now add custom data
            api.cache[account0.id] = account0;
            // get all -- NO CLUE why we need that wait; without wait() the server is not yet up
            _.wait(1).then(function () {
                api.all().done(function (accounts) {
                    expect(accounts.length).to.equal(1);
                    done();
                });
            });
        });

        it('returns proper account data', function (done) {
            api.get(0).done(function (data) {
                expect(data.id).to.equal(0);
                expect(data.login).to.equal('otto.xentner');
                done();
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

        it('returns correct primary address', function (done) {
            require(['settings!io.ox/mail']).then(function (settings) {

                // overwrite settings. white-space
                settings.set('defaultSendAddress', ' otto.xentner@open-xchange.com ');

                api.getPrimaryAddress(0).done(function (address) {
                    expect(address).to.deep.equal(['Otto Xentner', 'otto.xentner@open-xchange.com']);
                    done();
                });
            });
        });

        it('returns default display name', function (done) {
            api.getDefaultDisplayName().done(function (name) {
                expect(name).to.equal('Otto Xentner');
                done();
            });
        });

        it('uses default display_name as fallback (personal)', function (done) {
            // clear "personal" first
            account0.personal = '';
            api.cache[account0.id] = account0;

            api.getDefaultDisplayName().done(function (name) {
                api.getPrimaryAddress(0).done(function (address) {
                    expect(address).to.deep.equal([name, 'otto.xentner@open-xchange.com']);
                    done();
                });
            });
        });

        it('returns correct sender addresses', function (done) {
            // add some addresses. with some falsy white-space and upper-case
            account0.addresses = ' otto.xentner@open-xchange.com ,ALL@open-xchange.com, alias@open-xchange.com,another.alias@open-xchange.com ';
            api.cache[0] = account0;

            api.getSenderAddresses(0).done(function (addresses) {
                expect(addresses).to.deep.equal([
                    ['Otto Xentner', 'alias@open-xchange.com'],
                    ['Otto Xentner', 'all@open-xchange.com'],
                    ['Otto Xentner', 'another.alias@open-xchange.com'],
                    ['Otto Xentner', 'otto.xentner@open-xchange.com']
                ]);
                done();
            });
        });

        it('returns all sender addresses across all accounts', function (done) {
            // add second account
            var account1 = _.extend({}, account0, {
                addresses: ' test@gmail.com,   FOO@gmail.com, yeah@gmail.com',
                id: 1,
                personal: 'Test',
                primary_address: 'FOO@gmail.com'
            });

            api.cache[1] = account1;

            api.getAllSenderAddresses().done(function (addresses) {
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
                done();
            });
        });

        it('returns correct primary address for folder_id', function (done) {
            api.getPrimaryAddressFromFolder('default1/INBOX/test').done(function (address) {
                expect(address).to.deep.equal(['Test', 'foo@gmail.com']);
                done();
            });
        });

        it('returns correct primary address for account_id', function (done) {
            api.getPrimaryAddressFromFolder(1).done(function (address) {
                expect(address).to.deep.equal(['Test', 'foo@gmail.com']);
                done();
            });
        });

        it('returns correct default sender address', function () {
            var defaultAddress = sender.getDefaultSendAddress();
            expect(defaultAddress).to.equal('otto.xentner@open-xchange.com');
        });

        it('creates proper select-box with sender addresses', function (done) {
            $('body').append(
                select = $('<select class="sender-dropdown" size="1">').css('width', '400px')
            );

            // patch to get test data
            sender.getNumbers = function () {
                return $.Deferred().resolve({
                    cellular_telephone0: '+49 151 00 000 001', // should not appear
                    cellular_telephone1: '+49 151 99 888 777',
                    cellular_telephone2: '+49 151 99 999 888',
                    cellular_telephone3: ' ' // should not appear
                });
            };

            sender.getMapping = function () {
                return ['cellular_telephone1', 'cellular_telephone2', 'cellular_telephone3'];
            };

            sender.drawOptions(select).done(function () {
                expect(select.children().length).to.equal(8);
                expect(select.find('[default]').length).to.equal(1);
                done();
            });
        });

        it('sets initial value of select-box correctly', function () {
            // box should automatically select the default value
            expect(getValue()).to.deep.equal(['Otto Xentner', 'otto.xentner@open-xchange.com']);
        });

        it('sets value of select-box correctly', function () {
            setValue(['Test', 'foo@gmail.com']);
            var index = select.prop('selectedIndex');
            expect(index).to.equal(5);
        });

        it('uses default address if invalid values are set', function () {
            // an invalid value select first item in the list
            setValue(['Test', 'not-in@the.list']);
            var index = select.prop('selectedIndex'),
                value = select.val();
            expect(index).to.equal(4);
            expect(value).to.equal('"Otto Xentner" <otto.xentner@open-xchange.com>');
        });

        it('selects proper address during initial loading', function (done) {
            // clear box
            select.empty().removeAttr('data-default');

            // set value
            setValue(['Test', 'foo@gmail.com']);

            expect(select.val()).to.be.null;
            expect(select.children().length).to.equal(0);

            // an invalid value select first item in the list
            setTimeout(function () {
                sender.drawOptions(select).done(function () {
                    var index = select.prop('selectedIndex');
                    expect(index).to.equal(5);
                    done();
                });
            }, 100);
        });

        // tidy up

        it('resets account data', function (done) {
            api.cache = {};
            var mailSettings;

            require(['settings!io.ox/mail']).then(function (settings) {
                mailSettings = settings;
                return api.all();
            })
            .done(function (accounts) {
                expect(accounts.length).to.equal(1);
                mailSettings.set('defaultSendAddress');
                done();
            });
        });
    });
});
