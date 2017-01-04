/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define(['io.ox/oauth/backbone'], function (OAuth) {

    var MailAccounts = [{
        id: 1337,
        displayName: 'an OAuth account',
        mail_oauth: 1337
    }, {
        id: 1338,
        displayName: 'a regular account',
        mail_oauth: -1
    }];

    var StorageAccounts = [{
        // for storage accounts, ids are strings
        configuration: { account: '1024' },
        displayName: 'other OAuth account',
        id: '1043'
    }, {
        // for storage accounts, ids are strings
        configuration: { account: '1337' },
        displayName: 'related OAuth account',
        id: '1234'
    }];

    describe('OAuth related accounts', function () {
        var server;

        beforeEach(function () {
            server = ox.fakeServer.create();

            server.autoRespond = true;
            server.respondWith(/api\/account\?action=all/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify({
                    data: MailAccounts
                }));
            });
            server.respondWith(/api\/fileaccount\?action=all/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify({
                    data: StorageAccounts
                }));
            });
        });
        afterEach(function () {
            server.restore();
            server = null;
        });
        describe('Account model', function () {
            it('should provide a list of related accounts', function () {
                var model = new OAuth.Account.Model({
                    id: 1337
                });

                expect(model.fetchRelatedAccounts).to.be.a('function');
                return model.fetchRelatedAccounts().then(function (accounts) {
                    expect(accounts).to.be.an('array');
                    expect(accounts).to.have.length(2);
                    accounts.forEach(function (account) {
                        expect(account.id).to.exist;
                        expect(account.displayName).to.be.a('string');
                    });
                });
            });
        });
    });
});
