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

        describe.skip('main app', function () {
            var app;
            beforeEach(function (done) {
                app = compose.getApp();
                app.launch().then(done);
            });
            afterEach(function (done) {
                app.quit().then(done);
            });

            it('should open up a new mail compose window', function (done) {
                app.compose({ folder_id: 'default0/INBOX' }).then(function () {
                    expect(app.get('state')).to.equal('running');
                    expect(app.view.$el.is(':visible'), 'view element is visible').to.be.true;
                    done();
                });
            });

            it('should update the url hash', function (done) {
                app.compose({ folder_id: 'default0/INBOX' }).then(function () {
                    expect(_.url.hash('app')).to.equal('io.ox/mail/compose:compose');
                    done();
                });
            });

            it('should provide an edit window', function (done) {
                app.edit({ folder_id: 'default0/INBOX' }).then(function () {
                    expect(app.get('state')).to.equal('running');
                    expect(app.view.$el.is(':visible'), 'view element is visible').to.be.true;
                    expect(_.url.hash('app')).to.equal('io.ox/mail/compose:compose');
                    done();
                });
            });

            xit('should provide a reply window', function (done) {
                this.server.respondWith('PUT', /api\/mail\?action=reply/, function (xhr) {
                    xhr.respond(200, 'content-type:text/javascript;', JSON.stringify({
                        data: {}
                    }));
                });
                app.reply({ folder: 'default0/INBOX' }).done(function () {
                    expect(app.get('state')).to.equal('running');
                    expect(_.url.hash('app')).to.equal('io.ox/mail/compose:reply');
                    expect(app.view.$el.is(':visible'), 'view element is visible').to.be.true;
                    done();
                });
            });
        });
    });
});
