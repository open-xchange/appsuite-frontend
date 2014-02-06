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
 define(['io.ox/core/extensions',
        'gettext!io.ox/mail',
        'io.ox/mail/settings/pane'
        ], function (ext, gt) {


	describe('mailsettings', function () {
        beforeEach(function () {
            
            $('body', document).append(this.node = $('<div id="mailsettingsNode">'));
            ext.point('io.ox/mail/settings/detail').invoke('draw', this.node);

        });

        afterEach(function () {
            $('#mailsettingsNode', document).remove();
        });

        it('should draw the form', function () {
            this.node.find('h1').length.should.be.equal(1);
            this.node.find('h1').text().should.be.equal(gt.pgettext('app', 'Mail'));

            this.node.find('input[name="removeDeletedPermanently"]').length.should.be.equal(1);
            this.node.find('input[name="removeDeletedPermanently"]').parent().text().should.be.equal(gt('Permanently remove deleted emails'));

            this.node.find('input[name="contactCollectOnMailTransport"]').length.should.be.equal(1);
            this.node.find('input[name="contactCollectOnMailTransport"]').parent().text().should.be.equal(gt('Automatically collect contacts in the folder "Collected addresses" while sending'));
            
            this.node.find('input[name="contactCollectOnMailAccess"]').length.should.be.equal(1);
            this.node.find('input[name="contactCollectOnMailAccess"]').parent().text(gt('Automatically collect contacts in the folder "Collected addresses" while reading'));

            this.node.find('input[name="useFixedWidthFont"]').length.should.be.equal(1);
            this.node.find('input[name="useFixedWidthFont"]').parent().text(gt('Use fixed-width font for text mails'));

            this.node.find('input[name="appendVcard"]').length.should.be.equal(1);
            this.node.find('input[name="appendVcard"]').parent().text(gt('Append vCard'));
            
            this.node.find('input[name="appendMailTextOnReply"]').length.should.be.equal(1);
            this.node.find('input[name="appendMailTextOnReply"]').parent().text(gt('Insert the original email text to a reply'));
            
            // this.node.find('input[name="threadView"]').length.should.be.equal(3); // depends on caps.contactCollect

            this.node.find('input[name="forwardMessageAs"]').length.should.be.equal(2);
            this.node.find('input[name="forwardMessageAs"]').first().parent().text().should.be.equal(gt('Inline'));
            this.node.find('input[name="forwardMessageAs"]').last().parent().text().should.be.equal(gt('Attachment'));

            this.node.find('input[name="messageFormat"]').length.should.be.equal(3);
            this.node.find('input[name="messageFormat"]:eq(1)').parent().text(gt('HTML'));
            this.node.find('input[name="messageFormat"]:eq(2)').parent().text(gt('Plain text'));
            this.node.find('input[name="messageFormat"]:eq(3)').parent().text(gt('HTML and plain text'));

            this.node.find('input[type="text"]').length.should.be.equal(1);
            this.node.find('input[type="text"]').prev().text().should.be.equal(gt('Line wrap when sending text mails after '));
            this.node.find('input[type="text"]').next().text().should.be.equal(gt(' characters'));

            this.node.find('select[id="defaultSendAddress"]').length.should.be.equal(1);

            this.node.find('select[id="autoSaveDraftsAfter"]').length.should.be.equal(1);
            this.node.find('select[id="autoSaveDraftsAfter"]').children().length.should.be.equal(5);

            this.node.find('input[name="allowHtmlMessages"]').length.should.be.equal(1);
            this.node.find('input[name="allowHtmlMessages"]').parent().text(gt('Allow html formatted emails'));

            this.node.find('input[name="allowHtmlImages"]').length.should.be.equal(1);
            this.node.find('input[name="allowHtmlImages"]').parent().text(gt('Allow pre-loading of externally linked images'));

            // emoticons depends on capabilities.has('emoji')
            this.node.find('input[name="isColorQuoted"]').length.should.be.equal(1);
            this.node.find('input[name="isColorQuoted"]').parent().text(gt('Color quoted lines'));

            this.node.find('input[name="sendDispositionNotification"]').length.should.be.equal(1);
            this.node.find('input[name="sendDispositionNotification"]').parent().text(gt('Ask for delivery receipt'));

        });

    });

});
