/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */
define([
    'io.ox/mail/compose/model',
    'settings!io.ox/mail'
], function (MailModel, settings) {
    'use strict';

    describe('Mail Compose', function () {
        describe('signatures', function () {
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
            it.skip('should use no signature on edit', function () {
                var model = new MailModel({
                    mode: 'edit'
                });
                expect(model.get('defaultSignatureId')).to.deep.equal('');
            });
        });
    });
});
