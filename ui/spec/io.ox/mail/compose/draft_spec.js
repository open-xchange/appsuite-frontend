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
define(['io.ox/mail/compose/main', 'waitsFor'], function (compose, waitsFor) {
    'use strict';

    describe('Mail Compose', function () {
        describe('draft mails', function () {

            var app, clock, pictureHalo, snippetsGetAll;
            beforeEach(function () {
                return require(['io.ox/core/api/snippets', 'io.ox/contacts/api'], function (snippetAPI, contactsAPI) {
                    snippetsGetAll = sinon.stub(snippetAPI, 'getAll', function () { return $.when([]); });
                    pictureHalo = sinon.stub(contactsAPI, 'pictureHalo', _.noop);
                }).then(function () {
                    app = compose.getApp();
                    return app.launch();
                });
            });
            afterEach(function () {
                if (clock) {
                    clock.restore();
                    clock = null;
                }
                if (app.view && app.view.model) {
                    app.view.model.dirty(false);
                }
                snippetsGetAll.restore();
                pictureHalo.restore();
                return app.quit();
            });

            describe('auto save', function () {
                beforeEach(function () {
                    return require(['settings!io.ox/mail'], function (settings) {
                        settings.set('autoSaveDraftsAfter', '1_minute');
                        //load plaintext editor, much faster than spinning up tinymce all the time
                        settings.set('messageFormat', 'text');
                    }).then(function () {
                        return app.compose({ folder_id: 'default0/INBOX' });
                    });
                });
                it('should register an autosave timer', function () {
                    expect(app.view.autosave.timer).to.be.a('number');
                });
                it('should send the request after 1 minute', function () {
                    var callback = sinon.spy();

                    this.server.respondWith('PUT', /api\/mail\?action=autosave/, function (xhr) {
                        callback();
                        xhr.respond(200, 'content-type:text/javascript;', JSON.stringify({
                            data: {}
                        }));
                    });
                    clock = sinon.useFakeTimers(new Date().getTime());
                    //initialize timer (again) _after_ setting up fake timer
                    app.view.initAutoSaveAsDraft();
                    app.view.setBody('some text');
                    clock.tick(59999);
                    expect(callback.called, 'callback called').to.be.false;
                    //takes a little while for the request to be sent
                    clock.tick(100);
                    expect(callback.called, 'callback called').to.be.true;
                });
            });
            describe('manual save', function () {
                beforeEach(function () {
                    return require(['settings!io.ox/mail'], function (settings) {
                        settings.set('autoSaveDraftsAfter', 'disabled');
                        //load plaintext editor, much faster than spinning up tinymce all the time
                        settings.set('messageFormat', 'text');
                    }).then(function () {
                        return app.compose({ folder_id: 'default0/INBOX' });
                    });
                });
                afterEach(function () {
                    var api = require('io.ox/mail/api');
                    if (api.send.restore) {
                        api.send.restore();
                    }
                });
                it('should not register a timer', function () {
                    expect(app.view.autosave.timer).not.to.be.a('number');
                });
                it('should send the request on click on save button', function () {
                    var btn = app.getWindow().nodes.header.find('button[data-action="save"]').first();
                    var api = require('io.ox/mail/api');
                    var spy = sinon.spy(api, 'send');

                    expect(spy.called, 'mail API send has been called').to.be.false;
                    btn.click();
                    expect(spy.called, 'mail API send has been called').to.be.true;
                    var mail = spy.firstCall.args[0];
                    //3 - A draft edit operation. The field "msgref" must be present in order to delete previous draft message since e.g. IMAP does not support changing/replacing a message but requires a delete-and-insert sequence
                    expect(mail.sendtype).to.equal(api.SENDTYPE.EDIT_DRAFT);
                    expect(mail.msgref).not.to.exist;
                    spy.restore();
                });
                it('should ', function () {
                    this.server.respondWith('POST', /api\/mail\?action=new/, function (xhr) {
                        xhr.respond(200, 'content-type:text/javascript;', JSON.stringify({
                            data: 'default0/INBOX/Drafts/666'
                        }));
                    });
                    this.server.respondWith('GET', /api\/mail\?action=get/, function (xhr) {
                        xhr.respond(200, 'content-type:text/javascript;', JSON.stringify({
                            data: {
                                id: '666',
                                folder_id: 'default0/INBOX/Drafts',
                                msgref: 'default0/INBOX/Drafts/666',
                                attachments: [{
                                    content: ''
                                }]
                            }
                        }));
                    });
                    app.view.model.set('to', [['Testuser', 'test@example.com']]);
                    app.view.model.set('subject', 'example mail');

                    var api = require('io.ox/mail/api');
                    var spy = sinon.spy(api, 'send');

                    expect(spy.called, 'mail API send has been called').to.be.false;
                    var server = this.server;
                    var def = app.view.saveDraft().then(function () {
                        expect(spy.calledOnce, 'mail API send has been called once').to.be.true;
                        var mail = spy.firstCall.args[0];
                        //3 - A draft edit operation. The field "msgref" must be present in order to delete previous draft message since e.g. IMAP does not support changing/replacing a message but requires a delete-and-insert sequence
                        expect(mail.sendtype).to.equal(api.SENDTYPE.EDIT_DRAFT);
                        expect(mail.msgref).not.to.exist;

                        return app.view.saveDraft();
                    }).then(function () {
                        expect(spy.calledTwice, 'mail API send has been called twice').to.be.true;
                        var mail = spy.secondCall.args[0];
                        //3 - A draft edit operation. The field "msgref" must be present in order to delete previous draft message since e.g. IMAP does not support changing/replacing a message but requires a delete-and-insert sequence
                        expect(mail.sendtype).to.equal(api.SENDTYPE.EDIT_DRAFT);
                        expect(mail.msgref).to.exist;

                        return app.view.send();
                    }).then(function () {
                        expect(spy.calledThrice, 'mail API send has been called thrice').to.be.true;
                        var mail = spy.thirdCall.args[0];
                        // 4 - Transport of a draft mail. The field "msgref" must be present
                        expect(mail.sendtype).to.equal(api.SENDTYPE.DRAFT);
                        expect(mail.msgref).to.exist;
                        // app already garbage collected because of quit being called by send()
                        app = {
                            quit: $.noop
                        };
                    }).always(function (result) {
                        expect(result || {}).not.to.have.property('error');
                        spy.restore();
                    });
                    return def;
                });
            });
        });
    });
});
