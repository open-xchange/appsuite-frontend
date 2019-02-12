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
    'io.ox/core/extensions',
    'io.ox/mail/compose/config',
    'settings!io.ox/mail',
    'io.ox/mail/compose/main'
], function (ext, ConfigModel, settings) {
    'use strict';

    describe('Mail Compose', function () {
        describe('signatures', function () {

            var signatureController = ext.point('io.ox/mail/compose/boot').get('initial-signature').perform;

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
                var model = new ConfigModel({
                    mode: 'compose'
                });
                return signatureController.call({ view: { signaturesLoading: $.when() }, config: model }).then(function () {
                    expect(model.get('signatureId')).to.deep.equal(settings.get('defaultSignature'));
                });
            });
            it('should use reply/forward on reply', function () {
                var model = new ConfigModel({
                    type: 'reply'
                });
                return signatureController.call({ view: { signaturesLoading: $.when() }, config: model }).then(function () {
                    expect(model.get('signatureId')).to.deep.equal(settings.get('defaultReplyForwardSignature'));
                });
            });
            it('should use reply/forward on reply', function () {
                var model = new ConfigModel({
                    type: 'forward'
                });
                return signatureController.call({ view: { signaturesLoading: $.when() }, config: model }).then(function () {
                    expect(model.get('signatureId')).to.deep.equal(settings.get('defaultReplyForwardSignature'));
                });
            });
            it('should use no signature on edit', function () {
                var model = new ConfigModel({
                    type: 'edit'
                });
                return signatureController.call({ view: { signaturesLoading: $.when() }, config: model }).then(function () {
                    expect(model.get('signatureId')).to.deep.equal('');
                });
            });
        });
    });
});
