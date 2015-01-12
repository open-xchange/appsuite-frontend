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
define(['io.ox/mail/compose/main'], function (compose) {
    'use strict';

    describe('Mail Compose', function () {

        describe('main app', function () {
            var app;
            beforeEach(function () {
                app = compose.getApp();
                return app.launch();
            });
            afterEach(function () {
                return app.quit();
            });

            it('should open up a new mail compose window', function () {
                return app.compose({ folder_id: 'default0/INBOX' }).done(function () {
                    expect(app.get('state')).to.equal('running');
                    expect(app.view.$el.is(':visible'), 'view element is visible').to.be.true;
                    expect(_.url.hash('app')).to.equal('io.ox/mail/compose:compose');
                });
            });

            it('should provide an edit window', function () {
                this.server.respondWith('PUT', /api\/mail\?action=edit/, function (xhr) {
                    xhr.respond(200, 'content-type:text/javascript;', JSON.stringify({
                        data: {}
                    }));
                });
                return app.edit({ folder_id: 'default0/INBOX' }).done(function () {
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
                return app.reply({ folder: 'default0/INBOX' }).done(function () {
                    expect(app.get('state')).to.equal('running');
                    expect(app.view.$el.is(':visible'), 'view element is visible').to.be.true;
                    expect(_.url.hash('app')).to.equal('io.ox/mail/compose:reply');
                });
            });
        });
    });
});
