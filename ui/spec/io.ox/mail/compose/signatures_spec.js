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
define([
    'io.ox/mail/compose/main',
    'settings!io.ox/mail',
    'fixture!io.ox/mail/compose/signatures.json'
], function (compose, settings, signatures) {
    'use strict';

    describe('Mail Compose', function () {
        var app;
        var leetSignature = signatures.current.data.filter(function (s) {
            return s.id === '1337';
        })[0];

        beforeEach(function () {
            app = compose.getApp();
            return app.launch();
        });
        afterEach(function () {
            if (app.view && app.view.model) {
                app.view.model.dirty(false);
            }
            return app.quit();
        });
        describe('signatures', function () {
            describe('in HTML mode', function () {
                beforeEach(function () {
                    this.server.respondWith('GET', /api\/snippet\?action=all/, function (xhr) {
                        xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(signatures.current));
                    });
                    settings.set('messageFormat', 'html');
                });
                afterEach(function () {
                    settings.set('defaultSignature', '');
                });
                it('should add the default signature to a new mail', function () {
                    settings.set('defaultSignature', '1337');
                    return app.compose({ folder_id: 'default0/INBOX' }).then(function () {
                        return app.view.signaturesLoading;
                    }).then(function () {
                        expect(app.view.model.get('defaultSignatureId')).to.equal('1337');
                        var $el = $('<div>').append(
                            app.view.editor.getContent()
                        ).find('p.io-ox-signature');
                        expect($el.text()).to.equal('elite signature');
                    });
                });
                it('should not add any signature if no default set', function () {
                    settings.set('defaultSignature', '');
                    return app.compose({ folder_id: 'default0/INBOX' }).then(function () {
                        expect(app.view.model.get('defaultSignatureId')).to.be.empty;
                        var $el = $('<div>').append(
                            app.view.editor.getContent()
                        ).find('p.io-ox-signature');
                        expect($el).to.have.length(0);
                    });
                });
                it('should support switching between different signatures', function () {
                    settings.set('defaultSignature', '1337');
                    return app.compose({ folder_id: 'default0/INBOX' }).then(function () {
                        expect(app.view.model.get('defaultSignatureId')).to.equal('1337');
                        var $el = $('<div>').append(
                            app.view.editor.getContent()
                        ).find('p.io-ox-signature');
                        expect($el.text()).to.equal('elite signature');
                        app.view.model.set('defaultSignatureId', '');
                        expect(app.view.model.get('defaultSignatureId')).to.be.empty;
                        $el = $('<div>').append(
                            app.view.editor.getContent()
                        ).find('p.io-ox-signature');
                        expect($el, 'number of signature paragraphs').to.have.length(0);
                    });
                });
                it('should support switching between complicated, long signatures and short ones', function () {
                    settings.set('defaultSignature', '1338');
                    return app.compose({ folder_id: 'default0/INBOX' }).then(function () {
                        expect(app.view.model.get('defaultSignatureId')).to.equal('1338');
                        var $el = $('<div>').append(
                            app.view.editor.getContent()
                        );
                        expect($el.text()).to.have.length.above(20);
                        app.view.model.set('defaultSignatureId', '1337');
                        expect(app.view.model.get('defaultSignatureId')).to.equal('1337');
                        $el = $('<div>').append(
                            app.view.editor.getContent()
                        );
                        expect($el, 'number of signature paragraphs').to.have.length(1);
                        expect($el.text()).to.equal('elite signature');
                    });
                });
            });
            describe('in plain text mode', function () {
                beforeEach(function () {
                    settings.set('messageFormat', 'text');
                });

                it('should');
            });
        });
    });
});
