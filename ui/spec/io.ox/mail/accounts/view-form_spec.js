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
define([
    'io.ox/core/extensions',
    'gettext!io.ox/calendar',
    'fixture!io.ox/core/api/user.json'
], function (ext, gt, fixtureUser) {
    'use strict';

    describe.skip('mailaccountsettings', function () {
        var $popup,
            $node = $('<div>');

        beforeEach(function (done) {

            this.server.respondWith('GET', /api\/user\?action=get/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(fixtureUser.current));
            });

            require(['io.ox/mail/accounts/settings']).then(function () {
                ext.point('io.ox/settings/accounts/mail/settings/detail').invoke('draw', $node, { data: { 'primary_address': '' }});

                $popup = $('body').find('.io-ox-dialog-popup');
                done();
            });

        });

        afterEach(function () {
            $('#mailaccountsettingsNode', document).remove();
            $popup.remove();
            $node.remove();
        });

        it('should draw the form', function () {
            expect($popup.find('.io-ox-account-settings'), 'account settings container').to.have.length(1);
            expect($popup.find('input[name="name"]'), 'name field').to.have.length(1);
            expect($popup.find('input[name="personal"]'), 'personal field').to.have.length(1);
            expect($popup.find('input[name="primary_address"]'), 'primary address field').to.have.length(1);
            expect($popup.find('input[name="unified_inbox_enabled"]'), 'unified inbox field').to.have.length(1);

            expect($popup.find('select[id="mail_protocol"]'), 'mail protocol field').to.have.length(1);
            expect($popup.find('input[name="mail_secure"]'), 'mail secure field').to.have.length(1);
            expect($popup.find('input[name="mail_server"]'), 'mail server field').to.have.length(1);
            expect($popup.find('input[name="mail_port"]'), 'mail port field').to.have.length(1);
            expect($popup.find('input[name="login"]'), 'login field').to.have.length(1);
            expect($popup.find('input[name="password"]'), 'password field').to.have.length(1);

            expect($popup.find('input[name="transport_secure"]'), 'transport secure field').to.have.length(1);
            expect($popup.find('input[name="transport_server"]'), 'transport server field').to.have.length(1);
            expect($popup.find('input[name="transport_port"]'), 'transport port field').to.have.length(1);
            // $popup.find('input[name="mail-common-selectfirst"]').length.should.be.equal(1);
            expect($popup.find('input[name="transport_login"]'), 'transport login field').to.have.length(1);
            expect($popup.find('input[name="transport_password"]'), 'transport password field').to.have.length(1);

            //folder stuff has been removed/changed
            // expect($popup.find('input[name="sent_fullname"]'), 'sent folder field').to.have.length(1);
            // expect($popup.find('input[name="trash_fullname"]'), 'trash folder field').to.have.length(1);
            // expect($popup.find('input[name="drafts_fullname"]'), 'drafts folder field').to.have.length(1);
            // expect($popup.find('input[name="spam_fullname"]'), 'spam folder field').to.have.length(1);
        });

    });

});
