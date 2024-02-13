/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define([
    'io.ox/mail/compose/main',
    'settings!io.ox/mail',
    'fixture!io.ox/mail/compose/signatures.json'
], function (compose, settings, signatures) {
    'use strict';

    describe('Mail Compose', function () {
        var app, pictureHalo, getValidAddress;

        var editors = {
                text: 'io.ox/core/tk/text-editor',
                html: 'io.ox/core/tk/contenteditable-editor'
            },
            pluginStub;

        beforeEach(function () {
            pluginStub = sinon.stub(ox.manifests, 'loadPluginsFor', function (namespace) {
                namespace = namespace.replace(/^io.ox\/mail\/compose\/editor\//, '');
                return require([editors[namespace]]);
            });
        });
        afterEach(function () {
            pluginStub.restore();
        });

        beforeEach(function () {
            return require([
                'io.ox/contacts/api',
                'io.ox/core/api/account'
            ], function (contactsAPI, accountAPI) {
                pictureHalo = sinon.stub(contactsAPI, 'pictureHalo', _.noop);
                getValidAddress = sinon.stub(accountAPI, 'getValidAddress', function (d) { return $.when(d); });
            }).then(function () {
                app = compose.getApp();
                return app.launch();
            });
        });
        afterEach(function () {
            if (app.view && app.view.model) {
                app.view.model.dirty(false);
            }
            pictureHalo.restore();
            getValidAddress.restore();
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
