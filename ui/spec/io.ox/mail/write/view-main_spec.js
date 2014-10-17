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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */
define(['io.ox/mail/write/main'], function (main) {
    var view = main.getApp().getView();

    describe('mail write view', function () {

        describe('define some methods to manipulate DOM', function () {
            it('for general purposes', function () {
                expect(view.initialize, 'initialize').to.be.a('function');
                expect(view.createSection, 'createSection').to.be.a('function');
                expect(view.addSection, 'addSection').to.be.a('function');
                expect(view.showSection, 'showSection').to.be.a('function');
                expect(view.hideSection, 'hideSection').to.be.a('function');
                expect(view.createLink, 'createLink').to.be.a('function');
                expect(view.createField, 'createField').to.be.a('function');
                expect(view.createSenderField, 'createSenderField').to.be.a('function');
                expect(view.createReplyToField, 'createReplyToField').to.be.a('function');
                expect(view.createRecipientList, 'createRecipientList').to.be.a('function');
                expect(view.addRecipients, 'addRecipients').to.be.a('function');
                expect(view.render, 'render').to.be.a('function');
            });
            it('for emoji', function () {
                expect(view.onInsertEmoji).to.be.a('function');
                expect(view.scrollEmoji).to.be.a('function');
                expect(view.showEmojiPalette).to.be.a('function');
            });
        });
    });
});
