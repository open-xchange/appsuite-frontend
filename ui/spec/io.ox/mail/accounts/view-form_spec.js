/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */
define(['io.ox/core/extensions',
        'gettext!io.ox/calendar',
        'fixture!io.ox/core/api/user.json'

        ], function (ext, gt, fixtureUser) {

    'use strict';

	describe('mailaccountsettings', function () {
        var $popup,
            $node = $('<div>');

        beforeEach(function () {

            this.server.respondWith('GET', /api\/user\?action=get/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(fixtureUser.current));
            });

            var def;
            def = require(['io.ox/mail/accounts/settings']).done(function (view) {
            });

            waitsFor(function () {
                return def.state() === 'resolved';
            }, 'loaded', ox.testTimeout);

            runs(function () {
                ext.point('io.ox/settings/accounts/mail/settings/detail').invoke('draw', $node, {data: { 'primary_address': '' }});

                $popup = $('body').find('.io-ox-dialog-popup');
            });

        });

        afterEach(function () {
            $('#mailaccountsettingsNode', document).remove();
            $popup.remove();
            $node.remove();
        });

        it('should draw the form', function () {
            $popup.find('.io-ox-account-settings').length.should.be.equal(1);
            $popup.find('input[name="name"]').length.should.be.equal(1);
            $popup.find('input[name="personal"]').length.should.be.equal(1);
            $popup.find('input[name="primary_address"]').length.should.be.equal(1);
            $popup.find('input[name="unified_inbox_enabled"]').length.should.be.equal(1);

            $popup.find('select[id="mail_protocol"]').length.should.be.equal(1);
            $popup.find('input[name="mail_secure"]').length.should.be.equal(1);
            $popup.find('input[name="mail_server"]').length.should.be.equal(1);
            $popup.find('input[name="mail_port"]').length.should.be.equal(1);
            $popup.find('input[name="login"]').length.should.be.equal(1);
            $popup.find('input[name="password"]').length.should.be.equal(1);

            $popup.find('input[name="transport_secure"]').length.should.be.equal(1);
            $popup.find('input[name="transport_server"]').length.should.be.equal(1);
            $popup.find('input[name="transport_port"]').length.should.be.equal(1);
            $popup.find('input[name="mail-common-selectfirst"]').length.should.be.equal(1);
            $popup.find('input[name="transport_login"]').length.should.be.equal(1);
            $popup.find('input[name="transport_password"]').length.should.be.equal(1);

            $popup.find('input[name="sent_fullname"]').length.should.be.equal(1);
            $popup.find('input[name="trash_fullname"]').length.should.be.equal(1);
            $popup.find('input[name="drafts_fullname"]').length.should.be.equal(1);
            $popup.find('input[name="spam_fullname"]').length.should.be.equal(1);

        });

    });

});
