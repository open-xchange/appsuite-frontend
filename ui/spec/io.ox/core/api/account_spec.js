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
define(['shared/examples/for/api',
        'io.ox/core/api/account',
        'io.ox/mail/sender',
        'fixture!io.ox/core/api/user.json',
        'fixture!io.ox/mail/write/accounts.json'
       ], function (sharedExamplesFor, api, sender, fixtureUser, fixtureAccounts) {

    function Done(f) {
        f = function () { return !!f.value; };
        f.yep = function () { f.value = true; };
        return f;
    }

    describe('basic account API', function () {

        var options = {
            markedPending: {
                'basic account API a basic API class has some get methods should define a getAll method.': true,
                'basic account API a basic API class has some get methods should define a getList method.': true,
                'basic account API a basic API class has some get methods should return a deferred object for getAll.': true,
                'basic account API a basic API class has some get methods should return a deferred object for getList.': true
            }
        };

        sharedExamplesFor(api, options);
    });

    describe('account API', function () {

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
            addresses: 'otto.xentner@OX.IO', // uppercase!
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
            pop3_storage : null,
            primary_address: 'otto.xentner@OX.IO', // uppercase!
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

            var done = new Done();
            waitsFor(done, 'set data');

            api.cache.clear()
                .then(api.cache.keys)
                .then(function (keys) {
                    expect(keys.length).toBe(0);
                    // now add custom data
                    return $.when(
                        api.cache.add(account0)
                    );
                })
                .then(api.all)
                .done(function (accounts) {
                    done.yep();
                    expect(accounts.length).toBe(1);
                });
        });

        it('returns proper account data', function () {

            var done = new Done();
            waitsFor(done, 'load account');

            api.get(0).done(function (data) {
                expect(data.id).toBe(0);
                expect(data.login).toBe('otto.xentner');
                done.yep();
            });
        });

        it('is account', function () {
            expect(api.isAccount(0)).toBe(true);
            expect(api.isAccount(1)).toBe(false);
        });

        it('is primary account', function () {
            expect(api.isPrimary('default0/yeah')).toBe(true);
            expect(api.isPrimary('default1/nope')).toBe(false);
        });

        it('is "inbox" folder', function () {
            expect(api.is('inbox', 'default0/INBOX')).toBe(true);
            expect(api.is('inbox', 'default0/XOBNI')).toBe(false);
        });

        it('is "sent" folder', function () {
            expect(api.is('sent', 'default0/INBOX/Gesendete Objekte')).toBe(true);
            expect(api.is('sent', 'default0/INBOX/nope')).toBe(false);
        });

        it('parses account id', function () {

            var id;

            id = api.parseAccountId('default0');
            expect(id).toBe(0);

            id = api.parseAccountId('default01337', true);
            expect(id).toBe(1337);

            id = api.parseAccountId(0);
            expect(id).toBe(0);
        });

        it('returns correct primary address', function () {

            var done = new Done();
            waitsFor(done, 'get primary address');

            require(['settings!io.ox/mail']).then(function (settings) {

                // overwrite settings. white-space
                settings.set('defaultSendAddress', ' otto.xentner@open-xchange.com ');

                api.getPrimaryAddress(0).done(function (address) {
                    expect(address).toEqual(['Otto Xentner', 'otto.xentner@open-xchange.com']);
                    done.yep();
                });
            });
        });

        it('returns default display name', function () {

            var done = new Done();
            waitsFor(done, 'default display_name');

            api.getDefaultDisplayName().done(function (name) {
                expect(name).toBe('Otto Xentner');
                done.yep();
            });
        });

        it('uses default display_name as fallback (personal)', function () {

            var done = new Done();
            waitsFor(done, 'default display_name');

            // clear "personal" first
            account0.personal = '';

            $.when(
                api.getDefaultDisplayName(),
                api.cache.add(account0)
            )
            .done(function (name) {
                api.getPrimaryAddress(0).done(function (address) {
                    done.yep();
                    expect(address).toEqual([name, 'otto.xentner@open-xchange.com']);
                });
            });
        });

        it('returns correct sender addresses', function () {

            var done = new Done();
            waitsFor(done, 'sender addresses');

            // add some addresses. with some falsy white-space and upper-case
            account0.addresses = ' otto.xentner@open-xchange.com ,ALL@open-xchange.com, alias@open-xchange.com,another.alias@open-xchange.com ';

            api.cache.add(account0).done(function () {
                api.getSenderAddresses(0).done(function (addresses) {
                    done.yep();
                    expect(addresses).toEqual([
                        ['Otto Xentner', 'alias@open-xchange.com'],
                        ['Otto Xentner', 'all@open-xchange.com'],
                        ['Otto Xentner', 'another.alias@open-xchange.com'],
                        ['Otto Xentner', 'otto.xentner@open-xchange.com']
                    ]);
                });
            });
        });

        it('returns all sender addresses across all accounts', function () {

            var done = new Done();
            waitsFor(done, 'all sender addresses');

            // add second account
            var account1 = _.extend(account0, {
                addresses: ' test@gmail.com,   FOO@gmail.com, yeah@gmail.com',
                id: 1,
                personal: 'Test',
                primary_address: 'FOO@gmail.com'
            });

            api.cache.add(account1).done(function () {
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
                    expect(addresses).toEqual(expected);
                    done.yep();
                });
            });
        });

        it('returns correct primary address for folder_id', function () {

            var done = new Done();
            waitsFor(done, 'get address');

            api.getPrimaryAddressFromFolder('default1/INBOX/test').done(function (address) {
                expect(address).toEqual(['Test', 'foo@gmail.com']);
                done.yep();
            });
        });

        it('returns correct primary address for account_id', function () {

            var done = new Done();
            waitsFor(done, 'get address');

            api.getPrimaryAddressFromFolder(1).done(function (address) {
                expect(address).toEqual(['Test', 'foo@gmail.com']);
                done.yep();
            });
        });

        it('returns correct default sender address', function () {
            var defaultAddress = sender.getDefaultSendAddress();
            expect(defaultAddress).toBe('otto.xentner@open-xchange.com');
        });

        it('creates proper select-box with sender addresses', function () {

            var done = new Done();
            waitsFor(done, 'get addresses');

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
                expect(select.children().length).toBe(8);
                expect(select.find('[default]').length).toBe(1);
                done.yep();
            });
        });

        it('sets initial value of select-box correctly', function () {
            // box should automatically select the default value
            expect(getValue()).toEqual(['Otto Xentner', 'otto.xentner@open-xchange.com']);
        });

        it('sets value of select-box correctly', function () {
            setValue(['Test', 'foo@gmail.com']);
            var index = select.prop('selectedIndex');
            expect(index).toEqual(5);
        });

        it('uses default address if invalid values are set', function () {
            // an invalid value select first item in the list
            setValue(['Test', 'not-in@the.list']);
            var index = select.prop('selectedIndex'),
                value = select.val();
            expect(index).toEqual(4);
            expect(value).toEqual('"Otto Xentner" <otto.xentner@open-xchange.com>');
        });

        it('selects proper address during initial loading', function () {

            var done = new Done();
            waitsFor(done, 'async test');

            // clear box
            select.empty().removeAttr('data-default');

            // set value
            setValue(['Test', 'foo@gmail.com']);

            expect(select.val()).toEqual(null);
            expect(select.children().length).toEqual(0);

            // an invalid value select first item in the list
            setTimeout(function () {
                sender.drawOptions(select).done(function () {
                    var index = select.prop('selectedIndex');
                    expect(index).toEqual(5);
                    done.yep();
                });
            }, 100);
        });

        // tidy up

        it('resets account data', function () {

            var done = new Done(), self = this;
            waitsFor(done, 'reset data');

            api.cache.clear()
            .then(function () {
                return require(['settings!io.ox/mail']).then(function (settings) {
                    self.after(function () {
                        settings.set('defaultSendAddress');
                    });
                });
            })
            .then(function () {
                return api.all();
            })
            .done(function (accounts) {
                done.yep();
                expect(accounts.length).toBe(1);
            });
        });
    });
});
