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
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
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

            expect(node.find('select[id="autoSaveDraftsAfter"]').children().length).to.equal(5);

            expect(node.find('input[name="allowHtmlMessages"]').parent().text()).to.equal(gt('Allow html formatted emails'));

            expect(node.find('input[name="allowHtmlImages"]').parent().text()).to.equal(gt('Allow pre-loading of externally linked images'));

            expect(node.find('input[name="isColorQuoted"]').parent().text()).to.equal(gt('Color quoted lines'));

            expect(node.find('input[name="sendDispositionNotification"]').parent().text()).to.equal(gt('Show requests for read receipts'));
        });

    });

});
