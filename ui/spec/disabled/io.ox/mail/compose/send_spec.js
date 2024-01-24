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

define(['io.ox/mail/compose/main', 'waitsFor'], function (compose, waitsFor) {
    'use strict';

    describe('Mail Compose', function () {
        describe.skip('sending a message', function () {

            var app, pictureHalo, snippetsGetAll, getValidAddress;

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
                    'io.ox/core/api/snippets',
                    'io.ox/contacts/api',
                    'io.ox/core/api/account',
                    'settings!io.ox/mail'
                ], function (snippetAPI, contactsAPI, accountAPI, settings) {
                    snippetsGetAll = sinon.stub(snippetAPI, 'getAll', function () { return $.when([]); });
                    pictureHalo = sinon.stub(contactsAPI, 'pictureHalo', _.noop);
                    getValidAddress = sinon.stub(accountAPI, 'getValidAddress', function (d) { return $.when(d); });
                    //load plaintext editor, much faster than spinning up tinymce all the time
                    settings.set('messageFormat', 'text');
                }).then(function () {
                    app = compose.getApp();
                    return app.launch().then(function () {
                        return app.compose({ folder_id: 'default0/INBOX' });
                    });
                });
            });
            afterEach(function () {
                if (app.view && app.view.model) {
                    app.view.model.dirty(false);
                }
                snippetsGetAll.restore();
                pictureHalo.restore();
                getValidAddress.restore();
                return app.quit();
            });

            it('should use sendtype 0', function () {
                app.view.model.set('to', [['', 'test@example.com']]);
                app.view.model.set('subject', 'some subject');

                var btn = app.getWindow().nodes.header.find('button[data-action="send"]').first();
                var api = require('io.ox/mail/api');
                var spy = sinon.spy(api, 'send');

                expect(spy.called, 'mail API send has been called').to.be.false;
                btn.click();
                expect(spy.called, 'mail API send has been called').to.be.true;
                var mail = spy.firstCall.args[0];
                expect(mail.sendtype).to.equal(0);
                expect(mail.subject).to.equal('some subject');
                spy.restore();
            });

            it('should warn if mail has no subject', function () {
                app.view.model.set('to', [['', 'test@example.com']]);
                var btn = app.getWindow().nodes.header.find('button[data-action="send"]').first();
                var api = require('io.ox/mail/api');
                var spy = sinon.spy(api, 'send');

                expect(spy.called, 'mail API send has been called').to.be.false;
                btn.click();
                expect(spy.called, 'mail API send has been called').to.be.false;
                return waitsFor(function () {
                    return $('.modal-dialog').is(':visible');
                }).then(function () {
                    expect($('.modal-dialog').find('button[data-action="send"]'), 'number of buttons with action send').to.have.length(1);
                    expect($('.modal-dialog').find('button[data-action="cancel"]'), 'number of buttons with action cancel').to.have.length(1);
                    spy.restore();
                });
            });
        });
    });
});
