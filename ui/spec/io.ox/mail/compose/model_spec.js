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
define(['io.ox/mail/compose/model',
    'settings!io.ox/mail'
], function (MailModel, settings) {
    'use strict';

    describe('Mail Compose', function () {
        describe('mail model', function () {
            describe('attachments', function () {
                it('should add nested mails as attachment', function () {
                    var model = new MailModel({
                        nested_msgs: [{
                            id: 10
                        }]
                    });
                    expect(model.get('attachments').find(function (m) {
                        return m.get('group') === 'nested';
                    }).get('id')).to.equal(10);
                });

                it('should add attached contacts as attachment', function () {
                    var model = new MailModel({
                        contacts_ids: [{
                            id: 10
                        }]
                    });
                    expect(model.get('attachments').find(function (m) {
                        return m.get('group') === 'contact';
                    }).get('id')).to.equal(10);
                });

                it('should add drive ids as attachment', function () {
                    var model = new MailModel({
                        infostore_ids: [{
                            id: 10
                        }]
                    });
                    expect(model.get('attachments').find(function (m) {
                        return m.get('group') === 'file';
                    }).get('id')).to.equal(10);
                });

            });

            describe('different content types', function () {
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

            describe('signature', function () {
                beforeEach(function () {
                    settings.set('defaultSignature', { value: 42, label: 'Default Signature' });
                    settings.set('defaultReplyForwardSignature', { value: 24, label: 'Default reply/forward signature' });
                });
                afterEach(function () {
                    //restore default values
                    settings.set('defaultSignature', false);
                    settings.set('defaultReplyForwardSignature', false);
                });
                it('should use default signature on compose', function () {
                    var model = new MailModel({
                        mode: 'compose'
                    });
                    expect(model.get('defaultSignatureId')).to.deep.equal(settings.get('defaultSignature'));
                });
                //FIXME: do we still need reply/forward signatures?
                it.skip('should use reply/forward on reply', function () {
                    var model = new MailModel({
                        mode: 'reply'
                    });
                    expect(model.get('defaultSignatureId')).to.deep.equal(settings.get('defaultReplyForwardSignature'));
                });
                it.skip('should use reply/forward on reply', function () {
                    var model = new MailModel({
                        mode: 'forward'
                    });
                    expect(model.get('defaultSignatureId')).to.deep.equal(settings.get('defaultReplyForwardSignature'));
                });
                it('should use no signature on edit', function () {
                    var model = new MailModel({
                        mode: 'edit'
                    });
                    expect(model.get('defaultSignatureId')).to.deep.equal('');
                });
            });
        });
    });
});
