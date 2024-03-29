/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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
    'settings!io.ox/mail'
], function (compose, settings) {
    'use strict';

    describe('Mail Compose', function () {

        describe('reply to', function () {
            var testMessage = {
                attachment: true,
                attachments: [{
                    id: '1',
                    disp: 'inline',
                    content_type: 'text/plain',
                    content: 'Some day in a galaxy far away somebody wrote:'
                }],
                csid: '627.1422879895931',
                msgref: 'default0/INBOX/666',
                subject: 'RE: some testmessage',
                to: [['George', 'gl@example.com']]
            };

            beforeEach(function () {
                this.server.respondWith('POST', /api\/mail\?action=new/, function (xhr) {
                    xhr.respond(200, 'content-type:text/javascript;', JSON.stringify({
                        data: 'default0/INBOX/666'
                    }));
                });
            });

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

            describe('a message', function () {
                beforeEach(function () {
                    this.server.respondWith('PUT', /api\/mail\?action=reply/, function (xhr) {
                        xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify({
                            data: testMessage
                        }));
                    });

                    return app.reply({ id: '666', folder: 'default0/INBOX' });
                });
                it('should send the message with sendtype 1', function () {
                    var api = require('io.ox/mail/api');
                    var spy = sinon.spy(api, 'send');

                    return app.view.send().then(function () {
                        expect(spy.calledOnce, 'mailAPI::send called once').to.be.true;
                        // app already garbage collected because of quit being called by send()
                        app = {
                            quit: $.noop
                        };

                        var mail = spy.firstCall.args[0];
                        expect(mail.sendtype).to.equal(api.SENDTYPE.REPLY);
                        expect(mail.msgref).to.equal('default0/INBOX/666');
                        expect(mail.flags & api.FLAGS.DRAFT, 'DRAFT flag not set').to.equal(0);

                        spy.restore();
                    });
                });

                it('should switch to sendtype 3 when autosave is triggered', function () {
                    settings.set('autoSaveDraftsAfter', '1_minute');
                    var callback = sinon.spy();
                    var api = require('io.ox/mail/api');

                    expect(app.view.model.get('sendtype')).to.equal(api.SENDTYPE.REPLY);
                    expect(app.view.model.get('msgref')).to.exist;
                    expect(app.view.model.get('msgref')).to.equal('default0/INBOX/666');

                    this.server.respondWith('PUT', /api\/mail\?action=autosave/, function (xhr) {
                        callback(xhr.requestBody);
                        xhr.respond(200, 'content-type:text/javascript;', JSON.stringify({
                            data: 'default0/INBOX/Drafts/666'
                        }));
                    });
                    var clock = sinon.useFakeTimers(new Date().getTime());
                    //manually initialise auto save, because app is already running and fake-timer
                    //needs to be setup
                    app.view.initAutoSaveAsDraft();
                    //change the mail, so the model is dirty
                    app.view.model.dirty(true);
                    clock.tick(59999);
                    expect(callback.called, 'callback called').to.be.false;
                    // touch the model
                    app.model.dirty(true);
                    //takes a little while for the request to be sent
                    clock.tick(100);
                    expect(callback.calledOnce, 'callback called once').to.be.true;
                    var mail = JSON.parse(callback.firstCall.args[0]);
                    expect(mail.sendtype).to.equal(api.SENDTYPE.REPLY);
                    expect(mail.msgref).to.exist;
                    expect(mail.msgref).to.equal('default0/INBOX/666');
                    expect(mail.flags & api.FLAGS.DRAFT, 'DRAFT flag set').to.equal(api.FLAGS.DRAFT);

                    // touch the model
                    app.model.dirty(true);
                    clock.tick(60000);
                    expect(callback.calledTwice, 'callback called twice').to.be.true;
                    mail = JSON.parse(callback.secondCall.args[0]);
                    expect(mail.sendtype).to.equal(api.SENDTYPE.EDIT_DRAFT);
                    expect(mail.msgref).to.equal('default0/INBOX/Drafts/666');
                    expect(mail.flags & api.FLAGS.DRAFT, 'DRAFT flag set').to.equal(api.FLAGS.DRAFT);

                    clock.restore();

                    var spy = sinon.spy(api, 'send');

                    return app.view.send().then(function () {
                        expect(spy.calledOnce, 'mailAPI::send called once').to.be.true;
                        // app already garbage collected because of quit being called by send()
                        app = {
                            quit: $.noop
                        };

                        var mail = spy.firstCall.args[0];
                        expect(mail.sendtype).to.equal(api.SENDTYPE.DRAFT);
                        expect(mail.msgref).to.equal('default0/INBOX/Drafts/666');
                        expect(mail.flags & api.FLAGS.DRAFT, 'DRAFT flag not set').to.equal(0);
                        spy.restore();
                        settings.set('autoSaveDraftsAfter', 'disabled');
                    });
                });
            });
            describe('all participants of a message', function () {
                beforeEach(function () {
                    this.server.respondWith('PUT', /api\/mail\?action=reply/, function (xhr) {
                        xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify({
                            data: _.extend({
                                to: [['George', 'gl@example.com'], ['Darth', 'dv@example.com']],
                                cc: [['Lea', 'lea@example.com']]
                            }, testMessage)
                        }));
                    });
                    return app.reply({ id: '666', folder: 'default0/INBOX' });
                });
                it('should send the message with sendtype 1', function () {
                    var api = require('io.ox/mail/api');
                    var spy = sinon.spy(api, 'send');

                    return app.view.send().then(function () {
                        expect(spy.calledOnce, 'mailAPI::send called once').to.be.true;
                        // app already garbage collected because of quit being called by send()
                        app = {
                            quit: $.noop
                        };

                        var mail = spy.firstCall.args[0];
                        expect(mail.sendtype).to.equal(api.SENDTYPE.REPLY);
                        expect(mail.msgref).to.equal('default0/INBOX/666');
                        expect(mail.flags & api.FLAGS.DRAFT, 'DRAFT flag not set').to.equal(0);
                        spy.restore();
                    });
                });

                it('should switch to sendtype 3 when autosave is triggered', function () {
                    settings.set('autoSaveDraftsAfter', '1_minute');
                    var callback = sinon.spy();
                    var api = require('io.ox/mail/api');

                    expect(app.view.model.get('sendtype')).to.equal(api.SENDTYPE.REPLY);
                    expect(app.view.model.get('msgref')).to.exist;
                    expect(app.view.model.get('msgref')).to.equal('default0/INBOX/666');

                    this.server.respondWith('PUT', /api\/mail\?action=autosave/, function (xhr) {
                        callback(xhr.requestBody);
                        xhr.respond(200, 'content-type:text/javascript;', JSON.stringify({
                            data: 'default0/INBOX/Drafts/666'
                        }));
                    });
                    var clock = sinon.useFakeTimers(new Date().getTime());
                    //manually initialise auto save, because app is already running and fake-timer
                    //needs to be setup
                    app.view.initAutoSaveAsDraft();
                    //change the mail, so the model is dirty
                    app.view.model.set('to', [['Test', 'test@example.com']]);
                    clock.tick(59999);
                    expect(callback.called, 'callback called').to.be.false;
                    // touch the model
                    app.model.dirty(true);
                    //takes a little while for the request to be sent
                    clock.tick(100);
                    expect(callback.calledOnce, 'callback called').to.be.true;
                    var mail = JSON.parse(callback.firstCall.args[0]);
                    expect(mail.sendtype).to.equal(api.SENDTYPE.REPLY);
                    expect(mail.msgref).to.exist;
                    expect(mail.flags & api.FLAGS.DRAFT, 'DRAFT flag set').to.equal(api.FLAGS.DRAFT);

                    // touch the model
                    app.model.dirty(true);
                    clock.tick(60000);
                    expect(callback.calledTwice, 'callback called').to.be.true;
                    mail = JSON.parse(callback.secondCall.args[0]);
                    expect(mail.sendtype).to.equal(api.SENDTYPE.EDIT_DRAFT);
                    expect(mail.msgref).to.equal('default0/INBOX/Drafts/666');
                    expect(mail.flags & api.FLAGS.DRAFT, 'DRAFT flag set').to.equal(api.FLAGS.DRAFT);

                    clock.restore();

                    var spy = sinon.spy(api, 'send');

                    return app.view.send().then(function () {
                        expect(spy.calledOnce, 'mailAPI::send called once').to.be.true;
                        // app already garbage collected because of quit being called by send()
                        app = {
                            quit: $.noop
                        };

                        var mail = spy.firstCall.args[0];
                        expect(mail.sendtype).to.equal(api.SENDTYPE.DRAFT);
                        expect(mail.msgref).to.equal('default0/INBOX/Drafts/666');
                        expect(mail.flags & api.FLAGS.DRAFT, 'DRAFT flag not set').to.equal(0);
                        spy.restore();
                        settings.set('autoSaveDraftsAfter', 'disabled');
                    });
                });
            });
        });
    });
});
