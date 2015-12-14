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
define(['io.ox/mail/compose/main', 'settings!io.ox/mail'], function (compose, settings) {
    'use strict';

    describe('Mail Compose', function () {
        var app;
        beforeEach(function () {
            this.server.respondWith('GET', /api\/halo\/contact\/picture/, function (xhr) {
                xhr.respond(200, 'image/gif', '');
            });
            app = compose.getApp();
            return app.launch();
        });
        afterEach(function () {
            if (app.view && app.view.model) {
                app.view.model.dirty(false);
            }
            return app.quit();
        });
        describe.skip('forward a message', function () {
            beforeEach(function () {
                this.server.respondWith('PUT', /api\/mail\?action=forward/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify({
                        data: {
                            attachment: true,
                            attachments: [{
                                id: '1',
                                disp: 'inline',
                                content_type: 'text/plain',
                                content: 'Forwarded message:'
                            }],
                            csid: '627.1422879895931',
                            msgref: 'default0/INBOX/666',
                            subject: 'FWD: some testmessage'
                        }
                    }));
                });
                this.server.respondWith('POST', /api\/mail\?action=new/, function (xhr) {
                    xhr.respond(200, 'content-type:text/javascript;', JSON.stringify({
                        data: 'default0/INBOX/666'
                    }));
                });
                return app.forward({ id: '666', folder: 'default0/INBOX' });
            });
            it('should send the message with sendtype 2', function () {
                var api = require('io.ox/mail/api');
                var spy = sinon.spy(api, 'send');

                app.view.model.set('to', [['Test', 'test@example.com']]);

                return app.view.send().then(function () {
                    expect(spy.calledOnce, 'mailAPI::send called once').to.be.true;
                    // app already garbage collected because of quit being called by send()
                    app = {
                        quit: $.noop
                    };

                    var mail = spy.firstCall.args[0];
                    expect(mail.sendtype).to.equal(api.SENDTYPE.FORWARD);
                    expect(mail.msgref).to.equal('default0/INBOX/666');
                    spy.restore();
                });
            });

            it('should switch to sendtype 3 when autosave is triggered', function () {
                settings.set('autoSaveDraftsAfter', '1_minute');
                var callback = sinon.spy();
                var api = require('io.ox/mail/api');
                //don't fetch contact pictures
                var contactAPI = require('io.ox/contacts/api');
                var haloSpy = sinon.stub(contactAPI, 'pictureHalo', _.noop);

                expect(app.view.model.get('sendtype')).to.equal(api.SENDTYPE.FORWARD);
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
                //takes a little while for the request to be sent
                clock.tick(100);
                expect(callback.calledOnce, 'callback called').to.be.true;
                var mail = JSON.parse(callback.firstCall.args[0]);
                expect(mail.sendtype).to.equal(api.SENDTYPE.EDIT_DRAFT);
                expect(mail.msgref).not.to.exist;

                clock.tick(60000);
                expect(callback.calledTwice, 'callback called').to.be.true;
                mail = JSON.parse(callback.secondCall.args[0]);
                expect(mail.sendtype).to.equal(api.SENDTYPE.EDIT_DRAFT);
                expect(mail.msgref).to.equal('default0/INBOX/Drafts/666');

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
                    spy.restore();
                    haloSpy.restore();
                    settings.set('autoSaveDraftsAfter', 'disabled');
                });
            });
        });
    });
});
