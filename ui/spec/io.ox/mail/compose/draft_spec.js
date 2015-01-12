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
            var app, clock;
            beforeEach(function () {
                app = compose.getApp();
                return app.launch();
            });
            afterEach(function () {
                if (clock) {
                    clock.restore();
                    clock = null;
                }
                if (app.view && app.view.model) {
                    app.view.model.dirty(false);
                }
                return app.quit();
            });
            describe('auto save', function () {
                beforeEach(function () {
                    return require(['settings!io.ox/mail'], function (settings) {
                        settings.set('autoSaveDraftsAfter', '1_minute');
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
                    }).then(function () {
                        return app.compose({ folder_id: 'default0/INBOX' });
                    });
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
                    expect(mail.sendtype).to.equal('4');
                    spy.restore();
                });
            });
        });
    });
});
