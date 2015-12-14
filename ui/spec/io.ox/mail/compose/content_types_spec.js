/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */
define(['io.ox/mail/compose/model'], function (MailModel) {
    'use strict';

    describe('Mail Compose', function () {
        describe.skip('different content types', function () {
            it('switching text -> html', function () {
                var model = new MailModel({
                    editorMode: 'text'
                });
                model.setContent('This is some plain text\n\n with line breaks and stuff.');
                expect(model.get('attachments').at(0).get('content_type')).to.equal('text/plain');
                //TODO: bad API? 'text' is not a content type. text/html is, or rename method to 'editorMode' or so
                model.setMailContentType('html');
                expect(model.getContent()).to.equal('This is some plain text\n\n with line breaks and stuff.');
                expect(model.get('attachments').at(0).get('content')).to.equal('This is some plain text\n\n with line breaks and stuff.');
                expect(model.get('attachments').at(0).get('content_type')).to.equal('text/html');
            });
            it('switching html -> text', function () {
                var model = new MailModel({
                    editorMode: 'html'
                });
                model.setContent('This is some <i>html</i> <b>text</b><br /><br> with line breaks and stuff.');
                expect(model.get('attachments').at(0).get('content_type')).to.equal('text/html');
                //TODO: bad API? 'text' is not a content type. text/plain is, or rename method to 'editorMode' or so
                model.setMailContentType('text');
                //FIXME: should not this be text/plain?
                expect(model.get('attachments').at(0).get('content_type')).to.equal('text/plain');
                expect(model.get('attachments').at(0).get('content')).to.equal('This is some <i>html</i> <b>text</b><br /><br> with line breaks and stuff.');
                expect(model.getContent()).to.equal('This is some <i>html</i> <b>text</b><br /><br> with line breaks and stuff.');
            });
        });
    });
});
