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
            node.find('h1').length.should.be.equal(1);
            node.find('h1').text().should.be.equal(gt.pgettext('app', 'Mail'));

            node.find('input[name="removeDeletedPermanently"]').length.should.be.equal(1);
            node.find('input[name="removeDeletedPermanently"]').parent().text().should.be.equal(gt('Permanently remove deleted emails'));

            // node.find('input[name="contactCollectOnMailTransport"]').length.should.be.equal(1);
            // node.find('input[name="contactCollectOnMailTransport"]').parent().text().should.be.equal(gt('Automatically collect contacts in the folder "Collected addresses" while sending'));

            // node.find('input[name="contactCollectOnMailAccess"]').length.should.be.equal(1);
            // node.find('input[name="contactCollectOnMailAccess"]').parent().text().should.be.equal(gt('Automatically collect contacts in the folder "Collected addresses" while reading'));

            node.find('input[name="useFixedWidthFont"]').length.should.be.equal(1);
            node.find('input[name="useFixedWidthFont"]').parent().text().should.be.equal(gt('Use fixed-width font for text mails'));

            node.find('input[name="appendVcard"]').length.should.be.equal(1);
            node.find('input[name="appendVcard"]').parent().text().should.be.equal(gt('Append vCard'));

            node.find('input[name="appendMailTextOnReply"]').length.should.be.equal(1);
            node.find('input[name="appendMailTextOnReply"]').parent().text().should.be.equal(gt('Insert the original email text to a reply'));

            // node.find('input[name="threadView"]').length.should.be.equal(3); // depends on caps.contactCollect

            node.find('input[name="forwardMessageAs"]').length.should.be.equal(2);
            node.find('input[name="forwardMessageAs"]').first().parent().text().should.be.equal(gt('Inline'));
            node.find('input[name="forwardMessageAs"]').last().parent().text().should.be.equal(gt('Attachment'));

            node.find('input[name="messageFormat"]').length.should.be.equal(3);
            node.find('input[name="messageFormat"]:eq(0)').parent().text().should.be.equal(gt('HTML'));
            node.find('input[name="messageFormat"]:eq(1)').parent().text().should.be.equal(gt('Plain text'));
            node.find('input[name="messageFormat"]:eq(2)').parent().text().should.be.equal(gt('HTML and plain text'));

            node.find('input[type="text"]').length.should.be.equal(1);
            node.find('input[type="text"]').closest('.form-group').find('label').text().should.be.equal(gt('Automatically wrap plain text after character:'));

            node.find('select[id="defaultSendAddress"]').length.should.be.equal(1);

            node.find('select[id="autoSaveDraftsAfter"]').length.should.be.equal(1);
            node.find('select[id="autoSaveDraftsAfter"]').children().length.should.be.equal(5);

            node.find('input[name="allowHtmlMessages"]').length.should.be.equal(1);
            node.find('input[name="allowHtmlMessages"]').parent().text().should.be.equal(gt('Allow html formatted emails'));

            node.find('input[name="allowHtmlImages"]').length.should.be.equal(1);
            node.find('input[name="allowHtmlImages"]').parent().text().should.be.equal(gt('Allow pre-loading of externally linked images'));

            // emoticons depends on capabilities.has('emoji')
            node.find('input[name="isColorQuoted"]').length.should.be.equal(1);
            node.find('input[name="isColorQuoted"]').parent().text().should.be.equal(gt('Color quoted lines'));

            node.find('input[name="sendDispositionNotification"]').length.should.be.equal(1);
            node.find('input[name="sendDispositionNotification"]').parent().text().should.be.equal(gt('Show requests for read receipts'));

        });

    });

});
