/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */
define([
    'io.ox/core/extensions',
    'plugins/portal/mail/register'
], function (ext) {
    'use strict';

    describe('Portal plugins Stickymail', function () {
        var fakeMail = {
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
            var el = $('<div>'),
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
                var el = invokeXSS('preview');
                expect(el.find('img').length).to.equal(0);
                expect(el.text()).to.contain('<img src="x" onerror="alert(1337);">test1337');
            });
        });
    });
});
