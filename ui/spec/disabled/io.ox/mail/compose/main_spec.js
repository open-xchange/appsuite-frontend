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

        describe('main app', function () {

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
                    return app.launch();
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

            it('should open up a new mail compose window', function () {
                return app.compose().then(function () {
                    expect(app.get('state')).to.equal('running');
                    expect(app.view.$el.is(':visible'), 'view element is visible').to.be.true;
                    expect(_.url.hash('app')).to.equal('io.ox/mail/compose:compose');
                });
            });

            it('should provide an edit window', function () {
                this.server.respondWith('PUT', /api\/mail\?action=get/, function (xhr) {
                    xhr.respond(200, 'content-type:text/javascript;', JSON.stringify({
                        data: {}
                    }));
                });
                return app.edit().then(function () {
                    expect(app.get('state')).to.equal('running');
                    expect(app.view.$el.is(':visible'), 'view element is visible').to.be.true;
                    expect(_.url.hash('app')).to.equal('io.ox/mail/compose:edit');
                });
            });

            it('should provide a reply window', function () {
                this.server.respondWith('PUT', /api\/mail\?action=reply/, function (xhr) {
                    xhr.respond(200, 'content-type:text/javascript;', JSON.stringify({
                        data: {}
                    }));
                });
                return app.reply({ folder: 'default0/INBOX' }).then(function () {
                    expect(app.get('state')).to.equal('running');
                    expect(app.view.$el.is(':visible'), 'view element is visible').to.be.true;
                    expect(_.url.hash('app')).to.equal('io.ox/mail/compose:reply');
                });
            });

            describe('model change events', function () {
                var address = 'testuser@open-xchange.com',
                    addressEntry = [[address, address]];

                beforeEach(function () {
                    return app.compose();
                });
                it('should add recipients to "to" tokenfield', function () {
                    app.view.model.set('to', addressEntry);
                    expect(app.view.$el.find('.tokenfield.to .token').attr('title')).to.equal(address);
                });
                it('should add recipients to "cc" tokenfield', function () {
                    app.view.model.set('cc', addressEntry);
                    expect(app.view.$el.find('.tokenfield.cc .token').attr('title')).to.equal(address);
                });
                it('should add recipients to "bcc" tokenfield', function () {
                    app.view.model.set('bcc', addressEntry);
                    expect(app.view.$el.find('.tokenfield.bcc .token').attr('title')).to.equal(address);
                });
                it('should add text to subject', function () {
                    app.view.model.set('subject', 'Test subject');
                    expect(app.view.$el.find('.subject input').val()).to.equal('Test subject');
                });
                it('should set priority to high', function () {
                    app.view.model.set('priority', 0);
                    expect(app.view.$el.find('a[data-name="priority"][data-value="0"] i').hasClass('fa-check'), ' option is checked in menu options').to.be.true;
                });
                it('should set priority to normal', function () {
                    app.view.model.set('priority', 3);
                    expect(app.view.$el.find('a[data-name="priority"][data-value="3"] i').hasClass('fa-check'), ' option is checked in menu options').to.be.true;
                });
                it('should set priority to low', function () {
                    app.view.model.set('priority', 5);
                    expect(app.view.$el.find('a[data-name="priority"][data-value="5"] i').hasClass('fa-check'), ' option is checked in menu options').to.be.true;
                });
                it('should set request read receipt', function () {
                    app.view.model.set('disp_notification_to', true);
                    expect(app.view.$el.find('a[data-name="disp_notification_to"] i').hasClass('fa-check'), ' option is checked in menu options').to.be.true;
                });
                it('should set attach vcard', function () {
                    app.view.model.set('vcard', true);
                    expect(app.view.$el.find('a[data-name="vcard"] i').hasClass('fa-check'), ' option is checked in menu options').to.be.true;
                });
                it('should set attach vcard', function () {
                    app.view.model.set('vcard', false);
                    expect(app.view.$el.find('a[data-name="vcard"] i').hasClass('fa-check'), ' option is unchecked in menu options').to.be.false;
                });
                it('should change editor mode from text to html', function () {
                    app.view.config.set('editorMode', 'html');
                    return waitsFor(function () {
                        //need to wait, until it is painted, because we started in text mode (.editor is not busy any longer)
                        return app.view.$el.find('.editable.mce-content-body').is(':visible') && app.view.$el.find('.editor:not(.io-ox-busy)').length === 1;
                    }).done(function () {
                        expect(app.view.$el.find('textarea.plain-text').is(':visible'), 'plain text editor is visible').to.be.false;
                        expect(app.view.$el.find('.editable.mce-content-body').is(':visible'), 'tinymce contenteditable editor element is visible').to.be.true;
                    });
                });
                it('should change editor mode from html to text', function () {
                    app.view.config.set('editorMode', 'text');
                    return waitsFor(function () {
                        return app.view.$el.find('textarea.plain-text').is(':visible') && app.view.$el.find('.editor:not(.io-ox-busy)').length === 1;
                    }).then(function () {
                        expect(app.view.$el.find('textarea.plain-text').is(':visible'), 'plain text editor is visible').to.be.true;
                        expect(app.view.$el.find('.editable.mce-content-body').is(':visible'), 'tinymce contenteditable editor element is visible').to.be.false;
                    });
                });
                it('should change editor mode from text to html', function () {
                    app.view.config.set('editorMode', 'html');
                    return waitsFor(function () {
                        return app.view.$el.find('.editable.mce-content-body').is(':visible') && app.view.$el.find('.editor:not(.io-ox-busy)').length === 1;
                    }).then(function () {
                        expect(app.view.$el.find('textarea.plain-text').is(':visible'), 'plain text editor is visible').to.be.false;
                        expect(app.view.$el.find('.editable.mce-content-body').is(':visible'), 'tinymce contenteditable editor element is visible').to.be.true;
                    });
                });

            });
        });
    });
});
