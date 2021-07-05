/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
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
