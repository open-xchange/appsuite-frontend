/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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
    'io.ox/core/extensions',
    'plugins/portal/mail/register'
], function (ext) {
    'use strict';

    describe('Portal plugins Stickymail', function () {
        const fakeMail = {
            id: '1337',
            folder: 'default0/INBOX',
            from: [['Thorsten Tester', 'test@example.com']],
            subject: 'Test subject <img src="x" onerror="alert(666);">',
            attachments: [{
                id: '1',
                disp: 'inline',
                content_type: 'text/plain',
                size: 46,
                content: '<img src="x" onerror="alert(1337);">test1337\r\n',
                truncated: false,
                sanitized: true
            }]
        };

        function invokeXSS(method) {
            const el = $('<div>'),
                baton = ext.Baton.ensure(fakeMail);
            ext.point('io.ox/portal/widget/stickymail').invoke(method, el, baton);
            return el;
        }

        describe('draw', function () {
            //this seems to really be hard to test (mail detail view)
            //due to getting the timing and all the models and requests right
        });

        describe('preview', function () {
            it('should not inject plain text as html', function () {
                const el = invokeXSS('preview');
                expect(el.find('img').length).to.equal(0);
                expect(el.text()).to.contain('<img src="x" onerror="alert(1337);">test1337');
            });
        });
    });
});
