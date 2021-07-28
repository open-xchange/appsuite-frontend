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

define([
    'io.ox/core/extensions',
    'waitsFor',
    'gettext!io.ox/mail',
    'fixture!io.ox/mail/write/accounts.json',
    'fixture!io.ox/core/api/user.json',
    'io.ox/mail/settings/pane'
], function (ext, waitsFor, gt, accounts, userData) {

    describe('Mail settings', function () {
        var node;
        beforeEach(function () {
            this.server.respondWith('GET', /api\/user\?action=get/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' },
                    JSON.stringify(userData.current)
                );
            });
            this.server.respondWith('GET', /\/api\/account\?action=all/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' },
                    JSON.stringify(accounts)
                );
            });
            $('body', document).append(node = $('<div id="mailsettingsNode">'));
            ext.point('io.ox/mail/settings/detail').invoke('draw', node, {});
            return waitsFor(function () {
                return node.find('h1').length === 1;
            });
        });

        afterEach(function () {
            node.remove();
        });

        it('should draw the form', function () {
            expect(node.find('h1').text()).to.equal(gt.pgettext('app', 'Mail'));

            expect(node.find('input[name="removeDeletedPermanently"]').parent().text()).to.equal(gt('Permanently remove deleted emails'));

            expect(node.find('input[name="useFixedWidthFont"]').parent().text()).to.equal(gt('Use fixed-width font for text mails'));

            expect(node.find('input[name="appendVcard"]').parent().text()).to.equal(gt('Append vCard'));

            expect(node.find('input[name="appendMailTextOnReply"]').parent().text()).to.equal(gt('Insert the original email text to a reply'));

            expect(node.find('input[name="forwardMessageAs"]').length).to.equal(2);
            expect(node.find('input[name="forwardMessageAs"]').first().parent().text()).to.equal(gt('Inline'));
            expect(node.find('input[name="forwardMessageAs"]').last().parent().text()).to.equal(gt('Attachment'));

            expect(node.find('input[name="messageFormat"]').length).to.equal(3);
            expect(node.find('input[name="messageFormat"]:eq(0)').parent().text()).to.equal(gt('HTML'));
            expect(node.find('input[name="messageFormat"]:eq(1)').parent().text()).to.equal(gt('Plain text'));
            expect(node.find('input[name="messageFormat"]:eq(2)').parent().text()).to.equal(gt('HTML and plain text'));

            expect(node.find('select[id="defaultSendAddress"]').length).to.equal(1);

            expect(node.find('input[name="allowHtmlMessages"]').parent().text()).to.equal(gt('Allow html formatted emails'));

            expect(node.find('input[name="allowHtmlImages"]').parent().text()).to.equal(gt('Allow pre-loading of externally linked images'));

            expect(node.find('input[name="isColorQuoted"]').parent().text()).to.equal(gt('Color quoted lines'));

            expect(node.find('input[name="sendDispositionNotification"]').parent().text()).to.equal(gt('Show requests for read receipts'));
        });

    });

});
