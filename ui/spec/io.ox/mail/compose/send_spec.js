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
        var app;
        describe('sending a message', function () {
            beforeEach(function () {
                this.server.respondWith('GET', /api\/halo\/contact\/picture/, function (xhr) {
                    xhr.respond(200, 'image/gif', '');
                });
                app = compose.getApp();
                return app.launch().then(function () {
                    return app.compose({ folder_id: 'default0/INBOX' });
                });
            });
            afterEach(function () {
                if (app.view && app.view.model) {
                    app.view.model.dirty(false);
                }
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
                expect(mail.sendtype).to.equal('0');
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
                    return $('.io-ox-dialog-popup').is(':visible');
                }).then(function () {
                    expect($('.io-ox-dialog-popup').find('button[data-action="send"]'), 'number of buttons with action send').to.have.length(1);
                    expect($('.io-ox-dialog-popup').find('button[data-action="subject"]'), 'number of buttons with action subject').to.have.length(1);
                    spy.restore();
                });
            });
        });
    });
});
