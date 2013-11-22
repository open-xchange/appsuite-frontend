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
    var view = main.getApp().getView(),
        expect = chai.expect;

    describe('mail write view', function () {

        describe('define some methods to manipulate DOM', function () {
            it('for general purposes', function () {
                expect(view.initialize).to.be.a('function');
                expect(view.focusSection).to.be.a('function');
                expect(view.createSection).to.be.a('function');
                expect(view.addSection).to.be.a('function');
                expect(view.showSection).to.be.a('function');
                expect(view.hideSection).to.be.a('function');
                expect(view.createLink).to.be.a('function');
                expect(view.addLink).to.be.a('function');
                expect(view.createField).to.be.a('function');
                expect(view.createSenderField).to.be.a('function');
                expect(view.createReplyToField).to.be.a('function');
                expect(view.createRecipientList).to.be.a('function');
                expect(view.addRecipients).to.be.a('function');
                expect(view.render).to.be.a('function');
            });
            it('for emoji', function () {
                expect(view.onInsertEmoji).to.be.a('function');
                expect(view.scrollEmoji).to.be.a('function');
                expect(view.showEmojiPalette).to.be.a('function');
            });
        });
    });
});
