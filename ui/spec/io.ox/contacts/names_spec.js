/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define(['io.ox/contacts/names'], function (names) {

    'use strict';

    describe('Contact names', function () {

        describe('Full names as plain text', function () {

            it('should use last and first name', function () {
                var data = { first_name: 'Georg', last_name: 'Tester', display_name: 'Dr. Tester, Georg' };
                expect(names.getFullName(data)).to.equal('Tester, Georg');
            });

            it('should use academic title, last name, and first name', function () {
                var data = { title: 'Dr.', first_name: 'Georg', last_name: 'Tester', display_name: 'Dr. Tester, Georg' };
                expect(names.getFullName(data)).to.equal('Dr. Tester, Georg');
            });

            it('should use last name', function () {
                var data = { first_name: ' ', last_name: 'Tester', display_name: 'Dr. Tester, Georg' };
                expect(names.getFullName(data)).to.equal('Tester');
            });

            it('should use first name', function () {
                var data = { first_name: 'Georg', last_name: ' ', display_name: 'Dr. Tester, Georg' };
                expect(names.getFullName(data)).to.equal('Georg');
            });

            it('should use company', function () {
                var data = { first_name: ' ', last_name: ' ', company: 'ACME', display_name: 'Dr. Tester, Georg' };
                expect(names.getFullName(data)).to.equal('ACME');
            });

            it('should use display name as fallback', function () {
                var data = { first_name: ' ', last_name: ' ', display_name: 'Dr. Tester, Georg' };
                expect(names.getFullName(data)).to.equal('Dr. Tester, Georg');
            });

            it('should use cn as fallback', function () {
                var data = { first_name: ' ', last_name: ' ', cn: 'Dr. Tester, Georg' };
                expect(names.getFullName(data)).to.equal('Dr. Tester, Georg');
            });

            it('should consider yomi fields', function () {
                var data = { yomiFirstName: 'GEORG', last_name: 'Tester', display_name: 'Dr. Tester, Georg' };
                expect(names.getFullName(data)).to.equal('Tester, GEORG');
            });

            it('eventually falls back to empty string', function () {
                expect(names.getFullName({})).to.equal('');
            });
        });

        describe('Full names as HTML', function () {

            it('should return the correct full name (last and first)', function () {
                var data = { first_name: 'Georg', last_name: 'Tester', display_name: 'Dr. Tester, Georg' };
                expect(names.getFullName(data, { html: true })).to.equal('<strong class="last_name">Tester</strong>, <span class="first_name">Georg</span>');
            });

            it('should return the correct full name (title, last, and first)', function () {
                var data = { title: 'Dr.', first_name: 'Georg', last_name: 'Tester', display_name: 'Dr. Tester, Georg' };
                expect(names.getFullName(data, { html: true })).to.equal('<span class="title">Dr.</span> <strong class="last_name">Tester</strong>, <span class="first_name">Georg</span>');
            });

            it('should return the correct full name (last only)', function () {
                var data = { first_name: ' ', last_name: 'Tester', display_name: 'Dr. Tester, Georg' };
                expect(names.getFullName(data, { html: true })).to.equal('<strong class="last_name">Tester</strong>');
            });

            it('should return the correct full name (first only)', function () {
                var data = { first_name: 'Georg', last_name: ' ', display_name: 'Dr. Tester, Georg' };
                expect(names.getFullName(data, { html: true })).to.equal('<span class="first_name">Georg</span>');
            });

            it('should return the correct full name (display name fallback)', function () {
                var data = { first_name: ' ', last_name: ' ', display_name: 'Dr. Tester, Georg' };
                expect(names.getFullName(data, { html: true })).to.equal('<span class="display_name">Dr. Tester, Georg</span>');
            });
        });

        describe('Full names for mail addresses', function () {

            it('should use last and first name', function () {
                var data = { first_name: 'Georg', last_name: 'Tester', display_name: 'Dr. Tester, Georg' };
                expect(names.getMailFullName(data)).to.equal('Georg Tester');
            });

            it('should skip academic title but use last and first name', function () {
                var data = { title: 'Dr.', first_name: 'Georg', last_name: 'Tester', display_name: 'Dr. Tester, Georg' };
                expect(names.getMailFullName(data)).to.equal('Georg Tester');
            });

            it('should use last name', function () {
                var data = { first_name: ' ', last_name: 'Tester', display_name: 'Dr. Tester, Georg' };
                expect(names.getMailFullName(data)).to.equal('Tester');
            });

            it('should use first name', function () {
                var data = { first_name: 'Georg', last_name: ' ', display_name: 'Dr. Tester, Georg' };
                expect(names.getMailFullName(data)).to.equal('Georg');
            });

            it('should skip the company, fallback to display name', function () {
                var data = { first_name: ' ', last_name: ' ', company: 'ACME', display_name: 'Dr. Tester, Georg' };
                expect(names.getMailFullName(data)).to.equal('Dr. Tester, Georg');
            });

            it('should use display name', function () {
                var data = { first_name: ' ', last_name: ' ', display_name: 'Dr. Tester, Georg' };
                expect(names.getMailFullName(data)).to.equal('Dr. Tester, Georg');
            });
        });

        describe('Full name format preference', function () {
            it('should consider user setting', function () {
                var data = { first_name: 'Georg', last_name: 'Tester', display_name: 'Dr. Tester, Georg' };
                names.setFormatSetting('firstname lastname');
                expect(names.getFullName(data)).to.equal('Georg Tester');
                expect(names.getFullName(data, { html: true })).to.equal('<span class="first_name">Georg</span> <strong class="last_name">Tester</strong>');
                expect(names.getMailFullName(data)).to.equal('Georg Tester');
                names.setFormatSetting('lastname, firstname');
                expect(names.getFullName(data)).to.equal('Tester, Georg');
                expect(names.getMailFullName(data)).to.equal('Georg Tester');
            });
        });
    });
});
