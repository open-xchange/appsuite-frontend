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

            this.node.find('input[data-property="removeDeletedPermanently"]').length.should.be.equal(1);
            this.node.find('input[data-property="contactCollectOnMailTransport"]').length.should.be.equal(1);
            this.node.find('input[data-property="contactCollectOnMailAccess"]').length.should.be.equal(1);
            this.node.find('input[data-property="useFixedWidthFont"]').length.should.be.equal(1);
            this.node.find('input[data-property="appendVcard"]').length.should.be.equal(1);
            this.node.find('input[data-property="appendMailTextOnReply"]').length.should.be.equal(1);

            // this.node.find('input[name="threadView"]').length.should.be.equal(3); // depends on caps.contactCollect

            this.node.find('input[name="forwardMessageAs"]').length.should.be.equal(2);
            this.node.find('input[name="forwardMessageAs"]').first().parent().text().should.be.equal(gt('Inline'));
            this.node.find('input[name="forwardMessageAs"]').last().parent().text().should.be.equal(gt('Attachment'));

            this.node.find('input[name="messageFormat"]').length.should.be.equal(3);

            this.node.find('input[type="text"]').length.should.be.equal(1);

            this.node.find('select[id="defaultSendAddress"]').length.should.be.equal(1);

            this.node.find('select[id="autoSaveDraftsAfter"]').length.should.be.equal(1);

            this.node.find('input[data-property="allowHtmlMessages"]').length.should.be.equal(1);
            this.node.find('input[data-property="allowHtmlImages"]').length.should.be.equal(1);
            // emoticons depends on capabilities.has('emoji')
            this.node.find('input[data-property="isColorQuoted"]').length.should.be.equal(1);
            this.node.find('input[data-property="sendDispositionNotification"]').length.should.be.equal(1);

        });

    });

});
